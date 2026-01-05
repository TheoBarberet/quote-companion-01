import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';

const Index = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? '/dashboard' : '/auth'} replace />;
};

export default Index;

