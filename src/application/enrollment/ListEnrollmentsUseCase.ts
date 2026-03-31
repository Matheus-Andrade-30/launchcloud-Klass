import { Enrollment } from '../../domain/Enrollment';
import { IEnrollmentRepository } from '../../domain/IEnrollmentRepository';

export class ListEnrollmentsUseCase {
  constructor(private enrollmentRepository: IEnrollmentRepository) {}

  async execute(): Promise<Enrollment[]> {
    return this.enrollmentRepository.findAll();
  }
}
