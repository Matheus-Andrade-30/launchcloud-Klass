import { Router } from 'express';
import multer from 'multer';
import { MaterialController } from '../controllers/MaterialController';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

export function materialRoutes(controller: MaterialController): Router {
  const router = Router();

  router.post('/', upload.single('file'), (req, res) => controller.upload(req, res));
  router.get('/', (req, res) => controller.list(req, res));
  router.get('/:id', (req, res) => controller.getById(req, res));
  router.get('/class/:classId', (req, res) => controller.listByClass(req, res));

  return router;
}
