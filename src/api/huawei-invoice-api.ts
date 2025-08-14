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
  // Transform camelCase to snake_case for backend
  const transformedData = {
    invoice_no: data.invoiceNo,
    invoice_data: data.invoiceData.map(item => ({
      huawei_po_id: item.huaweiPoId,
      invoiced_percentage: item.invoicedPercentage
    })),
    vat_percentage: data.vatPercentage
  };
  
  const response = await apiClient.post<CreateInvoiceResponse>('/huawei-invoices', transformedData);
  return response.data;
};

// Get all invoices
export const getAllInvoices = async (): Promise<InvoiceRecord[]> => {
  const response = await apiClient.get<any[]>('/huawei-invoices');
  
  // Transform snake_case to camelCase
  return response.data.map(item => ({
    id: item.id,
    invoiceNo: item.invoice_no,
    huaweiPoId: item.huawei_po_id,
    invoicedPercentage: parseFloat(item.invoiced_percentage) || 0,
    vatPercentage: parseFloat(item.vat_percentage) || 0,
    vatAmount: parseFloat(item.vat_amount) || 0,
    subtotalAmount: parseFloat(item.subtotal_amount) || 0,
    totalAmount: parseFloat(item.total_amount) || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    huaweiPo: item.huawei_po ? {
      id: item.huawei_po.id,
      poNo: item.huawei_po.po_no,
      lineNo: item.huawei_po.line_no,
      itemCode: item.huawei_po.item_code,
      itemDescription: item.huawei_po.item_description,
      unitPrice: parseFloat(item.huawei_po.unit_price) || 0,
      requestedQuantity: parseInt(item.huawei_po.requested_quantity) || 0,
      invoicedPercentage: parseFloat(item.huawei_po.invoiced_percentage) || 0,
      job: item.huawei_po.job ? {
        id: item.huawei_po.job.id,
        name: item.huawei_po.job.name,
        customer: item.huawei_po.job.customer ? {
          id: item.huawei_po.job.customer.id,
          name: item.huawei_po.job.customer.name
        } : undefined
      } : undefined
    } : undefined
  }));
};

// Get invoice by ID
export const getInvoiceById = async (id: number): Promise<InvoiceRecord> => {
  const response = await apiClient.get<any>(`/huawei-invoices/${id}`);
  
  const item = response.data;
  // Transform snake_case to camelCase
  return {
    id: item.id,
    invoiceNo: item.invoice_no,
    huaweiPoId: item.huawei_po_id,
    invoicedPercentage: parseFloat(item.invoiced_percentage) || 0,
    vatPercentage: parseFloat(item.vat_percentage) || 0,
    vatAmount: parseFloat(item.vat_amount) || 0,
    subtotalAmount: parseFloat(item.subtotal_amount) || 0,
    totalAmount: parseFloat(item.total_amount) || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    huaweiPo: item.huawei_po ? {
      id: item.huawei_po.id,
      poNo: item.huawei_po.po_no,
      lineNo: item.huawei_po.line_no,
      itemCode: item.huawei_po.item_code,
      itemDescription: item.huawei_po.item_description,
      unitPrice: parseFloat(item.huawei_po.unit_price) || 0,
      requestedQuantity: parseInt(item.huawei_po.requested_quantity) || 0,
      invoicedPercentage: parseFloat(item.huawei_po.invoiced_percentage) || 0,
      job: item.huawei_po.job ? {
        id: item.huawei_po.job.id,
        name: item.huawei_po.job.name,
        customer: item.huawei_po.job.customer ? {
          id: item.huawei_po.job.customer.id,
          name: item.huawei_po.job.customer.name
        } : undefined
      } : undefined
    } : undefined
  };
};

// Get invoices by invoice number
export const getInvoicesByInvoiceNo = async (invoiceNo: string): Promise<InvoiceRecord[]> => {
  const response = await apiClient.get<any[]>(`/huawei-invoices/invoice/${invoiceNo}`);
  
  // Transform snake_case to camelCase
  return response.data.map(item => ({
    id: item.id,
    invoiceNo: item.invoice_no,
    huaweiPoId: item.huawei_po_id,
    invoicedPercentage: parseFloat(item.invoiced_percentage) || 0,
    vatPercentage: parseFloat(item.vat_percentage) || 0,
    vatAmount: parseFloat(item.vat_amount) || 0,
    subtotalAmount: parseFloat(item.subtotal_amount) || 0,
    totalAmount: parseFloat(item.total_amount) || 0,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    huaweiPo: item.huawei_po ? {
      id: item.huawei_po.id,
      poNo: item.huawei_po.po_no,
      lineNo: item.huawei_po.line_no,
      itemCode: item.huawei_po.item_code,
      itemDescription: item.huawei_po.item_description,
      unitPrice: parseFloat(item.huawei_po.unit_price) || 0,
      requestedQuantity: parseInt(item.huawei_po.requested_quantity) || 0,
      invoicedPercentage: parseFloat(item.huawei_po.invoiced_percentage) || 0,
      job: item.huawei_po.job ? {
        id: item.huawei_po.job.id,
        name: item.huawei_po.job.name,
        customer: item.huawei_po.job.customer ? {
          id: item.huawei_po.job.customer.id,
          name: item.huawei_po.job.customer.name
        } : undefined
      } : undefined
    } : undefined
  }));
};

// Get unique invoice numbers (summary)
export const getInvoiceSummaries = async (): Promise<InvoiceSummary[]> => {
  const response = await apiClient.get<any[]>('/huawei-invoices/summaries');
  
  // Transform snake_case to camelCase
  return response.data.map(item => ({
    invoiceNo: item.invoice_no,
    totalRecords: parseInt(item.total_records) || 0,
    totalAmount: parseFloat(item.total_amount) || 0,
    createdAt: item.created_at
  }));
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