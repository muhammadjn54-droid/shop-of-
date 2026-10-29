import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { type Language } from '../../i18n/translations';
import {
  FileSpreadsheet,
  Menu,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Check,
  Search,
  ScanBarcode,
  Bell,
  Download,
} from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { notificationsApi } from '../../api/erp';
import { usePwa } from '../../context/PwaContext';
import { FlagIcon } from '../common/FlagIcon';
import type { Notification } from '../../types/erp';

export interface TopbarProps {
  onToggleSidebar?: () => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'tg', label: 'Тоҷикӣ' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

export const Topbar = ({ onToggleSidebar }: TopbarProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { installApp, isInstalled } = usePwa();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [topSearch, setTopSearch] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = topSearch.trim();
    if (!query) return;
    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.list({ limit: 20 });
      setNotifications(res.results || []);
      setUnreadCount(res.unread || 0);
    } catch {
      // Ignore background notification check errors
    }
  };

  useEffect(() => {
    fetchNotifications();
    notificationsApi.check().then(fetchNotifications).catch(() => undefined);
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const openNotifications = () => {
    setNotificationsOpen((open) => !open);
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.readAll();
      fetchNotifications();
    } catch {
      // Ignore
    }
  };

  const openNotification = async (item: Notification) => {
    setNotificationsOpen(false);
    if (!item.isRead) {
      try {
        await notificationsApi.read(item.id);
        fetchNotifications();
      } catch {
        // Ignore
      }
    }
    if (item.link) navigate(item.link);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[1];

  return (
    <>
      <header className="h-14 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl text-slate-800 dark:text-slate-100 border-b border-[#e8eaf2] dark:border-slate-800 flex items-center justify-between px-3 md:px-5 select-none z-20 relative">
        {/* Left section: Hamburger for mobile + App title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            title={t('menu')}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & title: hidden on mobile, visible on tablet and desktop */}
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#0f7a55] text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-700/20">
              <FileSpreadsheet className="w-[18px] h-[18px]" />
            </div>
            <h1 className="font-['Manrope',sans-serif] text-[16px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{t('appName')}</span>
              <span className="hidden sm:inline-block text-[10px] font-semibold px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-md text-emerald-700 dark:text-emerald-300">
                {t('excelCrm')}
              </span>
            </h1>
          </div>
        </div>

        {/* Center section: Quick Barcode & Name search (always visible, full width on mobile) */}
        <form
          onSubmit={handleSearch}
          className="flex flex-1 max-w-md mx-2 sm:mx-4"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={topSearch}
              onChange={(e) => setTopSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full h-9 pl-9 pr-9 rounded-lg bg-slate-100/80 dark:bg-slate-800 focus:bg-white text-slate-800 dark:text-slate-100 placeholder-slate-400 text-[13px] border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="submit"
              title="Штрихкод / Поиск"
              className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
            >
              <ScanBarcode className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Mobile Install button */}
        {!isInstalled && (
          <button
            type="button"
            id="install-pwa-mobile-btn"
            onClick={installApp}
            className="md:hidden px-2.5 py-1 rounded bg-[#0f7a55] text-white hover:bg-[#0a5c40] font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
            title={t('installAppDesc')}
            aria-label={t('installApp')}
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span className="text-[11px] font-bold">{t('installAppShort')}</span>
          </button>
        )}

        {/* Right section: Theme Toggle, Language Selector & User Profile (Desktop/Tablet only) */}
        <div className="hidden md:flex items-center gap-2">
          {/* Quick Cashier / POS button */}
          <button
            type="button"
            onClick={() => navigate('/pos')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-transparent text-[13px] font-semibold text-white transition-all shadow-2xs cursor-pointer"
            title={lang === 'tg' ? 'Гузариш ба касса (POS)' : 'Перейти в кассу (POS)'}
          >
            <ScanBarcode className="w-3.5 h-3.5 text-white/80" />
            <span>{lang === 'tg' ? 'Касса' : 'Касса'}</span>
          </button>

          {/* Quick Install App button in Header */}
          {!isInstalled && (
            <button
              type="button"
              id="install-pwa-header-btn"
              onClick={installApp}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#0f7a55] text-white hover:bg-[#0a5c40] border border-transparent font-semibold text-[13px] shadow-sm shadow-emerald-600/20 transition-all shadow-xs active:scale-95 cursor-pointer animate-in fade-in"
              title={t('installAppDesc')}
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>{t('installAppShort')}</span>
            </button>
          )}

          {/* Notifications Bell Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-[#e2e5ef] dark:border-slate-700 text-slate-600 dark:text-slate-200 transition-all cursor-pointer flex items-center justify-center"
              title={lang === 'tg' ? 'Огоҳиномаҳои анбор' : 'Оповещения склада'}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-500 dark:text-slate-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center shadow-xs animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Menu */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-[#cbd5e1] dark:border-slate-700 text-[#1e293b] dark:text-slate-100 z-50 text-xs overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3.5 py-2.5 bg-[#f8fafc] dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[#107c41] dark:text-emerald-400" />
                    <span className="font-bold">
                      {lang === 'tg' ? 'Огоҳиномаҳо' : 'Уведомления'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400">
                      {unreadCount}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[10px] font-semibold text-[#107c41] dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {lang === 'tg' ? 'Ҳамаро хондам' : 'Прочитать всё'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                      <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                      <p className="font-medium">
                        {lang === 'tg' ? 'Огоҳинома нест' : 'Уведомлений нет'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {lang === 'tg' ? 'Ҳама чиз дар тартиб аст' : 'Всё в порядке'}
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => openNotification(item)}
                        className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer ${
                          item.isRead ? 'opacity-70' : 'bg-emerald-50/50 dark:bg-emerald-950/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.title}
                          </p>
                          {!item.isRead && (
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {formatDateTime(item.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate('/products');
                    }}
                    className="text-[11px] font-semibold text-[#107c41] dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    {lang === 'tg' ? 'Гузаштан ба анбори молҳо →' : 'Открыть склад товаров →'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dark / Light Mode Toggle Button */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-[#e2e5ef] dark:border-slate-700 text-slate-600 dark:text-slate-200 transition-all cursor-pointer flex items-center justify-center"
            title={theme === 'dark' ? t('themeLight') : t('themeDark')}
            aria-label="Toggle Dark/Light Mode"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300 animate-in spin-in-90 duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-500 dark:text-slate-300 animate-in spin-in-90 duration-200" />
            )}
          </button>

          {/* Language Switcher Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              id="lang-dropdown-btn"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-[#e2e5ef] dark:border-slate-700 text-[13px] font-medium text-slate-700 dark:text-slate-200 transition-all shadow-2xs cursor-pointer"
              title={t('language')}
            >
              <FlagIcon code={currentLangObj.code} className="w-4 h-2.5" />
              <span className="hidden sm:inline-block">{currentLangObj.label}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-slate-900/10 border border-[#cbd5e1] dark:border-slate-700 text-[#1e293b] dark:text-slate-100 py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                {LANGUAGES.map((item) => (
                  <button
                    key={item.code}
                    onClick={() => {
                      setLang(item.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-[#f1f5f9] dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                      lang === item.code ? 'font-bold text-[#107c41] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40' : ''
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FlagIcon code={item.code} className="w-4 h-2.5" />
                      <span>{item.label}</span>
                    </span>
                    {lang === item.code && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-[#e2e5ef] dark:border-slate-700 text-[13px] font-medium text-slate-700 dark:text-slate-200 transition-all shadow-2xs cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="max-w-[120px] truncate">{user?.username || 'User'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl shadow-slate-900/10 border border-[#cbd5e1] dark:border-slate-700 text-[#1e293b] dark:text-slate-100 py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#e2e8f0] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900">
                  <p className="font-semibold text-[#1e293b] dark:text-slate-100 truncate">{user?.username}</p>
                  {user?.email && (
                    <p className="text-[11px] text-[#64748b] dark:text-slate-400 truncate">{user.email}</p>
                  )}
                  {user?.date_joined && (
                    <p className="text-[10px] text-[#94a3b8] dark:text-slate-500 mt-0.5">
                      {t('registeredSince')} {formatDate(user.date_joined)}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#f1f5f9] dark:hover:bg-slate-700 text-[#334155] dark:text-slate-200 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#64748b] dark:text-slate-400" />
                  <span>{t('myAccount')}</span>
                </button>

                {!isInstalled && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      installApp();
                    }}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[#107c41] dark:text-emerald-400 font-semibold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#107c41] dark:text-emerald-400" />
                    <span>{t('installApp')}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#fef2f2] dark:hover:bg-rose-950/40 text-[#dc2626] dark:text-rose-400 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#dc2626] dark:text-rose-400" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Topbar;
