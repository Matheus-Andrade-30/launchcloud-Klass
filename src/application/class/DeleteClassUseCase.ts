import { IClassRepository } from '../../domain/IClassRepository';

export class DeleteClassUseCase {
  constructor(private classRepository: IClassRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.classRepository.findById(id);
    if (!existing) throw new Error('Class not found');
    await this.classRepository.delete(id);
  }
}
