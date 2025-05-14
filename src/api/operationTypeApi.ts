import axios from 'axios';
import { OperationType } from '@/types/operationType';

const API_URL = 'http://localhost:4575/api';

// Operation Type API
export const getAllOperationTypes = async () => {
    const response = await axios.get(`${API_URL}/operation-types`);
    return response;
};

export const getOperationTypeById = async (id: string) => {
    const response = await axios.get(`${API_URL}/operation-types/${id}`);
    return response;
};

export const createOperationType = async (data: {
    name: string;
    description?: string;
    isActive: boolean;
}) => {
    const response = await axios.post(`${API_URL}/operation-types`, data);
    return response;
};

export const updateOperationType = async (id: string, data: {
    name: string;
    description?: string;
    isActive: boolean;
}) => {
    const response = await axios.put(`${API_URL}/operation-types/${id}`, data);
    return response;
};

export const deleteOperationType = async (id: string) => {
    const response = await axios.delete(`${API_URL}/operation-types/${id}`);
    return response;
}; 