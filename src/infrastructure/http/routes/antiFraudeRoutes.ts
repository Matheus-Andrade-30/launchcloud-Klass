import { Router } from 'express';
import { AntiFraudeController } from '../controllers/AntiFraudeController';

export function antiFraudeRoutes(controller: AntiFraudeController): Router {
  const router = Router();
  router.get('/relatorio/:provaId', (req, res) => controller.getRelatorio(req, res));
  router.post('/respostas/versoes', (req, res) => controller.saveResposta(req, res));
  router.post('/telemetria/photocam', (req, res) => controller.savePhotocam(req, res));
  router.post('/telemetria/screenshot', (req, res) => controller.saveScreenshot(req, res));
  return router;
}
