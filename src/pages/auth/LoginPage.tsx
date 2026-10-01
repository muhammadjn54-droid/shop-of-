import React, { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { FileSpreadsheet, Lock, User, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface LocationState {
  username?: string;
  message?: string;
}

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Prefill username if redirected from registration
  useEffect(() => {
    if (locationState?.username) {
      setUsername(locationState.username);
    }
  }, [locationState]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password) {
      setErrorMessage('Пожалуйста, заполните все поля');
      return;
    }

    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      navigate('/');
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: {
            detail?: string;
            non_field_errors?: string[];
          };
        };
      };
      const msg =
        axiosErr.response?.data?.detail ||
        axiosErr.response?.data?.non_field_errors?.[0] ||
        'Неверное имя пользователя или пароль';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex flex-col justify-center items-center p-4 font-['Inter',sans-serif]">
      {/* Excel CRM Brand Ribbon */}
      <div className="w-full max-w-md mb-4 text-center">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-[#107c41] text-white rounded-md shadow-sm">
          <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
          <span className="font-bold text-sm tracking-tight">Shop Inventory</span>
          <span className="text-[10px] bg-[#0d6936] px-1.5 py-0.5 rounded text-emerald-100 uppercase tracking-wider font-semibold">
            Excel CRM
          </span>
        </div>
        <p className="text-xs text-[#64748b] mt-2">
          Личная система учёта товаров, склада, продаж и прибыли
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-md border border-[#cbd5e1] shadow-md overflow-hidden">
        <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4">
          <h2 className="text-base font-bold text-[#1e293b]">Вход в систему</h2>
          <p className="text-xs text-[#64748b] mt-0.5">
            Введите логин и пароль вашей учётной записи
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {locationState?.message && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs font-medium">
              {locationState.message}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Имя пользователя (Логин) или Email
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="username"
                autoFocus={!locationState?.username}
                placeholder="Логин или Email (например: Mansur)"
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
              />
            </div>
            <p className="text-[11px] text-[#64748b] mt-1">
              Можно ввести логин или email. Регистр букв имеет значение.
            </p>
          </div>

          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Пароль
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                autoComplete="current-password"
                autoFocus={!!locationState?.username}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#94a3b8] hover:text-[#475569] p-0.5 rounded transition-colors"
                title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-[#107c41] hover:bg-[#0d6936] text-white font-semibold rounded text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Проверка данных...</span>
              </>
            ) : (
              <>
                <span>Войти в систему</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="pt-3 border-t border-[#e2e8f0] text-center">
            <p className="text-xs text-[#64748b]">
              Нет аккаунта?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#107c41] hover:text-[#0d6936] hover:underline transition-colors"
              >
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
