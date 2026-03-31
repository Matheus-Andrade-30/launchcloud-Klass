import { Enrollment } from './Enrollment';

export interface IEnrollmentRepository {
  create(enrollment: Enrollment): Promise<Enrollment>;
  findAll(): Promise<Enrollment[]>;
  findById(id: string): Promise<Enrollment | null>;
  findByStudentId(studentId: string): Promise<Enrollment[]>;
}
