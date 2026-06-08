import { randomUUID } from 'crypto';
import { TelemetriaPhotocam } from '../../domain/TelemetriaPhotocam';
import { ITelemetriaPhotocamRepository } from '../../domain/ITelemetriaPhotocamRepository';
import { S3Service } from '../../infrastructure/services/S3Service';

interface SavePhotocamInput {
  alunoId: string;
  provaId: string;
  questaoId: string;
  timestamp: number;
  horario: string;
  imagemBase64: string;
}

export class SavePhotocamUseCase {
  constructor(
    private photocamRepository: ITelemetriaPhotocamRepository,
    private s3Service: S3Service,
  ) {}

  async execute(input: SavePhotocamInput): Promise<{ registrado: boolean; flags: string[] }> {
    const buffer = Buffer.from(input.imagemBase64, 'base64');
    const s3Key = `telemetria/photocam/${input.provaId}/${input.alunoId}/${input.questaoId}/${input.timestamp}.jpg`;

    await this.s3Service.uploadFile(s3Key, buffer, 'image/jpeg');

    // A analise facial (Rekognition) e feita de forma assincrona pela Lambda de evento.
    // Aqui apenas persistimos a captura com valores neutros.
    const flags: string[] = [];
    const telemetria = new TelemetriaPhotocam(
      randomUUID(),
      input.alunoId,
      input.provaId,
      input.questaoId,
      s3Key,
      0,
      null,
      flags,
      input.timestamp,
      new Date(input.horario),
    );

    await this.photocamRepository.create(telemetria);
    return { registrado: true, flags };
  }
}
