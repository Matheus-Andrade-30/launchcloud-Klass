import { randomUUID } from 'crypto';
import { Grade } from '../../domain/Grade';
import { IGradeRepository } from '../../domain/IGradeRepository';
import { IEnrollmentRepository } from '../../domain/IEnrollmentRepository';
import { IUserRepository } from '../../domain/IUserRepository';

interface CreateGradeDTO {
  enrollmentId: string;
  teacherId: string;
  grade: number;
  attendance: number;
  notes: string;
}

export class CreateGradeUseCase {
  constructor(
    private gradeRepository: IGradeRepository,
    private enrollmentRepository: IEnrollmentRepository,
    private userRepository: IUserRepository,
  ) {}

  async execute(dto: CreateGradeDTO): Promise<Grade> {
    const enrollment = await this.enrollmentRepository.findById(dto.enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');

    const teacher = await this.userRepository.findById(dto.teacherId);
    if (!teacher) throw new Error('Teacher not found');
    if (teacher.role !== 'teacher') throw new Error('Only teachers can register grades');

    if (dto.grade < 0 || dto.grade > 10) throw new Error('Grade must be between 0 and 10');
    if (dto.attendance < 0 || dto.attendance > 100)
      throw new Error('Attendance must be between 0 and 100');

    const grade = new Grade(
      randomUUID(),
      dto.enrollmentId,
      dto.teacherId,
      dto.grade,
      dto.attendance,
      dto.notes,
      new Date(),
    );

    return this.gradeRepository.create(grade);
  }
}
