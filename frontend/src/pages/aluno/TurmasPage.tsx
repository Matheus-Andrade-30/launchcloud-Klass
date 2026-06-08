import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, FileText, Download } from 'lucide-react';
import { listEnrollments } from '@/api/enrollments';
import { listClasses } from '@/api/classes';
import { listMaterialsByClass, getMaterialDownloadUrl } from '@/api/materials';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDateTime } from '@/lib/utils';

function ClassMaterials({ classId }: { classId: string }) {
  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials', classId],
    queryFn: () => listMaterialsByClass(classId),
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (isLoading) return <p className="text-xs text-gray-400">Carregando materiais...</p>;
  if (!materials?.length) return <p className="text-xs text-gray-400">Nenhum material disponível.</p>;

  async function handleDownload(materialId: string) {
    setDownloadingId(materialId);
    try {
      const url = await getMaterialDownloadUrl(materialId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      alert('Não foi possível baixar o material.');
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <ul className="mt-3 space-y-2">
      {materials.map((m) => (
        <li key={m.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <FileText size={14} className="flex-shrink-0 text-blue-500" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-800">{m.title}</p>
            <p className="text-xs text-gray-400">{m.contentType} · {formatDateTime(m.uploadedAt)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={downloadingId === m.id}
            onClick={() => handleDownload(m.id)}
            title="Baixar material"
          >
            <Download size={14} />
            {downloadingId === m.id ? 'Baixando...' : 'Baixar'}
          </Button>
        </li>
      ))}
    </ul>
  );
}

export default function AlunoTurmas() {
  const { user } = useAuth();
  const { data: enrollments, isLoading } = useQuery({ queryKey: ['enrollments'], queryFn: listEnrollments });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: listClasses });

  const myEnrollments = enrollments?.filter((e) => e.studentId === user?.id) ?? [];
  const active = myEnrollments.filter((e) => e.status === 'active');
  const completed = myEnrollments.filter((e) => e.status === 'completed');

  if (isLoading) return <PageSpinner />;

  function EnrollmentCard({ enrollmentId, classId }: { enrollmentId: string; classId: string }) {
    const cls = classes?.find((c) => c.id === classId);
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">{cls?.title ?? 'Turma desconhecida'}</CardTitle>
              <p className="mt-1 text-sm text-gray-500">{cls?.description}</p>
            </div>
            <BookOpen size={18} className="flex-shrink-0 text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <ClassMaterials classId={classId} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minhas Turmas</h1>
        <p className="text-sm text-gray-500">{myEnrollments.length} matrícula(s)</p>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Ativas ({active.length})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {active.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Nenhuma turma ativa.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {active.map((e) => (
                <EnrollmentCard key={e.id} enrollmentId={e.id} classId={e.classId} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completed.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Nenhuma turma concluída.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {completed.map((e) => (
                <EnrollmentCard key={e.id} enrollmentId={e.id} classId={e.classId} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
