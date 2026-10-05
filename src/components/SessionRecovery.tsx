import { useAuth } from '../context/AuthContext';
import ErrorState from './common/ErrorState';

export default function SessionRecovery() {
  const { sessionError, retrySession, logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 gap-3">
      <div className="w-full max-w-md"><ErrorState error={sessionError} onRetry={() => void retrySession()} /></div>
      <p className="text-xs text-[#64748b]">Вход сохранён. Проверьте соединение и повторите попытку.</p>
      <button className="text-xs text-[#107c41] hover:underline" onClick={() => void logout()}>Выйти из аккаунта</button>
    </div>
  );
}
