import { Questao } from './Questao';

export interface IQuestaoRepository {
  findById(id: string): Promise<Questao | null>;
  findByProvaId(provaId: string): Promise<Questao[]>;
  create(questao: Questao): Promise<void>;
  update(id: string, data: Partial<Pick<Questao, 'enunciado' | 'pontuacao' | 'ordem'>>): Promise<void>;
}
