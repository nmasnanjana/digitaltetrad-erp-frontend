import axios from 'axios';
import { type User } from '@/types/user';

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

export const login = (username: string, password: string) =>
    API.post('/users/login', { username, password });

export const getAllUsers = () =>
    API.get<User[]>('/users/all');

export const getUserById = (id: string) =>
    API.get<User>(`/users/${id}`);

export const createUser = (userData: Partial<User> & { password: string, password_confirmation: string }) =>
    API.post('/users/register', userData);

export const updateUser = (id: string, data: Partial<User>) =>
    API.put(`/users/${id}`, data);

export const deleteUser = (id: string) =>
    API.delete(`/users/${id}`);

export const updateUserPassword = async (userId: string, data: { currentPassword: string; newPassword: string; newPasswordConfirm: string }) => {
  const response = await API.put(`/users/${userId}/password`, data);
  return response.data;
};

export const updateUserActivity = async (userId: string, data: { isActive: boolean }) => {
  const response = await API.put(`/users/${userId}/activity`, data);
  return response.data;
};

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
        } 
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
            return Promise.reject(error);
        
    }
);
