import { ShoppingCart, Calendar, Package } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { returnProduct } from '../../api/products';
import { formatErrorMessage } from '../common/ErrorState';
import { formatMoney, formatDateTime } from '../../utils/formatters';
import type { Sale } from '../../types';

export interface SaleDetailsDialogProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const SaleDetailsDialog = ({ sale, isOpen, onClose, onUpdated }: SaleDetailsDialogProps) => {
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setQuantity('1'); setError(''); }, [sale?.id, isOpen]);
  const submitReturn = async (event: FormEvent) => {
    event.preventDefault();
    if (!sale?.product || saving) return;
    const count = Number(quantity);
    if (!Number.isInteger(count) || count < 1 || count > sale.net_quantity) { setError('Укажите доступное количество для возврата'); return; }
    setSaving(true); setError('');
    try {
      await returnProduct(sale.product, { quantity: count, sale_id: sale.id });
      toast.success('Возврат оформлен'); onUpdated?.(); onClose();
    } catch (err) { setError(formatErrorMessage(err)); }
    finally { setSaving(false); }
  };
  if (!isOpen || !sale) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-md border border-[#cbd5e1] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-100 text-xs">
        {/* Header */}
        <div className="bg-[#107c41] text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-200" />
            <span className="font-semibold text-xs">Чек продажи #{sale.id}</span>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-emerald-100 hover:text-white text-base leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Main Info */}
          <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded">
            <div className="flex items-center gap-2 text-sm font-bold text-[#1e293b] mb-1">
              <Package className="w-4 h-4 text-[#107c41]" />
              <span>{sale.product_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
              <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" />
              <span>Время продажи: {formatDateTime(sale.sold_at)}</span>
            </div>
          </div>

          {/* Quantities breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 bg-white border border-[#e2e8f0] rounded text-center">
              <span className="text-[10px] text-[#64748b] block mb-0.5">Продано</span>
              <span className="text-xs font-bold text-[#1e293b]">{sale.quantity} шт.</span>
            </div>
            <div className="p-2.5 bg-white border border-[#e2e8f0] rounded text-center">
              <span className="text-[10px] text-[#64748b] block mb-0.5">Возвращено</span>
              <span className="text-xs font-bold text-amber-700">
                {sale.returned_quantity > 0 ? `${sale.returned_quantity} шт.` : '0 шт.'}
              </span>
            </div>
            <div className="p-2.5 bg-white border border-[#e2e8f0] rounded text-center">
              <span className="text-[10px] text-[#64748b] block mb-0.5">Чистый остаток</span>
              <span className="text-xs font-bold text-[#107c41]">{sale.net_quantity} шт.</span>
            </div>
          </div>

          {/* Prices & Totals */}
          <div className="space-y-1.5 border border-[#e2e8f0] rounded p-3 bg-white">
            <div className="flex justify-between py-1 border-b border-[#f1f5f9]">
              <span className="text-[#64748b]">Цена продажи за 1 шт.:</span>
              <span className="font-semibold text-[#1e293b]">{formatMoney(sale.price_per_item)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#f1f5f9]">
              <span className="text-[#64748b]">Закупка за 1 шт. (на момент продажи):</span>
              <span className="font-semibold text-[#64748b]">{formatMoney(sale.purchase_price_per_item)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#f1f5f9]">
              <span className="text-[#64748b]">Сумма продажи (общая):</span>
              <span className="font-bold text-[#0369a1]">{formatMoney(sale.total_amount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#f1f5f9]">
              <span className="text-[#64748b]">Чистая сумма (с учётом возвратов):</span>
              <span className="font-bold text-[#1e293b]">{formatMoney(sale.net_total_amount)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#f1f5f9]">
              <span className="text-[#64748b]">Себестоимость проданного:</span>
              <span className="font-medium text-[#475569]">{formatMoney((sale.net_cost_amount ?? sale.cost_amount))}</span>
            </div>
            <div className="flex justify-between py-1.5 bg-[#f0fdf4] px-2 rounded mt-1">
              <span className="text-[#166534] font-medium">Прибыль с этой сделки:</span>
              <span className="font-bold text-[#15803d]">{formatMoney((sale.net_profit ?? sale.profit))}</span>
            </div>
            {Number((sale.net_loss ?? sale.loss)) > 0 && (
              <div className="flex justify-between py-1.5 bg-[#fef2f2] px-2 rounded mt-1">
                <span className="text-[#991b1b] font-medium">Убыток:</span>
                <span className="font-bold text-[#b91c1c]">{formatMoney((sale.net_loss ?? sale.loss))}</span>
              </div>
            )}
          </div>
        </div>

        {sale.net_quantity > 0 && sale.product && (
          <form onSubmit={submitReturn} className="px-4 pb-4 space-y-2">
            {sale.product_is_archived && <p className="text-[#64748b]">Товар в архиве. Возврат доступен по сохранённому чеку.</p>}
            {error && <p role="alert" className="text-red-700">{error}</p>}
            <label htmlFor="sale-return-count" className="block font-medium text-[#334155]">Количество для возврата</label>
            <div className="flex gap-2"><input id="sale-return-count" type="number" min="1" max={sale.net_quantity} step="1" required value={quantity} onChange={e => setQuantity(e.target.value)} className="w-24 px-3 py-1.5 border border-[#cbd5e1] rounded" /><button disabled={saving} className="px-3 py-1.5 rounded bg-[#d97706] hover:bg-[#b45309] text-white disabled:opacity-50">{saving ? 'Возврат...' : 'Оформить возврат'}</button></div>
          </form>
        )}
        {/* Footer */}
        <div className="p-3 bg-[#f8fafc] border-t border-[#cbd5e1] flex justify-end">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3.5 py-1.5 rounded border border-[#cbd5e1] bg-white hover:bg-[#e2e8f0] text-[#334155] font-medium transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailsDialog;
