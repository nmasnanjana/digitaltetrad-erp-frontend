// Centralized currency utility functions
export const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case 'LKR':
      return 'LKR';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'AED':
      return 'د.إ';
    case 'SAR':
      return 'ر.س';
    case 'QAR':
      return 'ر.ق';
    case 'KWD':
      return 'د.ك';
    case 'BHD':
      return 'د.ب';
    case 'OMR':
      return 'ر.ع';
    default:
      return currency;
  }
};

export const formatCurrency = (amount: number | string | undefined, currency = 'USD'): string => {
  const symbol = getCurrencySymbol(currency);
  
  // Handle different input types
  let numericAmount: number;
  
  if (typeof amount === 'number') {
    numericAmount = amount;
  } else if (typeof amount === 'string') {
    numericAmount = parseFloat(amount) || 0;
  } else if (amount === undefined || amount === null) {
    numericAmount = 0;
  } else {
    numericAmount = 0;
  }
  
  return `${symbol} ${numericAmount.toFixed(2)}`;
};

export const formatCurrencyWithSpace = (amount: number | string | undefined, currency = 'USD'): string => {
  const symbol = getCurrencySymbol(currency);
  
  // Handle different input types
  let numericAmount: number;
  
  if (typeof amount === 'number') {
    numericAmount = amount;
  } else if (typeof amount === 'string') {
    numericAmount = parseFloat(amount) || 0;
  } else if (amount === undefined || amount === null) {
    numericAmount = 0;
  } else {
    numericAmount = 0;
  }
  
  return `${symbol} ${numericAmount.toFixed(2)}`;
};

// Hook to get current currency from settings
export const useCurrency = () => {
  // This will be used with a context or settings hook
  // For now, we'll use a default
  return {
    currency: 'USD',
    symbol: getCurrencySymbol('USD'),
    format: (amount: number) => formatCurrency(amount, 'USD'),
    formatWithSpace: (amount: number) => formatCurrencyWithSpace(amount, 'USD')
  };
}; 