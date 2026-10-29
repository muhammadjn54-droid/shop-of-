import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Phone,
  Calendar,
  Trash2,
  DollarSign,
  AlertCircle,
  FileText,
  User,
  X,
  CreditCard,
  History,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMoney, formatDate, formatDateTime } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';
import {
  getDebts,
  createDebt,
  addDebtPayment,
  deleteDebt,
} from '../api/debts';
import type { DebtRecord, DebtPayment } from '../types';

const STORAGE_KEY = 'shop_customer_debts';


export const DebtsPage = () => {
  const { lang } = useLanguage();

  const texts = {
    title: lang === 'tg' ? 'Дафтари қарз (Қарздорҳо)' : 'Долговая книга (Долги клиентов)',
    subtitle:
      lang === 'tg'
        ? 'Баҳисобгирии қарзҳои муштариён ва пардохтҳои онҳо'
        : 'Учёт покупок в долг, история выплат и остатки задолженностей',
    addBtn: lang === 'tg' ? '+ Қарзи нав' : '+ Добавить долг',
    searchPlaceholder:
      lang === 'tg'
        ? 'Ҷустуҷӯ аз рӯи ном ё телефон...'
        : 'Поиск по имени или телефону...',
    totalDebt: lang === 'tg' ? 'Ҳамагӣ қарзи фаъол' : 'Общий активный долг',
    debtorsCount: lang === 'tg' ? 'Шумораи қарздорон' : 'Должников',
    totalRepaid: lang === 'tg' ? 'Пардохт шудааст' : 'Всего выплачено',
    filterAll: lang === 'tg' ? 'Ҳама' : 'Все',
    filterActive: lang === 'tg' ? 'Фаъол (Пардохтнашуда)' : 'Активные',
    filterPaid: lang === 'tg' ? 'Пурра пӯшида' : 'Погашенные',
    noDebts: lang === 'tg' ? 'Ҳеҷ қарзе ёфт нашуд' : 'Записей о долгах не найдено',
    noDebtsDesc:
      lang === 'tg'
        ? 'Барои илова кардани қарзи нав тугмаи «+ Қарзи нав»-ро пахш кунед'
        : 'Нажмите «+ Добавить долг», чтобы создать первую запись в долговой книге',
    modalTitleAdd: lang === 'tg' ? 'Сабти қарзи нав' : 'Новая запись о долге',
    customerName: lang === 'tg' ? 'Номи муштарӣ' : 'Имя клиента',
    customerPhone: lang === 'tg' ? 'Рақами телефон' : 'Номер телефона',
    amount: lang === 'tg' ? 'Маблағи қарз (сомонӣ)' : 'Сумма долга (сомони)',
    description:
      lang === 'tg'
        ? 'Тавсиф / Молҳои гирифташуда'
        : 'Описание / Какие товары взял',
    saveBtn: lang === 'tg' ? 'Сабт кардан' : 'Сохранить',
    cancelBtn: lang === 'tg' ? 'Бекор кардан' : 'Отмена',
    payModalTitle: lang === 'tg' ? 'Ворид кардани пардохт' : 'Внесение оплаты по долгу',
    payAmountLabel: lang === 'tg' ? 'Маблағи пардохт (сомонӣ)' : 'Сумма оплаты (сомони)',
    payNoteLabel: lang === 'tg' ? 'Шарҳ / Эзоҳ' : 'Примечание',
    confirmPay: lang === 'tg' ? 'Қабули маблағ' : 'Принять оплату',
    fullPayBtn: lang === 'tg' ? 'Пурра пӯшидан' : 'Погасить полностью',
    partialPayBtn: lang === 'tg' ? 'Пардохт кардан' : 'Внести сумму',
    remaining: lang === 'tg' ? 'Боқимонда' : 'Остаток',
    paid: lang === 'tg' ? 'Пардохт шуд' : 'Оплачено',
    statusActive: lang === 'tg' ? 'Қарздор' : 'Активен',
    statusPaid: lang === 'tg' ? 'Пӯшида шуд' : 'Погашен',
    historyTitle: lang === 'tg' ? 'Таърихи пардохтҳо' : 'История платежей',
  };

  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paid'>('all');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingDebt, setPayingDebt] = useState<DebtRecord | null>(null);
  const [historyDebt, setHistoryDebt] = useState<DebtRecord | null>(null);

  // Form states for Add
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [descInput, setDescInput] = useState('');

  // Form states for Payment
  const [payAmountInput, setPayAmountInput] = useState('');
  const [payMethodInput, setPayMethodInput] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [payNoteInput, setPayNoteInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadDebts = async () => {
    try {
      setLoading(true);
      const data = await getDebts();

      // Автоматическая миграция долгов из localStorage при первом открытии (если база пустая)
      const legacyRaw = localStorage.getItem(STORAGE_KEY);
      if (legacyRaw && data.length === 0) {
        try {
          const localItems: DebtRecord[] = JSON.parse(legacyRaw);
          if (Array.isArray(localItems) && localItems.length > 0) {
            for (const item of localItems) {
              await createDebt({
                customerName: item.customerName,
                phone: item.phone,
                totalAmount: item.totalAmount,
                description: item.description,
              });
            }
            localStorage.removeItem(STORAGE_KEY);
            const reloaded = await getDebts();
            setDebts(reloaded);
            return;
          }
        } catch {
          // ignore parsing error
        }
      }

      setDebts(data);
    } catch (err) {
      console.error('Failed to load debts:', err);
      toast.error('Не удалось загрузить долги с сервера');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebts();
  }, []);

  // WhatsApp reminder
  const sendWhatsAppReminder = (debt: DebtRecord) => {
    if (!debt.phone) {
      toast.error(lang === 'tg' ? 'Рақами телефон нест' : 'Номер телефона не указан');
      return;
    }
    const remaining = debt.totalAmount - debt.paidAmount;
    const currency = lang === 'tg' ? 'сомонӣ' : lang === 'ru' ? 'сомони' : 'TJS';
    const message =
      lang === 'tg'
        ? `Салом, ${debt.customerName}!

Шумо дар мағозаи Excel Pro қарзи ${formatMoney(remaining)} ${currency} доред.

Лутфан, барвақт пардохт намоед, таваккал.

Ташаккур!`
        : lang === 'ru'
        ? `Здравствуйте, ${debt.customerName}!

У вас имеется задолженность в магазине Excel Pro на сумму ${formatMoney(remaining)} ${currency}.

Пожалуйста, погасите долг в удобное время.

Спасибо!`
        : `Assalamu alaikum, ${debt.customerName}!

You have an outstanding debt of ${formatMoney(remaining)} ${currency} at Excel Pro.

Please make payment at your earliest convenience.

Thank you!`;
    let phone = debt.phone.replace(/[^0-9]/g, '');
    if (phone.length === 9) {
      phone = '992' + phone;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(lang === 'tg' ? 'Пайёми WhatsApp кушода шуд' : lang === 'ru' ? 'Окно WhatsApp открыто' : 'WhatsApp opened');
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalDebtAmount = 0;
    let totalPaid = 0;
    let activeCount = 0;

    debts.forEach((d) => {
      totalPaid += d.paidAmount;
      if (d.status === 'active') {
        totalDebtAmount += d.totalAmount - d.paidAmount;
        activeCount += 1;
      }
    });

    return { totalDebtAmount, totalPaid, activeCount };
  }, [debts]);

  // Filtered List
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.customerName.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q);

      const matchStatus =
        statusFilter === 'all' || d.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [debts, searchQuery, statusFilter]);

  // Handle Add Debt
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = nameInput.trim();
    const amount = parseFloat(amountInput);

    if (!name) {
      toast.error('Имя клиента обязательно');
      return;
    }
    if (!amount || amount <= 0) {
      toast.error('Введите корректную сумму долга');
      return;
    }

    try {
      setSubmitting(true);
      const created = await createDebt({
        customerName: name,
        phone: phoneInput.trim() || undefined,
        totalAmount: amount,
        description: descInput.trim() || undefined,
      });

      setDebts((prev) => [created, ...prev]);
      toast.success('Долг успешно сохранен в базе данных');

      setNameInput('');
      setPhoneInput('');
      setAmountInput('');
      setDescInput('');
      setIsAddOpen(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Не удалось сохранить долг';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Partial or Full Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;

    const amount = parseFloat(payAmountInput);
    const remaining = payingDebt.totalAmount - payingDebt.paidAmount;

    if (!amount || amount <= 0) {
      toast.error('Введите корректную сумму оплаты');
      return;
    }

    if (amount > remaining) {
      toast.error(`Сумма оплаты не может превышать остаток (${formatMoney(remaining)})`);
      return;
    }

    try {
      setSubmitting(true);
      const updated = await addDebtPayment(payingDebt.id, {
        amount,
        paymentMethod: payMethodInput,
        note: payNoteInput.trim() || undefined,
      });

      setDebts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      const isFullyPaid = updated.status === 'paid';
      toast.success(isFullyPaid ? 'Долг полностью погашен!' : 'Оплата принята');

      setPayAmountInput('');
      setPayMethodInput('cash');
      setPayNoteInput('');
      setPayingDebt(null);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Ошибка внесения оплаты';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Full Repay
  const handleQuickFullRepay = async (debt: DebtRecord) => {
    const remaining = debt.totalAmount - debt.paidAmount;
    if (remaining <= 0) return;

    if (!window.confirm(`Погасить долг клиента ${debt.customerName} на сумму ${formatMoney(remaining)}?`)) {
      return;
    }

    try {
      const updated = await addDebtPayment(debt.id, {
        amount: remaining,
        note: 'Полное погашение',
      });
      setDebts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast.success('Долг полностью закрыт!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Ошибка при погашении';
      toast.error(msg);
    }
  };

  // Delete Debt
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Удалить запись долга клиента "${name}"?`)) {
      try {
        await deleteDebt(id);
        setDebts((prev) => prev.filter((d) => d.id !== id));
        toast.success('Запись удалена из базы данных');
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Не удалось удалить запись';
        toast.error(msg);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-3">
      {/* Title & Stats Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-lg p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1e293b] dark:text-slate-100 leading-tight">
                {texts.title}
              </h1>
              <p className="text-xs text-[#64748b] dark:text-slate-400">
                {texts.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#107c41] hover:bg-[#0d6936] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{texts.addBtn}</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 block">
              {texts.totalDebt}
            </span>
            <span className="text-xl font-black text-rose-700 dark:text-rose-300">
              {formatMoney(stats.totalDebtAmount)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
              {texts.debtorsCount}
            </span>
            <span className="text-xl font-black text-amber-800 dark:text-amber-300">
              {stats.activeCount}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
              {texts.totalRepaid}
            </span>
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {formatMoney(stats.totalPaid)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-lg p-2.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={texts.searchPlaceholder}
            className="w-full h-8 pl-8 pr-3 rounded bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-xs text-[#1e293b] dark:text-slate-100 focus:outline-none focus:border-[#107c41]"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 w-full sm:w-auto">
          {(['all', 'active', 'paid'] as const).map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setStatusFilter(filterKey)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === filterKey
                  ? 'bg-[#107c41] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {filterKey === 'all'
                ? texts.filterAll
                : filterKey === 'active'
                ? texts.filterActive
                : texts.filterPaid}
            </button>
          ))}
        </div>
      </div>

      {/* Debts List */}
      <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-lg shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-4">
            <Loader2 className="w-8 h-8 text-[#107c41] animate-spin mb-2" />
            <p className="text-xs text-slate-400">Загрузка данных с сервера...</p>
          </div>
        ) : filteredDebts.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-4">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {texts.noDebts}
            </p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {texts.noDebtsDesc}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredDebts.map((item) => {
              const remaining = item.totalAmount - item.paidAmount;
              const percent = Math.min(100, Math.round((item.paidAmount / item.totalAmount) * 100));

              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  {/* Left: Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center text-xs font-bold">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.customerName}
                      </h3>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          item.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {item.status === 'paid' ? texts.statusPaid : texts.statusActive}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      {item.phone && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3" />
                          {item.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded border border-slate-100 dark:border-slate-800 font-sans">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Middle: Amount & Progress */}
                  <div className="w-full md:w-56 flex flex-col justify-center">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 dark:text-slate-400">
                        {texts.remaining}:
                      </span>
                      <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                        {formatMoney(remaining)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>{texts.paid}: {formatMoney(item.paidAmount)}</span>
                      <span>Всего: {formatMoney(item.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                    {item.status === 'active' && (
                      <>
                        {item.phone && (
                          <button
                            type="button"
                            onClick={() => sendWhatsAppReminder(item)}
                            className="p-1.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-[#065f46] dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
                            title={lang === 'tg' ? 'Тасдиқи WhatsApp' : 'Напомнить в WhatsApp'}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setPayingDebt(item);
                            setPayAmountInput(String(remaining));
                          }}
                          className="px-2.5 py-1.5 bg-[#107c41] hover:bg-[#0d6936] text-white rounded text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-2xs"
                          title={texts.partialPayBtn}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{texts.partialPayBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickFullRepay(item)}
                          className="px-2 py-1.5 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-[#107c41] dark:text-emerald-300 rounded text-xs font-semibold cursor-pointer"
                          title={texts.fullPayBtn}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {item.payments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setHistoryDebt(item)}
                        className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                        title={texts.historyTitle}
                      >
                        <History className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.customerName)}
                      className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Add New Debt */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-rose-600" />
                {texts.modalTitleAdd}
              </h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {texts.customerName} *
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Алишер, Рустам, Дилшод..."
                  className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#107c41]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {texts.customerPhone}
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+992 90 000 0000"
                  className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#107c41]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {texts.amount} *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="150"
                  className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-[#107c41]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {texts.description}
                </label>
                <textarea
                  rows={2}
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  placeholder="Тетради, ручки, альбом..."
                  className="w-full p-2.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#107c41]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium cursor-pointer"
                >
                  {texts.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#107c41] hover:bg-[#0d6936] text-white rounded font-bold cursor-pointer"
                >
                  {texts.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Make Payment */}
      {payingDebt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                {texts.payModalTitle}
              </h3>
              <button
                onClick={() => setPayingDebt(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-3 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {payingDebt.customerName}
              </p>
              <div className="flex justify-between mt-1 text-slate-500">
                <span>{texts.remaining}:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {formatMoney(payingDebt.totalAmount - payingDebt.paidAmount)}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {texts.payAmountLabel} *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-[#107c41]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'tg' ? 'Тарзи пардохт' : 'Способ оплаты'}
                </label>
                <select
                  value={payMethodInput}
                  onChange={(e) => setPayMethodInput(e.target.value as 'cash' | 'card' | 'transfer')}
                  className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#107c41]"
                >
                  <option value="cash">{lang === 'tg' ? 'Нақд' : 'Наличные'}</option>
                  <option value="card">{lang === 'tg' ? 'Корт' : 'Карта'}</option>
                  <option value="transfer">{lang === 'tg' ? 'Интиқол' : 'Перевод'}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {texts.payNoteLabel}
                </label>
                <input
                  type="text"
                  value={payNoteInput}
                  onChange={(e) => setPayNoteInput(e.target.value)}
                  placeholder="Частичная оплата..."
                  className="w-full h-9 px-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#107c41]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPayingDebt(null)}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium cursor-pointer"
                >
                  {texts.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#107c41] hover:bg-[#0d6936] text-white rounded font-bold cursor-pointer"
                >
                  {texts.confirmPay}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Payments History */}
      {historyDebt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-xl p-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                {texts.historyTitle} — {historyDebt.customerName}
              </h3>
              <button
                onClick={() => setHistoryDebt(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 max-h-60 overflow-y-auto space-y-2 text-xs">
              {historyDebt.payments.map((p) => (
                <div
                  key={p.id}
                  className="p-2.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatMoney(p.amount)}
                    </span>
                    {p.note && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{p.note}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {formatDateTime(p.date)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-right">
              <button
                onClick={() => setHistoryDebt(null)}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded font-medium text-xs cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebtsPage;
