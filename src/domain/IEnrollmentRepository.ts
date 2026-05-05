import { Enrollment } from './Enrollment';

export interface IEnrollmentRepository {
  create(enrollment: Enrollment): Promise<Enrollment>;
  findAll(): Promise<Enrollment[]>;
  findById(id: string): Promise<Enrollment | null>;
  findByStudentId(studentId: string): Promise<Enrollment[]>;
  updateStatus(id: string, status: Enrollment['status']): Promise<Enrollment | null>;
  delete(id: string): Promise<boolean>;
}
