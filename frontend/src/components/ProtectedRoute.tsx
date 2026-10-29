import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { AppLoader } from './common/AppLoader';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
