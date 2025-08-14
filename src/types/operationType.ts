export interface OperationType {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOperationTypeRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateOperationTypeRequest extends Partial<CreateOperationTypeRequest> {
  id: number;
}

export interface OperationTypeFilters {
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface OperationTypeSummary {
  total: number;
  active: number;
  inactive: number;
} 