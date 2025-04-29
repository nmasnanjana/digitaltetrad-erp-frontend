'use client';

import React, { useEffect, useState } from 'react';
import { getAllUsers, deleteUser } from '@/api/userApi'; // adjust path if needed
import { User } from '@/types/user';
import { Box, Button, Link, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

export const ListUser: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = async () => {
    const res = await getAllUsers();
    setUsers(res.data);
  };

  const handleDelete = async (id: string) => {
    await deleteUser(id);
    loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <Box width="100%" overflow="auto">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(u => (
            <TableRow key={u.id}>
              <TableCell>{u.firstName} {u.lastName}</TableCell>
              <TableCell>{u.username}</TableCell>
              <TableCell>{u.role}</TableCell>
              <TableCell>
                <Link href={`/edit/${u.id}`} underline="hover" sx={{ mr: 1 }}>Edit</Link>
                <Button variant="outlined" color="error" size="small" onClick={() => handleDelete(u.id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
