import { Request, Response } from 'express';
import { CreateEnrollmentUseCase } from '../../../application/enrollment/CreateEnrollmentUseCase';
import { ListEnrollmentsUseCase } from '../../../application/enrollment/ListEnrollmentsUseCase';
import { GetEnrollmentByIdUseCase } from '../../../application/enrollment/GetEnrollmentByIdUseCase';

export class EnrollmentController {
  constructor(
    private createEnrollmentUseCase: CreateEnrollmentUseCase,
    private listEnrollmentsUseCase: ListEnrollmentsUseCase,
    private getEnrollmentByIdUseCase: GetEnrollmentByIdUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const enrollment = await this.createEnrollmentUseCase.execute(req.body);
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    const enrollments = await this.listEnrollmentsUseCase.execute();
    res.status(200).json(enrollments);
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const enrollment = await this.getEnrollmentByIdUseCase.execute(req.params.id);
      res.status(200).json(enrollment);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }
}
