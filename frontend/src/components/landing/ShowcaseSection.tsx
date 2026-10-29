import { FileBarChart, Package, ScanBarcode } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import ProductPreview from './ProductPreview';
import { ScrollReveal } from './ScrollReveal';

export const ShowcaseSection = () => {
  const { t } = useLanguage();

  const callouts = [
    { icon: Package, label: t('lpFeatBadgeInventory') },
    { icon: ScanBarcode, label: t('lpFeatBadgePos') },
    { icon: FileBarChart, label: t('lpFeatBadgeReports') },
  ];

  return (
    <section
      id="product-preview"
      className="landing-section relative border-y border-[var(--lp-line)] bg-[var(--lp-surface-alt)] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--lp-emerald)] sm:text-[11px]">
            {t('lpShowcaseEyebrow')}
          </p>
          <h2 className="mt-4 text-balance text-[1.8rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--lp-ink)] sm:text-[2.4rem]">
            {t('lpShowcaseTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-7 text-[var(--lp-muted)] sm:text-[15px]">
            {t('lpShowcaseSubtitle')}
          </p>
        </ScrollReveal>

        <ScrollReveal direction="scale" className="mx-auto mt-10 max-w-[1020px] sm:mt-12" delay={80}>
          <ProductPreview />
        </ScrollReveal>

        <ScrollReveal direction="up" className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-2.5 sm:gap-3" delay={140}>
          {callouts.map((callout) => {
            const Icon = callout.icon;
            return (
              <span
                key={callout.label}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface)] px-3.5 py-2 text-[11px] font-semibold text-[var(--lp-ink-soft)] shadow-[var(--lp-shadow-sm)]"
              >
                <Icon className="h-3.5 w-3.5 text-[var(--lp-emerald)]" aria-hidden="true" />
                {callout.label}
              </span>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
};

export default ShowcaseSection;
