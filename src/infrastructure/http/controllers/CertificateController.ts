import { Request, Response } from 'express';
import { GenerateCertificateUseCase } from '../../../application/certificate/GenerateCertificateUseCase';
import { GetCertificateUseCase } from '../../../application/certificate/GetCertificateUseCase';

export class CertificateController {
  constructor(
    private generateCertificateUseCase: GenerateCertificateUseCase,
    private getCertificateUseCase: GetCertificateUseCase,
  ) {}

  async generate(req: Request, res: Response): Promise<void> {
    try {
      const certificate = await this.generateCertificateUseCase.execute(
        req.params.enrollmentId as string,
      );
      res.status(201).json(certificate);
    } catch (error) {
      const err = error as Error;
      const status = err.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const certificate = await this.getCertificateUseCase.execute(req.params.id as string);
      res.status(200).json(certificate);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }
}
