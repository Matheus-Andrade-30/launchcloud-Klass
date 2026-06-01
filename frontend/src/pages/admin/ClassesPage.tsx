import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { listClasses, createClass, updateClass, deleteClass } from '@/api/classes';
import { listUsers } from '@/api/users';
import type { Class } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(2, 'Título muito curto'),
  description: z.string().min(1, 'Descrição obrigatória'),
  teacherId: z.string().min(1, 'Professor obrigatório'),
});

type FormData = z.infer<typeof schema>;

export default function AdminClassesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Class | null>(null);

  const { data: classes, isLoading } = useQuery({ queryKey: ['classes'], queryFn: listClasses });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const teachers = users?.filter((u) => u.role === 'teacher') ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: createClass,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); setOpen(false); reset(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormData> }) => updateClass(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); setOpen(false); reset(); setEditing(null); },
  });

  const deleteMut = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });

  function openCreate() {
    setEditing(null);
    reset({ title: '', description: '', teacherId: teachers[0]?.id ?? '' });
    setOpen(true);
  }

  function openEdit(cls: Class) {
    setEditing(cls);
    reset({ title: cls.title, description: cls.description, teacherId: cls.teacherId });
    setOpen(true);
  }

  async function onSubmit(data: FormData) {
    if (editing) await updateMut.mutateAsync({ id: editing.id, data });
    else await createMut.mutateAsync(data);
  }

  const teacherName = (id: string) => users?.find((u) => u.id === id)?.name ?? id;

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Turmas</h1>
          <p className="text-sm text-gray-500">{classes?.length ?? 0} turmas cadastradas</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Nova Turma
        </Button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Professor</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes?.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell className="font-medium">{cls.title}</TableCell>
                <TableCell className="max-w-xs truncate text-gray-500">{cls.description}</TableCell>
                <TableCell className="text-gray-500">{teacherName(cls.teacherId)}</TableCell>
                <TableCell className="text-gray-500">{formatDate(cls.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(cls)}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => { if (confirm('Excluir turma?')) deleteMut.mutate(cls.id); }}
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
            <DialogTitle>{editing ? 'Editar Turma' : 'Nova Turma'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input placeholder="Ex: Matemática Básica" {...register('title')} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input placeholder="Breve descrição da turma" {...register('description')} />
              {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Professor</Label>
              <Select {...register('teacherId')}>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
              {errors.teacherId && <p className="text-xs text-red-600">{errors.teacherId.message}</p>}
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
