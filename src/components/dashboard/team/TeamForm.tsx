'use client';

import React, { useState, useEffect } from 'react';
import { Team } from '@/types/team';
import { Box, Button, Grid, TextField, MenuItem, Alert, Typography, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { getAllUsers } from '@/api/userApi';
import { User } from '@/types/user';

interface Props {
  onSubmit: (data: any) => void;
  initialData?: Partial<Team>;
  mode?: 'create' | 'edit';
}

const TeamForm: React.FC<Props> = ({ onSubmit, initialData = {}, mode = 'create' }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    type: initialData.type || 'internal',
    company: initialData.company || '',
    leader_id: initialData.leader_id || '',
  });
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers();
        setUsers(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (name === 'type' && value === 'internal') {
        newData.company = '';
      }
      return newData;
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type || !formData.leader_id) {
      setError('Name, type, and leader are required');
      return;
    }

    if (formData.type === 'external' && !formData.company) {
      setError('Company is required for external teams');
      return;
    }

    try {
      await onSubmit(formData);
      router.push('/dashboard/team');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return <Box>Loading users...</Box>;
  }

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        {mode === 'create' ? 'Create New Team' : 'Edit Team'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Team Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              select
              label="Team Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              variant="outlined"
            >
              {['internal', 'external'].map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {formData.type === 'external' && (
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              select
              label="Team Leader"
              name="leader_id"
              value={formData.leader_id}
              onChange={handleChange}
              variant="outlined"
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.username})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" color="secondary" onClick={() => router.push('/dashboard/team')}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {mode === 'create' ? 'Create Team' : 'Update Team'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default TeamForm;
