"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Divider,
  InputAdornment,
  LinearProgress,
  FormControl,
  Pagination,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import BusinessIcon from '@mui/icons-material/Business';
import { getAllJobs } from '@/api/job-api';
import { getAllCustomers } from '@/api/customer-api';
import { getEricssonBoqByJobId } from '@/api/ericsson-boq-api';
import { createEricssonInvoice, getAllEricssonInvoices, deleteEricssonInvoice } from '@/api/ericsson-invoice-api';
import { getSettings } from '@/api/settingsApi';
import { useSettings } from '@/contexts/SettingsContext';
import { generateEricssonInvoicePDF } from '@/utils/ericssonInvoicePdfGenerator';

interface Job {
  id: string;
  name: string;
  customer_id: number;
  customer?: {
    name: string;
    address?: string;
  };
}

interface EricssonBoqData {
  id: number;
  job_id: string;
  project: string;
  site_id: string;
  site_name: string;
  purchase_order_number: string;
  items?: EricssonBoqItemData[];
  removeMaterials?: EricssonBoqRemoveMaterialData[];
  surplusMaterials?: EricssonBoqSurplusMaterialData[];
}

interface EricssonBoqItemData {
  id: number;
  boq_id: number;
  service_number: string;
  item_description: string;
  uom: string;
  qty: number;
  unit_price: number;
  total_amount: number;
  is_additional_work: boolean;
  is_invoiced?: boolean;
}

interface EricssonBoqRemoveMaterialData {
  id: number;
  boq_id: number;
  sl_no: string;
  material_description: string;
  qty: string;
  remarks?: string;
}

interface EricssonBoqSurplusMaterialData {
  id: number;
  boq_id: number;
  sl_no: string;
  material_description: string;
  qty: string;
  remarks?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  jobId: string;
  jobTitle: string;
  customerName: string;
  customerAddress: string;
  project: string;
  siteId: string;
  siteName: string;
  purchaseOrderNumber: string;
  items: EricssonBoqItemData[];
  removeMaterials: EricssonBoqRemoveMaterialData[];
  surplusMaterials: EricssonBoqSurplusMaterialData[];
  subtotal: number;
  vatAmount: number;
  sslAmount: number;
  totalAmount: number;
}

