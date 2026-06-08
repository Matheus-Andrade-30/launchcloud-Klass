import type { User } from '@/types';
import api from './client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const email = payload.email.trim().toLowerCase();
  const { data } = await api.post<LoginResponse>('/auth/login', { email });
  return data;
}
