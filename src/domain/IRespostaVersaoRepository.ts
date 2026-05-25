import { RespostaVersao } from './RespostaVersao';

export interface IRespostaVersaoRepository {
  findLastVersao(alunoId: string, provaId: string, questaoId: string): Promise<RespostaVersao | null>;
  findSuspeitosByProvaId(provaId: string): Promise<RespostaVersao[]>;
  create(versao: RespostaVersao): Promise<void>;
}
