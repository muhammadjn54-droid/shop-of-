import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleButton } from '../../components/auth/GoogleButton';
import { AuthShell, AuthField } from '../../components/auth/AuthShell';
import { Lock, Mail, Loader2, Eye, EyeOff, ArrowRight, AlertCircle, Check, X } from 'lucide-react';
import { formatRegisterError } from '../../utils/authErrors';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password2: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = formData.email.trim().toLowerCase();
    if (!cleanEmail || !formData.password || !formData.password2) {
      setErrorMessage('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Введите корректный email');
      return;
    }

    if (formData.password !== formData.password2) {
      setErrorMessage('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Пароль должен состоять как минимум из 8 символов');
      return;
    }

    // The account is identified by email; a unique username is derived from it.
    const base = cleanEmail.split('@')[0].replace(/[^a-z0-9._-]/g, '').slice(0, 24) || 'user';

    setLoading(true);
    try {
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 4; attempt++) {
        const username = attempt === 0 ? base : `${base}${Math.floor(1000 + Math.random() * 9000)}`;
        try {
          await register({
            username,
            email: cleanEmail,
            password: formData.password,
            password2: formData.password2,
          });
          navigate('/');
          return;
        } catch (err: unknown) {
          lastError = err;
          const msg = err instanceof Error ? err.message : '';
          // Retry only when the generated username was taken, not when the email exists.
          if (!/логином|username/i.test(msg)) break;
        }
      }
      const msg = lastError instanceof Error ? lastError.message : formatRegisterError(lastError);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-[#e4e8e1] dark:bg-[#26382f]' };
    if (pass.length < 8) return { score: 1, label: 'Слабый', color: 'bg-red-500' };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    if (pass.length >= 10 && (hasNum || hasSpecial)) {
      return { score: 3, label: 'Отличный', color: 'bg-emerald-500' };
    }
    return { score: 2, label: 'Хороший', color: 'bg-amber-500' };
  };

  const pwdStrength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password2.length > 0 && formData.password === formData.password2;
  const passwordsMismatch = formData.password2.length > 0 && formData.password !== formData.password2;

  const bar = (n: number) =>
    `flex-1 rounded-full ${pwdStrength.score >= n ? pwdStrength.color : 'bg-[#e4e8e1] dark:bg-[#26382f]'}`;

  return (
    <AuthShell
      heading="Ҳисоби худро созед"
      lead="Мағозаро дар чанд дақиқа ба кор дароред: маҳсулот, фурӯш ва ҳисобот дар як ҷой."
      features={['Идораи анбор', 'Таҳлил ва ҳисобот', 'Асбобҳои муосир']}
    >
      <div className="mb-8">
        <h2 className="font-['Manrope',sans-serif] text-[28px] font-extrabold tracking-tight">{t('registerTitle')}</h2>
        <p className="mt-1.5 text-sm text-[#5b6b63]">Создайте аккаунт для работы с системой</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {errorMessage && (
          <div role="alert" className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <AuthField
          id="register-email-input"
          name="email"
          label="Email *"
          icon={Mail}
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="email"
          placeholder="example@mail.com"
        />

        <AuthField
          id="register-password-input"
          name="password"
          label={`${t('registerPasswordLabel')} *`}
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
          placeholder="Минимум 8 символов"
          trailing={<button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-[#5b6b63] hover:text-[#11201a]"
              aria-label="Toggle"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>}
        />

        <AuthField
          id="register-password2-input"
          name="password2"
          label={`${t('registerPassword2Label')} *`}
          icon={Lock}
          type={showPassword2 ? 'text' : 'password'}
          value={formData.password2}
          onChange={handleChange}
          required
          autoComplete="new-password"
          placeholder="Повторите пароль"
          trailing={<button
              type="button"
              onClick={() => setShowPassword2(!showPassword2)}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-[#5b6b63] hover:text-[#11201a]"
              aria-label="Toggle"
            >
              {showPassword2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>}
        />

        {formData.password && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex gap-1 h-1.5">
                <div className={bar(1)} />
                <div className={bar(2)} />
                <div className={bar(3)} />
              </div>
              <span className="text-xs font-medium text-[#5b6b63]">{pwdStrength.label}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5b6b63]">Минимум 8 символов</span>
              {passwordsMatch && <span className="text-[#0a5c40] flex items-center gap-1"><Check className="w-3 h-3" />Совпадают</span>}
              {passwordsMismatch && <span className="text-red-600 flex items-center gap-1"><X className="w-3 h-3" />Не совпадают</span>}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-[52px] rounded-xl font-bold text-[15px] text-white bg-[#0f7a55] hover:bg-[#0a5c40] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Создание...</span></> : <><span>{t('registerSubmitBtn')}</span><ArrowRight className="w-4 h-4" /></>}
        </button>

        <div className="flex items-center gap-3 text-xs text-[#5b6b63]">
          <span className="flex-1 h-px bg-[#e4e8e1] dark:bg-[#26382f]" />
          <span>или</span>
          <span className="flex-1 h-px bg-[#e4e8e1] dark:bg-[#26382f]" />
        </div>

        <GoogleButton
          text="signup_with"
          onCredential={async (credential) => {
            setErrorMessage('');
            try {
              await loginWithGoogle(credential);
              navigate('/');
            } catch (err: unknown) {
              setErrorMessage(err instanceof Error ? err.message : 'Не удалось зарегистрироваться через Google');
            }
          }}
        />

        <p className="text-center text-sm text-[#5b6b63]">
          {t('hasAccount')}{' '}
          <Link to="/login" className="font-semibold text-[#0f7a55] hover:underline">
            {t('loginLink')}
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;
