'use client';

import React, { useEffect, useState } from 'react';
import { getAllCustomers, deleteCustomer } from '@/api/customer-api';
import { type Customer } from '@/types/customer';
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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import CustomerForm from './CustomerForm';

export const ListCustomer: React.FC = () => {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await getAllCustomers();
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    
    try {
      await deleteCustomer(selectedCustomer.id.toString());
      setDeleteDialogOpen(false);
      loadCustomers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setFormMode('create');
    setFormOpen(true);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 2, sm: 0 },
        mb: 2 
      }}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Customers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ 
            minWidth: { xs: '100%', sm: 'auto' },
            order: { xs: -1, sm: 0 }
          }}
        >
          Add Customer
        </Button>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert> : null}

      <TableContainer component={Paper} sx={{ 
        overflowX: 'auto',
        '& .MuiTable-root': {
          minWidth: { xs: 400, sm: 600 }
        }
      }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: { xs: 120, sm: 150 } }}>Name</TableCell>
              <TableCell sx={{ minWidth: { xs: 150, sm: 200 } }}>Address</TableCell>
              <TableCell align="right" sx={{ minWidth: { xs: 100, sm: 120 } }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.name}</TableCell>
                <TableCell>
                  {customer.address ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {customer.address}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No address
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 0.5, sm: 1 },
                    justifyContent: 'flex-end',
                    flexWrap: 'nowrap'
                  }}>
                    <IconButton
                      color="primary"
                      onClick={() => { handleEdit(customer); }}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setDeleteDialogOpen(true);
                      }}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); }}>
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          Are you sure you want to delete customer {selectedCustomer?.name}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); }}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <CustomerForm
        open={formOpen}
        onClose={() => { setFormOpen(false); }}
        onSuccess={loadCustomers}
        customer={selectedCustomer}
        mode={formMode}
      />
    </Box>
  );
}; 