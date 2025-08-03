import axios from 'axios';
import { type Team } from '@/types/team';

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

export const getAllTeams = () =>
    API.get<Team[]>('/teams');

export const getTeamById = (id: string) =>
    API.get<Team>(`/teams/${id}`);

export const createTeam = (teamData: Partial<Team>) =>
    API.post('/teams', teamData);

export const updateTeam = (id: string, data: Partial<Team>) =>
    API.put(`/teams/${id}`, data);

export const deleteTeam = (id: string) =>
    API.delete(`/teams/${id}`);

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
        } 
            console.error('Error message:', error.message);
            return Promise.reject(error);
        
    }
); 