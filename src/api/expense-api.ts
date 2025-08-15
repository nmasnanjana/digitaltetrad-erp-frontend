import axios from 'axios';
import type { Expense, ExpenseType } from '@/types/expense';
import type { OperationType } from '@/types/operationType';

const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4575/api',
    withCredentials: true,
});

// Add request interceptor to include token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        // Type-safe error handling
        if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: unknown } };
            if (axiosError.response?.data) {
                return Promise.reject(new Error(`API Error: ${JSON.stringify(axiosError.response.data)}`));
            }
        }
        
        if (error && typeof error === 'object' && 'request' in error) {
            return Promise.reject(new Error('No response received from server'));
        }
        
        return Promise.reject(new Error(error instanceof Error ? error.message : 'Unknown error occurred'));
    }
);

export interface ExpenseFilters {
    createdStartDate?: string;
    createdEndDate?: string;
    expenseTypeId?: number;
    category?: 'job' | 'operation';
    jobId?: string;
    operationTypeId?: number;
    status?: string;
}

// Expense Types
export const getAllExpenseTypes = (): Promise<{ data: ExpenseType[] }> =>
    API.get<ExpenseType[]>('/expense-types');

export const getExpenseTypeById = (id: string): Promise<{ data: ExpenseType }> =>
    API.get<ExpenseType>(`/expense-types/${id}`);

export const createExpenseType = (data: Partial<ExpenseType>): Promise<{ data: ExpenseType }> =>
    API.post('/expense-types', data);

export const updateExpenseType = (id: string, data: Partial<ExpenseType>): Promise<{ data: ExpenseType }> =>
    API.put(`/expense-types/${id}`, data);

export const deleteExpenseType = (id: string): Promise<{ data: unknown }> =>
    API.delete(`/expense-types/${id}`);

// Operation Types
export const getAllOperationTypes = (): Promise<{ data: OperationType[] }> =>
    API.get<OperationType[]>('/operation-types');

export const getOperationTypeById = (id: string): Promise<{ data: OperationType }> =>
    API.get<OperationType>(`/operation-types/${id}`);

export const createOperationType = (data: Partial<OperationType>): Promise<{ data: OperationType }> =>
    API.post('/operation-types', data);

export const updateOperationType = (id: string, data: Partial<OperationType>): Promise<{ data: OperationType }> =>
    API.put(`/operation-types/${id}`, data);

export const deleteOperationType = (id: string): Promise<{ data: unknown }> =>
    API.delete(`/operation-types/${id}`);

// Expenses
export const getAllExpenses = (): Promise<{ data: Expense[] }> =>
    API.get<Expense[]>('/expenses');

export const getExpenseById = (id: string): Promise<{ data: Expense }> =>
    API.get<Expense>(`/expenses/${id}`);

export const createExpense = (data: Partial<Expense>): Promise<{ data: Expense }> =>
    API.post('/expenses', data);

export const updateExpense = (id: string, data: Partial<Expense>): Promise<{ data: Expense }> =>
    API.put(`/expenses/${id}`, data);

export const deleteExpense = (id: string): Promise<{ data: unknown }> =>
    API.delete(`/expenses/${id}`);

// Expense Approvals
export const reviewExpense = (id: string, data: { status: string; reviewer_comment?: string; reviewed_by: string }): Promise<{ data: Expense }> =>
    API.post(`/expenses/${id}/review`, data);

// Expense Payments
export const markAsPaid = (id: string, data: { paid: boolean }): Promise<{ data: Expense }> =>
    API.put(`/expenses/${id}/payment`, data);

export const getExpensePayments = (id: string): Promise<{ data: unknown }> =>
    API.get(`/expenses/${id}/payments`);

export const getExpensesByJob = async (jobId: string): Promise<{ data: Expense[] }> => {
    const response = await API.get(`/expenses/job/${jobId}`);
    return response;
};
