import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { getProduct, getProductSales } from '../../api/products';
import {
  Package,
  Calendar,
  History,
  ShoppingCart,
  PlusCircle,
  RotateCcw,
  Edit,
  Trash2,
  Loader2,
  Info,
  Barcode,
} from 'lucide-react';
import { formatMoney, formatDate, formatDateTime } from '../../utils/formatters';
import ImageSwiper from '../common/ImageSwiper';
import { getProductGallery } from '../../utils/productGallery';
import type { Product, ProductSale, PaginatedResponse } from '../../types';

export interface ProductDetailsDialogProps {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenSell?: (product: Product) => void;
  onOpenAddStock?: (product: Product) => void;
  onOpenReturn?: (product: Product) => void;
  onOpenDelete?: (product: Product) => void;
  onProductUpdated?: (product: Product) => void;
}

export const ProductDetailsDialog = ({
  productId,
  isOpen,
  onClose,
  onOpenSell,
  onOpenAddStock,
  onOpenReturn,
  onOpenDelete,
  onProductUpdated,
}: ProductDetailsDialogProps) => {
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [sales, setSales] = useState<ProductSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'sales'>('details');

  useEffect(() => {
    if (isOpen && productId) {
      loadProductData();
    } else {
      setProduct(null);
      setSales([]);
      setActiveTab('details');
    }
  }, [isOpen, productId]);

  const loadProductData = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await getProduct(productId);
      setProduct(data);
      onProductUpdated?.(data);
    } catch (err) {
      console.error('Failed to load product details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSalesHistory = async () => {
    if (!productId) return;
    setLoadingSales(true);
    try {
      const res = await getProductSales(productId);
      if (Array.isArray(res)) {
        setSales(res);
      } else if (res && Array.isArray((res as PaginatedResponse<ProductSale>).results)) {
        setSales((res as PaginatedResponse<ProductSale>).results);
      } else {
        setSales([]);
      }
    } catch (err) {
      console.error('Failed to load sales history:', err);
    } finally {
      setLoadingSales(false);
    }
  };

  const handleTabChange = (tab: 'details' | 'sales') => {
    setActiveTab(tab);
    if (tab === 'sales' && sales.length === 0) {
      loadSalesHistory();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-md border border-[#cbd5e1] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-xs">
        {/* Header */}
        <div className="bg-[#107c41] text-white px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-200" />
            <span className="font-semibold text-xs tracking-tight">Карточка товара (ID: #{productId})</span>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-100 hover:text-white text-base leading-none p-0.5"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#cbd5e1] bg-[#f8fafc] px-4 shrink-0">
          <button
            onClick={() => handleTabChange('details')}
            className={`py-2 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'details'
                ? 'border-[#107c41] text-[#107c41] font-semibold bg-white'
                : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Параметры и показатели</span>
          </button>
          <button
            onClick={() => handleTabChange('sales')}
            className={`py-2 px-3 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'sales'
                ? 'border-[#107c41] text-[#107c41] font-semibold bg-white'
                : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>История продаж ({sales.length})</span>
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#64748b]">
              <Loader2 className="w-6 h-6 animate-spin text-[#107c41]" />
              <span>Загрузка данных товара...</span>
            </div>
          ) : !product ? (
            <div className="py-8 text-center text-[#dc2626]">Не удалось загрузить данные товара.</div>
          ) : activeTab === 'details' ? (
            <div className="space-y-4">
              {/* Top Summary Card */}
              <div className="flex flex-col sm:flex-row gap-4 p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded">
                {/* Auto Swiper for Product Photos */}
                <ImageSwiper images={getProductGallery(product)} alt={product.name} />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#0f172a] truncate mb-1" title={product.name}>
                      {product.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#64748b] text-[11px]">
                      {product.barcode && (
                        <>
                          <span className="flex items-center gap-1">
                            <Barcode className="w-3.5 h-3.5 text-[#94a3b8]" />
                            Штрихкод: <strong className="font-mono">{product.barcode}</strong>
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" />
                        Поступление: <strong>{formatDate(product.arrival_date)}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Создан: <strong>{formatDateTime(product.created_at)}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Stock status badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Поступило: {product.quantity_received} шт.
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      Продано: {product.quantity_sold} шт.
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                        product.remaining_quantity <= 0
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : product.remaining_quantity <= 5
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      Остаток: {product.remaining_quantity} шт.
                    </span>
                  </div>
                </div>
              </div>

              {/* Excel Grid of Metrics */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-2">
                  Финансовые показатели
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-white border border-[#e2e8f0] rounded">
                    <span className="text-[10px] text-[#64748b] block mb-0.5">Цена закупки</span>
                    <span className="text-xs font-semibold text-[#1e293b]">
                      {formatMoney(product.purchase_price)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-[#e2e8f0] rounded">
                    <span className="text-[10px] text-[#64748b] block mb-0.5">Цена продажи</span>
                    <span className="text-xs font-semibold text-[#1e293b]">
                      {formatMoney(product.selling_price)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-[#e2e8f0] rounded">
                    <span className="text-[10px] text-[#64748b] block mb-0.5">Прибыль с 1 шт.</span>
                    <span className="text-xs font-semibold text-[#15803d]">
                      {formatMoney(product.profit_per_item)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-[#e2e8f0] rounded">
                    <span className="text-[10px] text-[#64748b] block mb-0.5">Общая выручка</span>
                    <span className="text-xs font-semibold text-[#0369a1]">
                      {formatMoney(product.revenue)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-[#e2e8f0] rounded">
                    <span className="text-[10px] text-[#64748b] block mb-0.5">Себестоимость проданного</span>
                    <span className="text-xs font-semibold text-[#475569]">
                      {formatMoney(product.sold_cost)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded">
                    <span className="text-[10px] text-[#166534] block mb-0.5">Общая чистая прибыль</span>
                    <span className="text-xs font-bold text-[#15803d]">
                      {formatMoney(product.profit)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#fef2f2] border border-[#fecaca] rounded col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#991b1b] block mb-0.5">Общий убыток</span>
                    <span className="text-xs font-bold text-[#b91c1c]">
                      {formatMoney(product.loss)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-[#e2e8f0] rounded col-span-2">
                    <span className="text-[10px] text-[#64748b] block mb-0.5">Последнее обновление</span>
                    <span className="text-[11px] text-[#475569]">
                      {formatDateTime(product.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Sales History Tab */
            <div>
              {loadingSales ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#64748b]">
                  <Loader2 className="w-5 h-5 animate-spin text-[#107c41]" />
                  <span>Загрузка истории продаж...</span>
                </div>
              ) : sales.length === 0 ? (
                <div className="py-8 text-center bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded text-[#64748b]">
                  <p>По этому товару ещё не было продаж.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#e2e8f0] rounded">
                  <table className="excel-table">
                    <thead>
                      <tr>
                        <th className="excel-header-cell">ID</th>
                        <th className="excel-header-cell">Дата продажи</th>
                        <th className="excel-header-cell text-right">Кол-во</th>
                        <th className="excel-header-cell text-right">Возврат</th>
                        <th className="excel-header-cell text-right">Цена</th>
                        <th className="excel-header-cell text-right">Сумма</th>
                        <th className="excel-header-cell text-right">Прибыль</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-[#f1f5f9]">
                          <td className="excel-cell text-center font-mono text-[#64748b]">#{s.id}</td>
                          <td className="excel-cell text-[#334155]">{formatDateTime(s.sold_at)}</td>
                          <td className="excel-cell text-right font-medium">{s.quantity} шт.</td>
                          <td className="excel-cell text-right text-amber-700">
                            {s.returned_quantity > 0 ? `${s.returned_quantity} шт.` : '—'}
                          </td>
                          <td className="excel-cell text-right">{formatMoney(s.price_per_item)}</td>
                          <td className="excel-cell text-right font-medium">{formatMoney(s.total_amount)}</td>
                          <td className="excel-cell text-right text-emerald-700 font-medium">
                            {formatMoney(s.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {product && (
          <div className="bg-[#f8fafc] border-t border-[#cbd5e1] p-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSell?.(product);
                }}
                disabled={product.remaining_quantity <= 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#107c41] hover:bg-[#0d6936] text-white font-medium transition-colors disabled:opacity-40"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Продать</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddStock?.(product);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#334155] font-medium transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#107c41]" />
                <span>+ На склад</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReturn?.(product);
                }}
                disabled={product.quantity_sold <= 0}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#334155] font-medium transition-colors disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#d97706]" />
                <span>Вернуть</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/products/${product.id}/edit`);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#0369a1] font-medium transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Изменить</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDelete?.(product);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#fca5a5] bg-white hover:bg-[#fef2f2] text-[#dc2626] font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Удалить</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-[#cbd5e1] bg-white hover:bg-[#e2e8f0] text-[#475569] font-medium transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsDialog;
