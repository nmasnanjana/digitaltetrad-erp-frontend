'use client';

import * as React from 'react';
import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2'; // Using Grid2

import UserForm from '@/components/dashboard/user/UserForm';
import { createUser } from '@/api/userApi';
import { config } from '@/config';

export const metadata = { title: `Create User | Dashboard | ${config.site.name}` } satisfies Metadata;

export default function UserCreatePage(): React.JSX.Element {
  const handleCreate = async (data: any) => {
    await createUser(data);
    window.location.href = '/dashboard';
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
          <UserForm onSubmit={handleCreate} />
        </Grid>
      </Grid>
    </Stack>
  );
}
