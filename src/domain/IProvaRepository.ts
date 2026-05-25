import { Prova } from './Prova';
import { Questao } from './Questao';

export interface IProvaRepository {
  findById(id: string): Promise<Prova | null>;
  findWithQuestoes(id: string): Promise<{ prova: Prova; questoes: Questao[] } | null>;
  create(prova: Prova): Promise<void>;
  isAlunoMatriculado(alunoId: string, provaId: string): Promise<boolean>;
  matricularAluno(alunoId: string, provaId: string): Promise<void>;
}
