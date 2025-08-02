export interface Customer {
  id: number;
  name: string;
  address?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface CreateCustomerRequest {
  name: string;
  address?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: number;
}

export interface CustomerFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface CustomerSummary {
  total: number;
} 