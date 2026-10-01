import React, { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * GuestRoute (только для неавторизованных гостей).
 * Если пользователь уже вошёл (у него есть JWT токен),
 * ему запрещён доступ к страницам /login и /register.
 * Его автоматически перенаправляет на главную страницу (/).
 */
export const GuestRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 p-4 bg-white border border-[#cbd5e1] rounded shadow-xs">
          <Loader2 className="w-5 h-5 text-[#107c41] animate-spin" />
          <span className="text-xs font-medium text-[#475569]">Проверка авторизации...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default GuestRoute;
