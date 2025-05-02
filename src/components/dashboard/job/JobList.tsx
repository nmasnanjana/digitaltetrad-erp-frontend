'use client';

import React, { useEffect, useState } from 'react';
import { getAllJobs, deleteJob } from '@/api/jobApi';
import { Job } from '@/types/job';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import JobForm from './JobForm';
import { useRouter } from 'next/navigation';

export const ListJob: React.FC = () => {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await getAllJobs();
      setJobs(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedJob) return;
    
    try {
      await deleteJob(selectedJob.id.toString());
      setDeleteDialogOpen(false);
      loadJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete job');
    }
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedJob(null);
    setFormMode('create');
    setFormOpen(true);
  };

  useEffect(() => {
    loadJobs();
  }, []);

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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Jobs</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Add Job
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.name}</TableCell>
                <TableCell>
                  <Chip
                    label={job.status}
                    color={getStatusColor(job.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={job.type}
                    color={getTypeColor(job.type)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{job.team?.name || '-'}</TableCell>
                <TableCell>{job.customer?.name || '-'}</TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => router.push(`/dashboard/job/${job.id}/view`)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => handleEdit(job)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => {
                      setSelectedJob(job);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          Are you sure you want to delete job {selectedJob?.name}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <JobForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSuccess={loadJobs}
        job={selectedJob}
        mode={formMode}
      />
    </Box>
  );
}; 