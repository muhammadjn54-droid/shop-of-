import { BarChart3, PackagePlus, ScanBarcode } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Reveal from './Reveal';

const STEPS = [
  { number: '01', icon: PackagePlus, titleKey: 'lpStep1Title', descKey: 'lpStep1Desc' },
  { number: '02', icon: ScanBarcode, titleKey: 'lpStep2Title', descKey: 'lpStep2Desc' },
  { number: '03', icon: BarChart3, titleKey: 'lpStep3Title', descKey: 'lpStep3Desc' },
] as const;

export const HowItWorksSection = () => {
  const { t } = useLanguage();

  return (
    <section
      id="how-it-works"
      className="landing-section border-y border-[var(--lp-line)] bg-[var(--lp-surface-alt)] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--lp-emerald)] sm:text-[11px]">
            {t('lpHowEyebrow')}
          </p>
          <h2 className="mt-4 text-balance text-[1.8rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--lp-ink)] sm:text-[2.4rem]">
            {t('lpHowTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-pretty text-sm leading-7 text-[var(--lp-muted)] sm:text-[15px]">
            {t('lpHowSubtitle')}
          </p>
        </Reveal>

        <div className="relative mt-12 sm:mt-14">
          <div
            className="absolute left-[16%] right-[16%] top-6 hidden border-t border-dashed border-[var(--lp-line-strong)] md:block"
            aria-hidden="true"
          />
          <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.number} className="relative">
                  <Reveal delay={index * 90}>
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-12 w-12 items-center justify-center rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface)] text-[var(--lp-emerald)] shadow-[var(--lp-shadow-sm)]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] font-semibold tracking-[0.18em] text-[var(--lp-emerald)]">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.01em] text-[var(--lp-ink)] sm:text-lg">
                      {t(step.titleKey)}
                    </h3>
                    <p className="mt-2 max-w-xs text-sm leading-7 text-[var(--lp-muted)]">
                      {t(step.descKey)}
                    </p>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
