import type { Prova, Questao, QuestaoTipo } from '@/types';
import { provaStore, questaoStore, uuid } from '@/lib/localStore';

export interface CreateProvaPayload {
  titulo: string;
  professorId: string;
  dataInicio: string;
  dataFim: string;
  duracaoMinutos: number;
}

export interface CreateQuestaoPayload {
  provaId: string;
  enunciado: string;
  tipo: QuestaoTipo;
  pontuacao: number;
  ordem: number;
  opcoes?: string[];
}

export async function getProva(provaId: string, _alunoId: string): Promise<Prova> {
  const prova = provaStore.findById(provaId);
  if (!prova) throw new Error('Prova não encontrada');
  const questoes = questaoStore.list().filter((q) => q.provaId === provaId).sort((a, b) => a.ordem - b.ordem);
  return { ...prova, questoes };
}

export async function createProva(payload: CreateProvaPayload): Promise<Prova> {
  return provaStore.create({ id: uuid(), ...payload, createdAt: new Date().toISOString() });
}

export async function matricularAlunoProva(_provaId: string, _alunoId: string): Promise<void> {
  // local store: noop (sem tabela provas_alunos no frontend)
}

export async function createQuestao(payload: CreateQuestaoPayload): Promise<Questao> {
  return questaoStore.create({ id: uuid(), ...payload, createdAt: new Date().toISOString() });
}

export async function updateQuestao(id: string, payload: Partial<CreateQuestaoPayload>): Promise<Questao> {
  return questaoStore.update(id, payload);
}
