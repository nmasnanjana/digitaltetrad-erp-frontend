'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Container,
  Stack,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react/dist/ssr';
import { getAllExpenseTypes, createExpenseType, updateExpenseType, deleteExpenseType } from '@/api/expense-type-api';
import { type ExpenseType } from '@/types/expense';
import { useUser } from '@/contexts/user-context';
import { useRouter } from 'next/navigation';
import { paths } from '@/paths';

export default function ExpenseTypePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, error: authError } = useUser();
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [selectedType, setSelectedType] = useState<ExpenseType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push(paths.auth.signIn);
        return;
      }

                  const hasPermission = user.role?.name === 'developer' || user.role?.permissions?.some(
        p => p.module === 'expensetype' && (p.action === 'read' || p.action === 'create' || p.action === 'update' || p.action === 'delete') && p.isActive
      );

      if (!hasPermission) {
        router.push(paths.dashboard.overview);
        return;
      }

      fetchExpenseTypes();
    }
  }, [authLoading, user, router]);

  const fetchExpenseTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllExpenseTypes();
      setExpenseTypes(response.data);
    } catch (error) {
      console.error('Error fetching expense types:', error);
      setError(error instanceof Error ? error.message : 'Failed to load expense types. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type?: ExpenseType) => {
    if (!user?.role?.permissions?.some(p => p.module === 'expensetype' && (p.action === 'create' || p.action === 'update') && p.isActive)) {
      setError('You do not have permission to modify expense types');
      return;
    }

    if (type) {
      setSelectedType(type);
      setFormData({
        name: type.name,
        description: type.description || '',
        isActive: type.isActive,
      });
      setIsEdit(true);
    } else {
      setSelectedType(null);
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
      setIsEdit(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedType(null);
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
  };

  const handleSubmit = async () => {
    if (!user?.role?.permissions?.some(p => p.module === 'expensetype' && (p.action === 'create' || p.action === 'update') && p.isActive)) {
      setError('You do not have permission to modify expense types');
      return;
    }

    try {
      setError(null);
      if (isEdit && selectedType) {
        await updateExpenseType(selectedType.id, formData);
      } else {
        await createExpenseType(formData);
      }
      await fetchExpenseTypes();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving expense type:', error);
      setError(error instanceof Error ? error.message : 'Failed to save expense type. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!user?.role?.permissions?.some(p => p.module === 'expensetype' && p.action === 'delete' && p.isActive)) {
      setError('You do not have permission to delete expense types');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this expense type?')) {
      return;
    }

    try {
      setError(null);
      await deleteExpenseType(id);
      await fetchExpenseTypes();
    } catch (error) {
      console.error('Error deleting expense type:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete expense type. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (authError) {
    return (
      <Box p={3}>
        <Alert severity="error">{authError}</Alert>
      </Box>
    );
  }

  return (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        py: 8,
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={4}
          >
            <Stack spacing={1}>
              <Typography variant="h4">
                Expense Types
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage expense categories and types
              </Typography>
            </Stack>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={() => { handleOpenDialog(); }}
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              New Expense Type
            </Button>
          </Stack>

          {error ? <Alert severity="error" onClose={() => { setError(null); }}>
              {error}
            </Alert> : null}

          <Card>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        Loading expense types...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : expenseTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        No expense types found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>{type.name}</TableCell>
                      <TableCell>{type.description || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: type.isActive ? 'success.main' : 'error.main',
                            fontWeight: 'bold',
                          }}
                        >
                          {type.isActive ? 'Active' : 'Inactive'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {type.createdAt ? new Date(type.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {user?.role?.permissions?.some(p => p.module === 'expensetype' && (p.action === 'update' || p.action === 'delete') && p.isActive) ? <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              onClick={() => { handleOpenDialog(type); }}
                            >
                              <PencilSimple />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(type.id)}
                            >
                              <Trash />
                            </IconButton>
                          </Stack> : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </Stack>
      </Container>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {isEdit ? 'Edit Expense Type' : 'New Expense Type'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2, minWidth: 300 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => { setFormData({ ...formData, name: e.target.value }); }}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => { setFormData({ ...formData, description: e.target.value }); }}
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => { setFormData({ ...formData, isActive: e.target.checked }); }}
                  color="primary"
                />
              }
              label="Active Status"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 