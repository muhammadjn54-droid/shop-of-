import { motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Bot,
  FileBarChart,
  Package,
  ScanBarcode,
  Sparkles,
  Warehouse,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import Reveal from './Reveal';

const INVENTORY_ROWS = [
  { key: 'categoryStationery', percent: 78 },
  { key: 'categoryAccessories', percent: 54 },
  { key: 'categoryPerfumery', percent: 36 },
] as const;

const REPORT_BARS = [38, 52, 44, 68, 58, 82, 72, 94];

export const FeaturesSection = () => {
  const { t } = useLanguage();

  return (
    <section id="features" className="landing-section py-16 sm:py-20 lg:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--lp-emerald)] sm:text-[11px]">
              {t('lpFeaturesEyebrow')}
            </p>
            <h2 className="mt-4 text-balance text-[1.8rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[var(--lp-ink)] sm:text-[2.4rem]">
              {t('lpFeaturesTitle')}
            </h2>
          </div>
          <p className="max-w-md text-pretty text-sm leading-7 text-[var(--lp-muted)] sm:text-right sm:text-[15px]">
            {t('lpFeaturesSubtitle')}
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:gap-5">
          <Reveal className="sm:col-span-2 lg:col-span-7" delay={40}>
            <motion.article className="group flex h-full flex-col rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-5 shadow-[var(--lp-shadow-sm)] transition-all duration-300 hover:-translate-y-2 hover:border-[var(--lp-emerald-bright)] hover:shadow-[0_20px_50px_-20px_rgba(16,124,65,0.25)] sm:p-6" initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.2}} transition={{duration:0.6,ease:[0.22,1,0.36,1]}}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lp-emerald-tint)] text-[var(--lp-emerald)]">
                  <Warehouse className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface-alt)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--lp-muted)]">
                  {t('lpFeatBadgeInventory')}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-[var(--lp-ink)]">
                {t('lpFeatInventoryTitle')}
              </h3>
              <p className="mt-2 max-w-lg text-sm leading-7 text-[var(--lp-muted)]">
                {t('lpFeatInventoryDesc')}
              </p>
              <div className="mt-auto pt-6">
                <div className="rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface-alt)] p-3.5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--lp-ink-soft)]">
                      <Package className="h-3 w-3 text-[var(--lp-emerald)]" aria-hidden="true" />
                      {t('lpPreviewStockLevel')}
                    </span>
                    <span className="text-[9px] font-medium text-[var(--lp-emerald)]">{t('lpPreviewInStock')}</span>
                  </div>
                  <div className="space-y-2.5">
                    {INVENTORY_ROWS.map((row) => (
                      <div key={row.key} className="grid grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-2">
                        <span className="truncate text-[10px] font-medium text-[var(--lp-ink-soft)]">{t(row.key)}</span>
                        <span className="h-1.5 overflow-hidden rounded-full bg-[var(--lp-surface)]">
                          <span
                            className="block h-full rounded-full bg-[var(--lp-emerald)] opacity-75"
                            style={{ width: `${row.percent}%` }}
                          />
                        </span>
                        <span className="text-[9px] tabular-nums text-[var(--lp-muted)]">{row.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.article>
          </Reveal>

          <Reveal className="sm:col-span-1 lg:col-span-5" delay={90}>
            <motion.article className="group flex h-full flex-col rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface-alt)] p-5 shadow-[var(--lp-shadow-sm)] transition-all duration-300 hover:border-[var(--lp-emerald-bright)] hover:shadow-[var(--lp-shadow-md)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lp-surface)] text-[var(--lp-emerald)] shadow-[var(--lp-shadow-sm)]">
                  <ScanBarcode className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--lp-muted)]">
                  {t('lpFeatBadgePos')}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-[var(--lp-ink)]">
                {t('lpFeatPosTitle')}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--lp-muted)]">{t('lpFeatPosDesc')}</p>
              <div className="mt-auto pt-6">
                <div className="grid grid-cols-[minmax(0,1fr)_68px] gap-2.5">
                  <div className="rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-3">
                    <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--lp-muted)]">
                      <span>{t('sellTitle')}</span>
                      <span>POS</span>
                    </div>
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="truncate text-[var(--lp-ink-soft)]">{t('lpPreviewProduct1')}</span>
                        <span className="tabular-nums text-[var(--lp-muted)]">× 2</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span className="truncate text-[var(--lp-ink-soft)]">{t('lpPreviewProduct2')}</span>
                        <span className="tabular-nums text-[var(--lp-muted)]">× 1</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-dashed border-[var(--lp-line)] pt-2 text-[10px] font-semibold">
                        <span className="text-[var(--lp-muted)]">{t('totalAmountLabel')}</span>
                        <span className="tabular-nums text-[var(--lp-emerald)]">360 {t('currency')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--lp-line-strong)] bg-[var(--lp-surface)]">
                    <ScanBarcode className="h-5 w-5 text-[var(--lp-muted)]" aria-hidden="true" />
                    <span className="text-[8px] font-semibold uppercase tracking-[0.1em] text-[var(--lp-muted)]">POS</span>
                  </div>
                </div>
              </div>
            </motion.article>
          </Reveal>

          <Reveal className="sm:col-span-1 lg:col-span-4" delay={130}>
            <motion.article className="group flex h-full flex-col rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-5 shadow-[var(--lp-shadow-sm)] transition-all duration-300 hover:-translate-y-2 hover:border-[var(--lp-emerald-bright)] hover:shadow-[0_20px_50px_-20px_rgba(16,124,65,0.25)] sm:p-6" initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:0.2}} transition={{duration:0.6,ease:[0.22,1,0.36,1]}}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lp-amber-tint)] text-[var(--lp-amber)]">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface-alt)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--lp-muted)]">
                  {t('lpFeatBadgeDebts')}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-[var(--lp-ink)]">
                {t('lpFeatDebtsTitle')}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--lp-muted)]">{t('lpFeatDebtsDesc')}</p>
              <div className="mt-auto pt-6">
                <div className="space-y-2 rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface-alt)] p-3">
                  {[
                    { amount: '320', tone: 'bg-[var(--lp-emerald)]' },
                    { amount: '1 150', tone: 'bg-[var(--lp-amber)]' },
                    { amount: '480', tone: 'bg-[var(--lp-blue)]' },
                  ].map((row, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg bg-[var(--lp-surface)] px-2.5 py-1.5">
                      <span className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${row.tone}`} aria-hidden="true" />
                        <span className="h-1.5 w-14 rounded-full bg-[var(--lp-line)]" aria-hidden="true" />
                      </span>
                      <span className="text-[9px] font-semibold tabular-nums text-[var(--lp-ink-soft)]">
                        {row.amount} {t('currency')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>
          </Reveal>

          <Reveal className="sm:col-span-1 lg:col-span-4" delay={170}>
            <motion.article className="group flex h-full flex-col rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] p-5 shadow-[var(--lp-shadow-sm)] transition-all duration-300 hover:border-[var(--lp-blue)] hover:shadow-[var(--lp-shadow-md)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lp-blue-tint)] text-[var(--lp-blue)]">
                  <FileBarChart className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface-alt)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--lp-muted)]">
                  {t('lpFeatBadgeReports')}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-[-0.01em] text-[var(--lp-ink)]">
                {t('lpFeatReportsTitle')}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--lp-muted)]">{t('lpFeatReportsDesc')}</p>
              <div className="mt-auto pt-6">
                <div className="flex h-20 items-end gap-1.5 rounded-xl border border-[var(--lp-line)] bg-[var(--lp-surface-alt)] px-3 pb-3 pt-4">
                  {REPORT_BARS.map((height, index) => (
                    <span
                      key={index}
                      className={`flex-1 rounded-t-sm ${index === REPORT_BARS.length - 1 ? 'bg-[var(--lp-emerald)]' : 'bg-[var(--lp-blue)] opacity-35'}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between text-[8px] font-medium uppercase tracking-[0.12em] text-[var(--lp-muted)]">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-2.5 w-2.5" aria-hidden="true" />
                    Excel
                  </span>
                  <span>{t('lpPreviewViewAll')}</span>
                </div>
              </div>
            </motion.article>
          </Reveal>

          <Reveal className="sm:col-span-1 lg:col-span-4" delay={210}>
            <motion.article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--lp-emerald-deep)] bg-[#0b4f2f] p-5 text-white shadow-[var(--lp-shadow-md)] transition-all duration-300 hover:shadow-[var(--lp-shadow-lg)] sm:p-6">
              <div
                className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-300/15 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-emerald-100">
                  <Bot className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-emerald-100">
                  {t('lpFeatBadgeAi')}
                </span>
              </div>
              <h3 className="relative mt-5 flex items-center gap-2 text-lg font-semibold tracking-[-0.01em]">
                {t('lpFeatAiTitle')}
                <Sparkles className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              </h3>
              <p className="relative mt-2 text-sm leading-7 text-emerald-50/75">{t('lpFeatAiDesc')}</p>
              <div className="relative mt-auto space-y-2 pt-6">
                <div className="ml-auto w-[72%] rounded-xl rounded-br-sm bg-white/10 p-2.5">
                  <span className="block h-1.5 w-4/5 rounded-full bg-white/40" aria-hidden="true" />
                  <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-white/20" aria-hidden="true" />
                </div>
                <div className="w-[86%] rounded-xl rounded-bl-sm bg-white/95 p-2.5">
                  <span className="block h-1.5 w-11/12 rounded-full bg-[#0b4f2f]/20" aria-hidden="true" />
                  <span className="mt-1.5 block h-1.5 w-3/4 rounded-full bg-[#0b4f2f]/15" aria-hidden="true" />
                  <span className="mt-1.5 block h-1.5 w-1/2 rounded-full bg-[#0b4f2f]/10" aria-hidden="true" />
                </div>
              </div>
            </motion.article>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
