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
} from '@mui/material';
import { createCustomer, updateCustomer } from '@/api/customerApi';
import { Customer } from '@/types/customer';

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: Customer | null;
  mode: 'create' | 'edit';
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  open,
  onClose,
  onSuccess,
  customer,
  mode,
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Reset form when opened/closed
  useEffect(() => {
    if (open) {
      if (customer) {
        setName(customer.name);
      } else {
        setName('');
      }
      setError(null);
    }
  }, [open, customer]);

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'create') {
        await createCustomer({ name });
      } else if (customer) {
        await updateCustomer(customer.id.toString(), { name });
      }
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? 'Create Customer' : 'Edit Customer'}
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

export default CustomerForm; 