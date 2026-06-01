import type { User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

const SEED_USERS: User[] = [
  { id: 'u-t1', name: 'Carlos Mendes',    email: 'carlos.mendes@klass.edu',           role: 'teacher', createdAt: '2024-01-10' },
  { id: 'u-t2', name: 'Ana Souza',        email: 'ana.souza@klass.edu',               role: 'teacher', createdAt: '2024-01-15' },
  { id: 'u-t3', name: 'Roberto Lima',     email: 'roberto.lima@klass.edu',            role: 'teacher', createdAt: '2024-02-01' },
  { id: 'u-s1', name: 'Lucas Oliveira',   email: 'lucas.oliveira@aluno.klass.edu',    role: 'student', createdAt: '2024-02-10' },
  { id: 'u-s2', name: 'Mariana Costa',    email: 'mariana.costa@aluno.klass.edu',     role: 'student', createdAt: '2024-02-11' },
  { id: 'u-s3', name: 'Pedro Alves',      email: 'pedro.alves@aluno.klass.edu',       role: 'student', createdAt: '2024-02-12' },
  { id: 'u-s4', name: 'Juliana Ferreira', email: 'juliana.ferreira@aluno.klass.edu',  role: 'student', createdAt: '2024-02-13' },
  { id: 'u-s5', name: 'Rafael Santos',    email: 'rafael.santos@aluno.klass.edu',     role: 'student', createdAt: '2024-02-14' },
  { id: 'u-s6', name: 'Beatriz Rocha',    email: 'beatriz.rocha@aluno.klass.edu',     role: 'student', createdAt: '2024-02-15' },
  { id: 'u-s7', name: 'Felipe Nunes',     email: 'felipe.nunes@aluno.klass.edu',      role: 'student', createdAt: '2024-02-16' },
  { id: 'u-s8', name: 'Camila Martins',   email: 'camila.martins@aluno.klass.edu',    role: 'student', createdAt: '2024-02-17' },
];

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const email = payload.email.trim().toLowerCase();

  const found = SEED_USERS.find((u) => u.email === email);

  if (found) {
    return { user: found, token: `klass-token-${found.id}` };
  }

  // Accept any unknown email: infer role from domain
  const role = email.includes('aluno') || email.includes('student') ? 'student' : 'teacher';
  const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const user: User = {
    id: `local-${Date.now()}`,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  };

  return { user, token: `klass-token-${user.id}` };
}
