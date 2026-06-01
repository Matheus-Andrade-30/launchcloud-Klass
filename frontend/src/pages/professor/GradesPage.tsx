import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { listGrades, createGrade } from '@/api/grades';
import { listEnrollments } from '@/api/enrollments';
import { listUsers } from '@/api/users';
import { listClasses } from '@/api/classes';
import { generateCertificate } from '@/api/certificates';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  enrollmentId: z.string().min(1, 'Matrícula obrigatória'),
  grade: z.number({ coerce: true }).min(0).max(10),
  attendance: z.number({ coerce: true }).min(0).max(100),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ProfessorGrades() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [certLoading, setCertLoading] = useState<string | null>(null);

  const { data: grades, isLoading } = useQuery({ queryKey: ['grades'], queryFn: listGrades });
  const { data: enrollments } = useQuery({ queryKey: ['enrollments'], queryFn: listEnrollments });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: listClasses });

  const myClasses = classes?.filter((c) => c.teacherId === user?.id) ?? [];
  const myClassIds = new Set(myClasses.map((c) => c.id));
  const myEnrollments = enrollments?.filter((e) => myClassIds.has(e.classId)) ?? [];
  const myEnrollmentIds = new Set(myEnrollments.map((e) => e.id));
  const myGrades = grades?.filter((g) => myEnrollmentIds.has(g.enrollmentId)) ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: (data: FormData) => createGrade({ ...data, teacherId: user!.id, notes: data.notes ?? '' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grades'] }); setOpen(false); reset(); },
  });

  async function handleCert(enrollmentId: string) {
    setCertLoading(enrollmentId);
    try {
      await generateCertificate(enrollmentId);
      alert('Certificado gerado com sucesso!');
    } catch {
      alert('Erro ao gerar certificado.');
    } finally {
      setCertLoading(null);
    }
  }

  function getStudentName(enrollmentId: string) {
    const e = enrollments?.find((e) => e.id === enrollmentId);
    if (!e) return enrollmentId;
    return users?.find((u) => u.id === e.studentId)?.name ?? e.studentId;
  }

  function getClassName(enrollmentId: string) {
    const e = enrollments?.find((e) => e.id === enrollmentId);
    if (!e) return '';
    return classes?.find((c) => c.id === e.classId)?.title ?? '';
  }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notas</h1>
          <p className="text-sm text-gray-500">{myGrades.length} nota(s) registrada(s)</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }}>
          <Plus size={16} />
          Lançar Nota
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead>Observações</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Certificado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {myGrades.map((g) => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{getStudentName(g.enrollmentId)}</TableCell>
                <TableCell>{getClassName(g.enrollmentId)}</TableCell>
                <TableCell>
                  <Badge
                    variant={g.grade >= 7 ? 'success' : g.grade >= 5 ? 'warning' : 'destructive'}
                  >
                    {g.grade.toFixed(1)}
                  </Badge>
                </TableCell>
                <TableCell>{g.attendance}%</TableCell>
                <TableCell className="max-w-xs truncate text-gray-500">{g.notes || '—'}</TableCell>
                <TableCell className="text-gray-500">{formatDate(g.createdAt)}</TableCell>
                <TableCell className="text-right">
                  {g.grade >= 7 && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={certLoading === g.enrollmentId}
                      onClick={() => handleCert(g.enrollmentId)}
                    >
                      {certLoading === g.enrollmentId ? 'Gerando...' : 'Gerar'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Lançar Nota</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => createMut.mutateAsync(d))} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Aluno / Matrícula</Label>
              <Select {...register('enrollmentId')}>
                <option value="">Selecione</option>
                {myEnrollments.map((e) => {
                  const name = users?.find((u) => u.id === e.studentId)?.name ?? e.studentId;
                  const cls = classes?.find((c) => c.id === e.classId)?.title ?? '';
                  return <option key={e.id} value={e.id}>{name} — {cls}</option>;
                })}
              </Select>
              {errors.enrollmentId && <p className="text-xs text-red-600">{errors.enrollmentId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nota (0–10)</Label>
                <Input type="number" step="0.1" min="0" max="10" {...register('grade')} />
                {errors.grade && <p className="text-xs text-red-600">{errors.grade.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Frequência (%)</Label>
                <Input type="number" min="0" max="100" {...register('attendance')} />
                {errors.attendance && <p className="text-xs text-red-600">{errors.attendance.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input placeholder="Opcional" {...register('notes')} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
