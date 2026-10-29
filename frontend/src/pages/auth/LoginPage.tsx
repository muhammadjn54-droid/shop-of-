import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatLoginError } from '../../utils/authErrors';
import { AuthShell, AuthField } from '../../components/auth/AuthShell';
import { Lock, Mail, Loader2, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!username.trim() || !password) {
      setErrorMessage('Пожалуйста, заполните email и пароль');
      return;
    }

    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      navigate('/');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error && err.message ? err.message : formatLoginError(err)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      heading="Мағозаро сода ва пурра идора кунед"
      lead="Касса, анбор, қарзҳо ва ҳисоботҳо дар як ҷой — аз телефон ва компютер."
      features={['Касса бо штрихкод', 'Назорати анбор', 'Дафтари қарзҳо']}
    >
      <div className="mb-8">
        <h2 className="font-['Manrope',sans-serif] text-[28px] font-extrabold tracking-tight">{t('loginTitle')}</h2>
        <p className="mt-1.5 text-sm text-[#5b6b63]">{t('loginSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div role="alert" className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <AuthField
          id="login-username-input"
          label="Email"
          icon={Mail}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          autoFocus
          placeholder="name@example.com"
        />

        <AuthField
          id="login-password-input"
          label={t('loginPasswordLabel')}
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="current-password"
          placeholder="••••••••"
          trailing={<button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-[#5b6b63] hover:text-[#11201a]"
              aria-label="Toggle"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-xl font-bold text-[15px] text-white bg-[#0f7a55] hover:bg-[#0a5c40] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Вход...</span></> : <><span>{t('loginSubmitBtn')}</span><ArrowRight className="w-4 h-4" /></>}
        </button>

        <p className="text-center text-sm text-[#5b6b63]">
          {t('noAccount')}{' '}
          <Link to="/register" className="font-semibold text-[#0f7a55] hover:underline">
            {t('registerLink')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default LoginPage;
