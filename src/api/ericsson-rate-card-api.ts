import { apiClient } from './api-client';

export interface EricssonRateCardData {
  id: number;
  product_code: string;
  product_description: string;
  product_rate: number;
  uploaded_at?: string;
  uploaded_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEricssonRateCardData {
  product_code: string;
  product_description: string;
  product_rate: number;
}

export interface UpdateEricssonRateCardData {
  product_code?: string;
  product_description?: string;
  product_rate?: number;
}

export interface EricssonRateCardUploadResponse {
  info: string;
  data: {
    recordsImported: number;
    extractedData: Array<{
      product_code: string;
      product_description: string;
      product_rate: number;
    }>;
  };
}

// Get all rate cards
export const getAllEricssonRateCards = () =>
  apiClient.get<EricssonRateCardData[]>('/ericsson-rate-cards');

// Get rate card by ID
export const getEricssonRateCardById = (id: number) =>
  apiClient.get<EricssonRateCardData>(`/ericsson-rate-cards/${id}`);

// Create new rate card
export const createEricssonRateCard = (data: CreateEricssonRateCardData) =>
  apiClient.post<EricssonRateCardData>('/ericsson-rate-cards', data);

// Update rate card
export const updateEricssonRateCard = (id: number, data: UpdateEricssonRateCardData) =>
  apiClient.put<EricssonRateCardData>(`/ericsson-rate-cards/${id}`, data);

// Delete rate card
export const deleteEricssonRateCard = (id: number) =>
  apiClient.delete(`/ericsson-rate-cards/${id}`);

// Delete all rate cards
export const deleteAllEricssonRateCards = () =>
  apiClient.delete('/ericsson-rate-cards');

// Upload Excel file and process data
export const uploadEricssonRateCardExcel = async (
  file: File
): Promise<EricssonRateCardUploadResponse> => {
  const formData = new FormData();
  formData.append('excel_file', file);

  const response = await apiClient.post<EricssonRateCardUploadResponse>('/ericsson-rate-cards/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Upload edited data directly
export const uploadEricssonRateCardData = async (
  data: Array<{
    product_code: string;
    product_description: string;
    product_rate: number;
  }>
): Promise<EricssonRateCardUploadResponse> => {
  const response = await apiClient.post<EricssonRateCardUploadResponse>('/ericsson-rate-cards/upload-data', data);
  return response.data;
}; 