import { Router } from 'express';
import { EnrollmentController } from '../controllers/EnrollmentController';

export function enrollmentRoutes(controller: EnrollmentController): Router {
  const router = Router();

  router.post('/', (req, res) => controller.create(req, res));
  router.get('/', (req, res) => controller.list(req, res));
  router.get('/:id', (req, res) => controller.getById(req, res));
  router.patch('/:id/status', (req, res) => controller.updateStatus(req, res));
  router.delete('/:id', (req, res) => controller.delete(req, res));

  return router;
}
