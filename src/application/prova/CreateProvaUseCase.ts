import { randomUUID } from 'crypto';
import { Prova } from '../../domain/Prova';
import { IProvaRepository } from '../../domain/IProvaRepository';
import { IUserRepository } from '../../domain/IUserRepository';

interface CreateProvaInput {
  professorId: string;
  titulo: string;
  dataInicio: string;
  dataFim: string;
  duracaoMinutos: number;
}

export class CreateProvaUseCase {
  constructor(
    private provaRepository: IProvaRepository,
    private userRepository: IUserRepository,
  ) {}

  async execute(input: CreateProvaInput): Promise<Prova> {
    const professor = await this.userRepository.findById(input.professorId);
    if (!professor || professor.role !== 'teacher')
      throw new Error('Apenas professores podem criar provas');

    const prova = new Prova(
      randomUUID(),
      input.titulo,
      input.professorId,
      new Date(input.dataInicio),
      new Date(input.dataFim),
      input.duracaoMinutos,
      new Date(),
    );

    await this.provaRepository.create(prova);
    return prova;
  }
}
