import React from 'react';
import { Job } from '@/types/job';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useRouter } from 'next/navigation';

interface JobViewProps {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (newStatus: Job['status']) => void;
}

export const JobView: React.FC<JobViewProps> = ({
  job,
  onEdit,
  onDelete,
  onUpdateStatus,
}) => {
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [nextStatus, setNextStatus] = React.useState<Job['status'] | null>(null);

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in progress':
        return 'primary';
      case 'installed':
        return 'info';
      case 'qc':
        return 'warning';
      case 'pat':
        return 'secondary';
      case 'closed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: Job['type']) => {
    switch (type) {
      case 'supply and installation':
        return 'primary';
      case 'installation':
        return 'secondary';
      case 'maintenance':
        return 'info';
      default:
        return 'default';
    }
  };

  const getNextStatus = (currentStatus: Job['status']): Job['status'] | null => {
    const statusOrder: Job['status'][] = ['open', 'in progress', 'installed', 'qc', 'pat', 'closed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    return currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;
  };

  const handleStatusUpdate = () => {
    if (nextStatus) {
      onUpdateStatus(nextStatus);
      setStatusDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Job Details
          </Typography>
          <Divider />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Job ID
            </Typography>
            <Typography variant="body1">{job.id}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Job Name
            </Typography>
            <Typography variant="body1">{job.name}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={job.status}
                color={getStatusColor(job.status)}
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Type
            </Typography>
            <Chip
              label={job.type}
              color={getTypeColor(job.type)}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Team
            </Typography>
            <Typography variant="body1">
              {job.team?.name || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Customer
            </Typography>
            <Typography variant="body1">
              {job.customer?.name || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Created At
            </Typography>
            <Typography variant="body1">
              {job.createdAt ? new Date(job.createdAt).toLocaleString() : '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1">
              {job.updatedAt ? new Date(job.updatedAt).toLocaleString() : '-'}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          {getNextStatus(job.status) && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setNextStatus(getNextStatus(job.status));
                setStatusDialogOpen(true);
              }}
            >
              Next Phase
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={onEdit}
          >
            Edit Job
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onDelete}
          >
            Delete Job
          </Button>
        </Box>
      </CardContent>

      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
        <DialogTitle>Update Job Status</DialogTitle>
        <DialogContent>
          Are you sure you want to update the job status to {nextStatus}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleStatusUpdate} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}; 