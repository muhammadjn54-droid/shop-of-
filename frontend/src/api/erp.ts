import api from './api';
import type {
  AiChatResponse,
  AiInsights,
  AppSettings,
  AuditEntry,
  Branch,
  CheckoutPayload,
  CheckoutResult,
  Customer,
  CustomerDetail,
  Expense,
  ExpenseCategory,
  InventoryCount,
  InventoryTransfer,
  Notification,
  OfflineOperation,
  Order,
  Paginated,
  ProductReportRow,
  Purchase,
  ReportSummary,
  Shift,
  SmartStockResponse,
  StockMovement,
  Supplier,
  SyncBootstrap,
  TimeseriesPoint,
} from '../types/erp';

type Query = Record<string, string | number | boolean | undefined | null>;

const clean = (params: Query = {}): Query => {
  const out: Query = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  }
  return out;
};

export const branchesApi = {
  list: async (): Promise<Branch[]> => (await api.get('/api/branches')).data,
  create: async (data: Partial<Branch>) => (await api.post('/api/branches', data)).data as Branch,
  update: async (id: number, data: Partial<Branch>) => (await api.patch(`/api/branches/${id}`, data)).data as Branch,
  remove: async (id: number) => (await api.delete(`/api/branches/${id}`)).data,
};

export const suppliersApi = {
  list: async (params: Query = {}): Promise<Paginated<Supplier>> =>
    (await api.get('/api/suppliers', { params: clean(params) })).data,
  get: async (id: number): Promise<Supplier & Record<string, unknown>> =>
    (await api.get(`/api/suppliers/${id}`)).data,
  create: async (data: Partial<Supplier>) => (await api.post('/api/suppliers', data)).data as Supplier,
  update: async (id: number, data: Partial<Supplier>) => (await api.patch(`/api/suppliers/${id}`, data)).data as Supplier,
  remove: async (id: number) => (await api.delete(`/api/suppliers/${id}`)).data,
  payments: async (id: number) => (await api.get(`/api/suppliers/${id}/payments`)).data,
  pay: async (id: number, data: { amount: number; paymentMethod?: string; note?: string }) =>
    (await api.post(`/api/suppliers/${id}/payments`, data)).data,
};

export const purchasesApi = {
  list: async (params: Query = {}): Promise<Paginated<Purchase>> =>
    (await api.get('/api/purchases', { params: clean(params) })).data,
  get: async (id: number): Promise<Purchase> => (await api.get(`/api/purchases/${id}`)).data,
  create: async (data: Record<string, unknown>): Promise<Purchase> => (await api.post('/api/purchases', data)).data,
  update: async (id: number, data: Record<string, unknown>): Promise<Purchase> =>
    (await api.patch(`/api/purchases/${id}`, data)).data,
  order: async (id: number) => (await api.post(`/api/purchases/${id}/order`)).data,
  receive: async (id: number, items?: Array<{ itemId: number; quantity: number }>) =>
    (await api.post(`/api/purchases/${id}/receive`, { items })).data,
  pay: async (id: number, data: { amount: number; paymentMethod?: string; note?: string }) =>
    (await api.post(`/api/purchases/${id}/payments`, data)).data,
  cancel: async (id: number) => (await api.post(`/api/purchases/${id}/cancel`)).data,
  remove: async (id: number) => (await api.delete(`/api/purchases/${id}`)).data,
};

export const stockApi = {
  movements: async (params: Query = {}): Promise<Paginated<StockMovement>> =>
    (await api.get('/api/stock/movements', { params: clean(params) })).data,
  clearMovements: async () => (await api.delete('/api/stock/movements/clear')).data,
  adjust: async (data: { productId: number; newQuantity?: number; delta?: number; reason: string; type?: string }) =>
    (await api.post('/api/stock/adjust', data)).data,
  batches: async (productId?: number) => (await api.get('/api/stock/batches', { params: clean({ productId }) })).data,
  expiry: async (days = 30) => (await api.get('/api/stock/expiry', { params: { days } })).data,
  serials: async (params: Query = {}) => (await api.get('/api/stock/serials', { params: clean(params) })).data,
  createSerial: async (data: { productId: number; serialNumber: string; note?: string }) =>
    (await api.post('/api/stock/serials', data)).data,
  updateSerial: async (id: number, data: Record<string, unknown>) =>
    (await api.patch(`/api/stock/serials/${id}`, data)).data,
  summary: async () => (await api.get('/api/stock/summary')).data,
  smart: async (params: Query = {}): Promise<SmartStockResponse> =>
    (await api.get('/api/stock/smart', { params: clean(params) })).data,
  smartPurchase: async (data: { supplierId: number; branchId?: number; notes?: string; items: Array<{ productId: number; quantity: number; costPrice?: number }> }) =>
    (await api.post('/api/stock/smart/purchase', data)).data,
  lowStock: async () => (await api.get('/api/stock/low-stock')).data,
};

