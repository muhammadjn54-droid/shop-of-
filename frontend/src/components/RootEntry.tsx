import { lazy } from 'react';
import { Navigate, useLocation } from 'react-router';
import { Loader2, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ProtectedRoute from './ProtectedRoute';
import AppLayout from './layout/AppLayout';

const LandingPage = lazy(() => import('../pages/landing/LandingPage'));

export const RootEntry = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#107c41] text-white flex items-center justify-center shadow-sm">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#475569]">
          <Loader2 className="w-4 h-4 text-[#107c41] animate-spin" />
          <span>{t('lpSessionLoading')}</span>
        </div>
      </div>
    );
  }

  if (location.pathname === '/') {
    return user ? (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ) : (
      <LandingPage />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  );
};

export default RootEntry;
