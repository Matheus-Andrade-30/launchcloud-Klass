import { Grade } from '../../domain/Grade';
import { IGradeRepository } from '../../domain/IGradeRepository';

interface UpdateGradeInput {
  id: string;
  grade?: number;
  attendance?: number;
  notes?: string;
}

export class UpdateGradeUseCase {
  constructor(private gradeRepository: IGradeRepository) {}

  async execute(input: UpdateGradeInput): Promise<Grade> {
    const existing = await this.gradeRepository.findById(input.id);
    if (!existing) throw new Error('Grade not found');

    const updated = new Grade(
      existing.id,
      existing.enrollmentId,
      existing.teacherId,
      input.grade ?? existing.grade,
      input.attendance ?? existing.attendance,
      input.notes ?? existing.notes,
      existing.createdAt,
    );

    return this.gradeRepository.update(updated);
  }
}
