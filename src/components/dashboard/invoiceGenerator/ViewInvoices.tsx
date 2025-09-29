"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  OutlinedInput,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { getAllInvoices, deleteInvoice, type InvoiceRecord } from '@/api/huawei-invoice-api';
import { getAllEricssonInvoices, deleteEricssonInvoice, type EricssonInvoiceData } from '@/api/ericsson-invoice-api';
import { getAllZteInvoices, deleteZteInvoice, type ZteInvoiceData } from '@/api/zte-invoice-api';
import { getSettings } from '@/api/settingsApi';
import { getAllCustomers } from '@/api/customer-api';
import { useSettings } from '@/contexts/SettingsContext';
import { generateInvoicePDF } from '@/utils/invoicePdfGenerator';
import { generateEricssonInvoicePDF } from '@/utils/ericssonInvoicePdfGenerator';

interface FilterState {
  customer: string;
  minAmount: string;
  maxAmount: string;
  fromDate: string;
  toDate: string;
}

export const ViewInvoices: React.FC = () => {
  const { formatCurrency, currencySymbol } = useSettings();
  
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [ericssonInvoices, setEricssonInvoices] = useState<EricssonInvoiceData[]>([]);
  const [zteInvoices, setZteInvoices] = useState<ZteInvoiceData[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceRecord[]>([]);
  const [filteredEricssonInvoices, setFilteredEricssonInvoices] = useState<EricssonInvoiceData[]>([]);
  const [filteredZteInvoices, setFilteredZteInvoices] = useState<ZteInvoiceData[]>([]);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<InvoiceRecord[]>([]);
  const [ericssonViewDialogOpen, setEricssonViewDialogOpen] = useState(false);
  const [selectedEricssonInvoice, setSelectedEricssonInvoice] = useState<EricssonInvoiceData | null>(null);
  const [zteViewDialogOpen, setZteViewDialogOpen] = useState(false);
  const [selectedZteInvoice, setSelectedZteInvoice] = useState<ZteInvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEricsson, setIsLoadingEricsson] = useState(false);
  const [isLoadingZte, setIsLoadingZte] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [filters, setFilters] = useState<FilterState>({
    customer: '',
    minAmount: '',
    maxAmount: '',
    fromDate: '',
    toDate: ''
  });

  useEffect(() => {
    loadAllInvoices();
    loadEricssonInvoices();
    loadZteInvoices();
    loadSettings();
  }, []);

  useEffect(() => {
    // Apply search and filters for Huawei invoices
    let filtered = invoices;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => {
        const searchLower = searchTerm.toLowerCase();
        return (
          invoice.invoiceNo.toLowerCase().includes(searchLower) ||
          invoice.huaweiPo?.poNo?.toLowerCase().includes(searchLower) ||
          invoice.huaweiPo?.itemCode?.toLowerCase().includes(searchLower) ||
          invoice.huaweiPo?.itemDescription?.toLowerCase().includes(searchLower) ||
          invoice.huaweiPo?.job?.name?.toLowerCase().includes(searchLower) ||
          invoice.huaweiPo?.customer?.name?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply customer filter
        if (filters.customer) {
      filtered = filtered.filter(invoice =>
        invoice.huaweiPo?.customer?.name === filters.customer
      );
    }
    
    // Apply amount filters
    if (filters.minAmount || filters.maxAmount) {
      filtered = filtered.filter(invoice => {
        const totalAmount = typeof invoice.totalAmount === 'string' ? parseFloat(invoice.totalAmount) : 
                           typeof invoice.totalAmount === 'number' ? invoice.totalAmount : 0;
        
        const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : 0;
        const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : Infinity;
        
        return totalAmount >= minAmount && totalAmount <= maxAmount;
      });
    }
    
    // Apply date filters
    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.createdAt);
        const fromDate = filters.fromDate ? new Date(filters.fromDate) : new Date(0);
        const toDate = filters.toDate ? new Date(filters.toDate) : new Date();
        
        return invoiceDate >= fromDate && invoiceDate <= toDate;
      });
    }
    
    setFilteredInvoices(filtered);
  }, [invoices, searchTerm, filters]);

  useEffect(() => {
    // Apply search and filters for Ericsson invoices
    let filtered = ericssonInvoices;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => {
        const searchLower = searchTerm.toLowerCase();
        return (
          invoice.invoice_number.toLowerCase().includes(searchLower) ||
          invoice.job_title.toLowerCase().includes(searchLower) ||
          invoice.customer_name.toLowerCase().includes(searchLower) ||
          invoice.project.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply customer filter
    if (filters.customer) {
      filtered = filtered.filter(invoice => 
        invoice.customer_name === filters.customer
      );
    }
    
    // Apply amount filters
    if (filters.minAmount || filters.maxAmount) {
      filtered = filtered.filter(invoice => {
        const totalAmount = invoice.total_amount || 0;
        const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : 0;
        const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : Infinity;
        
        return totalAmount >= minAmount && totalAmount <= maxAmount;
      });
    }
    
    // Apply date filters
    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter(invoice => {
        if (!invoice.createdAt) return false;
        const invoiceDate = new Date(invoice.createdAt);
        const fromDate = filters.fromDate ? new Date(filters.fromDate) : new Date(0);
        const toDate = filters.toDate ? new Date(filters.toDate) : new Date();
        
        return invoiceDate >= fromDate && invoiceDate <= toDate;
      });
    }
    
    setFilteredEricssonInvoices(filtered);
  }, [ericssonInvoices, searchTerm, filters]);

  useEffect(() => {
    // Apply search and filters for ZTE invoices
    let filtered = zteInvoices;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => {
        const searchLower = searchTerm.toLowerCase();
        return (
          invoice.invoice_no.toLowerCase().includes(searchLower) ||
          invoice.ztePo?.po_line_no?.toLowerCase().includes(searchLower) ||
          invoice.ztePo?.item_code?.toLowerCase().includes(searchLower) ||
          invoice.ztePo?.item_name?.toLowerCase().includes(searchLower) ||
          invoice.ztePo?.job?.name?.toLowerCase().includes(searchLower) ||
          invoice.ztePo?.job?.customer?.name?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    // Apply customer filter
    if (filters.customer) {
      filtered = filtered.filter(invoice =>
        invoice.ztePo?.job?.customer?.name === filters.customer
      );
    }
    
    // Apply amount filters
    if (filters.minAmount || filters.maxAmount) {
      filtered = filtered.filter(invoice => {
        const totalAmount = invoice.total_amount || 0;
        const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : 0;
        const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : Infinity;
        
        return totalAmount >= minAmount && totalAmount <= maxAmount;
      });
    }
    
    // Apply date filters
    if (filters.fromDate || filters.toDate) {
      filtered = filtered.filter(invoice => {
        if (!invoice.createdAt) return false;
        const invoiceDate = new Date(invoice.createdAt);
        const fromDate = filters.fromDate ? new Date(filters.fromDate) : new Date(0);
        const toDate = filters.toDate ? new Date(filters.toDate) : new Date();
        
        return invoiceDate >= fromDate && invoiceDate <= toDate;
      });
    }
    
    setFilteredZteInvoices(filtered);
  }, [zteInvoices, searchTerm, filters]);

  // Get unique customers for filter dropdown
  const uniqueCustomers = Array.from(new Set([
    ...invoices
      .map(invoice => invoice.huaweiPo?.customer?.name)
      .filter(Boolean),
    ...ericssonInvoices
      .map(invoice => invoice.customer_name)
      .filter(Boolean),
    ...zteInvoices
      .map(invoice => invoice.ztePo?.job?.customer?.name)
      .filter(Boolean)
  ])).sort();

  const clearSearch = () => {
    setSearchTerm('');
  };

  const clearFilters = () => {
    setFilters({
      customer: '',
      minAmount: '',
      maxAmount: '',
      fromDate: '',
      toDate: ''
    });
  };

  const clearAll = () => {
    clearSearch();
    clearFilters();
  };

  const loadAllInvoices = async () => {
    try {
      setIsLoading(true);
      console.log('Loading all invoices...');
      const response = await getAllInvoices();
      console.log('Response from getAllInvoices:', response);
      console.log('First invoice in response:', response[0]);
      console.log('First invoice huaweiPo:', response[0]?.huaweiPo);

      setInvoices(response);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEricssonInvoices = async () => {
    try {
      setIsLoadingEricsson(true);
      const response = await getAllEricssonInvoices();
      setEricssonInvoices(response.data);
    } catch (err) {
      console.error('Error loading Ericsson invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Ericsson invoices');
    } finally {
      setIsLoadingEricsson(false);
    }
  };

  const loadZteInvoices = async () => {
    try {
      setIsLoadingZte(true);
      const response = await getAllZteInvoices();
      setZteInvoices(response.data);
    } catch (err) {
      console.error('Error loading ZTE invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ZTE invoices');
    } finally {
      setIsLoadingZte(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await getSettings();
      setSettings(response);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    }
  };

  const handleViewInvoice = async (invoiceNo: string) => {
    try {
      const details = invoices.filter(invoice => invoice.invoiceNo === invoiceNo);
      
      setSelectedInvoiceDetails(details);
      setViewDialogOpen(true);
    } catch (err) {
      console.error('Error loading invoice details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoice details');
    }
  };

  const handleViewEricssonInvoice = (invoice: EricssonInvoiceData) => {
    console.log('Viewing Ericsson invoice:', invoice);
    console.log('Ericsson invoice items:', invoice.items);
    setSelectedEricssonInvoice(invoice);
    setEricssonViewDialogOpen(true);
  };

  const handleDeleteInvoice = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this invoice? This will also reduce the invoiced percentages from the PO records.')) {
      return;
    }

    try {
      await deleteInvoice(id);
      setSuccess('Invoice deleted successfully');
      await loadAllInvoices();
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  const handleDownloadPDF = async () => {
    if (selectedInvoiceDetails.length === 0) return;

    setIsDownloadingPDF(true);
    setError(null);

    try {
      console.log('Starting PDF generation...');
      
      // Get Huawei customer data
      const customersResponse = await getAllCustomers();
      const customers = customersResponse.data;
      const huaweiCustomer = customers.find((customer: any) => 
        customer.name.toLowerCase().includes('huawei')
      );
      
      if (!huaweiCustomer) {
        throw new Error('Huawei customer not found');
      }

      // Get settings data
      const settingsResponse = await getSettings();
      if (!settingsResponse.data) {
        throw new Error('Settings not found');
      }

      await generateInvoicePDF({
        invoiceDetails: selectedInvoiceDetails,
        settings: settingsResponse.data,
        huaweiCustomer
      });
      
      console.log('PDF generation completed successfully');
      setSuccess('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  // Group invoices by invoice number
  const groupedInvoices = filteredInvoices.reduce<Record<string, InvoiceRecord[]>>((groups, invoice) => {
    const invoiceNo = invoice.invoiceNo;
    if (!groups[invoiceNo]) {
      groups[invoiceNo] = [];
    }
    groups[invoiceNo].push(invoice);
    return groups;
  }, {});

  // Calculate summaries for each invoice group
  const invoiceSummaries = Object.entries(groupedInvoices).map(([invoiceNo, invoices]) => {
    const totalAmount = invoices.reduce((sum, invoice) => {
      const totalAmount = typeof invoice.totalAmount === 'string' ? parseFloat(invoice.totalAmount) : 
                         typeof invoice.totalAmount === 'number' ? invoice.totalAmount : 0;
      return sum + totalAmount;
    }, 0);

    const firstInvoice = invoices[0];
    

    return {
      invoiceNo,
      total_records: invoices.length,
      totalAmount,
      created_at: firstInvoice.createdAt,
      customer_name: firstInvoice.huaweiPo?.customer?.name || 'Unknown',
      job_name: firstInvoice.huaweiPo?.job?.name || 'Unknown',
      po_no: firstInvoice.huaweiPo?.poNo || 'N/A'
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <Box>
      <Card>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            All Invoices
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            View and manage all invoices across all customers
          </Typography>

          {/* Search Bar */}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by invoice number, customer, job, project, or any invoice details..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={clearSearch}
                    edge="end"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 1.5 }}
          />

          {/* Filter Section */}
          <Box sx={{ mb: 2 }}>
            <Card variant="outlined" sx={{ p: 1.5 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1.5 }}>
                Filters
              </Typography>
              <Grid container spacing={1.5}>
                {/* Customer Filter */}
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Customer</InputLabel>
                    <Select
                      value={filters.customer}
                      onChange={(e) => { setFilters({ ...filters, customer: e.target.value }); }}
                      label="Customer"
                    >
                      <MenuItem value="">All Customers</MenuItem>
                      {uniqueCustomers.map((customer) => (
                        <MenuItem key={customer} value={customer}>
                          {customer}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Amount Range */}
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="Min Amount"
                      type="number"
                      size="small"
                      value={filters.minAmount}
                      onChange={(e) => { setFilters({ ...filters, minAmount: e.target.value }); }}
                      placeholder="0.00"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="Max Amount"
                      type="number"
                      size="small"
                      value={filters.maxAmount}
                      onChange={(e) => { setFilters({ ...filters, maxAmount: e.target.value }); }}
                      placeholder="∞"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Grid>

                {/* Date Range */}
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label="From Date"
                      type="date"
                      size="small"
                      value={filters.fromDate}
                      onChange={(e) => { setFilters({ ...filters, fromDate: e.target.value }); }}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="To Date"
                      type="date"
                      size="small"
                      value={filters.toDate}
                      onChange={(e) => { setFilters({ ...filters, toDate: e.target.value }); }}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                  </Stack>
                </Grid>

                {/* Clear Filters Button */}
                <Grid item xs={12} md={1}>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    size="small"
                    fullWidth
                    disabled={!Object.values(filters).some(v => v)}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>

              {/* Active Filters Display */}
              {(filters.customer || filters.minAmount || filters.maxAmount || filters.fromDate || filters.toDate) ? <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1 }}>
                    Active Filters:
                  </Typography>
                  {filters.customer ? <Chip
                      label={`Customer: ${filters.customer}`}
                      size="small"
                      onDelete={() => { setFilters({ ...filters, customer: '' }); }}
                    /> : null}
                  {(filters.minAmount || filters.maxAmount) ? <Chip
                      label={`Amount: $${filters.minAmount || '0'} - $${filters.maxAmount || '∞'}`}
                      size="small"
                      onDelete={() => { setFilters({ ...filters, minAmount: '', maxAmount: '' }); }}
                    /> : null}
                  {(filters.fromDate || filters.toDate) ? <Chip
                      label={`Date: ${filters.fromDate || 'Any'} to ${filters.toDate || 'Any'}`}
                      size="small"
                      onDelete={() => { setFilters({ ...filters, fromDate: '', toDate: '' }); }}
                    /> : null}
                </Box> : null}
            </Card>
          </Box>
        </CardContent>
      </Card>

      {/* Error/Success Messages */}
      {error ? <Card sx={{ mt: 1.5, bgcolor: 'error.light' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card> : null}

      {success ? <Card sx={{ mt: 1.5, bgcolor: 'success.light' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography color="success.main">{success}</Typography>
          </CardContent>
        </Card> : null}

      {/* Unified Invoices List */}
      <Card sx={{ mt: 1.5 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            All Invoices ({invoiceSummaries.length + filteredEricssonInvoices.length} total)
          </Typography>
          {(isLoading || isLoadingEricsson) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice Number</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Project/PO</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Huawei Invoices */}
                  {invoiceSummaries.map((summary) => (
                    <TableRow key={`huawei-${summary.invoiceNo}`}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {summary.invoiceNo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label="Huawei" color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {summary.customer_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {summary.job_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          PO: {summary.po_no || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(summary.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {summary.created_at ? new Date(summary.created_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewInvoice(summary.invoiceNo)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={async () => {
                              try {
                                const invoiceDetails = invoices.filter(inv => inv.invoiceNo === summary.invoiceNo);
                                const settingsResponse = await getSettings();
                                if (!settingsResponse.data) {
                                  throw new Error('Settings not found');
                                }
                                
                                // Get Huawei customer data
                                const customersResponse = await getAllCustomers();
                                const customers = customersResponse.data;
                                const huaweiCustomer = customers.find((customer: any) => 
                                  customer.name.toLowerCase().includes('huawei')
                                );
                                
                                if (!huaweiCustomer) {
                                  throw new Error('Huawei customer not found');
                                }
                                
                                await generateInvoicePDF({
                                  invoiceDetails,
                                  settings: settingsResponse.data,
                                  huaweiCustomer
                                });
                              } catch (error) {
                                console.error('Error generating PDF:', error);
                                setError('Failed to generate PDF');
                              }
                            }}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => {
                              const firstInvoice = groupedInvoices[summary.invoiceNo][0];
                              handleDeleteInvoice(firstInvoice.id);
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Ericsson Invoices */}
                  {filteredEricssonInvoices.map((invoice) => (
                    <TableRow key={`ericsson-${invoice.id}`}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {invoice.invoice_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label="Ericsson" color="secondary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.customer_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.job_title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {invoice.project}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(invoice.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewEricssonInvoice(invoice)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => {
                              // Generate PDF for this invoice
                              const invoiceData = {
                                invoiceNumber: invoice.invoice_number,
                                jobId: invoice.job_id,
                                jobTitle: invoice.job_title,
                                customerName: invoice.customer_name,
                                customerAddress: invoice.customer_address,
                                project: invoice.project,
                                siteId: invoice.site_id,
                                siteName: invoice.site_name,
                                purchaseOrderNumber: invoice.purchase_order_number,
                                items: invoice.items || [],
                                removeMaterials: [],
                                surplusMaterials: [],
                                subtotal: invoice.subtotal,
                                vatAmount: invoice.vat_amount,
                                sslAmount: invoice.ssl_amount,
                                totalAmount: invoice.total_amount,
                              };
                              generateEricssonInvoicePDF(invoiceData);
                            }}
                          >
                            <DownloadIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this invoice?')) {
                                try {
                                  await deleteEricssonInvoice(invoice.id?.toString() || '');
                                  setSuccess('Invoice deleted successfully');
                                  loadEricssonInvoices();
                                } catch (error) {
                                  setError('Failed to delete invoice');
                                }
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* ZTE Invoices */}
                  {filteredZteInvoices.map((invoice) => (
                    <TableRow key={`zte-${invoice.id}`}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {invoice.invoice_no}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label="ZTE" color="info" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.ztePo?.job?.customer?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.ztePo?.job?.name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.ztePo?.po_line_no || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(invoice.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(invoice.createdAt || '').toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => {
                              setSelectedZteInvoice(invoice);
                              setZteViewDialogOpen(true);
                            }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this invoice?')) {
                                try {
                                  await deleteZteInvoice(invoice.id);
                                  setSuccess('Invoice deleted successfully');
                                  loadZteInvoices();
                                } catch (error) {
                                  setError('Failed to delete invoice');
                                }
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => { setViewDialogOpen(false); }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Invoice Details
            {selectedInvoiceDetails.length > 0 && (
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                {selectedInvoiceDetails[0].invoiceNo}
              </Typography>
            )}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedInvoiceDetails.length > 0 ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedInvoiceDetails[0].invoiceNo}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Records
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceDetails.length}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    VAT Percentage
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="#1e40af">
                    {selectedInvoiceDetails[0].vatPercentage}%
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceDetails[0].createdAt ? new Date(selectedInvoiceDetails[0].createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Financial Summary for Saved Invoice */}
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                backgroundColor: '#f0fdf4',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: '#bbf7d0'
              }}>
                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="500" sx={{ mb: 2 }}>
                  Financial Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="text.primary">
                        ${(() => {
                          const subtotal = selectedInvoiceDetails.reduce((sum, item) => {
                            const subtotalAmount = typeof item.subtotalAmount === 'string' ? parseFloat(item.subtotalAmount) : 
                                                 typeof item.subtotalAmount === 'number' ? item.subtotalAmount : 0;
                            return sum + subtotalAmount;
                          }, 0);
                          return subtotal.toFixed(2);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        VAT ({selectedInvoiceDetails[0].vatPercentage}%)
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#1e40af">
                        ${(() => {
                          const vatTotal = selectedInvoiceDetails.reduce((sum, item) => {
                            const vatAmount = typeof item.vatAmount === 'string' ? parseFloat(item.vatAmount) : 
                                            typeof item.vatAmount === 'number' ? item.vatAmount : 0;
                            return sum + vatAmount;
                          }, 0);
                          return vatTotal.toFixed(2);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#059669">
                        ${(() => {
                          const total = selectedInvoiceDetails.reduce((sum, item) => {
                            const totalAmount = typeof item.totalAmount === 'string' ? parseFloat(item.totalAmount) : 
                                              typeof item.totalAmount === 'number' ? item.totalAmount : 0;
                            return sum + totalAmount;
                          }, 0);
                          return total.toFixed(2);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Invoice Date
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="text.primary">
                        {selectedInvoiceDetails[0].createdAt ? new Date(selectedInvoiceDetails[0].createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Invoice Items
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PO NO.</TableCell>
                      <TableCell>Line NO.</TableCell>
                      <TableCell>Item Code</TableCell>
                      <TableCell>Item Description</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Requested Qty</TableCell>
                      <TableCell>Invoiced %</TableCell>
                      <TableCell>Subtotal</TableCell>
                      <TableCell>VAT Amount</TableCell>
                      <TableCell>Total Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoiceDetails.map((item) => {
                      const unitPriceStr = item.huaweiPo?.unitPrice;
                      const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                                       typeof unitPriceStr === 'number' ? unitPriceStr : 0;
                      
                      const qtyStr = item.huaweiPo?.requestedQuantity;
                      const requestedQty = typeof qtyStr === 'string' ? parseFloat(qtyStr) : 
                                         typeof qtyStr === 'number' ? qtyStr : 0;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.huaweiPo?.poNo || 'N/A'}</TableCell>
                          <TableCell>{item.huaweiPo?.lineNo || 'N/A'}</TableCell>
                          <TableCell>{item.huaweiPo?.itemCode || 'N/A'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {item.huaweiPo?.itemDescription || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatCurrency(unitPrice)}</TableCell>
                          <TableCell>{requestedQty.toFixed(0)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${item.invoicedPercentage}%`} 
                              color="primary" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500" color="text.primary">
                              ${(() => {
                                const subtotalAmount = typeof item.subtotalAmount === 'string' ? parseFloat(item.subtotalAmount) : 
                                                     typeof item.subtotalAmount === 'number' ? item.subtotalAmount : 0;
                                return subtotalAmount.toFixed(2);
                              })()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500" color="#1e40af">
                              ${(() => {
                                const vatAmount = typeof item.vatAmount === 'string' ? parseFloat(item.vatAmount) : 
                                                typeof item.vatAmount === 'number' ? item.vatAmount : 0;
                                return vatAmount.toFixed(2);
                              })()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600" color="#059669">
                              ${(() => {
                                const totalAmount = typeof item.totalAmount === 'string' ? parseFloat(item.totalAmount) : 
                                                  typeof item.totalAmount === 'number' ? item.totalAmount : 0;
                                return totalAmount.toFixed(2);
                              })()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading invoice details...
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setViewDialogOpen(false); }}>
            Close
          </Button>
          {selectedInvoiceDetails.length > 0 && (
            <Button onClick={handleDownloadPDF} startIcon={<DownloadIcon />} disabled={isDownloadingPDF}>
              {isDownloadingPDF ? 'Downloading...' : 'Download PDF'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Ericsson Invoice Dialog */}
      <Dialog 
        open={ericssonViewDialogOpen} 
        onClose={() => setEricssonViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Ericsson Invoice Details
            {selectedEricssonInvoice && (
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                {selectedEricssonInvoice.invoice_number}
              </Typography>
            )}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedEricssonInvoice ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedEricssonInvoice.invoice_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Job ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedEricssonInvoice.job_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Job Title
                  </Typography>
                  <Typography variant="body1">
                    {selectedEricssonInvoice.job_title}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">
                    {selectedEricssonInvoice.customer_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Project
                  </Typography>
                  <Typography variant="body1">
                    {selectedEricssonInvoice.project}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Site ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedEricssonInvoice.site_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Site Name
                  </Typography>
                  <Typography variant="body1">
                    {selectedEricssonInvoice.site_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Purchase Order Number
                  </Typography>
                  <Typography variant="body1">
                    {selectedEricssonInvoice.purchase_order_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedEricssonInvoice.createdAt ? new Date(selectedEricssonInvoice.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Financial Summary */}
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                backgroundColor: '#f0fdf4',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: '#bbf7d0'
              }}>
                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="500" sx={{ mb: 2 }}>
                  Financial Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="text.primary">
                        {formatCurrency(selectedEricssonInvoice.subtotal)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        VAT ({selectedEricssonInvoice.vat_percentage}%)
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#1e40af">
                        {formatCurrency(selectedEricssonInvoice.vat_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        SSL ({selectedEricssonInvoice.ssl_percentage}%)
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#1e40af">
                        {formatCurrency(selectedEricssonInvoice.ssl_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#059669">
                        {formatCurrency(selectedEricssonInvoice.total_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Invoice Items */}
              <Typography variant="h6" gutterBottom>
                Invoice Items
              </Typography>
              
              {selectedEricssonInvoice.items && selectedEricssonInvoice.items.length > 0 ? (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Service Number</TableCell>
                        <TableCell>Item Description</TableCell>
                        <TableCell>Unit</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedEricssonInvoice.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.service_number}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {item.item_description}
                            </Typography>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell>{formatCurrency(item.total_amount)}</TableCell>
                          <TableCell>
                            <Chip 
                              label="Invoiced" 
                              color="success" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600" color="#059669">
                              {formatCurrency(item.total_amount || 0)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    No items found for this invoice
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedEricssonInvoice.items === null 
                      ? "This invoice was created before items were saved to the database. Items data is not available."
                      : "No items were included in this invoice."
                    }
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading invoice details...
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEricssonViewDialogOpen(false)}>
            Close
          </Button>
          {selectedEricssonInvoice && (
            <Button 
              onClick={() => {
                const invoiceData = {
                  invoiceNumber: selectedEricssonInvoice.invoice_number,
                  jobId: selectedEricssonInvoice.job_id,
                  jobTitle: selectedEricssonInvoice.job_title,
                  customerName: selectedEricssonInvoice.customer_name,
                  customerAddress: selectedEricssonInvoice.customer_address,
                  project: selectedEricssonInvoice.project,
                  siteId: selectedEricssonInvoice.site_id,
                  siteName: selectedEricssonInvoice.site_name,
                  purchaseOrderNumber: selectedEricssonInvoice.purchase_order_number,
                  items: selectedEricssonInvoice.items || [],
                  removeMaterials: [],
                  surplusMaterials: [],
                  subtotal: selectedEricssonInvoice.subtotal,
                  vatAmount: selectedEricssonInvoice.vat_amount,
                  sslAmount: selectedEricssonInvoice.ssl_amount,
                  totalAmount: selectedEricssonInvoice.total_amount,
                };
                generateEricssonInvoicePDF(invoiceData);
              }} 
              startIcon={<DownloadIcon />}
            >
              Download PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View ZTE Invoice Dialog */}
      <Dialog 
        open={zteViewDialogOpen} 
        onClose={() => setZteViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            ZTE Invoice Details
            {selectedZteInvoice && (
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                {selectedZteInvoice.invoice_no}
              </Typography>
            )}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedZteInvoice ? (
            <Box>
              {/* Invoice Information */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1">
                    {selectedZteInvoice.invoice_no}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">
                    {selectedZteInvoice.ztePo?.job?.customer?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Job
                  </Typography>
                  <Typography variant="body1">
                    {selectedZteInvoice.ztePo?.job?.name || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Site Code
                  </Typography>
                  <Typography variant="body1">
                    {selectedZteInvoice.ztePo?.site_code || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Item Code
                  </Typography>
                  <Typography variant="body1">
                    {selectedZteInvoice.ztePo?.item_code || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedZteInvoice.createdAt ? new Date(selectedZteInvoice.createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Financial Summary */}
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                backgroundColor: '#f0fdf4',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: '#bbf7d0'
              }}>
                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="500" sx={{ mb: 2 }}>
                  Financial Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="text.primary">
                        {formatCurrency(selectedZteInvoice.subtotal_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        VAT ({selectedZteInvoice.vat_percentage}%)
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="text.primary">
                        {formatCurrency(selectedZteInvoice.vat_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="primary.main">
                        {formatCurrency(selectedZteInvoice.total_amount)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Item Details */}
              <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="500" sx={{ mb: 2 }}>
                Item Details
              </Typography>
              <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PO Line No</TableCell>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Subtotal</TableCell>
                      <TableCell>VAT</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>{selectedZteInvoice.ztePo?.po_line_no || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {selectedZteInvoice.ztePo?.item_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatCurrency(selectedZteInvoice.ztePo?.unit_price || 0)}</TableCell>
                      <TableCell>
                        <Chip 
                          label="Invoiced" 
                          color="success" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(selectedZteInvoice.subtotal_amount)}</TableCell>
                      <TableCell>{formatCurrency(selectedZteInvoice.vat_amount)}</TableCell>
                      <TableCell>{formatCurrency(selectedZteInvoice.total_amount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography>
              Loading invoice details...
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setZteViewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Huawei Invoice Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Huawei Invoice Details
            {selectedInvoiceDetails.length > 0 && (
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                {selectedInvoiceDetails[0].invoiceNo}
              </Typography>
            )}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedInvoiceDetails.length > 0 ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedInvoiceDetails[0].invoiceNo}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Records
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceDetails.length}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    VAT Percentage
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="#1e40af">
                    {selectedInvoiceDetails[0].vatPercentage}%
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceDetails[0].createdAt ? new Date(selectedInvoiceDetails[0].createdAt).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {/* Financial Summary */}
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                backgroundColor: '#f0fdf4',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: '#bbf7d0'
              }}>
                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="500" sx={{ mb: 2 }}>
                  Financial Summary
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="text.primary">
                        {(() => {
                          const subtotal = selectedInvoiceDetails.reduce((sum, item) => {
                            const subtotalAmount = typeof item.subtotalAmount === 'string' ? parseFloat(item.subtotalAmount) : 
                                                 typeof item.subtotalAmount === 'number' ? item.subtotalAmount : 0;
                            return sum + subtotalAmount;
                          }, 0);
                          return formatCurrency(subtotal);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        VAT ({selectedInvoiceDetails[0].vatPercentage}%)
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#1e40af">
                        {(() => {
                          const vatTotal = selectedInvoiceDetails.reduce((sum, item) => {
                            const vatAmount = typeof item.vatAmount === 'string' ? parseFloat(item.vatAmount) : 
                                            typeof item.vatAmount === 'number' ? item.vatAmount : 0;
                            return sum + vatAmount;
                          }, 0);
                          return formatCurrency(vatTotal);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Total Amount
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#059669">
                        {(() => {
                          const total = selectedInvoiceDetails.reduce((sum, item) => {
                            const totalAmount = typeof item.totalAmount === 'string' ? parseFloat(item.totalAmount) : 
                                              typeof item.totalAmount === 'number' ? item.totalAmount : 0;
                            return sum + totalAmount;
                          }, 0);
                          return formatCurrency(total);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e5e7eb',
                      textAlign: 'center'
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Invoice Date
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="text.primary">
                        {selectedInvoiceDetails[0].createdAt ? new Date(selectedInvoiceDetails[0].createdAt).toLocaleDateString() : 'N/A'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Invoice Items */}
              <Typography variant="h6" gutterBottom>
                Invoice Items
              </Typography>
              
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PO NO.</TableCell>
                      <TableCell>Line NO.</TableCell>
                      <TableCell>Item Code</TableCell>
                      <TableCell>Item Description</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Requested Qty</TableCell>
                      <TableCell>Invoiced %</TableCell>
                      <TableCell>Subtotal</TableCell>
                      <TableCell>VAT Amount</TableCell>
                      <TableCell>Total Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoiceDetails.map((item) => {
                      // Convert unitPrice from decimal string to number
                      const unitPriceStr = item.huaweiPo?.unitPrice;
                      const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                                       typeof unitPriceStr === 'number' ? unitPriceStr : 0;
                      
                      // Convert requestedQuantity from decimal string to number
                      const qtyStr = item.huaweiPo?.requestedQuantity;
                      const requestedQty = typeof qtyStr === 'string' ? parseFloat(qtyStr) : 
                                         typeof qtyStr === 'number' ? qtyStr : 0;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.huaweiPo?.poNo || 'N/A'}</TableCell>
                          <TableCell>{item.huaweiPo?.lineNo || 'N/A'}</TableCell>
                          <TableCell>{item.huaweiPo?.itemCode || 'N/A'}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {item.huaweiPo?.itemDescription || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatCurrency(unitPrice)}</TableCell>
                          <TableCell>{requestedQty}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${item.invoicedPercentage}%`} 
                              color="primary" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500" color="text.primary">
                              {(() => {
                                const subtotalAmount = typeof item.subtotalAmount === 'string' ? parseFloat(item.subtotalAmount) : 
                                                     typeof item.subtotalAmount === 'number' ? item.subtotalAmount : 0;
                                return formatCurrency(subtotalAmount);
                              })()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="500" color="#1e40af">
                              {(() => {
                                const vatAmount = typeof item.vatAmount === 'string' ? parseFloat(item.vatAmount) : 
                                                typeof item.vatAmount === 'number' ? item.vatAmount : 0;
                                return formatCurrency(vatAmount);
                              })()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600" color="#059669">
                              {(() => {
                                const totalAmount = typeof item.totalAmount === 'string' ? parseFloat(item.totalAmount) : 
                                                  typeof item.totalAmount === 'number' ? item.totalAmount : 0;
                                return formatCurrency(totalAmount);
                              })()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading invoice details...
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
          {selectedInvoiceDetails.length > 0 && (
            <Button 
              onClick={handleDownloadPDF}
              startIcon={<DownloadIcon />}
              disabled={isDownloadingPDF}
            >
              {isDownloadingPDF ? 'Generating PDF...' : 'Download PDF'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 