import { randomUUID } from 'crypto';
import { RespostaVersao } from '../../domain/RespostaVersao';
import { IRespostaVersaoRepository } from '../../domain/IRespostaVersaoRepository';
import { IProvaRepository } from '../../domain/IProvaRepository';
import { IUserRepository } from '../../domain/IUserRepository';
import { S3Service } from '../../infrastructure/services/S3Service';
import { SNSService } from '../../infrastructure/services/SNSService';

interface SaveRespostaInput {
  alunoId: string;
  provaId: string;
  questaoId: string;
  timestamp: number;
  horario: string;
  conteudo: string;
  // Sinaliza colagem (evento onPaste) e quantos caracteres foram colados.
  colado?: boolean;
  charsColados?: number;
}

const CHARS_POR_SEGUNDO_SUSPEITO = 50;
const COLA_MIN_CHARS = 100;

export class SaveRespostaVersaoUseCase {
  constructor(
    private respostaRepository: IRespostaVersaoRepository,
    private s3Service: S3Service,
    // Opcionais: sem eles a cola ainda e flagada no relatorio, so nao manda e-mail.
    private snsService?: SNSService,
    private provaRepository?: IProvaRepository,
    private userRepository?: IUserRepository,
  ) {}

  async execute(input: SaveRespostaInput): Promise<{ versaoNum: number; suspeito: boolean }> {
    const ultima = await this.respostaRepository.findLastVersao(
      input.alunoId,
      input.provaId,
      input.questaoId,
    );

    const versaoNum = (ultima?.versaoNum ?? 0) + 1;
    const charCount = input.conteudo.length;
    const lineCount = input.conteudo.split('\n').length;
    const deltaChars = charCount - (ultima?.charCount ?? 0);

    const deltaTempoSegundos = ultima
      ? Math.max(1, (input.timestamp - ultima.timestamp) / 1000)
      : 1;

    const velocidade = Math.abs(deltaChars) / deltaTempoSegundos;

    // Suspeito por colagem grande (onPaste) ou por insercao rapida demais entre versoes.
    const colagemGrande = input.colado === true && (input.charsColados ?? 0) >= COLA_MIN_CHARS;
    const velocidadeSuspeita = velocidade > CHARS_POR_SEGUNDO_SUSPEITO && deltaChars > 100;
    const suspeito = colagemGrande || velocidadeSuspeita;

    const s3Key = `respostas/${input.provaId}/${input.alunoId}/${input.questaoId}/${input.timestamp}.json`;

    await this.s3Service.uploadFile(
      s3Key,
      Buffer.from(
        JSON.stringify({ conteudo: input.conteudo, versaoNum, timestamp: input.timestamp }),
      ),
      'application/json',
    );

    const versao = new RespostaVersao(
      randomUUID(),
      input.alunoId,
      input.provaId,
      input.questaoId,
      versaoNum,
      s3Key,
      charCount,
      lineCount,
      deltaChars,
      suspeito,
      input.timestamp,
      new Date(input.horario),
    );

    await this.respostaRepository.create(versao);

    if (suspeito) {
      await this.alertarColagem(input, { deltaChars, velocidade, colagemGrande });
    }

    return { versaoNum, suspeito };
  }

  // Alerta de colagem por e-mail (SNS): resolve prova/professor e publica. Best-effort.
  private async alertarColagem(
    input: SaveRespostaInput,
    metrica: { deltaChars: number; velocidade: number; colagemGrande: boolean },
  ): Promise<void> {
    if (!this.snsService?.enabled) return;
    try {
      const prova = this.provaRepository
        ? await this.provaRepository.findById(input.provaId)
        : null;
      const professor =
        prova && this.userRepository ? await this.userRepository.findById(prova.professorId) : null;
      const aluno = this.userRepository ? await this.userRepository.findById(input.alunoId) : null;

      if (professor?.email) {
        await this.snsService.subscribeEmail(professor.email);
      }

      const horario = new Date(input.horario).toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
      });
      const evidencia = metrica.colagemGrande
        ? `Colagem direta de ${input.charsColados ?? metrica.deltaChars} caracteres (evento de paste)`
        : `Salto de ${metrica.deltaChars} caracteres (velocidade ~${Math.round(
            metrica.velocidade,
          )} chars/s)`;
      const mensagem = [
        'Possivel COLAGEM de texto detectada durante a prova.',
        '',
        `Prova: ${prova?.titulo ?? input.provaId} (id: ${input.provaId})`,
        `Professor responsavel: ${professor?.name ?? 'N/D'} <${professor?.email ?? 'N/D'}>`,
        `Aluno: ${aluno?.name ?? input.alunoId} (id: ${input.alunoId})`,
        `Questao: ${input.questaoId}`,
        `Evidencia: ${evidencia}`,
        `Horario: ${horario}`,
      ].join('\n');

      await this.snsService.publish('Klass: possivel colagem detectada', mensagem, {
        tipo: 'cola_detectada',
        professorId: prova?.professorId ? String(prova.professorId) : 'desconhecido',
      });
    } catch (err) {
      console.error('[SaveRespostaVersaoUseCase] falha ao alertar colagem (ignorado):', err);
    }
  }
}
