'use client';

import React from 'react';
import { ViewInvoices } from '@/components/dashboard/invoiceGenerator/ViewInvoices';
import { Box } from '@mui/material';

function ViewInvoicesPage() {
  return (
    <Box sx={{ p: 1 }}>
      <ViewInvoices />
    </Box>
  );
}

export default ViewInvoicesPage; 