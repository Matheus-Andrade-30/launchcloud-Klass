import { Enrollment } from '../../domain/Enrollment';
import { IEnrollmentRepository } from '../../domain/IEnrollmentRepository';

export class UpdateEnrollmentStatusUseCase {
  constructor(private enrollmentRepository: IEnrollmentRepository) {}

  async execute(id: string, status: Enrollment['status']): Promise<Enrollment> {
    const existing = await this.enrollmentRepository.findById(id);
    if (!existing) throw new Error('Enrollment not found');

    const updated = await this.enrollmentRepository.updateStatus(id, status);
    if (!updated) throw new Error('Enrollment not found');
    return updated;
  }
}
