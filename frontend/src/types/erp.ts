export type Money = number | string;

export interface Paginated<T> {
  count: number;
  page?: number;
  limit?: number;
  results: T[];
}

export interface Branch {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  isMain: boolean;
  createdAt?: string;
  stats?: {
    products: number;
    stock: number;
    salesCount: number;
    salesTotal: number;
    expenses: number;
  };
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  totalDebt: Money;
  totalPaid: Money;
  obligations?: Money;
  purchasesCount: number;
  productsCount: number;
  createdAt?: string;
}

export interface PurchaseItem {
  id: number;
  productId: number;
  productName: string;
  barcode?: string | null;
  quantity: number;
  receivedQuantity: number;
  remainingQuantity?: number;
  costPrice: Money;
  total: Money;
}

export interface Purchase {
  id: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName: string;
  branchId?: number | null;
  status: string;
  totalAmount: Money;
  paidAmount: Money;
  notes?: string;
  createdAt?: string;
  orderedAt?: string | null;
  receivedAt?: string | null;
  items: PurchaseItem[];
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  barcode: string;
  branchId?: number | null;
  type: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  costPrice: Money | null;
  reason: string;
  referenceId?: string | number | null;
  userName: string;
  createdAt: string;
}

export interface SmartStockRow {
  productId: number;
  name: string;
  barcode?: string | null;
  category?: string;
  supplierId?: number | null;
  supplierName: string;
  remaining: number;
  minStock: number;
  maxStock?: number | null;
  leadTimeDays: number;
  avgDailySales: number;
  soldInPeriod: number;
  daysLeft: number | null;
  pendingQuantity: number;
  targetStock: number;
  recommendedQuantity: number;
  priority: 'normal' | 'high' | 'critical';
  purchasePrice: Money;
  estimatedCost: Money;
  reason: string;
}

export interface SmartStockResponse {
  lookbackDays: number;
  count: number;
  summary: { critical: number; high: number; recommended: number; estimatedCost: Money };
  results: SmartStockRow[];
}

export interface InventoryCountItem {
  id: number;
  productId: number;
  productName: string;
  barcode: string;
  systemQuantity: number;
  actualQuantity: number;
  difference: number;
  reason: string;
  adjusted: boolean;
}

export interface InventoryCount {
  id: number;
  title: string;
  branchId?: number | null;
  status: string;
  notes: string;
  createdAt: string;
  completedAt?: string | null;
  items: InventoryCountItem[];
  summary: { total: number; differences: number; surplus: number; shortage: number };
}

export interface InventoryTransfer {
  id: number;
  transferNumber?: string;
  fromBranchId: number;
  fromBranchName: string;
  toBranchId: number;
  toBranchName: string;
  status: string;
  notes: string;
  shippedAt?: string | null;
  receivedAt?: string | null;
  createdAt: string;
  items: Array<{ id: number; productId: number; productName: string; barcode: string; quantity: number }>;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  bonusPoints: number;
  discountPercent: number;
  totalPurchases: Money;
  totalDebt: Money;
  createdAt?: string;
  orderCount?: number;
  lastVisit?: string | null;
}

export interface CustomerDetail extends Customer {
  orders: Array<{
    id: number;
    orderNumber: string;
    totalAmount: Money;
    paymentMethod: string;
    isReturn: boolean;
    status: string;
    createdAt: string;
    itemsCount: number;
  }>;
  debts: Array<{
    id: number;
    totalAmount: Money;
    paidAmount: Money;
    remaining: Money;
    status: string;
    description: string;
    createdAt: string;
    payments: Array<{ id: number; amount: Money; note: string; createdAt: string }>;
  }>;
  loyalty: Array<{ id: number; points: number; type: string; description: string; orderId?: number | null; createdAt: string }>;
}

export interface OrderItem {
  id: number;
  productId?: number | null;
  productName: string;
  barcode: string;
  price: Money;
  purchasePrice: Money;
  quantity: number;
  total: Money;
}

export interface Order {
  id: number;
  orderNumber: string;
  totalAmount: Money;
  paymentMethod: string;
  cashGiven?: Money | null;
  changeAmount?: Money | null;
  cardAmount: Money;
  debtorName: string;
  cashierName: string;
  branchId?: number | null;
  customerId?: number | null;
  customerName: string;
  customerPhone: string;
  discountAmount: Money;
  isReturn: boolean;
  parentOrderId?: number | null;
  pointsEarned: number;
  pointsSpent: number;
  shiftId?: number | null;
  status: string;
  isOffline: boolean;
  createdAt: string;
  items: OrderItem[];
}

