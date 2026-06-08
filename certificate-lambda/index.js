'use strict';

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
  const {
    certificateId,
    studentName,
    className,
    classDescription,
    grade,
    enrollmentId,
    s3Key,
    s3Bucket,
  } = event;

  const issuedAt = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = buildCertificateHtml({
    studentName,
    className,
    classDescription,
    grade,
    issuedAt,
    certificateId,
  });

  await s3.send(
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: s3Key,
      Body: Buffer.from(html, 'utf-8'),
      ContentType: 'text/html; charset=utf-8',
    }),
  );

  return { statusCode: 200, certificateId, enrollmentId, s3Key };
};

function buildCertificateHtml({
  studentName,
  className,
  classDescription,
  grade,
  issuedAt,
  certificateId,
}) {
  const hasGrade = grade !== null && grade !== undefined && !Number.isNaN(Number(grade));
  const gradeHtml = hasGrade
    ? `<div class="grade">Aproveitamento final: <strong>${Number(grade).toFixed(1)}</strong></div>`
    : '';
  const descHtml = classDescription
    ? `<div class="course-desc">${escapeHtml(classDescription)}</div>`
    : '';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado de Conclusão — Klass</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }
    .certificate {
      background: #fffef9;
      width: 100%;
      max-width: 860px;
      padding: 70px 80px;
      border: 2px solid #c8a951;
      box-shadow: 0 0 0 10px rgba(200, 169, 81, 0.15), 0 30px 80px rgba(0,0,0,0.4);
      text-align: center;
      position: relative;
    }
    .corner {
      position: absolute;
      width: 60px;
      height: 60px;
      border-color: #c8a951;
      border-style: solid;
    }
    .corner.tl { top: 16px; left: 16px; border-width: 3px 0 0 3px; }
    .corner.tr { top: 16px; right: 16px; border-width: 3px 3px 0 0; }
    .corner.bl { bottom: 16px; left: 16px; border-width: 0 0 3px 3px; }
    .corner.br { bottom: 16px; right: 16px; border-width: 0 3px 3px 0; }
    .logo {
      font-size: 13px;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #c8a951;
      margin-bottom: 8px;
    }
    .divider {
      width: 80px;
      height: 2px;
      background: #c8a951;
      margin: 16px auto;
    }
    h1 {
      font-size: 42px;
      color: #1a365d;
      letter-spacing: 3px;
      text-transform: uppercase;
      font-weight: normal;
      margin: 8px 0;
    }
    .subtitle {
      font-size: 13px;
      letter-spacing: 3px;
      color: #718096;
      text-transform: uppercase;
      margin-bottom: 36px;
    }
    .certifies {
      font-size: 16px;
      color: #4a5568;
      margin-bottom: 6px;
    }
    .student-name {
      font-size: 38px;
      color: #1a365d;
      font-style: italic;
      margin: 10px 0 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    .completed {
      font-size: 15px;
      color: #4a5568;
      margin-bottom: 6px;
    }
    .course-name {
      font-size: 26px;
      color: #2c5282;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .course-desc {
      font-size: 14px;
      color: #718096;
      font-style: italic;
      max-width: 600px;
      margin: 0 auto 18px;
      line-height: 1.5;
    }
    .grade {
      display: inline-block;
      font-size: 15px;
      color: #1a365d;
      background: rgba(200, 169, 81, 0.12);
      border: 1px solid #c8a951;
      border-radius: 999px;
      padding: 6px 18px;
      margin-bottom: 30px;
    }
    .grade strong { color: #2c5282; }
    .date {
      font-size: 14px;
      color: #718096;
      margin-bottom: 50px;
    }
    .signatures {
      display: flex;
      justify-content: space-around;
      margin-top: 10px;
    }
    .sig-block { text-align: center; }
    .sig-line {
      width: 180px;
      border-top: 1px solid #2c5282;
      margin: 0 auto 10px;
    }
    .sig-label { font-size: 12px; color: #4a5568; letter-spacing: 1px; }
    .certificate-id {
      font-size: 9px;
      color: #cbd5e0;
      margin-top: 30px;
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>

    <div class="logo">Klass</div>
    <div class="divider"></div>

    <h1>Certificado</h1>
    <div class="subtitle">de Conclusão</div>

    <div class="certifies">Certificamos que</div>
    <div class="student-name">${escapeHtml(studentName)}</div>

    <div class="completed">concluiu com êxito a disciplina</div>
    <div class="course-name">${escapeHtml(className)}</div>
    ${descHtml}
    ${gradeHtml}

    <div class="date">Emitido em ${issuedAt} pela Plataforma Klass</div>

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Plataforma Klass</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-label">Direção Acadêmica</div>
      </div>
    </div>

    <div class="certificate-id">Certificado ID: ${certificateId}</div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
