import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import AppLayout from './components/layout/AppLayout';
import LoadingState from './components/common/LoadingState';

// Lazy loading all pages for optimal performance and code splitting
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProductsPage = lazy(() => import('./pages/products/ProductsPage'));
const ProductCreatePage = lazy(() => import('./pages/products/ProductCreatePage'));
const ProductEditPage = lazy(() => import('./pages/products/ProductEditPage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Global Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              fontSize: '12px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#107c41',
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
        <Suspense fallback={<LoadingState message="Загрузка раздела..." />}>
          <Routes>
            {/* Guest Only Routes: авторизованным пользователям с JWT вход сюда запрещён */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route path="/register" element={<Navigate to="/login" replace />} />

            {/* Protected Application Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/create" element={<ProductCreatePage />} />
              <Route path="/products/:id/edit" element={<ProductEditPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
            </Route>

            {/* 404 Not Found Page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
