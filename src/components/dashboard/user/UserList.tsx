'use client';

import React, { useEffect, useState } from 'react';
import { getAllUsers, deleteUser } from '@/api/userApi';
import { type User } from '@/types/user';
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
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

export const ListUser: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      if (response.data) {
        // Format the user data to ensure proper structure
        const formattedUsers = response.data.map((user: any) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName || '',
          username: user.username,
          email: user.email || '',
          roleId: user.roleId,
          isActive: user.isActive,
          lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
          createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined,
          role: user.role ? {
            id: user.role.id,
            name: user.role.name,
            description: user.role.description || '',
            isActive: user.role.isActive,
            permissions: user.role.permissions || [],
            createdAt: user.role.createdAt || new Date().toISOString(),
            updatedAt: user.role.updatedAt || new Date().toISOString(),
          } : undefined,
        }));
        setUsers(formattedUsers);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      setDeleteDialogOpen(false);
    loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Box>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert> : null}

      <TableContainer component={Paper} sx={{ 
        overflowX: 'auto',
        '& .MuiTable-root': {
          minWidth: { xs: 500, sm: 700, md: 800 }
        }
      }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}>Name</TableCell>
            <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Username</TableCell>
            <TableCell sx={{ minWidth: { xs: 120, sm: 150 }, display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
            <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Role</TableCell>
            <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Status</TableCell>
            <TableCell align="right" sx={{ minWidth: { xs: 120, sm: 140 } }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {user.email || '-'}
                </TableCell>
              <TableCell>
                  {user.role ? (
                  <Typography
                    variant="body2"
                    sx={{
                      textTransform: 'capitalize',
                        color: user.role.name.toLowerCase() === 'admin' ? 'primary.main' : 'text.primary',
                    }}
                  >
                      {user.role.name}
                  </Typography>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.isActive ? 'Active' : 'Inactive'}
                    color={user.isActive ? 'success' : 'error'}
                    size="small"
                  />
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
                      onClick={() => { router.push(`/dashboard/user/${user.id}/view`); }}
                      size="small"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => { router.push(`/dashboard/user/${user.id}`); }}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => {
                        setSelectedUser(user);
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
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          Are you sure you want to delete user {selectedUser?.firstName} {selectedUser?.lastName}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); }}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
