import type { ReactNode, InputHTMLAttributes } from 'react';
import { Store, Sun, Moon, Check, type LucideIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { FlagIcon } from '../common/FlagIcon';
import type { Language } from '../../i18n/translations';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'tg', label: 'ТҶ' },
  { code: 'ru', label: 'РУ' },
  { code: 'en', label: 'EN' },
];

interface AuthShellProps {
  heading: string;
  lead: string;
  features: string[];
  children: ReactNode;
}

/** Split-screen layout shared by the sign-in and sign-up pages. */
export const AuthShell = ({ heading, lead, features, children }: AuthShellProps) => {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f3f5f1] dark:bg-[#0a1410] text-[#11201a] dark:text-[#eaf3ee]">
      <section className="relative hidden lg:flex lg:w-[46%] flex-col justify-between gap-12 p-14 bg-[#0e2a21] text-white overflow-hidden">
        <div className="auth-orb absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-[#0f7a55]/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0f7a55] flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
          <span className="font-['Manrope',sans-serif] text-[22px] font-extrabold">{t('appName')}</span>
        </div>

        <div className="relative max-w-lg space-y-5">
          <h1 className="font-['Manrope',sans-serif] text-[44px] leading-[1.1] font-extrabold tracking-tight">{heading}</h1>
          <p className="text-[17px] leading-relaxed text-[#b9d3c7]">{lead}</p>
        </div>

        <ul className="relative flex flex-wrap gap-3">
          {features.map((f) => (
            <li key={f} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-[#e6f2ec]">
              <Check className="w-4 h-4 text-[#8be0b4]" />
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="relative flex-1 flex items-center justify-center px-5 py-16 sm:px-8">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#12201a] border border-[#e4e8e1] dark:border-[#26382f] text-[#5b6b63] hover:text-[#11201a] dark:hover:text-white"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#12201a] border border-[#e4e8e1] dark:border-[#26382f]">
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLang(item.code)}
                className={`flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg ${
                  lang === item.code ? 'bg-[#0f7a55] text-white' : 'text-[#5b6b63] hover:text-[#11201a] dark:hover:text-white'
                }`}
              >
                <FlagIcon code={item.code} className="w-3.5 h-2.5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="auth-card w-full max-w-[26rem] rounded-3xl bg-white dark:bg-[#12201a] border border-[#e4e8e1] dark:border-[#26382f] p-8 sm:p-10 shadow-[0_24px_60px_-30px_rgba(14,42,33,0.35)]">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[#0f7a55] text-white flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-['Manrope',sans-serif] text-lg font-extrabold">{t('appName')}</span>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
};

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  hint?: string;
  trailing?: ReactNode;
}

export const AuthField = ({ label, icon: Icon, hint, trailing, id, ...rest }: AuthFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={id} className="flex items-baseline justify-between text-[13px] font-semibold">
      <span>{label}</span>
      {hint && <span className="text-xs font-normal text-[#5b6b63]">{hint}</span>}
    </label>
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#5b6b63]" />
      <input
        id={id}
        {...rest}
        className="w-full h-[50px] pl-11 pr-11 rounded-xl border border-[#d5dbd3] dark:border-[#26382f] bg-white dark:bg-[#0f1c17] text-[15px] placeholder:text-[#8a978f] focus:outline-none focus:border-[#0f7a55] focus:ring-4 focus:ring-[#0f7a55]/15 transition-shadow"
      />
      {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  </div>
);
