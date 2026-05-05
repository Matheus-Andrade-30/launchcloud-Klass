import { Router } from 'express';
import { GradeController } from '../controllers/GradeController';

export function gradeRoutes(controller: GradeController): Router {
  const router = Router();

  router.post('/', (req, res) => controller.create(req, res));
  router.get('/', (req, res) => controller.list(req, res));
  router.get('/:id', (req, res) => controller.getById(req, res));
  router.get('/enrollment/:enrollmentId', (req, res) => controller.listByEnrollment(req, res));

  return router;
}
