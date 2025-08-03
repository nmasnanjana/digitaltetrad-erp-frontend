import { apiClient } from './api-client';

export interface InvoiceData {
  invoiceNo: string;
  huaweiPoId: number;
  invoicedPercentage: number;
}

export interface CreateInvoiceRequest {
  invoiceNo: string;
  invoiceData: InvoiceData[];
  vatPercentage: number;
}

export interface CreateInvoiceResponse {
  info: string;
  data: {
    createdInvoices: number;
    invoiceNo: string;
    vatPercentage: number;
  };
}

export interface InvoiceRecord {
  id: number;
  invoiceNo: string;
  huaweiPoId: number;
  invoicedPercentage: number;
  vatPercentage: number;
  vatAmount: number;
  subtotalAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  huaweiPo?: {
    id: number;
    poNo: string;
    lineNo: string;
    itemCode: string;
    itemDescription: string;
    unitPrice: number;
    requestedQuantity: number;
    invoicedPercentage: number;
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
  invoiceNo: string;
  totalRecords: number;
  totalAmount: number;
  createdAt: string;
}

// Create invoice records
export const createInvoice = async (data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> => {
  const response = await apiClient.post<CreateInvoiceResponse>('/huawei-invoices', data);
  return response.data;
};

// Get all invoices
export const getAllInvoices = async (): Promise<InvoiceRecord[]> => {
  const response = await apiClient.get<InvoiceRecord[]>('/huawei-invoices');
  return response.data;
};

// Get invoice by ID
export const getInvoiceById = async (id: number): Promise<InvoiceRecord> => {
  const response = await apiClient.get<InvoiceRecord>(`/huawei-invoices/${id}`);
  return response.data;
};

// Get invoices by invoice number
export const getInvoicesByInvoiceNo = async (invoiceNo: string): Promise<InvoiceRecord[]> => {
  const response = await apiClient.get<InvoiceRecord[]>(`/huawei-invoices/invoice/${invoiceNo}`);
  return response.data;
};

// Get unique invoice numbers (summary)
export const getInvoiceSummaries = async (): Promise<InvoiceSummary[]> => {
  const response = await apiClient.get<InvoiceSummary[]>('/huawei-invoices/summaries');
  return response.data;
};

// Delete invoice by ID
export const deleteInvoice = async (id: number): Promise<unknown> => {
  const response = await apiClient.delete<unknown>(`/huawei-invoices/${id}`);
  return response.data;
};

// Delete all invoices by invoice number
export const deleteInvoicesByInvoiceNo = async (invoiceNo: string): Promise<unknown> => {
  const response = await apiClient.delete<unknown>(`/huawei-invoices/invoice/${invoiceNo}`);
  return response.data;
}; 