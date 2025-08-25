import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { HuaweiInvoice } from './HuaweiInvoice';
import { EricssonInvoice } from './EricssonInvoice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`invoice-tabpanel-${index}`}
      aria-labelledby={`invoice-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const InvoiceGenerator: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="invoice generator tabs">
          <Tab label="Huawei Invoice" id="invoice-tab-0" aria-controls="invoice-tabpanel-0" />
          <Tab label="Ericsson Invoice" id="invoice-tab-1" aria-controls="invoice-tabpanel-1" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <HuaweiInvoice />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <EricssonInvoice />
      </TabPanel>
    </Box>
  );
}; 