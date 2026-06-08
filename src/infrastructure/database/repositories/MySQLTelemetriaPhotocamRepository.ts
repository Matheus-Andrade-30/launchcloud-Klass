import { pool } from '../connection';
import {
  AnaliseFacial,
  ITelemetriaPhotocamRepository,
} from '../../../domain/ITelemetriaPhotocamRepository';
import { TelemetriaPhotocam } from '../../../domain/TelemetriaPhotocam';

// Normaliza a coluna JSON `flags` (mysql2 pode devolver array ou string) para string[].
function parseFlags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string' && raw.trim() !== '') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export class MySQLTelemetriaPhotocamRepository implements ITelemetriaPhotocamRepository {
  async findComFlagsByProvaId(provaId: string): Promise<TelemetriaPhotocam[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM telemetria_photocam WHERE prova_id = ? AND JSON_LENGTH(flags) > 0 ORDER BY horario ASC',
      [provaId],
    );
    return (rows as any[]).map(
      (r) =>
        new TelemetriaPhotocam(
          r.id,
          r.aluno_id,
          r.prova_id,
          r.questao_id,
          r.s3_key,
          r.faces_detectadas,
          r.similarity_score,
          parseFlags(r.flags),
          Number(r.timestamp),
          r.horario,
        ),
    );
  }

  async create(t: TelemetriaPhotocam): Promise<void> {
    await pool.execute(
      'INSERT INTO telemetria_photocam (id, aluno_id, prova_id, questao_id, s3_key, faces_detectadas, similarity_score, flags, timestamp, horario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        t.id,
        t.alunoId,
        t.provaId,
        t.questaoId,
        t.s3Key,
        t.facesDetectadas,
        t.similarityScore,
        JSON.stringify(t.flags),
        t.timestamp,
        t.horario,
      ],
    );
  }

  async updateAnalise(s3Key: string, analise: AnaliseFacial): Promise<void> {
    await pool.execute(
      'UPDATE telemetria_photocam SET faces_detectadas = ?, similarity_score = ?, flags = ? WHERE s3_key = ?',
      [analise.facesDetectadas, analise.similarityScore, JSON.stringify(analise.flags), s3Key],
    );
  }
}
