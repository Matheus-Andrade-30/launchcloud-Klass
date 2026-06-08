import type { User, UserRole } from '@/types';
import api from './client';

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export async function listUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>('/users');
  return data;
}

export async function getUserById(id: string): Promise<User> {
  const { data } = await api.get<User>(`/users/${id}`);
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<User>('/users', payload);
  return data;
}

export async function updateUser(id: string, payload: Partial<CreateUserPayload>): Promise<User> {
  const { data } = await api.put<User>(`/users/${id}`, payload);
  return data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
