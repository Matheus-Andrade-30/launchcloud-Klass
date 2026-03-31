import { Request, Response } from 'express';
import { CreateClassUseCase } from '../../../application/class/CreateClassUseCase';
import { ListClassesUseCase } from '../../../application/class/ListClassesUseCase';
import { GetClassByIdUseCase } from '../../../application/class/GetClassByIdUseCase';

export class ClassController {
  constructor(
    private createClassUseCase: CreateClassUseCase,
    private listClassesUseCase: ListClassesUseCase,
    private getClassByIdUseCase: GetClassByIdUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const cls = await this.createClassUseCase.execute(req.body);
      res.status(201).json(cls);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    const classes = await this.listClassesUseCase.execute();
    res.status(200).json(classes);
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const cls = await this.getClassByIdUseCase.execute(req.params.id as string);
      res.status(200).json(cls);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }
}
