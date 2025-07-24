'use client';

import React from 'react';
import { ViewInvoices } from '@/components/dashboard/invoiceGenerator/ViewInvoices';
import { Box } from '@mui/material';

const ViewInvoicesPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <ViewInvoices />
    </Box>
  );
};

export default ViewInvoicesPage; 