import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BarChart3, Users, Check, X as XIcon } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createProva,
  createQuestao,
  listProvasByProfessor,
  matricularAlunoProva,
} from '@/api/provas';
import { listUsers } from '@/api/users';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PageSpinner } from '@/components/ui/spinner';
import { formatDateTime, formatMinutes } from '@/lib/utils';
import type { Prova } from '@/types';

const questaoSchema = z.object({
  enunciado: z.string().min(1, 'Enunciado obrigatório'),
  tipo: z.enum(['dissertativa', 'multipla_escolha']),
  pontuacao: z.number({ coerce: true }).min(0.5),
  opcoesText: z.string().optional(),
});

const provaSchema = z.object({
  titulo: z.string().min(2, 'Título obrigatório'),
  dataInicio: z.string().min(1, 'Data início obrigatória'),
  dataFim: z.string().min(1, 'Data fim obrigatória'),
  duracaoMinutos: z.number({ coerce: true }).min(1),
  questoes: z.array(questaoSchema).min(1, 'Adicione ao menos uma questão'),
});

type ProvaForm = z.infer<typeof provaSchema>;

function provaStatus(p: Prova): { label: string; variant: 'secondary' | 'success' | 'default' } {
  const now = new Date();
  if (now >= new Date(p.dataFim)) return { label: 'Encerrada', variant: 'secondary' };
  if (now >= new Date(p.dataInicio)) return { label: 'Ativa', variant: 'success' };
  return { label: 'Agendada', variant: 'default' };
}

