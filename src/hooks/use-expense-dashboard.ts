import { useQuery } from '@tanstack/react-query';
import { getAllExpenses } from '@/api/expense-api';
import { CACHE_KEYS } from '@/lib/react-query/cache-manager';

interface ExpenseDashboardData {
  totalExpenses: number;
  approvedExpenses: number;
  pendingExpenses: number;
  rejectedExpenses: number;
  paidExpenses: number;
  totalAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  rejectedAmount: number;
  paidAmount: number;
  // Percentage changes
  totalExpensesChange: number;
  approvedExpensesChange: number;
  pendingExpensesChange: number;
  paidExpensesChange: number;
  totalAmountChange: number;
  approvedAmountChange: number;
  pendingAmountChange: number;
  paidAmountChange: number;
  timeSeriesData: {
    date: string;
    jobAmount: number;
    operationAmount: number;
  }[];
  amountTrendData: {
    date: string;
    totalAmount: number;
  }[];
  statusDistribution: {
    status: string;
    count: number;
    percentage: number;
  }[];
  categoryData: {
    category: string;
    amount: number;
  }[];
  typeBreakdown: {
    type: string;
    amount: number;
  }[];
  operationBreakdown: {
    operationType: string;
    amount: number;
  }[];
  trendsData: {
    period: string;
    jobAmount: number;
    operationAmount: number;
  }[];
}

