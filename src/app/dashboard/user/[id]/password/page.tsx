'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { updateUserPassword } from '@/api/userApi';
import { UpdatePasswordForm } from '@/components/dashboard/user/UpdatePasswordForm';

export default function UpdatePasswordPage(): React.JSX.Element {
  const params = useParams();
  const userId = params.id as string;

  const handleUpdatePassword = async (data: { currentPassword: string; newPassword: string; newPasswordConfirm: string }) => {
    await updateUserPassword(userId, data);
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={3} alignItems="center" justifyContent="space-between">
        <Grid xs="auto">
          <Typography variant="h4">Update Password</Typography>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <UpdatePasswordForm
            userId={userId}
            onSubmit={handleUpdatePassword}
          />
        </Grid>
      </Grid>
    </Stack>
  );
} 