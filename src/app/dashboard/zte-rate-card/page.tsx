'use client';

import React from 'react';
import { ZteRateCardManager } from '@/components/dashboard/zte-rate-card/ZteRateCardManager';
import { Box } from '@mui/material';

function ZteRateCardPage() {
  return (
    <Box sx={{ p: 1 }}>
      <ZteRateCardManager />
    </Box>
  );
}

export default ZteRateCardPage;
