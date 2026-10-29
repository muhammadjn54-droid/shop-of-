export interface User {
  id: number;
  username: string;
  email?: string;
  date_joined?: string;
  createdAt?: string;
}

export interface AuthTokens {
  access: string;
  refresh?: string;
  user?: User;
}

export interface ProductImage {
  id?: number;
  image: string;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  barcode?: string;
  arrival_date: string;
  quantity_received: number;
  quantity_sold: number;
  remaining_quantity: number;
  min_stock?: number;
  purchase_price: string | number;
  selling_price: string | number;
  profit_per_item?: string | number;
  revenue?: string | number;
  sold_cost?: string | number;
  profit?: string | number;
  loss?: string | number;
  image?: string | null;
  images?: Array<ProductImage | string>;
  created_at?: string;
  updated_at?: string;
  sales_count?: number;
  returns_count?: number;
  category?: string;
}

export type ProductCategory = 'stationery' | 'toys' | 'perfumery' | 'accessories';

export interface CategoryItem {
  id: ProductCategory;
  labelRu: string;
  labelTg: string;
  labelEn: string;
  icon: string;
  descriptionRu?: string;
  descriptionTg?: string;
}

export interface ProductSale {
  id: number;
  sold_at: string;
  quantity: number;
  returned_quantity: number;
  price_per_item: string | number;
  total_amount: string | number;
  profit: string | number;
}

export interface Sale {
  id: number;
  product?: number;
  product_name: string;
  barcode?: string;
  quantity: number;
  returned_quantity: number;
  net_quantity: number;
  price_per_item: string | number;
  purchase_price_per_item: string | number;
  total_amount: string | number;
  net_total_amount: string | number;
  cost_amount: string | number;
  profit: string | number;
  loss?: string | number;
  sold_at: string;
}

export interface RecentSale {
  id: number;
  product_name: string;
  quantity: number;
  total_amount: string | number;
  profit: string | number;
  sold_at: string;
}

export interface TopProduct {
  id: number;
  name: string;
  remaining_quantity: number;
  quantity_sold?: number;
  total_sold?: number;
  profit: string | number;
  revenue: string | number;
}

export interface DashboardData {
  total_products: number;
  total_remaining: number;
  total_sold: number;
  total_revenue: string | number;
  total_profit: string | number;
  total_loss: string | number;
  recent_sales: RecentSale[];
  top_products: TopProduct[];
}

export interface StatisticsData {
  products_count: number;
  total_items_received: number;
  total_items_sold: number;
  total_items_remaining: number;
  total_revenue: string | number;
  total_cost_of_sold_goods: string | number;
  total_profit: string | number;
  total_loss: string | number;
}

export interface SalesSummary {
  total_quantity: number;
  total_returned: number;
  total_revenue: string | number;
  total_cost: string | number;
  total_profit: string | number;
  total_loss: string | number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  summary?: SalesSummary;
}

export interface ProductQueryParams {
  search?: string;
  barcode?: string;
  ordering?: string;
  page?: number;
  limit?: number | string;
  category?: string;
}

export interface SaleQueryParams {
  search?: string;
  barcode?: string;
  ordering?: string;
  page?: number;
  limit?: number | string;
  period?: string;
}

export interface Employee {
  id: number;
  name: string;
  position: string;
  baseSalary: number;
  hasRest: boolean;
  restDays: number;
  absentDays: number;
  createdAt?: string;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface DebtRecord {
  id: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  paidAmount: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  payments: DebtPayment[];
  status: 'active' | 'paid';
}


