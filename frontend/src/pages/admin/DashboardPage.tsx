import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, ClipboardList, GraduationCap } from 'lucide-react';
import { listUsers } from '@/api/users';
import { listClasses } from '@/api/classes';
import { listEnrollments } from '@/api/enrollments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: users, isLoading: loadingUsers } = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const { data: classes, isLoading: loadingClasses } = useQuery({ queryKey: ['classes'], queryFn: listClasses });
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: listEnrollments,
  });

  if (loadingUsers || loadingClasses || loadingEnrollments) return <PageSpinner />;

  const teachers = users?.filter((u) => u.role === 'teacher') ?? [];
  const students = users?.filter((u) => u.role === 'student') ?? [];
  const activeEnrollments = enrollments?.filter((e) => e.status === 'active') ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
        <p className="mt-1 text-sm text-gray-500">Visão geral da plataforma</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Alunos"
          value={students.length}
          icon={<GraduationCap className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Professores"
          value={teachers.length}
          icon={<Users className="h-6 w-6 text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          title="Turmas Ativas"
          value={classes?.length ?? 0}
          icon={<BookOpen className="h-6 w-6 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Matrículas Ativas"
          value={activeEnrollments.length}
          icon={<ClipboardList className="h-6 w-6 text-orange-600" />}
          color="bg-orange-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuários Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-100">
              {users?.slice(0, 5).map((u) => (
                <li key={u.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {u.role === 'teacher' ? 'Professor' : 'Aluno'}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Turmas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-100">
              {classes?.slice(0, 5).map((c) => (
                <li key={c.id} className="py-3">
                  <p className="font-medium text-gray-900">{c.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {c.description} · Criada em {formatDate(c.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
