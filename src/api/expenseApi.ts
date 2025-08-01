import axios from 'axios';
import { Expense, ExpenseType, OperationType } from '@/types/expense';

const API = axios.create({
    baseURL: 'http://localhost:4575/api',
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
        if (error.response) {
            console.error('Error response:', error.response.data);
            return Promise.reject(error.response.data);
        } else if (error.request) {
            console.error('Error request:', error.request);
            return Promise.reject(new Error('No response received from server'));
        } else {
            console.error('Error message:', error.message);
            return Promise.reject(error);
        }
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
export const getAllExpenseTypes = () =>
    API.get<ExpenseType[]>('/expense-types');

export const getExpenseTypeById = (id: string) =>
    API.get<ExpenseType>(`/expense-types/${id}`);

export const createExpenseType = (data: Partial<ExpenseType>) =>
    API.post('/expense-types', data);

export const updateExpenseType = (id: string, data: Partial<ExpenseType>) =>
    API.put(`/expense-types/${id}`, data);

export const deleteExpenseType = (id: string) =>
    API.delete(`/expense-types/${id}`);

// Operation Types
export const getAllOperationTypes = () =>
    API.get<OperationType[]>('/operation-types');

export const getOperationTypeById = (id: string) =>
    API.get<OperationType>(`/operation-types/${id}`);

export const createOperationType = (data: Partial<OperationType>) =>
    API.post('/operation-types', data);

export const updateOperationType = (id: string, data: Partial<OperationType>) =>
    API.put(`/operation-types/${id}`, data);

export const deleteOperationType = (id: string) =>
    API.delete(`/operation-types/${id}`);

// Expenses
export const getAllExpenses = () =>
    API.get<Expense[]>('/expenses');

export const getExpenseById = (id: string) =>
    API.get<Expense>(`/expenses/${id}`);

export const createExpense = (data: Partial<Expense>) =>
    API.post('/expenses', data);

export const updateExpense = (id: string, data: Partial<Expense>) =>
    API.put(`/expenses/${id}`, data);

export const deleteExpense = (id: string) =>
    API.delete(`/expenses/${id}`);

// Expense Approvals
export const reviewExpense = (id: string, data: { status: string; reviewer_comment?: string; reviewed_by: string }) =>
    API.post(`/expenses/${id}/review`, data);

// Expense Payments
export const markAsPaid = (id: string, data: { paid: boolean }) =>
    API.put(`/expenses/${id}/payment`, data);

export const getExpensePayments = (id: string) =>
    API.get(`/expenses/${id}/payments`);

export const getExpensesByJob = async (jobId: string) => {
    const response = await API.get(`/expenses/job/${jobId}`);
    return response;
};
