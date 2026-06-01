import { useQuery } from '@tanstack/react-query';
import { Award, FileCheck } from 'lucide-react';
import { listEnrollments } from '@/api/enrollments';
import { listGradesByEnrollment } from '@/api/grades';
import { listClasses } from '@/api/classes';
import { generateCertificate } from '@/api/certificates';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

function EnrollmentGradeRow({
  enrollmentId,
  classTitle,
  status,
}: {
  enrollmentId: string;
  classTitle: string;
  status: string;
}) {
  const [certLoading, setCertLoading] = useState(false);
  const [certGenerated, setCertGenerated] = useState(false);

  const { data: grades } = useQuery({
    queryKey: ['grades-enrollment', enrollmentId],
    queryFn: () => listGradesByEnrollment(enrollmentId),
  });

  const grade = grades?.[grades.length - 1];

  async function handleCert() {
    setCertLoading(true);
    try {
      await generateCertificate(enrollmentId);
      setCertGenerated(true);
    } catch {
      alert('Erro ao gerar certificado.');
    } finally {
      setCertLoading(false);
    }
  }

  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{classTitle}</h3>
            {grade ? (
              <div className="mt-2 flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Nota</p>
                  <p
                    className={`text-2xl font-bold ${
                      grade.grade >= 7 ? 'text-green-600' : grade.grade >= 5 ? 'text-yellow-600' : 'text-red-600'
                    }`}
                  >
                    {grade.grade.toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Frequência</p>
                  <p className="text-2xl font-bold text-gray-700">{grade.attendance}%</p>
                </div>
                {grade.notes && (
                  <div>
                    <p className="text-xs text-gray-400">Observação</p>
                    <p className="text-sm text-gray-600">{grade.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">Aguardando lançamento de nota</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant={status === 'completed' ? 'success' : status === 'active' ? 'secondary' : 'destructive'}>
              {status === 'completed' ? 'Concluída' : status === 'active' ? 'Ativa' : 'Cancelada'}
            </Badge>
            {grade && grade.grade >= 7 && status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                disabled={certLoading}
                onClick={handleCert}
                className={certGenerated ? 'border-green-500 text-green-600' : ''}
              >
                {certGenerated ? (
                  <><FileCheck size={14} /> Emitido</>
                ) : certLoading ? (
                  'Gerando...'
                ) : (
                  <><Award size={14} /> Certificado</>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AlunoNotas() {
  const { user } = useAuth();
  const { data: enrollments, isLoading } = useQuery({ queryKey: ['enrollments'], queryFn: listEnrollments });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: listClasses });

  const myEnrollments = enrollments?.filter((e) => e.studentId === user?.id) ?? [];

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notas & Certificados</h1>
        <p className="text-sm text-gray-500">Acompanhe seu desempenho por turma</p>
      </div>

      {myEnrollments.length === 0 ? (
        <p className="py-16 text-center text-gray-400">Nenhuma matrícula encontrada.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myEnrollments.map((e) => {
            const cls = classes?.find((c) => c.id === e.classId);
            return (
              <EnrollmentGradeRow
                key={e.id}
                enrollmentId={e.id}
                classTitle={cls?.title ?? 'Turma desconhecida'}
                status={e.status}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
