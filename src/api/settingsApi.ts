import { apiClient } from './api-client';

export interface SettingsData {
  id: number;
  currency: string;
  vat_percentage: number;
  ssl_percentage: number;
  vat_number: string;
  business_registration_number: string;
  contact_number: string;
  email: string;
  finance_email: string;
  company_name: string;
  company_address: string;
  company_logo: string;
  bank_account: string;
  updated_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsData {
  currency?: string;
  vat_percentage?: number;
  ssl_percentage?: number;
  vat_number?: string;
  business_registration_number?: string;
  contact_number?: string;
  email?: string;
  finance_email?: string;
  company_name?: string;
  company_address?: string;
  company_logo?: string;
  bank_account?: string;
}

export const getSettings = () =>
  apiClient.get<SettingsData>('/settings');

export const updateSettings = (data: UpdateSettingsData) =>
  apiClient.put<SettingsData>('/settings', data);

export const resetSettings = () =>
  apiClient.post<SettingsData>('/settings/reset'); 