export type ReturnCause = 'faulty' | 'removed' | 'surplus';

export interface Inventory {
  id: string;
  name: string;
  description?: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  category: string;
  location?: string;
  minimumStock: number;
  isActive: boolean;
  isReturnItem: boolean;
  returnCause?: ReturnCause;
  arStatus: string;
  mrnStatus: string;
  isReturnedToWarehouse: boolean;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryRequest {
  name: string;
  description?: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  category: string;
  location?: string;
  minimumStock: number;
  isActive?: boolean;
  isReturnItem?: boolean;
  returnCause?: ReturnCause;
  arStatus?: string;
  mrnStatus?: string;
  isReturnedToWarehouse?: boolean;
  jobId?: string;
}

export interface UpdateInventoryRequest extends Partial<CreateInventoryRequest> {
  id: string;
}

export interface InventoryFilters {
  search?: string;
  category?: string;
  isActive?: boolean;
  isReturnItem?: boolean;
  arStatus?: string;
  mrnStatus?: string;
  jobId?: string;
  limit?: number;
  offset?: number;
}

export interface InventorySummary {
  total: number;
  active: number;
  inactive: number;
  returnItems: number;
  lowStock: number;
  byCategory: Record<string, number>;
} 