export interface Shift {
  id: number;
  branchId?: number | null;
  cashierName: string;
  status: string;
  openedAt: string;
  closedAt?: string | null;
  openingCash: Money;
  closingCash?: Money | null;
  expectedCash?: Money | null;
  variance?: Money | null;
  cashSales: Money;
  cardSales: Money;
  debtSales: Money;
  debtCollections: Money;
  cashAdditions: Money;
  cashDrops: Money;
  returnsCash: Money;
  expensesCash: Money;
  salesCount: number;
  notes: string;
  movements?: Array<{ id: number; type: string; amount: Money; reason: string; cashierName: string; createdAt: string }>;
}

export interface Expense {
  id: number;
  branchId?: number | null;
  shiftId?: number | null;
  category: string;
  amount: Money;
  paymentMethod: string;
  recipient: string;
  notes: string;
  expenseDate: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  count: number;
  total: Money;
}

export interface ReportSummary {
  period?: { from: string; to: string } | null;
  revenue?: Money;
  grossRevenue?: Money;
  returns?: Money;
  netRevenue?: Money;
  cost?: Money;
  grossProfit?: Money;
  margin?: number;
  expenses?: Money;
  netProfit?: Money;
  cash?: Money;
  card?: Money;
  debtSales?: Money;
  salesCount?: number;
  returnsCount?: number;
  averageCheck?: Money;
  stockValueCost?: Money;
  stockValueRetail?: Money;
  lowStock?: number;
  outOfStock?: number;
  customers?: number;
  customerDebt?: Money;
  supplierDebt?: Money;
  purchases?: Money;
  [key: string]: unknown;
}

export interface TimeseriesPoint {
  label: string;
  revenue: Money;
  returns: Money;
  net: Money;
  orders: number;
}

export interface ProductReportRow {
  productId: number;
  name: string;
  quantity: number;
  revenue: Money;
  cost: Money;
  profit: Money;
  returns: number;
  margin: Money;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string;
  createdAt: string;
}

export interface AuditEntry {
  id: number;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
}

export interface AppSettings {
  settings: Record<string, string>;
  telegram: { botConfigured: boolean; chatId: string };
  ai: { configured: boolean; model: string };
}

export interface AiInsightItem {
  severity?: 'info' | 'warning' | 'critical' | 'success';
  title?: string;
  message?: string;
  action?: string;
}

export interface AiRecommendationItem {
  productId?: number;
  name?: string;
  recommendedQuantity?: number;
  estimatedCost?: number;
  reason?: string;
}

export interface AiInsights {
  generatedAt: string;
  insights: (AiInsightItem | string)[];
  metrics: Record<string, any>;
  recommendations: (AiRecommendationItem | string)[];
  stats?: {
    revenueToday?: number;
    revenue30?: number;
    profit30?: number;
    outstandingDebt?: number;
    lowStockCount?: number;
    stockValue?: number;
  };
}

export interface AiChatResponse {
  mode: 'ai' | 'local';
  reply: string;
  insights?: string[];
  note?: string;
  model?: string;
}

export interface OfflineOperation {
  id: number;
  clientTransactionId: string;
  status: string;
  error: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SyncBootstrap {
  serverTime: string;
  version: number;
  products: Array<Record<string, unknown>>;
  categories: Array<Record<string, unknown>>;
  customers: Array<Record<string, unknown>>;
  settings: Record<string, unknown>;
  shift: { id: number; openedAt: string; openingCash: Money } | null;
  branches: Branch[];
  user: { id: number; username: string; role: string };
}

export interface CheckoutPayload {
  items: Array<{ productId: number | string; quantity: number; price?: number }>;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'debt' | 'mixed';
  cashGiven?: number;
  cardAmount?: number;
  customerId?: number | null;
  debtorName?: string;
  discountAmount?: number;
  discountPercent?: number;
  pointsSpent?: number;
  clientTransactionId?: string;
  branchId?: number | null;
  shiftId?: number | null;
  isOffline?: boolean;
}

export interface CheckoutResult {
  duplicate: boolean;
  order: Order;
}
