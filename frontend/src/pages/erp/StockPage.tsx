import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Boxes, Search, SlidersHorizontal, AlertTriangle, CalendarClock, Barcode, Trash2 } from 'lucide-react';
import { stockApi } from '../../api/erp';
import { getProducts } from '../../api/products';
import type { StockMovement } from '../../types/erp';
import type { Product } from '../../types';
import { formatMoney, formatDateTime, formatNumber } from '../../utils/formatters';
import {
  PageHeader,
  Card,
  SectionTitle,
  Modal,
  Field,
  StatCard,
  Tabs,
  Th,
  Td,
  Empty,
  Spinner,
  btnPrimary,
  btnSecondary,
  btnDanger,
  inputCls,
} from '../../components/erp/ErpUI';

const movementLabels: Record<string, string> = {
  sale: 'Продажа',
  return: 'Возврат',
  purchase: 'Поступление',
  adjustment: 'Корректировка',
  manual_increase: 'Ручное увеличение',
  manual_decrease: 'Ручное уменьшение',
  transfer_out: 'Перемещение (расход)',
  transfer_in: 'Перемещение (приход)',
  inventory: 'Инвентаризация',
  write_off: 'Списание',
};

export const StockPage = () => {
  const [tab, setTab] = useState('movements');
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movementCount, setMovementCount] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [expiry, setExpiry] = useState<Array<Record<string, unknown>>>([]);
  const [serials, setSerials] = useState<Array<Record<string, unknown>>>([]);
  const [lowStock, setLowStock] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [serialOpen, setSerialOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [adjust, setAdjust] = useState({ productId: '', newQuantity: '', reason: '' });
  const [serial, setSerial] = useState({ productId: '', serialNumber: '', note: '' });

  const loadSummary = async () => {
    try {
      const data = await stockApi.summary();
      setSummary(data as Record<string, number>);
    } catch {
      // non-blocking
    }
  };

  const loadProducts = async () => {
    try {
      const data = await getProducts({ limit: 500 });
      setProducts(data.results || []);
    } catch {
      // non-blocking
    }
  };

  const loadTab = async () => {
    setLoading(true);
    try {
      if (tab === 'movements') {
        const data = await stockApi.movements({ search, type, limit: 100 });
        setMovements(data.results);
        setMovementCount(data.count);
      } else if (tab === 'expiry') {
        const data = await stockApi.expiry(60);
        setExpiry(Array.isArray(data) ? data : data.results || []);
      } else if (tab === 'serials') {
        const data = await stockApi.serials({ search });
        setSerials(Array.isArray(data) ? data : data.results || []);
      } else if (tab === 'low') {
        const data = await stockApi.lowStock();
        setLowStock(data.results || []);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки склада');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
    loadProducts();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadTab, 200);
    return () => clearTimeout(t);
  }, [tab, search, type]);

  const submitAdjust = async () => {
    if (!adjust.productId) return toast.error('Выберите товар');
    if (!adjust.reason.trim()) return toast.error('Укажите причину корректировки');
    if (adjust.newQuantity === '') return toast.error('Укажите фактический остаток');
    setSaving(true);
    try {
      await stockApi.adjust({
        productId: Number(adjust.productId),
        newQuantity: Number(adjust.newQuantity),
        reason: adjust.reason,
      });
      toast.success('Остаток скорректирован');
      setAdjustOpen(false);
      setAdjust({ productId: '', newQuantity: '', reason: '' });
      loadSummary();
      loadTab();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка корректировки');
    } finally {
      setSaving(false);
    }
  };

  const submitSerial = async () => {
    if (!serial.productId || !serial.serialNumber.trim()) return toast.error('Выберите товар и укажите серийный номер');
    setSaving(true);
    try {
      await stockApi.createSerial({
        productId: Number(serial.productId),
        serialNumber: serial.serialNumber.trim(),
        note: serial.note,
      });
      toast.success('Серийный номер добавлен');
      setSerialOpen(false);
      setSerial({ productId: '', serialNumber: '', note: '' });
      loadTab();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка добавления серийного номера');
    } finally {
      setSaving(false);
    }
  };

  const clearMovements = async () => {
    if (!window.confirm('Очистить всю историю движения товаров?')) return;
    try {
      await stockApi.clearMovements();
      toast.success('История движения товаров очищена');
      setMovements([]);
      setMovementCount(0);
      loadSummary();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка очистки истории');
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-3">
      <PageHeader icon={Boxes} title="Склад и движение товаров" subtitle="Остатки, корректировки, сроки годности и серийные номера" onRefresh={() => { loadSummary(); loadTab(); }}>
        <button className={btnSecondary} onClick={() => setSerialOpen(true)}>
          <Barcode className="w-3.5 h-3.5" /> Серийный номер
        </button>
        <button className={btnPrimary} onClick={() => setAdjustOpen(true)}>
          <SlidersHorizontal className="w-3.5 h-3.5" /> Корректировка
        </button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5">
        <StatCard label="Позиций" value={formatNumber(summary.totalProducts ?? summary.products ?? 0)} />
        <StatCard label="Единиц на складе" value={formatNumber(summary.totalUnits ?? summary.stock ?? 0)} tone="green" />
        <StatCard label="Себестоимость" value={formatMoney(summary.stockValueCost ?? 0)} tone="blue" />
        <StatCard label="В розничных ценах" value={formatMoney(summary.stockValueRetail ?? 0)} tone="violet" />
        <StatCard label="Мало остатка" value={formatNumber(summary.lowCount ?? 0)} tone="amber" />
        <StatCard label="Нет в наличии" value={formatNumber(summary.outCount ?? 0)} tone="rose" />
      </div>

      <Card>
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { id: 'movements', label: 'Движения', count: movementCount },
            { id: 'low', label: 'Мало остатка', count: lowStock.length },
            { id: 'expiry', label: 'Сроки годности', count: expiry.length },
            { id: 'serials', label: 'Серийные номера', count: serials.length },
          ]}
        />
        <SectionTitle
          title={tab === 'movements' ? 'История движения товаров' : tab === 'low' ? 'Товары ниже минимума' : tab === 'expiry' ? 'Партии с истекающим сроком' : 'Серийные номера'}
          subtitle={tab === 'movements' ? 'Все операции: продажи, поступления, возвраты и корректировки' : undefined}
          action={
            tab === 'movements' || tab === 'serials' ? (
              <div className="flex items-center gap-2">
                <div className="relative w-44 sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className={`${inputCls} pl-8`} placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {tab === 'movements' && (
                  <>
                    <select className={`${inputCls} w-36`} value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="all">Все типы</option>
                      <option value="sale">Продажа</option>
                      <option value="purchase">Поступление</option>
                      <option value="return">Возврат</option>
                      <option value="manual_increase">Увеличение</option>
                      <option value="manual_decrease">Уменьшение</option>
                    </select>
                    <button
                      type="button"
                      className={btnDanger}
                      onClick={clearMovements}
                      disabled={movements.length === 0}
                      title="Очистить историю движения товаров"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Очистить</span>
                    </button>
                  </>
                )}
              </div>
            ) : undefined
          }
        />

        {loading ? (
          <Spinner />
        ) : tab === 'movements' ? (
          movements.length === 0 ? (
            <Empty>Движений пока нет.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="excel-table text-left w-full">
                <thead>
                  <tr>
                    <Th>Дата</Th>
                    <Th>Товар</Th>
                    <Th>Тип</Th>
                    <Th right>Кол-во</Th>
                    <Th right>Было</Th>
                    <Th right>Стало</Th>
                    <Th>Причина</Th>
                    <Th>Сотрудник</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-[#f8fafc] dark:hover:bg-slate-800/50">
                      <Td>{formatDateTime(m.createdAt)}</Td>
                      <Td>
                        <div className="font-medium">{m.productName}</div>
                        <div className="text-[10px] text-[#94a3b8]">{m.barcode}</div>
                      </Td>
                      <Td>{movementLabels[m.type] || m.type}</Td>
                      <Td right>
                        <span className={m.quantity >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity}
                        </span>
                      </Td>
                      <Td right>{m.quantityBefore}</Td>
                      <Td right>{m.quantityAfter}</Td>
                      <Td className="max-w-[200px] truncate">{m.reason || '—'}</Td>
                      <Td>{m.userName || '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : tab === 'low' ? (
          lowStock.length === 0 ? (
            <Empty>Все товары в достаточном количестве.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="excel-table text-left w-full">
                <thead>
                  <tr>
                    <Th>Товар</Th>
                    <Th>Штрихкод</Th>
                    <Th right>Остаток</Th>
                    <Th right>Минимум</Th>
                    <Th>Статус</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                  {lowStock.map((p, index) => {
                    const row = p as { id: number; name: string; barcode?: string; remaining: number; minStock: number };
                    return (
                      <tr key={row.id || index}>
                        <Td>{row.name}</Td>
                        <Td>{row.barcode || '—'}</Td>
                        <Td right><span className={row.remaining <= 0 ? 'font-bold text-rose-600' : 'font-semibold text-amber-600'}>{row.remaining}</span></Td>
                        <Td right>{row.minStock}</Td>
                        <Td>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${row.remaining <= 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                            <AlertTriangle className="w-3 h-3" /> {row.remaining <= 0 ? 'Нет в наличии' : 'Пора закупить'}
                          </span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : tab === 'expiry' ? (
          expiry.length === 0 ? (
            <Empty>Нет партий с истекающим сроком годности.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="excel-table text-left w-full">
                <thead>
                  <tr>
                    <Th>Товар</Th>
                    <Th>Партия</Th>
                    <Th>Срок годности</Th>
                    <Th right>Остаток партии</Th>
                    <Th right>Дней осталось</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                  {expiry.map((raw, index) => {
                    const b = raw as Record<string, unknown>;
                    const product = (b.product || {}) as Record<string, unknown>;
                    const days = b.daysLeft ?? b.daysUntilExpiry;
                    return (
                      <tr key={String(b.id || index)}>
                        <Td>{String(product.name || b.productName || '—')}</Td>
                        <Td>{String(b.batchNumber || b.id || '—')}</Td>
                        <Td>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock className="w-3 h-3 text-amber-500" />
                            {b.expiryDate ? formatDateTime(String(b.expiryDate)).split(' ')[0] : '—'}
                          </span>
                        </Td>
                        <Td right>{String(b.quantity ?? b.remainingQuantity ?? 0)}</Td>
                        <Td right><span className="font-semibold text-amber-600">{String(days ?? '—')}</span></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : serials.length === 0 ? (
          <Empty>Серийные номера не добавлены.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="excel-table text-left w-full">
              <thead>
                <tr>
                  <Th>Товар</Th>
                  <Th>Серийный номер</Th>
                  <Th>Статус</Th>
                  <Th>Продажа</Th>
                  <Th>Добавлен</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-800">
                {serials.map((raw, index) => {
                  const s = raw as Record<string, unknown>;
                  const product = (s.product || {}) as Record<string, unknown>;
                  return (
                    <tr key={String(s.id || index)}>
                      <Td>{String(product.name || s.productName || '—')}</Td>
                      <Td className="font-mono">{String(s.serialNumber || '—')}</Td>
                      <Td>{String(s.status || '—')}</Td>
                      <Td>{s.orderId ? `#${String(s.orderId)}` : '—'}</Td>
                      <Td>{s.createdAt ? formatDateTime(String(s.createdAt)) : '—'}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Корректировка остатка"
        subtitle="Каждая корректировка фиксируется в журнале и аудите"
        footer={
          <>
            <button className={btnSecondary} onClick={() => setAdjustOpen(false)}>Отмена</button>
            <button className={btnPrimary} onClick={submitAdjust} disabled={saving}>{saving ? 'Сохранение...' : 'Скорректировать'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Товар *">
            <select className={inputCls} value={adjust.productId} onChange={(e) => {
              const id = e.target.value;
              const product = products.find((p) => p.id === Number(id));
              setAdjust({ ...adjust, productId: id, newQuantity: product ? String(product.remaining_quantity) : '' });
            }}>
              <option value="">Выберите товар...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (остаток: {p.remaining_quantity})</option>
              ))}
            </select>
          </Field>
          <Field label="Фактический остаток *">
            <input type="number" min="0" className={inputCls} value={adjust.newQuantity} onChange={(e) => setAdjust({ ...adjust, newQuantity: e.target.value })} />
          </Field>
          <Field label="Причина *">
            <input className={inputCls} placeholder="Например: недостача при пересчёте" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={serialOpen}
        onClose={() => setSerialOpen(false)}
        title="Добавить серийный номер"
        footer={
          <>
            <button className={btnSecondary} onClick={() => setSerialOpen(false)}>Отмена</button>
            <button className={btnPrimary} onClick={submitSerial} disabled={saving}>{saving ? 'Сохранение...' : 'Добавить'}</button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Товар *">
            <select className={inputCls} value={serial.productId} onChange={(e) => setSerial({ ...serial, productId: e.target.value })}>
              <option value="">Выберите товар...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Серийный номер *">
            <input className={inputCls} value={serial.serialNumber} onChange={(e) => setSerial({ ...serial, serialNumber: e.target.value })} />
          </Field>
          <Field label="Примечание">
            <input className={inputCls} value={serial.note} onChange={(e) => setSerial({ ...serial, note: e.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

export default StockPage;
