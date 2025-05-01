'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import UserForm from '@/components/dashboard/user/UserForm';
import { createUser } from '@/api/userApi';

export default function UserCreatePage(): React.JSX.Element {
  const handleCreate = async (data: any) => {
    await createUser(data);
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={3} alignItems="center" justifyContent="space-between">
        <Grid xs="auto">
          <Typography variant="h4">Create User</Typography>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <UserForm onSubmit={handleCreate} mode="create" />
        </Grid>
      </Grid>
    </Stack>
  );
}
