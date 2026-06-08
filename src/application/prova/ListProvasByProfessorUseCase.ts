import { IProvaRepository } from '../../domain/IProvaRepository';
import { Prova } from '../../domain/Prova';

export class ListProvasByProfessorUseCase {
  constructor(private provaRepository: IProvaRepository) {}

  async execute(professorId: string): Promise<Prova[]> {
    return this.provaRepository.findProvasByProfessorId(professorId);
  }
}
