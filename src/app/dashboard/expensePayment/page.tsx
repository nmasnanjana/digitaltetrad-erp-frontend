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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import { CheckCircle, XCircle } from '@phosphor-icons/react/dist/ssr';
import { getAllExpenses, markAsPaid } from '@/api/expense-api';
import { type Expense } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';

export default function ExpensePaymentPage() {
  const { formatCurrency } = useSettings();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
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

  const handlePayment = (expense: Expense) => {
    setSelectedExpense(expense);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedExpense) return;

    try {
      setError(null);
      await markAsPaid(selectedExpense.id.toString(), { paid: true });

      await fetchExpenses();
      setPaymentDialogOpen(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update payment status. Please try again.');
    }
  };

  // Filter approved expenses that are not paid
  const pendingPayments = expenses.filter(expense => 
    expense.status === 'approved' && !expense.paid
  );

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

          {error ? <Alert severity="error" onClose={() => { setError(null); }}>
              {error}
            </Alert> : null}

          <Card>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Approved By</TableCell>
                  <TableCell>Approved Date</TableCell>
                  <TableCell>Payment Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        Loading expenses...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : pendingPayments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography color="text.secondary">
                        No pending payments
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingPayments.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.job?.name || 'N/A'}</TableCell>
                      <TableCell>{expense.expenseType?.name}</TableCell>
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
          <Button onClick={handlePaymentSubmit} variant="contained" color="success">
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 