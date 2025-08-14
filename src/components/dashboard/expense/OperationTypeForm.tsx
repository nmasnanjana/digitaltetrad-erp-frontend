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
import { createOperationType, updateOperationType } from '@/api/operationTypeApi';
import { type OperationType } from '@/types/operationType';

interface OperationTypeFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  operationType?: OperationType | null;
  mode: 'create' | 'edit';
}

const OperationTypeForm: React.FC<OperationTypeFormProps> = ({
  open,
  onClose,
  onSuccess,
  operationType,
  mode,
}) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (operationType) {
        setName(operationType.name);
        setDescription(operationType.description || '');
        setIsActive(operationType.isActive);
      } else {
        setName('');
        setDescription('');
        setIsActive(true);
      }
      setError(null);
    }
  }, [open, operationType]);

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

    if (!name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    try {
      const data = {
        name: name.trim(),
        description: description.trim(),
        isActive,
      };

      if (mode === 'create') {
        await createOperationType(data);
      } else if (operationType) {
        await updateOperationType(operationType.id, data);
      }
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving the operation type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? 'Create Operation Type' : 'Edit Operation Type'}
        </DialogTitle>
        <DialogContent>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert> : null}
          <TextField
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => { setName(e.target.value); }}
            required
          />
          <TextField
            margin="dense"
            label="Description"
            type="text"
            fullWidth
            value={description}
            onChange={(e) => { setDescription(e.target.value); }}
            multiline
            rows={3}
          />
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => { setIsActive(e.target.checked); }}
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

export default OperationTypeForm; 