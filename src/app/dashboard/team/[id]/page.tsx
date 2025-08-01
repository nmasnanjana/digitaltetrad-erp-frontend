'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { getTeamById } from '@/api/teamApi';
import TeamForm from '@/components/dashboard/team/TeamForm';
import { Team } from '@/types/team';
import { Alert } from '@mui/material';

export default function EditTeamPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const [team, setTeam] = React.useState<Team | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editDialogOpen, setEditDialogOpen] = React.useState(true);

  React.useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await getTeamById(teamId);
        setTeam(response.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team details');
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId]);

  const handleClose = () => {
    setEditDialogOpen(false);
    router.push('/dashboard/team');
  };

  const handleSuccess = () => {
    setEditDialogOpen(false);
    router.push('/dashboard/team');
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!team) {
    return <Alert severity="error">Team not found</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Grid container spacing={3} alignItems="center" justifyContent="space-between">
        <Grid xs="auto">
          <Typography variant="h4">Edit Team</Typography>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <TeamForm
            open={editDialogOpen}
            onClose={handleClose}
            onSuccess={handleSuccess}
            team={team}
            mode="edit"
          />
        </Grid>
      </Grid>
    </Stack>
  );
} 