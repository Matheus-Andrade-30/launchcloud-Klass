import { Request, Response } from 'express';
import { CreateMaterialUseCase } from '../../../application/material/CreateMaterialUseCase';
import { ListMaterialsUseCase } from '../../../application/material/ListMaterialsUseCase';
import { ListMaterialsByClassUseCase } from '../../../application/material/ListMaterialsByClassUseCase';
import { GetMaterialUseCase } from '../../../application/material/GetMaterialUseCase';

export class MaterialController {
  constructor(
    private createMaterialUseCase: CreateMaterialUseCase,
    private listMaterialsUseCase: ListMaterialsUseCase,
    private listMaterialsByClassUseCase: ListMaterialsByClassUseCase,
    private getMaterialUseCase: GetMaterialUseCase,
  ) {}

  async upload(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'File is required' });
        return;
      }
      const { title, description, classId, uploadedBy } = req.body as {
        title: string;
        description: string;
        classId: string;
        uploadedBy: string;
      };
      const material = await this.createMaterialUseCase.execute({
        title,
        description,
        classId,
        uploadedBy,
        fileBuffer: file.buffer,
        contentType: file.mimetype,
        originalName: file.originalname,
      });
      res.status(201).json(material);
    } catch (error) {
      const err = error as Error;
      const status = err.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: err.message });
    }
  }

  async list(_req: Request, res: Response): Promise<void> {
    const materials = await this.listMaterialsUseCase.execute();
    res.status(200).json(materials);
  }

  async listByClass(req: Request, res: Response): Promise<void> {
    try {
      const materials = await this.listMaterialsByClassUseCase.execute(
        req.params.classId as string,
      );
      res.status(200).json(materials);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const material = await this.getMaterialUseCase.execute(req.params.id as string);
      res.status(200).json(material);
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  }
}
