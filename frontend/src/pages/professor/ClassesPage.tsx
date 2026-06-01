import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ArrowRight, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { listClasses, createClass, deleteClass } from '@/api/classes';
import { listEnrollments } from '@/api/enrollments';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDate } from '@/lib/utils';

const schema = z.object({
  title: z.string().min(2, 'Título muito curto'),
  description: z.string().min(1, 'Descrição obrigatória'),
});

type FormData = z.infer<typeof schema>;

export default function ProfessorClassesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: classes, isLoading } = useQuery({ queryKey: ['classes'], queryFn: listClasses });
  const { data: enrollments } = useQuery({ queryKey: ['enrollments'], queryFn: listEnrollments });
  const myClasses = classes?.filter((c) => c.teacherId === user?.id) ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMut = useMutation({
    mutationFn: (data: FormData) => createClass({ ...data, teacherId: user!.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['classes'] }); setOpen(false); reset(); },
  });

  const deleteMut = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Turmas</h1>
          <p className="text-sm text-gray-500">{myClasses.length} turma(s)</p>
        </div>
        <Button onClick={() => { reset(); setOpen(true); }}>
          <Plus size={16} />
          Nova Turma
        </Button>
      </div>

      {myClasses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-16">
          <p className="text-gray-400">Nenhuma turma criada ainda.</p>
          <Button className="mt-4" onClick={() => setOpen(true)}>Criar primeira turma</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myClasses.map((cls) => {
            const count = enrollments?.filter((e) => e.classId === cls.id && e.status === 'active').length ?? 0;
            return (
              <Card key={cls.id} className="group hover:border-blue-300 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate font-semibold text-gray-900">{cls.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{cls.description}</p>
                    </div>
                    <button
                      onClick={() => { if (confirm('Excluir turma?')) deleteMut.mutate(cls.id); }}
                      className="ml-2 flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-400">{count} aluno(s) · {formatDate(cls.createdAt)}</span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/professor/turmas/${cls.id}`}>
                        Abrir <ArrowRight size={14} />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Turma</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMut.mutateAsync(d))} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input placeholder="Ex: Matemática — Turma A" {...register('title')} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input placeholder="Breve descrição" {...register('description')} />
              {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Turma'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
