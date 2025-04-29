'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { getTeamById, updateTeam } from '@/api/teamApi';
import TeamForm from '@/components/dashboard/team/TeamForm';
import { Team } from '@/types/team';
import { Alert } from '@mui/material';

export default function EditTeamPage(): React.JSX.Element {
  const params = useParams();
  const teamId = params.id as string;
  const [team, setTeam] = React.useState<Team | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

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

  const handleUpdate = async (data: any) => {
    try {
      await updateTeam(teamId, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team');
      throw err;
    }
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
            onSubmit={handleUpdate} 
            mode="edit" 
            initialData={{
              name: team.name,
              type: team.type,
              company: team.company,
              leader_id: team.leader_id,
            }}
          />
        </Grid>
      </Grid>
    </Stack>
  );
} 