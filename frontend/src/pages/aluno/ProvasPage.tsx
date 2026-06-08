import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock, Play, CheckCircle, RotateCcw } from 'lucide-react';
import { listProvasByAluno } from '@/api/provas';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDateTime, formatMinutes } from '@/lib/utils';
import type { Prova } from '@/types';

type ProvaStatus = 'agendada' | 'ativa' | 'encerrada';

function getStatus(prova: Prova, now: Date): ProvaStatus {
  if (now >= new Date(prova.dataFim)) return 'encerrada';
  if (now >= new Date(prova.dataInicio)) return 'ativa';
  return 'agendada';
}

export default function AlunoProvas() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: provas, isLoading } = useQuery({
    queryKey: ['provas-aluno', user?.id],
    queryFn: () => listProvasByAluno(user!.id),
    enabled: !!user?.id,
  });

  if (isLoading) return <PageSpinner />;

  const now = new Date();
  const lista = provas ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minhas Provas</h1>
        <p className="text-sm text-gray-500">{lista.length} prova(s) disponível(eis)</p>
      </div>

      {lista.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-16">
          <ClipboardList size={32} className="mb-3 text-gray-300" />
          <p className="text-gray-400">Nenhuma prova disponível no momento.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {lista.map((p) => {
            const status = getStatus(p, now);
            const ativa = status === 'ativa';
            const concluida = !!p.finalizadoEm;
            return (
              <Card key={p.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.titulo}</h3>
                      <div className="mt-2 space-y-1 text-xs text-gray-500">
                        <p>Início: {formatDateTime(p.dataInicio)}</p>
                        <p>Fim: {formatDateTime(p.dataFim)}</p>
                        <p className="flex items-center gap-1">
                          <Clock size={12} />
                          Duração: {formatMinutes(p.duracaoMinutos)}
                        </p>
                      </div>
                    </div>
                    {concluida ? (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle size={12} /> Concluída
                      </Badge>
                    ) : (
                      <Badge
                        variant={
                          status === 'ativa' ? 'success' : status === 'agendada' ? 'secondary' : 'destructive'
                        }
                      >
                        {status === 'ativa' ? 'Ativa' : status === 'agendada' ? 'Agendada' : 'Encerrada'}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {concluida
                        ? `Entregue em ${formatDateTime(p.finalizadoEm!)}`
                        : status === 'agendada'
                          ? 'Disponível a partir do horário de início'
                          : status === 'encerrada'
                            ? 'Janela de realização encerrada'
                            : 'Disponível agora'}
                    </span>
                    {concluida ? (
                      <Button
                        size="sm"
                        variant="outline"
                        title="Refaz a prova em modo treino — não altera sua entrega nem o resultado final"
                        onClick={() => navigate(`/aluno/prova/${p.id}?treino=1`)}
                      >
                        <RotateCcw size={14} />
                        Fazer novamente (treino)
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={!ativa}
                        onClick={() => navigate(`/aluno/prova/${p.id}`)}
                      >
                        <Play size={14} />
                        Iniciar prova
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
