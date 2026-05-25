import { randomUUID } from 'crypto';
import { TelemetriaScreenshot } from '../../domain/TelemetriaScreenshot';
import { ITelemetriaScreenshotRepository } from '../../domain/ITelemetriaScreenshotRepository';
import { S3Service } from '../../infrastructure/services/S3Service';

interface SaveScreenshotInput {
  alunoId: string;
  provaId: string;
  questaoId: string;
  timestamp: number;
  horario: string;
  screenshotBase64: string;
}

export class SaveScreenshotUseCase {
  constructor(
    private screenshotRepository: ITelemetriaScreenshotRepository,
    private s3Service: S3Service,
  ) {}

  async execute(input: SaveScreenshotInput): Promise<{ registrado: boolean }> {
    const buffer = Buffer.from(input.screenshotBase64, 'base64');
    const s3Key = `telemetria/screenshot/${input.provaId}/${input.alunoId}/${input.questaoId}/${input.timestamp}.png`;

    await this.s3Service.uploadFile(s3Key, buffer, 'image/png');

    const telemetria = new TelemetriaScreenshot(
      randomUUID(),
      input.alunoId,
      input.provaId,
      input.questaoId,
      s3Key,
      input.timestamp,
      new Date(input.horario),
    );

    await this.screenshotRepository.create(telemetria);
    return { registrado: true };
  }
}
