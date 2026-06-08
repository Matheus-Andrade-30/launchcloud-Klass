import { Router } from 'express';
import { ProvaController } from '../controllers/ProvaController';

export function provaRoutes(controller: ProvaController): Router {
  const router = Router();
  router.get('/', (req, res) => controller.getProva(req, res));
  router.get('/aluno/:alunoId', (req, res) => controller.listByAluno(req, res));
  router.get('/professor/:professorId', (req, res) => controller.listByProfessor(req, res));
  router.post('/', (req, res) => controller.createProva(req, res));
  router.post('/:id/alunos', (req, res) => controller.matricularAluno(req, res));
  router.post('/:id/iniciar', (req, res) => controller.iniciar(req, res));
  router.post('/:id/finalizar', (req, res) => controller.finalizar(req, res));
  router.post('/questoes', (req, res) => controller.createQuestao(req, res));
  router.put('/questoes/:id', (req, res) => controller.updateQuestao(req, res));
  return router;
}
