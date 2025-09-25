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
      id: number;
      name: string;
    };
    customer?: {
      id: number;
      name: string;
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
  
  console.log('Raw API response:', response.data);
  console.log('First invoice raw data:', response.data[0]);
  console.log('First invoice huaweiPo (camelCase):', response.data[0]?.huaweiPo);
  
  const transformedData = response.data.map(item => ({
    id: item.id,
    invoiceNo: item.invoice_no,
    huaweiPoId: item.huawei_po_id,
    invoicedPercentage: parseFloat(item.invoiced_percentage) || 0,
    vatPercentage: parseFloat(item.vat_percentage) || 0,
    vatAmount: parseFloat(item.vat_amount) || 0,
    subtotalAmount: parseFloat(item.subtotal_amount) || 0,
    totalAmount: parseFloat(item.total_amount) || 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    huaweiPo: item.huaweiPo ? {
      id: item.huaweiPo.id,
      poNo: item.huaweiPo.po_no,
      lineNo: item.huaweiPo.line_no,
      itemCode: item.huaweiPo.item_code,
      itemDescription: item.huaweiPo.item_description,
      unitPrice: parseFloat(item.huaweiPo.unit_price) || 0,
      requestedQuantity: parseInt(item.huaweiPo.requested_quantity) || 0,
      invoicedPercentage: parseFloat(item.huaweiPo.invoiced_percentage) || 0,
      job: item.huaweiPo.job ? {
        id: item.huaweiPo.job.id,
        name: item.huaweiPo.job.name
      } : undefined,
      customer: item.huaweiPo.customer ? {
        id: item.huaweiPo.customer.id,
        name: item.huaweiPo.customer.name
      } : undefined
    } : undefined
  }));
  
  console.log('Transformed invoices:', transformedData.map(item => ({
    id: item.id,
    huaweiPo: item.huaweiPo ? {
      id: item.huaweiPo.id,
      poNo: item.huaweiPo.poNo,
      job: item.huaweiPo.job,
      customer: item.huaweiPo.customer
    } : null
  })));
  
  return transformedData;
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
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    huaweiPo: item.huaweiPo ? {
      id: item.huaweiPo.id,
      poNo: item.huaweiPo.po_no,
      lineNo: item.huaweiPo.line_no,
      itemCode: item.huaweiPo.item_code,
      itemDescription: item.huaweiPo.item_description,
      unitPrice: parseFloat(item.huaweiPo.unit_price) || 0,
      requestedQuantity: parseInt(item.huaweiPo.requested_quantity) || 0,
      invoicedPercentage: parseFloat(item.huaweiPo.invoiced_percentage) || 0,
      job: item.huaweiPo.job ? {
        id: item.huaweiPo.job.id,
        name: item.huaweiPo.job.name
      } : undefined,
      customer: item.huaweiPo.customer ? {
        id: item.huaweiPo.customer.id,
        name: item.huaweiPo.customer.name
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
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    huaweiPo: item.huaweiPo ? {
      id: item.huaweiPo.id,
      poNo: item.huaweiPo.po_no,
      lineNo: item.huaweiPo.line_no,
      itemCode: item.huaweiPo.item_code,
      itemDescription: item.huaweiPo.item_description,
      unitPrice: parseFloat(item.huaweiPo.unit_price) || 0,
      requestedQuantity: parseInt(item.huaweiPo.requested_quantity) || 0,
      invoicedPercentage: parseFloat(item.huaweiPo.invoiced_percentage) || 0,
      job: item.huaweiPo.job ? {
        id: item.huaweiPo.job.id,
        name: item.huaweiPo.job.name
      } : undefined,
      customer: item.huaweiPo.customer ? {
        id: item.huaweiPo.customer.id,
        name: item.huaweiPo.customer.name
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