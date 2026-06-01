import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { getRelatorio } from '@/api/antifraude';
import { listUsers } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/utils';

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

  const alertas = relatorio.alertas ?? [];
  const suspeitos = new Set(alertas.map((a) => a.alunoId));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/professor/provas"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório Anti-Fraude</h1>
          <p className="text-sm text-gray-500">Prova ID: {id}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Alunos</p>
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
                <p className="text-sm text-gray-500">Alertas Gerados</p>
                <p className="text-2xl font-bold">{alertas.length}</p>
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
                <p className="text-sm text-gray-500">Alunos Suspeitos</p>
                <p className="text-2xl font-bold">{suspeitos.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-yellow-500" />
            Alertas de Comportamento Suspeito
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {alertas.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
              <p className="text-gray-500">Nenhuma irregularidade detectada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Tipo de Alerta</TableHead>
                  <TableHead>Detalhe</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Risco</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertas.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{getStudentName(a.alunoId)}</TableCell>
                    <TableCell>
                      <Badge variant="warning">{a.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500">{a.detalhe}</TableCell>
                    <TableCell className="text-gray-500">{formatDateTime(a.timestamp)}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">Alto</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
