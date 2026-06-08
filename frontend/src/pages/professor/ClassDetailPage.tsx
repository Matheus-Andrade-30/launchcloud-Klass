import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, Trash2, FileText, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getClassById } from '@/api/classes';
import { listEnrollments, updateEnrollmentStatus } from '@/api/enrollments';
import { listMaterialsByClass, uploadMaterial } from '@/api/materials';
import { listUsers } from '@/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDate, formatDateTime } from '@/lib/utils';
import type { EnrollmentStatus } from '@/types';

const materialSchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
});

type MaterialForm = z.infer<typeof materialSchema>;

const statusLabel: Record<EnrollmentStatus, string> = {
  active: 'Ativa',
  completed: 'Concluída',
  dropped: 'Cancelada',
};

export default function ProfessorClassDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: cls, isLoading: loadingClass } = useQuery({
    queryKey: ['class', id],
    queryFn: () => getClassById(id!),
    enabled: !!id,
  });

  const { data: enrollments } = useQuery({ queryKey: ['enrollments'], queryFn: listEnrollments });
  const { data: materials } = useQuery({
    queryKey: ['materials', id],
    queryFn: () => listMaterialsByClass(id!),
    enabled: !!id,
  });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: listUsers });

  const classEnrollments = enrollments?.filter((e) => e.classId === id) ?? [];

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<MaterialForm>({
    resolver: zodResolver(materialSchema),
  });

  const uploadMut = useMutation({
    mutationFn: (data: MaterialForm) =>
      uploadMaterial({
        title: data.title,
        description: data.description ?? '',
        classId: id!,
        uploadedBy: user!.id,
        file: selectedFile!,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materials', id] });
      setUploadOpen(false);
      setSelectedFile(null);
      reset();
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ eid, status }: { eid: string; status: EnrollmentStatus }) =>
      updateEnrollmentStatus(eid, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['enrollments'] }),
  });

  if (loadingClass) return <PageSpinner />;
  if (!cls) return <p className="p-8 text-gray-500">Turma não encontrada.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/professor/turmas"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{cls.title}</h1>
          <p className="text-sm text-gray-500">{cls.description}</p>
        </div>
      </div>

      <Tabs defaultValue="materials">
        <TabsList>
          <TabsTrigger value="materials">
            <FileText size={15} className="mr-1.5" /> Materiais ({materials?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users size={15} className="mr-1.5" /> Alunos ({classEnrollments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => { reset(); setSelectedFile(null); setUploadOpen(true); }}>
                <Upload size={15} />
                Enviar Material
              </Button>
            </div>
            {!materials?.length ? (
              <p className="py-8 text-center text-sm text-gray-400">Nenhum material enviado.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {materials.map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium">{m.title}</p>
                      <p className="text-xs text-gray-500">{m.description} · {m.contentType} · {formatDateTime(m.uploadedAt)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-600">
                      <FileText size={15} />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="students">
          {!classEnrollments.length ? (
            <p className="py-8 text-center text-sm text-gray-400">Nenhum aluno matriculado.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
              {classEnrollments.map((e) => {
                const student = users?.find((u) => u.id === e.studentId);
                return (
                  <li key={e.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium">{student?.name ?? e.studentId}</p>
                      <p className="text-xs text-gray-500">{student?.email} · Matrícula: {formatDate(e.enrolledAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={e.status === 'active' ? 'success' : e.status === 'completed' ? 'default' : 'destructive'}
                      >
                        {statusLabel[e.status]}
                      </Badge>
                      <Select
                        value={e.status}
                        className="h-8 w-32 text-xs"
                        onChange={(ev) =>
                          statusMut.mutate({ eid: e.id, status: ev.target.value as EnrollmentStatus })
                        }
                      >
                        <option value="active">Ativa</option>
                        <option value="completed">Concluída</option>
                        <option value="dropped">Cancelada</option>
                      </Select>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar Material</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => uploadMut.mutateAsync(d))} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input placeholder="Nome do material" {...register('title')} />
              {errors.title && <p className="text-xs text-red-600">{errors.title.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Input placeholder="Opcional" {...register('description')} />
            </div>
            <div className="space-y-1.5">
              <Label>Arquivo</Label>
              <input
                ref={fileRef}
                type="file"
                className="block w-full text-sm text-gray-500 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-blue-600 hover:file:bg-blue-100"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {!selectedFile && isSubmitting && (
                <p className="text-xs text-red-600">Selecione um arquivo</p>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setUploadOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting || !selectedFile}>
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
