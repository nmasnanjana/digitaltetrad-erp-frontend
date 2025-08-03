'use client';

import React from 'react';
import { ListCustomer } from '@/components/dashboard/customer/CustomerList';
import { Box } from '@mui/material';

function CustomerPage() {
  return (
    <Box sx={{ p: 3 }}>
      <ListCustomer />
    </Box>
  );
}

export default CustomerPage; 