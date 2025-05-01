'use client';

import React, { useState } from 'react';
import { Role, User } from '@/types/user';
import { Box, Button, Grid, TextField, MenuItem, Alert, Typography, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';

interface Props {
  onSubmit: (data: any) => void;
  initialData?: Partial<User>;
  mode?: 'create' | 'edit';
}

const UserForm: React.FC<Props> = ({ onSubmit, initialData = {}, mode = 'create' }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    username: initialData.username || '',
    email: initialData.email || '',
    role: initialData.role || 'user',
    password: '',
    password_confirmation: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'create' && (!formData.password || !formData.password_confirmation)) {
      setError('Password and confirmation are required');
      return;
    }

    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    try {
      await onSubmit(formData);
      router.push('/dashboard/user');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        {mode === 'create' ? 'Create New User' : 'Edit User'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              select
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              variant="outlined"
            >
              {['admin', 'user', 'viewer', 'developer'].map((role) => (
                <MenuItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {mode === 'create' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="Confirm Password"
                  name="password_confirmation"
                  type="password"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
            </>
          )}
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => router.push('/dashboard/user')}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {mode === 'create' ? 'Create User' : 'Update User'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default UserForm;
