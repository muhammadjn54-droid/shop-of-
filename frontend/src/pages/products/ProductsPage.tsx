import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getProducts, getLowStock, getProductByBarcode } from '../../api/products';
import {
  Plus,
  RefreshCw,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Edit,
  Trash2,
  Package,
  ShoppingCart,
  FileSpreadsheet,
} from 'lucide-react';
import SearchInput from '../../components/common/SearchInput';
import Pagination from '../../components/common/Pagination';
import { ExcelTableSkeleton } from '../../components/common/LoadingState';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import ProductDetailsDialog from '../../components/products/ProductDetailsDialog';
import SellProductDialog from '../../components/products/SellProductDialog';
import AddStockDialog from '../../components/products/AddStockDialog';
import ReturnProductDialog from '../../components/products/ReturnProductDialog';
import DeleteProductDialog from '../../components/products/DeleteProductDialog';
import { formatMoney, formatDate } from '../../utils/formatters';
import { getProductImage } from '../../utils/productGallery';
import { useLanguage } from '../../context/LanguageContext';
import { PRODUCT_CATEGORIES, getCategoryMeta } from '../../utils/categories';
import type { Product } from '../../types';

export const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lang, t } = useLanguage();

  const urlSearch = searchParams.get('search') || '';

  // Data & query states
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [ordering, setOrdering] = useState('-created_at');
  const [isLowStockFilter, setIsLowStockFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Status states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  // Selected product & Dialog states
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        ordering: ordering,
      };

      if (selectedCategory !== 'all') {
        params.category = selectedCategory;
      }

      const res = isLowStockFilter
        ? await getLowStock(params)
        : await getProducts(params);

      // Backend pagination: { count, next, previous, results: [...] }
      setProducts(res.results || []);
      setTotalCount(res.count || (res.results ? res.results.length : 0));
      setHasNext(!!res.next);
      setHasPrevious(!!res.previous);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, ordering, isLowStockFilter, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle column header sorting
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

  // Row click opens Details Dialog
  const handleRowClick = (productId: number) => {
    setSelectedProductId(productId);
    setIsDetailsOpen(true);
  };

  // Сканер штрихкодов: по Enter делаем ОДИН точный запрос ?barcode=
  const handleScanEnter = useCallback(async (rawValue: string) => {
    const value = (rawValue || '').trim();
    if (!value) return;
    try {
      const res = await getProductByBarcode(value);
      const found = (res.results || [])[0];
      if (found) {
        setSelectedProductId(found.id);
        setIsDetailsOpen(true);
      }
    } catch (err) {
      console.error('Barcode scan error:', err);
    }
  }, []);

  // Синхронизация поиска и штрихкода из URL (например, из шапки Topbar)
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null && q !== searchTerm) {
      setSearchTerm(q);
      setCurrentPage(1);
      // Если это штрихкод (только цифры от 4 знаков) — сразу открываем карточку товара
      if (/^\d{4,}$/.test(q.trim())) {
        handleScanEnter(q.trim());
      }
    }
  }, [searchParams, handleScanEnter, searchTerm]);

  // Excel columns list for the visual header letters (A, B, C...)
  const columnLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];

  return (
    <div className="flex-1 flex flex-col space-y-3">
      {/* Title & Toolbar */}
      <div className="bg-white border border-[#cbd5e1] rounded-md p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Header left */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#107c41] text-white flex items-center justify-center font-bold shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#1e293b] leading-tight">
                {t('productsTitle')}
              </h1>
              <p className="text-[11px] text-[#64748b]">
                {t('productsSubtitle')}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput
              value={searchTerm}
              onChange={(val) => {
                setSearchTerm(val);
                setCurrentPage(1);
              }}
              onEnter={handleScanEnter}
              placeholder={t('searchPlaceholder')}
            />

            {/* Low stock toggle */}
            <button
              onClick={() => {
                setIsLowStockFilter(!isLowStockFilter);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                isLowStockFilter
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                  : 'bg-white border-[#cbd5e1] text-[#475569] hover:bg-[#f8fafc]'
              }`}
              title={t('lowStockFilter')}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${isLowStockFilter ? 'text-amber-600' : 'text-[#94a3b8]'}`} />
              <span>{t('lowStockFilter')}</span>
            </button>

            {/* Refresh button */}
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="p-1.5 bg-white border border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9] rounded text-xs transition-colors"
              title={t('refreshTable')}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#107c41]' : ''}`} />
            </button>

            {/* Add product button (separate page) */}
            <button
              onClick={() => navigate('/products/create')}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#107c41] hover:bg-[#0d6936] text-white text-xs font-medium rounded shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addProductBtn')}</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 mt-2.5 border-t border-slate-100 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-[#107c41] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <span>📦</span>
            <span>{t('categoryAll')}</span>
          </button>
          {PRODUCT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const label = lang === 'tg' ? cat.labelTg : lang === 'en' ? cat.labelEn : cat.labelRu;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#107c41] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs flex-1 flex flex-col overflow-hidden">
        {loading && products.length === 0 ? (
          <div className="p-4">
            <ExcelTableSkeleton rows={8} cols={10} />
          </div>
        ) : error ? (
          <div className="p-6">
            <ErrorState error={error} onRetry={fetchProducts} />
          </div>
        ) : products.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={searchTerm || isLowStockFilter ? t('noProductsFound') : t('noProductsEmpty')}
              description={
                searchTerm || isLowStockFilter
                  ? t('noProductsDesc')
                  : t('noProductsEmptyDesc')
              }
              actionLabel={!searchTerm && !isLowStockFilter ? t('addProductBtn') : undefined}
              onAction={() => navigate('/products/create')}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto relative">
            <table className="excel-table text-left select-none">
              {/* Excel Column Letters Header */}
              <thead>
                <tr className="bg-[#e2e8f0]">
                  <th className="excel-col-letter w-10"></th>
                  {columnLetters.map((col, idx) => (
                    <th key={idx} className="excel-col-letter">
                      {col}
                    </th>
                  ))}
                </tr>

                {/* Real Data Columns Header */}
                <tr className="bg-[#f1f5f9] text-[#475569] sticky top-0 z-10 shadow-2xs">
                  <th className="excel-header-cell w-10 text-center">№</th>
                  <th className="excel-header-cell w-12 text-center">{t('colPhoto')}</th>
                  <th className="excel-header-cell text-center min-w-[120px]">{t('colCategory')}</th>
                  
                  <th
                    onClick={() => handleSort('arrival_date')}
                    className="excel-header-cell cursor-pointer hover:bg-[#e2e8f0] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{t('colArrivalDate')}</span>
                      {getSortIcon('arrival_date')}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('name')}
                    className="excel-header-cell cursor-pointer hover:bg-[#e2e8f0] transition-colors min-w-[160px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{t('colName')}</span>
                      {getSortIcon('name')}
                    </div>
                  </th>

                  <th className="excel-header-cell text-right">{t('colReceived')}</th>
                  <th className="excel-header-cell text-right">{t('colSold')}</th>
                  <th className="excel-header-cell text-right">{t('colRemaining')}</th>

                  <th
                    onClick={() => handleSort('purchase_price')}
                    className="excel-header-cell cursor-pointer hover:bg-[#e2e8f0] transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{t('colPurchasePrice')}</span>
                      {getSortIcon('purchase_price')}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('selling_price')}
                    className="excel-header-cell cursor-pointer hover:bg-[#e2e8f0] transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{t('colSellingPrice')}</span>
                      {getSortIcon('selling_price')}
                    </div>
                  </th>

                  <th className="excel-header-cell text-right">{t('colRevenue')}</th>
                  <th className="excel-header-cell text-right">{t('colCost')}</th>
                  <th className="excel-header-cell text-right text-emerald-800">{t('colProfit')}</th>
                  <th className="excel-header-cell text-right text-rose-800">{t('colLoss')}</th>
                  <th className="excel-header-cell text-center min-w-[110px]">{t('colActions')}</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-[#e2e8f0]">
                {products.map((item, index) => {
                  const rowNumber = (currentPage - 1) * 10 + index + 1;
                  const image = getProductImage(item);
                  const isLow = item.remaining_quantity <= (item.min_stock ?? 5) && item.remaining_quantity > 0;
                  const isOut = item.remaining_quantity <= 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item.id)}
                      className={`cursor-pointer transition-colors group ${
                        selectedProductId === item.id
                          ? 'bg-[#ecfdf5] hover:bg-[#d1fae5]'
                          : index % 2 === 0
                          ? 'bg-white hover:bg-[#f8fafc]'
                          : 'bg-[#fafafa] hover:bg-[#f1f5f9]'
                      }`}
                    >
                      {/* Excel Row Index */}
                      <td className="excel-row-num">{rowNumber}</td>

                      {/* Photo Thumbnail */}
                      <td className="excel-cell text-center p-1 w-12">
                        {image ? (
                          <img
                            src={image}
                            alt={item.name}
                            className="w-7 h-7 rounded object-cover mx-auto border border-[#cbd5e1] bg-white"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded bg-[#f1f5f9] text-[#94a3b8] flex items-center justify-center mx-auto border border-[#e2e8f0]">
                            <Package className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="excel-cell text-center px-2 py-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            getCategoryMeta(item.category, lang).colorClass
                          }`}
                        >
                          <span>{getCategoryMeta(item.category, lang).icon}</span>
                          <span>{getCategoryMeta(item.category, lang).label}</span>
                        </span>
                      </td>

                      {/* Arrival Date */}
                      <td className="excel-cell text-[#475569]">
                        {formatDate(item.arrival_date)}
                      </td>

                      {/* Name */}
                      <td className="excel-cell font-medium text-[#1e293b] max-w-[200px] truncate" title={item.name}>
                        {item.name}
                      </td>

                      {/* Quantity Received */}
                      <td className="excel-cell text-right tabular-nums text-[#334155]">
                        {item.quantity_received}
                      </td>

                      {/* Quantity Sold */}
                      <td className="excel-cell text-right tabular-nums text-[#475569]">
                        {item.quantity_sold}
                      </td>

                      {/* Remaining Quantity (Color Coded) */}
                      <td className="excel-cell text-right tabular-nums font-semibold">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[11px] ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'text-emerald-800'
                          }`}
                        >
                          {item.remaining_quantity}
                        </span>
                      </td>

                      {/* Purchase Price */}
                      <td className="excel-cell text-right tabular-nums text-[#475569]">
                        {formatMoney(item.purchase_price)}
                      </td>

                      {/* Selling Price */}
                      <td className="excel-cell text-right tabular-nums font-medium text-[#1e293b]">
                        {formatMoney(item.selling_price)}
                      </td>

                      {/* Revenue */}
                      <td className="excel-cell text-right tabular-nums text-[#0369a1] font-medium">
                        {formatMoney(item.revenue)}
                      </td>

                      {/* Sold Cost */}
                      <td className="excel-cell text-right tabular-nums text-[#64748b]">
                        {formatMoney(item.sold_cost)}
                      </td>

                      {/* Profit (Soft Green) */}
                      <td className="excel-cell text-right tabular-nums font-semibold text-[#15803d]">
                        {formatMoney(item.profit)}
                      </td>

                      {/* Loss (Soft Red) */}
                      <td className="excel-cell text-right tabular-nums font-medium text-[#b91c1c]">
                        {Number(item.loss) > 0 ? formatMoney(item.loss) : '—'}
                      </td>

                      {/* Actions Buttons with stopPropagation */}
                      <td
                        className="excel-cell text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {/* Sell quick button */}
                          <button
                            onClick={() => {
                              setActiveProduct(item);
                              setIsSellOpen(true);
                            }}
                            disabled={item.remaining_quantity <= 0}
                            className="p-1 rounded text-[#107c41] hover:bg-[#e8f5e9] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title={t('actionSell')}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>

                          {/* View details button */}
                          <button
                            onClick={() => handleRowClick(item.id)}
                            className="p-1 rounded text-[#475569] hover:bg-[#f1f5f9] transition-colors"
                            title={t('detailsTitle')}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => navigate(`/products/${item.id}/edit`)}
                            className="p-1 rounded text-[#0369a1] hover:bg-[#e0f2fe] transition-colors"
                            title={t('actionEdit')}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              setActiveProduct(item);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1 rounded text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
                            title={t('actionDelete')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Excel Pagination */}
        <Pagination
          currentPage={currentPage}
          totalCount={totalCount}
          pageSize={10}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Details Dialog */}
      <ProductDetailsDialog
        productId={selectedProductId}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedProductId(null);
        }}
        onOpenSell={(prod) => {
          setActiveProduct(prod);
          setIsSellOpen(true);
        }}
        onOpenAddStock={(prod) => {
          setActiveProduct(prod);
          setIsAddStockOpen(true);
        }}
        onOpenReturn={(prod) => {
          setActiveProduct(prod);
          setIsReturnOpen(true);
        }}
        onOpenDelete={(prod) => {
          setActiveProduct(prod);
          setIsDeleteOpen(true);
        }}
        onProductUpdated={() => fetchProducts()}
      />

      {/* Sell Dialog */}
      <SellProductDialog
        product={activeProduct}
        isOpen={isSellOpen}
        onClose={() => {
          setIsSellOpen(false);
          setActiveProduct(null);
        }}
        onSuccess={() => fetchProducts()}
      />

      {/* Add Stock Dialog */}
      <AddStockDialog
        product={activeProduct}
        isOpen={isAddStockOpen}
        onClose={() => {
          setIsAddStockOpen(false);
          setActiveProduct(null);
        }}
        onSuccess={() => fetchProducts()}
      />

      {/* Return Dialog */}
      <ReturnProductDialog
        product={activeProduct}
        isOpen={isReturnOpen}
        onClose={() => {
          setIsReturnOpen(false);
          setActiveProduct(null);
        }}
        onSuccess={() => fetchProducts()}
      />

      {/* Delete Dialog */}
      <DeleteProductDialog
        product={activeProduct}
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setActiveProduct(null);
        }}
        onSuccess={() => {
          fetchProducts();
          if (isDetailsOpen) {
            setIsDetailsOpen(false);
            setSelectedProductId(null);
          }
        }}
      />
    </div>
  );
};

export default ProductsPage;
