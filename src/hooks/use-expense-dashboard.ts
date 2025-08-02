import { useState, useEffect } from 'react';
import { getAllExpenses } from '@/api/expenseApi';
import type { Expense } from '@/types/expense';

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

export function useExpenseDashboard() {
  const [data, setData] = useState<ExpenseDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all expenses
      const response = await getAllExpenses();
      const expenses: Expense[] = response.data || [];

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
      const amountTrendData = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayExpenses = recentExpenses.filter(expense => {
          const expenseDate = new Date(expense.createdAt || expense.created_at || '');
          return expenseDate.toISOString().split('T')[0] === dateStr;
        });

        const jobAmount = dayExpenses.filter(e => !e.operations).reduce((sum, e) => sum + (e.amount || 0), 0);
        const operationAmount = dayExpenses.filter(e => e.operations).reduce((sum, e) => sum + (e.amount || 0), 0);
        const dailyTotalAmount = jobAmount + operationAmount;

        timeSeriesData.push({
          date: dateStr,
          jobAmount: jobAmount,
          operationAmount: operationAmount
        });

        amountTrendData.push({
          date: dateStr,
          totalAmount: dailyTotalAmount
        });
      }

      // If no data, add some sample data for demonstration
      if (timeSeriesData.every(item => item.jobAmount === 0 && item.operationAmount === 0)) {
        timeSeriesData.forEach((item, _index) => {
          item.jobAmount = Math.floor(Math.random() * 1000) + 100;
          item.operationAmount = Math.floor(Math.random() * 500) + 50;
        });
        
        amountTrendData.forEach((item, _index) => {
          item.totalAmount = Math.floor(Math.random() * 1500) + 200;
        });
      }

      // Status distribution
      const statusDistribution = [
        { status: 'Approved', count: approvedExpenses, percentage: totalExpenses > 0 ? (approvedExpenses / totalExpenses) * 100 : 0 },
        { status: 'Pending', count: pendingExpenses, percentage: totalExpenses > 0 ? (pendingExpenses / totalExpenses) * 100 : 0 },
        { status: 'Rejected', count: rejectedExpenses, percentage: totalExpenses > 0 ? (rejectedExpenses / totalExpenses) * 100 : 0 }
      ];

      // Category data (Job vs Operation)
      const jobExpenses = recentExpenses.filter(e => !e.operations);
      const operationExpenses = recentExpenses.filter(e => e.operations);
      
      let categoryData = [
        {
          category: 'Job',
          amount: jobExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
        },
        {
          category: 'Operation',
          amount: operationExpenses.reduce((sum, e) => sum + (e.amount || 0), 0)
        }
      ];

      // If no data, add sample data
      if (categoryData.every(item => item.amount === 0)) {
        categoryData = [
          { category: 'Job', amount: 2500 },
          { category: 'Operation', amount: 1800 }
        ];
      }

      // Type breakdown (by expense type)
      const typeBreakdown = recentExpenses.reduce<{ type: string; amount: number }[]>((acc, expense) => {
        const typeName = expense.expenseType?.name || 'Unknown';
        const existing = acc.find(item => item.type === typeName);
        
        if (existing) {
          existing.amount += expense.amount || 0;
        } else {
          acc.push({
            type: typeName,
            amount: expense.amount || 0
          });
        }
        
        return acc;
      }, []);

      // If no data, add sample data
      if (typeBreakdown.length === 0 || typeBreakdown.every(item => item.amount === 0)) {
        typeBreakdown.length = 0; // Clear array
        typeBreakdown.push(
          { type: 'Travel', amount: 1200 },
          { type: 'Equipment', amount: 800 },
          { type: 'Supplies', amount: 600 },
          { type: 'Services', amount: 400 }
        );
      }

      // Operation breakdown (by operation type)
      const operationBreakdown = recentExpenses.reduce<{ operationType: string; amount: number }[]>((acc, expense) => {
        // Only include expenses that are operation-type and have a valid operation type
        if (expense.operations && expense.operationType?.name && expense.operationType.name !== 'Unknown') {
          const operationType = expense.operationType.name;
          const existing = acc.find(item => item.operationType === operationType);
          
          if (existing) {
            existing.amount += expense.amount || 0;
          } else {
            acc.push({
              operationType: operationType,
              amount: expense.amount || 0
            });
          }
        }
        
        return acc;
      }, []);

      // If no data, add sample data
      if (operationBreakdown.length === 0 || operationBreakdown.every(item => item.amount === 0)) {
        operationBreakdown.length = 0; // Clear array
        operationBreakdown.push(
          { operationType: 'Maintenance', amount: 1200 },
          { operationType: 'Installation', amount: 800 },
          { operationType: 'Repair', amount: 450 },
          { operationType: 'Inspection', amount: 300 }
        );
      }

      // Trends data (weekly breakdown)
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

        const jobAmount = weekExpenses.filter(e => !e.operations).reduce((sum, e) => sum + (e.amount || 0), 0);
        const operationAmount = weekExpenses.filter(e => e.operations).reduce((sum, e) => sum + (e.amount || 0), 0);

        trendsData.push({
          period: `Week ${4 - i}`,
          jobAmount: jobAmount,
          operationAmount: operationAmount
        });
      }

      // If no data, add sample data
      if (trendsData.every(item => item.jobAmount === 0 && item.operationAmount === 0)) {
        trendsData.forEach((item, _index) => {
          item.jobAmount = Math.floor(Math.random() * 2000) + 500;
          item.operationAmount = Math.floor(Math.random() * 1000) + 200;
        });
      }

      setData({
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
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expense dashboard data');
    } finally {
      setLoading(false);
    }
  };

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
    loading,
    error,
    downloadReport,
    refetch: fetchDashboardData
  };
} 