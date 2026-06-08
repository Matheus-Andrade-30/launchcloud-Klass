import { TelemetriaPhotocam } from './TelemetriaPhotocam';

export interface AnaliseFacial {
  facesDetectadas: number;
  similarityScore: number | null;
  flags: string[];
}

export interface ITelemetriaPhotocamRepository {
  create(telemetria: TelemetriaPhotocam): Promise<void>;
  findComFlagsByProvaId(provaId: string): Promise<TelemetriaPhotocam[]>;
  updateAnalise(s3Key: string, analise: AnaliseFacial): Promise<void>;
}
