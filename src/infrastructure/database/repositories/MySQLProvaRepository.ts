import { pool } from '../connection';
import { IProvaRepository, ProvaComInicio } from '../../../domain/IProvaRepository';
import { Prova } from '../../../domain/Prova';
import { Questao } from '../../../domain/Questao';
import { parseOpcoes } from './MySQLQuestaoRepository';

export class MySQLProvaRepository implements IProvaRepository {
  async findById(id: string): Promise<Prova | null> {
    const [rows] = await pool.execute('SELECT * FROM provas WHERE id = ?', [id]);
    const row = (rows as any[])[0];
    if (!row) return null;
    return new Prova(
      row.id,
      row.titulo,
      row.professor_id,
      row.data_inicio,
      row.data_fim,
      row.duracao_minutos,
      row.created_at,
    );
  }

  async findWithQuestoes(id: string): Promise<{ prova: Prova; questoes: Questao[] } | null> {
    const prova = await this.findById(id);
    if (!prova) return null;

    const [rows] = await pool.execute(
      'SELECT * FROM questoes WHERE prova_id = ? ORDER BY ordem ASC',
      [id],
    );
    const questoes = (rows as any[]).map(
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
    return { prova, questoes };
  }

  async create(prova: Prova): Promise<void> {
    await pool.execute(
      'INSERT INTO provas (id, titulo, professor_id, data_inicio, data_fim, duracao_minutos, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        prova.id,
        prova.titulo,
        prova.professorId,
        prova.dataInicio,
        prova.dataFim,
        prova.duracaoMinutos,
        prova.createdAt,
      ],
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

  async findProvasByAlunoId(alunoId: string): Promise<ProvaComInicio[]> {
    const [rows] = await pool.execute(
      `SELECT p.*, pa.iniciado_em AS iniciado_em, pa.finalizado_em AS finalizado_em
       FROM provas_alunos pa
       INNER JOIN provas p ON p.id = pa.prova_id
       WHERE pa.aluno_id = ?
       ORDER BY p.data_inicio ASC`,
      [alunoId],
    );
    return (rows as any[]).map((r) => ({
      prova: new Prova(
        r.id,
        r.titulo,
        r.professor_id,
        r.data_inicio,
        r.data_fim,
        r.duracao_minutos,
        r.created_at,
      ),
      iniciadoEm: r.iniciado_em ? new Date(r.iniciado_em).toISOString() : null,
      finalizadoEm: r.finalizado_em ? new Date(r.finalizado_em).toISOString() : null,
    }));
  }

  async findProvasByProfessorId(professorId: string): Promise<Prova[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM provas WHERE professor_id = ? ORDER BY data_inicio ASC',
      [professorId],
    );
    return (rows as any[]).map(
      (r) =>
        new Prova(
          r.id,
          r.titulo,
          r.professor_id,
          r.data_inicio,
          r.data_fim,
          r.duracao_minutos,
          r.created_at,
        ),
    );
  }

  async marcarInicio(provaId: string, alunoId: string): Promise<void> {
    await pool.execute(
      'UPDATE provas_alunos SET iniciado_em = NOW() WHERE prova_id = ? AND aluno_id = ? AND iniciado_em IS NULL',
      [provaId, alunoId],
    );
  }

  async marcarFim(provaId: string, alunoId: string): Promise<void> {
    await pool.execute(
      'UPDATE provas_alunos SET finalizado_em = NOW() WHERE prova_id = ? AND aluno_id = ? AND finalizado_em IS NULL',
      [provaId, alunoId],
    );
  }

  async getMatricula(
    provaId: string,
    alunoId: string,
  ): Promise<{ iniciadoEm: string | null; finalizadoEm: string | null } | null> {
    const [rows] = await pool.execute(
      'SELECT iniciado_em, finalizado_em FROM provas_alunos WHERE prova_id = ? AND aluno_id = ?',
      [provaId, alunoId],
    );
    const row = (rows as any[])[0];
    if (!row) return null;
    return {
      iniciadoEm: row.iniciado_em ? new Date(row.iniciado_em).toISOString() : null,
      finalizadoEm: row.finalizado_em ? new Date(row.finalizado_em).toISOString() : null,
    };
  }
}
