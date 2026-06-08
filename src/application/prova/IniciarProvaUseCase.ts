import { IProvaRepository } from '../../domain/IProvaRepository';

interface IniciarProvaInput {
  provaId: string;
  alunoId: string;
}

export class IniciarProvaUseCase {
  constructor(private provaRepository: IProvaRepository) {}

  async execute(input: IniciarProvaInput): Promise<{ iniciadoEm: string | null }> {
    const matriculado = await this.provaRepository.isAlunoMatriculado(input.alunoId, input.provaId);
    if (!matriculado) throw new Error('Aluno não matriculado nesta prova');

    await this.provaRepository.marcarInicio(input.provaId, input.alunoId);

    const matricula = await this.provaRepository.getMatricula(input.provaId, input.alunoId);
    return { iniciadoEm: matricula ? matricula.iniciadoEm : null };
  }
}
