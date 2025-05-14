'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { getJobById, updateJob } from '@/api/jobApi';
import JobForm from '@/components/dashboard/job/JobForm';
import { Job } from '@/types/job';
import { Alert } from '@mui/material';

export default function EditJobPage(): React.JSX.Element {
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

  const handleSubmit = async (data: Partial<Job>) => {
    try {
      await updateJob(jobId, data);
      router.push(`/dashboard/job/${jobId}/view`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job');
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
          <Typography variant="h4">Edit Job</Typography>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <JobForm
            open={true}
            onClose={() => router.push(`/dashboard/job/${jobId}/view`)}
            onSuccess={() => router.push(`/dashboard/job/${jobId}/view`)}
            job={job}
            mode="edit"
          />
        </Grid>
      </Grid>
    </Stack>
  );
} 