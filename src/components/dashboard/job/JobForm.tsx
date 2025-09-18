'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { createJob, updateJob } from '@/api/job-api';
import { type Job } from '@/types/job';
import { getAllTeams, type TeamPaginationResponse } from '@/api/teamApi';
import { getAllCustomers } from '@/api/customer-api';
import { type Team } from '@/types/team';
import { type Customer } from '@/types/customer';

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  job?: Job | null;
  mode: 'create' | 'edit';
}

const JobForm: React.FC<JobFormProps> = ({
  open,
  onClose,
  onSuccess,
  job,
  mode,
}) => {
  const [name, setName] = useState('');
  const [status, setStatus] = useState<Job['status']>('open');
  const [type, setType] = useState<Job['type']>('supply and installation');
  const [teamId, setTeamId] = useState<number>(0);
  const [customerId, setCustomerId] = useState<number>(0);
  const [jobId, setJobId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Load teams and customers
  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsResponse, customersResponse] = await Promise.all([
          getAllTeams(),
          getAllCustomers(),
        ]);
        // Handle paginated response from getAllTeams
        setTeams(teamsResponse.data.teams);
        setCustomers(customersResponse.data);
      } catch (err) {
        setError('Failed to load teams and customers');
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Reset form when opened/closed
  useEffect(() => {
    if (open) {
      if (job) {
        setName(job.name);
        setStatus(job.status);
        setType(job.type);
        setTeamId(job.team_id);
        setCustomerId(job.customer_id);
        setJobId(job.id);
      } else {
        setName('');
        setStatus('open');
        setType('supply and installation');
        setTeamId(0);
        setCustomerId(0);
        setJobId('');
      }
      setError(null);
    }
  }, [open, job]);

  const handleClose = () => {
    setName('');
    setStatus('open');
    setType('supply and installation');
    setTeamId(0);
    setCustomerId(0);
    setJobId('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate form
    if (!jobId.trim() && mode === 'create') {
      setError('Job ID is required');
      setLoading(false);
      return;
    }

    if (!name.trim()) {
      setError('Job name is required');
      setLoading(false);
      return;
    }

    if (!teamId) {
      setError('Please select a team');
      setLoading(false);
      return;
    }

    if (!customerId) {
      setError('Please select a customer');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'create') {
        await createJob({ 
          id: jobId.trim(),
          name: name.trim(), 
          status: 'open', // Always set to 'open' for new jobs
          type, 
          team_id: teamId, 
          customer_id: customerId 
        });
      } else if (job) {
        await updateJob(job.id, { 
          name: name.trim(), 
          type, 
          team_id: teamId, 
          customer_id: customerId 
        });
      }
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error creating/updating job:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? 'Create Job' : 'Edit Job'}
        </DialogTitle>
        <DialogContent>
          {error ? <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert> : null}
          {mode === 'create' && (
            <TextField
              autoFocus
              margin="dense"
              label="Job ID"
              type="text"
              fullWidth
              value={jobId}
              onChange={(e) => { setJobId(e.target.value); }}
              required
              sx={{ mb: 2 }}
            />
          )}
          <TextField
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => { setName(e.target.value); }}
            required
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => { setStatus(e.target.value as Job['status']); }}
              required
              disabled
            >
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in progress">In Progress</MenuItem>
              <MenuItem value="installed">Installed</MenuItem>
              <MenuItem value="qc">QC</MenuItem>
              <MenuItem value="pat">PAT</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              label="Type"
              onChange={(e) => { setType(e.target.value as Job['type']); }}
              required
            >
              <MenuItem value="supply and installation">Supply and Installation</MenuItem>
              <MenuItem value="installation">Installation</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Team</InputLabel>
            <Select
              value={teamId}
              label="Team"
              onChange={(e) => { setTeamId(Number(e.target.value)); }}
              required
            >
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Customer</InputLabel>
            <Select
              value={customerId}
              label="Customer"
              onChange={(e) => { setCustomerId(Number(e.target.value)); }}
              required
            >
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default JobForm; 