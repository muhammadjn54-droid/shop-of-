import React, { useState, useEffect, type FormEvent } from 'react';
import { sellProduct } from '../../api/products';
import { ShoppingCart, Loader2, AlertCircle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMoney } from '../../utils/formatters';
import { formatErrorMessage } from '../common/ErrorState';
import type { Product } from '../../types';

export interface SellProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (product?: Product) => void;
}

export const SellProductDialog = ({ product, isOpen, onClose, onSuccess }: SellProductDialogProps) => {
  const [quantity, setQuantity] = useState<number | string>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setError(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const qty = parseInt(String(quantity), 10);
    if (!qty || qty <= 0) {
      setError('Укажите корректное количество');
      return;
    }

    if (qty > product.remaining_quantity) {
      setError(`Недостаточно товара на складе (осталось ${product.remaining_quantity} шт.)`);
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      quantity: qty,
    };

    try {
      const response = await sellProduct(product.id, payload);
      toast.success(response.message || `Продано ${qty} шт.`);
      onSuccess?.(response.product);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          data?: {
            detail?: string;
          };
        };
      };
      const msg = axiosErr.response?.data?.detail || formatErrorMessage(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-md border border-[#cbd5e1] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="bg-[#107c41] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <ShoppingCart className="w-4 h-4" />
            <span>Оформить продажу товара</span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-emerald-100 hover:text-white text-base leading-none"
          >
            ✕
          </button>
        </div>

        {/* Product mini info */}
        <div className="p-4 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center gap-3">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 rounded object-cover border border-[#cbd5e1] shrink-0 bg-white"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-[#e2e8f0] text-[#94a3b8] flex items-center justify-center border border-[#cbd5e1] shrink-0">
              <Package className="w-6 h-6" />
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className="font-semibold text-xs text-[#1e293b] truncate" title={product.name}>
              {product.name}
            </h4>
            <div className="flex items-center gap-2 text-[11px] mt-0.5">
              <span className="text-[#64748b]">
                Остаток:{' '}
                <strong className={product.remaining_quantity <= 5 ? 'text-[#d97706]' : 'text-[#107c41]'}>
                  {product.remaining_quantity} шт.
                </strong>
              </span>
              <span className="text-[#cbd5e1]">|</span>
              <span className="text-[#64748b]">
                Цена: <strong className="text-[#1e293b]">{formatMoney(product.selling_price)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Form with strictly ONE input */}
        <form onSubmit={handleSubmit} className="p-4 text-xs space-y-3.5">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Количество для продажи <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={product.remaining_quantity || 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              autoFocus
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
              placeholder="Введите количество шт."
            />
            <div className="flex items-center justify-between text-[11px] text-[#64748b] mt-1">
              <span>Доступно: {product.remaining_quantity} шт.</span>
              <span>
                Итого к оплате:{' '}
                <strong className="text-[#107c41]">
                  {formatMoney(
                    (parseInt(String(quantity), 10) || 0) * (parseFloat(String(product.selling_price)) || 0)
                  )}
                </strong>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2e8f0]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 rounded border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#475569] font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading || product.remaining_quantity <= 0}
              className="px-4 py-1.5 rounded bg-[#107c41] hover:bg-[#0d6936] text-white font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Продажа...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Подтвердить продажу</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellProductDialog;
