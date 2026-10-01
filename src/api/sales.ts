import api from './api';
import type { Sale, PaginatedResponse, SaleQueryParams } from '../types';

export const getSales = async (
  params: SaleQueryParams = {}
): Promise<PaginatedResponse<Sale>> => {
  const cleanParams: Record<string, string | number> = {};
  if (params.search) cleanParams.search = params.search;
  if (params.ordering) cleanParams.ordering = params.ordering;
  if (params.page) cleanParams.page = params.page;

  const response = await api.get<PaginatedResponse<Sale>>('/api/sales/', {
    params: cleanParams,
  });
  return response.data;
};

export const getSale = async (id: string | number): Promise<Sale> => {
  const response = await api.get<Sale>(`/api/sales/${id}/`);
  return response.data;
};
