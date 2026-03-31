import { RowDataPacket } from 'mysql2';
import { Class } from '../../../domain/Class';
import { IClassRepository } from '../../../domain/IClassRepository';
import { pool } from '../connection';

interface ClassRow extends RowDataPacket {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  created_at: Date;
}

export class MySQLClassRepository implements IClassRepository {
  async create(cls: Class): Promise<Class> {
    await pool.execute(
      'INSERT INTO classes (id, title, description, teacher_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [cls.id, cls.title, cls.description, cls.teacherId, cls.createdAt],
    );
    return cls;
  }

  async findAll(): Promise<Class[]> {
    const [rows] = await pool.execute<ClassRow[]>('SELECT * FROM classes');
    return rows.map((r) => new Class(r.id, r.title, r.description, r.teacher_id, r.created_at));
  }

  async findById(id: string): Promise<Class | null> {
    const [rows] = await pool.execute<ClassRow[]>('SELECT * FROM classes WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new Class(r.id, r.title, r.description, r.teacher_id, r.created_at);
  }
}
