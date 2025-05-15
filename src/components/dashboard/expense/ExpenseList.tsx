'use client';

import React, { useEffect, useState } from 'react';
import { getAllExpenses, deleteExpense } from '@/api/expenseApi';
import { getAllExpenseTypes } from '@/api/expenseApi';
import { getAllJobs } from '@/api/jobApi';
import { getAllOperationTypes } from '@/api/operationTypeApi';
import { Expense } from '@/types/expense';
import { ExpenseType } from '@/types/expense';
import { Job } from '@/types/job';
import { OperationType } from '@/types/operationType';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import ExpenseForm from './ExpenseForm';
import { ExpenseFilters, ExpenseFilters as ExpenseFiltersType } from './ExpenseFilters';
import { useRouter } from 'next/navigation';

export const ExpenseList: React.FC = () => {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [filters, setFilters] = useState<ExpenseFiltersType>({});
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesResponse, expenseTypesResponse, jobsResponse, operationTypesResponse] = await Promise.all([
        getAllExpenses(filters),
        getAllExpenseTypes(),
        getAllJobs(),
        getAllOperationTypes()
      ]);
      setExpenses(expensesResponse.data);
      setExpenseTypes(expenseTypesResponse.data);
      setJobs(jobsResponse.data);
      setOperationTypes(operationTypesResponse.data);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleFilterChange = (newFilters: ExpenseFiltersType) => {
    setFilters(newFilters);
  };

  const handleCreate = () => {
    setSelectedExpense(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleDelete = async (expense: Expense) => {
    if (expense.status === 'approved') {
      setError('Cannot delete an approved expense');
      return;
    }
    setSelectedExpense(expense);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedExpense) return;
    
    try {
      await deleteExpense(selectedExpense.id.toString());
      setDeleteDialogOpen(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    if (expense.status === 'approved') {
      setError('Cannot edit an approved expense');
      return;
    }
    setSelectedExpense(expense);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'denied':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Expenses</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add Expense
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <ExpenseFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        expenseTypes={expenseTypes}
        jobs={jobs}
        operationTypes={operationTypes}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Expense Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.expenseType?.name || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={expense.operations ? 'Operation' : 'Job'}
                    color={expense.operations ? 'primary' : 'secondary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>LKR {expense.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={expense.status}
                    color={getStatusColor(expense.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={expense.paid ? 'Paid' : 'Unpaid'}
                    color={expense.paid ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {new Date(expense.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => router.push(`/dashboard/expense/${expense.id}/view`)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(expense)}
                    disabled={expense.status === 'approved'}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(expense)}
                    disabled={expense.status === 'approved'}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this expense?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={handleFormSuccess}
        expense={selectedExpense}
        mode={formMode}
      />
    </Box>
  );
}; 