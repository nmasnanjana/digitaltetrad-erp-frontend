import * as React from 'react';
import type { Metadata } from 'next';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2'; // Using Grid2
import Button from "@mui/material/Button";

import { config } from '@/config';
import { ListUser } from "@/components/dashboard/user/UserList";

export const metadata = { title: `Account | Dashboard | ${config.site.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
  return (
    <Stack spacing={3}>
      <Grid container spacing={3} alignItems="center" justifyContent="space-between">
        <Grid xs="auto">
          <Typography variant="h4">User</Typography>
        </Grid>
        <Grid xs="auto">
          <Button variant="contained" href="/dashboard/userCreation">Create User</Button>
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
