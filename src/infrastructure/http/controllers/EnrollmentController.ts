import { Request, Response } from 'express';
import { CreateEnrollmentUseCase } from '../../../application/enrollment/CreateEnrollmentUseCase';
import { ListEnrollmentsUseCase } from '../../../application/enrollment/ListEnrollmentsUseCase';
import { GetEnrollmentByIdUseCase } from '../../../application/enrollment/GetEnrollmentByIdUseCase';
import { UpdateEnrollmentStatusUseCase } from '../../../application/enrollment/UpdateEnrollmentStatusUseCase';
import { DeleteEnrollmentUseCase } from '../../../application/enrollment/DeleteEnrollmentUseCase';
import { Enrollment } from '../../../domain/Enrollment';

export class EnrollmentController {
  constructor(
    private createEnrollmentUseCase: CreateEnrollmentUseCase,
    private listEnrollmentsUseCase: ListEnrollmentsUseCase,
    private getEnrollmentByIdUseCase: GetEnrollmentByIdUseCase,
    private updateEnrollmentStatusUseCase: UpdateEnrollmentStatusUseCase,
    private deleteEnrollmentUseCase: DeleteEnrollmentUseCase,
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    try {
      const enrollment = await this.createEnrollmentUseCase.execute(req.body);
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }

  async list(_req: Request, res: Response): Promise<void> {
    const enrollments = await this.listEnrollmentsUseCase.execute();
    res.status(200).json(enrollments);
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const enrollment = await this.getEnrollmentByIdUseCase.execute(req.params.id as string);
      res.status(200).json(enrollment);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.body as { status: Enrollment['status'] };
      const enrollment = await this.updateEnrollmentStatusUseCase.execute(
        req.params.id as string,
        status,
      );
      res.status(200).json(enrollment);
    } catch (error) {
      const err = error as Error;
      const status = err.message === 'Enrollment not found' ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.deleteEnrollmentUseCase.execute(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }
}
