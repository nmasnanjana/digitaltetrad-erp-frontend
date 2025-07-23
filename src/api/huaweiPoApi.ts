import { apiClient } from './apiClient';

export interface HuaweiPoData {
  site_code: string;
  site_id: string;
  site_name: string;
  po_no: string;
  line_no: string;
  item_code: string;
  item_description: string;
  unit_price: number;
  requested_quantity: number;
}

export interface HuaweiPoUploadResponse {
  info: string;
  data: {
    job_id: string;
    customer_id: number;
    file_path: string;
    records_imported: number;
    uploaded_at: string;
    uploaded_by: string;
  };
}

// Upload Excel file and process data
export const uploadHuaweiPoExcel = async (
  job_id: string,
  customer_id: number,
  file: File
): Promise<HuaweiPoUploadResponse> => {
  const formData = new FormData();
  formData.append('excel_file', file);
  formData.append('job_id', job_id);
  formData.append('customer_id', customer_id.toString());

  const response = await apiClient.post('/huawei-pos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Get Huawei PO data by job ID
export const getHuaweiPosByJobId = async (job_id: string) => {
  const response = await apiClient.get(`/huawei-pos/job/${job_id}`);
  return response.data;
};

// Get file info for a job
export const getHuaweiPoFileInfo = async (job_id: string) => {
  const response = await apiClient.get(`/huawei-pos/file-info/${job_id}`);
  return response.data;
};

// Download Excel file
export const downloadHuaweiPoFile = async (job_id: string) => {
  const response = await apiClient.get(`/huawei-pos/download/${job_id}`, {
    responseType: 'blob',
  });
  return response.data;
};

// Create individual Huawei PO record
export const createHuaweiPo = async (data: {
  job_id: string;
  customer_id: number;
  site_code: string;
  site_id: string;
  site_name: string;
  po_no: string;
  line_no: string;
  item_code: string;
  item_description: string;
  unit_price: number;
  requested_quantity: number;
}) => {
  const response = await apiClient.post('/huawei-pos', data);
  return response.data;
};

// Get all Huawei POs with optional filtering
export const getAllHuaweiPos = async (params?: {
  job_id?: string;
  customer_id?: number;
}) => {
  const response = await apiClient.get('/huawei-pos', { params });
  return response.data;
};

// Delete all Huawei PO data for a specific job
export const deleteHuaweiPoByJobId = async (job_id: string) => {
  const response = await apiClient.delete(`/huawei-pos/job/${job_id}`);
  return response.data;
}; 