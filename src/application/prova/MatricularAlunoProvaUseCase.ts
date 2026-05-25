import { IProvaRepository } from '../../domain/IProvaRepository';
import { IUserRepository } from '../../domain/IUserRepository';

interface MatricularInput {
  provaId: string;
  alunoId: string;
}

export class MatricularAlunoProvaUseCase {
  constructor(
    private provaRepository: IProvaRepository,
    private userRepository: IUserRepository,
  ) {}

  async execute(input: MatricularInput): Promise<void> {
    const prova = await this.provaRepository.findById(input.provaId);
    if (!prova) throw new Error('Prova não encontrada');

    const aluno = await this.userRepository.findById(input.alunoId);
    if (!aluno) throw new Error('Aluno não encontrado');
    if (aluno.role !== 'student') throw new Error('Apenas alunos podem ser matriculados em provas');

    await this.provaRepository.matricularAluno(input.alunoId, input.provaId);
  }
}
