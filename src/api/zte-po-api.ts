import { apiClient } from './api-client';

export interface ZtePoData {
  id: number;
  job_id: string;
  customer_id: number;
  po_line_no: string;
  purchasing_area: string;
  site_code: string;
  site_name: string;
  logic_site_code: string;
  logic_site_name: string;
  item_code: string;
  item_name: string;
  unit: string;
  po_quantity: number;
  confirmed_quantity: number;
  settlement_quantity: number;
  quantity_bill: number;
  quantity_cancelled: number;
  unit_price: number;
  tax_rate: number;
  subtotal_excluding_tax: number;
  subtotal_including_tax: number;
  pr_line_number: string;
  description?: string;
  is_invoiced: boolean;
  file_path?: string;
  uploaded_at?: string;
  uploaded_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateZtePoRequest {
  job_id: string;
  customer_id: number;
  po_line_no: string;
  purchasing_area: string;
  site_code: string;
  site_name: string;
  logic_site_code: string;
  logic_site_name: string;
  item_code: string;
  item_name: string;
  unit: string;
  po_quantity: number;
  confirmed_quantity: number;
  settlement_quantity: number;
  quantity_bill: number;
  quantity_cancelled: number;
  unit_price: number;
  tax_rate: number;
  subtotal_excluding_tax: number;
  subtotal_including_tax: number;
  pr_line_number: string;
  description?: string;
}

export interface UpdateZtePoRequest extends Partial<CreateZtePoRequest> {}

export interface ZtePoFilters {
  customerId?: number;
  jobId?: string;
}

// Create a new ZTE PO
export const createZtePo = async (data: CreateZtePoRequest): Promise<ZtePoData> => {
  const response = await apiClient.post('/zte-pos', data);
  return response.data;
};

// Upload Excel file and process ZTE PO data
export const uploadZtePoExcel = async (
  jobId: string,
  customerId: number,
  file: File
): Promise<{ message: string; processedCount: number; filePath: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('job_id', jobId);
  formData.append('customer_id', customerId.toString());

  const response = await apiClient.post('/zte-pos/upload-excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Get all ZTE POs
export const getAllZtePos = async (filters?: ZtePoFilters): Promise<ZtePoData[]> => {
  const params = new URLSearchParams();
  if (filters?.customerId) params.append('customerId', filters.customerId.toString());
  if (filters?.jobId) params.append('jobId', filters.jobId);

  const response = await apiClient.get(`/zte-pos?${params.toString()}`);
  return response.data;
};

// Get ZTE PO by ID
export const getZtePoById = async (id: number): Promise<ZtePoData> => {
  const response = await apiClient.get(`/zte-pos/${id}`);
  return response.data;
};

// Get ZTE POs by Job ID
export const getZtePosByJobId = async (jobId: string): Promise<ZtePoData[]> => {
  const response = await apiClient.get(`/zte-pos/job/${jobId}`);
  return response.data;
};

// Update ZTE PO by ID
export const updateZtePo = async (id: number, data: UpdateZtePoRequest): Promise<ZtePoData> => {
  const response = await apiClient.put(`/zte-pos/${id}`, data);
  return response.data;
};

// Delete ZTE PO by ID
export const deleteZtePo = async (id: number): Promise<{ message: string }> => {
  const response = await apiClient.delete(`/zte-pos/${id}`);
  return response.data;
};

// Delete ZTE POs by Job ID
export const deleteZtePosByJobId = async (jobId: string): Promise<{ message: string; deletedCount: number }> => {
  const response = await apiClient.delete(`/zte-pos/job/${jobId}`);
  return response.data;
};

// Download ZTE PO file
export const downloadZtePoFile = async (jobId: string): Promise<Blob> => {
  const response = await apiClient.get(`/zte-pos/download/${jobId}`, {
    responseType: 'blob',
  });
  return response.data;
};
