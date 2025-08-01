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
import { Plus, List, Gear, PencilSimple, Trash, Eye } from '@phosphor-icons/react/dist/ssr';
import { getAllExpenses, updateExpense, deleteExpense } from '@/api/expenseApi';
import { Expense } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import Link from 'next/link';
import ExpenseForm from '@/components/dashboard/expense/ExpenseForm';
import { IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

export default function ExpensePage() {
  // Temporarily use a simple currency formatter without settings
  const formatCurrency = (amount: number | string | undefined) => {
    if (amount === undefined || amount === null) return '$0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${num.toFixed(2)}`;
  };
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

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
      case 'denied':
        return 'error';
      case 'on_progress':
        return 'warning';
      default:
        return 'warning';
    }
  };

  const formatStatus = (status: string) => {
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
    fetchExpenses();
  };

  const handleEdit = (expense: Expense) => {
    if (expense.paid) {
      setError('Cannot edit a paid expense');
      return;
    }
    setSelectedExpense(expense);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    if (expense.paid) {
      setError('Cannot delete a paid expense');
      return;
    }
    setExpenseToDelete(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    
    try {
      setError(null);
      await deleteExpense(expenseToDelete.id.toString());
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete expense. Please try again.');
    }
  };

  // Calculate summary statistics
  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingCount = expenses.filter(e => e.status === 'on_progress').length;
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
                variant="contained"
                startIcon={<Plus />}
                onClick={handleCreate}
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
                {loading ? (
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
                          label={expense.status ? formatStatus(expense.status) : 'N/A'}
                          color={expense.status ? getStatusColor(expense.status) : 'default'}
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
          </Card>
        </Stack>
      </Container>

      <ExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        expense={selectedExpense}
        mode={formMode}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this expense?
          {expenseToDelete && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
              {expenseToDelete.description} - {formatCurrency(expenseToDelete.amount)}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 