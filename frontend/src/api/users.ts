import type { User, UserRole } from '@/types';
import { userStore, uuid } from '@/lib/localStore';

export interface CreateUserPayload {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

export async function listUsers(): Promise<User[]> {
  return userStore.list();
}

export async function getUserById(id: string): Promise<User> {
  const u = userStore.findById(id);
  if (!u) throw new Error('Usuário não encontrado');
  return u;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const user: User = {
    id: uuid(),
    name: payload.name,
    email: payload.email,
    role: payload.role,
    createdAt: new Date().toISOString(),
  };
  return userStore.create(user);
}

export async function updateUser(id: string, payload: Partial<CreateUserPayload>): Promise<User> {
  return userStore.update(id, payload);
}

export async function deleteUser(id: string): Promise<void> {
  userStore.remove(id);
}
