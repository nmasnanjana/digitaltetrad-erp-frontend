'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Container,
  Stack,
  Typography,
  Grid,
  Alert,
} from '@mui/material';
import { getAllExpenses } from '@/api/expenseApi';
import { Expense } from '@/types/expense';

export default function ExpenseDashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllExpenses();
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError(error instanceof Error ? error.message : 'Failed to load expenses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary statistics
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const approvedCount = expenses.filter(e => e.status === 'approved').length;
  const paidCount = expenses.filter(e => e.paid).length;

  // Calculate monthly totals
  const monthlyTotals = expenses.reduce((acc, expense) => {
    const month = new Date(expense.created_at).toLocaleString('default', { month: 'long' });
    acc[month] = (acc[month] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8,
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h4">
              Expense Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Overview of all expenses and their status
            </Typography>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Expenses
                </Typography>
                <Typography variant="h4">
                  {totalExpenses}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Total Amount
                </Typography>
                <Typography variant="h4">
                  ${totalAmount.toFixed(2)}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Pending Approval
                </Typography>
                <Typography variant="h4">
                  {pendingCount}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Paid Expenses
                </Typography>
                <Typography variant="h4">
                  {paidCount}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Monthly Expenses
                </Typography>
                <Stack spacing={2}>
                  {Object.entries(monthlyTotals).map(([month, amount]) => (
                    <Box key={month} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{month}</Typography>
                      <Typography>${amount.toFixed(2)}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Expense Status Distribution
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Pending</Typography>
                    <Typography>{pendingCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Approved</Typography>
                    <Typography>{approvedCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Paid</Typography>
                    <Typography>{paidCount}</Typography>
                  </Box>
                </Stack>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
} 