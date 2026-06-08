import { pool } from '../connection';
import { IQuestaoRepository } from '../../../domain/IQuestaoRepository';
import { Questao } from '../../../domain/Questao';

// Coluna JSON: mysql2 ja retorna array; mas tratamos string por seguranca.
export function parseOpcoes(value: unknown): string[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

export class MySQLQuestaoRepository implements IQuestaoRepository {
  async findById(id: string): Promise<Questao | null> {
    const [rows] = await pool.execute('SELECT * FROM questoes WHERE id = ?', [id]);
    const r = (rows as any[])[0];
    if (!r) return null;
    return new Questao(
      r.id,
      r.prova_id,
      r.enunciado,
      r.tipo,
      Number(r.pontuacao),
      r.ordem,
      r.created_at,
      parseOpcoes(r.opcoes),
    );
  }

  async findByProvaId(provaId: string): Promise<Questao[]> {
    const [rows] = await pool.execute('SELECT * FROM questoes WHERE prova_id = ? ORDER BY ordem', [
      provaId,
    ]);
    return (rows as any[]).map(
      (r) =>
        new Questao(
          r.id,
          r.prova_id,
          r.enunciado,
          r.tipo,
          Number(r.pontuacao),
          r.ordem,
          r.created_at,
          parseOpcoes(r.opcoes),
        ),
    );
  }

  async create(questao: Questao): Promise<void> {
    await pool.execute(
      'INSERT INTO questoes (id, prova_id, enunciado, tipo, pontuacao, ordem, created_at, opcoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        questao.id,
        questao.provaId,
        questao.enunciado,
        questao.tipo,
        questao.pontuacao,
        questao.ordem,
        questao.createdAt,
        questao.opcoes ? JSON.stringify(questao.opcoes) : null,
      ],
    );
  }

  async update(
    id: string,
    data: Partial<Pick<Questao, 'enunciado' | 'pontuacao' | 'ordem'>>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: (string | number)[] = [];
    if (data.enunciado !== undefined) {
      fields.push('enunciado = ?');
      values.push(data.enunciado);
    }
    if (data.pontuacao !== undefined) {
      fields.push('pontuacao = ?');
      values.push(data.pontuacao);
    }
    if (data.ordem !== undefined) {
      fields.push('ordem = ?');
      values.push(data.ordem);
    }
    if (!fields.length) return;
    values.push(id);
    await pool.execute(`UPDATE questoes SET ${fields.join(', ')} WHERE id = ?`, values);
  }
}
