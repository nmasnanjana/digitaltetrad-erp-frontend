import axios from 'axios';
import type { Inventory } from '@/types/inventory';

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

export const getAllInventory = (): Promise<{ data: Inventory[] }> =>
    API.get<Inventory[]>('/inventory');

export const getInventoryById = (id: string): Promise<{ data: Inventory }> =>
    API.get<Inventory>(`/inventory/${id}`);

export const createInventory = (inventoryData: Partial<Inventory>): Promise<{ data: Inventory }> =>
    API.post('/inventory', inventoryData);

export const updateInventory = (id: string, data: Partial<Inventory>): Promise<{ data: Inventory }> =>
    API.put(`/inventory/${id}`, data);

export const deleteInventory = (id: string): Promise<{ data: unknown }> =>
    API.delete(`/inventory/${id}`); 