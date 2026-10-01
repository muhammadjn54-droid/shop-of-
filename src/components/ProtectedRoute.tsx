import React, { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 p-4 bg-white border border-[#cbd5e1] rounded shadow-sm">
          <Loader2 className="w-5 h-5 text-[#107c41] animate-spin" />
          <span className="text-sm font-medium text-[#475569]">Загрузка данных пользователя...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
