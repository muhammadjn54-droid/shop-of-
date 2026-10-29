import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, FileSpreadsheet, Menu, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

const NAV_ITEMS = [
  { key: 'lpNavFeatures', href: '#features' },
  { key: 'lpNavHow', href: '#how-it-works' },
  { key: 'lpNavBenefits', href: '#benefits' },
  { key: 'lpNavFaq', href: '#faq' },
] as const;

export const LandingNav = () => {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 border-b bg-[var(--lp-bg)]/95 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? 'border-[var(--lp-line)] shadow-[0_8px_24px_-20px_rgba(20,32,26,0.45)]'
          : 'border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:h-[72px] lg:px-8">
        <Link to="/" onClick={() => window.scrollTo(0, 0)} className="flex shrink-0 items-center gap-2.5" aria-label="Excel Pro">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--lp-emerald-solid)] text-white shadow-[var(--lp-shadow-sm)]">
            <FileSpreadsheet className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--lp-ink)]">
              Excel Pro
            </span>
            <span className="hidden rounded bg-[var(--lp-emerald-tint)] px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.08em] text-[var(--lp-emerald)] sm:inline">
              PRO
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label={t('lpMainNav')}
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[13px] font-medium text-[var(--lp-muted)] transition-all hover:bg-[var(--lp-surface-alt)] hover:text-[var(--lp-ink)] hover:scale-105"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <LanguageSwitcher />
          <Link
            to="/login"
            className="rounded-full px-3.5 py-2 text-[13px] font-medium text-[var(--lp-ink-soft)] transition-colors hover:bg-[var(--lp-surface-alt)] hover:text-[var(--lp-ink)]"
          >
            {t('lpNavLogin')}
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--lp-emerald-solid)] px-4 py-2 text-[13px] font-semibold text-white shadow-[var(--lp-shadow-sm)] transition-all hover:bg-[var(--lp-emerald-solid-hover)] hover:shadow-[0_8px_20px_-8px_rgba(16,124,65,0.6)] hover:-translate-y-0.5"
          >
            {t('lpNavRegister')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface)] text-[var(--lp-ink)] shadow-[var(--lp-shadow-sm)]"
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            aria-label={mobileOpen ? t('lpMenuClose') : t('lpMenuOpen')}
          >
            {mobileOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        id="landing-mobile-menu"
        hidden={!mobileOpen}
        className="border-t border-[var(--lp-line)] bg-[var(--lp-bg)] px-4 pb-5 pt-3 lg:hidden"
      >
        <nav className="flex flex-col gap-1" aria-label={t('lpMainNav')}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--lp-ink-soft)] transition-colors hover:bg-[var(--lp-surface-alt)] hover:text-[var(--lp-ink)]"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--lp-line)] pt-4">
          <Link
            to="/login"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center justify-center rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface)] px-4 py-2.5 text-[13px] font-semibold text-[var(--lp-ink)]"
          >
            {t('lpNavLogin')}
          </Link>
          <Link
            to="/register"
            onClick={() => setMobileOpen(false)}
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--lp-emerald-solid)] px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            {t('lpNavRegister')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default LandingNav;
