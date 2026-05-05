import { Grade } from '../../domain/Grade';
import { IGradeRepository } from '../../domain/IGradeRepository';
import { IEnrollmentRepository } from '../../domain/IEnrollmentRepository';

export class ListGradesByEnrollmentUseCase {
  constructor(
    private gradeRepository: IGradeRepository,
    private enrollmentRepository: IEnrollmentRepository,
  ) {}

  async execute(enrollmentId: string): Promise<Grade[]> {
    const enrollment = await this.enrollmentRepository.findById(enrollmentId);
    if (!enrollment) throw new Error('Enrollment not found');
    return this.gradeRepository.findByEnrollmentId(enrollmentId);
  }
}
