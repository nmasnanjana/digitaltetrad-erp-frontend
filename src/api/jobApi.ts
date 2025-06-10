import axios from 'axios';
import { Job } from '@/types/job';

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

export interface JobFilters {
    createdStartDate?: string;
    createdEndDate?: string;
    completedStartDate?: string;
    completedEndDate?: string;
    status?: string;
    type?: string;
    customer_id?: number;
}

export const getAllJobs = (filters?: JobFilters) =>
    API.get<Job[]>('/jobs', { params: filters });

export const getJobById = (id: string) =>
    API.get<Job>(`/jobs/${id}`);

export const createJob = (jobData: Partial<Job>) =>
    API.post('/jobs', jobData);

export const updateJob = (id: string, data: Partial<Job>) =>
    API.put(`/jobs/${id}`, data);

export const deleteJob = (id: string) =>
    API.delete(`/jobs/${id}`); 