import { Class } from '../../domain/Class';
import { IClassRepository } from '../../domain/IClassRepository';

interface UpdateClassDTO {
  title?: string;
  description?: string;
}

export class UpdateClassUseCase {
  constructor(private classRepository: IClassRepository) {}

  async execute(id: string, data: UpdateClassDTO): Promise<Class> {
    const existing = await this.classRepository.findById(id);
    if (!existing) throw new Error('Class not found');

    const updated = await this.classRepository.update(id, data);
    if (!updated) throw new Error('Class not found');
    return updated;
  }
}
