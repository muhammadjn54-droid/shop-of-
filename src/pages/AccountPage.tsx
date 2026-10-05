import { useState, type FormEvent } from 'react';
import { User, Check, Loader2, Calendar, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api/auth';
import { formatDate } from '../utils/formatters';
import { formatErrorMessage } from '../components/common/ErrorState';
import { authInputClass } from './auth/AuthLayout';

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const profile = await updateProfile({ username: username.trim(), first_name: firstName.trim(), last_name: lastName.trim() });
      setUser(profile);
      setUsername(profile.username);
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      toast.success('Данные аккаунта сохранены');
    } catch (err) { setError(formatErrorMessage(err)); }
    finally { setSaving(false); }
  };
  return (
    <div className="max-w-3xl mx-auto w-full space-y-4 text-xs">
      <div className="bg-white border border-[#cbd5e1] rounded-md p-3 shadow-2xs flex items-center gap-3">
        <div className="w-8 h-8 bg-[#107c41] text-white rounded flex items-center justify-center"><User className="w-4 h-4" /></div>
        <div><h1 className="text-sm font-bold text-[#1e293b]">Мой аккаунт</h1><p className="text-[11px] text-[#64748b]">Личные данные и имя пользователя</p></div>
      </div>
      <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs overflow-hidden">
        <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#f0fdf4] text-[#107c41] border border-[#86efac] flex items-center justify-center text-lg font-bold">{(user?.first_name || user?.username || 'U').charAt(0).toUpperCase()}</div>
          <div><p className="text-sm font-bold text-[#1e293b]">{[user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username}</p><p className="text-[#107c41] text-[11px] mt-1">Аккаунт активен</p></div>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <div role="alert" className="p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
          <div><label htmlFor="account-username" className="block font-medium text-[#334155] mb-1">Имя пользователя (Логин)</label><input id="account-username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required maxLength={150} className={authInputClass} /><p className="text-[11px] text-[#64748b] mt-1">После сохранения используйте новый логин для входа.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label htmlFor="account-first" className="block font-medium text-[#334155] mb-1">Имя</label><input id="account-first" value={firstName} onChange={e => setFirstName(e.target.value)} autoComplete="given-name" maxLength={150} className={authInputClass} /></div>
            <div><label htmlFor="account-last" className="block font-medium text-[#334155] mb-1">Фамилия</label><input id="account-last" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" maxLength={150} className={authInputClass} /></div>
          </div>
          <div className="bg-[#f8fafc] rounded border border-[#e2e8f0] p-3 space-y-2 text-[#475569]">
            <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email: {user?.email || 'Не указан'}</p>
            <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> В системе с {formatDate(user?.date_joined)}</p>
          </div>
          <div className="flex justify-end pt-3 border-t border-[#e2e8f0]"><button disabled={saving} className="px-4 py-2 bg-[#107c41] hover:bg-[#0d6936] text-white rounded font-medium flex items-center gap-2 disabled:opacity-50">{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}{saving ? 'Сохранение...' : 'Сохранить изменения'}</button></div>
        </form>
      </div>
    </div>
  );
}
