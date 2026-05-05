import { User } from '../../../domain/User';
import { IUserRepository } from '../../../domain/IUserRepository';

export class InMemoryUserRepository implements IUserRepository {
  private users: User[] = [];

  async create(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.users;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async update(
    id: string,
    data: Partial<Pick<User, 'name' | 'email' | 'role'>>,
  ): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    if (data.name !== undefined) user.name = data.name;
    if (data.email !== undefined) user.email = data.email;
    if (data.role !== undefined) user.role = data.role;
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx === -1) return false;
    this.users.splice(idx, 1);
    return true;
  }

  seed(users: User[]): void {
    this.users = users;
  }
}
