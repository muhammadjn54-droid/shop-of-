import { useState, useEffect, useCallback } from 'react';
import { getSales } from '../api/sales';
import {
  ShoppingCart,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
} from 'lucide-react';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import { ExcelTableSkeleton } from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import SaleDetailsDialog from '../components/sales/SaleDetailsDialog';
import { formatMoney, formatDateTime, formatNumber } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';
import { exportSalesToExcel } from '../utils/exportSales';
import type { Sale, SalesSummary } from '../types';
import toast from 'react-hot-toast';

export const SalesPage = () => {
  const { lang, t } = useLanguage();

  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ordering, setOrdering] = useState('-sold_at');
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSales({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        ordering: ordering,
        period: period !== 'all' ? period : undefined,
      });

      const list = res.results || [];
      setSales(list);
      setTotalCount(res.count || list.length);
      setHasNext(!!res.next);
      setHasPrevious(!!res.previous);

      if (res.summary) {
        setSummary(res.summary);
      } else {
        let tQty = 0;
        let tRet = 0;
        let tRev = 0;
        let tCost = 0;
        let tProf = 0;
        let tLoss = 0;
        list.forEach((s) => {
          tQty += Number(s.quantity || 0);
          tRet += Number(s.returned_quantity || 0);
          tRev += Number(s.total_amount || 0);
          tCost += Number(s.cost_amount || 0);
          tProf += Number(s.profit || 0);
          tLoss += Number(s.loss || 0);
        });
        setSummary({
          total_quantity: tQty,
          total_returned: tRet,
          total_revenue: tRev,
          total_cost: tCost,
          total_profit: tProf,
          total_loss: tLoss,
        });
      }
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, ordering, period]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleSort = (field: string) => {
    if (ordering === field) {
      setOrdering(`-${field}`);
    } else if (ordering === `-${field}`) {
      setOrdering('');
    } else {
      setOrdering(field);
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (ordering === field) return <ArrowUp className="w-3 h-3 text-[#107c41]" />;
    if (ordering === `-${field}`) return <ArrowDown className="w-3 h-3 text-[#107c41]" />;
    return <ArrowUpDown className="w-3 h-3 text-[#94a3b8] opacity-60 hover:opacity-100" />;
  };

  const handleRowClick = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailsOpen(true);
  };

  const handleExport = async () => {
    try {
      const toastId = toast.loading(
        lang === 'tg' ? 'Омодасозии ҳисобот...' : 'Подготовка отчёта XLSX...'
      );
      // Fetch all sales for export, not just page 1
      const res = await getSales({
        page: 1,
        limit: 10000,
        search: searchTerm,
        ordering: ordering,
        period: period !== 'all' ? period : undefined,
      });

      const allList = res.results || [];
      if (allList.length === 0) {
        toast.dismiss(toastId);
        toast.error(lang === 'tg' ? 'Маълумот барои боргирӣ нест' : 'Нет данных для скачивания');
        return;
      }

      await exportSalesToExcel(allList, res.summary || summary, lang, t);
      toast.dismiss(toastId);
      toast.success(
        lang === 'tg' ? 'Ҳисобот бо муваффақият боргирӣ шуд!' : 'Отчёт XLSX успешно скачан!'
      );
    } catch (e) {
      console.error('Export error:', e);
      toast.error(lang === 'tg' ? 'Хатогӣ ҳангоми содирот' : 'Ошибка при экспорте XLSX');
    }
  };

  const columnLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];

  return (
    <div className="flex-1 flex flex-col space-y-3 font-['Inter',sans-serif]">
      {/* Title & Toolbar */}
      <div className="bg-white border border-[#cbd5e1] rounded-md p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#107c41] text-white flex items-center justify-center font-bold shadow-2xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#1e293b] leading-tight">
                {t('navSales')}
              </h1>
              <p className="text-[11px] text-[#64748b]">
                {lang === 'tg'
                  ? 'Таърихи молҳои фурӯхташуда, бозгаштҳо ва фоидаи холис'
                  : lang === 'en'
                  ? 'History of sold items, returns, and calculated net profit'
                  : 'История реализованных позиций, возвратов и чистой прибыли'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              onEnter={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              placeholder={t('searchPlaceholder')}
            />

            {/* Refresh button */}
            <button
              onClick={fetchSales}
              disabled={loading}
              className="p-1.5 bg-white border border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9] rounded text-xs transition-colors cursor-pointer"
              title={t('refreshTable')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#107c41]' : ''}`} />
            </button>

            {/* Download all data button */}
            <button
              onClick={handleExport}
              disabled={loading || sales.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#107c41] hover:bg-[#0d6936] text-white text-xs font-semibold rounded shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
              title={t('downloadAllData')}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('downloadAllData')}</span>
            </button>
          </div>
        </div>

        {/* Period Filter Tabs */}
        <div className="mt-3 pt-2.5 border-t border-[#e2e8f0] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-semibold text-[#64748b] mr-1">
              {lang === 'tg' ? 'Давра:' : 'Период:'}
            </span>
            <button
              type="button"
              onClick={() => {
                setPeriod('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                period === 'all'
                  ? 'bg-[#107c41] text-white shadow-2xs'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
              }`}
            >
              {lang === 'tg' ? 'Ҳамаи вақт' : 'Всё время'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('today');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                period === 'today'
                  ? 'bg-[#107c41] text-white shadow-2xs'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
              }`}
            >
              {lang === 'tg' ? 'Имрӯз' : 'Сегодня'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('week');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                period === 'week'
                  ? 'bg-[#107c41] text-white shadow-2xs'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
              }`}
            >
              {lang === 'tg' ? '7 рӯз' : '7 дней'}
            </button>
            <button
              type="button"
              onClick={() => {
                setPeriod('month');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                period === 'month'
                  ? 'bg-[#107c41] text-white shadow-2xs'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
              }`}
            >
              {lang === 'tg' ? '30 рӯз' : '30 дней'}
            </button>
          </div>

          <div className="text-[11px] text-[#64748b]">
            {lang === 'tg' ? 'Ҳамагӣ сатрҳо:' : 'Всего записей:'}{' '}
            <span className="font-bold text-[#1e293b]">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* KPI Office Grid (Excel compact cards for Total Profit, Total Loss, Total Revenue, Total Sold) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* Total Profit (Обши прибил) */}
        <div className="bg-[#f0fdf4] border border-[#86efac] p-3 rounded-md shadow-2xs">
          <div className="flex items-center justify-between text-[#166534] mb-1">
            <span className="text-[11px] font-semibold">
              {lang === 'tg' ? 'Фоидаи умумӣ' : lang === 'en' ? 'Total Profit' : 'Общая чистая прибыль'}
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-[#15803d]" />
          </div>
          <div className="text-sm sm:text-base font-extrabold text-[#15803d] tabular-nums">
            {formatMoney(summary?.total_profit || 0)}
          </div>
          <div className="text-[10px] text-[#166534] mt-0.5">
            {lang === 'tg' ? 'Даромади холис' : lang === 'en' ? 'Net Profit' : 'Чистый доход'}
          </div>
        </div>

        {/* Total Loss (Зарар) */}
        <div className="bg-[#fef2f2] border border-[#fca5a5] p-3 rounded-md shadow-2xs">
          <div className="flex items-center justify-between text-[#991b1b] mb-1">
            <span className="text-[11px] font-semibold">
              {lang === 'tg' ? 'Зарари умумӣ' : lang === 'en' ? 'Total Loss' : 'Общий убыток'}
            </span>
            <TrendingDown className="w-3.5 h-3.5 text-[#b91c1c]" />
          </div>
          <div className="text-sm sm:text-base font-bold text-[#b91c1c] tabular-nums">
            {formatMoney(summary?.total_loss || 0)}
          </div>
          <div className="text-[10px] text-[#991b1b] mt-0.5">
            {lang === 'tg' ? 'Талафоти молиявӣ' : lang === 'en' ? 'Financial loss' : 'Финансовые потери'}
          </div>
        </div>

        {/* Total Revenue (Выручка) */}
        <div className="bg-white border border-[#cbd5e1] p-3 rounded-md shadow-2xs hover:border-[#107c41] transition-colors">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-[11px] font-medium">{t('colRevenue')}</span>
            <DollarSign className="w-3.5 h-3.5 text-[#0369a1]" />
          </div>
          <div className="text-sm sm:text-base font-bold text-[#0369a1] tabular-nums">
            {formatMoney(summary?.total_revenue || 0)}
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-0.5">
            {lang === 'tg' ? 'Ҳаҷми умумии фурӯш' : lang === 'en' ? 'Gross Revenue' : 'Объём реализации'}
          </div>
        </div>

        {/* Total Sold (Продано) */}
        <div className="bg-white border border-[#cbd5e1] p-3 rounded-md shadow-2xs hover:border-[#107c41] transition-colors">
          <div className="flex items-center justify-between text-[#64748b] mb-1">
            <span className="text-[11px] font-medium">{t('colSold')}</span>
            <Package className="w-3.5 h-3.5 text-[#7c3aed]" />
          </div>
          <div className="text-sm sm:text-base font-bold text-[#7c3aed] tabular-nums">
            {formatNumber(summary?.total_quantity || 0)}{' '}
            <span className="text-xs font-normal text-[#64748b]">{t('pieces')}</span>
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-0.5">
            {lang === 'tg'
              ? `Бозгашт: ${summary?.total_returned || 0} ${t('pieces')}`
              : `Возвращено: ${summary?.total_returned || 0} ${t('pieces')}`}
          </div>
        </div>
      </div>

      {/* Main Excel Sheet Table */}
      <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs flex-1 flex flex-col overflow-hidden">
        {loading && sales.length === 0 ? (
          <div className="p-4">
            <ExcelTableSkeleton rows={8} cols={10} />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState error={error} onRetry={fetchSales} />
          </div>
        ) : sales.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ShoppingCart}
              title={searchTerm ? t('noProductsFound') : lang === 'tg' ? 'Журнали фурӯш холӣ аст' : 'Журнал продаж пуст'}
              description={
                searchTerm
                  ? t('noProductsDesc')
                  : lang === 'tg'
                  ? 'Шумо то ҳол моле нафурӯхтаед. Аз саҳифаи «Молҳо» молро фурӯшед.'
                  : 'У вас пока не было совершено продаж. Продайте товар из вкладки «Товары».'
              }
            />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto relative">
            <table className="excel-table text-left select-none">
              <thead>
                {/* Column letters */}
                <tr className="bg-[#e2e8f0]">
                  <th className="excel-col-letter w-10"></th>
                  {columnLetters.map((col, idx) => (
                    <th key={idx} className="excel-col-letter">
                      {col}
                    </th>
                  ))}
                </tr>

                {/* Headers */}
                <tr className="bg-[#f1f5f9] text-[#475569] sticky top-0 z-10 shadow-2xs">
                  <th className="excel-header-cell w-10 text-center">№</th>
                  <th className="excel-header-cell w-14 text-center">ID</th>
                  <th className="excel-header-cell min-w-[140px]">{t('colName')}</th>
                  <th className="excel-header-cell text-right">{t('colSold')}</th>
                  <th className="excel-header-cell text-right">{t('colReturned')}</th>
                  <th className="excel-header-cell text-right">{t('colNet')}</th>
                  <th className="excel-header-cell text-right">{t('colSellingPrice')}</th>
                  <th className="excel-header-cell text-right">{t('colPurchasePrice')}</th>
                  <th className="excel-header-cell text-right">{t('colRevenue')}</th>
                  <th className="excel-header-cell text-right">{t('colNetTotal')}</th>
                  <th className="excel-header-cell text-right">{t('colCost')}</th>
                  <th className="excel-header-cell text-right text-emerald-800">{t('colProfit')}</th>
                  <th
                    onClick={() => handleSort('sold_at')}
                    className="excel-header-cell cursor-pointer hover:bg-[#e2e8f0] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{lang === 'tg' ? 'Сана' : lang === 'en' ? 'Date' : 'Дата'}</span>
                      {getSortIcon('sold_at')}
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e2e8f0]">
                {sales.map((sale, index) => {
                  const rowNumber = (currentPage - 1) * 10 + index + 1;
                  return (
                    <tr
                      key={sale.id}
                      onClick={() => handleRowClick(sale)}
                      className={`cursor-pointer transition-colors ${
                        index % 2 === 0 ? 'bg-white hover:bg-[#f8fafc]' : 'bg-[#fafafa] hover:bg-[#f1f5f9]'
                      }`}
                    >
                      <td className="excel-row-num">{rowNumber}</td>
                      <td className="excel-cell text-center font-mono text-[#64748b]">#{sale.id}</td>
                      <td
                        className="excel-cell font-medium text-[#1e293b] max-w-[200px]"
                        title={sale.product_name}
                      >
                        <div className="flex flex-col py-0.5">
                          <span className="truncate">{sale.product_name}</span>
                          {sale.barcode && (
                            <span className="text-[10px] text-[#64748b] font-mono tracking-tight">
                              № {sale.barcode}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="excel-cell text-right tabular-nums">
                        {sale.quantity} {t('pieces')}
                      </td>
                      <td className="excel-cell text-right tabular-nums text-amber-700">
                        {sale.returned_quantity > 0 ? `${sale.returned_quantity} ${t('pieces')}` : '—'}
                      </td>
                      <td className="excel-cell text-right tabular-nums font-semibold text-[#107c41]">
                        {sale.net_quantity} {t('pieces')}
                      </td>
                      <td className="excel-cell text-right tabular-nums text-[#334155]">
                        {formatMoney(sale.price_per_item)}
                      </td>
                      <td className="excel-cell text-right tabular-nums text-[#64748b]">
                        {formatMoney(sale.purchase_price_per_item)}
                      </td>
                      <td className="excel-cell text-right tabular-nums text-[#0369a1] font-medium">
                        {formatMoney(sale.total_amount)}
                      </td>
                      <td className="excel-cell text-right tabular-nums font-semibold text-[#1e293b]">
                        {formatMoney(sale.net_total_amount)}
                      </td>
                      <td className="excel-cell text-right tabular-nums text-[#64748b]">
                        {formatMoney(sale.cost_amount)}
                      </td>
                      <td className="excel-cell text-right tabular-nums font-bold text-[#15803d]">
                        {formatMoney(sale.profit)}
                      </td>
                      <td className="excel-cell text-[#64748b] text-[11px]">
                        {formatDateTime(sale.sold_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={10}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Sale Details Dialog */}
      <SaleDetailsDialog
        sale={selectedSale}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedSale(null);
        }}
      />
    </div>
  );
};

export default SalesPage;
