import axios from 'axios';
import { Job } from '@/types/job';

const API = axios.create({
    baseURL: 'http://localhost:4575/api',
    withCredentials: true,
});

export const getAllJobs = () =>
    API.get<Job[]>('/jobs');

export const getJobById = (id: string) =>
    API.get<Job>(`/jobs/${id}`);

export const createJob = (jobData: Partial<Job>) =>
    API.post('/jobs', jobData);

export const updateJob = (id: string, data: Partial<Job>) =>
    API.put(`/jobs/${id}`, data);

export const deleteJob = (id: string) =>
    API.delete(`/jobs/${id}`);

// Add error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Extract error message from response
            const errorMessage = error.response.data?.error || error.response.data?.message || 'An error occurred';
            console.error('Error response:', error.response.data);
            return Promise.reject(new Error(errorMessage));
        } else if (error.request) {
            console.error('Error request:', error.request);
            return Promise.reject(new Error('No response received from server'));
        } else {
            console.error('Error message:', error.message);
            return Promise.reject(error);
        }
    }
); 