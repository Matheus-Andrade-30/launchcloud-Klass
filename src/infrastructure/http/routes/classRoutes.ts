import { Router } from 'express';
import { ClassController } from '../controllers/ClassController';

export function classRoutes(controller: ClassController): Router {
  const router = Router();

  router.post('/', (req, res) => controller.create(req, res));
  router.get('/', (req, res) => controller.list(req, res));
  router.get('/:id', (req, res) => controller.getById(req, res));

  return router;
}
