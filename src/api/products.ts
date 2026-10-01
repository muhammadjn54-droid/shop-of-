import api from './api';
import type {
  Product,
  ProductSale,
  PaginatedResponse,
  ProductQueryParams,
} from '../types';

export const getProducts = async (
  params: ProductQueryParams = {}
): Promise<PaginatedResponse<Product>> => {
  const cleanParams: Record<string, string | number> = {};
  if (params.search) cleanParams.search = params.search;
  if (params.barcode) cleanParams.barcode = params.barcode;
  if (params.ordering) cleanParams.ordering = params.ordering;
  if (params.page) cleanParams.page = params.page;

  const response = await api.get<PaginatedResponse<Product>>('/api/products/', {
    params: cleanParams,
  });
  return response.data;
};

// Точный поиск по штрихкоду (для USB-сканера: один запрос по Enter)
export const getProductByBarcode = async (
  barcode: string
): Promise<PaginatedResponse<Product>> => {
  const response = await api.get<PaginatedResponse<Product>>('/api/products/', {
    params: { barcode },
  });
  return response.data;
};

export const getProduct = async (id: string | number): Promise<Product> => {
  const response = await api.get<Product>(`/api/products/${id}/`);
  return response.data;
};

export const createProduct = async (
  productData: FormData | Record<string, unknown>
): Promise<Product> => {
  const isFormData = productData instanceof FormData;
  const response = await api.post<Product>('/api/products/', productData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const updateProduct = async (
  id: string | number,
  productData: FormData | Record<string, unknown>
): Promise<Product> => {
  const isFormData = productData instanceof FormData;
  const response = await api.patch<Product>(`/api/products/${id}/`, productData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const deleteProduct = async (id: string | number): Promise<unknown> => {
  const response = await api.delete(`/api/products/${id}/`);
  return response.data;
};

export const sellProduct = async (
  id: string | number,
  sellData: { quantity: number }
): Promise<{ message?: string; product?: Product }> => {
  const response = await api.post<{ message?: string; product?: Product }>(
    `/api/products/${id}/sell/`,
    sellData
  );
  return response.data;
};

export const addStock = async (
  id: string | number,
  stockData: { quantity: number; purchase_price?: string }
): Promise<{ message?: string; product?: Product }> => {
  const response = await api.post<{ message?: string; product?: Product }>(
    `/api/products/${id}/add-stock/`,
    stockData
  );
  return response.data;
};

export const returnProduct = async (
  id: string | number,
  returnData: { quantity: number }
): Promise<{ message?: string; product?: Product }> => {
  const response = await api.post<{ message?: string; product?: Product }>(
    `/api/products/${id}/return/`,
    returnData
  );
  return response.data;
};

export const getLowStock = async (
  params: ProductQueryParams = {}
): Promise<PaginatedResponse<Product>> => {
  const cleanParams: Record<string, string | number> = {};
  if (params.search) cleanParams.search = params.search;
  if (params.ordering) cleanParams.ordering = params.ordering;
  if (params.page) cleanParams.page = params.page;

  const response = await api.get<PaginatedResponse<Product>>('/api/products/low-stock/', {
    params: cleanParams,
  });
  return response.data;
};

export const getProductSales = async (
  id: string | number,
  params: ProductQueryParams = {}
): Promise<PaginatedResponse<ProductSale> | ProductSale[]> => {
  const cleanParams: Record<string, string | number> = {};
  if (params.search) cleanParams.search = params.search;
  if (params.ordering) cleanParams.ordering = params.ordering;
  if (params.page) cleanParams.page = params.page;

  const response = await api.get<PaginatedResponse<ProductSale> | ProductSale[]>(
    `/api/products/${id}/sales/`,
    { params: cleanParams }
  );
  return response.data;
};

export const uploadProductImages = async (
  id: string | number,
  formData: FormData
): Promise<unknown> => {
  const response = await api.post(`/api/products/${id}/images/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteProductImage = async (
  productId: string | number,
  imageId: string | number
): Promise<unknown> => {
  const response = await api.delete(`/api/products/${productId}/images/${imageId}/`);
  return response.data;
};
