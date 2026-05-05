import { Material } from '../../domain/Material';
import { IMaterialRepository } from '../../domain/IMaterialRepository';

export class ListMaterialsUseCase {
  constructor(private materialRepository: IMaterialRepository) {}

  async execute(): Promise<Material[]> {
    return this.materialRepository.findAll();
  }
}
