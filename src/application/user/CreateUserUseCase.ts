import { randomUUID } from 'crypto';
import { User } from '../../domain/User';
import { IUserRepository } from '../../domain/IUserRepository';

export interface CreateUserDTO {
  name: string;
  email: string;
  role: 'teacher' | 'student';
}

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: CreateUserDTO): Promise<User> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('Email already in use');
    }
    const user = new User(randomUUID(), data.name, data.email, data.role, new Date());
    return this.userRepository.create(user);
  }
}
