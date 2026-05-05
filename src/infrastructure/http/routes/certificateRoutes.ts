import { Router } from 'express';
import { CertificateController } from '../controllers/CertificateController';

export function certificateRoutes(controller: CertificateController): Router {
  const router = Router();

  router.post('/enrollment/:enrollmentId', (req, res) => controller.generate(req, res));
  router.get('/:id', (req, res) => controller.getById(req, res));

  return router;
}
