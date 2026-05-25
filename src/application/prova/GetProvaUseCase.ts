import { IProvaRepository } from '../../domain/IProvaRepository';
import { Prova } from '../../domain/Prova';
import { Questao } from '../../domain/Questao';

interface GetProvaOutput {
  prova: Prova;
  questoes: Questao[];
}

export class GetProvaUseCase {
  constructor(private provaRepository: IProvaRepository) {}

  async execute(provaId: string, alunoId: string): Promise<GetProvaOutput> {
    const result = await this.provaRepository.findWithQuestoes(provaId);
    if (!result) throw new Error('Prova não encontrada');

    const matriculado = await this.provaRepository.isAlunoMatriculado(alunoId, provaId);
    if (!matriculado) throw new Error('Aluno não matriculado nesta prova');

    const now = new Date();
    if (now < result.prova.dataInicio) throw new Error('Prova ainda não iniciou');
    if (now > result.prova.dataFim) throw new Error('Prova já encerrada');

    return result;
  }
}
