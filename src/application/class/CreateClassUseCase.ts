import { randomUUID } from 'crypto';
import { Class } from '../../domain/Class';
import { IClassRepository } from '../../domain/IClassRepository';
import { IUserRepository } from '../../domain/IUserRepository';

export interface CreateClassDTO {
  title: string;
  description: string;
  teacherId: string;
}

export class CreateClassUseCase {
  constructor(
    private classRepository: IClassRepository,
    private userRepository: IUserRepository,
  ) {}

  async execute(data: CreateClassDTO): Promise<Class> {
    const teacher = await this.userRepository.findById(data.teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    if (teacher.role !== 'teacher') {
      throw new Error('Only teachers can create classes');
    }
    const cls = new Class(randomUUID(), data.title, data.description, data.teacherId, new Date());
    return this.classRepository.create(cls);
  }
}
