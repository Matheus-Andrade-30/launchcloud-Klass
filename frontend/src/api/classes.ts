import type { Class } from '@/types';
import { classStore, uuid } from '@/lib/localStore';

export interface CreateClassPayload {
  title: string;
  description: string;
  teacherId: string;
}

export async function listClasses(): Promise<Class[]> {
  return classStore.list();
}

export async function getClassById(id: string): Promise<Class> {
  const c = classStore.findById(id);
  if (!c) throw new Error('Turma não encontrada');
  return c;
}

export async function createClass(payload: CreateClassPayload): Promise<Class> {
  return classStore.create({ id: uuid(), ...payload, createdAt: new Date().toISOString() });
}

export async function updateClass(id: string, payload: Partial<CreateClassPayload>): Promise<Class> {
  return classStore.update(id, payload);
}

export async function deleteClass(id: string): Promise<void> {
  classStore.remove(id);
}
