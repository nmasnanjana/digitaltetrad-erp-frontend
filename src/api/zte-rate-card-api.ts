import { apiClient } from './api-client';

export interface ZteRateCardData {
  id: number;
  code: string;
  item: string;
  unit: string;
  price: number;
  uploaded_at?: string;
  uploaded_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZteRateCardData {
  code: string;
  item: string;
  unit: string;
  price: number;
}

export interface UpdateZteRateCardData {
  code?: string;
  item?: string;
  unit?: string;
  price?: number;
}

export interface ZteRateCardUploadResponse {
  info: string;
  data: {
    recordsImported: number;
    extractedData: Array<{
      code: string;
      item: string;
      unit: string;
      price: number;
    }>;
  };
}

// Get all rate cards
export const getAllZteRateCards = () =>
  apiClient.get<ZteRateCardData[]>('/zte-rate-cards');

// Get rate card by ID
export const getZteRateCardById = (id: number) =>
  apiClient.get<ZteRateCardData>(`/zte-rate-cards/${id}`);

// Create new rate card
export const createZteRateCard = (data: CreateZteRateCardData) =>
  apiClient.post<ZteRateCardData>('/zte-rate-cards', data);

// Update rate card
export const updateZteRateCard = (id: number, data: UpdateZteRateCardData) =>
  apiClient.put<ZteRateCardData>(`/zte-rate-cards/${id}`, data);

// Delete rate card
export const deleteZteRateCard = (id: number) =>
  apiClient.delete(`/zte-rate-cards/${id}`);

// Delete all rate cards
export const deleteAllZteRateCards = () =>
  apiClient.delete('/zte-rate-cards');

// Upload Excel file and process data
export const uploadZteRateCardExcel = async (
  file: File
): Promise<ZteRateCardUploadResponse> => {
  const formData = new FormData();
  formData.append('excel_file', file);

  const response = await apiClient.post<ZteRateCardUploadResponse>('/zte-rate-cards/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Upload edited data directly
export const uploadZteRateCardData = async (
  data: Array<{
    code: string;
    item: string;
    unit: string;
    price: number;
  }>
): Promise<ZteRateCardUploadResponse> => {
  const response = await apiClient.post<ZteRateCardUploadResponse>('/zte-rate-cards/upload-data', data);
  return response.data;
};
