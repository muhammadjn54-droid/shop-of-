import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Reveal from './Reveal';

const FAQ_ITEMS = [
  { q: 'lpFaq1Q', a: 'lpFaq1A' },
  { q: 'lpFaq2Q', a: 'lpFaq2A' },
  { q: 'lpFaq3Q', a: 'lpFaq3A' },
  { q: 'lpFaq4Q', a: 'lpFaq4A' },
  { q: 'lpFaq5Q', a: 'lpFaq5A' },
] as const;

export const FaqAccordion = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="landing-section py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-16 xl:gap-24">
          <Reveal>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--lp-emerald)] sm:text-[11px]">
              {t('lpFaqEyebrow')}
            </p>
            <h2 className="mt-4 max-w-sm text-balance text-[1.8rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--lp-ink)] sm:text-[2.4rem]">
              {t('lpFaqTitle')}
            </h2>
            <p className="mt-4 max-w-md text-pretty text-sm leading-7 text-[var(--lp-muted)] sm:text-[15px]">
              {t('lpFaqSubtitle')}
            </p>
          </Reveal>

          <Reveal delay={80}>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, index) => {
                const isOpen = openIndex === index;
                const buttonId = `faq-question-${index}`;
                const panelId = `faq-answer-${index}`;

                return (
                  <div
                    key={item.q}
                    className={`overflow-hidden rounded-xl border bg-[var(--lp-surface)] transition-colors ${
                      isOpen ? 'border-[var(--lp-emerald-bright)]' : 'border-[var(--lp-line)]'
                    }`}
                  >
                    <h3>
                      <button
                        type="button"
                        id={buttonId}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpenIndex(isOpen ? null : index)}
                        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-[14px] font-semibold text-[var(--lp-ink)] transition-colors hover:bg-[var(--lp-surface-alt)] sm:px-5 sm:py-[18px] sm:text-[15px]"
                      >
                        <span>{t(item.q)}</span>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                            isOpen
                              ? 'rotate-45 border-[var(--lp-emerald)] bg-[var(--lp-emerald-solid)] text-white'
                              : 'border-[var(--lp-line-strong)] bg-[var(--lp-surface)] text-[var(--lp-muted)]'
                          }`}
                          aria-hidden="true"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </h3>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      aria-hidden={!isOpen}
                      data-open={isOpen}
                      className="landing-faq-panel"
                    >
                      <div>
                        <p className="px-4 pb-4 text-[13px] leading-7 text-[var(--lp-muted)] sm:px-5 sm:pb-5 sm:text-sm">
                          {t(item.a)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default FaqAccordion;