export default function ProfessorProvas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [matriculaProva, setMatriculaProva] = useState<Prova | null>(null);

  const { data: provas, isLoading } = useQuery({
    queryKey: ['provas', 'professor', user?.id],
    queryFn: () => listProvasByProfessor(user!.id),
    enabled: !!user?.id,
  });

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<ProvaForm>({
    resolver: zodResolver(provaSchema),
    defaultValues: { questoes: [{ enunciado: '', tipo: 'dissertativa', pontuacao: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questoes' });

  const createMut = useMutation({
    mutationFn: async (data: ProvaForm) => {
      const created = await createProva({
        titulo: data.titulo,
        professorId: user!.id,
        dataInicio: new Date(data.dataInicio).toISOString(),
        dataFim: new Date(data.dataFim).toISOString(),
        duracaoMinutos: data.duracaoMinutos,
      });

      await Promise.all(
        data.questoes.map((q, i) =>
          createQuestao({
            provaId: created.id,
            enunciado: q.enunciado,
            tipo: q.tipo,
            pontuacao: q.pontuacao,
            ordem: i + 1,
            professorId: user!.id,
            opcoes:
              q.tipo === 'multipla_escolha'
                ? (q.opcoesText ?? '')
                    .split('\n')
                    .map((o) => o.trim())
                    .filter(Boolean)
                : undefined,
          }),
        ),
      );

      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['provas', 'professor', user?.id] });
      setOpen(false);
      reset({ questoes: [{ enunciado: '', tipo: 'dissertativa', pontuacao: 1 }] });
    },
  });

  if (isLoading) return <PageSpinner />;

  const myProvas = provas ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provas</h1>
          <p className="text-sm text-gray-500">{myProvas.length} prova(s)</p>
        </div>
        <Button
          onClick={() => {
            reset({ questoes: [{ enunciado: '', tipo: 'dissertativa', pontuacao: 1 }] });
            setOpen(true);
          }}
        >
          <Plus size={16} />
          Nova Prova
        </Button>
      </div>

      {createMut.isError && (
        <p className="text-sm text-red-600">Erro ao criar prova. Tente novamente.</p>
      )}

      {myProvas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-16">
          <p className="text-gray-400">Nenhuma prova criada ainda.</p>
          <Button className="mt-4" onClick={() => setOpen(true)}>Criar primeira prova</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myProvas.map((p) => {
            const status = provaStatus(p);
            return (
              <Card key={p.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{p.titulo}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span>Início: {formatDateTime(p.dataInicio)}</span>
                        <span>Duração: {formatMinutes(p.duracaoMinutos)}</span>
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setMatriculaProva(p)}>
                      <Users size={14} />
                      Matricular Alunos
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/professor/provas/${p.id}/relatorio`}>
                        <BarChart3 size={14} />
                        Relatório Anti-fraude
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Prova</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit((d) => createMut.mutateAsync(d))} className="space-y-5 pt-2">
            <div className="space-y-1.5">
              <Label>Título da Prova</Label>
              <Input placeholder="Ex: Prova 1 — Matemática" {...register('titulo')} />
              {errors.titulo && <p className="text-xs text-red-600">{errors.titulo.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Data/Hora Início</Label>
                <Input type="datetime-local" {...register('dataInicio')} />
              </div>
              <div className="space-y-1.5">
                <Label>Data/Hora Fim</Label>
                <Input type="datetime-local" {...register('dataFim')} />
              </div>
              <div className="space-y-1.5">
                <Label>Duração (min)</Label>
                <Input type="number" min="1" {...register('duracaoMinutos')} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Questões</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => append({ enunciado: '', tipo: 'dissertativa', pontuacao: 1 })}
                >
                  <Plus size={14} /> Adicionar
                </Button>
              </div>

              {fields.map((field, i) => (
                <div key={field.id} className="rounded-lg border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Questão {i + 1}</span>
                    {fields.length > 1 && (
                      <button type="button" onClick={() => remove(i)} className="text-xs text-red-500 hover:text-red-700">
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Input placeholder="Enunciado da questão" {...register(`questoes.${i}.enunciado`)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select {...register(`questoes.${i}.tipo`)}>
                      <option value="dissertativa">Dissertativa</option>
                      <option value="multipla_escolha">Múltipla Escolha</option>
                    </Select>
                    <Input type="number" step="0.5" min="0.5" placeholder="Pontos" {...register(`questoes.${i}.pontuacao`)} />
                  </div>
                  {watch(`questoes.${i}.tipo`) === 'multipla_escolha' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Opções de resposta (uma por linha)</Label>
                      <textarea
                        rows={4}
                        placeholder={'Opção A\nOpção B\nOpção C'}
                        className="w-full resize-none rounded-md border border-gray-300 p-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        {...register(`questoes.${i}.opcoesText`)}
                      />
                    </div>
                  )}
                </div>
              ))}
              {errors.questoes && <p className="text-xs text-red-600">{errors.questoes.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending ? 'Criando...' : 'Criar Prova'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MatriculaDialog prova={matriculaProva} onClose={() => setMatriculaProva(null)} />
    </div>
  );
}

interface MatriculaDialogProps {
  prova: Prova | null;
  onClose: () => void;
}

function MatriculaDialog({ prova, onClose }: MatriculaDialogProps) {
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const [feedback, setFeedback] = useState<{ alunoId: string; ok: boolean; msg: string } | null>(null);
  const [matriculados, setMatriculados] = useState<Set<string>>(new Set());

  const students = (users ?? []).filter((u) => u.role === 'student');

  const matricularMut = useMutation({
    mutationFn: (alunoId: string) => matricularAlunoProva(prova!.id, alunoId),
    onSuccess: (_data, alunoId) => {
      setMatriculados((prev) => new Set(prev).add(alunoId));
      setFeedback({ alunoId, ok: true, msg: 'Aluno matriculado com sucesso.' });
    },
    onError: (_err, alunoId) => {
      setFeedback({ alunoId, ok: false, msg: 'Falha ao matricular o aluno.' });
    },
  });

  function handleClose() {
    setFeedback(null);
    setMatriculados(new Set());
    matricularMut.reset();
    onClose();
  }

  return (
    <Dialog open={!!prova} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Matricular Alunos{prova ? ` — ${prova.titulo}` : ''}</DialogTitle>
        </DialogHeader>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
              feedback.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {feedback.ok ? <Check size={15} /> : <XIcon size={15} />}
            {feedback.msg}
          </div>
        )}

        {isLoading ? (
          <PageSpinner />
        ) : students.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">Nenhum aluno cadastrado.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {students.map((s) => {
              const alreadyDone = matriculados.has(s.id);
              const isPending = matricularMut.isPending && matricularMut.variables === s.id;
              return (
                <li key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                  </div>
                  {alreadyDone ? (
                    <Badge variant="success">
                      <Check size={12} className="mr-1" /> Matriculado
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => prova && matricularMut.mutate(s.id)}
                    >
                      {isPending ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" type="button" onClick={handleClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
