import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { listEnrollments, createEnrollment, updateEnrollmentStatus, deleteEnrollment } from '@/api/enrollments';
import { listUsers } from '@/api/users';
import { listClasses } from '@/api/classes';
import type { Enrollment, EnrollmentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  studentId: z.string().min(1, 'Aluno obrigatório'),
  classId: z.string().min(1, 'Turma obrigatória'),
});

type FormData = z.infer<typeof schema>;

const statusLabel: Record<EnrollmentStatus, string> = {
  active: 'Ativa',
  completed: 'Concluída',
  dropped: 'Cancelada',
};

const statusVariant: Record<EnrollmentStatus, 'success' | 'default' | 'destructive'> = {
  active: 'success',
  completed: 'default',
  dropped: 'destructive',
};

export default function AdminEnrollmentsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: enrollments, isLoading } = useQuery({ queryKey: ['enrollments'], queryFn: listEnrollments });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: listClasses });

  const students = users?.filter((u) => u.role === 'student') ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: createEnrollment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['enrollments'] }); setOpen(false); reset(); },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: EnrollmentStatus }) => updateEnrollmentStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteEnrollment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
  });

  function getName(id: string) { return users?.find((u) => u.id === id)?.name ?? id; }
  function getClass(id: string) { return classes?.find((c) => c.id === id)?.title ?? id; }

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matrículas</h1>
          <p className="text-sm text-gray-500">{enrollments?.length ?? 0} matrículas</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }}>
          <Plus size={16} />
          Nova Matrícula
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments?.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{getName(e.studentId)}</TableCell>
                <TableCell>{getClass(e.classId)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[e.status]}>{statusLabel[e.status]}</Badge>
                </TableCell>
                <TableCell className="text-gray-500">{formatDate(e.enrolledAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-2">
                    <Select
                      value={e.status}
                      className="h-8 w-32 text-xs"
                      onChange={(ev) =>
                        statusMut.mutate({ id: e.id, status: ev.target.value as EnrollmentStatus })
                      }
                    >
                      <option value="active">Ativa</option>
                      <option value="completed">Concluída</option>
                      <option value="dropped">Cancelada</option>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => { if (confirm('Excluir matrícula?')) deleteMut.mutate(e.id); }}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Matrícula</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => createMut.mutateAsync(data))}
            className="space-y-4 pt-2"
          >
            <div className="space-y-1.5">
              <Label>Aluno</Label>
              <Select {...register('studentId')}>
                <option value="">Selecione o aluno</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              {errors.studentId && <p className="text-xs text-red-600">{errors.studentId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Turma</Label>
              <Select {...register('classId')}>
                <option value="">Selecione a turma</option>
                {classes?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </Select>
              {errors.classId && <p className="text-xs text-red-600">{errors.classId.message}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Matricular'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
