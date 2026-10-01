import React, { useState } from 'react';
import { deleteProduct } from '../../api/products';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatErrorMessage } from '../common/ErrorState';
import type { Product } from '../../types';

export interface DeleteProductDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DeleteProductDialog = ({ product, isOpen, onClose, onSuccess }: DeleteProductDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteProduct(product.id);
      toast.success('Товар удалён');
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = formatErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-md border border-[#cbd5e1] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="bg-[#b91c1c] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Удалить товар?</span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-rose-100 hover:text-white text-base leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-xs text-[#334155]">
          <p className="text-sm text-[#1e293b] font-medium mb-2">
            Вы действительно хотите удалить «<strong className="text-[#0f172a]">{product.name}</strong>»?
          </p>
          <p className="text-[#64748b] mb-4">
            Это действие нельзя отменить. Вся связанная информация о товаре будет безвозвратно удалена.
          </p>

          {error && (
            <div className="p-2.5 mb-4 bg-red-50 border border-red-200 text-red-700 rounded text-xs">
              {error}
            </div>
          )}

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
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-3.5 py-1.5 rounded bg-[#dc2626] hover:bg-[#b91c1c] text-white font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Удаление...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Удалить</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProductDialog;
