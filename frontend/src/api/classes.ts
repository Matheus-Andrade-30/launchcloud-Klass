import type { Class } from '@/types';
import api from './client';

export interface CreateClassPayload {
  title: string;
  description: string;
  teacherId: string;
}

export async function listClasses(): Promise<Class[]> {
  const { data } = await api.get<Class[]>('/classes');
  return data;
}

export async function getClassById(id: string): Promise<Class> {
  const { data } = await api.get<Class>(`/classes/${id}`);
  return data;
}

export async function createClass(payload: CreateClassPayload): Promise<Class> {
  const { data } = await api.post<Class>('/classes', payload);
  return data;
}

export async function updateClass(
  id: string,
  payload: Partial<CreateClassPayload>,
): Promise<Class> {
  const { data } = await api.put<Class>(`/classes/${id}`, payload);
  return data;
}

export async function deleteClass(id: string): Promise<void> {
  await api.delete(`/classes/${id}`);
}
