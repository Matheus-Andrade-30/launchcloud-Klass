import { TelemetriaScreenshot } from './TelemetriaScreenshot';

export interface ITelemetriaScreenshotRepository {
  create(telemetria: TelemetriaScreenshot): Promise<void>;
  countByProvaIdAndAlunoId(provaId: string, alunoId: string): Promise<number>;
}
