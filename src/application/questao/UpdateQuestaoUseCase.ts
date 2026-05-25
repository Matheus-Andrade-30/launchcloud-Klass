import { IQuestaoRepository } from '../../domain/IQuestaoRepository';
import { IProvaRepository } from '../../domain/IProvaRepository';
import { IUserRepository } from '../../domain/IUserRepository';

interface UpdateQuestaoInput {
  questaoId: string;
  professorId: string;
  enunciado?: string;
  pontuacao?: number;
  ordem?: number;
}

export class UpdateQuestaoUseCase {
  constructor(
    private questaoRepository: IQuestaoRepository,
    private provaRepository: IProvaRepository,
    private userRepository: IUserRepository,
  ) {}

  async execute(input: UpdateQuestaoInput): Promise<void> {
    const professor = await this.userRepository.findById(input.professorId);
    if (!professor || professor.role !== 'teacher') throw new Error('Apenas professores podem editar questões');

    const questao = await this.questaoRepository.findById(input.questaoId);
    if (!questao) throw new Error('Questão não encontrada');

    const prova = await this.provaRepository.findById(questao.provaId);
    if (!prova || prova.professorId !== input.professorId) throw new Error('Sem permissão para editar esta questão');

    await this.questaoRepository.update(input.questaoId, {
      enunciado: input.enunciado,
      pontuacao: input.pontuacao,
      ordem: input.ordem,
    });
  }
}
