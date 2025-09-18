import axios from 'axios';

const API = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4575/api',
    withCredentials: true,
});

// Add request interceptor to include token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Add error handling
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: unknown } };
            if (axiosError.response?.data) {
                return Promise.reject(new Error(`API Error: ${JSON.stringify(axiosError.response.data)}`));
            }
        }
        
        if (error && typeof error === 'object' && 'request' in error) {
            return Promise.reject(new Error('No response received from server'));
        }
        
        return Promise.reject(new Error(error instanceof Error ? error.message : 'Unknown error occurred'));
    }
);

export interface EricssonInvoiceData {
    id?: number;
    invoice_number: string;
    job_id: string;
    job_title: string;
    customer_name: string;
    customer_address: string;
    project: string;
    site_id: string;
    site_name: string;
    purchase_order_number: string;
    subtotal: number;
    vat_amount: number;
    ssl_amount: number;
    total_amount: number;
    vat_percentage: number;
    ssl_percentage: number;
    items?: any[];
    created_by?: string;
    created_at?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateEricssonInvoiceRequest {
    invoice_number: string;
    job_id: string;
    job_title: string;
    customer_name: string;
    customer_address: string;
    project: string;
    site_id: string;
    site_name: string;
    purchase_order_number: string;
    subtotal: number;
    vat_amount: number;
    ssl_amount: number;
    total_amount: number;
    vat_percentage: number;
    ssl_percentage: number;
    items: any[];
}

export const createEricssonInvoice = (data: CreateEricssonInvoiceRequest): Promise<{ data: EricssonInvoiceData }> =>
    API.post<{ success: boolean; message: string; data: EricssonInvoiceData }>('/ericsson-invoices', data)
        .then(response => ({ data: response.data.data }));

export const getAllEricssonInvoices = (): Promise<{ data: EricssonInvoiceData[] }> =>
    API.get<{ success: boolean; data: EricssonInvoiceData[] }>('/ericsson-invoices')
        .then(response => ({ data: response.data.data }));

export const getEricssonInvoiceById = (id: string): Promise<{ data: EricssonInvoiceData }> =>
    API.get<{ success: boolean; data: EricssonInvoiceData }>(`/ericsson-invoices/${id}`)
        .then(response => ({ data: response.data.data }));

export const getEricssonInvoicesByJobId = (jobId: string): Promise<{ data: EricssonInvoiceData[] }> =>
    API.get<{ success: boolean; data: EricssonInvoiceData[] }>(`/ericsson-invoices/job/${jobId}`)
        .then(response => ({ data: response.data.data }));

export const deleteEricssonInvoice = (id: string): Promise<{ data: unknown }> =>
    API.delete<{ success: boolean; message: string }>(`/ericsson-invoices/${id}`)
        .then(response => ({ data: response.data })); 