export const useExpenseDashboard = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: [CACHE_KEYS.EXPENSE_DASHBOARD],
    queryFn: async (): Promise<ExpenseDashboardData> => {
      const response = await getAllExpenses();
      const expenses = response.data;

      // Filter expenses for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.createdAt || expense.created_at || '');
        return expenseDate >= thirtyDaysAgo;
      });

      // Filter expenses for previous 30 days (30-60 days ago) for comparison
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const previousExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.createdAt || expense.created_at || '');
        return expenseDate >= sixtyDaysAgo && expenseDate < thirtyDaysAgo;
      });

      // Calculate current period statistics
      const totalExpenses = recentExpenses.length;
      const approvedExpenses = recentExpenses.filter(e => e.status === 'approved').length;
      const pendingExpenses = recentExpenses.filter(e => e.status === 'on_progress').length;
      const rejectedExpenses = recentExpenses.filter(e => e.status === 'denied').length;
      const paidExpenses = recentExpenses.filter(e => e.paid).length;

      // Calculate current period amounts
      const totalAmount = recentExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const approvedAmount = recentExpenses
        .filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const pendingAmount = recentExpenses
        .filter(e => e.status === 'on_progress')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const rejectedAmount = recentExpenses
        .filter(e => e.status === 'denied')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const paidAmount = recentExpenses
        .filter(e => e.paid)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      // Calculate previous period statistics
      const prevTotalExpenses = previousExpenses.length;
      const prevApprovedExpenses = previousExpenses.filter(e => e.status === 'approved').length;
      const prevPendingExpenses = previousExpenses.filter(e => e.status === 'on_progress').length;
      const prevPaidExpenses = previousExpenses.filter(e => e.paid).length;

      // Calculate previous period amounts
      const prevTotalAmount = previousExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const prevApprovedAmount = previousExpenses
        .filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const prevPendingAmount = previousExpenses
        .filter(e => e.status === 'on_progress')
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const prevPaidAmount = previousExpenses
        .filter(e => e.paid)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      // Calculate percentage changes
      const calculatePercentageChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const totalExpensesChange = calculatePercentageChange(totalExpenses, prevTotalExpenses);
      const approvedExpensesChange = calculatePercentageChange(approvedExpenses, prevApprovedExpenses);
      const pendingExpensesChange = calculatePercentageChange(pendingExpenses, prevPendingExpenses);
      const paidExpensesChange = calculatePercentageChange(paidExpenses, prevPaidExpenses);
      const totalAmountChange = calculatePercentageChange(totalAmount, prevTotalAmount);
      const approvedAmountChange = calculatePercentageChange(approvedAmount, prevApprovedAmount);
      const pendingAmountChange = calculatePercentageChange(pendingAmount, prevPendingAmount);
      const paidAmountChange = calculatePercentageChange(paidAmount, prevPaidAmount);

      // Generate time series data (last 30 days)
      const timeSeriesData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayExpenses = recentExpenses.filter(expense => {
          const expenseDate = new Date(expense.createdAt || expense.created_at || '');
          return expenseDate.toISOString().split('T')[0] === dateStr;
        });
        
        const jobAmount = dayExpenses
          .filter(e => !e.operations)
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        const operationAmount = dayExpenses
          .filter(e => e.operations)
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        
        timeSeriesData.push({
          date: dateStr,
          jobAmount,
          operationAmount
        });
      }

      // Generate amount trend data
      const amountTrendData = timeSeriesData.map(item => ({
        date: item.date,
        totalAmount: item.jobAmount + item.operationAmount
      }));

      // Generate status distribution
      const statusDistribution = [
        { status: 'Approved', count: approvedExpenses, percentage: totalExpenses > 0 ? Math.round((approvedExpenses / totalExpenses) * 100) : 0 },
        { status: 'Pending', count: pendingExpenses, percentage: totalExpenses > 0 ? Math.round((pendingExpenses / totalExpenses) * 100) : 0 },
        { status: 'Rejected', count: rejectedExpenses, percentage: totalExpenses > 0 ? Math.round((rejectedExpenses / totalExpenses) * 100) : 0 }
      ];

      // Generate category data
      const jobAmount = recentExpenses
        .filter(e => !e.operations)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const operationAmount = recentExpenses
        .filter(e => e.operations)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const categoryData = [
        { category: 'Job', amount: jobAmount },
        { category: 'Operation', amount: operationAmount }
      ];

      // Generate type breakdown
      const typeBreakdown = recentExpenses.reduce<{ type: string; amount: number }[]>((acc, expense) => {
        const type = expense.expenseType?.name || 'Unknown';
        const existing = acc.find(item => item.type === type);
        if (existing) {
          existing.amount += expense.amount || 0;
        } else {
          acc.push({ type, amount: expense.amount || 0 });
        }
        return acc;
      }, []);

      // Generate operation breakdown
      const operationBreakdown = recentExpenses
        .filter(e => e.operations && e.operationType?.name)
        .reduce<{ operationType: string; amount: number }[]>((acc, expense) => {
          const operationType = expense.operationType?.name || 'Unknown';
          const existing = acc.find(item => item.operationType === operationType);
          if (existing) {
            existing.amount += expense.amount || 0;
          } else {
            acc.push({ operationType, amount: expense.amount || 0 });
          }
          return acc;
        }, []);

      // Generate trends data (weekly)
      const trendsData = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekExpenses = recentExpenses.filter(expense => {
          const expenseDate = new Date(expense.createdAt || expense.created_at || '');
          return expenseDate >= weekStart && expenseDate <= weekEnd;
        });
        
        const weekJobAmount = weekExpenses
          .filter(e => !e.operations)
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        const weekOperationAmount = weekExpenses
          .filter(e => e.operations)
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        
        trendsData.push({
          period: `Week ${4 - i}`,
          jobAmount: weekJobAmount,
          operationAmount: weekOperationAmount
        });
      }

      return {
        totalExpenses,
        approvedExpenses,
        pendingExpenses,
        rejectedExpenses,
        paidExpenses,
        totalAmount,
        approvedAmount,
        pendingAmount,
        rejectedAmount,
        paidAmount,
        totalExpensesChange,
        approvedExpensesChange,
        pendingExpensesChange,
        paidExpensesChange,
        totalAmountChange,
        approvedAmountChange,
        pendingAmountChange,
        paidAmountChange,
        timeSeriesData,
        amountTrendData,
        statusDistribution,
        categoryData,
        typeBreakdown,
        operationBreakdown,
        trendsData
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const downloadReport = () => {
    if (!data) return;

    const reportData = {
      generatedAt: new Date().toISOString(),
      period: 'Last 30 Days',
      summary: {
        totalExpenses: data.totalExpenses,
        totalAmount: data.totalAmount,
        approvedExpenses: data.approvedExpenses,
        approvedAmount: data.approvedAmount,
        pendingExpenses: data.pendingExpenses,
        pendingAmount: data.pendingAmount,
        paidExpenses: data.paidExpenses,
        paidAmount: data.paidAmount
      },
      changes: {
        totalExpensesChange: data.totalExpensesChange,
        approvedExpensesChange: data.approvedExpensesChange,
        pendingExpensesChange: data.pendingExpensesChange,
        paidExpensesChange: data.paidExpensesChange,
        totalAmountChange: data.totalAmountChange,
        approvedAmountChange: data.approvedAmountChange,
        pendingAmountChange: data.pendingAmountChange,
        paidAmountChange: data.paidAmountChange
      },
      charts: {
        timeSeries: data.timeSeriesData,
        amountTrend: data.amountTrendData,
        statusDistribution: data.statusDistribution,
        categoryBreakdown: data.categoryData,
        typeBreakdown: data.typeBreakdown,
        operationBreakdown: data.operationBreakdown,
        trends: data.trendsData
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    data,
    loading: isLoading,
    error,
    downloadReport
  };
}; 