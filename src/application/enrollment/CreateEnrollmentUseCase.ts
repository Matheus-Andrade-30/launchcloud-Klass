import { randomUUID } from 'crypto';
import { Enrollment } from '../../domain/Enrollment';
import { IEnrollmentRepository } from '../../domain/IEnrollmentRepository';
import { IUserRepository } from '../../domain/IUserRepository';
import { IClassRepository } from '../../domain/IClassRepository';

export interface CreateEnrollmentDTO {
  studentId: string;
  classId: string;
}

export class CreateEnrollmentUseCase {
  constructor(
    private enrollmentRepository: IEnrollmentRepository,
    private userRepository: IUserRepository,
    private classRepository: IClassRepository,
  ) {}

  async execute(data: CreateEnrollmentDTO): Promise<Enrollment> {
    const student = await this.userRepository.findById(data.studentId);
    if (!student) {
      throw new Error('Student not found');
    }
    if (student.role !== 'student') {
      throw new Error('Only students can be enrolled');
    }

    const cls = await this.classRepository.findById(data.classId);
    if (!cls) {
      throw new Error('Class not found');
    }

    const enrollment = new Enrollment(
      randomUUID(),
      data.studentId,
      data.classId,
      'active',
      new Date(),
    );
    return this.enrollmentRepository.create(enrollment);
  }
}
