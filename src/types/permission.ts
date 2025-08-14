export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionRequest {
  module: string;
  action: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePermissionRequest extends Partial<CreatePermissionRequest> {
  id: string;
}

export interface PermissionFilters {
  module?: string;
  action?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface PermissionSummary {
  total: number;
  active: number;
  inactive: number;
  byModule: Record<string, number>;
} 