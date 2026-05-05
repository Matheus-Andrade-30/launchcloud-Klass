import { RowDataPacket } from 'mysql2';
import { Grade } from '../../../domain/Grade';
import { IGradeRepository } from '../../../domain/IGradeRepository';
import { pool } from '../connection';

interface GradeRow extends RowDataPacket {
  id: string;
  enrollment_id: string;
  teacher_id: string;
  grade: number;
  attendance: number;
  notes: string;
  created_at: Date;
}

function rowToGrade(r: GradeRow): Grade {
  return new Grade(
    r.id,
    r.enrollment_id,
    r.teacher_id,
    r.grade,
    r.attendance,
    r.notes,
    r.created_at,
  );
}

export class MySQLGradeRepository implements IGradeRepository {
  async create(grade: Grade): Promise<Grade> {
    await pool.execute(
      'INSERT INTO grades (id, enrollment_id, teacher_id, grade, attendance, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        grade.id,
        grade.enrollmentId,
        grade.teacherId,
        grade.grade,
        grade.attendance,
        grade.notes,
        grade.createdAt,
      ],
    );
    return grade;
  }

  async findAll(): Promise<Grade[]> {
    const [rows] = await pool.execute<GradeRow[]>('SELECT * FROM grades');
    return rows.map(rowToGrade);
  }

  async findById(id: string): Promise<Grade | null> {
    const [rows] = await pool.execute<GradeRow[]>('SELECT * FROM grades WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return rowToGrade(rows[0]);
  }

  async findByEnrollmentId(enrollmentId: string): Promise<Grade[]> {
    const [rows] = await pool.execute<GradeRow[]>('SELECT * FROM grades WHERE enrollment_id = ?', [
      enrollmentId,
    ]);
    return rows.map(rowToGrade);
  }
}
