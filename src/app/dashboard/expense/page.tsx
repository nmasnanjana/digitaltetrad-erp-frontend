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
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Chip,
  Grid,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Plus, List, Gear, PencilSimple, Trash, Eye } from '@phosphor-icons/react/dist/ssr';
import { type Expense } from '@/types/expense';
import { useSettings } from '@/contexts/SettingsContext';
import Link from 'next/link';
import ExpenseForm from '@/components/dashboard/expense/ExpenseForm';
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
        py: { xs: 2, sm: 4, md: 6, lg: 8 },
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack
            direction="column"
            justifyContent="space-between"
            spacing={{ xs: 2, sm: 4 }}
            sx={{
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' }
            }}
          >
            <Stack spacing={1}>
              <Typography variant="h4">
                Expense Overview
              </Typography>
              <Typography variant="body1" color="text.secondary">
                View and manage all expenses
              </Typography>
            </Stack>
            <Stack 
              direction="row" 
              spacing={2} 
              sx={{ 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 2 },
                order: { xs: -1, sm: 0 }
              }}
            >
              <Button
                component={Link}
                href="/dashboard/expense/type"
                variant="outlined"
                startIcon={<List />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Expense Types
              </Button>
              <Button
                component={Link}
                href="/dashboard/expense/operation-type"
                variant="outlined"
                startIcon={<Gear />}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                Operation Types
              </Button>
              <Button
                variant="contained"
                startIcon={<Plus />}
                onClick={handleCreate}
                sx={{ width: { xs: '100%', sm: 'auto' } }}
              >
                New Expense
              </Button>
            </Stack>
          </Stack>

          {localError ? (
            <Alert severity="error" onClose={() => { setLocalError(null); }}>
              {localError}
            </Alert>
          ) : null}

          <Grid container spacing={2}>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ 
                p: 1.5,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  Total Expenses: {totalExpenses}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ 
                p: 1.5,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  Total Amount: {formatCurrency(totalAmount)}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ 
                p: 1.5,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  Pending Approval: {pendingCount}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <Card sx={{ 
                p: 1.5,
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontWeight: 600,
                    color: 'text.primary'
                  }}
                >
                  Paid Expenses: {paidCount}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
              <TableContainer sx={{ 
                overflowX: 'auto',
                '& .MuiTable-root': {
                  minWidth: { xs: 600, sm: 800, md: 1000 }
                }
              }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}>Job ID/Operation</TableCell>
                      <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Type</TableCell>
                      <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}>Expense Type</TableCell>
                      <TableCell sx={{ minWidth: { xs: 120, sm: 150 }, display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
                      <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Amount</TableCell>
                      <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Status</TableCell>
                      <TableCell sx={{ minWidth: { xs: 100, sm: 120 }, display: { xs: 'none', lg: 'table-cell' } }}>Created Date</TableCell>
                      <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}>Actions</TableCell>
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
                            {expense.operations ? expense.operationType?.name || '-' : expense.job?.id || '-'}
                          </TableCell>
                          <TableCell>{expense.expenseType?.name}</TableCell>
                          <TableCell>
                            <Chip
                              label={expense.operations ? 'Operation' : 'Job'}
                              color={expense.operations ? 'primary' : 'secondary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            {expense.description}
                          </TableCell>
                          <TableCell>{formatCurrency(expense.amount)}</TableCell>
                          <TableCell>
                            <Chip
                              label={expense.status ? formatStatus(expense.status, expense.paid) : 'N/A'}
                              color={expense.status ? getStatusColor(expense.status, expense.paid) : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                            {formatDate(expense.createdAt || expense.created_at)}
                          </TableCell>
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
                                onClick={() => { handleEdit(expense); }}
                                disabled={expense.paid}
                              >
                                <PencilSimple />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => { handleDelete(expense); }}
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
              </TableContainer>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* Expense Form Dialog */}
      <Dialog open={formOpen} onClose={() => { setFormOpen(false); }} maxWidth="md" fullWidth>
        <DialogTitle>
          {formMode === 'create' ? 'Create New Expense' : 'Edit Expense'}
        </DialogTitle>
        <DialogContent>
          <ExpenseForm
            expense={selectedExpense}
            mode={formMode}
            onSuccess={handleFormSuccess}
            onClose={() => { setFormOpen(false); }}
            open={formOpen}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); }}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this expense?
          </Typography>
          {expenseToDelete ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {expenseToDelete.description} - {formatCurrency(expenseToDelete.amount)}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); }}>
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