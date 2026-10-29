import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ScanBarcode,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  RotateCcw,
  Package,
  DollarSign,
  AlertCircle,
  X,
  CreditCard,
  BookOpen,
  Banknote,
  User,
  Phone,
  Check,
  CloudOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getProducts, getProductByBarcode } from '../api/products';
import { getDebts } from '../api/debts';
import { ordersApi, customersApi } from '../api/erp';
import { enqueueSale, flushOfflineQueue, offlineQueueCount } from '../utils/offlineQueue';
import type { Customer } from '../types/erp';
import { formatMoney, formatDateTime } from '../utils/formatters';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PRODUCT_CATEGORIES, getCategoryMeta } from '../utils/categories';
import type { Product, DebtRecord } from '../types';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CompletedSaleReceipt {
  receiptId: string;
  items: CartItem[];
  totalAmount: number;
  cashGiven: number;
  changeAmount: number;
  date: string;
  cashierName: string;
  paymentMethod: 'cash' | 'card' | 'debt';
  debtorName?: string;
  customerName?: string;
  discount?: number;
  isOffline?: boolean;
}

export const PosPage = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();

  // Translations
  const texts = {
    title: lang === 'tg' ? 'Хазина / Касса (POS)' : 'Касса / POS терминал',
    subtitle:
      lang === 'tg'
        ? 'Фурӯши фаврӣ бо сканери штрихкод ва чоп кардани чек'
        : 'Быстрая продажа со сканером штрихкода и печатью чека',
    scanPlaceholder:
      lang === 'tg'
        ? 'Штрихкодро пик кунед ё нависед... (F2)'
        : 'Пикните штрихкод или введите... (F2)',
    searchPlaceholder:
      lang === 'tg' ? 'Ҷустуҷӯ аз рӯи ном...' : 'Поиск по названию...',
    allProducts: lang === 'tg' ? 'Ҳамаи молҳо' : 'Каталог товаров',
    cartTitle: lang === 'tg' ? 'Чеки харидор' : 'Чек покупателя',
    cartEmpty: lang === 'tg' ? 'Чек холӣ аст' : 'Чек пуст',
    cartEmptyDesc:
      lang === 'tg'
        ? 'Молҳоро аз рӯйхат интихоб кунед ё штрихкодро пик кунед'
        : 'Выберите товары из каталога или отсканируйте штрихкод',
    totalPayable: lang === 'tg' ? 'Ҳамагӣ ба пардохт' : 'Итого к оплате',
    itemsCount: lang === 'tg' ? 'Шумораи молҳо' : 'Количество позиций',
    paymentMethod: lang === 'tg' ? 'Намуди пардохт' : 'Способ оплаты',
    methodCash: lang === 'tg' ? 'Нақдӣ' : 'Наличные',
    methodCard: lang === 'tg' ? 'Корт / QR' : 'Карта / QR',
    methodDebt: lang === 'tg' ? 'Ба насия (Қарз)' : 'В долг',
    debtorNameLabel: lang === 'tg' ? 'Номи харидор (қарздор)' : 'Имя покупателя (должника)',
    debtorPhoneLabel: lang === 'tg' ? 'Телефони харидор' : 'Телефон покупателя',
    selectOrTypeDebtor: lang === 'tg' ? 'Интихоб кунед ё нависед...' : 'Выберите или введите имя...',
    filterAll: lang === 'tg' ? 'Ҳама' : 'Все',
    filterInStock: lang === 'tg' ? 'Дар анбор' : 'В наличии',
    filterLowStock: lang === 'tg' ? 'Кам мондааст (≤5)' : 'Мало (≤5)',
    filterTop: lang === 'tg' ? 'Топ фурӯш' : 'Хиты продаж',
    cashReceived: lang === 'tg' ? 'Маблағи гирифташуда' : 'Получено от клиента',
    exactAmount: lang === 'tg' ? 'Бе бақия (Ровно)' : 'Без сдачи (Ровно)',
    change: lang === 'tg' ? 'Бақия (Сдача)' : 'Сдача клиенту',
    notEnoughCash: lang === 'tg' ? 'Маблағ нокифоя аст' : 'Сумма меньше чека',
    completeSale: lang === 'tg' ? 'Ба расмият даровардани фурӯш' : 'Оформить продажу',
    clearCart: lang === 'tg' ? 'Тоза кардани чек (Esc)' : 'Очистить чек (Esc)',
    stockLeft: lang === 'tg' ? 'Боқимонда' : 'Остаток',
    outOfStock: lang === 'tg' ? 'Тамом шуд' : 'Нет в наличии',
    receiptTitle: lang === 'tg' ? 'Чеки фурӯш' : 'Товарный чек',
    printBtn: lang === 'tg' ? 'Чоп кардани чек' : 'Печать чека',
    closeBtn: lang === 'tg' ? 'Пӯшидан' : 'Закрыть',
    cashier: lang === 'tg' ? 'Хазинадор' : 'Кассир',
    price: lang === 'tg' ? 'Нарх' : 'Цена',
    sum: lang === 'tg' ? 'Маблағ' : 'Сумма',
  };

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogTab, setCatalogTab] = useState<'all' | 'in_stock' | 'low_stock' | 'top'>('all');
  const [posCategory, setPosCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'debt'>('cash');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<CompletedSaleReceipt | null>(null);

  // Debts state for POS
  const [debtorsList, setDebtorsList] = useState<DebtRecord[]>([]);
  const [debtorName, setDebtorName] = useState('');
  const [debtorPhone, setDebtorPhone] = useState('');

  // CRM / discounts / offline
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [discountPercent, setDiscountPercent] = useState('');
  const [pointsSpent, setPointsSpent] = useState('');
  const [offlineCount, setOfflineCount] = useState(offlineQueueCount());

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === Number(customerId)) || null,
    [customers, customerId]
  );

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Load debts list for autocomplete
  const loadDebtors = async () => {
    try {
      const data = await getDebts();
      setDebtorsList(data || []);
    } catch {
      // Non-blocking
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await customersApi.list({ limit: 500 });
      setCustomers(res.results || []);
    } catch {
      // Non-blocking
    }
  };

  const syncOffline = async () => {
    if (offlineQueueCount() === 0) return;
    try {
      const result = await flushOfflineQueue();
      setOfflineCount(offlineQueueCount());
      if (result.succeeded > 0) {
        toast.success(`Синхронизировано офлайн-продаж: ${result.succeeded}`);
        loadCatalog();
      }
    } catch {
      // Will retry on next online event
    }
  };

  // Focus barcode input on mount and keep it ready
  useEffect(() => {
    barcodeInputRef.current?.focus();
    loadDebtors();
    loadCustomers();
    syncOffline();
    const onOnline = () => syncOffline();
    const onQueue = () => setOfflineCount(offlineQueueCount());
    window.addEventListener('online', onOnline);
    window.addEventListener('offline-queue-changed', onQueue);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline-queue-changed', onQueue);
    };
  }, []);

  // Hotkeys: F2 to focus scanner, Escape to clear cart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      } else if (e.key === 'Escape' && !completedReceipt) {
        if (cart.length > 0) {
          clearCart();
          toast('Чек очищен', { icon: '🗑️' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, completedReceipt]);

  // Beep sound on successful scan
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1400, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch {
      // Audio not permitted or supported
    }
  };

  // Load products catalog
  const loadCatalog = async () => {
    setLoading(true);
    try {
      const res = await getProducts();
      setProducts(res.results || []);
    } catch (err) {
      console.error('Error loading products for POS:', err);
      toast.error('Ошибка загрузки каталога товаров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Add product to cart
  const addToCart = (product: Product) => {
    const remaining = Number(product.remaining_quantity ?? (product.quantity_received - product.quantity_sold));
    if (remaining <= 0) {
      toast.error(`"${product.name}" ${texts.outOfStock}`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= remaining) {
          toast.error(`Достигнут лимит остатка на складе (${remaining} шт)`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    playScanBeep();
    barcodeInputRef.current?.focus();
  };

  // Scan or Enter in barcode input
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // 1. Try finding in loaded products first
    const localFound = products.find(
      (p) => p.barcode?.toLowerCase() === code.toLowerCase()
    );

    if (localFound) {
      addToCart(localFound);
      setBarcodeInput('');
      return;
    }

    // 2. Query backend if not found locally
    try {
      const res = await getProductByBarcode(code);
      const backendFound = (res.results || [])[0];
      if (backendFound) {
        addToCart(backendFound);
        // Also update local list if missing
        setProducts((prev) => (prev.some((p) => p.id === backendFound.id) ? prev : [backendFound, ...prev]));
      } else {
        toast.error(`Товар со штрихкодом "${code}" не найден`);
      }
    } catch {
      toast.error(`Ошибка при поиске штрихкода "${code}"`);
    } finally {
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    }
  };

  // Update item quantity in cart
  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const remaining = Number(
              item.product.remaining_quantity ??
                (item.product.quantity_received - item.product.quantity_sold)
            );
            const newQty = item.quantity + delta;
            if (newQty > remaining) {
              toast.error(`Максимум на складе: ${remaining} шт`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCashGiven('');
    barcodeInputRef.current?.focus();
  };

  // Calculations
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price = Number(item.product.selling_price) || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const effectiveDiscountPercent = useMemo(() => {
    if (discountPercent !== '') return Math.max(0, Math.min(100, parseFloat(discountPercent) || 0));
    return selectedCustomer ? Number(selectedCustomer.discountPercent) || 0 : 0;
  }, [discountPercent, selectedCustomer]);

  const discountValue = useMemo(
    () => Math.min(totalAmount, (totalAmount * effectiveDiscountPercent) / 100),
    [totalAmount, effectiveDiscountPercent]
  );

  const maxPoints = selectedCustomer?.bonusPoints || 0;
  const pointsValue = Math.min(Number(pointsSpent) || 0, maxPoints) * 0.01;
  const payableAmount = Math.max(0, totalAmount - discountValue - pointsValue);

  const cashGivenNum = parseFloat(cashGiven) || 0;
  const changeAmount = cashGivenNum >= payableAmount ? cashGivenNum - payableAmount : 0;

  // Filter products in catalog
  const filteredProducts = useMemo(() => {
    let list = [...products];
    const q = catalogSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    if (catalogTab === 'in_stock') {
      list = list.filter((p) => {
        const rem = Number(p.remaining_quantity ?? (p.quantity_received - p.quantity_sold));
        return rem > 0;
      });
    } else if (catalogTab === 'low_stock') {
      list = list.filter((p) => {
        const rem = Number(p.remaining_quantity ?? (p.quantity_received - p.quantity_sold));
        return rem > 0 && rem <= Number(p.min_stock ?? 5);
      });
    } else if (catalogTab === 'top') {
      list = list
        .filter((p) => (p.sales_count || 0) > 0)
        .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
    }

    if (posCategory !== 'all') {
      list = list.filter(
        (p) => (p.category || 'stationery').toLowerCase() === posCategory.toLowerCase()
      );
    }

    return list;
  }, [products, catalogSearch, catalogTab, posCategory]);

  // Quick cash buttons helper
  const handleQuickCash = (amount: number) => {
    setCashGiven(String(amount));
  };

  // Complete checkout
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Корзина пуста');
      return;
    }

    if (paymentMethod === 'cash' && cashGiven && cashGivenNum < payableAmount) {
      toast.error('Внесённая сумма меньше стоимости покупки');
      return;
    }

    if (paymentMethod === 'debt' && !customerId && !debtorName.trim()) {
      toast.error('Выберите клиента или укажите имя покупателя для записи в долг');
      return;
    }

    setIsSubmitting(true);
    const clientTransactionId = `pos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const itemsSummary = cart.map((i) => `${i.product.name} (x${i.quantity})`).join(', ');
    const checkoutPayload = {
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: Number(item.product.selling_price) || 0,
      })),
      paymentMethod,
      cashGiven: paymentMethod === 'cash' ? cashGivenNum || payableAmount : paymentMethod === 'debt' ? 0 : undefined,
      customerId: customerId || null,
      debtorName: paymentMethod === 'debt' ? debtorName.trim() || undefined : undefined,
      discountPercent: discountPercent !== '' ? parseFloat(discountPercent) || 0 : undefined,
      pointsSpent: Number(pointsSpent) || 0,
      clientTransactionId,
    };

    try {
      const result = await ordersApi.checkout(checkoutPayload);
      const order = result.order;
      const receiptSnapshot: CompletedSaleReceipt = {
        receiptId: order.orderNumber,
        items: [...cart],
        totalAmount: Number(order.totalAmount),
        cashGiven: Number(order.cashGiven ?? 0),
        changeAmount: Number(order.changeAmount ?? 0),
        date: order.createdAt,
        cashierName: order.cashierName || user?.username || 'Кассир',
        paymentMethod,
        debtorName: order.debtorName || (paymentMethod === 'debt' ? debtorName.trim() : undefined),
        customerName: order.customerName || selectedCustomer?.name,
        discount: Number(order.discountAmount) || 0,
      };

      setCompletedReceipt(receiptSnapshot);
      clearCart();
      setDebtorName('');
      setDebtorPhone('');
      setCustomerId('');
      setDiscountPercent('');
      setPointsSpent('');
      setPaymentMethod('cash');
      setCashGiven('');
      loadCatalog();
      loadDebtors();
      if (paymentMethod === 'debt') {
        toast.success(`Продажа ${order.orderNumber} записана в долг`);
      } else {
        toast.success(`Продажа ${order.orderNumber} завершена`);
      }
    } catch (err) {
      const isNetworkError =
        !navigator.onLine ||
        (err as { code?: string }).code === 'ERR_NETWORK' ||
        (err as { code?: string }).code === 'ECONNABORTED';

      if (isNetworkError) {
        enqueueSale({ ...checkoutPayload, isOffline: true });
        const receiptSnapshot: CompletedSaleReceipt = {
          receiptId: `OFF-${Date.now().toString().slice(-6)}`,
          items: [...cart],
          totalAmount: payableAmount,
          cashGiven: paymentMethod === 'cash' ? cashGivenNum || payableAmount : payableAmount,
          changeAmount: paymentMethod === 'cash' ? changeAmount : 0,
          date: new Date().toISOString(),
          cashierName: user?.username || 'Кассир',
          paymentMethod,
          debtorName: paymentMethod === 'debt' ? debtorName.trim() : undefined,
          customerName: selectedCustomer?.name,
          discount: discountValue,
          isOffline: true,
        };
        setCompletedReceipt(receiptSnapshot);
        setOfflineCount(offlineQueueCount());
        clearCart();
        setDebtorName('');
        setDebtorPhone('');
        setCustomerId('');
        setDiscountPercent('');
        setPointsSpent('');
        setPaymentMethod('cash');
        setCashGiven('');
        toast.success('Нет сети — продажа сохранена офлайн и отправится при подключении');
      } else {
        console.error('Checkout error:', err);
        toast.error(err instanceof Error ? err.message : 'Ошибка при оформлении продажи. Проверьте остатки.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print receipt function
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col space-y-3">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-lg p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#107c41] text-white flex items-center justify-center font-bold shadow-xs">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#1e293b] dark:text-slate-100 leading-tight">
                {texts.title}
              </h1>
              <p className="text-xs text-[#64748b] dark:text-slate-400">
                {texts.subtitle}
              </p>
            </div>
            {offlineCount > 0 && (
              <button
                type="button"
                onClick={syncOffline}
                className="ml-1 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold cursor-pointer hover:bg-amber-200"
                title="Синхронизировать офлайн-продажи"
              >
                <CloudOff className="w-3 h-3" /> {offlineCount} офлайн
              </button>
            )}
          </div>

          {/* Barcode Scanner Bar */}
          <form
            onSubmit={handleBarcodeSubmit}
            className="flex-1 max-w-md sm:ml-4"
          >
            <div className="relative">
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder={texts.scanPlaceholder}
                className="w-full h-10 pl-9 pr-12 rounded-lg bg-emerald-50/50 dark:bg-slate-800 border-2 border-[#107c41] text-xs font-semibold text-[#1e293b] dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#107c41]/30 transition-all shadow-inner"
              />
              <ScanBarcode className="w-4 h-4 text-[#107c41] absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#107c41] hover:bg-[#0d6936] text-white rounded text-xs font-medium transition-colors cursor-pointer shadow-2xs"
              >
                + Enter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Grid: Catalog (Left) + Cart/Checkout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left: Product Catalog (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-lg p-3 shadow-2xs flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#107c41]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-slate-300">
                {texts.allProducts} ({filteredProducts.length})
              </h2>
            </div>
            <div className="relative w-48 sm:w-60">
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder={texts.searchPlaceholder}
                className="w-full h-8 pl-7 pr-3 rounded bg-[#f8fafc] dark:bg-slate-800 border border-[#cbd5e1] dark:border-slate-700 text-xs text-[#1e293b] dark:text-slate-100 focus:outline-none focus:border-[#107c41]"
              />
              <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Catalog Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setCatalogTab('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                catalogTab === 'all'
                  ? 'bg-[#107c41] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {texts.filterAll}
            </button>
            <button
              type="button"
              onClick={() => setCatalogTab('in_stock')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                catalogTab === 'in_stock'
                  ? 'bg-[#107c41] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {texts.filterInStock}
            </button>
            <button
              type="button"
              onClick={() => setCatalogTab('low_stock')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                catalogTab === 'low_stock'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              ⚠️ {texts.filterLowStock}
            </button>
            <button
              type="button"
              onClick={() => setCatalogTab('top')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                catalogTab === 'top'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              🔥 {texts.filterTop}
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none border-t border-slate-100 dark:border-slate-800 pt-2 text-[11px]">
            <button
              type="button"
              onClick={() => setPosCategory('all')}
              className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                posCategory === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>📦</span>
              <span>{lang === 'tg' ? 'Ҳама' : 'Все'}</span>
            </button>
            {PRODUCT_CATEGORIES.map((cat) => {
              const isSelected = posCategory === cat.id;
              const label = lang === 'tg' ? cat.labelTg : lang === 'en' ? cat.labelEn : cat.labelRu;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPosCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#107c41] text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-8 text-xs text-[#64748b]">
              Загрузка каталога...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#64748b]">
              <AlertCircle className="w-8 h-8 text-[#94a3b8] mb-2" />
              <p className="text-xs font-medium">Товары не найдены</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const remaining = Number(
                  p.remaining_quantity ?? (p.quantity_received - p.quantity_sold)
                );
                const isOut = remaining <= 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isOut}
                    onClick={() => addToCart(p)}
                    className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                      isOut
                        ? 'opacity-50 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 cursor-not-allowed'
                        : 'border-[#e2e8f0] dark:border-slate-800 hover:border-[#107c41] bg-white dark:bg-slate-800/60 hover:shadow-sm hover:scale-[1.01]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] text-[#64748b] dark:text-slate-400 font-mono truncate">
                          {p.barcode || '—'}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            isOut
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                              : remaining <= 3
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {remaining} шт
                        </span>
                      </div>
                      <div className="mb-1">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 font-medium inline-flex items-center gap-1">
                          <span>{getCategoryMeta(p.category, lang).icon}</span>
                          <span>{getCategoryMeta(p.category, lang).label}</span>
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#1e293b] dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-[#107c41] dark:group-hover:text-emerald-400">
                        {p.name}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#107c41] dark:text-emerald-400">
                        {formatMoney(p.selling_price)}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-[#107c41] dark:text-emerald-300 font-bold">
                        +
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart & Payment Summary (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-800 rounded-lg p-3 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-[#e2e8f0] dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#107c41]" />
                <h2 className="text-xs font-bold text-[#1e293b] dark:text-slate-100 uppercase tracking-wide">
                  {texts.cartTitle}
                </h2>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#107c41] text-white">
                  {totalItemsCount}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[11px] text-[#dc2626] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  {texts.clearCart}
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-[#64748b]">
                <ShoppingCart className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2 stroke-[1.5]" />
                <p className="text-xs font-semibold text-[#1e293b] dark:text-slate-200">
                  {texts.cartEmpty}
                </p>
                <p className="text-[11px] text-[#94a3b8] max-w-[200px] mt-1">
                  {texts.cartEmptyDesc}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {cart.map((item) => {
                  const lineTotal =
                    (Number(item.product.selling_price) || 0) * item.quantity;

                  return (
                    <div
                      key={item.product.id}
                      className="p-2 rounded-lg bg-[#f8fafc] dark:bg-slate-800/80 border border-[#e2e8f0] dark:border-slate-700/60 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1e293b] dark:text-slate-100 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] text-[#64748b] dark:text-slate-400">
                          {formatMoney(item.product.selling_price)} × {item.quantity} шт
                        </p>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-[#cbd5e1] dark:border-slate-700 rounded px-1 py-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 flex items-center justify-center text-[#64748b] hover:text-[#dc2626] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-[#1e293b] dark:text-slate-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 flex items-center justify-center text-[#64748b] hover:text-[#107c41] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <p className="text-xs font-bold text-[#107c41] dark:text-emerald-400">
                          {formatMoney(lineTotal)}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer inline-flex items-center gap-0.5 mt-0.5"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Calculation Section */}
          <div className="mt-4 pt-3 border-t border-[#e2e8f0] dark:border-slate-800 space-y-3">
            {/* Total Row */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <span className="text-xs font-semibold text-[#1e293b] dark:text-slate-200">
                {texts.totalPayable}:
              </span>
              <span className="text-lg font-black text-[#107c41] dark:text-emerald-400">
                {formatMoney(payableAmount)}
              </span>
            </div>

            {(discountValue > 0 || pointsValue > 0) && (
              <div className="flex items-center justify-between px-1 text-[11px] text-[#64748b] dark:text-slate-400">
                <span>Сумма {formatMoney(totalAmount)} · скидка {formatMoney(discountValue)} · бонусы {formatMoney(pointsValue)}</span>
              </div>
            )}

            {/* Customer, discount and loyalty */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-[#e2e8f0] dark:border-slate-700 space-y-2">
              <label className="block text-[11px] font-semibold text-[#475569] dark:text-slate-300">
                Клиент, скидка и бонусы
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <select
                  value={customerId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomerId(value ? Number(value) : '');
                    setPointsSpent('');
                    if (value) {
                      const customer = customers.find((c) => c.id === Number(value));
                      setDebtorName(customer?.name || '');
                      setDebtorPhone(customer?.phone || '');
                    }
                  }}
                  className="h-8 px-2 rounded border border-[#cbd5e1] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#1e293b] dark:text-slate-100 focus:outline-none focus:border-[#107c41]"
                >
                  <option value="">Без клиента</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}{customer.phone ? ` · ${customer.phone}` : ''}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    placeholder={selectedCustomer ? `Скидка ${selectedCustomer.discountPercent}%` : 'Скидка %'}
                    className="w-full h-8 px-2 pr-6 rounded border border-[#cbd5e1] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#1e293b] dark:text-slate-100 focus:outline-none focus:border-[#107c41]"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={maxPoints}
                    step="1"
                    value={pointsSpent}
                    onChange={(e) => setPointsSpent(e.target.value)}
                    placeholder={`Бонусы (до ${maxPoints})`}
                    disabled={!selectedCustomer}
                    className="w-full h-8 px-2 pr-6 rounded border border-[#cbd5e1] dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-[#1e293b] dark:text-slate-100 focus:outline-none focus:border-[#107c41] disabled:opacity-60"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">б.</span>
                </div>
              </div>
              {selectedCustomer && (
                <p className="text-[10px] text-[#64748b] dark:text-slate-400">
                  {selectedCustomer.name}: баланс {selectedCustomer.bonusPoints} бонусов, долг {formatMoney(selectedCustomer.totalDebt)}
                </p>
              )}
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-[#475569] dark:text-slate-300 mb-1.5">
                {texts.paymentMethod}:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-1 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-[#107c41] text-[#107c41] dark:text-emerald-300 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>{texts.methodCash}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-1 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-[#107c41] text-[#107c41] dark:text-emerald-300 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{texts.methodCard}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('debt')}
                  className={`py-2 px-1 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    paymentMethod === 'debt'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-700 dark:text-amber-300 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{texts.methodDebt}</span>
                </button>
              </div>
            </div>

            {/* 1. Cash Option Inputs */}
            {paymentMethod === 'cash' && (
              <div>
                <label className="block text-[11px] font-semibold text-[#475569] dark:text-slate-300 mb-1">
                  {texts.cashReceived} (сомони):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    placeholder={String(payableAmount || '0')}
                    className="w-full h-9 pl-8 pr-3 rounded border border-[#cbd5e1] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-[#1e293b] dark:text-slate-100 focus:outline-none focus:border-[#107c41]"
                  />
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Quick Cash Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[10, 20, 50, 100, 200, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickCash(val)}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-bold text-[#334155] dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCashGiven(String(payableAmount))}
                    className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 hover:bg-emerald-200 text-[10px] font-bold text-[#107c41] dark:text-emerald-300 transition-colors cursor-pointer"
                  >
                    {texts.exactAmount}
                  </button>
                </div>

                {/* Change Display */}
                {cashGivenNum > 0 && (
                  <div
                    className={`p-2 rounded-lg flex items-center justify-between text-xs font-bold mt-2 ${
                      cashGivenNum >= payableAmount
                        ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400'
                    }`}
                  >
                    <span>
                      {cashGivenNum >= payableAmount ? texts.change : texts.notEnoughCash}:
                    </span>
                    <span className="text-base font-extrabold">
                      {cashGivenNum >= payableAmount
                        ? formatMoney(changeAmount)
                        : formatMoney(payableAmount - cashGivenNum)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 2. Card / QR Option Info */}
            {paymentMethod === 'card' && (
              <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2.5">
                <CreditCard className="w-5 h-5 text-[#107c41] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#107c41] dark:text-emerald-400">
                    {lang === 'tg' ? 'Пардохти ғайринақдӣ' : 'Безналичный расчет'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang === 'tg'
                      ? 'Корт, QR-код (Alif Mobi, DC, Корти Миллӣ). Маблағи дақиқ бе бақия сабт мегардад.'
                      : 'Карта, QR-код (Alif Mobi, DC, Корти Милли). Оплата без сдачи на точную сумму.'}
                  </p>
                </div>
              </div>
            )}

            {/* 3. Debt Option Inputs */}
            {paymentMethod === 'debt' && (
              <div className="p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span>
                    {lang === 'tg' ? 'Ба дафтари қарз сабт мешавад' : 'Запись в долговую книгу (дафтари қарз)'}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {texts.debtorNameLabel} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="pos-debtors-list"
                      value={debtorName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDebtorName(val);
                        const match = debtorsList.find(
                          (d) => d.customerName.toLowerCase() === val.toLowerCase()
                        );
                        if (match && match.phone) setDebtorPhone(match.phone);
                      }}
                      placeholder={texts.selectOrTypeDebtor}
                      className="w-full h-8 pl-8 pr-3 rounded border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <User className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <datalist id="pos-debtors-list">
                      {debtorsList.map((d) => (
                        <option key={d.id} value={d.customerName}>
                          {d.phone ? `${d.customerName} (${d.phone})` : d.customerName}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {texts.debtorPhoneLabel}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={debtorPhone}
                      onChange={(e) => setDebtorPhone(e.target.value)}
                      placeholder="+992 90 000 0000"
                      className="w-full h-8 pl-8 pr-3 rounded border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <Phone className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                  {lang === 'tg'
                    ? `Маблағи ${formatMoney(payableAmount)} ба номи ин муштарӣ дар бахши Қарзҳо сабт мегардад.`
                    : `Сумма ${formatMoney(payableAmount)} будет автоматически сохранена в раздел «Долги».`}
                </p>
              </div>
            )}

            {/* Complete Sale Button */}
            <button
              type="button"
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleCheckout}
              className={`w-full h-11 rounded-lg text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed ${
                paymentMethod === 'debt'
                  ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 dark:disabled:bg-slate-800'
                  : 'bg-[#107c41] hover:bg-[#0d6936] disabled:bg-slate-300 dark:disabled:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Оформление...'
                  : paymentMethod === 'debt'
                  ? (lang === 'tg' ? 'Ба насия сабт кардан' : 'Оформить в долг')
                  : paymentMethod === 'card'
                  ? (lang === 'tg' ? 'Пардохт бо корт / QR' : 'Оплатить картой / QR')
                  : texts.completeSale}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white text-black w-full max-w-sm rounded-lg p-5 shadow-2xl relative font-mono text-xs">
            <button
              onClick={() => setCompletedReceipt(null)}
              className="absolute right-3 top-3 text-slate-500 hover:text-black cursor-pointer print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Printable Receipt Content */}
            <div id="receipt-print-area">
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h3 className="font-bold text-base tracking-wider uppercase text-black">
                  МАКТАБИ МАН
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {texts.receiptTitle} #{completedReceipt.receiptId}
                </p>
                <p className="text-[10px] text-slate-500">
                  {formatDateTime(completedReceipt.date)}
                </p>
                <p className="text-[10px] text-slate-500">
                  {texts.cashier}: {completedReceipt.cashierName}
                </p>
                {completedReceipt.customerName && (
                  <p className="text-[10px] text-slate-500">Клиент: {completedReceipt.customerName}</p>
                )}
                {completedReceipt.isOffline && (
                  <p className="mt-1 inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                    ОФЛАЙН · БУДЕТ ОТПРАВЛЕНО ПОЗЖЕ
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
                {completedReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="flex-1 pr-2">
                      <p className="font-semibold truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {item.quantity} × {formatMoney(item.product.selling_price)}
                      </p>
                    </div>
                    <span className="font-bold">
                      {formatMoney(
                        (Number(item.product.selling_price) || 0) * item.quantity
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-3 space-y-1 text-[11px]">
                {!!completedReceipt.discount && completedReceipt.discount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>СКИДКА:</span>
                    <span>-{formatMoney(completedReceipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-sm">
                  <span>ИТОГО:</span>
                  <span>{formatMoney(completedReceipt.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ОПЛАТА:</span>
                  <span className="font-bold">
                    {completedReceipt.paymentMethod === 'card'
                      ? 'КАРТА / QR'
                      : completedReceipt.paymentMethod === 'debt'
                      ? `В ДОЛГ (${completedReceipt.debtorName})`
                      : 'НАЛИЧНЫЕ'}
                  </span>
                </div>

                {completedReceipt.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>ПОЛУЧЕНО:</span>
                      <span>{formatMoney(completedReceipt.cashGiven)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>СДАЧА:</span>
                      <span>{formatMoney(completedReceipt.changeAmount)}</span>
                    </div>
                  </>
                )}

                {completedReceipt.paymentMethod === 'debt' && (
                  <div className="flex justify-between font-bold text-amber-700">
                    <span>СУММА ДОЛГА:</span>
                    <span>{formatMoney(completedReceipt.totalAmount)}</span>
                  </div>
                )}

                {completedReceipt.paymentMethod === 'card' && (
                  <div className="flex justify-between font-bold text-emerald-700">
                    <span>СТАТУС:</span>
                    <span>ОПЛАЧЕНО (БЕЗНАЛ)</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-4 text-[10px] text-slate-400 border-t border-dashed border-slate-200 mt-3">
                Ташаккур барои харид! / Спасибо за покупку!
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="px-3 py-1.5 bg-[#107c41] text-white rounded text-xs font-semibold flex items-center gap-1.5 hover:bg-[#0d6936] cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{texts.printBtn}</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-medium hover:bg-slate-200 cursor-pointer"
              >
                {texts.closeBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PosPage;
