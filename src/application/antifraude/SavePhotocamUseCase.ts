import { randomUUID } from 'crypto';
import { TelemetriaPhotocam } from '../../domain/TelemetriaPhotocam';
import { ITelemetriaPhotocamRepository } from '../../domain/ITelemetriaPhotocamRepository';
import { S3Service } from '../../infrastructure/services/S3Service';
import { RekognitionService } from '../../infrastructure/services/RekognitionService';

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
    private rekognitionService: RekognitionService,
  ) {}

  async execute(input: SavePhotocamInput): Promise<{ registrado: boolean; flags: string[] }> {
    const buffer = Buffer.from(input.imagemBase64, 'base64');
    const s3Key = `telemetria/photocam/${input.provaId}/${input.alunoId}/${input.timestamp}.jpg`;

    await this.s3Service.uploadFile(s3Key, buffer, 'image/jpeg');

    const referenciaKey = `perfil/${input.alunoId}/foto.jpg`;
    const { facesDetectadas, similarityScore, flags } =
      await this.rekognitionService.analyzeFace(s3Key, referenciaKey);

    const telemetria = new TelemetriaPhotocam(
      randomUUID(),
      input.alunoId,
      input.provaId,
      input.questaoId,
      s3Key,
      facesDetectadas,
      similarityScore,
      flags,
      input.timestamp,
      new Date(input.horario),
    );

    await this.photocamRepository.create(telemetria);
    return { registrado: true, flags };
  }
}
