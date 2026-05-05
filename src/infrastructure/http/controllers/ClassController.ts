import { Request, Response } from 'express';
import { CreateClassUseCase } from '../../../application/class/CreateClassUseCase';
import { ListClassesUseCase } from '../../../application/class/ListClassesUseCase';
import { GetClassByIdUseCase } from '../../../application/class/GetClassByIdUseCase';
import { UpdateClassUseCase } from '../../../application/class/UpdateClassUseCase';
import { DeleteClassUseCase } from '../../../application/class/DeleteClassUseCase';

export class ClassController {
  constructor(
    private createClassUseCase: CreateClassUseCase,
    private listClassesUseCase: ListClassesUseCase,
    private getClassByIdUseCase: GetClassByIdUseCase,
    private updateClassUseCase: UpdateClassUseCase,
    private deleteClassUseCase: DeleteClassUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const cls = await this.createClassUseCase.execute(req.body);
      res.status(201).json(cls);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async list(_req: Request, res: Response): Promise<void> {
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

  async update(req: Request, res: Response): Promise<void> {
    try {
      const cls = await this.updateClassUseCase.execute(req.params.id as string, req.body);
      res.status(200).json(cls);
    } catch (error) {
      const err = error as Error;
      const status = err.message === 'Class not found' ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteClassUseCase.execute(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }
}
