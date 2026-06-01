import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PageSpinner } from '@/components/ui/spinner';

export default function RoleRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'teacher') return <Navigate to="/professor" replace />;
  return <Navigate to="/aluno" replace />;
}
