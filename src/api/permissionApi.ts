import { apiClient } from './api-client';
import type { Permission } from '@/types/permission';

export interface PermissionPaginationResponse {
  permissions: Permission[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const permissionApi = {
  getAllPermissions: async (page: number = 1, limit: number = 10, search: string = ''): Promise<PermissionPaginationResponse> => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);
    
    const response = await apiClient.get(`/permissions?${params.toString()}`);
    return response.data;
  },

  getPermissionsByModule: async (module: string): Promise<Permission[]> => {
    const response = await apiClient.get(`/permissions/module/${module}`);
    return response.data;
  },

  assignPermissionsToRole: async (roleId: string, permissionIds: string[]): Promise<{ message: string }> => {
    const response = await apiClient.post(`/permissions/roles/${roleId}`, { permissionIds });
    return response.data;
  },

  removePermissionsFromRole: async (roleId: string, permissionIds: string[]): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/permissions/roles/${roleId}`, { data: { permissionIds } });
    return response.data;
  },

  scanAndSyncPermissions: async (): Promise<{ message: string }> => {
    const response = await apiClient.post('/permissions/scan-sync');
    return response.data;
  }
}; 