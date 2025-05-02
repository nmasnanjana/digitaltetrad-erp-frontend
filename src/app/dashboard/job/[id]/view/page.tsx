'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { getJobById, deleteJob, updateJob } from '@/api/jobApi';
import { JobView } from '@/components/dashboard/job/JobView';
import { Job } from '@/types/job';
import { Alert } from '@mui/material';

export default function ViewJobPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = React.useState<Job | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchJob = async () => {
    try {
      const response = await getJobById(jobId);
      setJob(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchJob();
  }, [jobId]);

  const handleDelete = async () => {
    if (!job) return;
    
    try {
      await deleteJob(job.id.toString());
      router.push('/dashboard/job');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/job/${jobId}`);
  };

  const handleUpdateStatus = async (newStatus: Job['status']) => {
    if (!job) return;
    
    try {
      await updateJob(job.id.toString(), { status: newStatus });
      await fetchJob(); // Refresh the job data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!job) {
    return <Alert severity="error">Job not found</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Grid container spacing={3} alignItems="center" justifyContent="space-between">
        <Grid xs="auto">
          <Typography variant="h4">View Job</Typography>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <JobView
            job={job}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUpdateStatus={handleUpdateStatus}
          />
        </Grid>
      </Grid>
    </Stack>
  );
} 