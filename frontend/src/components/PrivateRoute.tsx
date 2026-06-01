import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageSpinner } from '@/components/ui/spinner';

interface PrivateRouteProps {
  children: ReactNode;
  roles?: string[];
}

export default function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <PageSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'student' ? '/aluno' : '/professor'} replace />;
  }

  return <>{children}</>;
}