export const inventoryApi = {
  counts: async (params: Query = {}): Promise<Paginated<InventoryCount>> =>
    (await api.get('/api/inventory/counts', { params: clean(params) })).data,
  count: async (id: number): Promise<InventoryCount> => (await api.get(`/api/inventory/counts/${id}`)).data,
  createCount: async (data: { title: string; notes?: string; branchId?: number; items?: Array<{ productId: number; actualQuantity: number; reason?: string }> }) =>
    (await api.post('/api/inventory/counts', data)).data as InventoryCount,
  updateCountItems: async (id: number, items: Array<{ productId: number; actualQuantity: number; reason?: string }>) =>
    (await api.patch(`/api/inventory/counts/${id}/items`, { items })).data as InventoryCount,
  completeCount: async (id: number) => (await api.post(`/api/inventory/counts/${id}/complete`)).data as InventoryCount,
  transfers: async (params: Query = {}): Promise<Paginated<InventoryTransfer>> =>
    (await api.get('/api/inventory/transfers', { params: clean(params) })).data,
  createTransfer: async (data: { fromBranchId: number; toBranchId: number; notes?: string; items: Array<{ productId: number; quantity: number }> }) =>
    (await api.post('/api/inventory/transfers', data)).data,
  ship: async (id: number) => (await api.post(`/api/inventory/transfers/${id}/ship`)).data,
  receive: async (id: number) => (await api.post(`/api/inventory/transfers/${id}/receive`)).data,
  cancelTransfer: async (id: number) => (await api.post(`/api/inventory/transfers/${id}/cancel`)).data,
};

export const shiftsApi = {
  current: async (): Promise<{ open: boolean; shift: Shift | null }> => (await api.get('/api/shifts/current')).data,
  list: async (params: Query = {}): Promise<Paginated<Shift>> =>
    (await api.get('/api/shifts', { params: clean(params) })).data,
  get: async (id: number): Promise<Shift> => (await api.get(`/api/shifts/${id}`)).data,
  open: async (data: { openingCash: number; branchId?: number; notes?: string }): Promise<Shift> =>
    (await api.post('/api/shifts/open', data)).data,
  movement: async (id: number, data: { amount: number; type: 'cash_in' | 'cash_out'; reason?: string }) =>
    (await api.post(`/api/shifts/${id}/movement`, data)).data as Shift,
  close: async (id: number, data: { closingCash: number; notes?: string }) =>
    (await api.post(`/api/shifts/${id}/close`, data)).data as Shift,
};

export const expensesApi = {
  list: async (params: Query = {}): Promise<Paginated<Expense> & { totalAmount: number; byCategory: Record<string, number>; byMethod: Record<string, number> }> =>
    (await api.get('/api/expenses', { params: clean(params) })).data,
  summary: async (params: Query = {}) => (await api.get('/api/expenses/summary', { params: clean(params) })).data,
  categories: async (): Promise<ExpenseCategory[]> => (await api.get('/api/expenses/categories')).data,
  createCategory: async (name: string) => (await api.post('/api/expenses/categories', { name })).data,
  deleteCategory: async (id: number) => (await api.delete(`/api/expenses/categories/${id}`)).data,
  create: async (data: Record<string, unknown>): Promise<Expense> => (await api.post('/api/expenses', data)).data,
  update: async (id: number, data: Record<string, unknown>): Promise<Expense> => (await api.patch(`/api/expenses/${id}`, data)).data,
  remove: async (id: number) => (await api.delete(`/api/expenses/${id}`)).data,
};

export const customersApi = {
  list: async (params: Query = {}): Promise<Paginated<Customer>> =>
    (await api.get('/api/customers', { params: clean(params) })).data,
  stats: async () => (await api.get('/api/customers/stats')).data,
  get: async (id: number): Promise<CustomerDetail> => (await api.get(`/api/customers/${id}`)).data,
  create: async (data: Record<string, unknown>): Promise<Customer> => (await api.post('/api/customers', data)).data,
  update: async (id: number, data: Record<string, unknown>): Promise<Customer> =>
    (await api.patch(`/api/customers/${id}`, data)).data,
  remove: async (id: number) => (await api.delete(`/api/customers/${id}`)).data,
  loyalty: async (id: number) => (await api.get(`/api/customers/${id}/loyalty`)).data,
  addLoyalty: async (id: number, data: { points: number; type?: string; description?: string }) =>
    (await api.post(`/api/customers/${id}/loyalty`, data)).data,
};

