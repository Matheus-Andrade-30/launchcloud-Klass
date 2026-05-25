import { pool } from '../connection';
import { IProvaRepository } from '../../../domain/IProvaRepository';
import { Prova } from '../../../domain/Prova';
import { Questao } from '../../../domain/Questao';

export class MySQLProvaRepository implements IProvaRepository {
  async findById(id: string): Promise<Prova | null> {
    const [rows] = await pool.execute('SELECT * FROM provas WHERE id = ?', [id]);
    const row = (rows as any[])[0];
    if (!row) return null;
    return new Prova(row.id, row.titulo, row.professor_id, row.data_inicio, row.data_fim, row.duracao_minutos, row.created_at);
  }

  async findWithQuestoes(id: string): Promise<{ prova: Prova; questoes: Questao[] } | null> {
    const prova = await this.findById(id);
    if (!prova) return null;

    const [rows] = await pool.execute(
      'SELECT * FROM questoes WHERE prova_id = ? ORDER BY ordem ASC',
      [id],
    );
    const questoes = (rows as any[]).map(
      (r) => new Questao(r.id, r.prova_id, r.enunciado, r.tipo, Number(r.pontuacao), r.ordem, r.created_at),
    );
    return { prova, questoes };
  }

  async create(prova: Prova): Promise<void> {
    await pool.execute(
      'INSERT INTO provas (id, titulo, professor_id, data_inicio, data_fim, duracao_minutos, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [prova.id, prova.titulo, prova.professorId, prova.dataInicio, prova.dataFim, prova.duracaoMinutos, prova.createdAt],
    );
  }

  async isAlunoMatriculado(alunoId: string, provaId: string): Promise<boolean> {
    const [rows] = await pool.execute(
      'SELECT id FROM provas_alunos WHERE aluno_id = ? AND prova_id = ?',
      [alunoId, provaId],
    );
    return (rows as any[]).length > 0;
  }

  async matricularAluno(alunoId: string, provaId: string): Promise<void> {
    const { randomUUID } = await import('crypto');
    await pool.execute(
      'INSERT IGNORE INTO provas_alunos (id, prova_id, aluno_id) VALUES (?, ?, ?)',
      [randomUUID(), provaId, alunoId],
    );
  }
}
