'use client';

import React, { useEffect, useState } from 'react';
import { getAllExpenseTypes, deleteExpenseType } from '@/api/expense-api';
import { type ExpenseType } from '@/types/expense';
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
import ExpenseTypeForm from './ExpenseTypeForm';

export const ExpenseTypeList: React.FC = () => {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExpenseType, setSelectedExpenseType] = useState<ExpenseType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const loadExpenseTypes = async () => {
    try {
      setLoading(true);
      const response = await getAllExpenseTypes();
      setExpenseTypes(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expense types');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpenseType) return;
    
    try {
      await deleteExpenseType(selectedExpenseType.id.toString());
      setDeleteDialogOpen(false);
      loadExpenseTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense type');
    }
  };

  const handleEdit = (expenseType: ExpenseType) => {
    setSelectedExpenseType(expenseType);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedExpenseType(null);
    setFormMode('create');
    setFormOpen(true);
  };

  useEffect(() => {
    loadExpenseTypes();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Expense Types</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add Expense Type
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
            {expenseTypes.map((expenseType) => (
              <TableRow key={expenseType.id}>
                <TableCell>{expenseType.name}</TableCell>
                <TableCell>{expenseType.description || '-'}</TableCell>
                <TableCell>
                  <Chip
                    label={expenseType.isActive ? 'Active' : 'Inactive'}
                    color={expenseType.isActive ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => { handleEdit(expenseType); }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedExpenseType(expenseType);
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
        <DialogTitle>Delete Expense Type</DialogTitle>
        <DialogContent>
          Are you sure you want to delete expense type {selectedExpenseType?.name}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); }}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ExpenseTypeForm
        open={formOpen}
        onClose={() => { setFormOpen(false); }}
        onSuccess={loadExpenseTypes}
        expenseType={selectedExpenseType}
        mode={formMode}
      />
    </Box>
  );
}; 