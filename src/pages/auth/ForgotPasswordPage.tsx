import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { requestPasswordReset } from '../../api/auth';
import { formatErrorMessage } from '../../components/common/ErrorState';
import { AuthError, AuthLayout, authButtonClass, authInputClass, authLinkClass } from './AuthLayout';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setErrorMessage('');
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (error: unknown) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Восстановление пароля" description="Введите Email, указанный при регистрации">
      <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
        <AuthError message={errorMessage} />
        {sent ? (
          <div role="status" className="p-3 bg-[#f0fdf4] border border-emerald-200 text-emerald-800 rounded leading-relaxed">Если аккаунт с этим Email существует, мы отправили письмо со ссылкой для восстановления. Проверьте входящие и папку «Спам».</div>
        ) : (
          <>
            <div>
              <label htmlFor="reset-email" className="block font-medium text-[#334155] mb-1">Email</label>
              <input id="reset-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} autoFocus placeholder="you@example.com" className={authInputClass} />
            </div>
            <button type="submit" disabled={loading} className={authButtonClass}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}<span>{loading ? 'Отправка...' : 'Отправить ссылку'}</span>
            </button>
          </>
        )}
        <Link to="/login" className={`${authLinkClass} flex items-center justify-center gap-1.5`}><ArrowLeft className="w-3.5 h-3.5" />Вернуться ко входу</Link>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
