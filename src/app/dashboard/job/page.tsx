'use client';

import React from 'react';
import { ListJob } from '@/components/dashboard/job/JobList';
import { Box } from '@mui/material';

function JobPage() {
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <ListJob />
    </Box>
  );
}

export default JobPage; 