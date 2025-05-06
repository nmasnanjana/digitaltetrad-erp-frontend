'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getExpenseById, deleteExpense } from '@/api/expenseApi';
import { Expense } from '@/types/expense';
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import ExpenseForm from '@/components/dashboard/expense/ExpenseForm';

interface ExpenseViewPageProps {
  params: {
    id: string;
  };
}

const ExpenseViewPage: React.FC<ExpenseViewPageProps> = ({ params }) => {
  const router = useRouter();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const loadExpense = async () => {
    try {
      setLoading(true);
      const response = await getExpenseById(params.id);
      setExpense(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteExpense(params.id);
      setDeleteDialogOpen(false);
      router.push('/dashboard/expense');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  useEffect(() => {
    loadExpense();
  }, [params.id]);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!expense) {
    return <Alert severity="error">Expense not found</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard/expense')}
        >
          Back to Expenses
        </Button>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => setFormOpen(true)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>
              Expense Details
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Expense Type
            </Typography>
            <Typography variant="body1">{expense.expenseType?.name}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Category
            </Typography>
            <Chip
              label={expense.operations ? 'Operation' : 'Job'}
              color={expense.operations ? 'primary' : 'secondary'}
            />
          </Grid>
          {!expense.operations && expense.job && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Job
              </Typography>
              <Typography variant="body1">{expense.job.name}</Typography>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Amount
            </Typography>
            <Typography variant="body1">${expense.amount.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1">{expense.description}</Typography>
          </Grid>
          {expense.editor && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Updated By
              </Typography>
              <Typography variant="body1">
                {`${expense.editor.firstName} ${expense.editor.lastName || ''}`}
              </Typography>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Created At
            </Typography>
            <Typography variant="body1">
              {expense.createdAt ? new Date(expense.createdAt).toLocaleString() : '-'}
            </Typography>
          </Grid>
          {expense.updatedAt && expense.updatedAt !== expense.createdAt && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Updated At
              </Typography>
              <Typography variant="body1">
                {new Date(expense.updatedAt).toLocaleString()}
              </Typography>
            </Grid>
          )}
          {expense.reason_to_edit && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">
                Reason for Update
              </Typography>
              <Typography variant="body1">{expense.reason_to_edit}</Typography>
            </Grid>
          )}
        </Grid>
      </Paper>

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
        onSuccess={loadExpense}
        expense={expense}
        mode="edit"
      />
    </Box>
  );
};

export default ExpenseViewPage; 