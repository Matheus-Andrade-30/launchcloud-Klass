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

  async updateStatus(id: string, status: Enrollment['status']): Promise<Enrollment | null> {
    const enrollment = this.enrollments.find((e) => e.id === id);
    if (!enrollment) return null;
    enrollment.status = status;
    return enrollment;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.enrollments.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    this.enrollments.splice(idx, 1);
    return true;
  }

  seed(enrollments: Enrollment[]): void {
    this.enrollments = enrollments;
  }
}
