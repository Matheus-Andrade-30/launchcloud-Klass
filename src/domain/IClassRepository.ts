import { Class } from './Class';

export interface IClassRepository {
  create(cls: Class): Promise<Class>;
  findAll(): Promise<Class[]>;
  findById(id: string): Promise<Class | null>;
}
