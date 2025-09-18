import axios from 'axios';
import type { Job } from '@/types/job';

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

export interface JobFilters {
    createdStartDate?: string;
    createdEndDate?: string;
    completedStartDate?: string;
    completedEndDate?: string;
    status?: string;
    type?: string;
    customerId?: number;
    page?: number;
    limit?: number;
    search?: string;
}

export interface JobPaginationResponse {
  jobs: Job[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const getAllJobs = (filters?: JobFilters): Promise<{ data: JobPaginationResponse }> => {
    const params = new URLSearchParams();
    
    // Add existing filters
    if (filters?.createdStartDate) params.append('createdStartDate', filters.createdStartDate);
    if (filters?.createdEndDate) params.append('createdEndDate', filters.createdEndDate);
    if (filters?.completedStartDate) params.append('completedStartDate', filters.completedStartDate);
    if (filters?.completedEndDate) params.append('completedEndDate', filters.completedEndDate);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.customerId) params.append('customer_id', filters.customerId.toString());
    
    // Add pagination parameters
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);
    
    return API.get<JobPaginationResponse>(`/jobs?${params.toString()}`);
};

export const getJobById = (id: string): Promise<{ data: Job }> =>
    API.get<Job>(`/jobs/${id}`);

export const createJob = (jobData: Partial<Job>): Promise<{ data: Job }> =>
    API.post('/jobs', jobData);

export const updateJob = (id: string, data: Partial<Job>): Promise<{ data: Job }> =>
    API.put(`/jobs/${id}`, data);

export const deleteJob = (id: string): Promise<{ data: unknown }> =>
    API.delete(`/jobs/${id}`); 