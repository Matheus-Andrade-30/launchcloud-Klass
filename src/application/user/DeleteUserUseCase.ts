import { IUserRepository } from '../../domain/IUserRepository';

export class DeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new Error('User not found');
    await this.userRepository.delete(id);
  }
}
