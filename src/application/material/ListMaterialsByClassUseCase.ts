import { Material } from '../../domain/Material';
import { IMaterialRepository } from '../../domain/IMaterialRepository';
import { IClassRepository } from '../../domain/IClassRepository';

export class ListMaterialsByClassUseCase {
  constructor(
    private materialRepository: IMaterialRepository,
    private classRepository: IClassRepository,
  ) {}

  async execute(classId: string): Promise<Material[]> {
    const cls = await this.classRepository.findById(classId);
    if (!cls) throw new Error('Class not found');
    return this.materialRepository.findByClassId(classId);
  }
}
