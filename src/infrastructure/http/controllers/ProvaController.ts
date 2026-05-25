import { Request, Response } from 'express';
import { GetProvaUseCase } from '../../../application/prova/GetProvaUseCase';
import { CreateProvaUseCase } from '../../../application/prova/CreateProvaUseCase';
import { MatricularAlunoProvaUseCase } from '../../../application/prova/MatricularAlunoProvaUseCase';
import { CreateQuestaoUseCase } from '../../../application/questao/CreateQuestaoUseCase';
import { UpdateQuestaoUseCase } from '../../../application/questao/UpdateQuestaoUseCase';

export class ProvaController {
  constructor(
    private getProvaUseCase: GetProvaUseCase,
    private createProvaUseCase: CreateProvaUseCase,
    private matricularAlunoUseCase: MatricularAlunoProvaUseCase,
    private createQuestaoUseCase: CreateQuestaoUseCase,
    private updateQuestaoUseCase: UpdateQuestaoUseCase,
  ) {}

  async getProva(req: Request, res: Response): Promise<void> {
    try {
      const { prova_id, aluno_id } = req.query as { prova_id: string; aluno_id: string };
      if (!prova_id || !aluno_id) { res.status(400).json({ error: 'prova_id e aluno_id são obrigatórios' }); return; }
      const result = await this.getProvaUseCase.execute(prova_id, aluno_id);
      res.status(200).json(result);
    } catch (err: any) {
      const status = err.message.includes('não encontrada') ? 404
        : err.message.includes('não matriculado') ? 403
        : err.message.includes('não iniciou') ? 425
        : err.message.includes('encerrada') ? 410
        : 500;
      res.status(status).json({ error: err.message });
    }
  }

  async createProva(req: Request, res: Response): Promise<void> {
    try {
      const prova = await this.createProvaUseCase.execute(req.body);
      res.status(201).json(prova);
    } catch (err: any) {
      const status = err.message.includes('professores') ? 403 : 400;
      res.status(status).json({ error: err.message });
    }
  }

  async matricularAluno(req: Request, res: Response): Promise<void> {
    try {
      await this.matricularAlunoUseCase.execute({ provaId: req.params.id as string, alunoId: req.body.alunoId as string });
      res.status(201).json({ matriculado: true });
    } catch (err: any) {
      const status = err.message.includes('não encontrad') ? 404
        : err.message.includes('alunos') ? 403
        : 400;
      res.status(status).json({ error: err.message });
    }
  }

  async createQuestao(req: Request, res: Response): Promise<void> {
    try {
      const questao = await this.createQuestaoUseCase.execute(req.body);
      res.status(201).json(questao);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async updateQuestao(req: Request, res: Response): Promise<void> {
    try {
      await this.updateQuestaoUseCase.execute({ questaoId: req.params.id, ...req.body });
      res.status(200).json({ atualizado: true });
    } catch (err: any) {
      const status = err.message.includes('não encontrada') ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }
}
