import { CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { ScrollReveal } from './ScrollReveal';

const PROBLEMS = [
  { number: '01', titleKey: 'lpProblem1Title', descKey: 'lpProblem1Desc', solveKey: 'lpProblem1Solve' },
  { number: '02', titleKey: 'lpProblem2Title', descKey: 'lpProblem2Desc', solveKey: 'lpProblem2Solve' },
  { number: '03', titleKey: 'lpProblem3Title', descKey: 'lpProblem3Desc', solveKey: 'lpProblem3Solve' },
  { number: '04', titleKey: 'lpProblem4Title', descKey: 'lpProblem4Desc', solveKey: 'lpProblem4Solve' },
] as const;

export const ProblemSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 xl:gap-24">
          <ScrollReveal direction="left" className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--lp-emerald)] sm:text-[11px]">
              {t('lpProblemEyebrow')}
            </p>
            <h2 className="mt-4 max-w-md text-balance text-[1.8rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--lp-ink)] sm:text-[2.4rem]">
              {t('lpProblemTitle')}
            </h2>
            <p className="mt-4 max-w-md text-pretty text-sm leading-7 text-[var(--lp-muted)] sm:text-[15px]">
              {t('lpProblemSubtitle')}
            </p>
            <div className="mt-7 hidden items-center gap-3 lg:flex">
              <span className="h-px w-10 bg-[var(--lp-line-strong)]" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--lp-muted)]">
                Excel Pro
              </span>
            </div>
          </ScrollReveal>

          <div className="border-b border-[var(--lp-line)]">
            {PROBLEMS.map((problem, index) => (
              <ScrollReveal direction="right" key={problem.number} delay={index * 70}>
                <article className="group grid gap-3 border-t border-[var(--lp-line)] py-7 sm:grid-cols-[58px_minmax(0,1fr)] sm:gap-5 sm:py-8">
                  <div className="flex items-start">
                    <span className="rounded-full bg-[var(--lp-red-tint)] px-2.5 py-1 text-[11px] font-semibold tabular-nums text-[var(--lp-red)]">
                      {problem.number}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-[var(--lp-ink)] sm:text-lg">
                      {t(problem.titleKey)}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--lp-muted)]">
                      {t(problem.descKey)}
                    </p>
                    <div className="mt-4 flex max-w-xl items-start gap-2.5 rounded-xl border border-[var(--lp-line)] bg-[var(--lp-emerald-tint)] px-3.5 py-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lp-emerald)]" aria-hidden="true" />
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--lp-emerald)]">
                          {t('lpProblemSolutionLabel')}
                        </p>
                        <p className="mt-1 text-[13px] leading-6 text-[var(--lp-ink-soft)]">
                          {t(problem.solveKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
