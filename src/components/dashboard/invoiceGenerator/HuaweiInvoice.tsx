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
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import { getAllHuaweiPos, HuaweiPoData as ApiHuaweiPoData } from '@/api/huawei-po-api';
import { getAllCustomers } from '@/api/customer-api';
import { createInvoice, getInvoiceSummaries, deleteInvoice, getInvoicesByInvoiceNo, deleteInvoicesByInvoiceNo, type InvoiceRecord } from '@/api/huawei-invoice-api';
import { getSettings } from '@/api/settingsApi';
import { useSettings } from '@/contexts/SettingsContext';
import { generateInvoicePDF } from '@/utils/invoicePdfGenerator';

interface ExtractedData {
  poNo: string;
  lineNo: string;
}

interface HuaweiPoData {
  id: number;
  customerId: number;
  siteCode: string;
  siteId: string;
  siteName: string;
  poNo: string;
  lineNo: string;
  itemCode: string;
  itemDescription: string;
  unitPrice: number;
  requestedQuantity: number;
  invoicedPercentage: number;
  uploadedAt?: string;
}

interface CorrelatedData {
  poNo: string;
  lineNo: string;
  itemCode: string;
  itemDescription: string;
  unitPrice: number;
  invoicedPercentage: number;
  need_to_invoice_percentage: number;
  isCorrelated: boolean;
  huaweiPoId?: number;
}