export const EricssonInvoice: React.FC = () => {
  const { formatCurrency, currencySymbol } = useSettings();
  
  const [jobSelectionDialogOpen, setJobSelectionDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [ericssonBoqData, setEricssonBoqData] = useState<EricssonBoqData | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [vatPercentage, setVatPercentage] = useState<number>(15);
  const [sslPercentage, setSslPercentage] = useState<number>(0);
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<any>(null);
  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  // Load jobs on component mount
  useEffect(() => {
    loadJobs();
    loadRecentInvoices();
  }, []);

  // Filter jobs based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(job => 
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredJobs(filtered);
    }
    setCurrentPage(1); // Reset to first page when search changes
  }, [jobs, searchTerm]);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const response = await getAllJobs();
      // Filter only Ericsson jobs
      const ericssonJobs = response.data.jobs.filter((job: Job) => 
        job.customer?.name?.toLowerCase().includes('ericsson')
      );
      
      // Filter out jobs that are already fully invoiced
      const availableJobs = [];
      for (const job of ericssonJobs) {
        try {
          const boqResponse = await getEricssonBoqByJobId(job.id);
          const boqData = boqResponse.data;
          if (boqData && boqData.items && boqData.items.length > 0) {
            // Check if there are any uninvoiced items
            const hasUninvoicedItems = boqData.items.some((item: any) => !item.is_invoiced);
            if (hasUninvoicedItems) {
              availableJobs.push(job);
            }
          } else {
            // If no BOQ data exists, include the job
            availableJobs.push(job);
          }
        } catch (error) {
          console.error(`Error checking Ericsson BOQ data for job ${job.id}:`, error);
          // If we can't check the BOQ data, include the job to be safe
          availableJobs.push(job);
        }
      }
      
      setJobs(availableJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentInvoices = async () => {
    try {
      setIsLoadingRecent(true);
      const response = await getAllEricssonInvoices();
      // Get latest 5 invoices
      const latestInvoices = response.data.slice(0, 5);
      setRecentInvoices(latestInvoices);
    } catch (error) {
      console.error('Error loading recent invoices:', error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const handleViewInvoice = (invoice: any) => {
    console.log('Viewing invoice:', invoice);
    console.log('Invoice items:', invoice.items);
    setSelectedInvoiceForView(invoice);
    setViewDialogOpen(true);
  };

  const handleGenerateInvoice = () => {
    setError(null);
    setSuccess(null);
    setJobSelectionDialogOpen(true);
  };

  // Pagination functions
  const itemsPerPage = 10;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  const handleJobSelect = async (job: Job) => {
    try {
      setIsLoading(true);
      setSelectedJob(job);
      
      // Load BOQ data for the selected job
      const boqResponse = await getEricssonBoqByJobId(job.id);
      const boqData = boqResponse.data;
      
      // Initialize percentage fields for BOQ items
      if (boqData.items) {
        boqData.items = boqData.items.map(item => ({
          ...item,
          is_invoiced: false
        }));
      }
      
      setEricssonBoqData(boqData);
      
      // Load settings for VAT and SSL percentages
      try {
        const settingsResponse = await getSettings();
        if (settingsResponse.data) {
          setVatPercentage(settingsResponse.data.vat_percentage || 15);
          setSslPercentage(settingsResponse.data.ssl_percentage || 0);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Use default values if settings fail to load
        setVatPercentage(15);
        setSslPercentage(0);
      }
      
      // Set customer address from job data
      setCustomerAddress(job.customer?.address || '');
      
      setJobSelectionDialogOpen(false);
      setInvoiceDialogOpen(true);
    } catch (error) {
      console.error('Error loading BOQ data:', error);
      setError('Failed to load BOQ data for the selected job');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!ericssonBoqData || !selectedJob) return;

    if (!invoiceNumber.trim()) {
      setError('Please enter an invoice number');
      return;
    }

    // No need for percentage validation since we always bill 100%

    try {
      setIsSaving(true);
      setError(null);
      
      // Calculate totals based on percentages
      const subtotal = ericssonBoqData.items?.reduce((sum, item) => {
        const percentage = 100; // Always bill 100% for Ericsson
        return sum + ((item.total_amount || 0) * percentage / 100);
      }, 0) || 0;
      const vatAmount = (subtotal * vatPercentage) / 100;
      const sslAmount = (subtotal * sslPercentage) / 100;
      const totalAmount = subtotal + vatAmount + sslAmount;

      const invoiceData = {
        invoice_number: invoiceNumber,
        job_id: selectedJob.id,
        job_title: selectedJob.name,
        customer_name: selectedJob.customer?.name || '',
        customer_address: customerAddress,
        project: ericssonBoqData.project,
        site_id: ericssonBoqData.site_id,
        site_name: ericssonBoqData.site_name,
        purchase_order_number: ericssonBoqData.purchase_order_number,
        subtotal,
        vat_amount: vatAmount,
        ssl_amount: sslAmount,
        total_amount: totalAmount,
        vat_percentage: vatPercentage,
        ssl_percentage: sslPercentage,
        items: ericssonBoqData.items || []
      };

      // Save invoice to backend
      const response = await createEricssonInvoice(invoiceData);
      setSavedInvoiceId(response.data.id || null);
      
      setSuccess('Invoice saved successfully!');
      
      // Close the dialog and refresh recent invoices
      setInvoiceDialogOpen(false);
      await loadRecentInvoices();
      await loadJobs(); // Refresh job list to remove fully invoiced jobs
      
      // Reset form
      setSelectedJob(null);
      setEricssonBoqData(null);
      setInvoiceNumber('');
      setSavedInvoiceId(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving invoice:', error);
      setError('Failed to save invoice');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!ericssonBoqData || !selectedJob) return;

    if (!savedInvoiceId) {
      setError('Please save the invoice first before generating PDF');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      
      // Calculate totals based on percentages
      const subtotal = ericssonBoqData.items?.reduce((sum, item) => {
        const percentage = 100; // Always bill 100% for Ericsson
        return sum + ((item.total_amount || 0) * percentage / 100);
      }, 0) || 0;
      const vatAmount = (subtotal * vatPercentage) / 100;
      const sslAmount = (subtotal * sslPercentage) / 100;
      const totalAmount = subtotal + vatAmount + sslAmount;

      const invoiceData: InvoiceData = {
        invoiceNumber,
        jobId: selectedJob.id,
        jobTitle: selectedJob.name,
        customerName: selectedJob.customer?.name || '',
        customerAddress: customerAddress,
        project: ericssonBoqData.project,
        siteId: ericssonBoqData.site_id,
        siteName: ericssonBoqData.site_name,
        purchaseOrderNumber: ericssonBoqData.purchase_order_number,
        items: ericssonBoqData.items || [],
        removeMaterials: [],
        surplusMaterials: [],
        subtotal,
        vatAmount,
        sslAmount,
        totalAmount,
      };

      // Generate PDF
      await generateEricssonInvoicePDF(invoiceData);
      
      setSuccess('Invoice PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate invoice PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // No need for percentage editing since we always bill 100%

  // No need for percentage validation since we always bill 100%

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setSelectedJob(null);
    setEricssonBoqData(null);
    setInvoiceNumber('');
    setSavedInvoiceId(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Ericsson Invoice Generator
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Generate invoices for Ericsson projects using BOQ data.
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<BusinessIcon />}
            onClick={handleGenerateInvoice}
            disabled={isLoading}
          >
            Generate Invoice
          </Button>
        </CardContent>
      </Card>

      {/* Success/Error Messages */}
      {success && (
        <Card sx={{ mt: 2, bgcolor: 'success.light' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography color="success.main">{success}</Typography>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card sx={{ mt: 2, bgcolor: 'error.light' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      )}

      {/* Job Selection Dialog */}
      <Dialog 
        open={jobSelectionDialogOpen} 
        onClose={() => setJobSelectionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Select Ericsson Job</DialogTitle>
        <DialogContent>
          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search by Job ID or Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : filteredJobs.length === 0 ? (
            <Alert severity="info">
              {searchTerm ? 'No Ericsson jobs found matching your search.' : 'No Ericsson jobs found. Please create Ericsson jobs first.'}
            </Alert>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Job ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentJobs.map((job) => (
                      <TableRow key={job.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {job.id}
                          </Typography>
                        </TableCell>
                        <TableCell>{job.name}</TableCell>
                        <TableCell>{job.customer?.name}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleJobSelect(job)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJobSelectionDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invoice Generation Dialog */}
      <Dialog 
        open={invoiceDialogOpen} 
        onClose={handleCloseInvoiceDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Generate Ericsson Invoice
                     {selectedJob && (
             <Typography variant="body2" color="text.secondary">
               Job: {selectedJob.id} - {selectedJob.name}
             </Typography>
           )}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {ericssonBoqData && (
            <Box>
              {/* Invoice Details */}
              <Grid container spacing={2} sx={{ mb: 3, mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Invoice Number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="VAT Percentage"
                    type="number"
                    value={vatPercentage}
                    fullWidth
                    disabled
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: 'grey.100',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="SSL Percentage"
                    type="number"
                    value={sslPercentage}
                    fullWidth
                    disabled
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                    sx={{
                      '& .MuiInputBase-root': {
                        backgroundColor: 'grey.100',
                      }
                    }}
                  />
                </Grid>
              </Grid>

              {/* Project Information */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Project Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">Project</Typography>
                      <Typography variant="body1">{ericssonBoqData.project}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">Site ID</Typography>
                      <Typography variant="body1">{ericssonBoqData.site_id}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">Site Name</Typography>
                      <Typography variant="body1">{ericssonBoqData.site_name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">Purchase Order</Typography>
                      <Typography variant="body1">{ericssonBoqData.purchase_order_number}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Typography variant="body2" color="text.secondary">Customer Address</Typography>
                      <Typography variant="body1">{customerAddress || 'No address available'}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* BOQ Summary */}
              {ericssonBoqData.items && ericssonBoqData.items.length > 0 && (
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      BOQ Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Total Items
                          </Typography>
                          <Typography variant="h6" fontWeight="bold">
                            {ericssonBoqData.items.length}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'blue.50', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Total BOQ Value
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            {formatCurrency(ericssonBoqData.items.reduce((sum, item) => sum + (item.total_amount || 0), 0))}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'green.50', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Previously Invoiced
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="success.main">
                            {formatCurrency(ericssonBoqData.items.reduce((sum, item) => {
                              return sum + (item.is_invoiced ? (item.total_amount || 0) : 0);
                            }, 0))}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'orange.50', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Available for Invoice
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="warning.main">
                            {formatCurrency(ericssonBoqData.items.reduce((sum, item) => {
                              return sum + (item.is_invoiced ? 0 : (item.total_amount || 0));
                            }, 0))}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* BOQ Items */}
              {ericssonBoqData.items && ericssonBoqData.items.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      BOQ Items ({ericssonBoqData.items.length})
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Service Number</TableCell>
                            <TableCell>Item Description</TableCell>
                            <TableCell>UOM</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Unit Price</TableCell>
                            <TableCell align="right">Total Amount</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ericssonBoqData.items.map((item, index) => (
                            <TableRow 
                              key={index} 
                              hover
                              sx={{
                                backgroundColor: item.is_invoiced ? '#fef3c7' : 'inherit',
                                '&:hover': {
                                  backgroundColor: item.is_invoiced ? '#fde68a' : undefined
                                }
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {item.service_number}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {item.item_description}
                                </Typography>
                              </TableCell>
                              <TableCell>{item.uom}</TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {item.qty}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  {formatCurrency(item.unit_price)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {formatCurrency(item.total_amount)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={item.is_additional_work ? 'Additional Work' : 'Regular'} 
                                  size="small" 
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={item.is_invoiced ? "Invoiced" : "Pending"} 
                                  color={item.is_invoiced ? "success" : "warning"} 
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                  </CardContent>
                </Card>
              )}



              {/* Summary */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Invoice Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                      <Typography variant="h6">
                        {formatCurrency(
                          ericssonBoqData.items?.reduce((sum, item) => {
                            const percentage = 100; // Always bill 100% for Ericsson
                            return sum + ((item.total_amount || 0) * percentage / 100);
                          }, 0) || 0
                        )}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">VAT ({vatPercentage}%)</Typography>
                      <Typography variant="h6">
                        {formatCurrency(
                          ((ericssonBoqData.items?.reduce((sum, item) => {
                            const percentage = 100; // Always bill 100% for Ericsson
                            return sum + ((item.total_amount || 0) * percentage / 100);
                          }, 0) || 0) * vatPercentage) / 100
                        )}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                      <Typography variant="body2" color="text.secondary">SSL ({sslPercentage}%)</Typography>
                      <Typography variant="h6">
                        {formatCurrency(
                          ((ericssonBoqData.items?.reduce((sum, item) => {
                            const percentage = 100; // Always bill 100% for Ericsson
                            return sum + ((item.total_amount || 0) * percentage / 100);
                          }, 0) || 0) * sslPercentage) / 100
                        )}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="body2" color="text.secondary">Total Amount</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(
                          (ericssonBoqData.items?.reduce((sum, item) => {
                            const percentage = 100; // Always bill 100% for Ericsson
                            return sum + ((item.total_amount || 0) * percentage / 100);
                          }, 0) || 0) * (1 + vatPercentage / 100 + sslPercentage / 100)
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvoiceDialog}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveInvoice}
            disabled={!invoiceNumber || isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            {isSaving ? 'Saving...' : 'Save Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Recent Invoices Section */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Ericsson Invoices
          </Typography>
          {isLoadingRecent ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : recentInvoices.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice Number</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {invoice.invoice_number}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.job_title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.customer_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(invoice.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewInvoice(invoice)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => {
                              // Generate PDF for this invoice
                              const invoiceData: InvoiceData = {
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
                                  await deleteEricssonInvoice(invoice.id.toString());
                                  setSuccess('Invoice deleted successfully');
                                  loadRecentInvoices();
                                  loadJobs(); // Refresh job list to show jobs that are now available for invoicing
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
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No recent invoices found
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* View Invoice Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Ericsson Invoice Details
            {selectedInvoiceForView && (
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                {selectedInvoiceForView.invoice_number}
              </Typography>
            )}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedInvoiceForView ? (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedInvoiceForView.invoice_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Job ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceForView.job_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Job Title
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceForView.job_title}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Customer
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceForView.customer_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Project
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceForView.project}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Site ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceForView.site_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Site Name
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceForView.site_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Purchase Order Number
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceForView.purchase_order_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedInvoiceForView.createdAt ? new Date(selectedInvoiceForView.createdAt).toLocaleString() : 'N/A'}
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
                        {formatCurrency(selectedInvoiceForView.subtotal)}
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
                        VAT ({selectedInvoiceForView.vat_percentage}%)
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#1e40af">
                        {formatCurrency(selectedInvoiceForView.vat_amount)}
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
                        SSL ({selectedInvoiceForView.ssl_percentage}%)
                      </Typography>
                      <Typography variant="h6" fontWeight="600" color="#1e40af">
                        {formatCurrency(selectedInvoiceForView.ssl_amount)}
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
                        {formatCurrency(selectedInvoiceForView.total_amount)}
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
              
              {selectedInvoiceForView.items && selectedInvoiceForView.items.length > 0 ? (
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
                      {selectedInvoiceForView.items.map((item: any, index: number) => (
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
                    {selectedInvoiceForView.items === null 
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
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
          {selectedInvoiceForView && (
            <Button 
              onClick={() => {
                const invoiceData: InvoiceData = {
                  invoiceNumber: selectedInvoiceForView.invoice_number,
                  jobId: selectedInvoiceForView.job_id,
                  jobTitle: selectedInvoiceForView.job_title,
                  customerName: selectedInvoiceForView.customer_name,
                  customerAddress: selectedInvoiceForView.customer_address,
                  project: selectedInvoiceForView.project,
                  siteId: selectedInvoiceForView.site_id,
                  siteName: selectedInvoiceForView.site_name,
                  purchaseOrderNumber: selectedInvoiceForView.purchase_order_number,
                  items: selectedInvoiceForView.items || [],
                  removeMaterials: [],
                  surplusMaterials: [],
                  subtotal: selectedInvoiceForView.subtotal,
                  vatAmount: selectedInvoiceForView.vat_amount,
                  sslAmount: selectedInvoiceForView.ssl_amount,
                  totalAmount: selectedInvoiceForView.total_amount,
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
    </Box>
  );
}; 