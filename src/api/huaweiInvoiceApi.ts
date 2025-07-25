import { apiClient } from './apiClient';

export interface InvoiceData {
  invoice_no: string;
  huawei_po_id: number;
  invoiced_percentage: number;
}

export interface CreateInvoiceRequest {
  invoice_no: string;
  invoice_data: InvoiceData[];
}

export interface CreateInvoiceResponse {
  info: string;
  data: {
    created_invoices: number;
    invoice_no: string;
  };
}

export interface InvoiceRecord {
  id: number;
  invoice_no: string;
  huawei_po_id: number;
  invoiced_percentage: number;
  createdAt: string;
  updatedAt: string;
  huaweiPo?: {
    id: number;
    po_no: string;
    line_no: string;
    item_code: string;
    item_description: string;
    unit_price: number;
    requested_quantity: number;
    invoiced_percentage: number;
    job?: {
      id: string;
      name: string;
      customer?: {
        id: string;
        name: string;
      };
    };
  };
}

export interface InvoiceSummary {
  invoice_no: string;
  total_records: number;
  total_amount: number;
  created_at: string;
}

// Create invoice records
export const createInvoice = async (data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> => {
  const response = await apiClient.post('/huawei-invoices', data);
  return response.data;
};

// Get all invoices
export const getAllInvoices = async (): Promise<InvoiceRecord[]> => {
  const response = await apiClient.get('/huawei-invoices');
  return response.data;
};

// Get invoice by ID
export const getInvoiceById = async (id: number): Promise<InvoiceRecord> => {
  const response = await apiClient.get(`/huawei-invoices/${id}`);
  return response.data;
};

// Get invoices by invoice number
export const getInvoicesByInvoiceNo = async (invoice_no: string): Promise<InvoiceRecord[]> => {
  const response = await apiClient.get(`/huawei-invoices/invoice/${invoice_no}`);
  return response.data;
};

// Get unique invoice numbers (summary)
export const getInvoiceSummaries = async (): Promise<InvoiceSummary[]> => {
  const response = await apiClient.get('/huawei-invoices/summaries');
  return response.data;
};

// Delete invoice by ID
export const deleteInvoice = async (id: number) => {
  const response = await apiClient.delete(`/huawei-invoices/${id}`);
  return response.data;
};

// Delete all invoices by invoice number
export const deleteInvoicesByInvoiceNo = async (invoice_no: string) => {
  const response = await apiClient.delete(`/huawei-invoices/invoice/${invoice_no}`);
  return response.data;
}; 