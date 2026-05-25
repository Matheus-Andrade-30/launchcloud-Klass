import { TelemetriaPhotocam } from './TelemetriaPhotocam';

export interface ITelemetriaPhotocamRepository {
  create(telemetria: TelemetriaPhotocam): Promise<void>;
  findComFlagsByProvaId(provaId: string): Promise<TelemetriaPhotocam[]>;
}
