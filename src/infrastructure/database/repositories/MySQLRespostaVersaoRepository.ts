import { pool } from '../connection';
import { IRespostaVersaoRepository } from '../../../domain/IRespostaVersaoRepository';
import { RespostaVersao } from '../../../domain/RespostaVersao';

export class MySQLRespostaVersaoRepository implements IRespostaVersaoRepository {
  async findLastVersao(
    alunoId: string,
    provaId: string,
    questaoId: string,
  ): Promise<RespostaVersao | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM respostas_versoes WHERE aluno_id = ? AND prova_id = ? AND questao_id = ? ORDER BY versao_num DESC LIMIT 1',
      [alunoId, provaId, questaoId],
    );
    const r = (rows as any[])[0];
    if (!r) return null;
    return new RespostaVersao(
      r.id,
      r.aluno_id,
      r.prova_id,
      r.questao_id,
      r.versao_num,
      r.s3_key,
      r.char_count,
      r.line_count,
      r.delta_chars,
      Boolean(r.suspeito),
      Number(r.timestamp),
      r.horario,
    );
  }

  async findSuspeitosByProvaId(provaId: string): Promise<RespostaVersao[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM respostas_versoes WHERE prova_id = ? AND suspeito = TRUE ORDER BY horario ASC',
      [provaId],
    );
    return (rows as any[]).map(
      (r) =>
        new RespostaVersao(
          r.id,
          r.aluno_id,
          r.prova_id,
          r.questao_id,
          r.versao_num,
          r.s3_key,
          r.char_count,
          r.line_count,
          r.delta_chars,
          Boolean(r.suspeito),
          Number(r.timestamp),
          r.horario,
        ),
    );
  }

  async create(versao: RespostaVersao): Promise<void> {
    await pool.execute(
      'INSERT INTO respostas_versoes (id, aluno_id, prova_id, questao_id, versao_num, s3_key, char_count, line_count, delta_chars, suspeito, timestamp, horario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        versao.id,
        versao.alunoId,
        versao.provaId,
        versao.questaoId,
        versao.versaoNum,
        versao.s3Key,
        versao.charCount,
        versao.lineCount,
        versao.deltaChars,
        versao.suspeito,
        versao.timestamp,
        versao.horario,
      ],
    );
  }
}
