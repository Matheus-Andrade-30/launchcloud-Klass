import { IProvaRepository } from '../../domain/IProvaRepository';

interface FinalizarProvaInput {
  provaId: string;
  alunoId: string;
}

export class FinalizarProvaUseCase {
  constructor(private provaRepository: IProvaRepository) {}

  async execute(input: FinalizarProvaInput): Promise<{ finalizadoEm: string | null }> {
    const matriculado = await this.provaRepository.isAlunoMatriculado(input.alunoId, input.provaId);
    if (!matriculado) throw new Error('Aluno não matriculado nesta prova');

    await this.provaRepository.marcarFim(input.provaId, input.alunoId);

    const matricula = await this.provaRepository.getMatricula(input.provaId, input.alunoId);
    return { finalizadoEm: matricula ? matricula.finalizadoEm : null };
  }
}
