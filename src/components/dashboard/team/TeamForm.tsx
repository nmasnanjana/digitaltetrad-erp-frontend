'use client';

import React, { useState, useEffect } from 'react';
import { Team } from '@/types/team';
import { Box, Button, Grid, TextField, MenuItem, Alert, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select } from '@mui/material';
import { useRouter } from 'next/navigation';
import { getAllUsers } from '@/api/userApi';
import { User } from '@/types/user';
import { createTeam, updateTeam } from '@/api/teamApi';

interface TeamFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  team?: Team | null;
  mode: 'create' | 'edit';
}

const TeamForm: React.FC<TeamFormProps> = ({
  open,
  onClose,
  onSuccess,
  team,
  mode,
}) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<Team['type']>('internal');
  const [company, setCompany] = useState('');
  const [leaderId, setLeaderId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await getAllUsers();
        setUsers(response.data);
      } catch (err) {
        setError('Failed to load users');
      }
    };

    if (open) {
      loadUsers();
    }
  }, [open]);

  // Reset form when opened/closed
  useEffect(() => {
    if (open) {
      if (team) {
        setName(team.name);
        setType(team.type);
        setCompany(team.company || '');
        setLeaderId(team.leader_id || '');
      } else {
        setName('');
        setType('internal');
        setCompany('');
        setLeaderId('');
      }
      setError(null);
    }
  }, [open, team]);

  const handleClose = () => {
    setName('');
    setType('internal');
    setCompany('');
    setLeaderId('');
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate form
    if (!name.trim()) {
      setError('Team name is required');
      setLoading(false);
      return;
    }

    if (type === 'external' && !company.trim()) {
      setError('Company name is required for external teams');
      setLoading(false);
      return;
    }

    if (type === 'internal' && !leaderId) {
      setError('Team leader is required for internal teams');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'create') {
        await createTeam({
          name: name.trim(),
          type,
          company: type === 'external' ? company.trim() : undefined,
          leader_id: type === 'internal' ? leaderId : undefined
        });
      } else if (team) {
        await updateTeam(team.id.toString(), {
          name: name.trim(),
          type,
          company: type === 'external' ? company.trim() : undefined,
          leader_id: type === 'internal' ? leaderId : undefined
        });
      }
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Error creating/updating team:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving the team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {mode === 'create' ? 'Create Team' : 'Edit Team'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            margin="dense"
            label="Name"
            type="text"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={type}
              label="Type"
              onChange={(e) => setType(e.target.value as Team['type'])}
              required
            >
              <MenuItem value="internal">Internal</MenuItem>
              <MenuItem value="external">External</MenuItem>
            </Select>
          </FormControl>
          {type === 'external' && (
            <TextField
              margin="dense"
              label="Company"
              type="text"
              fullWidth
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              sx={{ mb: 2 }}
            />
          )}
          {type === 'internal' && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Team Leader</InputLabel>
              <Select
                value={leaderId}
                label="Team Leader"
                onChange={(e) => setLeaderId(e.target.value)}
                required
              >
                {users.map((user) => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
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

export default TeamForm;
