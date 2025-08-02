'use client';

import * as React from 'react';
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
  CardContent,
} from '@mui/material';
import { Plus, List, Gear, PencilSimple, Trash, Eye } from '@phosphor-icons/react/dist/ssr';
import { Expense } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import Link from 'next/link';
import ExpenseForm from '@/components/dashboard/expense/ExpenseForm';
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useExpenses, useDeleteExpense } from '@/hooks/use-expenses';

export default function ExpensePage() {
  const { formatCurrency } = useSettings();
  const { data: expenses = [], isLoading } = useExpenses();
  const deleteExpenseMutation = useDeleteExpense();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    // The fetchExpenses function is now handled by useExpenses hook
  }, []);

  const getStatusColor = (status: string, paid: boolean) => {
    // If expense is paid, show success color
    if (paid) {
      return 'success';
    }
    
    switch (status) {
      case 'approved':
        return 'success';
      case 'denied':
        return 'error';
      case 'on_progress':
        return 'warning';
      default:
        return 'warning';
    }
  };

  const formatStatus = (status: string, paid: boolean) => {
    // If expense is paid, show "Paid" regardless of status
    if (paid) {
      return 'Paid';
    }
    
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'denied':
        return 'Denied';
      case 'on_progress':
        return 'In Progress';
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleCreate = () => {
    setSelectedExpense(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    // The fetchExpenses function is now handled by useExpenses hook
  };

  const handleEdit = (expense: Expense) => {
    if (expense.paid) {
      setLocalError('Cannot edit a paid expense');
      return;
    }
    setSelectedExpense(expense);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    if (expense.paid) {
      setLocalError('Cannot delete a paid expense');
      return;
    }
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    
    try {
      await deleteExpenseMutation.mutateAsync(expenseToDelete.id.toString());
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    } catch (error) {
      setLocalError('Failed to delete expense. Please try again.');
    }
  };

  // Calculate summary statistics
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'on_progress').length;
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
                variant="contained"
                startIcon={<Plus />}
                onClick={handleCreate}
              >
                New Expense
              </Button>
            </Stack>
          </Stack>

          {localError && (
            <Alert severity="error" onClose={() => setLocalError(null)}>
              {localError}
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
            <CardContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Expense Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">
                          Loading expenses...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : expenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">
                          No expenses found
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
                          <Chip
                            label={expense.status ? formatStatus(expense.status, expense.paid) : 'N/A'}
                            color={expense.status ? getStatusColor(expense.status, expense.paid) : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(expense.createdAt || expense.created_at)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              color="info"
                              component={Link}
                              href={`/dashboard/expense/${expense.id}/view`}
                            >
                              <Eye />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEdit(expense)}
                              disabled={expense.paid}
                            >
                              <PencilSimple />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(expense)}
                              disabled={expense.paid}
                            >
                              <Trash />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* Expense Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {formMode === 'create' ? 'Create New Expense' : 'Edit Expense'}
        </DialogTitle>
        <DialogContent>
          <ExpenseForm
            expense={selectedExpense}
            mode={formMode}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this expense?
          </Typography>
          {expenseToDelete && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {expenseToDelete.description} - {formatCurrency(expenseToDelete.amount)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 