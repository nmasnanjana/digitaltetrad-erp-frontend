'use client';

import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { ExpenseList } from '@/components/dashboard/expense/ExpenseList';
import { ExpenseTypeList } from '@/components/dashboard/expense/ExpenseTypeList';
import { OperationTypeList } from '@/components/dashboard/expense/OperationTypeList';

const ExpensePage = () => {
  const [activeTab, setActiveTab] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Expenses" />
        <Tab label="Expense Types" />
        <Tab label="Operation Types" />
      </Tabs>
      {activeTab === 0 && <ExpenseList />}
      {activeTab === 1 && <ExpenseTypeList />}
      {activeTab === 2 && <OperationTypeList />}
    </Box>
  );
};

export default ExpensePage; 