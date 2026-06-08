import type { RelatorioProva } from '@/types';
import api from './client';

function toEpochMs(timestamp: string | number): number {
  if (typeof timestamp === 'number') return timestamp;
  const parsed = Date.parse(timestamp);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

export interface SaveRespostaPayload {
  aluno_id: string;
  prova_id: string;
  questao_id: string;
  timestamp: string | number;
  horario: string;
  conteudo: string;
  colado?: boolean;
  chars_colados?: number;
}

export interface SavePhotocamPayload {
  aluno_id: string;
  prova_id: string;
  questao_id: string;
  timestamp: string | number;
  horario: string;
  imagem_base64: string;
}

export interface SaveScreenshotPayload {
  aluno_id: string;
  prova_id: string;
  questao_id: string;
  timestamp: string | number;
  horario: string;
  screenshot_base64: string;
}

export async function saveRespostaVersao(payload: SaveRespostaPayload): Promise<void> {
  await api.post('/antifraude/respostas/versoes', {
    aluno_id: payload.aluno_id,
    prova_id: payload.prova_id,
    questao_id: payload.questao_id,
    timestamp: toEpochMs(payload.timestamp),
    horario: payload.horario,
    conteudo: payload.conteudo,
    colado: payload.colado ?? false,
    chars_colados: payload.chars_colados ?? 0,
  });
}

export async function savePhotocam(payload: SavePhotocamPayload): Promise<void> {
  await api.post('/antifraude/telemetria/photocam', {
    aluno_id: payload.aluno_id,
    prova_id: payload.prova_id,
    questao_id: payload.questao_id,
    timestamp: toEpochMs(payload.timestamp),
    horario: payload.horario,
    imagem_base64: payload.imagem_base64,
  });
}

export async function saveScreenshot(payload: SaveScreenshotPayload): Promise<void> {
  await api.post('/antifraude/telemetria/screenshot', {
    aluno_id: payload.aluno_id,
    prova_id: payload.prova_id,
    questao_id: payload.questao_id,
    timestamp: toEpochMs(payload.timestamp),
    horario: payload.horario,
    screenshot_base64: payload.screenshot_base64,
  });
}

export async function getRelatorio(provaId: string): Promise<RelatorioProva> {
  const { data } = await api.get<RelatorioProva>(`/antifraude/relatorio/${provaId}`);
  return data;
}
