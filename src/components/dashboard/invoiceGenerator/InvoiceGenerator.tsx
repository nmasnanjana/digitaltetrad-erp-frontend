import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { HuaweiInvoice } from './HuaweiInvoice';
import { getAllCustomers } from '@/api/customerApi';

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const InvoiceGenerator: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [huaweiCustomerId, setHuaweiCustomerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHuaweiCustomer();
  }, []);

  const loadHuaweiCustomer = async () => {
    try {
      setLoading(true);
      const response = await getAllCustomers();
      const huaweiCustomer = response.data.find((customer: any) => 
        customer.name?.toLowerCase().includes('huawei')
      );
      
      if (huaweiCustomer) {
        setHuaweiCustomerId(huaweiCustomer.id);
      } else {
        setError('Huawei customer not found in database');
      }
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Invoice Generator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate and manage invoices for your customers.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="invoice tabs">
              <Tab label="Huawei" />
              {/* Add more tabs for other customers here */}
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Huawei Invoice Generation
              </Typography>
              
              {huaweiCustomerId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Using Huawei Customer ID: {huaweiCustomerId}
                </Alert>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Create invoices for Huawei customer. You can upload Excel files containing PO numbers and line numbers, 
                set percentages, and manage existing invoices.
              </Typography>

              {huaweiCustomerId ? (
                <HuaweiInvoice />
              ) : loading ? (
                <Typography variant="body2" color="text.secondary">
                  Loading Huawei customer information...
                </Typography>
              ) : (
                <Alert severity="warning">
                  Huawei customer not found. Please ensure Huawei customer exists in the database.
                </Alert>
              )}
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}; 