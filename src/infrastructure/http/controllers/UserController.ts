import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../../application/user/CreateUserUseCase';
import { ListUsersUseCase } from '../../../application/user/ListUsersUseCase';
import { GetUserByIdUseCase } from '../../../application/user/GetUserByIdUseCase';
import { UpdateUserUseCase } from '../../../application/user/UpdateUserUseCase';
import { DeleteUserUseCase } from '../../../application/user/DeleteUserUseCase';

export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private listUsersUseCase: ListUsersUseCase,
    private getUserByIdUseCase: GetUserByIdUseCase,
    private updateUserUseCase: UpdateUserUseCase,
    private deleteUserUseCase: DeleteUserUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.createUserUseCase.execute(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async list(_req: Request, res: Response): Promise<void> {
    const users = await this.listUsersUseCase.execute();
    res.status(200).json(users);
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.getUserByIdUseCase.execute(req.params.id as string);
      res.status(200).json(user);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.updateUserUseCase.execute(req.params.id as string, req.body);
      res.status(200).json(user);
    } catch (error) {
      const err = error as Error;
      const status = err.message === 'User not found' ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteUserUseCase.execute(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }
}
