import axios from 'axios';
import { User } from '@/types/user';

const API = axios.create({
    baseURL: 'http://localhost:4575/api',
    withCredentials: true,
});

export const login = (username: string, password: string) =>
    API.post('http://localhost:4575/api/users/login', { username, password });

export const getAllUsers = () =>
    API.get<User[]>('http://localhost:4575/api/users/all');

export const getUserById = (id: string) =>
    API.get<User>(`http://localhost:4575/api/users/${id}`);

export const createUser = (userData: Partial<User> & { password: string, password_confirmation: string }) =>
    API.post('http://localhost:4575/api/users/register', userData);

export const updateUser = (id: string, data: Partial<User>) =>
    API.put(`http://localhost:4575/api/users/${id}`, data);

export const deleteUser = (id: string) =>
    API.delete(`http://localhost:4575/api/users/${id}`);

// Add error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response:', error.response.data);
            return Promise.reject(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
            return Promise.reject(new Error('No response received from server'));
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
            return Promise.reject(error);
        }
    }
);
