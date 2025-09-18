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
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Pagination } from './Pagination';

export const ListUser: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const loadUsers = async (page: number = currentPage, itemsPerPage: number = limit, search: string = searchTerm) => {
    try {
      setLoading(true);
      const response = await getAllUsers(page, itemsPerPage, search);
      if (response.data) {
        // Format the user data to ensure proper structure
        const formattedUsers = response.data.users.map((user: any) => ({
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
        setPagination(response.data.pagination);
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadUsers(page, limit);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
    loadUsers(1, newLimit, searchTerm);
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    setCurrentPage(1); // Reset to first page when searching
    loadUsers(1, limit, search);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setCurrentPage(1);
    loadUsers(1, limit, '');
  };

  useEffect(() => {
    loadUsers(currentPage, limit, searchTerm);
  }, [currentPage, limit, searchTerm]);

  return (
    <Box>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert> : null}

      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search users by name, username, or email..."
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchTerm && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={clearSearch}
                edge="end"
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
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
          
          {/* Pagination */}
          {pagination.totalCount > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              limit={pagination.limit}
              hasNextPage={pagination.hasNextPage}
              hasPrevPage={pagination.hasPrevPage}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          )}
        </>
      )}

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
