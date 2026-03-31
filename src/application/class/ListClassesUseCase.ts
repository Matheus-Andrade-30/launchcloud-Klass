import { Class } from '../../domain/Class';
import { IClassRepository } from '../../domain/IClassRepository';

export class ListClassesUseCase {
  constructor(private classRepository: IClassRepository) {}

  async execute(): Promise<Class[]> {
    return this.classRepository.findAll();
  }
}
