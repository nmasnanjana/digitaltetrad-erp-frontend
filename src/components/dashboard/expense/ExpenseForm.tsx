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
import { createExpense, updateExpense , getAllExpenseTypes } from '@/api/expense-api';
import { getAllOperationTypes } from '@/api/operationTypeApi';
import { getAllJobs } from '@/api/job-api';
import { type Expense, type ExpenseType } from '@/types/expense';
import { type OperationType } from '@/types/operationType';
import { type Job } from '@/types/job';
import { useUser } from '@/contexts/user-context';
import { authClient } from '@/lib/auth/client';

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
  const [operation_type_id, setOperationTypeId] = useState<number | undefined>(undefined);
  const [job_id, setJobId] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reason_to_edit, setReasonToEdit] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Get user ID from JWT token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return null;
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      return tokenPayload.id;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Load expense types, operation types, and jobs
  useEffect(() => {
    const loadData = async () => {
      try {
        const [expenseTypesResponse, operationTypesResponse, jobsResponse] = await Promise.all([
          getAllExpenseTypes(),
          getAllOperationTypes(),
          getAllJobs(),
        ]);
        setExpenseTypes(expenseTypesResponse.data);
        setOperationTypes(operationTypesResponse.data);
        // Handle paginated response from getAllJobs
        setJobs(jobsResponse.data.jobs);
      } catch (err) {
        setError('Failed to load data');
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
        setOperationTypeId(expense.operation_type_id);
        setJobId(expense.job_id?.toString());
        setDescription(expense.description);
        setAmount(expense.amount.toString());
        setReasonToEdit('');
      } else {
        setExpensesTypeId(0);
        setOperations(false);
        setOperationTypeId(undefined);
        setJobId(undefined);
        setDescription('');
        setAmount('');
        setReasonToEdit('');
      }
      setError(null);
    }
  }, [open, expense]);

  const handleClose = () => {
    setExpensesTypeId(0);
    setOperations(false);
    setOperationTypeId(undefined);
    setJobId(undefined);
    setDescription('');
    setAmount('');
    setReasonToEdit('');
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

    if (operations && !operation_type_id) {
      setError('Please select an operation type');
      setLoading(false);
      return;
    }

    if (!operations && !job_id) {
      setError('Please select either operation or job');
      setLoading(false);
      return;
    }

    const userId = getUserIdFromToken();
    if (!userId) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    if (mode === 'edit' && !reason_to_edit.trim()) {
      setError('Please provide a reason for editing');
      setLoading(false);
      return;
    }

    try {
      const data = {
        expenses_type_id,
        operations,
        operation_type_id: operations ? operation_type_id : undefined,
        job_id: operations ? undefined : job_id,
        description: description.trim(),
        amount: Number(amount)
      };

      if (mode === 'create') {
        await createExpense(data);
      } else if (expense) {
        await updateExpense(expense.id.toString(), {
          ...data,
          edited_by: userId,
          reason_to_edit: reason_to_edit.trim()
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
          {error ? <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert> : null}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Expense Type</InputLabel>
                <Select
                  value={expenses_type_id}
                  label="Expense Type"
                  onChange={(e) => { setExpensesTypeId(Number(e.target.value)); }}
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
                    onChange={(e) => { setOperations(e.target.checked); }}
                  />
                }
                label="Operation Expense"
              />
            </Grid>
            {operations ? <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Operation Type</InputLabel>
                  <Select
                    value={operation_type_id?.toString() || ''}
                    label="Operation Type"
                    onChange={(e) => { setOperationTypeId(Number(e.target.value)); }}
                    required={operations}
                  >
                    {operationTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid> : null}
            {!operations && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Job</InputLabel>
                  <Select
                    value={job_id || ''}
                    label="Job"
                    onChange={(e) => { setJobId(e.target.value); }}
                    required={!operations}
                  >
                    {jobs.map((job) => (
                      <MenuItem key={job.id} value={job.id}>
                        {job.id}
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
                onChange={(e) => { setDescription(e.target.value); }}
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
                onChange={(e) => { setAmount(e.target.value); }}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            {mode === 'edit' && (
              <Grid item xs={12}>
                <TextField
                  margin="dense"
                  label="Reason for Edit"
                  type="text"
                  fullWidth
                  value={reason_to_edit}
                  onChange={(e) => { setReasonToEdit(e.target.value); }}
                  required
                  multiline
                  rows={2}
                  helperText="Please provide a reason for editing this expense"
                />
              </Grid>
            )}
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
