'use client';

import React, { useEffect, useState } from 'react';
import { getAllOperationTypes, deleteOperationType } from '@/api/operationTypeApi';
import { type OperationType } from '@/types/operationType';
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
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import OperationTypeForm from './OperationTypeForm';

export const OperationTypeList: React.FC = () => {
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOperationType, setSelectedOperationType] = useState<OperationType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const loadOperationTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllOperationTypes();
      setOperationTypes(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operation types');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOperationType) return;
    
    try {
      await deleteOperationType(selectedOperationType.id);
      setDeleteDialogOpen(false);
      loadOperationTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete operation type');
    }
  };

  const handleEdit = (operationType: OperationType) => {
    setSelectedOperationType(operationType);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedOperationType(null);
    setFormMode('create');
    setFormOpen(true);
  };

  useEffect(() => {
    loadOperationTypes();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Operation Types</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add Operation Type
        </Button>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert> : null}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {operationTypes.map((operationType) => (
              <TableRow key={operationType.id}>
                <TableCell>{operationType.name}</TableCell>
                <TableCell>{operationType.description || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={operationType.isActive ? 'Active' : 'Inactive'}
                    color={operationType.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => { handleEdit(operationType); }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedOperationType(operationType);
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

      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); }}>
        <DialogTitle>Delete Operation Type</DialogTitle>
        <DialogContent>
          Are you sure you want to delete operation type {selectedOperationType?.name}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); }}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <OperationTypeForm
        open={formOpen}
        onClose={() => { setFormOpen(false); }}
        onSuccess={loadOperationTypes}
        operationType={selectedOperationType}
        mode={formMode}
      />
    </Box>
  );
}; 