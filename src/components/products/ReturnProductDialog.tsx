import { useState, useEffect, type FormEvent } from 'react';
import { returnProduct } from '../../api/products';
import { RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatErrorMessage } from '../common/ErrorState';
import type { Product } from '../../types';

export interface ReturnProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (product?: Product) => void;
}

export const ReturnProductDialog = ({ product, isOpen, onClose, onSuccess }: ReturnProductDialogProps) => {
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
      setError('Укажите количество для возврата');
      return;
    }

    if (qty > product.quantity_sold) {
      setError(`Нельзя вернуть больше, чем было продано (${product.quantity_sold} шт.)`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await returnProduct(product.id, { quantity: qty });
      toast.success(response.message || `Возвращено ${qty} шт.`);
      onSuccess?.(response.product);
      onClose();
    } catch (err) {
      const msg = formatErrorMessage(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-md border border-[#cbd5e1] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="bg-[#d97706] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <RotateCcw className="w-4 h-4" />
            <span>Оформить возврат товара</span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-amber-100 hover:text-white text-base leading-none"
          >
            ✕
          </button>
        </div>

        {/* Product mini info */}
        <div className="p-3.5 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs">
          <p className="font-semibold text-[#1e293b] truncate">{product.name}</p>
          <div className="flex items-center gap-2 text-[11px] text-[#64748b] mt-1">
            <span>
              Всего продано:{' '}
              <strong className="text-[#334155]">{product.quantity_sold} шт.</strong>
            </span>
            <span>•</span>
            <span>
              Текущий остаток:{' '}
              <strong className="text-[#107c41]">{product.remaining_quantity} шт.</strong>
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 text-xs space-y-3.5">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Количество возврата <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={product.quantity_sold || 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-3 py-1.5 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706]"
              placeholder="Количество штук"
            />
            <p className="text-[10px] text-[#64748b] mt-0.5">
              Максимум к возврату: {product.quantity_sold} шт.
            </p>
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
              disabled={loading || product.quantity_sold <= 0}
              className="px-4 py-1.5 rounded bg-[#d97706] hover:bg-[#b45309] text-white font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Возврат...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Вернуть товар</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnProductDialog;
