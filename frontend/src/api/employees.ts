import api from './api';
import type { Employee } from '../types';

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await api.get<Employee[]>('/api/employees');
  return response.data;
};

export const getEmployee = async (id: number | string): Promise<Employee> => {
  const response = await api.get<Employee>(`/api/employees/${id}`);
  return response.data;
};

export const createEmployee = async (
  data: Partial<Employee>
): Promise<Employee> => {
  const response = await api.post<Employee>('/api/employees', data);
  return response.data;
};

export const updateEmployee = async (
  id: number | string,
  data: Partial<Employee>
): Promise<Employee> => {
  const response = await api.patch<Employee>(`/api/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (
  id: number | string
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/api/employees/${id}`
  );
  return response.data;
};
