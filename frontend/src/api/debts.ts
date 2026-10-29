import api from './api';
import type { DebtRecord } from '../types';

export interface CreateDebtInput {
  customerName: string;
  phone?: string;
  totalAmount: number;
  description?: string;
}

export interface AddPaymentInput {
  amount: number;
  paymentMethod?: 'cash' | 'card' | 'transfer';
  note?: string;
}

export const getDebts = async (): Promise<DebtRecord[]> => {
  const response = await api.get<DebtRecord[]>('/api/debts');
  return response.data;
};

export const getDebt = async (id: string | number): Promise<DebtRecord> => {
  const response = await api.get<DebtRecord>(`/api/debts/${id}`);
  return response.data;
};

export const createDebt = async (data: CreateDebtInput): Promise<DebtRecord> => {
  const response = await api.post<DebtRecord>('/api/debts', data);
  return response.data;
};

export const addDebtPayment = async (
  debtId: string | number,
  data: AddPaymentInput
): Promise<DebtRecord> => {
  const response = await api.post<DebtRecord>(`/api/debts/${debtId}/payments`, data);
  return response.data;
};

export const deleteDebt = async (
  id: string | number
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/api/debts/${id}`
  );
  return response.data;
};
