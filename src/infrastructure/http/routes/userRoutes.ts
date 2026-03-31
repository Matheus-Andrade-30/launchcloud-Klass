import { Router } from 'express';
import { UserController } from '../controllers/UserController';

export function userRoutes(controller: UserController): Router {
  const router = Router();

  router.post('/', (req, res) => controller.create(req, res));
  router.get('/', (req, res) => controller.list(req, res));
  router.get('/:id', (req, res) => controller.getById(req, res));

  return router;
}
