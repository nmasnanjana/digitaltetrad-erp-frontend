'use client';

import React from 'react';
import { InvoiceGenerator } from '@/components/dashboard/invoiceGenerator/InvoiceGenerator';
import { Box } from '@mui/material';

function InvoiceGeneratorPage() {
  return (
    <Box sx={{ p: 3 }}>
      <InvoiceGenerator />
    </Box>
  );
}

export default InvoiceGeneratorPage; 