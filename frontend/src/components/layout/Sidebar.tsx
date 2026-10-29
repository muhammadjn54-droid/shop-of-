import { NavLink } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { usePwa } from '../../context/PwaContext';
import { type Language } from '../../i18n/translations';
import { prefetchRoute } from '../../utils/prefetch';
import { FlagIcon } from '../common/FlagIcon';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  LogOut,
  User as UserIcon,
  Sun,
  Moon,
  ScanBarcode,
  BookOpen,
  Download,
  Warehouse,
  FileBarChart,
  Bot,
  Settings,
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'tg', label: 'ТҶ' },
  { code: 'ru', label: 'РУ' },
  { code: 'en', label: 'EN' },
];

const BOTTOM_BAR_PATHS = new Set(['/', '/products', '/pos', '/sales', '/profile']);

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { installApp, isInstalled } = usePwa();

  const navSections = [
    {
      label: t('navGroupSales'),
      items: [
        { name: t('navDashboard'), path: '/', icon: LayoutDashboard },
        { name: t('navPos'), path: '/pos', icon: ScanBarcode },
        { name: t('navSales'), path: '/sales', icon: ShoppingCart },
        { name: t('navDebts'), path: '/debts', icon: BookOpen },
      ],
    },
    {
      label: t('navGroupWarehouse'),
      items: [
        { name: t('navProducts'), path: '/products', icon: Package },
        { name: t('navStock'), path: '/stock', icon: Warehouse },
      ],
    },
    {
      label: t('navGroupFinance'),
      items: [
        { name: t('navStatistics'), path: '/statistics', icon: BarChart3 },
        { name: t('navReports'), path: '/reports', icon: FileBarChart },
      ],
    },
    {
      label: t('navGroupSystem'),
      items: [
        { name: t('navEmployees'), path: '/employees', icon: Users },
        { name: t('navAi'), path: '/ai', icon: Bot },
        { name: t('navSettings'), path: '/settings', icon: Settings },
        { name: t('navProfile'), path: '/profile', icon: UserIcon },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[1px] md:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky md:top-0 md:h-screen md:shrink-0 inset-y-0 left-0 z-40 w-64 bg-[#0e2a21] dark:bg-[#0a1f18] border-r border-[#0e2a21] dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation list */}
        <div className="flex-1 min-h-0 overflow-y-auto py-5 px-3 space-y-5 sidebar-scroll">
          
          {navSections.map((section) => (
            <div key={section.label} className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8fb0a2]">
                {section.label}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isBottomTab = BOTTOM_BAR_PATHS.has(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    onMouseEnter={() => prefetchRoute(item.path)}
                    onFocus={() => prefetchRoute(item.path)}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `${isBottomTab ? 'hidden md:flex' : 'flex'} items-center gap-2.5 px-3 py-2.5 rounded-[10px] text-[14px] font-medium transition-all ${
                        isActive
                          ? 'bg-white/12 text-white font-semibold'
                          : 'text-[#cfe3d9] hover:bg-white/8 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* Mobile controls: Language and Theme Switcher (visible on mobile drawer) */}
        <div className="md:hidden px-3 pt-3 pb-1 border-t border-[#cbd5e1] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-950/60">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-800 shadow-2xs">
            {/* Language tabs */}
            <div className="flex items-center gap-1">
              {LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => setLang(item.code)}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer ${
                    lang === item.code
                      ? 'bg-[#107c41] text-white shadow-2xs'
                      : 'text-[#64748b] dark:text-slate-400 hover:text-[#1e293b] dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FlagIcon code={item.code} className="w-3.5 h-2.5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Dark/Light mode toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#1e293b] dark:text-slate-100 transition-colors cursor-pointer"
              title={theme === 'dark' ? t('themeLight') : t('themeDark')}
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#107c41]" />
              )}
            </button>
          </div>
        </div>

        {/* Install App card in Sidebar */}
        {!isInstalled && (
          <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-emerald-950/20 border border-emerald-100 dark:border-emerald-800/60">
            <div className="flex items-center gap-1.5 mb-1">
              <Download className="w-3.5 h-3.5 text-[#107c41] dark:text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                {t('installApp')}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-snug">
              {t('installAppDesc')}
            </p>
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                installApp();
              }}
              className="w-full py-2 px-2 bg-[#0f7a55] hover:bg-[#0a5c40] text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('installAppShort')}</span>
            </button>
          </div>
        )}

        {/* User info & Logout at bottom */}
        <div className="p-3 border-t border-white/10">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-2.5 mb-2.5 px-1 py-1 rounded hover:bg-white/8 transition-colors group cursor-pointer"
            title={t('profileTitle')}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#14916a] to-[#0f7a55] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate transition-colors" title={user?.username}>
                {user?.username || 'User'}
              </p>
              <p className="text-[10px] text-[#8fb0a2] truncate" title={user?.email || 'Active'}>
                {user?.email || 'Активен'}
              </p>
            </div>
          </NavLink>

          <button
            onClick={() => {
              if (onClose) onClose();
              logout();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 bg-transparent hover:bg-white/8 text-[#ffb4a9] text-[13px] font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
