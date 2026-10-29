import { Link } from 'react-router';
import { FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const PRODUCT_LINKS = [
  { key: 'lpNavFeatures', href: '#features' },
  { key: 'lpNavHow', href: '#how-it-works' },
  { key: 'lpNavBenefits', href: '#benefits' },
  { key: 'lpNavFaq', href: '#faq' },
] as const;

export const LandingFooter = () => {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--lp-line)] bg-[var(--lp-surface-alt)]">
      <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr] lg:gap-12">
          <div className="max-w-sm">
            <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex items-center gap-2.5" aria-label="Excel Pro">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--lp-emerald-solid)] text-white shadow-[var(--lp-shadow-sm)]">
                <FileSpreadsheet className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--lp-ink)]">
                Excel Pro
              </span>
            </Link>
            <p className="mt-4 text-[13px] leading-6 text-[var(--lp-muted)]">{t('lpFooterTagline')}</p>
          </div>

          <nav aria-label={t('lpFooterNav')}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--lp-muted)]">
              {t('lpFooterProduct')}
            </p>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-[13px] font-medium text-[var(--lp-ink-soft)] transition-colors hover:text-[var(--lp-emerald)]"
                  >
                    {t(item.key)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--lp-muted)]">
              {t('lpFooterAccount')}
            </p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  to="/login"
                  className="text-[13px] font-medium text-[var(--lp-ink-soft)] transition-colors hover:text-[var(--lp-emerald)]"
                >
                  {t('lpFooterLogin')}
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="text-[13px] font-medium text-[var(--lp-ink-soft)] transition-colors hover:text-[var(--lp-emerald)]"
                >
                  {t('lpFooterRegister')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--lp-muted)]">
              {t('lpFooterLanguage')}
            </p>
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-[var(--lp-line)] pt-6 text-[11px] text-[var(--lp-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} Excel Pro. {t('lpFooterRights')}
          </p>
          <p className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-[var(--lp-emerald)]" aria-hidden="true" />
            {t('appName')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
