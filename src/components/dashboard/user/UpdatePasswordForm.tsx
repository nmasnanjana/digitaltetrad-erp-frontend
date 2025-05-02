import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Alert,
  Typography,
  Paper,
} from '@mui/material';
import { useRouter } from 'next/navigation';

interface UpdatePasswordFormProps {
  userId: string;
  onSubmit: (data: { currentPassword: string; newPassword: string; newPasswordConfirm: string }) => Promise<void>;
}

export const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = ({
  userId,
  onSubmit,
}) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.newPasswordConfirm) {
      setError('All password fields are required');
      return;
    }

    if (formData.newPassword !== formData.newPasswordConfirm) {
      setError('New passwords do not match');
      return;
    }

    try {
      await onSubmit(formData);
      router.push(`/dashboard/user/${userId}/view`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Update Password
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Box sx={{ mb: 3 }}>
          <TextField
            required
            fullWidth
            label="Current Password"
            name="currentPassword"
            type="password"
            value={formData.currentPassword}
            onChange={handleChange}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            required
            fullWidth
            label="New Password"
            name="newPassword"
            type="password"
            value={formData.newPassword}
            onChange={handleChange}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            required
            fullWidth
            label="Confirm New Password"
            name="newPasswordConfirm"
            type="password"
            value={formData.newPasswordConfirm}
            onChange={handleChange}
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => router.push(`/dashboard/user/${userId}/view`)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Update Password
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}; 