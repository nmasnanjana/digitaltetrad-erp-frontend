'use client';

import React, { useState } from 'react';
import { IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { Trash as TrashIcon } from '@phosphor-icons/react/dist/ssr/Trash';
import { useUser } from '@/contexts/user-context';
import { clearSystemCache } from '@/lib/react-query/cache-manager';

export const CacheClearButton: React.FC = () => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Only show for developer role
  if (!user || user.role?.name !== 'developer') {
    return null;
  }

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await clearSystemCache();
      setIsOpen(false);
      // Show success message
      alert('System cache cleared successfully!');
    } catch (error) {
      console.error('Error clearing cache:', error);
      alert('Failed to clear system cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <Tooltip title="Clear System Cache (Developer Only)">
        <IconButton
          color="warning"
          onClick={() => setIsOpen(true)}
          sx={{ 
            backgroundColor: 'warning.light',
            color: 'warning.contrastText',
            '&:hover': {
              backgroundColor: 'warning.main',
            }
          }}
        >
          <TrashIcon />
        </IconButton>
      </Tooltip>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <DialogTitle>Clear System Cache</DialogTitle>
        <DialogContent>
          <Typography>
            This will clear the cache for ALL users currently using the system. 
            This action will:
          </Typography>
          <ul>
            <li>Clear all cached data for every user</li>
            <li>Force all users to reload fresh data</li>
            <li>Improve data consistency across the system</li>
          </ul>
          <Typography color="warning.main" sx={{ mt: 2 }}>
            <strong>Warning:</strong> This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsOpen(false)} disabled={isClearing}>
            Cancel
          </Button>
          <Button 
            onClick={handleClearCache} 
            color="warning" 
            variant="contained"
            disabled={isClearing}
          >
            {isClearing ? 'Clearing...' : 'Clear System Cache'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}; 