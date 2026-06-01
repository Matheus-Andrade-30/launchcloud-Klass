import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookMarked, FileText, GraduationCap, ArrowRight } from 'lucide-react';
import { listEnrollments } from '@/api/enrollments';
import { listClasses } from '@/api/classes';
import { listGrades } from '@/api/grades';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';

export default function AlunoDashboard() {
  const { user } = useAuth();

  const { data: enrollments, isLoading } = useQuery({ queryKey: ['enrollments'], queryFn: listEnrollments });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: listClasses });
  const { data: grades } = useQuery({ queryKey: ['grades'], queryFn: listGrades });

  const myEnrollments = enrollments?.filter((e) => e.studentId === user?.id) ?? [];
  const myGrades = grades?.filter((g) => myEnrollments.some((e) => e.id === g.enrollmentId)) ?? [];
  const avgGrade = myGrades.length
    ? (myGrades.reduce((s, g) => s + g.grade, 0) / myGrades.length).toFixed(1)
    : '—';

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Olá, {user?.name?.split(' ')[0]}!</h1>
        <p className="mt-1 text-sm text-gray-500">Acompanhe seu desempenho acadêmico</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <BookMarked className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Turmas Matriculadas</p>
                <p className="text-2xl font-bold">{myEnrollments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Notas Registradas</p>
                <p className="text-2xl font-bold">{myGrades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <GraduationCap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Média Geral</p>
                <p className="text-2xl font-bold">{avgGrade}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Minhas Matrículas</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/aluno/turmas">Ver todas <ArrowRight size={14} /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {myEnrollments.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Você ainda não está matriculado em nenhuma turma.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {myEnrollments.slice(0, 5).map((e) => {
                const cls = classes?.find((c) => c.id === e.classId);
                return (
                  <li key={e.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">{cls?.title ?? 'Turma desconhecida'}</p>
                      <p className="text-xs text-gray-500">Matriculado em {formatDate(e.enrolledAt)}</p>
                    </div>
                    <Badge
                      variant={e.status === 'active' ? 'success' : e.status === 'completed' ? 'default' : 'destructive'}
                    >
                      {e.status === 'active' ? 'Ativa' : e.status === 'completed' ? 'Concluída' : 'Cancelada'}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
