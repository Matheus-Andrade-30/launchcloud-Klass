import { Enrollment } from '../../../domain/Enrollment';
import { IEnrollmentRepository } from '../../../domain/IEnrollmentRepository';

export class InMemoryEnrollmentRepository implements IEnrollmentRepository {
  private enrollments: Enrollment[] = [];

  async create(enrollment: Enrollment): Promise<Enrollment> {
    this.enrollments.push(enrollment);
    return enrollment;
  }

  async findAll(): Promise<Enrollment[]> {
    return this.enrollments;
  }

  async findById(id: string): Promise<Enrollment | null> {
    return this.enrollments.find((e) => e.id === id) ?? null;
  }

  async findByStudentId(studentId: string): Promise<Enrollment[]> {
    return this.enrollments.filter((e) => e.studentId === studentId);
  }

  seed(enrollments: Enrollment[]): void {
    this.enrollments = enrollments;
  }
}
