import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ShieldCheck, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const SEED_USERS = [
  { email: 'carlos.mendes@klass.edu', name: 'Carlos Mendes', role: 'Professor' },
  { email: 'ana.souza@klass.edu', name: 'Ana Souza', role: 'Professor' },
  { email: 'roberto.lima@klass.edu', name: 'Roberto Lima', role: 'Professor' },
  { email: 'lucas.oliveira@aluno.klass.edu', name: 'Lucas Oliveira', role: 'Aluno' },
  { email: 'mariana.costa@aluno.klass.edu', name: 'Mariana Costa', role: 'Aluno' },
  { email: 'pedro.alves@aluno.klass.edu', name: 'Pedro Alves', role: 'Aluno' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError('');
    try {
      await login({ email: data.email, password: data.password ?? '' });
      navigate('/');
    } catch {
      setError('Usuário não encontrado. Verifique o e-mail e tente novamente.');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Launchcloud Klass</h1>
          <p className="mt-2 text-gray-500">Plataforma de ensino com monitoramento anti-fraude</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-800">Entrar na plataforma</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha <span className="text-gray-400 font-normal">(opcional por agora)</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="qualquer valor"
                  autoComplete="current-password"
                  className="pr-10"
                  {...register('password')}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Quick access for seed users */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <button
              type="button"
              className="flex w-full items-center justify-between text-sm text-gray-400 hover:text-gray-600"
              onClick={() => setShowHints((v) => !v)}
            >
              <span>Usuários de exemplo (seed do banco)</span>
              <ChevronDown
                size={16}
                className={`transition-transform ${showHints ? 'rotate-180' : ''}`}
              />
            </button>

            {showHints && (
              <ul className="mt-3 space-y-1.5">
                {SEED_USERS.map((u) => (
                  <li key={u.email}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs hover:bg-gray-50"
                      onClick={() => setValue('email', u.email)}
                    >
                      <span className="font-medium text-gray-700">{u.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{u.email}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            u.role === 'Professor'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
