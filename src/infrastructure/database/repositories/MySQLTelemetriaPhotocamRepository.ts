import { pool } from '../connection';
import { ITelemetriaPhotocamRepository } from '../../../domain/ITelemetriaPhotocamRepository';
import { TelemetriaPhotocam } from '../../../domain/TelemetriaPhotocam';

export class MySQLTelemetriaPhotocamRepository implements ITelemetriaPhotocamRepository {
  async findComFlagsByProvaId(provaId: string): Promise<TelemetriaPhotocam[]> {
    const [rows] = await pool.execute(
      "SELECT * FROM telemetria_photocam WHERE prova_id = ? AND JSON_LENGTH(flags) > 0 ORDER BY horario ASC",
      [provaId],
    );
    return (rows as any[]).map(
      (r) => new TelemetriaPhotocam(r.id, r.aluno_id, r.prova_id, r.questao_id, r.s3_key, r.faces_detectadas, r.similarity_score, JSON.parse(r.flags || '[]'), Number(r.timestamp), r.horario),
    );
  }

  async create(t: TelemetriaPhotocam): Promise<void> {
    await pool.execute(
      'INSERT INTO telemetria_photocam (id, aluno_id, prova_id, questao_id, s3_key, faces_detectadas, similarity_score, flags, timestamp, horario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [t.id, t.alunoId, t.provaId, t.questaoId, t.s3Key, t.facesDetectadas, t.similarityScore, JSON.stringify(t.flags), t.timestamp, t.horario],
    );
  }
}
