import { Enrollment } from '../../domain/Enrollment';
import { IEnrollmentRepository } from '../../domain/IEnrollmentRepository';

export class GetEnrollmentByIdUseCase {
  constructor(private enrollmentRepository: IEnrollmentRepository) {}

  async execute(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepository.findById(id);
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }
    return enrollment;
  }
}
