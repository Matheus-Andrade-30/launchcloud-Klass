import { Request, Response } from 'express';
import { SaveRespostaVersaoUseCase } from '../../../application/antifraude/SaveRespostaVersaoUseCase';
import { SavePhotocamUseCase } from '../../../application/antifraude/SavePhotocamUseCase';
import { SaveScreenshotUseCase } from '../../../application/antifraude/SaveScreenshotUseCase';
import { GetRelatorioProvaUseCase } from '../../../application/antifraude/GetRelatorioProvaUseCase';

export class AntiFraudeController {
  constructor(
    private saveRespostaVersaoUseCase: SaveRespostaVersaoUseCase,
    private savePhotocamUseCase: SavePhotocamUseCase,
    private saveScreenshotUseCase: SaveScreenshotUseCase,
    private getRelatorioProvaUseCase: GetRelatorioProvaUseCase,
  ) {}

  async getRelatorio(req: Request, res: Response): Promise<void> {
    try {
      const relatorio = await this.getRelatorioProvaUseCase.execute(req.params.provaId as string);
      res.status(200).json(relatorio);
    } catch (err: any) {
      const status = err.message.includes('não encontrada') ? 404 : 500;
      res.status(status).json({ error: err.message });
    }
  }

  async saveResposta(req: Request, res: Response): Promise<void> {
    try {
      const {
        aluno_id,
        prova_id,
        questao_id,
        timestamp,
        horario,
        conteudo,
        colado,
        chars_colados,
      } = req.body;
      if (
        !aluno_id ||
        !prova_id ||
        !questao_id ||
        !timestamp ||
        !horario ||
        conteudo === undefined
      ) {
        res.status(400).json({
          error:
            'Campos obrigatórios: aluno_id, prova_id, questao_id, timestamp, horario, conteudo',
        });
        return;
      }
      const result = await this.saveRespostaVersaoUseCase.execute({
        alunoId: aluno_id,
        provaId: prova_id,
        questaoId: questao_id,
        timestamp,
        horario,
        conteudo,
        colado: colado === true,
        charsColados: Number(chars_colados) || 0,
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async savePhotocam(req: Request, res: Response): Promise<void> {
    try {
      const { aluno_id, prova_id, questao_id, timestamp, horario, imagem_base64 } = req.body;
      if (!aluno_id || !prova_id || !questao_id || !timestamp || !horario || !imagem_base64) {
        res.status(400).json({
          error:
            'Campos obrigatórios: aluno_id, prova_id, questao_id, timestamp, horario, imagem_base64',
        });
        return;
      }
      const result = await this.savePhotocamUseCase.execute({
        alunoId: aluno_id,
        provaId: prova_id,
        questaoId: questao_id,
        timestamp,
        horario,
        imagemBase64: imagem_base64,
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveScreenshot(req: Request, res: Response): Promise<void> {
    try {
      const { aluno_id, prova_id, questao_id, timestamp, horario, screenshot_base64 } = req.body;
      if (!aluno_id || !prova_id || !questao_id || !timestamp || !horario || !screenshot_base64) {
        res.status(400).json({
          error:
            'Campos obrigatórios: aluno_id, prova_id, questao_id, timestamp, horario, screenshot_base64',
        });
        return;
      }
      const result = await this.saveScreenshotUseCase.execute({
        alunoId: aluno_id,
        provaId: prova_id,
        questaoId: questao_id,
        timestamp,
        horario,
        screenshotBase64: screenshot_base64,
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
