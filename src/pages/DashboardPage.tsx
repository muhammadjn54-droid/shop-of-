import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { getDashboard } from '../api/dashboard';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';
import { formatMoney, formatDateTime, formatNumber } from '../utils/formatters';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import type { DashboardData } from '../types';

export const DashboardPage = () => {
  const navigate = useNavigate();
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

  return (
    <div className="flex-1 flex flex-col space-y-4 font-['Inter',sans-serif]">
      {/* Top Banner / Actions */}
      <div className="bg-white border border-[#cbd5e1] rounded-md p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#107c41] text-white flex items-center justify-center font-bold shadow-2xs">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#1e293b] leading-tight">
              Сводка и Аналитика
            </h1>
            <p className="text-[11px] text-[#64748b]">
              Текущее состояние склада, финансовые результаты и динамика
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboard}
            className="p-1.5 bg-white border border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9] rounded text-xs transition-colors"
            title="Обновить данные"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => navigate('/products/create')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#107c41] hover:bg-[#0d6936] text-white text-xs font-medium rounded shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Новый товар</span>
          </button>
        </div>
      </div>

      {/* KPI Office Grid (Excel compact cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Total Products */}
        <div className="bg-white border border-[#cbd5e1] p-3 rounded-md shadow-2xs hover:border-[#107c41] transition-colors">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-[11px] font-medium">Всего товаров</span>
            <Package className="w-3.5 h-3.5 text-[#0f766e]" />
          </div>
          <div className="text-base font-bold text-[#1e293b] tabular-nums">
            {formatNumber(total_products)}
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-0.5">В номенклатуре</div>
        </div>

        {/* Total Remaining */}
        <div className="bg-white border border-[#cbd5e1] p-3 rounded-md shadow-2xs hover:border-[#107c41] transition-colors">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-[11px] font-medium">Осталось на складе</span>
            <Package className="w-3.5 h-3.5 text-[#107c41]" />
          </div>
          <div className="text-base font-bold text-[#107c41] tabular-nums">
            {formatNumber(total_remaining)} <span className="text-xs font-normal text-[#64748b]">шт.</span>
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-0.5">Доступно к продаже</div>
        </div>

        {/* Total Sold */}
        <div className="bg-white border border-[#cbd5e1] p-3 rounded-md shadow-2xs hover:border-[#107c41] transition-colors">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-[11px] font-medium">Продано</span>
            <ShoppingCart className="w-3.5 h-3.5 text-[#7c3aed]" />
          </div>
          <div className="text-base font-bold text-[#7c3aed] tabular-nums">
            {formatNumber(total_sold)} <span className="text-xs font-normal text-[#64748b]">шт.</span>
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-0.5">Всего отгружено</div>
        </div>

        {/* Revenue */}
        <div className="bg-white border border-[#cbd5e1] p-3 rounded-md shadow-2xs hover:border-[#107c41] transition-colors">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-[11px] font-medium">Выручка</span>
            <DollarSign className="w-3.5 h-3.5 text-[#0369a1]" />
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#0369a1] tabular-nums truncate">
            {formatMoney(total_revenue)}
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-0.5">Общий объём продаж</div>
        </div>

        {/* Profit */}
        <div className="bg-[#f0fdf4] border border-[#86efac] p-3 rounded-md shadow-2xs">
          <div className="flex items-center justify-between text-[#166534] mb-1">
            <span className="text-[11px] font-semibold">Прибыль</span>
            <TrendingUp className="w-3.5 h-3.5 text-[#15803d]" />
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-[#15803d] tabular-nums truncate">
            {formatMoney(total_profit)}
          </div>
          <div className="text-[10px] text-[#166534] mt-0.5">Чистый доход</div>
        </div>

        {/* Loss */}
        <div className="bg-[#fef2f2] border border-[#fca5a5] p-3 rounded-md shadow-2xs">
          <div className="flex items-center justify-between text-[#991b1b] mb-1">
            <span className="text-[11px] font-semibold">Убыток</span>
            <TrendingDown className="w-3.5 h-3.5 text-[#b91c1c]" />
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#b91c1c] tabular-nums truncate">
            {formatMoney(total_loss)}
          </div>
          <div className="text-[10px] text-[#991b1b] mt-0.5">Финансовые потери</div>
        </div>
      </div>

      {/* Two Column Layout: Recent Sales & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Sales Mini Sheet */}
        <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs overflow-hidden flex flex-col">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#107c41]" />
              <h3 className="font-semibold text-xs text-[#1e293b]">Последние продажи</h3>
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
        <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs overflow-hidden flex flex-col">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#107c41]" />
              <h3 className="font-semibold text-xs text-[#1e293b]">Лидеры продаж</h3>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-1 text-[11px] text-[#107c41] font-medium hover:underline"
            >
              <span>Все товары</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="p-3 flex-1 flex flex-col justify-start space-y-2">
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
                    className="flex items-center justify-between p-2.5 rounded border border-[#e2e8f0] bg-[#fafafa] hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#107c41]/10 text-[#107c41] flex items-center justify-center font-bold text-xs shrink-0">
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
