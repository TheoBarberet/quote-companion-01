import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}
