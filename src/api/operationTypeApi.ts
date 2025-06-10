import axios from 'axios';
import { OperationType } from '@/types/operationType';

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

// Operation Type API
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