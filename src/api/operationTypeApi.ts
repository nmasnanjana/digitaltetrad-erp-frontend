import { apiClient } from './api-client';
import { type OperationType } from '@/types/operationType';

export const getAllOperationTypes = () => {
  return apiClient.get<OperationType[]>('/operation-types');
};

export const getOperationType = (id: number) => {
  return apiClient.get<OperationType>(`/operation-types/${id}`);
};

export const createOperationType = (data: { name: string; description?: string }) => {
  return apiClient.post<OperationType>('/operation-types', data);
};

export const updateOperationType = (id: number, data: { name: string; description?: string }) => {
  return apiClient.put<OperationType>(`/operation-types/${id}`, data);
};

export const deleteOperationType = (id: number) => {
  return apiClient.delete(`/operation-types/${id}`);
}; 