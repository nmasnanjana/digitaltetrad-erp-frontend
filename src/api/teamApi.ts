import axios from 'axios';
import { type Team } from '@/types/team';

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

export interface TeamPaginationResponse {
  teams: Team[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const getAllTeams = (page: number = 1, limit: number = 10, search: string = ''): Promise<{ data: TeamPaginationResponse }> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    
    return API.get<TeamPaginationResponse>(`/teams?${params.toString()}`);
};

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
        } else {
            console.error('Error message:', error.message);
            return Promise.reject(error);
        }
    }
); 