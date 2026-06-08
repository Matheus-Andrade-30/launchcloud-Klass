import { Prova } from './Prova';
import { Questao } from './Questao';

export interface ProvaComInicio {
  prova: Prova;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
}

export interface IProvaRepository {
  findById(id: string): Promise<Prova | null>;
  findWithQuestoes(id: string): Promise<{ prova: Prova; questoes: Questao[] } | null>;
  create(prova: Prova): Promise<void>;
  isAlunoMatriculado(alunoId: string, provaId: string): Promise<boolean>;
  matricularAluno(alunoId: string, provaId: string): Promise<void>;
  findProvasByAlunoId(alunoId: string): Promise<ProvaComInicio[]>;
  findProvasByProfessorId(professorId: string): Promise<Prova[]>;
  marcarInicio(provaId: string, alunoId: string): Promise<void>;
  marcarFim(provaId: string, alunoId: string): Promise<void>;
  getMatricula(
    provaId: string,
    alunoId: string,
  ): Promise<{ iniciadoEm: string | null; finalizadoEm: string | null } | null>;
}
