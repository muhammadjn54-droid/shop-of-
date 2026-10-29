import { Check } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Reveal from './Reveal';

const BENEFITS = [
  { titleKey: 'lpBenefit1Title', descKey: 'lpBenefit1Desc' },
  { titleKey: 'lpBenefit2Title', descKey: 'lpBenefit2Desc' },
  { titleKey: 'lpBenefit3Title', descKey: 'lpBenefit3Desc' },
  { titleKey: 'lpBenefit4Title', descKey: 'lpBenefit4Desc' },
  { titleKey: 'lpBenefit5Title', descKey: 'lpBenefit5Desc' },
] as const;

export const BenefitsSection = () => {
  const { t } = useLanguage();

  return (
    <section id="benefits" className="landing-section py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16 xl:gap-24">
          <Reveal className="lg:sticky lg:top-28">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--lp-emerald)] sm:text-[11px]">
              {t('lpBenefitsEyebrow')}
            </p>
            <h2 className="mt-4 max-w-md text-balance text-[1.8rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--lp-ink)] sm:text-[2.4rem]">
              {t('lpBenefitsTitle')}
            </h2>
            <p className="mt-4 max-w-md text-pretty text-sm leading-7 text-[var(--lp-muted)] sm:text-[15px]">
              {t('lpBenefitsSubtitle')}
            </p>
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface-alt)] px-4 py-3 lg:max-w-sm">
              <span className="h-8 w-1 rounded-full bg-[var(--lp-emerald)]" aria-hidden="true" />
              <p className="text-[12px] font-medium leading-5 text-[var(--lp-ink-soft)]">
                {t('lpFooterTagline')}
              </p>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="overflow-hidden rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] shadow-[var(--lp-shadow-sm)]">
              <ul className="divide-y divide-[var(--lp-line)]">
                {BENEFITS.map((benefit, index) => (
                  <li key={benefit.titleKey} className="flex gap-4 px-4 py-5 sm:px-6">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--lp-emerald-tint)] text-[var(--lp-emerald)]">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--lp-ink)]">
                          {t(benefit.titleKey)}
                        </h3>
                        <span className="hidden text-[10px] font-semibold tabular-nums text-[var(--lp-muted)] sm:block">
                          0{index + 1}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-6 text-[var(--lp-muted)]">{t(benefit.descKey)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
