import { Material } from './Material';

export interface IMaterialRepository {
  create(material: Material): Promise<Material>;
  findAll(): Promise<Material[]>;
  findById(id: string): Promise<Material | null>;
  findByClassId(classId: string): Promise<Material[]>;
}
