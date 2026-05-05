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

  async update(
    id: string,
    data: Partial<Pick<Class, 'title' | 'description'>>,
  ): Promise<Class | null> {
    const cls = this.classes.find((c) => c.id === id);
    if (!cls) return null;
    if (data.title !== undefined) cls.title = data.title;
    if (data.description !== undefined) cls.description = data.description;
    return cls;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.classes.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.classes.splice(idx, 1);
    return true;
  }

  seed(classes: Class[]): void {
    this.classes = classes;
  }
}
