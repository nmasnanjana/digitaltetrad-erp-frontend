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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { createExpenseType, updateExpenseType } from '@/api/expenseApi';
import { ExpenseType } from '@/types/expense';

interface ExpenseTypeFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expenseType?: ExpenseType | null;
  mode: 'create' | 'edit';
}

const ExpenseTypeForm: React.FC<ExpenseTypeFormProps> = ({
  open,
  onClose,
  onSuccess,
  expenseType,
  mode,
}) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset form when opened/closed
  useEffect(() => {
    if (open) {
      if (expenseType) {
        setName(expenseType.name);
        setDescription(expenseType.description || '');
        setIsActive(expenseType.isActive);
      } else {
        setName('');
        setDescription('');
        setIsActive(true);
      }
      setError(null);
    }
  }, [open, expenseType]);

  const handleClose = () => {
    setName('');
    setDescription('');
    setIsActive(true);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate form
    if (!name.trim()) {
      setError('Expense type name is required');
      setLoading(false);
      return;
    }

    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        isActive,
      };

      if (mode === 'create') {
        await createExpenseType(data);
      } else if (expenseType) {
        await updateExpenseType(expenseType.id.toString(), data);
      }
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error creating/updating expense type:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the expense type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? 'Create Expense Type' : 'Edit Expense Type'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            }
            label="Active"
          />
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

export default ExpenseTypeForm; 