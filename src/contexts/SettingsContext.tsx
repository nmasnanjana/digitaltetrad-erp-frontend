"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSettings, SettingsData } from '@/api/settingsApi';
import { getCurrencySymbol, formatCurrency, formatCurrencyWithSpace } from '@/utils/currencyUtils';

interface SettingsContextType {
  settings: SettingsData | null;
  loading: boolean;
  currency: string;
  currencySymbol: string;
  formatCurrency: (amount: number | string | undefined) => string;
  formatCurrencyWithSpace: (amount: number | string | undefined) => string;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if loading fails
      setSettings({
        id: 1,
        currency: 'USD',
        vat_percentage: 0,
        vat_number: '',
        business_registration_number: '',
        contact_number: '',
        email: '',
        finance_email: '',
        company_name: 'Company Name',
        company_address: '',
        company_logo: '',
        bank_account: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const currency = settings?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);

  const contextValue: SettingsContextType = {
    settings,
    loading,
    currency,
    currencySymbol,
    formatCurrency: (amount: number | string | undefined) => formatCurrency(amount, currency),
    formatCurrencyWithSpace: (amount: number | string | undefined) => formatCurrencyWithSpace(amount, currency),
    refreshSettings: loadSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}; 