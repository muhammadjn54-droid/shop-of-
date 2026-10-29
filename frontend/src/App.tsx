import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { PwaProvider } from './context/PwaContext';
import { InstallAppModal } from './components/common/InstallAppModal';
import GuestRoute from './components/GuestRoute';
import RootEntry from './components/RootEntry';
import { AppLoader } from './components/common/AppLoader';
import { prefetchCoreRoutes } from './utils/prefetch';

// Lazy loading all pages for optimal performance and code splitting
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PosPage = lazy(() => import('./pages/PosPage'));
const DebtsPage = lazy(() => import('./pages/DebtsPage'));
const ProductsPage = lazy(() => import('./pages/products/ProductsPage'));
const ProductCreatePage = lazy(() => import('./pages/products/ProductCreatePage'));
const ProductEditPage = lazy(() => import('./pages/products/ProductEditPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const EmployeeDetailPage = lazy(() => import('./pages/EmployeeDetailPage'));
const StockPage = lazy(() => import('./pages/erp/StockPage'));
const ReportsPage = lazy(() => import('./pages/erp/ReportsPage'));
const AiPage = lazy(() => import('./pages/erp/AiPage'));
const SettingsPage = lazy(() => import('./pages/erp/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export function App() {
  useEffect(() => {
    prefetchCoreRoutes();
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <PwaProvider>
            <BrowserRouter>
              <InstallAppModal />
              {/* Global Toast notifications */}
              <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--toast-bg, #ffffff)',
              borderRadius: '14px',
              color: 'var(--toast-fg, #11201a)',
              fontSize: '13px',
              border: '1px solid #e8eaf2',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#0f7a55',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#dc2626',
                secondary: '#ffffff',
              },
            },
          }}
        />

        {/* Suspense wrapper for React.lazy code splitting */}
        <Suspense fallback={<AppLoader />}>
          <Routes>
            {/* Guest Only Routes: доступно без входа */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <ForgotPasswordPage />
                </GuestRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <GuestRoute>
                  <ResetPasswordPage />
                </GuestRoute>
              }
            />

            {/* Public landing for guests, protected application for signed-in users */}
            <Route element={<RootEntry />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/pos" element={<PosPage />} />
              <Route path="/debts" element={<DebtsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/create" element={<ProductCreatePage />} />
              <Route path="/products/:id/edit" element={<ProductEditPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/stock" element={<StockPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/ai" element={<AiPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* 404 Not Found Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
            </BrowserRouter>
          </PwaProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
