import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../../application/user/CreateUserUseCase';
import { ListUsersUseCase } from '../../../application/user/ListUsersUseCase';
import { GetUserByIdUseCase } from '../../../application/user/GetUserByIdUseCase';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private listUsersUseCase: ListUsersUseCase,
    private getUserByIdUseCase: GetUserByIdUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.createUserUseCase.execute(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    const users = await this.listUsersUseCase.execute();
    res.status(200).json(users);
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.getUserByIdUseCase.execute(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }
}
