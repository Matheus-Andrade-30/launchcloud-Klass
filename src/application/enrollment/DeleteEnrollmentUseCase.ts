import { IEnrollmentRepository } from '../../domain/IEnrollmentRepository';

export class DeleteEnrollmentUseCase {
  constructor(private enrollmentRepository: IEnrollmentRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.enrollmentRepository.findById(id);
    if (!existing) throw new Error('Enrollment not found');
    await this.enrollmentRepository.delete(id);
  }
}
