import { apiClient } from './api-client';

export interface EricssonBoqData {
  id: number;
  job_id: string;
  project: string;
  site_id: string;
  site_name: string;
  purchase_order_number: string;
  uploaded_at?: string;
  uploaded_by?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: EricssonBoqItemData[];
  removeMaterials?: EricssonBoqRemoveMaterialData[];
  surplusMaterials?: EricssonBoqSurplusMaterialData[];
}

export interface EricssonBoqItemData {
  id: number;
  boq_id: number;
  service_number: string;
  item_description: string;
  uom: string;
  qty: number;
  unit_price: number;
  total_amount: number;
  is_additional_work: boolean;
  rate_card_id?: number | null;
  invoiced_percentage: number;
  uploaded_at?: string;
  uploaded_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EricssonBoqRemoveMaterialData {
  id: number;
  boq_id: number;
  sl_no: string;
  material_description: string;
  qty: string;
  remarks?: string;
  uploaded_at?: string;
  uploaded_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EricssonBoqSurplusMaterialData {
  id: number;
  boq_id: number;
  sl_no: string;
  material_description: string;
  qty: string;
  remarks?: string;
  uploaded_at?: string;
  uploaded_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EricssonBoqUploadResponse {
  info: string;
  data: {
    boq: EricssonBoqData;
    items: EricssonBoqItemData[];
    removeMaterials: EricssonBoqRemoveMaterialData[];
    surplusMaterials: EricssonBoqSurplusMaterialData[];
  };
}

// Get BOQ by job ID
export const getEricssonBoqByJobId = (jobId: string) =>
  apiClient.get<EricssonBoqData>(`/ericsson-boqs/job/${jobId}`);

// Get BOQ items by BOQ ID
export const getEricssonBoqItems = (boqId: number) =>
  apiClient.get<EricssonBoqItemData[]>(`/ericsson-boqs/${boqId}/items`);

// Get BOQ remove materials by BOQ ID
export const getEricssonBoqRemoveMaterials = (boqId: number) =>
  apiClient.get<EricssonBoqRemoveMaterialData[]>(`/ericsson-boqs/${boqId}/remove-materials`);

// Get BOQ surplus materials by BOQ ID
export const getEricssonBoqSurplusMaterials = (boqId: number) =>
  apiClient.get<EricssonBoqSurplusMaterialData[]>(`/ericsson-boqs/${boqId}/surplus-materials`);

// Upload Excel file and process BOQ data
export const uploadEricssonBoqExcel = async (
  file: File,
  jobId: string
): Promise<EricssonBoqUploadResponse> => {
  const formData = new FormData();
  formData.append('excel_file', file);
  formData.append('job_id', jobId);

  const response = await apiClient.post<EricssonBoqUploadResponse>('/ericsson-boqs/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

// Delete BOQ by job ID
export const deleteEricssonBoqByJobId = (jobId: string) =>
  apiClient.delete(`/ericsson-boqs/job/${jobId}`); 