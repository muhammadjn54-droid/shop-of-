import { useState, useEffect } from 'react';
import { getStatistics } from '../api/dashboard';
import {
  BarChart3,
  RefreshCw,
  Package,
  DollarSign,
} from 'lucide-react';
import { formatMoney, formatNumber } from '../utils/formatters';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import type { StatisticsData } from '../types';

export const StatisticsPage = () => {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStatistics();
      setStats(data);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingState message="Формирование финансового отчёта..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6">
        <ErrorState error={error} onRetry={fetchStats} />
      </div>
    );
  }

  const {
    products_count = 0,
    total_items_received = 0,
    total_items_sold = 0,
    total_items_remaining = 0,
    total_revenue = 0,
    total_cost_of_sold_goods = 0,
    total_profit = 0,
    total_loss = 0,
  } = stats || {};

  // Calculations for progress bars
  const totalItems = total_items_received || 1;
  const soldPercent = Math.min(100, Math.round((total_items_sold / totalItems) * 100)) || 0;
  const remainingPercent = Math.min(100, Math.round((total_items_remaining / totalItems) * 100)) || 0;

  const revenueNum = parseFloat(String(total_revenue)) || 0;
  const profitNum = parseFloat(String(total_profit)) || 0;
  const costNum = parseFloat(String(total_cost_of_sold_goods)) || 0;
  const profitMargin = revenueNum > 0 ? Math.round((profitNum / revenueNum) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col space-y-4 font-['Inter',sans-serif]">
      {/* Title & Toolbar */}
      <div className="bg-white border border-[#cbd5e1] rounded-md p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#107c41] text-white flex items-center justify-center font-bold shadow-2xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1e293b] leading-tight">
              Финансовый отчёт и Статистика
            </h1>
            <p className="text-[11px] text-[#64748b]">
              Итоговый баланс оборота, себестоимости и рентабельности склада
            </p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9] rounded text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Пересчитать</span>
        </button>
      </div>

      {/* Main Excel-like Ledger Sheet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Financial Statement */}
        <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs overflow-hidden">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-[#1e293b]">
            <DollarSign className="w-4 h-4 text-[#107c41]" />
            <span>Финансовый баланс (Отчёт о прибылях и убытках)</span>
          </div>

          <div className="p-4 space-y-3 text-xs">
            <div className="divide-y divide-[#e2e8f0] border border-[#e2e8f0] rounded overflow-hidden">
              <div className="flex items-center justify-between p-2.5 bg-white">
                <span className="text-[#475569]">Общая выручка от продаж:</span>
                <span className="font-bold text-[#0369a1] tabular-nums">
                  {formatMoney(total_revenue)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#fafafa]">
                <span className="text-[#475569]">Себестоимость проданных товаров (COGS):</span>
                <span className="font-medium text-[#475569] tabular-nums">
                  {formatMoney(total_cost_of_sold_goods)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#f0fdf4]">
                <span className="text-[#166534] font-semibold">Итоговая чистая прибыль:</span>
                <span className="font-extrabold text-[#15803d] tabular-nums text-sm">
                  {formatMoney(total_profit)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#fef2f2]">
                <span className="text-[#991b1b] font-medium">Общий убыток:</span>
                <span className="font-bold text-[#b91c1c] tabular-nums">
                  {formatMoney(total_loss)}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#f8fafc]">
                <span className="text-[#475569] font-medium">Рентабельность продаж (Маржа):</span>
                <span className="font-bold text-[#107c41] tabular-nums">
                  {profitMargin}%
                </span>
              </div>
            </div>

            {/* Financial Visual Distribution Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-[11px] text-[#64748b] mb-1">
                <span>Структура выручки:</span>
                <span>Себестоимость ({100 - profitMargin}%) • Прибыль ({profitMargin}%)</span>
              </div>
              <div className="h-3 w-full bg-[#cbd5e1] rounded-full overflow-hidden flex">
                <div
                  className="bg-[#64748b] transition-all duration-500"
                  style={{ width: `${Math.max(0, 100 - profitMargin)}%` }}
                  title="Себестоимость"
                />
                <div
                  className="bg-[#107c41] transition-all duration-500"
                  style={{ width: `${Math.max(0, profitMargin)}%` }}
                  title="Чистая прибыль"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Inventory Statement */}
        <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs overflow-hidden">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-[#1e293b]">
            <Package className="w-4 h-4 text-[#107c41]" />
            <span>Движение номенклатуры и остатков</span>
          </div>

          <div className="p-4 space-y-3 text-xs">
            <div className="divide-y divide-[#e2e8f0] border border-[#e2e8f0] rounded overflow-hidden">
              <div className="flex items-center justify-between p-2.5 bg-white">
                <span className="text-[#475569]">Количество наименований товаров:</span>
                <span className="font-bold text-[#1e293b] tabular-nums">
                  {formatNumber(products_count)} поз.
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#fafafa]">
                <span className="text-[#475569]">Всего поступило на склад:</span>
                <span className="font-semibold text-[#334155] tabular-nums">
                  {formatNumber(total_items_received)} шт.
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#f8fafc]">
                <span className="text-[#475569]">Всего реализовано (продано):</span>
                <span className="font-semibold text-[#7c3aed] tabular-nums">
                  {formatNumber(total_items_sold)} шт.
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#f0fdf4]">
                <span className="text-[#166534] font-semibold">Остаток на балансе склада:</span>
                <span className="font-bold text-[#107c41] tabular-nums text-sm">
                  {formatNumber(total_items_remaining)} шт.
                </span>
              </div>
            </div>

            {/* Inventory Distribution Bar */}
            <div className="pt-2">
              <div className="flex justify-between text-[11px] text-[#64748b] mb-1">
                <span>Оборачиваемость склада:</span>
                <span>Продано ({soldPercent}%) • На складе ({remainingPercent}%)</span>
              </div>
              <div className="h-3 w-full bg-[#cbd5e1] rounded-full overflow-hidden flex">
                <div
                  className="bg-[#7c3aed] transition-all duration-500"
                  style={{ width: `${soldPercent}%` }}
                  title="Продано"
                />
                <div
                  className="bg-[#107c41] transition-all duration-500"
                  style={{ width: `${remainingPercent}%` }}
                  title="Остаток на складе"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
