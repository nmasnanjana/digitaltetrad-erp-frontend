import { apiClient } from './api-client';

export interface HuaweiPoData {
  id: number;
  customerId: number;
  siteCode: string;
  siteId: string;
  siteName: string;
  poNo: string;
  lineNo: string;
  itemCode: string;
  itemDescription: string;
  unitPrice: number;
  requestedQuantity: number;
  invoicedPercentage: number;
}

export interface HuaweiPoUploadResponse {
  info: string;
  data: {
    jobId: string;
    customerId: number;
    filePath: string;
    recordsImported: number;
    uploadedAt: string;
    uploadedBy: string;
  };
}

// Upload Excel file and process data
export const uploadHuaweiPoExcel = async (
  jobId: string,
  customerId: number,
  file: File
): Promise<HuaweiPoUploadResponse> => {
  const formData = new FormData();
  formData.append('excel_file', file);
  formData.append('job_id', jobId);
  formData.append('customer_id', customerId.toString());

  const response = await apiClient.post<HuaweiPoUploadResponse>('/huawei-pos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Get Huawei PO data by job ID
export const getHuaweiPosByJobId = async (jobId: string): Promise<HuaweiPoData[]> => {
  const response = await apiClient.get<any[]>(`/huawei-pos/job/${jobId}`);
  
  // Transform snake_case to camelCase and ensure all required properties exist
  return response.data.map(item => ({
    id: item.id,
    customerId: item.customer_id,
    siteCode: item.site_code,
    siteId: item.site_id,
    siteName: item.site_name,
    poNo: item.po_no,
    lineNo: item.line_no,
    itemCode: item.item_code,
    itemDescription: item.item_description,
    unitPrice: parseFloat(item.unit_price) || 0,
    requestedQuantity: parseInt(item.requested_quantity) || 0,
    invoicedPercentage: parseFloat(item.invoiced_percentage) || 0,
    uploadedAt: item.uploaded_at
  }));
};

// Get file info for a job
export const getHuaweiPoFileInfo = async (jobId: string): Promise<HuaweiPoUploadResponse> => {
  const response = await apiClient.get<HuaweiPoUploadResponse>(`/huawei-pos/file-info/${jobId}`);
  return response.data;
};

// Download Excel file
export const downloadHuaweiPoFile = async (jobId: string): Promise<Blob> => {
  const response = await apiClient.get<Blob>(`/huawei-pos/download/${jobId}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Create individual Huawei PO record
export const createHuaweiPo = async (data: {
  jobId: string;
  customerId: number;
  siteCode: string;
  siteId: string;
  siteName: string;
  poNo: string;
  lineNo: string;
  itemCode: string;
  itemDescription: string;
  unitPrice: number;
  requestedQuantity: number;
}): Promise<HuaweiPoData> => {
  const response = await apiClient.post<HuaweiPoData>('/huawei-pos', data);
  return response.data;
};

// Get all Huawei POs with optional filtering
export const getAllHuaweiPos = async (params?: {
  jobId?: string;
  customerId?: number;
}): Promise<HuaweiPoData[]> => {
  const response = await apiClient.get<any[]>('/huawei-pos', { params });
  
  // Transform snake_case to camelCase and ensure all required properties exist
  return response.data.map(item => ({
    id: item.id,
    customerId: item.customer_id,
    siteCode: item.site_code,
    siteId: item.site_id,
    siteName: item.site_name,
    poNo: item.po_no,
    lineNo: item.line_no,
    itemCode: item.item_code,
    itemDescription: item.item_description,
    unitPrice: parseFloat(item.unit_price) || 0,
    requestedQuantity: parseInt(item.requested_quantity) || 0,
    invoicedPercentage: parseFloat(item.invoiced_percentage) || 0,
    uploadedAt: item.uploaded_at
  }));
};

// Delete all Huawei PO data for a specific job
export const deleteHuaweiPoByJobId = async (jobId: string): Promise<unknown> => {
  const response = await apiClient.delete<unknown>(`/huawei-pos/job/${jobId}`);
  return response.data;
};

// Update individual Huawei PO
export const updateHuaweiPo = async (id: number, poData: Partial<HuaweiPoData>): Promise<HuaweiPoData> => {
  const response = await apiClient.put<HuaweiPoData>(`/huawei-pos/${id}`, poData);
  return response.data;
};

// Delete individual Huawei PO
export const deleteHuaweiPo = async (id: number): Promise<unknown> => {
  const response = await apiClient.delete<unknown>(`/huawei-pos/${id}`);
  return response.data;
}; 