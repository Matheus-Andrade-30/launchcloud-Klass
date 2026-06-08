'use strict';

const {
  RekognitionClient,
  DetectFacesCommand,
  CompareFacesCommand,
} = require('@aws-sdk/client-rekognition');
const {
  SNSClient,
  SubscribeCommand,
  SetSubscriptionAttributesCommand,
  PublishCommand,
} = require('@aws-sdk/client-sns');
const mysql = require('mysql2/promise');

const REGION = process.env.AWS_REGION || 'us-east-1';
const FRAUD_THRESHOLD = Number(process.env.FRAUD_THRESHOLD || 1);
const SIMILARITY_MIN = 80;

const FRAUD_FLAGS = ['sem_rosto', 'multiplos_rostos', 'identidade_suspeita'];

const rekognition = new RekognitionClient({ region: REGION });
const sns = new SNSClient({ region: REGION });

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 2,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

exports.handler = async (event) => {
  const records = (event && event.Records) || [];
  console.log(`[fraud-lambda] recebidos ${records.length} record(s) S3`);

  for (const record of records) {
    try {
      await processRecord(record);
    } catch (err) {
      console.error('[fraud-lambda] erro ao processar record:', err);
    }
  }

  return { statusCode: 200, processed: records.length };
};

async function processRecord(record) {
  const bucket = record.s3 && record.s3.bucket && record.s3.bucket.name;
  const rawKey = record.s3 && record.s3.object && record.s3.object.key;

  if (!bucket || !rawKey) {
    console.warn('[fraud-lambda] record sem bucket/key, ignorando');
    return;
  }

  const key = decodeURIComponent(rawKey.replace(/\+/g, ' '));

  if (!key.startsWith('telemetria/photocam/')) {
    console.log(`[fraud-lambda] key fora do escopo, ignorando: ${key}`);
    return;
  }

  const parts = key.split('/');
  if (parts.length < 6) {
    console.warn(`[fraud-lambda] key com formato inesperado: ${key}`);
    return;
  }
  const provaId = parts[2];
  const alunoId = parts[3];
  const questaoId = parts[4];

  console.log(
    `[fraud-lambda] processando provaId=${provaId} alunoId=${alunoId} questaoId=${questaoId} key=${key}`,
  );

  const { facesDetectadas, similarityScore, flags } = await analyzeFace(bucket, key, alunoId);

  console.log(
    `[fraud-lambda] analise: faces=${facesDetectadas} similarity=${similarityScore} flags=${JSON.stringify(
      flags,
    )}`,
  );

  const db = getPool();

  await db.execute(
    'UPDATE telemetria_photocam SET faces_detectadas = ?, similarity_score = ?, flags = CAST(? AS JSON) WHERE s3_key = ?',
    [facesDetectadas, similarityScore, JSON.stringify(flags), key],
  );

  const score = flags.filter((f) => FRAUD_FLAGS.includes(f)).length;
  if (score < FRAUD_THRESHOLD) {
    console.log(`[fraud-lambda] score=${score} abaixo do threshold=${FRAUD_THRESHOLD}, sem alerta`);
    return;
  }

  const contexto = await loadContexto(db, provaId, alunoId);
  await alertProfessor({
    contexto,
    provaId,
    alunoId,
    flags,
    similarityScore,
    s3Key: key,
  });
}

async function analyzeFace(bucket, imageKey, alunoId) {
  const flags = [];

  const detectResult = await rekognition.send(
    new DetectFacesCommand({
      Image: { S3Object: { Bucket: bucket, Name: imageKey } },
      Attributes: ['DEFAULT'],
    }),
  );

  const facesDetectadas = (detectResult.FaceDetails && detectResult.FaceDetails.length) || 0;

  if (facesDetectadas === 0) flags.push('sem_rosto');
  if (facesDetectadas > 1) flags.push('multiplos_rostos');

  let similarityScore = null;

  if (facesDetectadas === 1) {
    const referenceKey = `perfil/${alunoId}/foto.jpg`;
    try {
      const compareResult = await rekognition.send(
        new CompareFacesCommand({
          SourceImage: { S3Object: { Bucket: bucket, Name: referenceKey } },
          TargetImage: { S3Object: { Bucket: bucket, Name: imageKey } },
          SimilarityThreshold: 0,
        }),
      );

      const match = compareResult.FaceMatches && compareResult.FaceMatches[0];
      similarityScore = (match && match.Similarity) || 0;

      if (similarityScore < SIMILARITY_MIN) flags.push('identidade_suspeita');
    } catch (err) {
      console.error('[fraud-lambda] falha na comparacao de faces:', err);
      flags.push('comparacao_falhou');
    }
  }

  return { facesDetectadas, similarityScore, flags };
}

