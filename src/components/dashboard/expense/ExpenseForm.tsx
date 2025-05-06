'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
} from '@mui/material';
import { createExpense, updateExpense } from '@/api/expenseApi';
import { getAllExpenseTypes } from '@/api/expenseApi';
import { getAllJobs } from '@/api/jobApi';
import { Expense, ExpenseType } from '@/types/expense';
import { Job } from '@/types/job';
import { useUser } from '@/contexts/user-context';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense?: Expense | null;
  mode: 'create' | 'edit';
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  open,
  onClose,
  onSuccess,
  expense,
  mode,
}) => {
  const { user } = useUser();
  const [expenses_type_id, setExpensesTypeId] = useState<number>(0);
  const [operations, setOperations] = useState<boolean>(false);
  const [job_id, setJobId] = useState<number | undefined>(undefined);
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Load expense types and jobs
  useEffect(() => {
    const loadData = async () => {
      try {
        const [expenseTypesResponse, jobsResponse] = await Promise.all([
          getAllExpenseTypes(),
          getAllJobs(),
        ]);
        setExpenseTypes(expenseTypesResponse.data);
        setJobs(jobsResponse.data);
      } catch (err) {
        setError('Failed to load expense types and jobs');
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Reset form when opened/closed
  useEffect(() => {
    if (open) {
      if (expense) {
        setExpensesTypeId(expense.expenses_type_id);
        setOperations(expense.operations);
        setJobId(expense.job_id);
        setDescription(expense.description);
        setAmount(expense.amount.toString());
      } else {
        setExpensesTypeId(0);
        setOperations(false);
        setJobId(undefined);
        setDescription('');
        setAmount('');
      }
      setError(null);
    }
  }, [open, expense]);

  const handleClose = () => {
    setExpensesTypeId(0);
    setOperations(false);
    setJobId(undefined);
    setDescription('');
    setAmount('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate form
    if (!expenses_type_id) {
      setError('Please select an expense type');
      setLoading(false);
      return;
    }

    if (!description.trim()) {
      setError('Description is required');
      setLoading(false);
      return;
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount greater than 0');
      setLoading(false);
      return;
    }

    if (!operations && !job_id) {
      setError('Please select either operation or job');
      setLoading(false);
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      const data = {
        expenses_type_id: expenses_type_id,
        operations,
        job_id: operations ? undefined : job_id,
        description: description.trim(),
        amount: Number(amount)
      };

      if (mode === 'create') {
        await createExpense(data);
      } else if (expense) {
        await updateExpense(expense.id.toString(), {
          ...data,
          edited_by: user.id,
          reason_to_edit: 'Updated via web interface'
        });
      }
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error creating/updating expense:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? 'Create Expense' : 'Edit Expense'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Expense Type</InputLabel>
                <Select
                  value={expenses_type_id}
                  label="Expense Type"
                  onChange={(e) => setExpensesTypeId(Number(e.target.value))}
                  required
                >
                  {expenseTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={operations}
                    onChange={(e) => setOperations(e.target.checked)}
                  />
                }
                label="Operation Expense"
              />
            </Grid>
            {!operations && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Job</InputLabel>
                  <Select
                    value={job_id || ''}
                    label="Job"
                    onChange={(e) => setJobId(Number(e.target.value))}
                    required={!operations}
                  >
                    {jobs.map((job) => (
                      <MenuItem key={job.id} value={job.id}>
                        {job.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Description"
                type="text"
                fullWidth
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Amount"
                type="number"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ExpenseForm;
