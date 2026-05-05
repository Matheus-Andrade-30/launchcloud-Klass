import { Grade } from './Grade';

export interface IGradeRepository {
  create(grade: Grade): Promise<Grade>;
  findAll(): Promise<Grade[]>;
  findById(id: string): Promise<Grade | null>;
  findByEnrollmentId(enrollmentId: string): Promise<Grade[]>;
}
