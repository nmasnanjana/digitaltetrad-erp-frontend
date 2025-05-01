'use client';

import React from 'react';
import { ListJob } from '@/components/dashboard/job/JobList';
import { Box } from '@mui/material';

const JobPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <ListJob />
    </Box>
  );
};

export default JobPage; 