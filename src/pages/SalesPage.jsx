import React, { useState, useEffect, useCallback } from 'react';
import { getSales } from '../api/sales';
import {
  ShoppingCart,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import SearchInput from '../components/common/SearchInput';
import Pagination from '../components/common/Pagination';
import LoadingState, { ExcelTableSkeleton } from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import SaleDetailsDialog from '../components/sales/SaleDetailsDialog';
import { formatMoney, formatDateTime } from '../utils/formatters';

export const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ordering, setOrdering] = useState('-sold_at');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSale, setSelectedSale] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSales({
        page: currentPage,
        search: searchTerm,
        ordering: ordering,
      });

      setSales(res.results || []);
      setTotalCount(res.count || (res.results ? res.results.length : 0));
      setHasNext(!!res.next);
      setHasPrevious(!!res.previous);
    } catch (err) {
      console.error('Error fetching sales:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, ordering]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleSort = (field) => {
    if (ordering === field) {
      setOrdering(`-${field}`);
    } else if (ordering === `-${field}`) {
      setOrdering('');
    } else {
      setOrdering(field);
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (ordering === field) return <ArrowUp className="w-3 h-3 text-[#107c41]" />;
    if (ordering === `-${field}`) return <ArrowDown className="w-3 h-3 text-[#107c41]" />;
    return <ArrowUpDown className="w-3 h-3 text-[#94a3b8] opacity-60 hover:opacity-100" />;
  };

  const handleRowClick = (sale) => {
    setSelectedSale(sale);
    setIsDetailsOpen(true);
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
                Журнал продаж
              </h1>
              <p className="text-[11px] text-[#64748b]">
                История реализованных позиций, возвратов и рассчитанной прибыли
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
              placeholder="Поиск по товару..."
            />

            <button
              onClick={fetchSales}
              disabled={loading}
              className="p-1.5 bg-white border border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9] rounded text-xs transition-colors"
              title="Обновить журнал"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#107c41]' : ''}`} />
            </button>
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
              title={searchTerm ? 'Продажи не найдены' : 'Журнал продаж пуст'}
              description={
                searchTerm
                  ? 'Попробуйте изменить поисковый запрос.'
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
                  <th className="excel-header-cell min-w-[140px]">Товар</th>
                  <th className="excel-header-cell text-right">Кол-во</th>
                  <th className="excel-header-cell text-right">Возврат</th>
                  <th className="excel-header-cell text-right">Чистое</th>
                  <th className="excel-header-cell text-right">Цена продажи</th>
                  <th className="excel-header-cell text-right">Закупка</th>
                  <th className="excel-header-cell text-right">Сумма</th>
                  <th className="excel-header-cell text-right">Чистая сумма</th>
                  <th className="excel-header-cell text-right">Себестоим.</th>
                  <th className="excel-header-cell text-right text-emerald-800">Прибыль</th>
                  <th
                    onClick={() => handleSort('sold_at')}
                    className="excel-header-cell cursor-pointer hover:bg-[#e2e8f0] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Дата</span>
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
                      <td className="excel-cell font-medium text-[#1e293b] truncate max-w-[180px]" title={sale.product_name}>
                        {sale.product_name}
                      </td>
                      <td className="excel-cell text-right tabular-nums">{sale.quantity} шт.</td>
                      <td className="excel-cell text-right tabular-nums text-amber-700">
                        {sale.returned_quantity > 0 ? `${sale.returned_quantity} шт.` : '—'}
                      </td>
                      <td className="excel-cell text-right tabular-nums font-semibold text-[#107c41]">
                        {sale.net_quantity} шт.
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
