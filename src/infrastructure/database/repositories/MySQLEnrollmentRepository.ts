import { RowDataPacket } from 'mysql2';
import { Enrollment } from '../../../domain/Enrollment';
import { IEnrollmentRepository } from '../../../domain/IEnrollmentRepository';
import { pool } from '../connection';

interface EnrollmentRow extends RowDataPacket {
  id: string;
  student_id: string;
  class_id: string;
  status: 'active' | 'completed' | 'dropped';
  enrolled_at: Date;
}

export class MySQLEnrollmentRepository implements IEnrollmentRepository {
  async create(enrollment: Enrollment): Promise<Enrollment> {
    await pool.execute(
      'INSERT INTO enrollments (id, student_id, class_id, status, enrolled_at) VALUES (?, ?, ?, ?, ?)',
      [enrollment.id, enrollment.studentId, enrollment.classId, enrollment.status, enrollment.enrolledAt],
    );
    return enrollment;
  }

  async findAll(): Promise<Enrollment[]> {
    const [rows] = await pool.execute<EnrollmentRow[]>('SELECT * FROM enrollments');
    return rows.map((r) => new Enrollment(r.id, r.student_id, r.class_id, r.status, r.enrolled_at));
  }

  async findById(id: string): Promise<Enrollment | null> {
    const [rows] = await pool.execute<EnrollmentRow[]>('SELECT * FROM enrollments WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    const r = rows[0];
    return new Enrollment(r.id, r.student_id, r.class_id, r.status, r.enrolled_at);
  }

  async findByStudentId(studentId: string): Promise<Enrollment[]> {
    const [rows] = await pool.execute<EnrollmentRow[]>(
      'SELECT * FROM enrollments WHERE student_id = ?',
      [studentId],
    );
    return rows.map((r) => new Enrollment(r.id, r.student_id, r.class_id, r.status, r.enrolled_at));
  }
}
