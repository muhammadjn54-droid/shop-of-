import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router';
import { getDashboard } from '../api/dashboard';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { formatMoney, formatDateTime, formatNumber } from '../utils/formatters';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { useLanguage } from '../context/LanguageContext';
import type { DashboardData } from '../types';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboard();
      setData(res);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingState message="Загрузка показателей склада и продаж..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <ErrorState error={error} onRetry={fetchDashboard} />
      </div>
    );
  }

  const {
    total_products = 0,
    total_remaining = 0,
    total_sold = 0,
    total_revenue = 0,
    total_profit = 0,
    total_loss = 0,
    recent_sales = [],
    top_products = [],
  } = data || {};

  const kpis = [
    { label: t('totalRevenueStat'), value: formatMoney(total_revenue), icon: DollarSign, tone: 'sky' },
    { label: t('totalProfitStat'), value: formatMoney(total_profit), icon: TrendingUp, tone: 'emerald' },
    { label: t('colLoss'), value: formatMoney(total_loss), icon: TrendingDown, tone: 'rose' },
    { label: t('totalProductsStat'), value: formatNumber(total_products), icon: Package, tone: 'teal' },
    { label: t('totalStockStat'), value: `${formatNumber(total_remaining)} ${t('pieces')}`, icon: Package, tone: 'amber' },
    { label: t('totalSoldStat'), value: `${formatNumber(total_sold)} ${t('pieces')}`, icon: ShoppingCart, tone: 'violet' },
  ] as const;

  const tones: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400',
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <div className="flex-1 flex flex-col gap-6 font-['Inter',sans-serif] max-w-[1400px] w-full mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-emerald-600 mb-1 flex items-center gap-1.5">
            <LayoutDashboard className="w-4 h-4" />
            Сводка и Аналитика
          </p>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#0f172a] leading-tight tracking-tight">
            {greeting}{user?.username ? `, ${user.username}` : ''}
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Текущее состояние склада, финансовые результаты и динамика
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboard}
            className="h-10 w-10 flex items-center justify-center bg-white border border-[#e2e5ef] text-[#475569] hover:bg-slate-50 rounded-xl transition-colors"
            title="Обновить данные"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/products/create')}
            className="h-10 inline-flex items-center gap-2 px-4 bg-[#107c41] hover:bg-[#0d6936] text-white text-sm font-semibold rounded-xl shadow-sm shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Новый товар</span>
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="bg-white border border-[#e8eaf2] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-medium text-[#64748b]">{k.label}</span>
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${tones[k.tone]}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </span>
              </div>
              <div className="text-2xl font-semibold text-[#0f172a] tabular-nums tracking-tight truncate">
                {k.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Sales & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales Mini Sheet */}
        <div className="bg-white border border-[#e8eaf2] rounded-2xl overflow-hidden flex flex-col">
          <div className="border-b border-[#eef0f6] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#107c41]" />
              <h3 className="font-semibold text-[15px] text-[#0f172a]">Последние продажи</h3>
            </div>
            <Link
              to="/sales"
              className="inline-flex items-center gap-1 text-[11px] text-[#107c41] font-medium hover:underline"
            >
              <span>Все продажи</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recent_sales.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748b]">
                Продажи ещё не зарегистрированы.
              </div>
            ) : (
              <table className="excel-table text-left select-none text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[#475569]">
                    <th className="excel-header-cell">Товар</th>
                    <th className="excel-header-cell text-right">Кол-во</th>
                    <th className="excel-header-cell text-right">Сумма</th>
                    <th className="excel-header-cell text-right text-emerald-800">Прибыль</th>
                    <th className="excel-header-cell">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {recent_sales.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-[#f8fafc]">
                      <td className="excel-cell font-medium text-[#1e293b] max-w-[140px] truncate">
                        {s.product_name}
                      </td>
                      <td className="excel-cell text-right tabular-nums">{s.quantity} шт.</td>
                      <td className="excel-cell text-right tabular-nums text-[#0369a1]">
                        {formatMoney(s.total_amount)}
                      </td>
                      <td className="excel-cell text-right tabular-nums font-semibold text-[#15803d]">
                        {formatMoney(s.profit)}
                      </td>
                      <td className="excel-cell text-[11px] text-[#64748b]">
                        {formatDateTime(s.sold_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white border border-[#e8eaf2] rounded-2xl overflow-hidden flex flex-col">
          <div className="border-b border-[#eef0f6] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#107c41]" />
              <h3 className="font-semibold text-[15px] text-[#0f172a]">Лидеры продаж</h3>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-[11px] text-[#107c41] font-medium hover:underline"
            >
              <span>Все товары</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-4 flex-1 flex flex-col justify-start space-y-2.5">
            {top_products.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#64748b]">
                Лидеры продаж появятся после первых оформленных сделок.
              </div>
            ) : (
              top_products.map((item, idx) => {
                const sold = item.quantity_sold || item.total_sold || 0;
                return (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-transparent bg-[#f8f9fc] hover:border-[#e2e5ef] hover:bg-white transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg bg-[#107c41]/10 text-[#107c41] flex items-center justify-center font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-semibold text-[#1e293b] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#64748b]">
                          Остаток: {item.remaining_quantity} шт. • Продано: {sold} шт.
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-[#15803d]">{formatMoney(item.profit)}</p>
                      <p className="text-[10px] text-[#64748b]">Выручка: {formatMoney(item.revenue)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
