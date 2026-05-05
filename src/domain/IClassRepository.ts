import { Class } from './Class';

export interface IClassRepository {
  create(cls: Class): Promise<Class>;
  findAll(): Promise<Class[]>;
  findById(id: string): Promise<Class | null>;
  update(id: string, data: Partial<Pick<Class, 'title' | 'description'>>): Promise<Class | null>;
  delete(id: string): Promise<boolean>;
}
