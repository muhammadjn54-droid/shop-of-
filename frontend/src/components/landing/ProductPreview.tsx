import {
  Boxes,
  CalendarDays,
  FileBarChart,
  Info,
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { formatNumber } from '../../utils/formatters';

interface ProductPreviewProps {
  compact?: boolean;
}

const SALE_ROWS = [
  { nameKey: 'lpPreviewProduct1', categoryKey: 'categoryStationery', qty: 12, amount: 1440, profit: 480, time: '14:32' },
  { nameKey: 'lpPreviewProduct2', categoryKey: 'categoryStationery', qty: 8, amount: 960, profit: 320, time: '13:05' },
  { nameKey: 'lpPreviewProduct3', categoryKey: 'categoryAccessories', qty: 3, amount: 690, profit: 210, time: '11:48' },
  { nameKey: 'lpPreviewProduct4', categoryKey: 'categoryPerfumery', qty: 2, amount: 1120, profit: 380, time: '10:20' },
] as const;

const STOCK_ROWS = [
  { nameKey: 'lpPreviewProduct1', percent: 76, low: false },
  { nameKey: 'lpPreviewProduct2', percent: 34, low: true },
  { nameKey: 'lpPreviewProduct3', percent: 58, low: false },
  { nameKey: 'lpPreviewProduct4', percent: 22, low: true },
] as const;

const NAV_ITEMS = [
  { icon: LayoutDashboard, key: 'navDashboard', active: true },
  { icon: Package, key: 'navProducts', active: false },
  { icon: ShoppingCart, key: 'navPos', active: false },
  { icon: FileBarChart, key: 'navReports', active: false },
] as const;

export const ProductPreview = ({ compact = false }: ProductPreviewProps) => {
  const { t } = useLanguage();

  const money = (value: number) => `${formatNumber(value)} ${t('currency')}`;
  const rows = compact ? SALE_ROWS.slice(0, 3) : SALE_ROWS;

  return (
    <div className="relative w-full">
      <div
        className="absolute -inset-x-4 bottom-0 top-12 rounded-[32px] bg-[var(--lp-emerald)] opacity-10 blur-3xl"
        aria-hidden="true"
      />

      <div
        role="img"
        aria-label={t('lpHeroPreviewAria')}
        className="landing-shimmer relative overflow-hidden rounded-2xl border border-[var(--lp-line)] bg-[var(--lp-surface)] shadow-[var(--lp-shadow-lg)] transition-all duration-500 hover:shadow-[0_40px_90px_-40px_rgba(20,32,26,0.4)]"
      >
        <div className="flex h-9 items-center justify-between border-b border-[var(--lp-line)] bg-[var(--lp-surface-alt)] px-3">
          <div className="flex items-center gap-2">
            <span className="flex gap-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-line-strong)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-line-strong)]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--lp-line-strong)]" />
            </span>
            <span className="ml-1 flex items-center gap-1 text-[9px] font-semibold tracking-wide text-[var(--lp-muted)]">
              <span className="flex h-4 w-4 items-center justify-center rounded bg-[var(--lp-emerald-solid)] text-[9px] text-white">
                X
              </span>
              Excel Pro
            </span>
          </div>
          <span className="rounded-full border border-[var(--lp-line)] bg-[var(--lp-surface)] px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-[var(--lp-muted)]">
            {t('lpPreviewLabel')}
          </span>
        </div>

        <div className="flex">
          <aside
            className={`w-[118px] shrink-0 flex-col border-r border-[var(--lp-line)] bg-[var(--lp-surface-alt)] p-2 ${
              compact ? 'hidden' : 'hidden lg:flex'
            }`}
          >
            <div className="mb-2 px-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--lp-muted)]">
              Excel Pro
            </div>
            <div className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className={`flex items-center gap-1.5 rounded px-1.5 py-1.5 text-[9px] font-medium ${
                      item.active
                        ? 'bg-[var(--lp-emerald-tint)] text-[var(--lp-emerald)]'
                        : 'text-[var(--lp-muted)]'
                    }`}
                  >
                    <Icon className="h-3 w-3" aria-hidden="true" />
                    <span className="truncate">{t(item.key)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-auto rounded-md border border-[var(--lp-line)] bg-[var(--lp-surface)] p-1.5">
              <div className="text-[8px] font-semibold text-[var(--lp-ink-soft)]">{t('lpPreviewStockLevel')}</div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--lp-surface-alt)]">
                <div className="h-full w-[64%] rounded-full bg-[var(--lp-emerald)]" />
              </div>
              <div className="mt-1 text-[8px] text-[var(--lp-muted)]">{t('lpPreviewInStock')}</div>
            </div>
          </aside>

          <div className="min-w-0 flex-1 p-2.5 sm:p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[8px] font-semibold uppercase tracking-[0.16em] text-[var(--lp-emerald)]">
                  {t('lpPreviewSample')}
                </p>
                <h3 className="mt-0.5 truncate text-[13px] font-semibold tracking-[-0.01em] text-[var(--lp-ink)] sm:text-sm">
                  {t('lpPreviewOverview')}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded border border-[var(--lp-line)] bg-[var(--lp-surface-alt)] px-1.5 py-1 text-[8px] font-medium text-[var(--lp-muted)]">
                <CalendarDays className="h-2.5 w-2.5" aria-hidden="true" />
                {t('lpPreviewToday')}
              </div>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <div className="rounded-md border border-[var(--lp-line)] bg-[var(--lp-surface)] p-2 shadow-[var(--lp-shadow-sm)]">
                <div className="flex items-center justify-between text-[var(--lp-muted)]">
                  <span className="text-[8px] font-medium">{t('totalProductsStat')}</span>
                  <Package className="h-2.5 w-2.5 text-[var(--lp-emerald)]" aria-hidden="true" />
                </div>
                <div className="mt-1 text-[13px] font-bold tabular-nums text-[var(--lp-ink)]">128</div>
              </div>
              <div className="rounded-md border border-[var(--lp-line)] bg-[var(--lp-surface)] p-2 shadow-[var(--lp-shadow-sm)]">
                <div className="flex items-center justify-between text-[var(--lp-muted)]">
                  <span className="text-[8px] font-medium">{t('totalStockStat')}</span>
                  <Boxes className="h-2.5 w-2.5 text-[var(--lp-blue)]" aria-hidden="true" />
                </div>
                <div className="mt-1 truncate text-[13px] font-bold tabular-nums text-[var(--lp-ink)]">
                  1 842 <span className="text-[8px] font-normal text-[var(--lp-muted)]">{t('pieces')}</span>
                </div>
              </div>
              <div className="rounded-md border border-[var(--lp-line)] bg-[var(--lp-surface)] p-2 shadow-[var(--lp-shadow-sm)]">
                <div className="flex items-center justify-between text-[var(--lp-muted)]">
                  <span className="text-[8px] font-medium">{t('totalRevenueStat')}</span>
                  <Wallet className="h-2.5 w-2.5 text-[var(--lp-blue)]" aria-hidden="true" />
                </div>
                <div className="mt-1 truncate text-[10px] font-bold tabular-nums text-[var(--lp-ink)]">
                  {money(24650)}
                </div>
              </div>
              <div className="rounded-md border border-[var(--lp-emerald)] bg-[var(--lp-emerald-tint)] p-2">
                <div className="flex items-center justify-between text-[var(--lp-emerald)]">
                  <span className="text-[8px] font-semibold">{t('totalProfitStat')}</span>
                  <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" />
                </div>
                <div className="mt-1 truncate text-[10px] font-extrabold tabular-nums text-[var(--lp-emerald)]">
                  {money(6480)}
                </div>
              </div>
            </div>

            <div className={`mt-2.5 grid gap-2 ${compact ? '' : 'lg:grid-cols-[1.35fr_0.65fr]'}`}>
              <div className="overflow-hidden rounded-md border border-[var(--lp-line)] bg-[var(--lp-surface)]">
                <div className="flex items-center justify-between border-b border-[var(--lp-line)] bg-[var(--lp-surface-alt)] px-2 py-1.5">
                  <span className="flex items-center gap-1 text-[9px] font-semibold text-[var(--lp-ink-soft)]">
                    <ShoppingCart className="h-2.5 w-2.5 text-[var(--lp-emerald)]" aria-hidden="true" />
                    {t('lpPreviewRecentSales')}
                  </span>
                  <span className="text-[8px] font-medium text-[var(--lp-emerald)]">{t('lpPreviewViewAll')}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[9px]">
                    <thead>
                      <tr className="border-b border-[var(--lp-line)] text-[8px] uppercase tracking-wide text-[var(--lp-muted)]">
                        <th className="px-2 py-1 font-medium">{t('lpPreviewProduct')}</th>
                        <th className="px-2 py-1 text-right font-medium">{t('lpPreviewQty')}</th>
                        <th className="px-2 py-1 text-right font-medium">{t('lpPreviewAmount')}</th>
                        <th className="hidden px-2 py-1 text-right font-medium sm:table-cell">{t('lpPreviewProfit')}</th>
                        <th className="px-2 py-1 text-right font-medium">{t('lpPreviewDate')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--lp-line)]">
                      {rows.map((row) => (
                        <tr key={row.nameKey}>
                          <td className="max-w-[104px] px-2 py-1.5">
                            <div className="truncate font-medium text-[var(--lp-ink)]">{t(row.nameKey)}</div>
                            <div className="truncate text-[8px] text-[var(--lp-muted)]">{t(row.categoryKey)}</div>
                          </td>
                          <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-[var(--lp-muted)]">
                            {row.qty} {t('pieces')}
                          </td>
                          <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-[var(--lp-ink-soft)]">
                            {formatNumber(row.amount)}
                          </td>
                          <td className="hidden whitespace-nowrap px-2 py-1.5 text-right font-semibold tabular-nums text-[var(--lp-emerald)] sm:table-cell">
                            {formatNumber(row.profit)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-1.5 text-right tabular-nums text-[var(--lp-muted)]">
                            {row.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {!compact && (
                <div className="rounded-md border border-[var(--lp-line)] bg-[var(--lp-surface)] p-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[9px] font-semibold text-[var(--lp-ink-soft)]">
                      <Boxes className="h-2.5 w-2.5 text-[var(--lp-emerald)]" aria-hidden="true" />
                      {t('lpPreviewStockLevel')}
                    </span>
                    <span className="text-[8px] font-medium text-[var(--lp-emerald)]">{t('lpPreviewViewAll')}</span>
                  </div>
                  <div className="mt-2 space-y-2">
                    {STOCK_ROWS.map((row) => (
                      <div key={row.nameKey}>
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate text-[8px] font-medium text-[var(--lp-ink-soft)]">
                            {t(row.nameKey)}
                          </span>
                          <span
                            className={`shrink-0 text-[7px] font-semibold ${
                              row.low ? 'text-[var(--lp-amber)]' : 'text-[var(--lp-emerald)]'
                            }`}
                          >
                            {row.low ? t('lpPreviewLowStock') : t('lpPreviewInStock')}
                          </span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--lp-surface-alt)]">
                          <div
                            className={`h-full rounded-full ${
                              row.low ? 'bg-[var(--lp-amber)]' : 'bg-[var(--lp-emerald)]'
                            }`}
                            style={{ width: `${row.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-[var(--lp-muted)]">
        <Info className="h-3 w-3" aria-hidden="true" />
        {t('lpPreviewSample')}
      </p>
    </div>
  );
};

export default ProductPreview;
