import type { RelatorioProva } from '@/types';

// Local-only anti-fraud: persist to localStorage, no backend needed

const PREFIX = 'klass_af_';

function appendLog(key: string, entry: object) {
  const raw = localStorage.getItem(PREFIX + key);
  const arr: object[] = raw ? JSON.parse(raw) : [];
  arr.push(entry);
  localStorage.setItem(PREFIX + key, JSON.stringify(arr));
}

export interface SaveRespostaPayload {
  aluno_id: string;
  prova_id: string;
  questao_id: string;
  timestamp: string;
  horario: string;
  conteudo: string;
}

export interface SavePhotocamPayload {
  aluno_id: string;
  prova_id: string;
  questao_id: string;
  timestamp: string;
  horario: string;
  imagem_base64: string;
}

export interface SaveScreenshotPayload {
  aluno_id: string;
  prova_id: string;
  questao_id: string;
  timestamp: string;
  horario: string;
  screenshot_base64: string;
}

export async function saveRespostaVersao(payload: SaveRespostaPayload): Promise<void> {
  appendLog(`respostas_${payload.prova_id}`, payload);
}

export async function savePhotocam(payload: SavePhotocamPayload): Promise<void> {
  // Store only metadata (skip base64 to avoid quota issues)
  appendLog(`photocam_${payload.prova_id}`, {
    aluno_id: payload.aluno_id,
    questao_id: payload.questao_id,
    timestamp: payload.timestamp,
    horario: payload.horario,
  });
}

export async function saveScreenshot(payload: SaveScreenshotPayload): Promise<void> {
  appendLog(`screenshot_${payload.prova_id}`, {
    aluno_id: payload.aluno_id,
    questao_id: payload.questao_id,
    timestamp: payload.timestamp,
    horario: payload.horario,
  });
}

export async function getRelatorio(provaId: string): Promise<RelatorioProva> {
  const respostas: SaveRespostaPayload[] = JSON.parse(
    localStorage.getItem(`${PREFIX}respostas_${provaId}`) ?? '[]',
  );

  const alunosSet = new Set(respostas.map((r) => r.aluno_id));

  // Detect suspicious jumps: version where delta > 300 chars in one save
  const alertas = respostas
    .filter((r, i, arr) => {
      const prev = arr.slice(0, i).filter((p) => p.aluno_id === r.aluno_id && p.questao_id === r.questao_id).pop();
      if (!prev) return false;
      const delta = Math.abs(r.conteudo.length - prev.conteudo.length);
      return delta > 300;
    })
    .map((r) => ({
      alunoId: r.aluno_id,
      questaoId: r.questao_id,
      tipo: 'Salto de caracteres',
      detalhe: `Variação de mais de 300 caracteres entre versões`,
      timestamp: r.timestamp,
    }));

  return { provaId, totalAlunos: alunosSet.size, alertas };
}
