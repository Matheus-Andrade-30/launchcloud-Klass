import { Class } from '../../domain/Class';
import { IClassRepository } from '../../domain/IClassRepository';

export class GetClassByIdUseCase {
  constructor(private classRepository: IClassRepository) {}

  async execute(id: string): Promise<Class> {
    const cls = await this.classRepository.findById(id);
    if (!cls) {
      throw new Error('Class not found');
    }
    return cls;
  }
}
