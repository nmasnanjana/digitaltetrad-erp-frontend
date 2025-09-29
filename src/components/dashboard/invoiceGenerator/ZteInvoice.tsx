import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Pagination,
  InputAdornment,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { useSettings } from '@/contexts/SettingsContext';
import { getAllZtePos, type ZtePoData } from '@/api/zte-po-api';
import { createZteInvoice, getZteInvoiceSummary, deleteZteInvoice } from '@/api/zte-invoice-api';
import { getAllJobs } from '@/api/job-api';

interface Job {
  id: string;
  name: string;
  customer_id: number;
  customer?: {
    name: string;
    address?: string;
  };
}


export const ZteInvoice: React.FC = () => {
  const { formatCurrency, currencySymbol } = useSettings();
  
  // Temporarily use default settings
  const settings = {
    company_name: 'Company Name',
    company_address: '',
    company_logo: '',
  };
  const [jobSelectionDialogOpen, setJobSelectionDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [ztePoData, setZtePoData] = useState<ZtePoData[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceSummaries, setInvoiceSummaries] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vatPercentage, setVatPercentage] = useState<number>(0);
  const [customerAddress, setCustomerAddress] = useState<string>('');
  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  // Load jobs and data on component mount
  useEffect(() => {
    loadJobs();
    loadZtePoData();
    loadInvoiceSummaries();
    loadSettings();
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
      // Filter only ZTE jobs
      const zteJobs = response.data.jobs.filter((job: Job) => 
        job.customer?.name?.toLowerCase().includes('zte')
      );
      
      // Filter out jobs that are already fully invoiced
      const availableJobs = [];
      for (const job of zteJobs) {
        try {
          const ztePos = await getAllZtePos({ jobId: job.id });
          // Check if there are any uninvoiced items
          const hasUninvoicedItems = ztePos.some(po => !po.is_invoiced);
          if (hasUninvoicedItems) {
            availableJobs.push(job);
          }
        } catch (error) {
          console.error(`Error checking ZTE PO data for job ${job.id}:`, error);
          // If we can't check the PO data, include the job to be safe
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

  const loadZtePoData = async () => {
    try {
      setIsLoading(true);
      const response = await getAllZtePos();
      setZtePoData(response);
    } catch (error) {
      console.error('Error loading ZTE PO data:', error);
      setError('Failed to load ZTE PO data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvoiceSummaries = async () => {
    try {
      // This would load existing invoice summaries
      // For now, we'll leave it empty
      setInvoiceSummaries([]);
    } catch (error) {
      console.error('Error loading invoice summaries:', error);
    }
  };

  const loadSettings = async () => {
    try {
      // Load settings for VAT percentage and company details
      // For now, we'll use default values
      setVatPercentage(15); // Default VAT percentage
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleJobSelect = async (job: Job) => {
    try {
      setIsLoading(true);
      setSelectedJob(job);
      
      // Load ZTE PO data for the selected job
      const ztePoResponse = await getAllZtePos();
      const allZtePos = ztePoResponse;
      const jobZtePos = allZtePos.filter(po => po.job_id === job.id);
      
      setZtePoData(jobZtePos);
      setJobSelectionDialogOpen(false);
      setInvoiceDialogOpen(true);
    } catch (error) {
      console.error('Error loading ZTE PO data for job:', error);
      setError('Failed to load ZTE PO data for selected job');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setSelectedJob(null);
    setZtePoData([]);
    setInvoiceNumber('');
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

  const handleGenerateInvoice = () => {
    setError(null);
    setSuccess(null);
    setJobSelectionDialogOpen(true);
  };

  const handleCreateInvoice = async () => {
    if (!invoiceNumber.trim()) {
      setError('Please enter an invoice number');
      return;
    }

    if (ztePoData.length === 0) {
      setError('No ZTE PO data available for invoicing');
      return;
    }

    // Filter out already invoiced items
    const pendingPos = ztePoData.filter(po => !po.is_invoiced);
    if (pendingPos.length === 0) {
      setError('All items have already been invoiced');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const invoiceData = {
        invoice_no: invoiceNumber,
        invoice_data: pendingPos.map(po => ({
          zte_po_id: po.id
        })),
        vat_percentage: vatPercentage
      };

      const response = await createZteInvoice(invoiceData);
      
      setSuccess(`Successfully created ${response.created_invoices} invoice records for invoice ${invoiceNumber}`);
      
      // Close dialog and refresh data
      setInvoiceDialogOpen(false);
      setInvoiceNumber('');
      
      // Refresh data
      await loadZtePoData();
      await loadInvoiceSummaries();
      await loadJobs(); // Refresh job list to remove fully invoiced jobs
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      setError(error.response?.data?.error || 'Failed to create invoice');
    } finally {
      setIsSaving(false);
    }
  };





  const handleViewInvoice = (invoiceNo: string) => {
    // For now, just show an alert. You can implement a detailed view dialog later
    alert(`Viewing invoice details for: ${invoiceNo}`);
  };

  const handleDeleteInvoice = async (invoiceNo: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNo}?`)) {
      return;
    }

    try {
      // Get all invoices for this invoice number and delete them
      const response = await getZteInvoiceSummary(invoiceNo);
      const invoices = response.data.summary;
      
      for (const invoice of invoices) {
        await deleteZteInvoice(invoice.id);
      }
      
      setSuccess(`Successfully deleted invoice ${invoiceNo}`);
      await loadInvoiceSummaries();
      await loadJobs(); // Refresh job list to show jobs that are now available for invoicing
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error) {
      console.error('Error deleting invoice:', error);
      setError('Failed to delete invoice');
    }
  };


  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            ZTE Invoice Generator
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Generate invoices for ZTE projects using PO data.
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

      {/* Latest 5 ZTE Invoices */}
      {invoiceSummaries.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Latest ZTE Invoices
            </Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Job</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceSummaries.slice(0, 5).map((summary) => (
                    <TableRow key={summary.invoice_no}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {summary.invoice_no}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {summary.job_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {summary.customer_name || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(summary.total_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(summary.created_at || '').toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewInvoice(summary.invoice_no)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Invoice">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteInvoice(summary.invoice_no)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

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
        <DialogTitle>Select ZTE Job</DialogTitle>
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
              {searchTerm ? 'No ZTE jobs found matching your search.' : 'No ZTE jobs found. Please create ZTE jobs first.'}
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
          Generate ZTE Invoice
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

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : ztePoData.length === 0 ? (
            <Alert severity="info">
              No ZTE PO data found for this job.
            </Alert>
          ) : (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Invoice Number"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="VAT Percentage"
                    type="number"
                    value={vatPercentage}
                    onChange={(e) => setVatPercentage(parseFloat(e.target.value) || 0)}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                  />
                </Grid>
              </Grid>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>PO Line No</TableCell>
                      <TableCell>Site Code</TableCell>
                      <TableCell>Item Code</TableCell>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Subtotal</TableCell>
                      <TableCell>VAT</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ztePoData.map((po) => {
                      // Always bill 100% for ZTE
                      const subtotal = po.unit_price; // 100% of unit price
                      const vat = (subtotal * vatPercentage) / 100;
                      const total = subtotal + vat;
                      
                      return (
                        <TableRow key={po.id}>
                          <TableCell>{po.po_line_no}</TableCell>
                          <TableCell>{po.site_code}</TableCell>
                          <TableCell>{po.item_code}</TableCell>
                          <TableCell>{po.item_name}</TableCell>
                          <TableCell>{formatCurrency(po.unit_price)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={po.is_invoiced ? "Invoiced" : "Pending"} 
                              color={po.is_invoiced ? "success" : "warning"} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(subtotal)}</TableCell>
                          <TableCell>{formatCurrency(vat)}</TableCell>
                          <TableCell>{formatCurrency(total)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvoiceDialog}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCreateInvoice}
            disabled={!invoiceNumber || ztePoData.length === 0 || isSaving}
          >
            {isSaving ? <CircularProgress size={20} /> : 'Create Invoice'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

