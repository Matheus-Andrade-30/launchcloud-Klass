import { Grade } from '../../domain/Grade';
import { IGradeRepository } from '../../domain/IGradeRepository';

export class GetGradeByIdUseCase {
  constructor(private gradeRepository: IGradeRepository) {}

  async execute(id: string): Promise<Grade> {
    const grade = await this.gradeRepository.findById(id);
    if (!grade) throw new Error('Grade not found');
    return grade;
  }
}
