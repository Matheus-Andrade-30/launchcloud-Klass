import { IProvaRepository, ProvaComInicio } from '../../domain/IProvaRepository';

export class ListProvasByAlunoUseCase {
  constructor(private provaRepository: IProvaRepository) {}

  async execute(alunoId: string): Promise<ProvaComInicio[]> {
    return this.provaRepository.findProvasByAlunoId(alunoId);
  }
}
