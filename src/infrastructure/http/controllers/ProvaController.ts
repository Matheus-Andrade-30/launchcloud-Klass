import { Request, Response } from 'express';
import { GetProvaUseCase } from '../../../application/prova/GetProvaUseCase';
import { CreateProvaUseCase } from '../../../application/prova/CreateProvaUseCase';
import { MatricularAlunoProvaUseCase } from '../../../application/prova/MatricularAlunoProvaUseCase';
import { ListProvasByAlunoUseCase } from '../../../application/prova/ListProvasByAlunoUseCase';
import { ListProvasByProfessorUseCase } from '../../../application/prova/ListProvasByProfessorUseCase';
import { IniciarProvaUseCase } from '../../../application/prova/IniciarProvaUseCase';
import { FinalizarProvaUseCase } from '../../../application/prova/FinalizarProvaUseCase';
import { CreateQuestaoUseCase } from '../../../application/questao/CreateQuestaoUseCase';
import { UpdateQuestaoUseCase } from '../../../application/questao/UpdateQuestaoUseCase';

export class ProvaController {
  constructor(
    private getProvaUseCase: GetProvaUseCase,
    private createProvaUseCase: CreateProvaUseCase,
    private matricularAlunoUseCase: MatricularAlunoProvaUseCase,
    private listProvasByAlunoUseCase: ListProvasByAlunoUseCase,
    private listProvasByProfessorUseCase: ListProvasByProfessorUseCase,
    private iniciarProvaUseCase: IniciarProvaUseCase,
    private finalizarProvaUseCase: FinalizarProvaUseCase,
    private createQuestaoUseCase: CreateQuestaoUseCase,
    private updateQuestaoUseCase: UpdateQuestaoUseCase,
  ) {}

  async getProva(req: Request, res: Response): Promise<void> {
    try {
      const { prova_id, aluno_id } = req.query as { prova_id: string; aluno_id: string };
      if (!prova_id || !aluno_id) {
        res.status(400).json({ error: 'prova_id e aluno_id são obrigatórios' });
        return;
      }
      const result = await this.getProvaUseCase.execute(prova_id, aluno_id);
      res.status(200).json(result);
    } catch (err: any) {
      const status = err.message.includes('não encontrada')
        ? 404
        : err.message.includes('não matriculado')
          ? 403
          : err.message.includes('não iniciou')
            ? 425
            : err.message.includes('encerrada')
              ? 410
              : 500;
      res.status(status).json({ error: err.message });
    }
  }

  async listByAluno(req: Request, res: Response): Promise<void> {
    try {
      const provas = await this.listProvasByAlunoUseCase.execute(req.params.alunoId as string);
      res.status(200).json(
        provas.map((p) => ({
          ...p.prova,
          iniciadoEm: p.iniciadoEm,
          finalizadoEm: p.finalizadoEm,
        })),
      );
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async listByProfessor(req: Request, res: Response): Promise<void> {
    try {
      const provas = await this.listProvasByProfessorUseCase.execute(
        req.params.professorId as string,
      );
      res.status(200).json(provas);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async iniciar(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.iniciarProvaUseCase.execute({
        provaId: req.params.id as string,
        alunoId: req.body.alunoId as string,
      });
      res.status(200).json(result);
    } catch (err: any) {
      const status = err.message.includes('não matriculado')
        ? 403
        : err.message.includes('não encontrad')
          ? 404
          : 400;
      res.status(status).json({ error: err.message });
    }
  }

  async finalizar(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.finalizarProvaUseCase.execute({
        provaId: req.params.id as string,
        alunoId: req.body.alunoId as string,
      });
      res.status(200).json(result);
    } catch (err: any) {
      const status = err.message.includes('não matriculado')
        ? 403
        : err.message.includes('não encontrad')
          ? 404
          : 400;
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
      await this.matricularAlunoUseCase.execute({
        provaId: req.params.id as string,
        alunoId: req.body.alunoId as string,
      });
      res.status(201).json({ matriculado: true });
    } catch (err: any) {
      const status = err.message.includes('não encontrad')
        ? 404
        : err.message.includes('alunos')
          ? 403
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