async function loadContexto(db, provaId, alunoId) {
  const contexto = {
    provaTitulo: null,
    professorId: null,
    professorNome: null,
    professorEmail: null,
    alunoNome: null,
  };

  const [provaRows] = await db.execute('SELECT titulo, professor_id FROM provas WHERE id = ?', [
    provaId,
  ]);
  if (provaRows && provaRows[0]) {
    contexto.provaTitulo = provaRows[0].titulo;
    contexto.professorId = provaRows[0].professor_id;
  }

  if (contexto.professorId != null) {
    const [profRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [
      contexto.professorId,
    ]);
    if (profRows && profRows[0]) {
      contexto.professorNome = profRows[0].name;
      contexto.professorEmail = profRows[0].email;
    }
  }

  const [alunoRows] = await db.execute('SELECT name FROM users WHERE id = ?', [alunoId]);
  if (alunoRows && alunoRows[0]) {
    contexto.alunoNome = alunoRows[0].name;
  }

  return contexto;
}

async function alertProfessor({ contexto, provaId, alunoId, flags, similarityScore, s3Key }) {
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (!topicArn) {
    console.error('[fraud-lambda] SNS_TOPIC_ARN nao configurado, pulando alerta');
    return;
  }

  const professorId = contexto.professorId != null ? String(contexto.professorId) : '';
  const professorEmail = contexto.professorEmail || '';

  if (professorEmail) {
    try {
      const subscribeResult = await sns.send(
        new SubscribeCommand({
          TopicArn: topicArn,
          Protocol: 'email',
          Endpoint: professorEmail,
          ReturnSubscriptionArn: true,
        }),
      );

      const subscriptionArn = subscribeResult.SubscriptionArn;
      if (subscriptionArn && subscriptionArn !== 'pending confirmation' && professorId) {
        try {
          await sns.send(
            new SetSubscriptionAttributesCommand({
              SubscriptionArn: subscriptionArn,
              AttributeName: 'FilterPolicy',
              AttributeValue: JSON.stringify({ professorId: [professorId] }),
            }),
          );
        } catch (err) {
          console.warn('[fraud-lambda] nao foi possivel setar FilterPolicy:', err.message);
        }
      }
    } catch (err) {
      console.warn('[fraud-lambda] subscribe best-effort falhou (ignorado):', err.message);
    }
  } else {
    console.warn('[fraud-lambda] professor sem email; alerta sera publicado sem subscribe');
  }

  const horario = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  const similarityTxt = similarityScore != null ? `${similarityScore.toFixed(2)}%` : 'N/D';

  const message = [
    'Possivel fraude detectada durante a prova.',
    '',
    `Prova: ${contexto.provaTitulo || provaId} (id: ${provaId})`,
    `Professor responsavel: ${contexto.professorNome || 'N/D'} <${professorEmail || 'N/D'}>`,
    `Aluno: ${contexto.alunoNome || alunoId} (id: ${alunoId})`,
    `Flags: ${flags.join(', ') || 'nenhuma'}`,
    `Similaridade facial: ${similarityTxt}`,
    `Imagem (S3): ${s3Key}`,
    `Horario do alerta: ${horario}`,
  ].join('\n');

  await sns.send(
    new PublishCommand({
      TopicArn: topicArn,
      Subject: 'Klass: possivel fraude detectada',
      Message: message,
      MessageAttributes: {
        professorId: { DataType: 'String', StringValue: professorId || 'desconhecido' },
        professorEmail: {
          DataType: 'String',
          StringValue: professorEmail || 'desconhecido',
        },
      },
    }),
  );

  console.log(
    `[fraud-lambda] alerta SNS publicado para professorId=${professorId} email=${professorEmail}`,
  );
}
