import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { updateProfile, changePassword } from '../api/auth';
import { getStatistics } from '../api/dashboard';
import { formatMoney, formatDateTime } from '../utils/formatters';
import type { StatisticsData } from '../types';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  KeyRound,
  ShieldCheck,
  Calendar,
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Sun,
  Moon,
  Globe,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Hash,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, refreshUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLanguage, t } = useLanguage();

  // Profile fields state
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password fields state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Store statistics state
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Update form inputs when user changes
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Fetch statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStatistics();
        setStats(data);
      } catch (err) {
        console.warn('Could not load profile store stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Handle Profile Update
  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error(lang === 'tg' ? 'Номи корбарро ворид кунед' : 'Введите имя пользователя');
      return;
    }

    setSavingProfile(true);
    try {
      await updateProfile({
        username: username.trim(),
        email: email.trim() || undefined,
      });
      await refreshUser();
      toast.success(t('profileUpdatedSuccess'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || 'Ошибка обновления профиля');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      toast.error(lang === 'tg' ? 'Пароли кунуниро ворид кунед' : 'Введите старый пароль');
      return;
    }
    if (newPassword.length < 6) {
      toast.error(
        lang === 'tg'
          ? 'Пароли нав бояд ҳадди ақал 6 рамз бошад'
          : 'Новый пароль должен содержать минимум 6 символов'
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        oldPassword,
        newPassword,
      });
      toast.success(t('passwordChangedSuccess'));
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg || 'Не удалось сменить пароль');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 font-['Inter',sans-serif] max-w-5xl mx-auto w-full pb-8">
      {/* Page Title Card */}
      <div className="bg-white border border-[#cbd5e1] rounded-md p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#107c41] text-white flex items-center justify-center font-bold shadow-2xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1e293b] leading-tight">
                {t('profileTitle')}
              </h1>
              <p className="text-xs text-[#64748b]">
                {t('profileSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#fca5a5] hover:bg-[#fef2f2] text-[#dc2626] rounded text-xs font-medium transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Summary Banner */}
      <div className="bg-white border border-[#cbd5e1] rounded-md p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#f0fdf4] text-[#107c41] border-2 border-[#86efac] flex items-center justify-center text-2xl font-black shadow-inner">
              {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-[#1e293b]">
                  {user?.username || 'User'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f0fdf4] text-[#15803d] border border-[#86efac]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse"></span>
                  {t('activeAccount')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#64748b]">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <span>{user?.email || (lang === 'tg' ? 'Email нишон дода нашудааст' : 'Email не указан')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#94a3b8]" />
                  <span>ID: <strong className="font-mono text-[#334155]">{user?.id}</strong></span>
                </div>
                {user?.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" />
                    <span>{t('registrationDate')}: {formatDateTime(user.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Statistics Mini-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#cbd5e1] p-3 rounded-md shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-[11px] font-medium">{t('totalProductsStat')}</span>
            <Package className="w-3.5 h-3.5 text-[#3b82f6]" />
          </div>
          <div className="text-base font-extrabold text-[#1e293b] tabular-nums">
            {statsLoading ? '...' : stats?.products_count || 0}
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-0.5">
            {lang === 'tg' ? 'Дар анбори шумо' : 'В каталоге'}
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] p-3 rounded-md shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-[11px] font-medium">{t('totalSoldStat')}</span>
            <ShoppingCart className="w-3.5 h-3.5 text-[#7c3aed]" />
          </div>
          <div className="text-base font-extrabold text-[#1e293b] tabular-nums">
            {statsLoading ? '...' : `${stats?.total_items_sold || 0} ${t('pieces')}`}
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-0.5">
            {lang === 'tg' ? 'Фурӯши умумӣ' : 'Реализовано'}
          </div>
        </div>

        <div className="bg-white border border-[#cbd5e1] p-3 rounded-md shadow-2xs">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-[11px] font-medium">{t('totalRevenueStat')}</span>
            <DollarSign className="w-3.5 h-3.5 text-[#0369a1]" />
          </div>
          <div className="text-base font-extrabold text-[#0369a1] tabular-nums">
            {statsLoading ? '...' : formatMoney(stats?.total_revenue || 0)}
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-0.5">
            {lang === 'tg' ? 'Ҳаҷми даромад' : 'Оборот магазина'}
          </div>
        </div>

        <div className="bg-[#f0fdf4] border border-[#86efac] p-3 rounded-md shadow-2xs">
          <div className="flex items-center justify-between text-[#166534] mb-1">
            <span className="text-[11px] font-semibold">{t('totalProfitStat')}</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#15803d]" />
          </div>
          <div className="text-base font-black text-[#15803d] tabular-nums">
            {statsLoading ? '...' : formatMoney(stats?.total_profit || 0)}
          </div>
          <div className="text-[10px] text-[#166534] mt-0.5">
            {lang === 'tg' ? 'Фоидаи холиси корбар' : 'Чистая прибыль'}
          </div>
        </div>
      </div>

      {/* Forms Section: Personal Info + Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Personal Details */}
        <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center gap-2">
            <User className="w-4 h-4 text-[#107c41]" />
            <h3 className="text-xs font-bold text-[#1e293b]">
              {t('editProfile')}
            </h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="p-4 space-y-3.5 flex-1 flex flex-col justify-between text-xs">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  {t('usernameLabel')} *
                </label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#94a3b8]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#94a3b8]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded text-[11px] text-[#64748b] space-y-1">
                <div className="flex justify-between">
                  <span>{t('userIdLabel')}:</span>
                  <span className="font-mono font-bold text-[#334155]">#{user?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('accountStatus')}:</span>
                  <span className="font-semibold text-[#15803d] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t('activeAccount')}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#107c41] hover:bg-[#0d6936] text-white rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingProfile ? t('savingChanges') : t('saveChanges')}</span>
            </button>
          </form>
        </div>

        {/* Card 2: Security & Password */}
        <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#cbd5e1] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#107c41]" />
            <h3 className="text-xs font-bold text-[#1e293b]">
              {t('changePassword')}
            </h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="p-4 space-y-3.5 flex-1 flex flex-col justify-between text-xs">
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  {t('currentPassword')} *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#94a3b8]" />
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  {t('newPassword')} *
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#94a3b8]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#475569] mb-1">
                  {t('confirmNewPassword')} *
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-[#94a3b8]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded text-xs font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{savingPassword ? t('savingChanges') : t('changePassword')}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Card 3: System Preferences (Theme + Language) */}
      <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs p-4">
        <h3 className="text-xs font-bold text-[#1e293b] mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#107c41]" />
          <span>{t('preferencesTitle')}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Theme Option */}
          <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <Moon className="w-4 h-4 text-[#38bdf8]" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <span className="font-semibold text-[#1e293b] block">
                  {theme === 'dark' ? t('themeDark') : t('themeLight')}
                </span>
                <span className="text-[11px] text-[#64748b]">
                  {lang === 'tg' ? 'Намуди равшан ё торик' : 'Светлый или тёмный режим интерфейса'}
                </span>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 bg-white border border-[#cbd5e1] hover:bg-[#f1f5f9] rounded font-medium text-xs text-[#334155] shadow-2xs transition-colors cursor-pointer"
            >
              {theme === 'dark' ? t('themeLight') : t('themeDark')}
            </button>
          </div>

          {/* Language Option */}
          <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-[#107c41]" />
              <div>
                <span className="font-semibold text-[#1e293b] block">{t('language')}</span>
                <span className="text-[11px] text-[#64748b]">
                  {lang === 'tg' ? 'Тоҷикӣ' : lang === 'en' ? 'English' : 'Русский'}
                </span>
              </div>
            </div>

            <div className="inline-flex rounded-md shadow-2xs bg-white border border-[#cbd5e1] p-0.5">
              <button
                onClick={() => setLanguage('tg')}
                className={`px-2 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                  lang === 'tg' ? 'bg-[#107c41] text-white font-bold' : 'text-[#475569] hover:bg-[#f1f5f9]'
                }`}
              >
                ТҶ
              </button>
              <button
                onClick={() => setLanguage('ru')}
                className={`px-2 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                  lang === 'ru' ? 'bg-[#107c41] text-white font-bold' : 'text-[#475569] hover:bg-[#f1f5f9]'
                }`}
              >
                РУ
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-[11px] rounded font-medium transition-colors cursor-pointer ${
                  lang === 'en' ? 'bg-[#107c41] text-white font-bold' : 'text-[#475569] hover:bg-[#f1f5f9]'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
