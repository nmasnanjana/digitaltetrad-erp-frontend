import { queryClient } from './provider';

// Cache keys for different data types
export const CACHE_KEYS = {
  // User related
  USERS: 'users',
  USER_PROFILE: 'user-profile',
  
  // Team related
  TEAMS: 'teams',
  TEAM_MEMBERS: 'team-members',
  
  // Customer related
  CUSTOMERS: 'customers',
  CUSTOMER_DETAILS: 'customer-details',
  
  // Job related
  JOBS: 'jobs',
  JOB_DETAILS: 'job-details',
  JOB_EXPENSES: 'job-expenses',
  
  // Expense related
  EXPENSES: 'expenses',
  EXPENSE_DETAILS: 'expense-details',
  EXPENSE_TYPES: 'expense-types',
  OPERATION_TYPES: 'operation-types',
  EXPENSE_DASHBOARD: 'expense-dashboard',
  
  // Inventory related
  INVENTORY: 'inventory',
  INVENTORY_ITEMS: 'inventory-items',
  
  // Invoice related
  INVOICES: 'invoices',
  INVOICE_DETAILS: 'invoice-details',
  HUAWEI_INVOICES: 'huawei-invoices',
  
  // Settings
  SETTINGS: 'settings',
  
  // Permissions
  PERMISSIONS: 'permissions',
  ROLES: 'roles',
} as const;

// Cache invalidation functions
export const invalidateCache = {
  // Invalidate all cache
  all: () => {
    queryClient.clear();
  },
  
  // Invalidate specific cache keys
  users: () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.USERS] });
  },
  
  teams: () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.TEAMS] });
  },
  
  customers: () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.CUSTOMERS] });
  },
  
  jobs: () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.JOBS] });
  },
  
  expenses: () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.EXPENSES] });
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.EXPENSE_DASHBOARD] });
  },
  
  inventory: () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.INVENTORY] });
  },
  
  invoices: () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.INVOICES] });
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.HUAWEI_INVOICES] });
  },
  
  settings: () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.SETTINGS] });
  },
  
  // Invalidate multiple related caches
  jobRelated: () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.JOBS] });
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.JOB_EXPENSES] });
  },
  
  expenseRelated: () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.EXPENSES] });
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.EXPENSE_TYPES] });
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.OPERATION_TYPES] });
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.EXPENSE_DASHBOARD] });
  },
};

// System-wide cache clear function (for developer role)
export const clearSystemCache = async () => {
  try {
    // Clear local cache
    queryClient.clear();
    
    // Send request to backend to notify other users to clear their cache
    const response = await fetch('/api/cache/clear', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      console.log('System cache cleared successfully');
    } else {
      console.error('Failed to clear system cache');
    }
  } catch (error) {
    console.error('Error clearing system cache:', error);
  }
}; 