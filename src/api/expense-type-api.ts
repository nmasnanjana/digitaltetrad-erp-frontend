import { apiClient } from './api-client';
import type { ExpenseType } from '@/types/expense';

export const getAllExpenseTypes = (): Promise<{ data: ExpenseType[] }> => {
  return apiClient.get<ExpenseType[]>('/expense-types');
};

export const getExpenseType = (id: number): Promise<{ data: ExpenseType }> => {
  return apiClient.get<ExpenseType>(`/expense-types/${id}`);
};

export const createExpenseType = (data: { name: string; description?: string }): Promise<{ data: ExpenseType }> => {
  return apiClient.post<ExpenseType>('/expense-types', data);
};

export const updateExpenseType = (id: number, data: { name: string; description?: string }): Promise<{ data: ExpenseType }> => {
  return apiClient.put<ExpenseType>(`/expense-types/${id}`, data);
};

export const deleteExpenseType = (id: number): Promise<{ data: unknown }> => {
  return apiClient.delete(`/expense-types/${id}`);
}; 