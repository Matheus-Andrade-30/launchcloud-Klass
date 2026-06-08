import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Camera,
  CameraOff,
  Clock,
  Shield,
  CheckCircle,
  AlertTriangle,
  Monitor,
  MonitorOff,
  RotateCcw,
} from 'lucide-react';
import { getProva, iniciarProva, finalizarProva } from '@/api/provas';
import { saveRespostaVersao, savePhotocam, saveScreenshot } from '@/api/antifraude';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSpinner } from '@/components/ui/spinner';
import { formatMinutes } from '@/lib/utils';
import type { Questao } from '@/types';

const WEBCAM_INTERVAL_MS = 60_000;
const SCREENSHOT_INTERVAL_MS = 60_000;
const ANSWER_DEBOUNCE_MS = 5_000;
// Colagem a partir deste tamanho e sinalizada como `colado` ao backend.
const PASTE_ALERT_THRESHOLD = 100;
const SCREENSHOT_JPEG_QUALITY = 0.6;
const WEBCAM_JPEG_QUALITY = 0.6;

function useCountdown(endTimeIso: string | null) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endTimeIso) return;
    function update() {
      const diff = Math.max(
        0,
        Math.floor((new Date(endTimeIso!).getTime() - Date.now()) / 1000),
      );
      setRemaining(diff);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTimeIso]);

  return remaining;
}

function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Remove o prefixo data:...;base64, deixando o base64 puro que o backend exige. */
function stripDataUrlPrefix(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl;
}

