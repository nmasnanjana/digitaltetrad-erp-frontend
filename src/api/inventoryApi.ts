import axios from 'axios';
import { Inventory } from '@/types/inventory';

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

export const getAllInventory = () =>
    API.get<Inventory[]>('/inventory');

export const getInventoryById = (id: string) =>
    API.get<Inventory>(`/inventory/${id}`);

export const createInventory = (inventoryData: Partial<Inventory>) =>
    API.post('/inventory', inventoryData);

export const updateInventory = (id: string, data: Partial<Inventory>) =>
    API.put(`/inventory/${id}`, data);

export const deleteInventory = (id: string) =>
    API.delete(`/inventory/${id}`); 