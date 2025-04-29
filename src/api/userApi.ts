import axios from 'axios';
import { User } from '@/types/user';

const API = axios.create({
    baseURL: 'http://localhost:4575/api',
    withCredentials: true,
});

export const login = (username: string, password: string) =>
    API.post('/users/login', { username, password });

export const getAllUsers = () =>
    API.get<User[]>('/users');

export const getUserById = (id: string) =>
    API.get<User>(`/users/${id}`);

export const createUser = (userData: Partial<User> & { password: string, password_confirmation: string }) =>
    API.post('/users', userData);

export const updateUser = (id: string, data: Partial<User>) =>
    API.put(`/users/${id}`, data);

export const deleteUser = (id: string) =>
    API.delete(`/users/${id}`);
