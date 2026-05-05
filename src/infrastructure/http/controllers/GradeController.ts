import { Request, Response } from 'express';
import { CreateGradeUseCase } from '../../../application/grade/CreateGradeUseCase';
import { ListGradesUseCase } from '../../../application/grade/ListGradesUseCase';
import { GetGradeByIdUseCase } from '../../../application/grade/GetGradeByIdUseCase';
import { ListGradesByEnrollmentUseCase } from '../../../application/grade/ListGradesByEnrollmentUseCase';

export class GradeController {
  constructor(
    private createGradeUseCase: CreateGradeUseCase,
    private listGradesUseCase: ListGradesUseCase,
    private getGradeByIdUseCase: GetGradeByIdUseCase,
    private listGradesByEnrollmentUseCase: ListGradesByEnrollmentUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const grade = await this.createGradeUseCase.execute(req.body);
      res.status(201).json(grade);
    } catch (error) {
      const err = error as Error;
      const status = err.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }

  async list(_req: Request, res: Response): Promise<void> {
    const grades = await this.listGradesUseCase.execute();
    res.status(200).json(grades);
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const grade = await this.getGradeByIdUseCase.execute(req.params.id as string);
      res.status(200).json(grade);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }

  async listByEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const grades = await this.listGradesByEnrollmentUseCase.execute(
        req.params.enrollmentId as string,
      );
      res.status(200).json(grades);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }
}
