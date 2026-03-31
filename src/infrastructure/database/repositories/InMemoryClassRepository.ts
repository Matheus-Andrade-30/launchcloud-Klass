import { Class } from '../../../domain/Class';
import { IClassRepository } from '../../../domain/IClassRepository';

export class InMemoryClassRepository implements IClassRepository {
  private classes: Class[] = [];

  async create(cls: Class): Promise<Class> {
    this.classes.push(cls);
    return cls;
  }

  async findAll(): Promise<Class[]> {
    return this.classes;
  }

  async findById(id: string): Promise<Class | null> {
    return this.classes.find((c) => c.id === id) ?? null;
  }

  seed(classes: Class[]): void {
    this.classes = classes;
  }
}
