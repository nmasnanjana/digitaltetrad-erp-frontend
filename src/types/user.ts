import type { Role } from './role';

export interface User {
  id: string;
  firstName: string;
  lastName?: string;
  username: string;
  email?: string;
  roleId: string;
  isActive: boolean;
  lastLogin?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  role?: Role;
  avatar?: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName?: string;
  username: string;
  email?: string;
  password: string;
  roleId: string;
  isActive?: boolean;
}

export interface UpdateUserRequest extends Partial<Omit<CreateUserRequest, 'password'>> {
  id: string;
  password?: string;
}

export interface UserFilters {
  search?: string;
  roleId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface UserSummary {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
}
