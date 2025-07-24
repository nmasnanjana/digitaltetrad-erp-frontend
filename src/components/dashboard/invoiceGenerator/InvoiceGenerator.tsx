import React from 'react';
import { Box } from '@mui/material';
import { HuaweiInvoice } from './HuaweiInvoice';

export const InvoiceGenerator: React.FC = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <HuaweiInvoice />
    </Box>
  );
}; 