'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import { ListTeam } from '@/components/dashboard/team/TeamList';
import TeamForm from '@/components/dashboard/team/TeamForm';

export default function Page(): React.JSX.Element {
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    setRefreshKey(prev => prev + 1); // Trigger refresh of team list
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={3} alignItems="center" justifyContent="space-between">
        <Grid xs="auto">
          <Typography variant="h4">Teams</Typography>
        </Grid>
        <Grid xs="auto">
          <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
            Create Team
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <ListTeam key={refreshKey} />
        </Grid>
      </Grid>

      <TeamForm
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
        mode="create"
      />
    </Stack>
  );
} 