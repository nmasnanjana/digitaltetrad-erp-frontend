import axios from 'axios';
import { Customer } from '@/types/customer';

const API = axios.create({
    baseURL: 'http://localhost:4575/api',
    withCredentials: true,
});

export const getAllCustomers = () =>
    API.get<Customer[]>('/customers');

export const getCustomerById = (id: string) =>
    API.get<Customer>(`/customers/${id}`);

export const createCustomer = (customerData: Partial<Customer>) =>
    API.post('/customers', customerData);

export const updateCustomer = (id: string, data: Partial<Customer>) =>
    API.put(`/customers/${id}`, data);

export const deleteCustomer = (id: string) =>
    API.delete(`/customers/${id}`);

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