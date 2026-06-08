import type { Prova, Questao, QuestaoTipo } from '@/types';
import api from './client';

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
  professorId?: string;
}

export interface UpdateQuestaoPayload {
  enunciado?: string;
  pontuacao?: number;
  ordem?: number;
  professorId?: string;
}

interface GetProvaResponse {
  prova: Prova;
  questoes: Questao[];
  iniciadoEm: string | null;
  finalizadoEm: string | null;
}

export async function getProva(provaId: string, alunoId: string): Promise<Prova> {
  const { data } = await api.get<GetProvaResponse>('/prova', {
    params: { prova_id: provaId, aluno_id: alunoId },
  });
  return {
    ...data.prova,
    questoes: data.questoes,
    iniciadoEm: data.iniciadoEm,
    finalizadoEm: data.finalizadoEm,
  };
}

export async function listProvasByAluno(alunoId: string): Promise<Prova[]> {
  const { data } = await api.get<Prova[]>(`/prova/aluno/${alunoId}`);
  return data;
}

export async function listProvasByProfessor(professorId: string): Promise<Prova[]> {
  const { data } = await api.get<Prova[]>(`/prova/professor/${professorId}`);
  return data;
}

export async function createProva(payload: CreateProvaPayload): Promise<Prova> {
  const { data } = await api.post<Prova>('/prova', payload);
  return data;
}

export async function createQuestao(payload: CreateQuestaoPayload): Promise<Questao> {
  const { data } = await api.post<Questao>('/prova/questoes', payload);
  return data;
}

export async function updateQuestao(id: string, payload: UpdateQuestaoPayload): Promise<void> {
  await api.put(`/prova/questoes/${id}`, payload);
}

export async function matricularAlunoProva(provaId: string, alunoId: string): Promise<void> {
  await api.post(`/prova/${provaId}/alunos`, { alunoId });
}

export async function iniciarProva(
  provaId: string,
  alunoId: string,
): Promise<{ iniciadoEm: string }> {
  const { data } = await api.post<{ iniciadoEm: string }>(`/prova/${provaId}/iniciar`, {
    alunoId,
  });
  return data;
}

export async function finalizarProva(
  provaId: string,
  alunoId: string,
): Promise<{ finalizadoEm: string | null }> {
  const { data } = await api.post<{ finalizadoEm: string | null }>(`/prova/${provaId}/finalizar`, {
    alunoId,
  });
  return data;
}
