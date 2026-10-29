import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { BarChart3, Download, TrendingUp, TrendingDown, Wallet, Package, Users, FileSpreadsheet } from 'lucide-react';
import { reportsApi } from '../../api/erp';
import type { ProductReportRow, ReportSummary, TimeseriesPoint } from '../../types/erp';
import { formatMoney, formatNumber } from '../../utils/formatters';
import {
  PageHeader,
  Card,
  SectionTitle,
  StatCard,
  Th,
  Td,
  Empty,
  Spinner,
  btnPrimary,
  btnSecondary,
  inputCls,
} from '../../components/erp/ErpUI';

const periods = [
  { id: 'today', label: 'Сегодня' },
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
  { id: 'all', label: 'Всё время' },
];

const exportTypes = [
  { id: 'sales', label: 'Продажи' },
  { id: 'products', label: 'Товары' },
  { id: 'stock', label: 'Склад' },
  { id: 'debts', label: 'Долги' },
  { id: 'movements', label: 'Движения' },
];

export const ReportsPage = () => {
  const [period, setPeriod] = useState('month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [products, setProducts] = useState<ProductReportRow[]>([]);
  const [series, setSeries] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  const query = useMemo(
    () => (from || to ? { from, to } : { period }),
    [from, to, period]
  );

  const load = async () => {
    setLoading(true);
    try {
      const [s, p, t] = await Promise.all([
        reportsApi.summary(query),
        reportsApi.products({ ...query, limit: 50 }),
        reportsApi.timeseries({ ...query, granularity: period === 'year' || period === 'all' ? 'month' : 'day' }),
      ]);
      setSummary(s);
      setProducts(p.results);
      setSeries(t);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки отчётов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [period, from, to]);

  const download = async (type: string) => {
    setExporting(type);
    try {
      const blob = await reportsApi.export({ ...query, type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `shop-${type}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Excel-файл скачан');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка экспорта');
    } finally {
      setExporting('');
    }
  };

  const s = (summary || {}) as Record<string, any>;
  const sales = (s.sales || {}) as Record<string, any>;
  const payments = (s.payments || {}) as Record<string, any>;
  const expenses = (s.expenses || {}) as Record<string, any>;
  const stock = (s.stock || {}) as Record<string, any>;
  const customers = (s.customers || {}) as Record<string, any>;
  const debts = (s.debts || {}) as Record<string, any>;
  const suppliers = (s.suppliers || {}) as Record<string, any>;
  const maxSeries = Math.max(1, ...series.map((x) => Number(x.net) || 0));

  return (
    <div className="flex-1 flex flex-col space-y-3">
      <PageHeader icon={BarChart3} title="Отчёты и аналитика" subtitle="Выручка, прибыль, расходы, склад и экспорт в Excel" onRefresh={load}>
        <select className={inputCls} value={period} onChange={(e) => { setPeriod(e.target.value); setFrom(''); setTo(''); }}>
          {periods.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </PageHeader>

      <Card>
        <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-[#475569] dark:text-slate-300">Период:</span>
            <input type="date" className={`${inputCls} w-36`} value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-xs text-slate-400">—</span>
            <input type="date" className={`${inputCls} w-36`} value={to} onChange={(e) => setTo(e.target.value)} />
            {(from || to) && (
              <button className={btnSecondary} onClick={() => { setFrom(''); setTo(''); }}>Сбросить</button>
            )}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <FileSpreadsheet className="w-4 h-4 text-[#107c41]" />
            {exportTypes.map((t) => (
              <button
                key={t.id}
                className={t.id === 'sales' ? btnPrimary : btnSecondary}
                onClick={() => download(t.id)}
                disabled={!!exporting}
                title={`Экспорт: ${t.label}`}
              >
                <Download className="w-3 h-3" /> {t.id === 'sales' && exporting === 'sales' ? '...' : t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <Card><Spinner label="Расчёт отчётов..." /></Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <StatCard label="Выручка" value={formatMoney(sales.revenue ?? 0)} tone="blue" />
            <StatCard label="Возвраты" value={formatMoney(sales.returns ?? 0)} tone="rose" />
            <StatCard label="Чистая выручка" value={formatMoney(sales.netRevenue ?? 0)} tone="green" />
            <StatCard label="Валовая прибыль" value={formatMoney(sales.grossProfit ?? 0)} tone="green" />
            <StatCard label="Расходы" value={formatMoney(expenses.total ?? 0)} tone="rose" />
            <StatCard label="Чистая прибыль" value={formatMoney(s.netProfit ?? 0)} tone={Number(s.netProfit) >= 0 ? 'green' : 'rose'} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <StatCard label="Средний чек" value={formatMoney(sales.avgCheck ?? 0)} />
            <StatCard label="Маржа" value={`${Number(s.margin ?? 0).toFixed(2)}%`} tone="violet" />
            <StatCard label="Продаж" value={formatNumber(sales.orders ?? 0)} />
            <StatCard label="Товаров продано" value={formatNumber(sales.itemsSold ?? 0)} tone="green" />
            <StatCard label="Клиентов" value={formatNumber(customers.count ?? 0)} tone="blue" />
            <StatCard label="Долги клиентов" value={formatMoney(debts.outstanding ?? 0)} tone="amber" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card>
              <SectionTitle title="Способы оплаты" subtitle="За выбранный период" />
              <div className="p-3 space-y-2">
                {[
                  { label: 'Наличные', value: payments.cash, color: 'bg-emerald-500' },
                  { label: 'Карта / QR', value: payments.card, color: 'bg-sky-500' },
                  { label: 'В долг', value: payments.debt, color: 'bg-amber-500' },
                  { label: 'Перечисление', value: payments.transfer, color: 'bg-violet-500' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 text-[#475569] dark:text-slate-300">
                      <span className={`w-2 h-2 rounded-full ${row.color}`} /> {row.label}
                    </span>
                    <span className="font-bold tabular-nums">{formatMoney(Number(row.value || 0))}</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t border-[#e2e8f0] dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                  <span>Итого оплат</span>
                  <span className="text-[#107c41]">
                    {formatMoney(Number(payments.cash || 0) + Number(payments.card || 0) + Number(payments.debt || 0) + Number(payments.transfer || 0))}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <SectionTitle title="Склад" subtitle="Текущее состояние остатков" />
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-[#64748b]">Позиций</span><span className="font-bold">{formatNumber(stock.products ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Единиц</span><span className="font-bold">{formatNumber(stock.quantity ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Себестоимость</span><span className="font-bold">{formatMoney(stock.valueCost ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">В рознице</span><span className="font-bold">{formatMoney(stock.valueRetail ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Потенциальная прибыль</span><span className="font-bold text-emerald-600">{formatMoney(stock.potentialProfit ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Мало / нет остатка</span><span className="font-bold text-amber-600">{formatNumber(stock.lowStock ?? 0)} / {formatNumber(stock.outOfStock ?? 0)}</span></div>
              </div>
            </Card>

            <Card>
              <SectionTitle title="Контрагенты" subtitle="Клиенты, долги и поставщики" />
              <div className="p-3 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-[#64748b] flex items-center gap-1"><Users className="w-3 h-3" /> Клиенты</span><span className="font-bold">{formatNumber(customers.count ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Покупки клиентов</span><span className="font-bold">{formatMoney(customers.totalPurchases ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Долги клиентов</span><span className="font-bold text-rose-600">{formatMoney(customers.totalDebt ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Бонусы</span><span className="font-bold text-amber-600">{formatNumber(customers.bonusPoints ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Поставщиков</span><span className="font-bold">{formatNumber(suppliers.count ?? 0)}</span></div>
                <div className="flex justify-between"><span className="text-[#64748b]">Долг поставщикам</span><span className="font-bold text-rose-600">{formatMoney(suppliers.debt ?? 0)}</span></div>
              </div>
            </Card>
          </div>

          {series.length > 0 && (
            <Card>
              <SectionTitle title="Динамика выручки" subtitle="Чистая выручка по дням / месяцам" />
              <div className="p-4 flex items-end gap-1.5 h-48 overflow-x-auto">
                {series.map((point) => {
                  const value = Number(point.net) || 0;
                  const height = Math.max(4, Math.round((Math.abs(value) / maxSeries) * 150));
                  return (
                    <div key={point.label} className="flex flex-col items-center justify-end gap-1 min-w-[34px] flex-1 group">
                      <span className="text-[9px] text-[#64748b] opacity-0 group-hover:opacity-100 whitespace-nowrap">{formatMoney(value)}</span>
                      <div
                        className={`w-full max-w-[36px] rounded-t ${value < 0 ? 'bg-rose-400' : 'bg-[#107c41]'}`}
                        style={{ height }}
                        title={`${point.label}: ${formatMoney(value)}`}
                      />
                      <span className="text-[9px] text-[#94a3b8] whitespace-nowrap">{String(point.label).slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card className="lg:col-span-2">
              <SectionTitle title="Товары по выручке" subtitle="Топ-50 позиций за период" />
              {products.length === 0 ? <Empty>Нет продаж за период.</Empty> : (
                <div className="overflow-x-auto">
                  <table className="excel-table text-left w-full">
                    <thead>
                      <tr>
                        <Th>Товар</Th>
                        <Th right>Продано</Th>
                        <Th right>Выручка</Th>
                        <Th right>Прибыль</Th>
                        <Th right>Маржа</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                      {products.map((p) => (
                        <tr key={p.productId} className="hover:bg-[#f8fafc] dark:hover:bg-slate-800/50">
                          <Td>{p.name}</Td>
                          <Td right>{p.quantity}</Td>
                          <Td right>{formatMoney(p.revenue)}</Td>
                          <Td right><span className={Number(p.profit) < 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>{formatMoney(p.profit)}</span></Td>
                          <Td right>{Number(p.margin).toFixed(1)}%</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle title="Расходы по категориям" subtitle={`Всего: ${formatMoney(expenses.total ?? 0)}`} />
              <div className="p-3 space-y-2">
                {Object.keys(expenses.byCategory || {}).length === 0 ? <Empty>Расходов нет.</Empty> : Object.entries(expenses.byCategory as Record<string, number>).sort(([, a], [, b]) => b - a).map(([name, value]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="text-[#475569] dark:text-slate-300">{name}</span>
                      <span className="font-semibold">{formatMoney(value)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-[#107c41] rounded"
                        style={{ width: `${Math.min(100, (Number(value) / Math.max(1, Number(expenses.total || 1))) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatCard label="Закупки" value={formatMoney(Number((s.purchases as Record<string, unknown>)?.total ?? 0))} tone="blue" />
            <StatCard label="Закупок" value={formatNumber(Number((s.purchases as Record<string, unknown>)?.count ?? 0))} />
            <StatCard label="Возвратов" value={formatNumber(sales.returnsCount ?? 0)} tone="rose" />
            <StatCard label="Товаров возвращено" value={formatNumber(sales.itemsReturned ?? 0)} tone="rose" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <SectionTitle title="Продажи по кассирам" />
              <div className="overflow-x-auto">
                <table className="excel-table text-left w-full">
                  <thead><tr><Th>Кассир</Th><Th right>Продаж</Th><Th right>Выручка</Th></tr></thead>
                  <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                    {((s.cashiers || []) as Array<{ name: string; count: number; revenue: string }>).map((c) => (
                      <tr key={c.name}>
                        <Td>{c.name}</Td>
                        <Td right>{c.count}</Td>
                        <Td right>{formatMoney(c.revenue)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <Card>
              <SectionTitle title="Продажи по филиалам" />
              <div className="overflow-x-auto">
                <table className="excel-table text-left w-full">
                  <thead><tr><Th>Филиал</Th><Th right>Заказов</Th><Th right>Выручка</Th></tr></thead>
                  <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                    {((s.branches || []) as Array<{ id: number; name: string; orders: number; revenue: string }>).map((b) => (
                      <tr key={b.id}>
                        <Td>{b.name}</Td>
                        <Td right>{b.orders}</Td>
                        <Td right>{formatMoney(b.revenue)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
