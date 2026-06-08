import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Users,
  Camera,
  ClipboardPaste,
} from 'lucide-react';
import { getRelatorio } from '@/api/antifraude';
import { listUsers } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/utils';
import type { NivelRisco } from '@/types';

const riscoBadge: Record<NivelRisco, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  baixo: { label: 'Baixo', variant: 'success' },
  medio: { label: 'Médio', variant: 'warning' },
  alto: { label: 'Alto', variant: 'destructive' },
};

function eventoLabel(tipo: string): { label: string; icon: typeof Camera } {
  switch (tipo) {
    case 'cola_detectada':
      return { label: 'Colagem de texto', icon: ClipboardPaste };
    case 'rosto_nao_detectado':
    case 'multiplos_rostos':
    case 'rosto_divergente':
      return { label: tipo.replace(/_/g, ' '), icon: Camera };
    default:
      return { label: tipo.replace(/_/g, ' '), icon: AlertTriangle };
  }
}

export default function ProfessorRelatorio() {
  const { id } = useParams<{ id: string }>();

  const { data: relatorio, isLoading, isError } = useQuery({
    queryKey: ['relatorio', id],
    queryFn: () => getRelatorio(id!),
    enabled: !!id,
  });

  const { data: users } = useQuery({ queryKey: ['users'], queryFn: listUsers });

  function getStudentName(alunoId: string) {
    return users?.find((u) => u.id === alunoId)?.name ?? alunoId;
  }

  if (isLoading) return <PageSpinner />;

  if (isError || !relatorio) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/professor/provas"><ArrowLeft size={16} /> Voltar</Link>
        </Button>
        <div className="flex flex-col items-center py-16 text-gray-400">
          <ShieldAlert size={48} className="mb-4 text-gray-300" />
          <p>Relatório não disponível para esta prova.</p>
          <p className="text-xs mt-1">Os dados de telemetria podem não ter sido coletados ainda.</p>
        </div>
      </div>
    );
  }

  const alunos = relatorio.alunos ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/professor/provas"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Anti-Fraude</h1>
          <p className="text-sm text-gray-500">
            {relatorio.titulo} · gerado em {formatDateTime(relatorio.geradoEm)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Alunos com Telemetria</p>
                <p className="text-2xl font-bold">{relatorio.totalAlunos}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Alunos com Alerta</p>
                <p className="text-2xl font-bold">{relatorio.alunosComAlerta}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Risco Alto</p>
                <p className="text-2xl font-bold">
                  {alunos.filter((a) => a.nivelRisco === 'alto').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {alunos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
            <p className="text-gray-500">Nenhuma irregularidade detectada.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alunos.map((aluno) => {
            const risco = riscoBadge[aluno.nivelRisco];
            return (
              <Card key={aluno.alunoId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShieldAlert size={18} className="text-gray-400" />
                      {getStudentName(aluno.alunoId)}
                    </span>
                    <Badge variant={risco.variant}>Risco {risco.label}</Badge>
                  </CardTitle>
                  <div className="flex flex-wrap gap-3 pt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <ClipboardPaste size={13} /> {aluno.totalVersoesSuspeitas} colagem(ns)
                    </span>
                    <span className="flex items-center gap-1">
                      <Camera size={13} /> {aluno.totalFotosComFlags} foto(s) com flag
                    </span>
                    <span className="flex items-center gap-1">
                      <Camera size={13} /> {aluno.totalScreenshots} screenshot(s)
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {aluno.eventos.length === 0 ? (
                    <p className="px-6 pb-6 text-sm text-gray-400">Sem eventos detalhados.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo de Alerta</TableHead>
                          <TableHead>Questão</TableHead>
                          <TableHead>Detalhe</TableHead>
                          <TableHead>Horário</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aluno.eventos.map((ev, i) => {
                          const meta = eventoLabel(ev.tipo);
                          const Icon = meta.icon;
                          return (
                            <TableRow key={`${ev.s3Key}-${i}`}>
                              <TableCell>
                                <Badge variant="warning" className="gap-1">
                                  <Icon size={12} />
                                  {meta.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-500">{ev.questaoId}</TableCell>
                              <TableCell className="text-gray-500">
                                {Object.entries(ev.detalhes)
                                  .filter(([, v]) => v !== null && v !== undefined)
                                  .map(([k, v]) => `${k}: ${String(v)}`)
                                  .join(' · ') || '—'}
                              </TableCell>
                              <TableCell className="text-gray-500">{formatDateTime(ev.horario)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
