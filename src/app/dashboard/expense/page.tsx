'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Container,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import { Plus, List, Gear } from '@phosphor-icons/react/dist/ssr';
import { getAllExpenses } from '@/api/expenseApi';
import { Expense } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import Link from 'next/link';

export default function ExpenseOverviewPage() {
  const { formatCurrency } = useSettings();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'paid':
        return 'info';
      default:
        return 'warning';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate summary statistics
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'pending').length;
  const approvedCount = expenses.filter(e => e.status === 'approved').length;
  const paidCount = expenses.filter(e => e.paid).length;

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
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={4}
          >
            <Stack spacing={1}>
              <Typography variant="h4">
                Expense Overview
              </Typography>
              <Typography variant="body1" color="text.secondary">
                View and manage all expenses
              </Typography>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                component={Link}
                href="/dashboard/expense/type"
                variant="outlined"
                startIcon={<List />}
              >
                Expense Types
              </Button>
              <Button
                component={Link}
                href="/dashboard/expense/operation-type"
                variant="outlined"
                startIcon={<Gear />}
              >
                Operation Types
              </Button>
              <Button
                component={Link}
                href="/dashboard/expense/new"
                variant="contained"
                startIcon={<Plus />}
              >
                New Expense
              </Button>
            </Stack>
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
                  {formatCurrency(totalAmount)}
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

          <Card>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        Loading expenses...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        No expenses found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.job?.name || 'N/A'}</TableCell>
                      <TableCell>{expense.expenseType?.name}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={expense.status}
                          color={getStatusColor(expense.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(expense.created_at)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            component={Link}
                            href={`/dashboard/expense/${expense.id}`}
                            variant="outlined"
                            size="small"
                          >
                            View
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
} 