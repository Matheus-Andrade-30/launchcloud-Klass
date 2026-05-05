import { Grade } from '../../domain/Grade';
import { IGradeRepository } from '../../domain/IGradeRepository';

export class ListGradesUseCase {
  constructor(private gradeRepository: IGradeRepository) {}

  async execute(): Promise<Grade[]> {
    return this.gradeRepository.findAll();
  }
}
