import { apiClient } from './apiClient';
import { ExpenseType } from '@/types/expense';

export const getAllExpenseTypes = () => {
  return apiClient.get<ExpenseType[]>('/expense-types');
};

export const getExpenseType = (id: number) => {
  return apiClient.get<ExpenseType>(`/expense-types/${id}`);
};

export const createExpenseType = (data: { name: string; description?: string }) => {
  return apiClient.post<ExpenseType>('/expense-types', data);
};

export const updateExpenseType = (id: number, data: { name: string; description?: string }) => {
  return apiClient.put<ExpenseType>(`/expense-types/${id}`, data);
};

export const deleteExpenseType = (id: number) => {
  return apiClient.delete(`/expense-types/${id}`);
}; 