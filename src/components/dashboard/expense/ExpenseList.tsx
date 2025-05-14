'use client';

import React, { useEffect, useState } from 'react';
import { getAllExpenses, deleteExpense } from '@/api/expenseApi';
import { Expense } from '@/types/expense';
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

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const response = await getAllExpenses();
      // Sort expenses by createdAt in descending order (newest first)
      const sortedExpenses = response.data.sort((a: Expense, b: Expense) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setExpenses(sortedExpenses);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense) return;
    
    try {
      await deleteExpense(selectedExpense.id.toString());
      setDeleteDialogOpen(false);
      loadExpenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedExpense(null);
    setFormMode('create');
    setFormOpen(true);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Expense Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Amount</TableCell>
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
                <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
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
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedExpense(expense);
                      setDeleteDialogOpen(true);
                    }}
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
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ExpenseForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={loadExpenses}
        expense={selectedExpense}
        mode={formMode}
      />
    </Box>
  );
}; 