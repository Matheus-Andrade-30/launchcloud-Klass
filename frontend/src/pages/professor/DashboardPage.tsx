import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Users, ClipboardList, ArrowRight } from 'lucide-react';
import { listClasses } from '@/api/classes';
import { listEnrollments } from '@/api/enrollments';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const { data: classes, isLoading } = useQuery({ queryKey: ['classes'], queryFn: listClasses });
  const { data: enrollments } = useQuery({ queryKey: ['enrollments'], queryFn: listEnrollments });

  const myClasses = classes?.filter((c) => c.teacherId === user?.id) ?? [];
  const myClassIds = new Set(myClasses.map((c) => c.id));
  const myEnrollments = enrollments?.filter((e) => myClassIds.has(e.classId)) ?? [];
  const activeEnrollments = myEnrollments.filter((e) => e.status === 'active');

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Olá, {user?.name?.split(' ')[0]}!</h1>
        <p className="mt-1 text-sm text-gray-500">Aqui está um resumo das suas turmas</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Minhas Turmas</p>
                <p className="text-2xl font-bold">{myClasses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Alunos Ativos</p>
                <p className="text-2xl font-bold">{activeEnrollments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <ClipboardList className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Matrículas</p>
                <p className="text-2xl font-bold">{myEnrollments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Minhas Turmas</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/professor/turmas">
              Ver todas <ArrowRight size={14} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {myClasses.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Nenhuma turma encontrada.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {myClasses.slice(0, 5).map((cls) => {
                const count = myEnrollments.filter((e) => e.classId === cls.id && e.status === 'active').length;
                return (
                  <li key={cls.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">{cls.title}</p>
                      <p className="text-xs text-gray-500">{cls.description} · Criada em {formatDate(cls.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{count} alunos</span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/professor/turmas/${cls.id}`}>Ver</Link>
                      </Button>
                    </div>
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
