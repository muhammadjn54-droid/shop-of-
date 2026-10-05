import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowRight, Loader2, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatErrorMessage } from '../../components/common/ErrorState';
import { AuthError, AuthLayout, PasswordField, authButtonClass, authInputClass, authLinkClass } from './AuthLayout';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setErrorMessage('');
    if (!username.trim() || !password) {
      setErrorMessage('Пожалуйста, заполните все поля');
      return;
    }
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      navigate('/', { replace: true });
    } catch (error: unknown) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Вход в систему" description="Введите логин и пароль вашей учётной записи">
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
        <AuthError message={errorMessage} />
        <div>
          <label htmlFor="login-username-input" className="block font-medium text-[#334155] mb-1">Имя пользователя (Логин) или Email</label>
          <div className="relative flex items-center">
            <User className="absolute left-3 w-4 h-4 text-[#94a3b8]" />
            <input id="login-username-input" name="username" type="text" value={username} onChange={(event) => setUsername(event.target.value)} required autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="username" autoFocus placeholder="Введите логин или Email" className={`${authInputClass} pl-9`} />
          </div>
        </div>
        <PasswordField id="login-password-input" name="password" label="Пароль" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" placeholder="••••••••" />
        <div className="text-right"><Link to="/forgot-password" className={authLinkClass}>Забыли пароль?</Link></div>
        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Проверка данных...</span></> : <><span>Войти в систему</span><ArrowRight className="w-4 h-4" /></>}
        </button>
        <p className="text-center text-[#64748b]">Нет аккаунта? <Link to="/register" className={authLinkClass}>Зарегистрироваться</Link></p>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
