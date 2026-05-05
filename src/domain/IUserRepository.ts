import { User } from './User';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: Partial<Pick<User, 'name' | 'email' | 'role'>>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
