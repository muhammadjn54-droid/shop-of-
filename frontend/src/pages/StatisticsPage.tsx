import { useState, useEffect, useRef } from 'react';
import { getStatistics } from '../api/dashboard';
import {
  BarChart3,
  RefreshCw,
  Package,
  Calendar,
  ChevronDown,
  Coins,
  TrendingUp,
  TrendingDown,
  PieChart,
  ShoppingCart,
  Check,
  Building2,
  ListOrdered,
} from 'lucide-react';
import { formatMoney, formatNumber } from '../utils/formatters';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { useLanguage } from '../context/LanguageContext';
import type { StatisticsData } from '../types';
import toast from 'react-hot-toast';

export const StatisticsPage = () => {
  const { lang, t } = useLanguage();
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // Filter Dropdowns State
  const [dateRangeText, setDateRangeText] = useState('01 окт. 2026 - 10 окт. 2026');
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState('За период');
  const [isRevenuePeriodOpen, setIsRevenuePeriodOpen] = useState(false);
  const [chartViewMode, setChartViewMode] = useState('По дням');
  const [isChartViewOpen, setIsChartViewOpen] = useState(false);

  const dateRangeRef = useRef<HTMLDivElement>(null);
  const revPeriodRef = useRef<HTMLDivElement>(null);
  const chartViewRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(e.target as Node)) {
        setIsDateRangeOpen(false);
      }
      if (revPeriodRef.current && !revPeriodRef.current.contains(e.target as Node)) {
        setIsRevenuePeriodOpen(false);
      }
      if (chartViewRef.current && !chartViewRef.current.contains(e.target as Node)) {
        setIsChartViewOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStatistics();
      setStats(data);
      toast.success(lang === 'tg' ? 'Омор нав карда шуд' : 'Статистика обновлена', { id: 'stats-refresh' });
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

  if (loading && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingState message="Формирование финансового отчёта..." />
      </div>
    );
  }

  if (error && !stats) {
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

  const revenueNum = parseFloat(String(total_revenue || 0)) || 0;
  const costNum = parseFloat(String(total_cost_of_sold_goods || 0)) || 0;
  const profitNum = parseFloat(String(total_profit || 0)) || 0;
  const lossNum = parseFloat(String(total_loss || 0)) || 0;

  // Percentage calculations
  const totalFinancials = costNum + profitNum;
  const costPercent = totalFinancials > 0 ? Math.round((costNum / totalFinancials) * 100) : 0;
  const profitPercent = totalFinancials > 0 ? Math.max(0, 100 - costPercent) : 0;

  const totalItems = total_items_received || (total_items_remaining + total_items_sold) || 0;
  const inStockPercent = totalItems > 0 ? Math.round((total_items_remaining / totalItems) * 100) : 0;
  const soldPercent = totalItems > 0 ? Math.round((total_items_sold / totalItems) * 100) : 0;
  const writtenOffPercent = Math.max(0, 100 - inStockPercent - soldPercent);

  // Days for the bar chart (10 days ending today)
  const daysList = [
    { label: '01.10', rev: 0, cost: 0, prof: 0 },
    { label: '02.10', rev: 0, cost: 0, prof: 0 },
    { label: '03.10', rev: 0, cost: 0, prof: 0 },
    { label: '04.10', rev: 0, cost: 0, prof: 0 },
    { label: '05.10', rev: 0, cost: 0, prof: 0 },
    { label: '06.10', rev: 0, cost: 0, prof: 0 },
    { label: '07.10', rev: 0, cost: 0, prof: 0 },
    { label: '08.10', rev: 0, cost: 0, prof: 0 },
    { label: '09.10', rev: 0, cost: 0, prof: 0 },
    { label: '10.10', rev: revenueNum, cost: costNum, prof: profitNum },
  ];

  const maxChartY = Math.max(5, Math.ceil(Math.max(revenueNum, costNum, profitNum)));

  return (
    <div className="flex-1 flex flex-col space-y-4 font-['Inter',sans-serif] text-slate-800 dark:text-slate-100">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#107c41]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {lang === 'tg' ? 'Омор' : 'Статистика'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'tg'
                ? 'Таҳлили тиҷорат ва нишондиҳандаҳои асосии мағоза'
                : 'Анализ бизнеса и ключевые показатели магазина'}
            </p>
          </div>
        </div>

        {/* Right Toolbar: Date picker & Refresh button */}
        <div className="flex items-center gap-2">
          {/* Date Range Selector Dropdown */}
          <div className="relative" ref={dateRangeRef}>
            <button
              type="button"
              onClick={() => setIsDateRangeOpen((prev) => !prev)}
              className="h-9 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateRangeText}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {isDateRangeOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-30 py-1 text-xs">
                {[
                  '01 окт. 2026 - 10 окт. 2026',
                  'Сегодня',
                  'Последние 7 дней',
                  'За этот месяц',
                  'За всё время',
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setDateRangeText(item);
                      setIsDateRangeOpen(false);
                      fetchStats();
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${
                      dateRangeText === item ? 'text-[#107c41] font-bold bg-emerald-50/50' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>{item}</span>
                    {dateRangeText === item && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="h-9 px-3.5 bg-[#107c41] hover:bg-[#0d6936] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('refreshTable')}</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Выручка */}
        <div className="bg-[#f0fdf4] dark:bg-emerald-950/20 border border-[#bbf7d0] dark:border-emerald-900/60 rounded-xl p-4 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#dcfce7] dark:bg-emerald-900/40 text-[#15803d] flex items-center justify-center mb-2.5">
              <Coins className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('colRevenue')}</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {formatMoney(total_revenue)}
            </p>
          </div>

          <div className="flex items-end justify-between mt-3 pt-2">
            <div>
              <span className="text-xs font-bold text-cyan-600 flex items-center gap-0.5">
                {revenueNum > 0 ? '↑ +100%' : '0%'}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'tg' ? 'Ҳаҷми умумии фурӯш' : 'Общая сумма продаж'}
              </p>
            </div>

            {/* Sparkline Wave cyan */}
            <div className="w-20 h-8 shrink-0">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 32 Q 25 38, 50 20 T 100 12 L 100 40 L 0 40 Z"
                  fill="url(#gradRev)"
                />
                <path
                  d="M0 32 Q 25 38, 50 20 T 100 12"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 2: Себестоимость */}
        <div className="bg-[#f0f9ff] dark:bg-sky-950/20 border border-[#bae6fd] dark:border-sky-900/60 rounded-xl p-4 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#e0f2fe] dark:bg-sky-900/40 text-[#0284c7] flex items-center justify-center mb-2.5">
              <Package className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('colCost')}</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {formatMoney(total_cost_of_sold_goods)}
            </p>
          </div>

          <div className="flex items-end justify-between mt-3 pt-2">
            <div>
              <span className="text-xs font-bold text-sky-600 flex items-center gap-0.5">
                {costNum > 0 ? '↑ +100%' : '0%'}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'tg' ? 'Маблағи хариди молҳо' : 'Сумма закупки товаров'}
              </p>
            </div>

            {/* Sparkline Wave blue */}
            <div className="w-20 h-8 shrink-0">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 34 Q 30 36, 55 18 T 100 14 L 100 40 L 0 40 Z"
                  fill="url(#gradCost)"
                />
                <path
                  d="M0 34 Q 30 36, 55 18 T 100 14"
                  fill="none"
                  stroke="#0284c7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 3: Прибыль */}
        <div className="bg-[#f0fdf4] dark:bg-emerald-950/20 border border-[#bbf7d0] dark:border-emerald-900/60 rounded-xl p-4 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#dcfce7] dark:bg-emerald-900/40 text-[#15803d] flex items-center justify-center mb-2.5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('colProfit')}</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 tabular-nums">
              {formatMoney(total_profit)}
            </p>
          </div>

          <div className="flex items-end justify-between mt-3 pt-2">
            <div>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                {profitNum > 0 ? '↑ +100%' : '0%'}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'tg' ? 'Фоидаи холис' : 'Чистая прибыль'}
              </p>
            </div>

            {/* Sparkline Wave green */}
            <div className="w-20 h-8 shrink-0">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gradProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 35 Q 25 38, 55 16 T 100 10 L 100 40 L 0 40 Z"
                  fill="url(#gradProf)"
                />
                <path
                  d="M0 35 Q 25 38, 55 16 T 100 10"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Card 4: Убыток */}
        <div className="bg-[#fff1f2] dark:bg-rose-950/20 border border-[#fecdd3] dark:border-rose-900/60 rounded-xl p-4 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#ffe4e6] dark:bg-rose-900/40 text-[#e11d48] flex items-center justify-center mb-2.5">
              <TrendingDown className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('colLoss')}</p>
            <p className="text-xl font-extrabold text-[#e11d48] mt-0.5 tabular-nums">
              {formatMoney(total_loss)}
            </p>
          </div>

          <div className="flex items-end justify-between mt-3 pt-2">
            <div>
              <span className="text-xs font-bold text-rose-500 flex items-center gap-0.5">
                + 0%
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {lang === 'tg' ? 'Зарар дар ин давра' : 'Потери за период'}
              </p>
            </div>

            {/* Sparkline Wave red */}
            <div className="w-20 h-8 shrink-0">
              <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="gradLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 36 Q 30 38, 60 25 T 100 16 L 100 40 L 0 40 Z"
                  fill="url(#gradLoss)"
                />
                <path
                  d="M0 36 Q 30 38, 60 25 T 100 16"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        {/* Left: Структура выручки (Donut Chart) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#107c41]" />
                <div>
                  <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {lang === 'tg' ? 'Сохтори даромад' : 'Структура выручки'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'tg' ? 'Таносуби арзиш ва фоида' : 'Соотношение себестоимости и прибыли'}
                  </p>
                </div>
              </div>

              {/* Dropdown */}
              <div className="relative" ref={revPeriodRef}>
                <button
                  type="button"
                  onClick={() => setIsRevenuePeriodOpen((p) => !p)}
                  className="h-7 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span>{revenuePeriod}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {isRevenuePeriodOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-20 py-1 text-xs">
                    {['За период', 'За месяц', 'За всё время'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setRevenuePeriod(opt);
                          setIsRevenuePeriodOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Donut and Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 my-4">
              {/* Donut Graphic */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  {/* Background track */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="transparent"
                    stroke="#f1f5f9"
                    className="dark:stroke-slate-800"
                    strokeWidth="18"
                  />
                  {totalFinancials > 0 && (
                    <>
                      {/* Segment 1: Себестоимость (Slate #475569) */}
                      {costPercent > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="transparent"
                          stroke="#475569"
                          strokeWidth="18"
                          strokeDasharray={`${(costPercent / 100) * 289} 289`}
                          strokeDashoffset="0"
                        />
                      )}
                      {/* Segment 2: Прибыль (Blue #0284c7) */}
                      {profitPercent > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="transparent"
                          stroke="#0284c7"
                          strokeWidth="18"
                          strokeDasharray={`${(profitPercent / 100) * 289} 289`}
                          strokeDashoffset={`-${(costPercent / 100) * 289}`}
                        />
                      )}
                    </>
                  )}
                </svg>

                {/* Inner center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                    {revenueNum.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">сомони</span>
                </div>

                {/* Percentage Labels on ring */}
                {totalFinancials > 0 && costPercent > 0 && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-xs pointer-events-none">
                    {costPercent}%
                  </span>
                )}
                {totalFinancials > 0 && profitPercent > 0 && (
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white drop-shadow-xs pointer-events-none">
                    {profitPercent}%
                  </span>
                )}
              </div>

              {/* Legend List */}
              <div className="space-y-3 min-w-[130px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#475569] shrink-0" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 leading-tight">
                        {t('colCost')}
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatMoney(total_cost_of_sold_goods)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{costPercent}%</span>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7] shrink-0" />
                    <div>
                      <p className="text-[11px] font-medium text-slate-700 dark:text-slate-200 leading-tight">
                        {t('colProfit')}
                      </p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatMoney(total_profit)}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{profitPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Финансовая диаграмма (Bar Chart) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#107c41]" />
                <div>
                  <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {lang === 'tg' ? 'Диаграммаи молиявӣ' : 'Финансовая диаграмма'}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    {lang === 'tg' ? 'Даромад, хароҷот ва фоида аз рӯи давра' : 'Выручка, расходы и прибыль по периодам'}
                  </p>
                </div>
              </div>

              {/* Dropdown */}
              <div className="relative" ref={chartViewRef}>
                <button
                  type="button"
                  onClick={() => setIsChartViewOpen((p) => !p)}
                  className="h-7 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px] font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span>{chartViewMode}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {isChartViewOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-20 py-1 text-xs">
                    {['По дням', 'По неделям', 'По месяцам'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setChartViewMode(opt);
                          setIsChartViewOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bar Chart Area with Y axis */}
            <div className="mt-3 relative pl-6 pr-2">
              {/* Y Axis Grid lines and labels */}
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-slate-400 tabular-nums">
                <span>5</span>
                <span>4</span>
                <span>3</span>
                <span>2</span>
                <span>1</span>
                <span>0</span>
              </div>

              {/* Horizontal grid lines */}
              <div className="h-32 flex flex-col justify-between border-b border-slate-200 dark:border-slate-800">
                {[5, 4, 3, 2, 1, 0].map((val) => (
                  <div key={val} className="w-full border-t border-slate-100 dark:border-slate-800/80" />
                ))}
              </div>

              {/* Bars Columns */}
              <div className="absolute left-7 right-2 top-0 bottom-6 flex items-end justify-between px-1">
                {daysList.map((day, idx) => {
                  const isCurrent = idx === daysList.length - 1;
                  const revHeight = (day.rev / maxChartY) * 100;
                  const costHeight = (day.cost / maxChartY) * 100;
                  const profHeight = (day.prof / maxChartY) * 100;

                  const hasData = day.rev > 0 || day.cost > 0 || day.prof > 0;

                  return (
                    <div key={day.label} className="flex-1 flex items-end justify-center h-full">
                      {isCurrent && hasData ? (
                        <div className="flex items-end gap-0.5 h-full">
                          {/* Blue: Revenue */}
                          <div
                            className="w-1.5 sm:w-2 bg-[#0284c7] rounded-t-xs transition-all duration-500 shadow-xs"
                            style={{ height: `${Math.max(6, Math.min(100, revHeight))}%` }}
                            title={`Выручка: ${day.rev}`}
                          />
                          {/* Slate: Cost */}
                          <div
                            className="w-1.5 sm:w-2 bg-[#475569] rounded-t-xs transition-all duration-500 shadow-xs"
                            style={{ height: `${Math.max(6, Math.min(100, costHeight))}%` }}
                            title={`Себестоимость: ${day.cost}`}
                          />
                          {/* Green: Profit */}
                          <div
                            className="w-1.5 sm:w-2 bg-[#107c41] rounded-t-xs transition-all duration-500 shadow-xs"
                            style={{ height: `${Math.max(6, Math.min(100, profHeight))}%` }}
                            title={`Прибыль: ${day.prof}`}
                          />
                        </div>
                      ) : (
                        <div className="w-1 h-0.5 bg-slate-200 dark:bg-slate-800 rounded" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* X Axis Dates */}
              <div className="flex items-center justify-between pt-1.5 text-[9px] sm:text-[10px] text-slate-400">
                {daysList.map((d) => (
                  <span key={d.label}>{d.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Legend */}
          <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#0284c7]" />
              {t('colRevenue')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#475569]" />
              {t('colCost')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#107c41]" />
              {t('colProfit')}
            </span>
          </div>
        </div>

        {/* Right: Движение товаров (Donut Chart) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-[#107c41]" />
              <div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {lang === 'tg' ? 'Ҳаракати молҳо' : 'Движение товаров'}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {lang === 'tg' ? 'Номгӯй ва боқимонда дар анбор' : 'Номенклатура и остатки на складе'}
                </p>
              </div>
            </div>

            {/* Donut and Legend */}
            <div className="flex flex-col items-center justify-center gap-4 my-2">
              {/* Donut Graphic */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  {/* Background track */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    fill="transparent"
                    stroke="#f1f5f9"
                    className="dark:stroke-slate-800"
                    strokeWidth="18"
                  />
                  {totalItems > 0 && (
                    <>
                      {/* Segment 1: На складе (Green #107c41) */}
                      {inStockPercent > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="transparent"
                          stroke="#107c41"
                          strokeWidth="18"
                          strokeDasharray={`${(inStockPercent / 100) * 289} 289`}
                          strokeDashoffset="0"
                        />
                      )}
                      {/* Segment 2: Продано (Purple #8b5cf6) */}
                      {soldPercent > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="transparent"
                          stroke="#8b5cf6"
                          strokeWidth="18"
                          strokeDasharray={`${(soldPercent / 100) * 289} 289`}
                          strokeDashoffset={`-${(inStockPercent / 100) * 289}`}
                        />
                      )}
                    </>
                  )}
                </svg>

                {/* Inner center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                    {totalItems}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">шт.</span>
                </div>
              </div>

              {/* Legend List */}
              <div className="space-y-2 w-full text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#107c41] shrink-0" />
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">
                      {lang === 'tg' ? 'Дар анбор' : 'На складе'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white tabular-nums">
                    {total_items_remaining} шт. ({inStockPercent}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shrink-0" />
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">
                      {lang === 'tg' ? 'Фурӯхташуда' : 'Продано'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white tabular-nums">
                    {total_items_sold} шт. ({soldPercent}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-700 dark:text-slate-300">
                      {lang === 'tg' ? 'Аз эътибор соқит' : 'Списано'}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white tabular-nums">
                    0 шт. (0%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom 2 Cards (Ключевые показатели + Остатки на складе) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
        {/* Left: Ключевые показатели */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#107c41]" />
            <div>
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {lang === 'tg' ? 'Нишондиҳандаҳои калидӣ' : 'Ключевые показатели'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'tg' ? 'Муқоиса бо давраи гузашта' : 'Сравнение с предыдущим периодом'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {/* Subcard 1: Выручка */}
            <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
              <div className="w-6 h-6 rounded bg-sky-100 dark:bg-sky-950 text-[#0284c7] flex items-center justify-center mb-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{t('colRevenue')}</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {formatMoney(total_revenue)}
              </p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1">{revenueNum > 0 ? '+ 100%' : '0%'}</p>
              <p className="text-[9px] text-slate-400">vs. прошлый период</p>
            </div>

            {/* Subcard 2: Себестоимость */}
            <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
              <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-700 text-[#475569] dark:text-slate-300 flex items-center justify-center mb-1.5">
                <Package className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{t('colCost')}</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {formatMoney(total_cost_of_sold_goods)}
              </p>
              <p className="text-[10px] font-bold text-sky-600 mt-1">{costNum > 0 ? '+ 100%' : '0%'}</p>
              <p className="text-[9px] text-slate-400">vs. прошлый период</p>
            </div>

            {/* Subcard 3: Прибыль */}
            <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
              <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950 text-[#107c41] flex items-center justify-center mb-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{t('colProfit')}</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {formatMoney(total_profit)}
              </p>
              <p className="text-[10px] font-bold text-emerald-600 mt-1">{profitNum > 0 ? '+ 100%' : '0%'}</p>
              <p className="text-[9px] text-slate-400">vs. прошлый период</p>
            </div>

            {/* Subcard 4: Убыток */}
            <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
              <div className="w-6 h-6 rounded bg-rose-100 dark:bg-rose-950 text-[#e11d48] flex items-center justify-center mb-1.5">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 font-medium">{t('colLoss')}</p>
              <p className="text-xs font-bold text-[#e11d48] tabular-nums mt-0.5">
                {formatMoney(total_loss)}
              </p>
              <p className="text-[10px] font-bold text-rose-500 mt-1">{lossNum > 0 ? '+ 100%' : '0%'}</p>
              <p className="text-[9px] text-slate-400">vs. прошлый период</p>
            </div>
          </div>
        </div>

        {/* Right: Остатки на складе */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center gap-2 mb-3">
            <ListOrdered className="w-4 h-4 text-[#107c41]" />
            <div>
              <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                {lang === 'tg' ? 'Боқимонда дар анбор' : 'Остатки на складе'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'tg' ? 'Нишондиҳандаҳои ҷории молҳо' : 'Текущие показатели товаров'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Subcard 1: Всего товаров */}
            <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#107c41] flex items-center justify-center mb-2">
                <Package className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'tg' ? 'Ҳамаи молҳо' : 'Всего товаров'}
              </p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {products_count}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">наименование</p>
            </div>

            {/* Subcard 2: Всего на складе */}
            <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950 text-[#0284c7] flex items-center justify-center mb-2">
                <Building2 className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'tg' ? 'Ҳамагӣ дар анбор' : 'Всего на складе'}
              </p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {formatNumber(total_items_remaining)} шт.
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">остаток</p>
            </div>

            {/* Subcard 3: Реализовано */}
            <div className="bg-[#f8fafc] dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-lg p-3 flex flex-col justify-between">
              <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-[#8b5cf6] flex items-center justify-center mb-2">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'tg' ? 'Фурӯхташуда' : 'Реализовано'}
              </p>
              <p className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
                {formatNumber(total_items_sold)} шт.
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">продано</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
