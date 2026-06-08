import { randomUUID } from 'crypto';
import { Questao } from '../../domain/Questao';
import { IQuestaoRepository } from '../../domain/IQuestaoRepository';
import { IProvaRepository } from '../../domain/IProvaRepository';
import { IUserRepository } from '../../domain/IUserRepository';

interface CreateQuestaoInput {
  professorId: string;
  provaId: string;
  enunciado: string;
  tipo: 'dissertativa' | 'multipla_escolha';
  pontuacao: number;
  ordem: number;
  opcoes?: string[];
}

export class CreateQuestaoUseCase {
  constructor(
    private questaoRepository: IQuestaoRepository,
    private provaRepository: IProvaRepository,
    private userRepository: IUserRepository,
  ) {}

  async execute(input: CreateQuestaoInput): Promise<Questao> {
    const professor = await this.userRepository.findById(input.professorId);
    if (!professor || professor.role !== 'teacher')
      throw new Error('Apenas professores podem criar questões');

    const prova = await this.provaRepository.findById(input.provaId);
    if (!prova) throw new Error('Prova não encontrada');
    if (prova.professorId !== input.professorId)
      throw new Error('Sem permissão para editar esta prova');

    const opcoes = input.tipo === 'multipla_escolha' && input.opcoes?.length ? input.opcoes : null;

    const questao = new Questao(
      randomUUID(),
      input.provaId,
      input.enunciado,
      input.tipo,
      input.pontuacao,
      input.ordem,
      new Date(),
      opcoes,
    );

    await this.questaoRepository.create(questao);
    return questao;
  }
}
