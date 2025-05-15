import axios from 'axios';
import { authClient } from '@/lib/auth/client';
import { Expense, ExpenseType } from '@/types/expense';

const API_URL = 'http://localhost:4575/api';

export interface ExpenseFilters {
    createdStartDate?: string;
    createdEndDate?: string;
    expenseTypeId?: number;
    category?: 'job' | 'operation';
    jobId?: string;
    operationTypeId?: number;
    status?: string;
}

// Expense Type API
export const getAllExpenseTypes = async () => {
    const response = await axios.get(`${API_URL}/expense-types`);
    return response;
};

export const createExpenseType = async (data: Partial<ExpenseType>) => {
    const response = await axios.post(`${API_URL}/expense-types`, data);
    return response;
};

export const updateExpenseType = async (id: string, data: Partial<ExpenseType>) => {
    const response = await axios.put(`${API_URL}/expense-types/${id}`, data);
    return response;
};

export const deleteExpenseType = async (id: string) => {
    const response = await axios.delete(`${API_URL}/expense-types/${id}`);
    return response;
};

// Expense API
export const getAllExpenses = async (filters?: ExpenseFilters) => {
    const queryParams = new URLSearchParams();
    
    if (filters) {
        if (filters.createdStartDate) {
            queryParams.append('createdStartDate', filters.createdStartDate);
        }
        if (filters.createdEndDate) {
            queryParams.append('createdEndDate', filters.createdEndDate);
        }
        if (filters.expenseTypeId) {
            queryParams.append('expenseTypeId', filters.expenseTypeId.toString());
        }
        if (filters.category) {
            queryParams.append('operations', filters.category === 'operation' ? 'true' : 'false');
        }
        if (filters.jobId) {
            queryParams.append('jobId', filters.jobId);
        }
        if (filters.operationTypeId) {
            queryParams.append('operationTypeId', filters.operationTypeId.toString());
        }
        if (filters.status) {
            queryParams.append('status', filters.status);
        }
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${API_URL}/expenses?${queryString}` : `${API_URL}/expenses`;
    
    return axios.get(url);
};

export const getExpenseById = async (id: string) => {
    const response = await axios.get(`${API_URL}/expenses/${id}`);
    return response;
};

export const createExpense = async (data: {
    expenses_type_id: number;
    operations: boolean;
    job_id?: number;
    description: string;
    amount: number;
}) => {
    const response = await axios.post(`${API_URL}/expenses`, data);
    return response;
};

export const updateExpense = async (id: string, data: {
    expenses_type_id: number;
    operations: boolean;
    job_id?: number;
    description: string;
    amount: number;
    edited_by: string;
    reason_to_edit: string;
}) => {
    const response = await axios.put(`${API_URL}/expenses/${id}`, data);
    return response;
};

export const deleteExpense = async (id: string) => {
    const response = await axios.delete(`${API_URL}/expenses/${id}`);
    return response;
};

export const getExpensesByJob = async (jobId: string) => {
    const response = await axios.get(`${API_URL}/expenses/job/${jobId}`);
    return response;
};