export default function AlunoProva() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Modo treino (?treino=1): refaz a prova sem persistir nada (nao altera o resultado).
  const isPractice = searchParams.get('treino') === '1';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const camStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const answerTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const startedRef = useRef(false);
  const submittedRef = useRef(false);

  const [camError, setCamError] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [telemetryLog, setTelemetryLog] = useState<string[]>([]);
  const [startedEm, setStartedEm] = useState<string | null>(null);

  const { data: prova, isLoading, isError } = useQuery({
    queryKey: ['prova', id, user?.id],
    queryFn: () => getProva(id!, user!.id),
    enabled: !!id && !!user,
  });

  const questoes: Questao[] = prova?.questoes ?? [];
  const alreadyFinalized = !!prova?.finalizadoEm;
  // So captura com prova carregada, nao finalizada e fora do treino.
  const canCapture = !!prova && !prova.finalizadoEm && !isPractice;

  // O cronometro reflete a duracao real por aluno: iniciadoEm + duracaoMinutos,
  // limitado pela dataFim da prova. Vem do backend, entao sobrevive a refresh.
  const endTime = (() => {
    if (!prova || !startedEm) return null;
    const fromStart = new Date(startedEm).getTime() + prova.duracaoMinutos * 60 * 1000;
    const dataFim = new Date(prova.dataFim).getTime();
    const limit = Number.isNaN(dataFim) ? fromStart : Math.min(fromStart, dataFim);
    return new Date(limit).toISOString();
  })();

  const remaining = useCountdown(endTime);

  function logTelemetry(msg: string) {
    setTelemetryLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  }

  const now = () => {
    // horario precisa ser uma data ISO completa: o backend faz new Date(horario)
    // e grava numa coluna DATETIME. Um horario tipo '13:45:30' viraria Invalid Date.
    const d = new Date();
    return { timestamp: d.toISOString(), horario: d.toISOString() };
  };

  const captureWebcam = useCallback(
    async (questaoId: string) => {
      if (submittedRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64 = stripDataUrlPrefix(canvas.toDataURL('image/jpeg', WEBCAM_JPEG_QUALITY));

      const { timestamp, horario } = now();
      try {
        await savePhotocam({
          aluno_id: user!.id,
          prova_id: id!,
          questao_id: questaoId,
          timestamp,
          horario,
          imagem_base64: base64,
        });
        logTelemetry('Webcam capturada');
      } catch {
        logTelemetry('Erro ao salvar webcam');
      }
    },
    [id, user],
  );

  const captureScreenshot = useCallback(
    async (questaoId: string) => {
      if (submittedRef.current) return;
      const video = screenVideoRef.current;
      const canvas = screenCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const base64 = stripDataUrlPrefix(canvas.toDataURL('image/jpeg', SCREENSHOT_JPEG_QUALITY));

      const { timestamp, horario } = now();
      try {
        await saveScreenshot({
          aluno_id: user!.id,
          prova_id: id!,
          questao_id: questaoId,
          timestamp,
          horario,
          screenshot_base64: base64,
        });
        logTelemetry('Tela capturada');
      } catch {
        logTelemetry('Erro ao capturar tela');
      }
    },
    [id, user],
  );

  const saveAnswer = useCallback(
    async (
      questaoId: string,
      conteudo: string,
      paste?: { colado: boolean; charsColados: number },
    ) => {
      if (isPractice) {
        logTelemetry('Treino: resposta não enviada');
        return;
      }
      const { timestamp, horario } = now();
      try {
        await saveRespostaVersao({
          aluno_id: user!.id,
          prova_id: id!,
          questao_id: questaoId,
          timestamp,
          horario,
          conteudo,
          colado: paste?.colado ?? false,
          chars_colados: paste?.charsColados ?? 0,
        });
        logTelemetry(`Resposta salva (Q${questaoId.slice(-4)})`);
      } catch {
        logTelemetry('Erro ao salvar resposta');
      }
    },
    [id, user, isPractice],
  );

  // Inicia a tentativa (idempotente) e define o instante de inicio do cronometro.
  useEffect(() => {
    if (!prova || !id || !user || startedRef.current) return;
    // Prova finalizada nao reinicia, exceto em treino.
    if (prova.finalizadoEm && !isPractice) return;
    startedRef.current = true;

    if (isPractice) {
      setStartedEm(new Date().toISOString());
      logTelemetry('Modo treino iniciado (nada sera salvo)');
      return;
    }

    async function start() {
      try {
        const { iniciadoEm } = await iniciarProva(id!, user!.id);
        setStartedEm(iniciadoEm ?? prova!.iniciadoEm ?? new Date().toISOString());
        logTelemetry('Prova iniciada');
      } catch {
        // Em caso de falha usamos o iniciadoEm que veio no getProva (se houver).
        setStartedEm(prova!.iniciadoEm ?? new Date().toISOString());
        logTelemetry('Falha ao registrar inicio; usando horario local');
      }
    }
    start();
  }, [prova, id, user, isPractice]);

  // Webcam (getUserMedia).
  useEffect(() => {
    if (!canCapture) return;
    let cancelled = false;
    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        camStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        logTelemetry('Câmera iniciada');
      } catch {
        setCamError(true);
        logTelemetry('Câmera não disponível');
      }
    }
    startCam();
    return () => {
      cancelled = true;
      camStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [canCapture]);

  // Compartilhamento da TELA INTEIRA (getDisplayMedia), solicitado uma vez.
  useEffect(() => {
    if (!canCapture) return;
    let cancelled = false;
    async function startScreen() {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setScreenError('Captura de tela não suportada neste navegador.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        screenStreamRef.current = stream;

        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;
        await video.play().catch(() => undefined);
        screenVideoRef.current = video;

        // Se o usuario parar o compartilhamento, avisamos sem quebrar a prova.
        stream.getVideoTracks().forEach((track) => {
          track.addEventListener('ended', () => {
            setScreenError('Compartilhamento de tela interrompido. Reabra a prova para reativar.');
            screenVideoRef.current = null;
            screenStreamRef.current = null;
            logTelemetry('Compartilhamento de tela parado');
          });
        });

        setScreenError(null);
        logTelemetry('Compartilhamento de tela iniciado');
      } catch {
        setScreenError('Permissão de compartilhamento de tela negada.');
        logTelemetry('Compartilhamento de tela negado');
      }
    }
    startScreen();
    return () => {
      cancelled = true;
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenVideoRef.current = null;
    };
  }, [canCapture]);

  // Capturas periodicas (webcam + tela) a cada 1 minuto, com a questao atual.
  useEffect(() => {
    if (!questoes.length || !canCapture) return;
    const qId = questoes[currentQ]?.id ?? 'unknown';

    const camInterval = setInterval(() => captureWebcam(qId), WEBCAM_INTERVAL_MS);
    const screenshotInterval = setInterval(() => captureScreenshot(qId), SCREENSHOT_INTERVAL_MS);

    captureWebcam(qId);
    captureScreenshot(qId);

    return () => {
      clearInterval(camInterval);
      clearInterval(screenshotInterval);
    };
  }, [currentQ, questoes, captureWebcam, captureScreenshot, canCapture]);

  useEffect(() => {
    // Só finaliza quando o tempo REALMENTE acabou. Sem o "Date.now() >= endTime",
    // o auto-submit dispararia no primeiro render (remaining ainda no valor inicial
    // 0, antes do countdown calcular o tempo restante) e a prova encerraria na hora.
    if (!endTime || !prova || submittedRef.current) return;
    if (remaining === 0 && Date.now() >= new Date(endTime).getTime()) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, endTime]);

  function handleAnswerChange(questaoId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questaoId]: value }));

    if (answerTimers.current[questaoId]) clearTimeout(answerTimers.current[questaoId]);
    answerTimers.current[questaoId] = setTimeout(
      () => saveAnswer(questaoId, value),
      ANSWER_DEBOUNCE_MS,
    );
  }

  // Deteccao de colagem ao vivo: cola grande dispara salvamento imediato para
  // o backend registrar o salto (delta de caracteres) e marcar como suspeito.
  function handlePaste(
    questaoId: string,
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) {
    const pasted = event.clipboardData.getData('text');
    logTelemetry(`Colagem detectada (${pasted.length} caracteres)`);
    if (pasted.length > PASTE_ALERT_THRESHOLD) {
      // Conteudo resultante apos a colagem (textarea ainda nao atualizou o valor).
      const target = event.currentTarget;
      const current = answers[questaoId] ?? '';
      const next =
        current.slice(0, target.selectionStart ?? current.length) +
        pasted +
        current.slice(target.selectionEnd ?? current.length);
      if (answerTimers.current[questaoId]) clearTimeout(answerTimers.current[questaoId]);
      saveAnswer(questaoId, next, { colado: true, charsColados: pasted.length });
      logTelemetry('Colagem grande sinalizada ao monitoramento');
    }
  }

  function stopAllStreams() {
    camStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    camStreamRef.current = null;
    screenStreamRef.current = null;
    screenVideoRef.current = null;
  }

  async function handleSubmit() {
    if (submittedRef.current) return;
    submittedRef.current = true;

    // Encerra a camera e o compartilhamento de tela IMEDIATAMENTE ao finalizar
    // (antes de salvar respostas), para a barra de "compartilhando tela" sumir na hora.
    stopAllStreams();
    Object.values(answerTimers.current).forEach(clearTimeout);

    // Treino nao salva respostas nem finaliza a prova.
    if (!isPractice) {
      for (const [qId, answer] of Object.entries(answers)) {
        if (answer.trim()) await saveAnswer(qId, answer);
      }
      try {
        if (id && user) await finalizarProva(id, user.id);
      } catch {
        logTelemetry('Falha ao registrar finalizacao');
      }
    }
    setSubmitted(true);
  }

  if (isLoading) return <PageSpinner />;

  if (isError || !prova) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertTriangle size={48} className="mb-4 text-yellow-400" />
        <p className="text-lg font-semibold text-gray-700">Prova não encontrada ou acesso não autorizado.</p>
        <Button className="mt-6" onClick={() => navigate('/aluno')}>Voltar ao início</Button>
      </div>
    );
  }

  if (submitted || (alreadyFinalized && !isPractice)) {
    const practiceDone = submitted && isPractice;
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {practiceDone ? 'Treino concluído!' : submitted ? 'Prova Enviada!' : 'Prova já finalizada'}
        </h2>
        <p className="mt-2 text-gray-500">
          {practiceDone
            ? 'Nada foi salvo — sua entrega e o resultado final continuam intactos.'
            : submitted
              ? 'Suas respostas foram registradas com sucesso.'
              : 'Você já finalizou esta prova. Use "Fazer novamente (treino)" para praticar.'}
        </p>
        <Button className="mt-8" onClick={() => navigate('/aluno/provas')}>Voltar às provas</Button>
      </div>
    );
  }

  const q = questoes[currentQ];
  const isLast = currentQ === questoes.length - 1;
  const timeColor = remaining < 300 ? 'text-red-600' : remaining < 600 ? 'text-yellow-600' : 'text-gray-700';

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Main test area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Shield size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{prova.titulo}</p>
              <p className="text-xs text-gray-400">{questoes.length} questão(ões) · {formatMinutes(prova.duracaoMinutos)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-1.5 text-lg font-mono font-bold ${timeColor}`}>
              <Clock size={18} />
              {endTime ? formatCountdown(remaining) : '--:--'}
            </div>
            <Badge variant={camError ? 'destructive' : 'success'}>
              {camError ? <><CameraOff size={12} /> Sem câmera</> : <><Camera size={12} /> Monitorando</>}
            </Badge>
          </div>
        </div>

        {/* Question navigation */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-6 py-2">
          {questoes.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentQ(i)}
              className={`flex h-7 w-7 items-center justify-center rounded text-xs font-medium transition-colors ${
                i === currentQ
                  ? 'bg-blue-600 text-white'
                  : answers[questoes[i]?.id]
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question content */}
        <div className="flex-1 overflow-y-auto p-8">
          {isPractice && (
            <div className="mx-auto mb-4 flex max-w-2xl items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <RotateCcw size={16} />
              <span>
                <strong>Modo treino.</strong> Esta é uma repetição para praticar — nada é
                salvo e o monitoramento antifraude está desligado. Sua entrega e o resultado
                final não são alterados.
              </span>
            </div>
          )}
          {screenError && (
            <div className="mx-auto mb-4 flex max-w-2xl items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              <MonitorOff size={16} />
              <span>{screenError}</span>
            </div>
          )}
          {q ? (
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                    Questão {currentQ + 1}
                  </span>
                  <Badge variant="outline">
                    {q.tipo === 'dissertativa' ? 'Dissertativa' : 'Múltipla Escolha'}
                  </Badge>
                </div>
                <span className="text-sm text-gray-400">{q.pontuacao} pt(s)</span>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <p className="text-base leading-relaxed text-gray-800">{q.enunciado}</p>
              </div>

              {q.tipo === 'dissertativa' ? (
                <textarea
                  value={answers[q.id] ?? ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  onPaste={(e) => handlePaste(q.id, e)}
                  placeholder="Digite sua resposta aqui..."
                  rows={10}
                  className="w-full resize-none rounded-lg border border-gray-300 p-4 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <div className="space-y-2">
                  {(q.opcoes ?? ['Opção A', 'Opção B', 'Opção C', 'Opção D']).map((op, i) => (
                    <label
                      key={i}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                        answers[q.id] === op
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        value={op}
                        checked={answers[q.id] === op}
                        onChange={() => handleAnswerChange(q.id, op)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{op}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
                  disabled={currentQ === 0}
                >
                  Anterior
                </Button>
                {isLast ? (
                  <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle size={15} />
                    Finalizar Prova
                  </Button>
                ) : (
                  <Button onClick={() => setCurrentQ((p) => p + 1)}>Próxima</Button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-400">Nenhuma questão disponível.</p>
          )}
        </div>
      </div>

      {/* Right panel: webcam + log */}
      <div className="flex w-64 flex-col border-l border-gray-200 bg-white">
        {/* Webcam preview */}
        <div className="border-b border-gray-100 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Câmera</p>
          <div className="relative overflow-hidden rounded-lg bg-gray-900 aspect-video">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <canvas ref={screenCanvasRef} className="hidden" />
            {camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <CameraOff size={24} className="text-gray-500" />
                <p className="mt-1 text-xs text-gray-400">Câmera indisponível</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Capturas a cada 1 min
          </p>
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-gray-400">
            {screenError ? (
              <><MonitorOff size={12} className="text-yellow-500" /> Tela não compartilhada</>
            ) : (
              <><Monitor size={12} className="text-green-500" /> Tela compartilhada</>
            )}
          </div>
        </div>

        {/* Telemetry log */}
        <div className="flex-1 overflow-hidden p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Log de Monitoramento</p>
          <ul className="space-y-1 overflow-y-auto text-xs text-gray-500 max-h-64">
            {telemetryLog.map((entry, i) => (
              <li key={i} className="leading-relaxed">{entry}</li>
            ))}
            {telemetryLog.length === 0 && (
              <li className="text-gray-300">Aguardando eventos...</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
