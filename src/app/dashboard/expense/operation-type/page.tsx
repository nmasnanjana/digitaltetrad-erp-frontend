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
} from '@mui/material';
import { Plus, PencilSimple, Trash } from '@phosphor-icons/react/dist/ssr';
import { getAllOperationTypes, createOperationType, updateOperationType, deleteOperationType } from '@/api/operationTypeApi';
import { OperationType } from '@/types/expense';

export default function OperationTypePage() {
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [selectedType, setSelectedType] = useState<OperationType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchOperationTypes();
  }, []);

  const fetchOperationTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllOperationTypes();
      setOperationTypes(response.data);
    } catch (error) {
      console.error('Error fetching operation types:', error);
      setError(error instanceof Error ? error.message : 'Failed to load operation types. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type?: OperationType) => {
    if (type) {
      setSelectedType(type);
      setFormData({
        name: type.name,
        description: type.description || '',
      });
      setIsEdit(true);
    } else {
      setSelectedType(null);
      setFormData({
        name: '',
        description: '',
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
    });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      if (isEdit && selectedType) {
        await updateOperationType(selectedType.id, formData);
      } else {
        await createOperationType(formData);
      }
      await fetchOperationTypes();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving operation type:', error);
      setError(error instanceof Error ? error.message : 'Failed to save operation type. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this operation type?')) {
      return;
    }

    try {
      setError(null);
      await deleteOperationType(id);
      await fetchOperationTypes();
    } catch (error) {
      console.error('Error deleting operation type:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete operation type. Please try again.');
    }
  };

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
                Operation Types
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage operation categories and types
              </Typography>
            </Stack>
            <Button
              variant="contained"
              startIcon={<Plus />}
              onClick={() => handleOpenDialog()}
            >
              New Type
            </Button>
          </Stack>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

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
                        Loading operation types...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : operationTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">
                        No operation types found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  operationTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell>{type.name}</TableCell>
                      <TableCell>{type.description}</TableCell>
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
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            onClick={() => handleOpenDialog(type)}
                            color="primary"
                            size="small"
                          >
                            <PencilSimple />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(type.id)}
                            color="error"
                            size="small"
                          >
                            <Trash />
                          </IconButton>
                        </Stack>
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
          {isEdit ? 'Edit Operation Type' : 'New Operation Type'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2, minWidth: 300 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
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