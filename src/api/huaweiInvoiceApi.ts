import { apiClient } from './apiClient';

export interface InvoiceData {
  po_no: string;
  line_no: string;
  percentage: number;
}

export interface AvailablePercentageResponse {
  po_no: string;
  line_no: string;
  total_invoiced: number;
  available_percentage: number;
  can_invoice: boolean;
}

export interface CreateInvoiceRequest {
  customer_id: number;
  invoice_data: InvoiceData[];
}

export interface CreateInvoiceResponse {
  info: string;
  data: {
    created_invoices: number;
    warnings?: string[];
  };
}

export interface InvoiceRecord {
  id: number;
  customer_id: number;
  po_no: string;
  line_no: string;
  percentage: number;
  created_by: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: number;
    name: string;
  };
  creator?: {
    firstName: string;
    lastName: string;
    username: string;
  };
}

// Get available percentage for PO/Line combination for a customer
export const getAvailablePercentage = async (
  customer_id: number,
  po_no: string,
  line_no: string
): Promise<AvailablePercentageResponse> => {
  const response = await apiClient.get(`/huawei-invoices/available-percentage/${customer_id}/${po_no}/${line_no}`);
  return response.data;
};

// Create invoice records for a customer
export const createInvoice = async (data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> => {
  const response = await apiClient.post('/huawei-invoices/create', data);
  return response.data;
};

// Get all invoices for a customer
export const getCustomerInvoices = async (customer_id: number): Promise<InvoiceRecord[]> => {
  const response = await apiClient.get(`/huawei-invoices/customer/${customer_id}`);
  return response.data;
};

// Delete a specific invoice
export const deleteInvoice = async (id: number) => {
  const response = await apiClient.delete(`/huawei-invoices/${id}`);
  return response.data;
};

// Delete all invoices for a customer
export const deleteAllCustomerInvoices = async (customer_id: number) => {
  const response = await apiClient.delete(`/huawei-invoices/customer/${customer_id}`);
  return response.data;
}; 