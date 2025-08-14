import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllExpenses, getExpenseById, createExpense, updateExpense, deleteExpense } from '@/api/expense-api';
import { CACHE_KEYS, invalidateCache } from '@/lib/react-query/cache-manager';
import type { Expense } from '@/types/expense';

// Hook to get all expenses with caching
export const useExpenses = () => {
  return useQuery({
    queryKey: [CACHE_KEYS.EXPENSES],
    queryFn: async () => {
      const response = await getAllExpenses();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get expense by ID with caching
export const useExpense = (id: string) => {
  return useQuery({
    queryKey: [CACHE_KEYS.EXPENSE_DETAILS, id],
    queryFn: async () => {
      const response = await getExpenseById(id);
      return response.data;
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook to create expense with automatic cache invalidation
export const useCreateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      // Invalidate and refetch expenses
      invalidateCache.expenses();
      // Also invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.EXPENSE_DASHBOARD] });
    },
  });
};

// Hook to update expense with automatic cache invalidation
export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) => updateExpense(id, data),
    onSuccess: (data, variables) => {
      // Invalidate expenses cache
      invalidateCache.expenses();
      // Update specific expense in cache
      queryClient.setQueryData([CACHE_KEYS.EXPENSE_DETAILS, variables.id], data.data);
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.EXPENSE_DASHBOARD] });
    },
  });
};

// Hook to delete expense with automatic cache invalidation
export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: (data, variables) => {
      // Invalidate expenses cache
      invalidateCache.expenses();
      // Remove specific expense from cache
      queryClient.removeQueries({ queryKey: [CACHE_KEYS.EXPENSE_DETAILS, variables] });
      // Invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.EXPENSE_DASHBOARD] });
    },
  });
}; 