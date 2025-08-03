'use client';

import * as React from 'react';
import { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import { CheckCircle, XCircle } from '@phosphor-icons/react/dist/ssr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllExpenses, markAsPaid } from '@/api/expense-api';
import { CACHE_KEYS, invalidateCache } from '@/lib/react-query/cache-manager';
import { type Expense } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';

export default function ExpensePaymentPage() {
  const { formatCurrency } = useSettings();
  const queryClient = useQueryClient();
  
  // Get approved expenses with React Query
  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: [CACHE_KEYS.EXPENSES, 'approved'],
    queryFn: async () => {
      const response = await getAllExpenses();
      return response.data.filter(expense => 
        expense.status === 'approved' && !expense.paid
      );
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for payment data
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      return markAsPaid(expenseId, { paid: true });
    },
    onSuccess: () => {
      // Invalidate expenses cache to refresh the list
      invalidateCache.expenses();
      // Also invalidate dashboard data
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.EXPENSE_DASHBOARD] });
    },
  });

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  const handlePayment = (expense: Expense) => {
    setSelectedExpense(expense);
    setPaymentDialogOpen(true);
  };

  const handlePaymentConfirm = async () => {
    if (!selectedExpense) return;
    
    try {
      await markAsPaidMutation.mutateAsync(selectedExpense.id.toString());
      setPaymentDialogOpen(false);
    } catch (error) {
      console.error('Error marking expense as paid:', error);
      setErrorState(error instanceof Error ? error.message : 'Failed to mark expense as paid. Please try again later.');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

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
                Payment Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage payments for approved expenses
              </Typography>
            </Stack>
          </Stack>

          {errorState ? <Alert severity="error" onClose={() => { setErrorState(null); }}>
              {errorState}
            </Alert> : null}

          <Card>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Expense Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Approved By</TableCell>
                  <TableCell>Approved Date</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">
                        Loading expenses...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">
                        Failed to load expenses. Please try again later.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography color="text.secondary">
                        No pending payments
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {expense.operations ? expense.operationType?.name || 'N/A' : expense.job?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{expense.expenseType?.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={expense.operations ? 'Operation' : 'Job'}
                          color={expense.operations ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        {expense.reviewer 
                          ? `${expense.reviewer.firstName} ${expense.reviewer.lastName || ''}`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>{formatDate(expense.reviewed_at ? expense.reviewed_at.toString() : undefined)}</TableCell>
                      <TableCell>
                        <Chip
                          label={expense.paid ? 'Paid' : 'Pending'}
                          color={expense.paid ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => { handlePayment(expense); }}
                            disabled={expense.paid}
                          >
                            Mark as Paid
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

      <Dialog open={paymentDialogOpen} onClose={() => { setPaymentDialogOpen(false); }}>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Typography>
              Are you sure you want to mark this expense as paid?
            </Typography>
            {selectedExpense ? <Stack spacing={1}>
                <Typography variant="subtitle2">Expense Details:</Typography>
                <Typography>Job: {selectedExpense.job?.name || 'N/A'}</Typography>
                <Typography>Amount: {formatCurrency(selectedExpense.amount)}</Typography>
                <Typography>Description: {selectedExpense.description}</Typography>
              </Stack> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPaymentDialogOpen(false); }}>Cancel</Button>
          <Button onClick={handlePaymentConfirm} variant="contained" color="success">
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 