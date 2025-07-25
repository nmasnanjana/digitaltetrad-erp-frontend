'use client';

import React from 'react';
import { Settings } from '@/components/dashboard/settings/Settings';
import { Box } from '@mui/material';

const SettingsPage = () => {
  return (
    <Box sx={{ p: 1 }}>
      <Settings />
    </Box>
  );
};

export default SettingsPage;
