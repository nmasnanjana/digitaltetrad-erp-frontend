'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import TeamForm from '@/components/dashboard/team/TeamForm';
import { createTeam } from '@/api/teamApi';

export default function TeamCreatePage(): React.JSX.Element {
  const handleCreate = async (data: any) => {
    await createTeam(data);
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={3} alignItems="center" justifyContent="space-between">
        <Grid xs="auto">
          <Typography variant="h4">Create Team</Typography>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <TeamForm onSubmit={handleCreate} mode="create" />
        </Grid>
      </Grid>
    </Stack>
  );
} 