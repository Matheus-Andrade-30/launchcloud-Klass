import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Camera, CameraOff, Clock, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { toPng } from 'html-to-image';
import { getProva } from '@/api/provas';
import { saveRespostaVersao, savePhotocam, saveScreenshot } from '@/api/antifraude';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSpinner } from '@/components/ui/spinner';
import { formatMinutes } from '@/lib/utils';
import type { Questao } from '@/types';

const WEBCAM_INTERVAL_MS = 30_000;
const SCREENSHOT_INTERVAL_MS = 60_000;
const ANSWER_DEBOUNCE_MS = 5_000;

function useCountdown(endTimeIso: string) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    function update() {
      const diff = Math.max(0, Math.floor((new Date(endTimeIso).getTime() - Date.now()) / 1000));
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

export default function AlunoProva() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const testAreaRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const answerTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [camError, setCamError] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [telemetryLog, setTelemetryLog] = useState<string[]>([]);

  const { data: prova, isLoading, isError } = useQuery({
    queryKey: ['prova', id, user?.id],
    queryFn: () => getProva(id!, user!.id),
    enabled: !!id && !!user,
  });

  const questoes: Questao[] = prova?.questoes ?? [];
  const endTime = prova
    ? new Date(
        new Date(prova.dataInicio).getTime() + prova.duracaoMinutos * 60 * 1000,
      ).toISOString()
    : new Date(Date.now() + 3600_000).toISOString();

  const remaining = useCountdown(endTime);

  function logTelemetry(msg: string) {
    setTelemetryLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  }

  const now = () => {
    const d = new Date();
    return { timestamp: d.toISOString(), horario: d.toLocaleTimeString('pt-BR') };
  };

  const captureWebcam = useCallback(async (questaoId: string) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];

    const { timestamp, horario } = now();
    try {
      await savePhotocam({ aluno_id: user!.id, prova_id: id!, questao_id: questaoId, timestamp, horario, imagem_base64: base64 });
      logTelemetry('Webcam capturada');
    } catch {
      logTelemetry('Erro ao salvar webcam');
    }
  }, [id, user]);

  const captureScreenshot = useCallback(async (questaoId: string) => {
    if (!testAreaRef.current) return;
    try {
      const dataUrl = await toPng(testAreaRef.current, { quality: 0.7, pixelRatio: 1 });
      const base64 = dataUrl.split(',')[1];
      const { timestamp, horario } = now();
      await saveScreenshot({ aluno_id: user!.id, prova_id: id!, questao_id: questaoId, timestamp, horario, screenshot_base64: base64 });
      logTelemetry('Screenshot capturado');
    } catch {
      logTelemetry('Erro ao capturar screenshot');
    }
  }, [id, user]);

  const saveAnswer = useCallback(async (questaoId: string, conteudo: string) => {
    const { timestamp, horario } = now();
    try {
      await saveRespostaVersao({ aluno_id: user!.id, prova_id: id!, questao_id: questaoId, timestamp, horario, conteudo });
      logTelemetry(`Resposta salva (Q${questaoId.slice(-4)})`);
    } catch {
      logTelemetry('Erro ao salvar resposta');
    }
  }, [id, user]);

  useEffect(() => {
    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        logTelemetry('Câmera iniciada');
      } catch {
        setCamError(true);
        logTelemetry('Câmera não disponível');
      }
    }
    startCam();
    return () => { streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  useEffect(() => {
    if (!questoes.length) return;
    const qId = questoes[currentQ]?.id ?? 'unknown';

    const camInterval = setInterval(() => captureWebcam(qId), WEBCAM_INTERVAL_MS);
    const screenshotInterval = setInterval(() => captureScreenshot(qId), SCREENSHOT_INTERVAL_MS);

    captureWebcam(qId);
    captureScreenshot(qId);

    return () => {
      clearInterval(camInterval);
      clearInterval(screenshotInterval);
    };
  }, [currentQ, questoes, captureWebcam, captureScreenshot]);

  useEffect(() => {
    if (remaining === 0 && prova && !submitted) {
      handleSubmit();
    }
  }, [remaining]);

  function handleAnswerChange(questaoId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questaoId]: value }));

    if (answerTimers.current[questaoId]) clearTimeout(answerTimers.current[questaoId]);
    answerTimers.current[questaoId] = setTimeout(() => saveAnswer(questaoId, value), ANSWER_DEBOUNCE_MS);
  }

  async function handleSubmit() {
    for (const [qId, answer] of Object.entries(answers)) {
      if (answer.trim()) await saveAnswer(qId, answer);
    }
    Object.values(answerTimers.current).forEach(clearTimeout);
    streamRef.current?.getTracks().forEach((t) => t.stop());
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

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
          <CheckCircle size={48} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Prova Enviada!</h2>
        <p className="mt-2 text-gray-500">Suas respostas foram registradas com sucesso.</p>
        <Button className="mt-8" onClick={() => navigate('/aluno')}>Voltar ao início</Button>
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
              {formatCountdown(remaining)}
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
        <div ref={testAreaRef} className="flex-1 overflow-y-auto p-8">
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
            {camError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <CameraOff size={24} className="text-gray-500" />
                <p className="mt-1 text-xs text-gray-400">Câmera indisponível</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-400 text-center">
            Capturas a cada 30s
          </p>
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