export const ordersApi = {
  list: async (params: Query = {}): Promise<Paginated<Order> & { summary: Record<string, number> }> =>
    (await api.get('/api/orders', { params: clean(params) })).data,
  get: async (id: number): Promise<Order> => (await api.get(`/api/orders/${id}`)).data,
  checkout: async (data: CheckoutPayload): Promise<CheckoutResult> =>
    (await api.post('/api/orders/checkout', data)).data,
  returnOrder: async (id: number, data: { items: Array<{ orderItemId?: number; productId?: number; quantity: number }>; paymentMethod?: string; reason?: string; clientTransactionId?: string }) =>
    (await api.post(`/api/orders/${id}/return`, data)).data as CheckoutResult,
};

export const reportsApi = {
  summary: async (params: Query = {}): Promise<ReportSummary> =>
    (await api.get('/api/reports/summary', { params: clean(params) })).data,
  timeseries: async (params: Query = {}): Promise<TimeseriesPoint[]> =>
    (await api.get('/api/reports/timeseries', { params: clean(params) })).data,
  products: async (params: Query = {}): Promise<{ count: number; results: ProductReportRow[] }> =>
    (await api.get('/api/reports/products', { params: clean(params) })).data,
  export: async (params: Query = {}): Promise<Blob> =>
    (await api.get('/api/reports/export', { params: clean(params), responseType: 'blob' })).data,
};

export const notificationsApi = {
  list: async (params: Query = {}): Promise<Paginated<Notification> & { unread: number }> =>
    (await api.get('/api/notifications', { params: clean(params) })).data,
  unread: async (): Promise<{ count: number }> => (await api.get('/api/notifications/unread-count')).data,
  read: async (id: number) => (await api.patch(`/api/notifications/${id}/read`)).data,
  readAll: async () => (await api.post('/api/notifications/read-all')).data,
  remove: async (id: number) => (await api.delete(`/api/notifications/${id}`)).data,
  check: async () => (await api.post('/api/notifications/check')).data,
};

export const auditApi = {
  list: async (params: Query = {}): Promise<Paginated<AuditEntry>> =>
    (await api.get('/api/audit', { params: clean(params) })).data,
  clear: async () => (await api.delete('/api/audit/clear')).data,
};

export const settingsApi = {
  get: async (): Promise<AppSettings> => (await api.get('/api/settings')).data,
  save: async (settings: Record<string, string>) => (await api.post('/api/settings', { settings })).data,
  remove: async (key: string) => (await api.delete(`/api/settings/${key}`)).data,
  linkTelegram: async (chatId: string) => (await api.post('/api/settings/telegram/link', { chatId })).data,
  testTelegram: async (text?: string) => (await api.post('/api/settings/telegram/test', { text })).data,
};

export const barcodeApi = {
  productUrl: (id: number, scale = 3) => `/api/barcode/product/${id}?scale=${scale}`,
  qrUrl: (text: string, scale = 5) => `/api/barcode/qr?text=${encodeURIComponent(text)}&scale=${scale}`,
  labels: async (items: Array<{ productId: number; quantity: number }>) =>
    (await api.post('/api/barcode/labels', { items })).data as {
      count: number;
      labels: Array<{ productId: number; name: string; barcode: string | null; price: string; dataUrl: string }>;
    },
};

export const aiApi = {
  insights: async (): Promise<AiInsights> => (await api.get('/api/ai/insights')).data,
  chat: async (message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<AiChatResponse> =>
    (await api.post('/api/ai/chat', { message, history })).data,
};

export const syncApi = {
  bootstrap: async (): Promise<SyncBootstrap> => (await api.get('/api/sync/bootstrap')).data,
  list: async (params: Query = {}): Promise<Paginated<OfflineOperation>> =>
    (await api.get('/api/sync/offline', { params: clean(params) })).data,
  push: async (operations: Array<{ clientTransactionId: string; type: 'sale' | 'return'; payload: Record<string, unknown> }>) =>
    (await api.post('/api/sync/offline', { operations })).data as {
      total: number;
      succeeded: number;
      failed: number;
      results: Array<{ clientTransactionId: string; status: string; orderId?: number; duplicate?: boolean; error?: string }>;
    },
  retry: async (id: number) => (await api.post(`/api/sync/offline/${id}/retry`)).data,
  remove: async (id: number) => (await api.delete(`/api/sync/offline/${id}`)).data,
};
