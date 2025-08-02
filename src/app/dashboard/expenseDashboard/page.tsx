'use client';

import * as React from 'react';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { ExpenseStats } from '@/components/dashboard/expense/expense-stats';
import { ExpenseAmounts } from '@/components/dashboard/expense/expense-amounts';
import { ExpenseTimeChart } from '@/components/dashboard/expense/expense-time-chart';
import { ExpenseStatusDistribution } from '@/components/dashboard/expense/expense-status-distribution';
import { ExpenseCategories } from '@/components/dashboard/expense/expense-categories';
import { ExpenseTypeBreakdown } from '@/components/dashboard/expense/expense-type-breakdown';
import { ExpenseOperationBreakdown } from '@/components/dashboard/expense/expense-operation-breakdown';
import { ExpenseTrends } from '@/components/dashboard/expense/expense-trends';
import { ExpenseAmountTrend } from '@/components/dashboard/expense/expense-amount-trend';
import { useExpenseDashboard } from '@/hooks/use-expense-dashboard';

export default function Page(): React.JSX.Element {
  const { data, loading, error } = useExpenseDashboard();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading expense dashboard...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error loading expense dashboard: {error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Download Button */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={3}
        sx={{ mb: 3 }}
      >
        <Stack spacing={1}>
          <Typography variant="h4">
            Expense Overview
          </Typography>
          <Typography
            color="text.secondary"
            variant="body2"
          >
            Comprehensive expense analytics and insights for the last 30 days
          </Typography>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        {/* First Row - Expense Counts */}
        <Grid lg={3} sm={6} xs={12}>
          <ExpenseStats
            title="Total Expenses"
            value={data?.totalExpenses || 0}
            trend={(data?.totalExpensesChange || 0) >= 0 ? "up" : "down"}
            diff={Math.abs(data?.totalExpensesChange || 0)}
            sx={{ height: '100%' }}
          />
        </Grid>

        <Grid lg={3} sm={6} xs={12}>
          <ExpenseStats
            title="Approved Expenses"
            value={data?.approvedExpenses || 0}
            trend={(data?.approvedExpensesChange || 0) >= 0 ? "up" : "down"}
            diff={Math.abs(data?.approvedExpensesChange || 0)}
            sx={{ height: '100%' }}
            color="success"
          />
        </Grid>

        <Grid lg={3} sm={6} xs={12}>
          <ExpenseStats
            title="Pending Expenses"
            value={data?.pendingExpenses || 0}
            trend={(data?.pendingExpensesChange || 0) >= 0 ? "up" : "down"}
            diff={Math.abs(data?.pendingExpensesChange || 0)}
            sx={{ height: '100%' }}
            color="warning"
          />
        </Grid>

        <Grid lg={3} sm={6} xs={12}>
          <ExpenseStats
            title="Paid Expenses"
            value={data?.paidExpenses || 0}
            trend={(data?.paidExpensesChange || 0) >= 0 ? "up" : "down"}
            diff={Math.abs(data?.paidExpensesChange || 0)}
            sx={{ height: '100%' }}
            color="info"
          />
        </Grid>

        {/* Second Row - Expense Amounts */}
        <Grid lg={3} sm={6} xs={12}>
          <ExpenseAmounts
            title="Total Amount"
            value={data?.totalAmount || 0}
            trend={(data?.totalAmountChange || 0) >= 0 ? "up" : "down"}
            diff={Math.abs(data?.totalAmountChange || 0)}
            sx={{ height: '100%' }}
          />
        </Grid>

        <Grid lg={3} sm={6} xs={12}>
          <ExpenseAmounts
            title="Approved Amount"
            value={data?.approvedAmount || 0}
            trend={(data?.approvedAmountChange || 0) >= 0 ? "up" : "down"}
            diff={Math.abs(data?.approvedAmountChange || 0)}
            sx={{ height: '100%' }}
            color="success"
          />
        </Grid>

        <Grid lg={3} sm={6} xs={12}>
          <ExpenseAmounts
            title="Pending Amount"
            value={data?.pendingAmount || 0}
            trend={(data?.pendingAmountChange || 0) >= 0 ? "up" : "down"}
            diff={Math.abs(data?.pendingAmountChange || 0)}
            sx={{ height: '100%' }}
            color="warning"
          />
        </Grid>

        <Grid lg={3} sm={6} xs={12}>
          <ExpenseAmounts
            title="Paid Amount"
            value={data?.paidAmount || 0}
            trend={(data?.paidAmountChange || 0) >= 0 ? "up" : "down"}
            diff={Math.abs(data?.paidAmountChange || 0)}
            sx={{ height: '100%' }}
            color="info"
          />
        </Grid>

        {/* Third Row - Charts */}
        <Grid lg={8} xs={12}>
          <ExpenseTrends
            data={data?.trendsData || []}
            sx={{ height: '100%' }}
          />
        </Grid>

        <Grid lg={4} md={6} xs={12}>
          <ExpenseStatusDistribution
            data={data?.statusDistribution || []}
            sx={{ height: '100%' }}
          />
        </Grid>

        {/* Fourth Row - Additional Charts */}
        <Grid lg={4} xs={12}>
          <ExpenseCategories
            data={data?.categoryData || []}
            sx={{ height: '100%' }}
          />
        </Grid>

        <Grid lg={4} xs={12}>
          <ExpenseTypeBreakdown
            data={data?.typeBreakdown || []}
            sx={{ height: '100%' }}
          />
        </Grid>

        <Grid lg={4} xs={12}>
          <ExpenseOperationBreakdown
            data={data?.operationBreakdown || []}
            sx={{ height: '100%' }}
          />
        </Grid>

        {/* Fifth Row - 30-Day Trends (Full Width) */}
        <Grid xs={12}>
          <ExpenseTimeChart
            data={data?.timeSeriesData || []}
            sx={{ height: '100%' }}
          />
        </Grid>

        {/* Sixth Row - Total Amount Trend (Full Width) */}
        <Grid xs={12}>
          <ExpenseAmountTrend
            data={data?.amountTrendData || []}
            sx={{ height: '100%' }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
