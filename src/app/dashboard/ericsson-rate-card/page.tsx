'use client';

import React from 'react';
import { EricssonRateCardManager } from '@/components/dashboard/ericsson-rate-card/EricssonRateCardManager';
import { Box } from '@mui/material';

function EricssonRateCardPage() {
  return (
    <Box sx={{ p: 1 }}>
      <EricssonRateCardManager />
    </Box>
  );
}

export default EricssonRateCardPage; 