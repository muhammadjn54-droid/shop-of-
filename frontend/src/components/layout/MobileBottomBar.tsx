import { NavLink } from 'react-router';
import { useLanguage } from '../../context/LanguageContext';
import { type Language } from '../../i18n/translations';
import {
  LayoutDashboard,
  Package,
  ScanBarcode,
  ShoppingCart,
  User as UserIcon,
} from 'lucide-react';

type TabDef = {
  path: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  labels: Record<Language, string>;
};

const TABS: TabDef[] = [
  { path: '/', icon: LayoutDashboard, end: true, labels: { tg: 'Хулоса', ru: 'Сводка', en: 'Home' } },
  { path: '/products', icon: Package, labels: { tg: 'Молҳо', ru: 'Товары', en: 'Goods' } },
  { path: '/pos', icon: ScanBarcode, labels: { tg: 'Касса', ru: 'Касса', en: 'POS' } },
  { path: '/sales', icon: ShoppingCart, labels: { tg: 'Фурӯш', ru: 'Продажи', en: 'Sales' } },
  { path: '/profile', icon: UserIcon, labels: { tg: 'Профил', ru: 'Профиль', en: 'Profile' } },
];

export const MobileBottomBar = () => {
  const { lang } = useLanguage();

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white dark:bg-slate-900 border-t border-[#e2e8f0] dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-cols-5 h-[56px] items-center px-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.end}
              title={tab.labels[lang]}
              className="relative flex flex-col items-center justify-center h-full outline-none select-none transition-all duration-200"
            >
              {({ isActive }) => (
                <>
                  {/* Квадратный бейдж иконки в точности как на референсе */}
                  <div
                    className={`w-6 h-6 rounded-[5px] flex items-center justify-center transition-all duration-200 ${
                      isActive
                        ? 'bg-[#00897b] dark:bg-[#00897b] text-white shadow-2xs scale-105'
                        : 'bg-[#546e7a] dark:bg-slate-700 text-white hover:bg-[#455a64]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 stroke-[2.2]" />
                  </div>

                  {/* Текстовая подпись под ВСЕМИ табами */}
                  <span
                    className={`text-[9.5px] mt-1 leading-none tracking-tight truncate max-w-[62px] text-center transition-colors duration-150 ${
                      isActive
                        ? 'font-bold text-[#00897b] dark:text-teal-400'
                        : 'font-medium text-[#64748b] dark:text-slate-400'
                    }`}
                  >
                    {tab.labels[lang]}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomBar;
