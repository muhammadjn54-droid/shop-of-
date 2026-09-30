import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  FileSpreadsheet,
  Lock,
  User,
  Mail,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatErrorMessage } from '../../components/common/ErrorState';
import { emailTakenMessage, firstErrorMessage, isEmailTakenMessage } from '../../utils/authErrors';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = formData.username.trim();
    if (!cleanUsername || !formData.password || !formData.password2) {
      setErrorMessage('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (formData.password !== formData.password2) {
      setErrorMessage('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Пароль должен состоять как минимум из 8 символов (буквы и цифры, например: Secret123!)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: cleanUsername,
        password: formData.password,
        password2: formData.password2,
      };
      if (formData.email.trim()) {
        payload.email = formData.email.trim();
      }

      await register(payload);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      const cleanEmail = formData.email.trim();

      if (data?.username) {
        setErrorMessage(`Логин "${cleanUsername}" уже занят. Пожалуйста, придумайте другой логин (например: "${cleanUsername}1" или "${cleanUsername}_shop").`);
      } else if (data?.password) {
        const pErr = Array.isArray(data.password) ? data.password.join('. ') : data.password;
        setErrorMessage(`Требования к паролю: ${pErr}`);
      } else if (data?.email) {
        // Сервер отдаёт одну и ту же ошибку `email` для двух разных случаев,
        // поэтому «занят» и «некорректный формат» приходится различать по тексту.
        if (isEmailTakenMessage(firstErrorMessage(data.email))) {
          setErrorMessage(emailTakenMessage(cleanEmail));
        } else {
          setErrorMessage('Укажите корректный адрес электронной почты или оставьте поле пустым.');
        }
      } else {
        const msg = formatErrorMessage(err);
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-4 font-['Inter',sans-serif]">
      <div className="w-full max-w-4xl bg-white rounded-md border border-[#cbd5e1] shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="w-full md:w-5/12 bg-[#107c41] text-white p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0d6936] rounded mb-6 text-xs font-semibold tracking-wide">
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Shop Inventory</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug mb-3">
              Управляйте товарами, продажами и прибылью в одном месте.
            </h2>
            <p className="text-xs text-emerald-100 leading-relaxed mb-6">
              Персональная система учёта склада в стиле Microsoft Excel. Полная изоляция ваших данных.
            </p>

            <div className="space-y-3 text-xs text-emerald-50">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>Личный аккаунт: ваши товары и продажи видите только вы</span>
              </div>
              <div className="flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>Автоматический расчёт выручки, себестоимости и чистой прибыли</span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span>Надёжная JWT аутентификация и мгновенный доступ</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#185a37] text-[11px] text-emerald-200">
            © {new Date().getFullYear()} Shop Inventory • Excel CRM Style
          </div>
        </div>

        {/* Right Side: Register Form */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-center">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-[#1e293b]">Создать учётную запись</h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              Заполните данные для создания вашего личного склада
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Имя пользователя (Логин) <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoComplete="username"
                  placeholder="Ваш логин (например: Mansur)"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Электронная почта <span className="text-[#94a3b8] font-normal">(необязательно)</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoComplete="email"
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-[#334155] mb-1">
                  Пароль <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 text-[#94a3b8] hover:text-[#475569] p-0.5 rounded transition-colors"
                    title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#334155] mb-1">
                  Повторите пароль <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
                  <input
                    type={showPassword2 ? 'text' : 'password'}
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full pl-9 pr-9 py-2 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword2(!showPassword2)}
                    className="absolute right-2.5 text-[#94a3b8] hover:text-[#475569] p-0.5 rounded transition-colors"
                    title={showPassword2 ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    {showPassword2 ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#107c41] hover:bg-[#0d6936] text-white font-semibold rounded text-xs flex items-center justify-center gap-2 transition-all shadow-xs disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Создание аккаунта...</span>
                </>
              ) : (
                <span>Создать аккаунт</span>
              )}
            </button>

            <div className="pt-3 border-t border-[#e2e8f0] text-center">
              <p className="text-xs text-[#64748b]">
                Уже есть аккаунт?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#107c41] hover:text-[#0d6936] hover:underline transition-colors"
                >
                  Войти
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
