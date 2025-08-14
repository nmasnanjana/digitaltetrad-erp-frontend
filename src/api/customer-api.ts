import axios from 'axios';
import type { Customer } from '@/types/customer';

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

export const getAllCustomers = (): Promise<{ data: Customer[] }> =>
    API.get<Customer[]>('/customers');

export const getCustomerById = (id: string): Promise<{ data: Customer }> =>
    API.get<Customer>(`/customers/${id}`);

export const createCustomer = (customerData: Partial<Customer>): Promise<{ data: Customer }> =>
    API.post('/customers', customerData);

export const updateCustomer = (id: string, data: Partial<Customer>): Promise<{ data: Customer }> =>
    API.put(`/customers/${id}`, data);

export const deleteCustomer = (id: string): Promise<{ data: unknown }> =>
    API.delete(`/customers/${id}`).then(() => ({ data: null })); 