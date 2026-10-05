import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatErrorMessage } from '../../components/common/ErrorState';
import { AuthError, AuthLayout, PasswordField, authButtonClass, authInputClass, authLinkClass } from './AuthLayout';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setErrorMessage('');
    if (!username.trim()) {
      setErrorMessage('Введите имя пользователя');
      return;
    }
    if (password !== password2) {
      setErrorMessage('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await register({ username: username.trim(), ...(email.trim() ? { email: email.trim() } : {}), password, password2 });
      navigate('/', { replace: true });
    } catch (error: unknown) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Регистрация" description="Создайте аккаунт для учёта товаров и продаж">
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
        <AuthError message={errorMessage} />
        <div>
          <label htmlFor="register-username" className="block font-medium text-[#334155] mb-1">Имя пользователя (Логин)</label>
          <input id="register-username" name="username" value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={150} autoComplete="username" autoCapitalize="none" spellCheck={false} autoFocus placeholder="Придумайте логин" className={authInputClass} />
        </div>
        <div>
          <label htmlFor="register-email" className="block font-medium text-[#334155] mb-1">Email <span className="font-normal text-[#64748b]">(необязательно)</span></label>
          <input id="register-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" aria-describedby="register-email-hint" className={authInputClass} />
          <p id="register-email-hint" className="text-[11px] text-[#64748b] mt-1">Нужен для восстановления доступа, если вы забудете пароль.</p>
        </div>
        <PasswordField id="register-password" name="password" label="Пароль" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" aria-describedby="register-password-hint" />
        <p id="register-password-hint" className="text-[11px] text-[#64748b]">Минимум 8 символов. Избегайте простых паролей и паролей только из цифр.</p>
        <PasswordField id="register-password-confirm" name="password2" label="Повторите пароль" value={password2} onChange={(event) => setPassword2(event.target.value)} required minLength={8} autoComplete="new-password" />
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Создание аккаунта...</span></> : <><span>Создать аккаунт</span><ArrowRight className="w-4 h-4" /></>}
        </button>
        <p className="text-center text-[#64748b]">Уже есть аккаунт? <Link to="/login" className={authLinkClass}>Войти</Link></p>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
