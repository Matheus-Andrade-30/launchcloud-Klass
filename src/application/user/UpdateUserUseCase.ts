import { User } from '../../domain/User';
import { IUserRepository } from '../../domain/IUserRepository';

interface UpdateUserDTO {
  name?: string;
  email?: string;
  role?: 'teacher' | 'student';
}

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, data: UpdateUserDTO): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new Error('User not found');

    if (data.email && data.email !== existing.email) {
      const emailInUse = await this.userRepository.findByEmail(data.email);
      if (emailInUse) throw new Error('Email already in use');
    }

    const updated = await this.userRepository.update(id, data);
    if (!updated) throw new Error('User not found');
    return updated;
  }
}
