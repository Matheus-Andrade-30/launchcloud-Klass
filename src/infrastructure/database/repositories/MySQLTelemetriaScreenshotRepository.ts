import { pool } from '../connection';
import { ITelemetriaScreenshotRepository } from '../../../domain/ITelemetriaScreenshotRepository';
import { TelemetriaScreenshot } from '../../../domain/TelemetriaScreenshot';

export class MySQLTelemetriaScreenshotRepository implements ITelemetriaScreenshotRepository {
  async countByProvaIdAndAlunoId(provaId: string, alunoId: string): Promise<number> {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as total FROM telemetria_screenshot WHERE prova_id = ? AND aluno_id = ?',
      [provaId, alunoId],
    );
    return Number((rows as any[])[0]?.total ?? 0);
  }

  async create(t: TelemetriaScreenshot): Promise<void> {
    await pool.execute(
      'INSERT INTO telemetria_screenshot (id, aluno_id, prova_id, questao_id, s3_key, timestamp, horario) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [t.id, t.alunoId, t.provaId, t.questaoId, t.s3Key, t.timestamp, t.horario],
    );
  }
}
