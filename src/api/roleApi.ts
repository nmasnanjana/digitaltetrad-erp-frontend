import { apiClient } from './api-client';
import type { Role } from '@/types/role';

export interface RolePaginationResponse {
  roles: Role[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const roleApi = {
  getAllRoles: async (page: number = 1, limit: number = 10, search: string = ''): Promise<RolePaginationResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    
    const response = await apiClient.get(`/roles?${params.toString()}`);
    return response.data;
  },

  getRoleById: async (id: string): Promise<Role> => {
    const response = await apiClient.get(`/roles/${id}`);
    return response.data;
  },

  createRole: async (data: { name: string; description?: string }): Promise<Role> => {
    const response = await apiClient.post('/roles', data);
    return response.data;
  },

  updateRole: async (id: string, data: { name: string; description?: string; isActive?: boolean }): Promise<Role> => {
    const response = await apiClient.put(`/roles/${id}`, data);
    return response.data;
  },

  deleteRole: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/roles/${id}`);
    return response.data;
  }
}; 