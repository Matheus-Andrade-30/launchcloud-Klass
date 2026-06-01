import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BarChart3 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createProva, createQuestao } from '@/api/provas';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDateTime, formatMinutes } from '@/lib/utils';
import type { Prova } from '@/types';

const questaoSchema = z.object({
  enunciado: z.string().min(1, 'Enunciado obrigatório'),
  tipo: z.enum(['dissertativa', 'multipla_escolha']),
  pontuacao: z.number({ coerce: true }).min(0.5),
});

const provaSchema = z.object({
  titulo: z.string().min(2, 'Título obrigatório'),
  dataInicio: z.string().min(1, 'Data início obrigatória'),
  dataFim: z.string().min(1, 'Data fim obrigatória'),
  duracaoMinutos: z.number({ coerce: true }).min(1),
  questoes: z.array(questaoSchema).min(1, 'Adicione ao menos uma questão'),
});

type ProvaForm = z.infer<typeof provaSchema>;

const STORAGE_KEY = 'klass_provas';

function loadStoredProvas(): Prova[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? (JSON.parse(stored) as Prova[]) : [];
}

export default function ProfessorProvas() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [provas, setProvas] = useState<Prova[]>(loadStoredProvas);
  const myProvas = provas.filter((p) => p.professorId === user?.id);

  const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm<ProvaForm>({
    resolver: zodResolver(provaSchema),
    defaultValues: { questoes: [{ enunciado: '', tipo: 'dissertativa', pontuacao: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'questoes' });

  async function onSubmit(data: ProvaForm) {
    const created = await createProva({
      titulo: data.titulo,
      professorId: user!.id,
      dataInicio: new Date(data.dataInicio).toISOString(),
      dataFim: new Date(data.dataFim).toISOString(),
      duracaoMinutos: data.duracaoMinutos,
    });

    await Promise.all(
      data.questoes.map((q, i) =>
        createQuestao({ provaId: created.id, enunciado: q.enunciado, tipo: q.tipo, pontuacao: q.pontuacao, ordem: i + 1 }),
      ),
    );

    const updated = [...provas, { ...created, questoes: [] }];
    setProvas(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setOpen(false);
    reset();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provas</h1>
          <p className="text-sm text-gray-500">{myProvas.length} prova(s)</p>
        </div>
        <Button onClick={() => { reset({ questoes: [{ enunciado: '', tipo: 'dissertativa', pontuacao: 1 }] }); setOpen(true); }}>
          <Plus size={16} />
          Nova Prova
        </Button>
      </div>

      {myProvas.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-16">
          <p className="text-gray-400">Nenhuma prova criada ainda.</p>
          <Button className="mt-4" onClick={() => setOpen(true)}>Criar primeira prova</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myProvas.map((p) => (
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
                  <Badge variant="secondary">
                    {new Date() >= new Date(p.dataFim) ? 'Encerrada' : new Date() >= new Date(p.dataInicio) ? 'Ativa' : 'Agendada'}
                  </Badge>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/professor/provas/${p.id}/relatorio`}>
                      <BarChart3 size={14} />
                      Relatório Anti-fraude
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Prova</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
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
                </div>
              ))}
              {errors.questoes && <p className="text-xs text-red-600">{errors.questoes.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Prova'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
