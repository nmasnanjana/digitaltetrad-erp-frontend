'use client';

import * as React from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import { ListUser } from '@/components/dashboard/user/UserList';

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Grid container spacing={3} alignItems="center" justifyContent="space-between">
        <Grid xs={12} sm="auto">
          <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            Users
          </Typography>
        </Grid>
        <Grid xs={12} sm="auto">
          <Button 
            variant="contained" 
            href="/dashboard/userCreation"
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              order: { xs: -1, sm: 0 }
            }}
          >
            Create User
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <ListUser />
        </Grid>
      </Grid>
    </Stack>
  );
}
