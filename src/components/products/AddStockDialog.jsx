import React, { useState, useEffect } from 'react';
import { addStock } from '../../api/products';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMoney } from '../../utils/formatters';
import { formatErrorMessage } from '../common/ErrorState';

export const AddStockDialog = ({ product, isOpen, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setPurchasePrice('');
      setError(null);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      setError('Укажите корректное количество для пополнения');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      quantity: qty,
    };
    if (purchasePrice && purchasePrice.trim() !== '') {
      payload.purchase_price = purchasePrice.trim();
    }

    try {
      const response = await addStock(product.id, payload);
      toast.success(response.message || `Склад пополнен на ${qty} шт.`);
      onSuccess?.(response.product || response);
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
        <div className="bg-[#107c41] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <PlusCircle className="w-4 h-4" />
            <span>Добавить товар на склад</span>
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
        <div className="p-3.5 bg-[#f8fafc] border-b border-[#e2e8f0] text-xs">
          <p className="font-semibold text-[#1e293b] truncate">{product.name}</p>
          <div className="flex items-center gap-3 text-[11px] text-[#64748b] mt-1">
            <span>
              Текущий остаток: <strong className="text-[#107c41]">{product.remaining_quantity} шт.</strong>
            </span>
            <span>•</span>
            <span>
              Текущая закупка: <strong>{formatMoney(product.purchase_price)}</strong>
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
              Количество поступления <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              className="w-full px-3 py-1.5 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
              placeholder="Количество штук"
            />
          </div>

          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Новая закупочная цена <span className="text-[#94a3b8] font-normal">(необязательно)</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              className="w-full px-3 py-1.5 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
              placeholder={`Оставить текущую: ${product.purchase_price}`}
            />
            <p className="text-[10px] text-[#64748b] mt-0.5">
              Если не указано, останется прежняя цена: {formatMoney(product.purchase_price)}
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
              disabled={loading}
              className="px-4 py-1.5 rounded bg-[#107c41] hover:bg-[#0d6936] text-white font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Пополнение...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Пополнить склад</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockDialog;
