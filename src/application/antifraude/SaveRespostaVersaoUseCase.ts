import { randomUUID } from 'crypto';
import { RespostaVersao } from '../../domain/RespostaVersao';
import { IRespostaVersaoRepository } from '../../domain/IRespostaVersaoRepository';
import { S3Service } from '../../infrastructure/services/S3Service';

interface SaveRespostaInput {
  alunoId: string;
  provaId: string;
  questaoId: string;
  timestamp: number;
  horario: string;
  conteudo: string;
}

const CHARS_POR_SEGUNDO_SUSPEITO = 50;

export class SaveRespostaVersaoUseCase {
  constructor(
    private respostaRepository: IRespostaVersaoRepository,
    private s3Service: S3Service,
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
    const suspeito = velocidade > CHARS_POR_SEGUNDO_SUSPEITO && deltaChars > 100;

    const s3Key = `respostas/${input.provaId}/${input.alunoId}/${input.questaoId}/${input.timestamp}.json`;

    await this.s3Service.uploadFile(
      s3Key,
      Buffer.from(JSON.stringify({ conteudo: input.conteudo, versaoNum, timestamp: input.timestamp })),
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
    return { versaoNum, suspeito };
  }
}