export const HuaweiInvoice: React.FC = () => {
  const { formatCurrency, currencySymbol } = useSettings();
  
  // Temporarily use default settings
  const settings = {
    company_name: 'Company Name',
    company_address: '',
    company_logo: '',
  };
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [correlatedData, setCorrelatedData] = useState<CorrelatedData[]>([]);
  const [huaweiPoData, setHuaweiPoData] = useState<HuaweiPoData[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceSummaries, setInvoiceSummaries] = useState<any[]>([]); // Changed type to any[] as InvoiceSummary is removed
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<InvoiceRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [vatPercentage, setVatPercentage] = useState<number>(0);
  const [customerAddress, setCustomerAddress] = useState<string>('');

  // Load Huawei PO data for correlation
  useEffect(() => {
    loadHuaweiPoData();
    loadInvoiceSummaries();
    loadSettings();
  }, []);

  const loadHuaweiPoData = async () => {
    try {
      setIsLoading(true);
      
      // First, find the Huawei customer ID dynamically
      console.log('Finding Huawei customer...');
      const customersResponse = await getAllCustomers();
      console.log('All customers:', customersResponse.data);
      
      const huaweiCustomer = customersResponse.data.find((customer: any) => 
        customer.name?.toLowerCase().includes('huawei')
      );
      
      if (!huaweiCustomer) {
        console.error('Huawei customer not found. Available customers:', customersResponse.data.map((c: any) => c.name));
        throw new Error('Huawei customer not found in database');
      }
      
      const huaweiCustomerId = huaweiCustomer.id;
      console.log('Found Huawei customer:', huaweiCustomer);
      console.log('Found Huawei customer ID:', huaweiCustomerId);
      
      // Set the customer address from the found Huawei customer
      setCustomerAddress(huaweiCustomer.address || '');
      console.log('Set customer address:', huaweiCustomer.address);
      
      // Now load Huawei PO data for this customer
      console.log('Loading Huawei PO data for customer ID:', huaweiCustomerId);
      
      const response = await getAllHuaweiPos({ customerId: huaweiCustomerId });
      console.log('Huawei PO API response:', response);
      console.log('Number of PO records found:', response.length);
      
      // Debug: Check the structure of the first record
      if (response && response.length > 0) {
        console.log('First PO record structure:', response[0]);
        console.log('Unit price from first record:', response[0].unitPrice);
        console.log('Unit price type:', typeof response[0].unitPrice);
        console.log('PO No from first record:', response[0].poNo);
        console.log('Line No from first record:', response[0].lineNo);
      }
      
      setHuaweiPoData(response as HuaweiPoData[]);
      console.log('Set Huawei PO data:', response);
    } catch (err) {
      console.error('Error loading Huawei PO data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load Huawei PO data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvoiceSummaries = async () => {
    try {
      const summaries = await getInvoiceSummaries();
      setInvoiceSummaries(summaries);
    } catch (err) {
      console.error('Error loading invoice summaries:', err);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await getSettings();
      setVatPercentage(settings.data.vat_percentage);
      console.log('Settings loaded:', settings.data);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    }
  };

  const handleViewInvoice = async (invoiceNo: string) => {
    try {
      const details = await getInvoicesByInvoiceNo(invoiceNo);
      console.log('Invoice details received:', details);
      console.log('Number of items in invoice:', details.length);
      console.log('First item structure:', details[0]);
      console.log('First item createdAt:', details[0]?.createdAt);
      console.log('First item createdAt type:', typeof details[0]?.createdAt);
      console.log('First item huaweiPo:', details[0]?.huaweiPo);
      console.log('First item huaweiPo type:', typeof details[0]?.huaweiPo);
      console.log('Unit price type:', typeof details[0]?.huaweiPo?.unitPrice);
      console.log('Unit price value:', details[0]?.huaweiPo?.unitPrice);
      console.log('Requested Qty type:', typeof details[0]?.huaweiPo?.requestedQuantity);
      console.log('Requested Qty value:', details[0]?.huaweiPo?.requestedQuantity);
      console.log('All huaweiPo fields:', Object.keys(details[0]?.huaweiPo || {}));
      console.log('Full huaweiPo object:', JSON.stringify(details[0]?.huaweiPo, null, 2));
      
      // Check all items for consistency
      details.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          poNo: item.huaweiPo?.poNo,
          lineNo: item.huaweiPo?.lineNo,
          unitPrice: item.huaweiPo?.unitPrice,
          requestedQuantity: item.huaweiPo?.requestedQuantity,
          invoicedPercentage: item.invoicedPercentage,
          createdAt: item.createdAt
        });
      });
      
      setSelectedInvoiceDetails(details);
      setViewDialogOpen(true);
    } catch (err) {
      console.error('Error loading invoice details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load invoice details');
    }
  };

  const handleDeleteInvoice = async (invoiceNo: string) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoiceNo}? This will also reduce the invoiced percentages from the PO records.`)) {
      return;
    }

    try {
      await deleteInvoicesByInvoiceNo(invoiceNo);
      setSuccess(`Invoice ${invoiceNo} deleted successfully`);
      await loadInvoiceSummaries();
      await loadHuaweiPoData(); // Reload PO data to get updated percentages
    } catch (err) {
      console.error('Error deleting invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete invoice');
    }
  };

  const handleDownloadPDF = async () => {
    console.log('Download PDF button clicked');
    console.log('Selected invoice details:', selectedInvoiceDetails);
    
    if (selectedInvoiceDetails.length === 0) {
      console.log('No invoice details available');
      return;
    }

    setIsDownloadingPDF(true);
    setError(null);

    try {
      console.log('Creating PDF document...');
      
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

      console.log('PDF document created successfully');
      setSuccess('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleSaveInvoice = async () => {
    if (!invoiceNumber.trim()) {
      setError('Please enter an invoice number');
      return;
    }

    const matchedRecords = correlatedData.filter(item => item.isCorrelated && item.need_to_invoice_percentage > 0);
    
    if (matchedRecords.length === 0) {
      setError('No matched records with invoice percentages to save');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const invoiceData = matchedRecords.map(item => ({
        invoiceNo: invoiceNumber,
        huaweiPoId: item.huaweiPoId!,
        invoicedPercentage: item.need_to_invoice_percentage
      }));

      console.log('Sending invoice data to backend:', invoiceData);
      console.log('Matched records:', matchedRecords);
      console.log('Correlated data:', correlatedData);

      const response = await createInvoice({
        invoiceNo: invoiceNumber,
        invoiceData,
        vatPercentage
      });

      console.log('Backend response:', response);

      setSuccess(`Successfully created invoice ${invoiceNumber} with ${response.data.createdInvoices} records`);
      
      // Reload data
      await loadInvoiceSummaries();
      await loadHuaweiPoData();
      
      // Close dialog and reset
      setTimeout(() => {
        setUploadDialogOpen(false);
        setCorrelatedData([]);
        setInvoiceNumber('');
      }, 3000);

    } catch (err: any) {
      console.error('Error saving invoice:', err);
      
      // Handle different types of errors
      if (err.response) {
        // Backend returned an error response
        const errorData = err.response.data;
        console.log('Backend error response:', errorData);
        console.log('Error details array:', errorData.details);
        
        if (errorData.error) {
          // Single error message
          setError(`Invoice creation failed: ${errorData.error}`);
        } else if (errorData.details && Array.isArray(errorData.details)) {
          // Multiple validation errors
          console.log('Validation errors found:', errorData.details);
          const errorMessages = errorData.details.join('\n');
          setError(`Invoice creation failed:\n${errorMessages}`);
        } else {
          // Generic error
          setError(`Invoice creation failed: ${errorData.message || 'Unknown error'}`);
        }
      } else if (err.request) {
        // Network error
        setError('Network error: Unable to connect to the server. Please check your connection and try again.');
      } else {
        // Other error
        setError(err.message || 'Failed to save invoice');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setUploadDialogOpen(true);
    setError(null);
    setSuccess(null);

    try {
      setProcessingProgress(25);
      
      // Read the file
      const arrayBuffer = await file.arrayBuffer();
      setProcessingProgress(50);
      
      // Parse Excel file
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      setProcessingProgress(75);

      if (jsonData.length < 4) {
        throw new Error('Excel file must have at least 4 rows (headers in row 2, data starting from row 4)');
      }

      // Extract headers from row 2 (index 1)
      const headers = jsonData[1] as string[];
      
      console.log('Excel headers found:', headers);
      
      if (!headers || headers.length === 0) {
        throw new Error('Could not find headers in row 2 of the Excel file');
      }
      
      // Find column indices for the expected columns
      const columnMap = {
        poNo: headers.findIndex(h => h?.toString().trim() === 'PO No.'),
        lineNo: headers.findIndex(h => h?.toString().trim() === 'Line No.'),
      };

      console.log('Column map:', columnMap);
      console.log('Looking for columns: "PO No." and "Line No."');

      // Validate that we found all required columns
      const missingColumns = Object.entries(columnMap)
        .filter(([key, index]) => index === -1)
        .map(([key]) => key);

      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Found columns: ${headers.join(', ')}`);
      }

      // Process data rows starting from row 4 (index 3)
      const extractedData: ExtractedData[] = [];
      for (let i = 3; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        
        // Skip empty rows
        if (!row || row.every(cell => cell === undefined || cell === null || cell === '')) {
          continue;
        }

        // Extract values using column indices
        const poNo = row[columnMap.poNo]?.toString() || '';
        const lineNo = row[columnMap.lineNo]?.toString() || '';

        console.log(`Row ${i}: Extracted PO=${poNo}, Line=${lineNo}`);

        // Only include rows with valid PO and Line numbers
        if (poNo && lineNo) {
          extractedData.push({
            poNo,
            lineNo
          });
        }
      }

      if (extractedData.length === 0) {
        throw new Error('No valid PO data found in Excel file starting from row 4');
      }

      setExtractedData(extractedData);
      setProcessingProgress(100);
      setSuccess(`Successfully extracted ${extractedData.length} PO records from Excel file`);
      
      // Correlate with existing PO data
      correlateWithExistingData(extractedData);
      
    } catch (err) {
      console.error('Error processing Excel file:', err);
      setError(err instanceof Error ? err.message : 'Failed to process Excel file');
    } finally {
      setIsProcessing(false);
    }
  };

  const correlateWithExistingData = (data: ExtractedData[]) => {
    console.log('=== CORRELATION DEBUG ===');
    console.log('Extracted data:', data);
    console.log('Huawei PO data from DB:', huaweiPoData);
    console.log('Number of PO records in DB:', huaweiPoData.length);
    
    const correlated: CorrelatedData[] = data.map(item => {
      console.log(`Looking for match: PO=${item.poNo}, Line=${item.lineNo}`);
      
      // Find matching PO in existing data
      const existingPo = huaweiPoData.find(po => {
        const match = po.poNo === item.poNo && po.lineNo === item.lineNo;
        console.log(`Comparing: DB_PO=${po.poNo}, DB_Line=${po.lineNo}, Match=${match}`);
        return match;
      });

      if (existingPo) {
        console.log(`✅ Found match for PO=${item.poNo}, Line=${item.lineNo}`);
        console.log('Existing PO data:', existingPo);
        console.log('Unit price from DB:', existingPo.unitPrice, 'Type:', typeof existingPo.unitPrice);
        
        // Handle unitPrice - ensure it's a number
        let unitPrice = 0;
        if (existingPo.unitPrice !== null && existingPo.unitPrice !== undefined) {
          unitPrice = typeof existingPo.unitPrice === 'string' ? parseFloat(existingPo.unitPrice) : existingPo.unitPrice;
        }
        
        console.log('Processed unit price:', unitPrice);
        
        // Found correlation
        return {
          poNo: item.poNo,
          lineNo: item.lineNo,
          itemCode: existingPo.itemCode || 'N/A',
          itemDescription: existingPo.itemDescription || 'N/A',
          unitPrice,
          invoicedPercentage: existingPo.invoicedPercentage || 0,
          need_to_invoice_percentage: 0,
          isCorrelated: true,
          huaweiPoId: existingPo.id
        };
      } 
        console.log(`❌ No match found for PO=${item.poNo}, Line=${item.lineNo}`);
        // No correlation found
        return {
          poNo: item.poNo,
          lineNo: item.lineNo,
          itemCode: 'N/A',
          itemDescription: 'N/A',
          unitPrice: 0,
          invoicedPercentage: 0,
          need_to_invoice_percentage: 0,
          isCorrelated: false,
          huaweiPoId: undefined
        };
      
    });

    console.log('Final correlated data:', correlated);
    setCorrelatedData(correlated);
  };

  const handlePercentageChange = (index: number, percentage: number) => {
    const updatedData = [...correlatedData];
    updatedData[index] = { ...updatedData[index], need_to_invoice_percentage: percentage };
    setCorrelatedData(updatedData);
  };

  const handleDataEdit = (index: number, field: 'poNo' | 'lineNo', value: string) => {
    const updatedData = [...extractedData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setExtractedData(updatedData);
    
    // Re-correlate after edit
    correlateWithExistingData(updatedData);
  };

  const validatePercentages = () => {
    return correlatedData.every(item => {
      const currentInvoiced = typeof item.invoicedPercentage === 'string' ? parseFloat(item.invoicedPercentage) : 
                             typeof item.invoicedPercentage === 'number' ? item.invoicedPercentage : 0;
      const newInvoice = typeof item.need_to_invoice_percentage === 'string' ? parseFloat(item.need_to_invoice_percentage) : 
                        typeof item.need_to_invoice_percentage === 'number' ? item.need_to_invoice_percentage : 0;
      const total = currentInvoiced + newInvoice;
      
      return newInvoice >= 0 && newInvoice <= 100 && total <= 100;
    });
  };

  const getTotalPercentage = () => {
    return correlatedData.reduce((sum, item) => {
      const newInvoice = typeof item.need_to_invoice_percentage === 'string' ? parseFloat(item.need_to_invoice_percentage) : 
                        typeof item.need_to_invoice_percentage === 'number' ? item.need_to_invoice_percentage : 0;
      return sum + newInvoice;
    }, 0);
  };

  const getValidationErrors = () => {
    const errors: string[] = [];
    
    correlatedData.forEach((item, index) => {
      const currentInvoiced = typeof item.invoicedPercentage === 'string' ? parseFloat(item.invoicedPercentage) : 
                             typeof item.invoicedPercentage === 'number' ? item.invoicedPercentage : 0;
      const newInvoice = typeof item.need_to_invoice_percentage === 'string' ? parseFloat(item.need_to_invoice_percentage) : 
                        typeof item.need_to_invoice_percentage === 'number' ? item.need_to_invoice_percentage : 0;
      const total = currentInvoiced + newInvoice;
      
      if (newInvoice < 0) {
        errors.push(`Row ${index + 1}: Percentage cannot be negative`);
      } else if (newInvoice > 100) {
        errors.push(`Row ${index + 1}: Percentage cannot exceed 100%`);
      } else if (total > 100) {
        errors.push(`Row ${index + 1}: Total invoiced percentage would exceed 100% (${currentInvoiced}% + ${newInvoice}% = ${total}%)`);
      }
    });
    
    return errors;
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Huawei Invoice Generation
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => document.getElementById('huawei-invoice-excel-input')?.click()}
            >
              Upload Invoice Excel
            </Button>
            <input
              id="huawei-invoice-excel-input"
              type="file"
              accept=".xlsx,.xls,.xlsm"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            Upload an Excel file (.xlsm) containing PO numbers and line numbers to generate invoices for Huawei customer.
            <br />
            <strong>Note:</strong> The system will correlate with existing PO data and highlight unmatched records in red.
          </Typography>
        </CardContent>
      </Card>

      {/* Invoice Summaries List */}
      {invoiceSummaries.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Latest Invoices
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice Number</TableCell>
                    <TableCell>Total Records</TableCell>
                    <TableCell>Total Amount</TableCell>
                    <TableCell>Created Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoiceSummaries.slice(0, 5).map((summary) => (
                    <TableRow key={summary.invoiceNo}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {summary.invoiceNo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={summary.totalRecords} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          {formatCurrency(summary.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(summary.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewInvoice(summary.invoiceNo)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteInvoice(summary.invoiceNo)}
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
          </CardContent>
        </Card>
      )}

      {/* Upload and Process Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => { setUploadDialogOpen(false); }}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            background: '#ffffff'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          color: 'white',
          borderRadius: '8px 8px 0 0',
          mb: 0
        }}>
          <Typography variant="h6" fontWeight="500">
            Process Huawei Invoice Excel File
          </Typography>
        </DialogTitle>
        <DialogContent>
          {isProcessing ? <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Processing Excel file...
              </Typography>
              <LinearProgress variant="determinate" value={processingProgress} />
              <Typography variant="caption" color="text.secondary">
                {processingProgress}% Complete
              </Typography>
            </Box> : null}

          {error ? <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert> : null}

          {success ? <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert> : null}

          {!isProcessing && extractedData.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Extracted PO Data ({extractedData.length} rows)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Review and edit the extracted data if needed
              </Typography>
              
              <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 3 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>PO NO.</TableCell>
                      <TableCell>Line NO.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {extractedData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.poNo}
                            onChange={(e) => { handleDataEdit(index, 'poNo', e.target.value); }}
                            variant="standard"
                            disabled={isProcessing}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.lineNo}
                            onChange={(e) => { handleDataEdit(index, 'lineNo', e.target.value); }}
                            variant="standard"
                            disabled={isProcessing}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {!isProcessing && correlatedData.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Correlated PO Data with Invoice Percentages
              </Typography>
              
              {/* Invoice Number Input */}
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                backgroundColor: '#f8fafc',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: '#e2e8f0'
              }}>
                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="500" sx={{ mb: 2 }}>
                  Invoice Number
                </Typography>
                <TextField
                  fullWidth
                  size="medium"
                  placeholder="Enter invoice number (e.g., INV-2024-001)"
                  variant="outlined"
                  value={invoiceNumber}
                  onChange={(e) => { setInvoiceNumber(e.target.value); }}
                  sx={{ 
                    maxWidth: 400,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      backgroundColor: 'white'
                    }
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  This invoice number will be applied to all selected records
                </Typography>
              </Box>

              {/* VAT and Customer Information */}
              <Box sx={{ 
                mb: 3, 
                p: 3, 
                backgroundColor: '#f1f5f9',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: '#cbd5e1'
              }}>
                <Typography variant="subtitle1" gutterBottom color="text.primary" fontWeight="500" sx={{ mb: 2 }}>
                  Invoice Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e2e8f0'
                    }}>
                      <Typography variant="subtitle2" color="text.primary" gutterBottom fontWeight="500">
                        VAT Percentage
                      </Typography>
                      <Typography variant="h5" fontWeight="600" color="#1e40af">
                        {vatPercentage}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Applied to all invoice amounts
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'white', 
                      borderRadius: 1,
                      border: '1px solid #e2e8f0'
                    }}>
                      <Typography variant="subtitle2" color="text.primary" gutterBottom fontWeight="500">
                        Customer Address
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }} color="text.primary">
                        {customerAddress || 'No address available'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Set the percentage to invoice for each PO. Total percentage: {getTotalPercentage().toFixed(2)}%
              </Typography>
              
              <TableContainer component={Paper} sx={{ 
                maxHeight: 400, 
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: '#e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow sx={{ 
                      backgroundColor: '#f8fafc',
                      '& th': {
                        fontWeight: 600,
                        color: '#374151',
                        borderBottom: '2px solid #e5e7eb',
                        fontSize: '0.875rem'
                      }
                    }}>
                      <TableCell>PO NO.</TableCell>
                      <TableCell>Item Code</TableCell>
                      <TableCell>Item Description</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Invoiced %</TableCell>
                      <TableCell>Need to Invoice %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {correlatedData.map((item, index) => (
                      <TableRow 
                        key={index}
                        sx={{ 
                          backgroundColor: item.isCorrelated ? 'inherit' : '#fef2f2',
                          opacity: item.isCorrelated ? 1 : 0.7,
                          '&:hover': {
                            backgroundColor: item.isCorrelated ? '#f9fafb' : '#fee2e2'
                          },
                          '& td': {
                            borderBottom: item.isCorrelated ? '1px solid #f3f4f6' : '1px solid #fecaca',
                            fontSize: '0.875rem'
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="500" color={item.isCorrelated ? 'text.primary' : 'text.disabled'}>
                              {item.poNo}
                            </Typography>
                            {!item.isCorrelated && (
                              <Chip 
                                label="No Match" 
                                color="error" 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  borderColor: '#ef4444',
                                  color: '#ef4444',
                                  fontWeight: 500
                                }}
                              />
                            )}
                            {item.isCorrelated ? <Chip 
                                label="Matched" 
                                color="success" 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  fontSize: '0.7rem',
                                  borderColor: '#10b981',
                                  color: '#10b981',
                                  fontWeight: 500
                                }}
                              /> : null}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={item.isCorrelated ? 'text.secondary' : 'text.disabled'}>
                            {item.itemCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }} color={item.isCorrelated ? 'text.primary' : 'text.disabled'}>
                            {item.itemDescription}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="500" color={item.isCorrelated ? 'text.primary' : 'text.disabled'}>
                            {formatCurrency(item.unitPrice)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${item.invoicedPercentage}%`} 
                            color="primary" 
                            size="small"
                            sx={{ 
                              backgroundColor: item.isCorrelated ? '#dbeafe' : '#f3f4f6',
                              color: item.isCorrelated ? '#1e40af' : '#6b7280',
                              fontWeight: 500,
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.need_to_invoice_percentage}
                            onChange={(e) => { handlePercentageChange(index, parseFloat(e.target.value) || 0); }}
                            variant="standard"
                            disabled={isProcessing || isSaving || !item.isCorrelated}
                            inputProps={{
                              min: 0,
                              max: 100,
                              step: 0.01
                            }}
                            sx={{ 
                              width: 100,
                              opacity: item.isCorrelated ? 1 : 0.5,
                              '& .MuiInput-root': {
                                color: (() => {
                                  if (!item.isCorrelated) return 'text.disabled';
                                  const currentInvoiced = typeof item.invoicedPercentage === 'string' ? parseFloat(item.invoicedPercentage) : 
                                                   typeof item.invoicedPercentage === 'number' ? item.invoicedPercentage : 0;
                                  const newInvoice = typeof item.need_to_invoice_percentage === 'string' ? parseFloat(item.need_to_invoice_percentage) : 
                                              typeof item.need_to_invoice_percentage === 'number' ? item.need_to_invoice_percentage : 0;
                                  const total = currentInvoiced + newInvoice;
                                  return total > 100 ? 'error.main' : 'inherit';
                                })()
                              }
                            }}
                          />
                          {item.isCorrelated ? (() => {
                            const currentInvoiced = typeof item.invoicedPercentage === 'string' ? parseFloat(item.invoicedPercentage) : 
                                                 typeof item.invoicedPercentage === 'number' ? item.invoicedPercentage : 0;
                            const newInvoice = typeof item.need_to_invoice_percentage === 'string' ? parseFloat(item.need_to_invoice_percentage) : 
                                            typeof item.need_to_invoice_percentage === 'number' ? item.need_to_invoice_percentage : 0;
                            const total = currentInvoiced + newInvoice;
                            const remaining = 100 - currentInvoiced;
                            
                            if (total > 100) {
                              return (
                                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                  Total: {total.toFixed(2)}% (exceeds 100%)
                                </Typography>
                              );
                            } else if (newInvoice > remaining) {
                              return (
                                <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                                  Only {remaining.toFixed(2)}% remaining
                                </Typography>
                              );
                            } else if (newInvoice > 0) {
                              return (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  Total: {total.toFixed(2)}%
                                </Typography>
                              );
                            }
                            return null;
                          })() : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {!validatePercentages() && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2, border: '1px solid', borderColor: 'orange.200' }}>
                  <Typography variant="body2" component="div" color="text.primary">
                    Please fix the following validation errors:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                    {getValidationErrors().map((error, index) => (
                      <li key={index}>
                        <Typography variant="body2" color="text.primary">{error}</Typography>
                      </li>
                    ))}
                  </Box>
                </Alert>
              )}

              <Box sx={{ 
                mt: 2, 
                p: 3, 
                backgroundColor: '#f9fafb',
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: '#e5e7eb'
              }}>
                <Typography variant="subtitle1" color="text.primary" fontWeight="500" sx={{ mb: 1 }}>
                  Summary
                </Typography>
                <Typography variant="body2" color="text.primary">
                  <strong>Matched:</strong> {correlatedData.filter(item => item.isCorrelated).length} records | 
                  <strong>Unmatched:</strong> {correlatedData.filter(item => !item.isCorrelated).length} records
                </Typography>
              </Box>

              {/* Financial Summary */}
              <Box sx={{ 
                mt: 2, 
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
                      <Typography variant="h5" fontWeight="600" color="text.primary">
                        {(() => {
                          const subtotal = correlatedData.reduce((sum, item) => {
                            const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
                            const percentage = typeof item.need_to_invoice_percentage === 'number' ? item.need_to_invoice_percentage : 0;
                            return sum + (unitPrice * percentage / 100);
                          }, 0);
                          return formatCurrency(subtotal);
                        })()}
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
                        VAT ({vatPercentage}%)
                      </Typography>
                      <Typography variant="h5" fontWeight="600" color="#1e40af">
                        {(() => {
                          const subtotal = correlatedData.reduce((sum, item) => {
                            const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
                            const percentage = typeof item.need_to_invoice_percentage === 'number' ? item.need_to_invoice_percentage : 0;
                            return sum + (unitPrice * percentage / 100);
                          }, 0);
                          const vatTotal = subtotal * vatPercentage / 100;
                          return formatCurrency(vatTotal);
                        })()}
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
                      <Typography variant="h5" fontWeight="600" color="#059669">
                        {(() => {
                          const subtotal = correlatedData.reduce((sum, item) => {
                            const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
                            const percentage = typeof item.need_to_invoice_percentage === 'number' ? item.need_to_invoice_percentage : 0;
                            return sum + (unitPrice * percentage / 100);
                          }, 0);
                          const vatTotal = subtotal * vatPercentage / 100;
                          const total = subtotal + vatTotal;
                          return formatCurrency(total);
                        })()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          {!isProcessing && extractedData.length === 0 && !error && (
            <Typography variant="body2" color="text.secondary">
              No data found in the Excel file or file format is not supported.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUploadDialogOpen(false); }} disabled={isProcessing || isSaving}>
            Cancel
          </Button>
          {correlatedData.length > 0 && (
            <Button 
              onClick={handleSaveInvoice} 
              color="primary" 
              variant="contained"
              disabled={isProcessing || isSaving || !validatePercentages() || !invoiceNumber.trim()}
            >
              {isSaving ? 'Saving Invoice...' : 'Save Invoice'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
    </Box>
  );
}; 