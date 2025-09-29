import { apiClient } from './api-client';

export interface ZteInvoiceData {
  id: number;
  invoice_no: string;
  zte_po_id: number;
  vat_percentage: number;
  vat_amount: number;
  subtotal_amount: number;
  total_amount: number;
  createdAt?: string;
  updatedAt?: string;
  ztePo?: {
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
    description: string;
    is_invoiced: boolean;
    job?: {
      id: string;
      name: string;
      customer?: {
        id: number;
        name: string;
      };
    };
  };
}

export interface CreateZteInvoiceRequest {
  invoice_no: string;
  invoice_data: Array<{
    zte_po_id: number;
  }>;
  vat_percentage: number;
}

export interface ZteInvoiceResponse {
  success: boolean;
  message: string;
  created_invoices: number;
  errors?: string[];
}

export interface ZteInvoiceListResponse {
  success: boolean;
  data: ZteInvoiceData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ZteInvoiceSummaryResponse {
  success: boolean;
  data: {
    invoice_no: string;
    summary: ZteInvoiceData[];
    totals: {
      subtotal: number;
      vat: number;
      total: number;
    };
    count: number;
  };
}

// Create ZTE invoice
export const createZteInvoice = async (data: CreateZteInvoiceRequest): Promise<ZteInvoiceResponse> => {
  const response = await apiClient.post('/zte-invoices', data);
  return response.data;
};

// Get all ZTE invoices with pagination
export const getAllZteInvoices = async (page: number = 1, limit: number = 10): Promise<ZteInvoiceListResponse> => {
  const response = await apiClient.get(`/zte-invoices?page=${page}&limit=${limit}`);
  return response.data;
};

// Get ZTE invoice by ID
export const getZteInvoiceById = async (id: number): Promise<{ success: boolean; data: ZteInvoiceData }> => {
  const response = await apiClient.get(`/zte-invoices/${id}`);
  return response.data;
};

// Get ZTE invoices by invoice number
export const getZteInvoicesByInvoiceNumber = async (invoiceNo: string): Promise<{ success: boolean; data: ZteInvoiceData[] }> => {
  const response = await apiClient.get(`/zte-invoices/invoice/${invoiceNo}`);
  return response.data;
};

// Get ZTE invoice summary by invoice number
export const getZteInvoiceSummary = async (invoiceNo: string): Promise<ZteInvoiceSummaryResponse> => {
  const response = await apiClient.get(`/zte-invoices/summary/${invoiceNo}`);
  return response.data;
};

// Delete ZTE invoice by ID
export const deleteZteInvoice = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/zte-invoices/${id}`);
  return response.data;
};

