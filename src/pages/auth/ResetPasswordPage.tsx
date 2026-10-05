import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Check, Loader2 } from 'lucide-react';
import { confirmPasswordReset } from '../../api/auth';
import { clearSession } from '../../api/session';
import { formatErrorMessage } from '../../components/common/ErrorState';
import { AuthError, AuthLayout, PasswordField, authButtonClass, authLinkClass } from './AuthLayout';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading || !uid || !token) return;
    setErrorMessage('');
    if (password !== confirmation) {
      setErrorMessage('Пароли не совпадают');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset({ uid, token, password, confirm_password: confirmation });
      clearSession();
      setComplete(true);
      setPassword('');
      setConfirmation('');
    } catch (error: unknown) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Новый пароль" description="Установите новый пароль для вашей учётной записи">
      <div className="p-6 space-y-4 text-xs">
        {complete ? (
          <>
            <div role="status" className="p-3 bg-[#f0fdf4] border border-emerald-200 text-emerald-800 rounded">Пароль изменён. Теперь вы можете войти с новым паролем.</div>
            <Link to="/login" className={authButtonClass}>Перейти ко входу</Link>
          </>
        ) : !uid || !token ? (
          <>
            <AuthError message="Ссылка для восстановления неполная. Запросите новое письмо." />
            <Link to="/forgot-password" className={authButtonClass}>Получить новую ссылку</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <AuthError message={errorMessage} />
            <PasswordField id="new-password" name="password" label="Новый пароль" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" autoFocus aria-describedby="new-password-hint" />
            <p id="new-password-hint" className="text-[11px] text-[#64748b]">Минимум 8 символов. Избегайте простых паролей и паролей только из цифр.</p>
            <PasswordField id="new-password-confirm" name="confirm_password" label="Повторите новый пароль" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={8} autoComplete="new-password" />
            <button type="submit" disabled={loading} className={authButtonClass}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}<span>{loading ? 'Сохранение...' : 'Сохранить пароль'}</span>
            </button>
            <p className="text-center"><Link to="/forgot-password" className={authLinkClass}>Запросить новую ссылку</Link></p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
