import type { Permission } from './permission';

export interface Role {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  permissionIds: string[];
}

export interface UpdateRoleRequest extends Partial<CreateRoleRequest> {
  id: string;
}

export interface RoleFilters {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface RoleSummary {
  total: number;
  active: number;
  inactive: number;
} 