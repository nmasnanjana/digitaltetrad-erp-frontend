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
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Grid,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import { getAllHuaweiPos } from '@/api/huaweiPoApi';
import { getAllCustomers } from '@/api/customerApi';
import { 
  createInvoice, 
  getInvoiceSummaries, 
  getInvoicesByInvoiceNo,
  deleteInvoicesByInvoiceNo,
  InvoiceSummary,
  InvoiceRecord 
} from '@/api/huaweiInvoiceApi';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface ExtractedData {
  po_no: string;
  line_no: string;
}

interface CorrelatedData {
  po_no: string;
  line_no: string;
  item_code: string;
  item_description: string;
  unit_price: number;
  invoiced_percentage: number;
  need_to_invoice_percentage: number;
  isCorrelated: boolean;
  huawei_po_id?: number;
}

interface HuaweiPoData {
  id: number;
  po_no: string;
  line_no: string;
  item_code: string;
  item_description: string;
  unit_price: number;
  invoiced_percentage: number;
}

export const HuaweiInvoice: React.FC = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [correlatedData, setCorrelatedData] = useState<CorrelatedData[]>([]);
  const [huaweiPoData, setHuaweiPoData] = useState<HuaweiPoData[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [invoiceSummaries, setInvoiceSummaries] = useState<InvoiceSummary[]>([]);
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<InvoiceRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load Huawei PO data for correlation
  useEffect(() => {
    loadHuaweiPoData();
    loadInvoiceSummaries();
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
      
      // Now load Huawei PO data for this customer
      console.log('Loading Huawei PO data for customer ID:', huaweiCustomerId);
      
      const response = await getAllHuaweiPos({ customer_id: huaweiCustomerId });
      console.log('Huawei PO API response:', response);
      
      // Debug: Check the structure of the first record
      if (response && response.length > 0) {
        console.log('First PO record structure:', response[0]);
        console.log('Unit price from first record:', response[0].unit_price);
        console.log('Unit price type:', typeof response[0].unit_price);
      }
      
      setHuaweiPoData(response);
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

  const handleViewInvoice = async (invoiceNo: string) => {
    try {
      const details = await getInvoicesByInvoiceNo(invoiceNo);
      console.log('Invoice details received:', details);
      console.log('Number of items in invoice:', details.length);
      console.log('First item structure:', details[0]);
      console.log('First item huaweiPo:', details[0]?.huaweiPo);
      console.log('Unit price type:', typeof details[0]?.huaweiPo?.unit_price);
      console.log('Unit price value:', details[0]?.huaweiPo?.unit_price);
      console.log('Requested Qty type:', typeof details[0]?.huaweiPo?.requested_quantity);
      console.log('Requested Qty value:', details[0]?.huaweiPo?.requested_quantity);
      console.log('All huaweiPo fields:', Object.keys(details[0]?.huaweiPo || {}));
      console.log('Full huaweiPo object:', JSON.stringify(details[0]?.huaweiPo, null, 2));
      
      // Check all items for consistency
      details.forEach((item, index) => {
        console.log(`Item ${index + 1}:`, {
          po_no: item.huaweiPo?.po_no,
          line_no: item.huaweiPo?.line_no,
          unit_price: item.huaweiPo?.unit_price,
          requested_quantity: item.huaweiPo?.requested_quantity,
          invoiced_percentage: item.invoiced_percentage
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
      
      // Create a simple PDF first to test
      const doc = new jsPDF();
      console.log('PDF document created successfully');
      
      const invoiceNo = selectedInvoiceDetails[0].invoice_no;
      const createdDate = new Date(selectedInvoiceDetails[0].createdAt).toLocaleDateString();
      
      console.log('Invoice details:', { invoiceNo, createdDate });
      
      // Add simple text to test
      doc.setFontSize(16);
      doc.text('HUAWEI INVOICE', 20, 20);
      doc.setFontSize(12);
      doc.text(`Invoice Number: ${invoiceNo}`, 20, 40);
      doc.text(`Date: ${createdDate}`, 20, 50);
      doc.text(`Total Records: ${selectedInvoiceDetails.length}`, 20, 60);
      
      // Calculate and show total amount
      const totalAmount = selectedInvoiceDetails.reduce((sum, item) => {
        const unitPriceStr = item.huaweiPo?.unit_price;
        const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                         typeof unitPriceStr === 'number' ? unitPriceStr : 0;
        const percentage = item.invoiced_percentage;
        const itemAmount = unitPrice * percentage / 100;
        return sum + itemAmount;
      }, 0);
      
      doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 20, 70);
      
      // Add some item details
      let yPosition = 90;
      doc.text('Invoice Items:', 20, yPosition);
      yPosition += 10;
      
      selectedInvoiceDetails.forEach((item, index) => {
        const unitPriceStr = item.huaweiPo?.unit_price;
        const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                         typeof unitPriceStr === 'number' ? unitPriceStr : 0;
        const amount = unitPrice * item.invoiced_percentage / 100;
        
        doc.text(`${index + 1}. ${item.huaweiPo?.po_no} - ${item.huaweiPo?.item_description}`, 20, yPosition);
        yPosition += 5;
        doc.text(`   Unit Price: $${unitPrice.toFixed(2)}, Invoiced: ${item.invoiced_percentage}%, Amount: $${amount.toFixed(2)}`, 20, yPosition);
        yPosition += 10;
      });
      
      console.log('PDF content added successfully');

      // Download the PDF
      const fileName = `Huawei_Invoice_${invoiceNo}_${new Date().toISOString().split('T')[0]}.pdf`;
      console.log('Saving PDF with filename:', fileName);
      doc.save(fileName);
      
      console.log('PDF saved successfully');
      setSuccess('PDF downloaded successfully!');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError(`Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        invoice_no: invoiceNumber,
        huawei_po_id: item.huawei_po_id!,
        invoiced_percentage: item.need_to_invoice_percentage
      }));

      console.log('Sending invoice data to backend:', invoiceData);
      console.log('Matched records:', matchedRecords);
      console.log('Correlated data:', correlatedData);

      const response = await createInvoice({
        invoice_no: invoiceNumber,
        invoice_data: invoiceData
      });

      console.log('Backend response:', response);

      setSuccess(`Successfully created invoice ${invoiceNumber} with ${response.data.created_invoices} records`);
      
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
        po_no: headers.findIndex(h => h?.toString().trim() === 'PO No.'),
        line_no: headers.findIndex(h => h?.toString().trim() === 'Line No.'),
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
        const po_no = row[columnMap.po_no]?.toString() || '';
        const line_no = row[columnMap.line_no]?.toString() || '';

        console.log(`Row ${i}: Extracted PO=${po_no}, Line=${line_no}`);

        // Only include rows with valid PO and Line numbers
        if (po_no && line_no) {
          extractedData.push({
            po_no,
            line_no
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
    
    const correlated: CorrelatedData[] = data.map(item => {
      console.log(`Looking for match: PO=${item.po_no}, Line=${item.line_no}`);
      
      // Find matching PO in existing data
      const existingPo = huaweiPoData.find(po => {
        const match = po.po_no === item.po_no && po.line_no === item.line_no;
        console.log(`Comparing: DB_PO=${po.po_no}, DB_Line=${po.line_no}, Match=${match}`);
        return match;
      });

      if (existingPo) {
        console.log(`✅ Found match for PO=${item.po_no}, Line=${item.line_no}`);
        console.log('Existing PO data:', existingPo);
        console.log('Unit price from DB:', existingPo.unit_price, 'Type:', typeof existingPo.unit_price);
        
        // Handle unit_price - ensure it's a number
        let unitPrice = 0;
        if (existingPo.unit_price !== null && existingPo.unit_price !== undefined) {
          unitPrice = typeof existingPo.unit_price === 'string' ? parseFloat(existingPo.unit_price) : existingPo.unit_price;
        }
        
        console.log('Processed unit price:', unitPrice);
        
        // Found correlation
        return {
          po_no: item.po_no,
          line_no: item.line_no,
          item_code: existingPo.item_code || 'N/A',
          item_description: existingPo.item_description || 'N/A',
          unit_price: unitPrice,
          invoiced_percentage: existingPo.invoiced_percentage || 0,
          need_to_invoice_percentage: 0,
          isCorrelated: true,
          huawei_po_id: existingPo.id
        };
      } else {
        console.log(`❌ No match found for PO=${item.po_no}, Line=${item.line_no}`);
        // No correlation found
        return {
          po_no: item.po_no,
          line_no: item.line_no,
          item_code: 'N/A',
          item_description: 'N/A',
          unit_price: 0,
          invoiced_percentage: 0,
          need_to_invoice_percentage: 0,
          isCorrelated: false,
          huawei_po_id: undefined
        };
      }
    });

    console.log('Final correlated data:', correlated);
    setCorrelatedData(correlated);
  };

  const handlePercentageChange = (index: number, percentage: number) => {
    const updatedData = [...correlatedData];
    updatedData[index] = { ...updatedData[index], need_to_invoice_percentage: percentage };
    setCorrelatedData(updatedData);
  };

  const handleDataEdit = (index: number, field: 'po_no' | 'line_no', value: string) => {
    const updatedData = [...extractedData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setExtractedData(updatedData);
    
    // Re-correlate after edit
    correlateWithExistingData(updatedData);
  };

  const validatePercentages = () => {
    return correlatedData.every(item => {
      const currentInvoiced = typeof item.invoiced_percentage === 'string' ? parseFloat(item.invoiced_percentage) : 
                             typeof item.invoiced_percentage === 'number' ? item.invoiced_percentage : 0;
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
      const currentInvoiced = typeof item.invoiced_percentage === 'string' ? parseFloat(item.invoiced_percentage) : 
                             typeof item.invoiced_percentage === 'number' ? item.invoiced_percentage : 0;
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
                    <TableRow key={summary.invoice_no}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {summary.invoice_no}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={summary.total_records} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold" color="primary">
                          ${summary.total_amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(summary.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleViewInvoice(summary.invoice_no)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleDeleteInvoice(summary.invoice_no)}
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
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>Process Huawei Invoice Excel File</DialogTitle>
        <DialogContent>
          {isProcessing && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Processing Excel file...
              </Typography>
              <LinearProgress variant="determinate" value={processingProgress} />
              <Typography variant="caption" color="text.secondary">
                {processingProgress}% Complete
              </Typography>
            </Box>
          )}

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
                            value={item.po_no}
                            onChange={(e) => handleDataEdit(index, 'po_no', e.target.value)}
                            variant="standard"
                            disabled={isProcessing}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.line_no}
                            onChange={(e) => handleDataEdit(index, 'line_no', e.target.value)}
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
              <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Invoice Number
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Enter invoice number (e.g., INV-2024-001)"
                  variant="outlined"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  sx={{ maxWidth: 400 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  This invoice number will be applied to all selected records
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Set the percentage to invoice for each PO. Total percentage: {getTotalPercentage().toFixed(2)}%
              </Typography>
              
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
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
                          backgroundColor: item.isCorrelated ? 'inherit' : '#ffebee',
                          '&:hover': {
                            backgroundColor: item.isCorrelated ? 'rgba(0, 0, 0, 0.04)' : '#ffcdd2'
                          }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {item.po_no}
                            {!item.isCorrelated && (
                              <Chip 
                                label="No Match" 
                                color="error" 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{item.item_code}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {item.item_description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          ${typeof item.unit_price === 'number' ? item.unit_price.toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`${item.invoiced_percentage}%`} 
                            color="primary" 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.need_to_invoice_percentage}
                            onChange={(e) => handlePercentageChange(index, parseFloat(e.target.value) || 0)}
                            variant="standard"
                            disabled={isProcessing || isSaving}
                            inputProps={{
                              min: 0,
                              max: 100,
                              step: 0.01
                            }}
                            sx={{ 
                              width: 100,
                              '& .MuiInput-root': {
                                color: (() => {
                                  const currentInvoiced = typeof item.invoiced_percentage === 'string' ? parseFloat(item.invoiced_percentage) : 
                                                   typeof item.invoiced_percentage === 'number' ? item.invoiced_percentage : 0;
                                  const newInvoice = typeof item.need_to_invoice_percentage === 'string' ? parseFloat(item.need_to_invoice_percentage) : 
                                              typeof item.need_to_invoice_percentage === 'number' ? item.need_to_invoice_percentage : 0;
                                  const total = currentInvoiced + newInvoice;
                                  return total > 100 ? 'error.main' : 'inherit';
                                })()
                              }
                            }}
                          />
                          {(() => {
                            const currentInvoiced = typeof item.invoiced_percentage === 'string' ? parseFloat(item.invoiced_percentage) : 
                                                   typeof item.invoiced_percentage === 'number' ? item.invoiced_percentage : 0;
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
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {!validatePercentages() && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="body2" component="div">
                    Please fix the following validation errors:
                  </Typography>
                  <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                    {getValidationErrors().map((error, index) => (
                      <li key={index}>
                        <Typography variant="body2">{error}</Typography>
                      </li>
                    ))}
                  </Box>
                </Alert>
              )}

              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Summary:</strong> {correlatedData.filter(item => item.isCorrelated).length} matched records, 
                  {correlatedData.filter(item => !item.isCorrelated).length} unmatched records (highlighted in red)
                </Typography>
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
          <Button onClick={() => setUploadDialogOpen(false)} disabled={isProcessing || isSaving}>
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
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Invoice Details
            {selectedInvoiceDetails.length > 0 && (
              <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
                {selectedInvoiceDetails[0].invoice_no}
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
                    {selectedInvoiceDetails[0].invoice_no}
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
                    Total Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    ${(() => {
                      const total = selectedInvoiceDetails.reduce((sum, item, index) => {
                        // Convert unit_price from decimal string to number
                        const unitPriceStr = item.huaweiPo?.unit_price;
                        const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                                         typeof unitPriceStr === 'number' ? unitPriceStr : 0;
                        const percentage = item.invoiced_percentage;
                        const itemAmount = unitPrice * percentage / 100;
                        
                        console.log(`Item ${index + 1} calculation:`, {
                          po_no: item.huaweiPo?.po_no,
                          line_no: item.huaweiPo?.line_no,
                          unit_price: unitPrice,
                          percentage: percentage,
                          item_amount: itemAmount,
                          running_total: sum + itemAmount
                        });
                        
                        return sum + itemAmount;
                      }, 0);
                      
                      console.log('Final total amount:', total);
                      return total.toFixed(2);
                    })()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedInvoiceDetails[0].createdAt).toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>

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
                      <TableCell>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedInvoiceDetails.map((item) => {
                      // Convert unit_price from decimal string to number
                      const unitPriceStr = item.huaweiPo?.unit_price;
                      const unitPrice = typeof unitPriceStr === 'string' ? parseFloat(unitPriceStr) : 
                                       typeof unitPriceStr === 'number' ? unitPriceStr : 0;
                      
                      // Convert requested_quantity from decimal string to number
                      const qtyStr = item.huaweiPo?.requested_quantity;
                      const requestedQty = typeof qtyStr === 'string' ? parseFloat(qtyStr) : 
                                         typeof qtyStr === 'number' ? qtyStr : 0;
                      
                      const amount = unitPrice * item.invoiced_percentage / 100;
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>{item.huaweiPo?.po_no}</TableCell>
                          <TableCell>{item.huaweiPo?.line_no}</TableCell>
                          <TableCell>{item.huaweiPo?.item_code}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {item.huaweiPo?.item_description}
                            </Typography>
                          </TableCell>
                          <TableCell>${unitPrice.toFixed(2)}</TableCell>
                          <TableCell>{requestedQty.toFixed(0)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${item.invoiced_percentage}%`} 
                              color="primary" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" color="primary">
                              ${amount.toFixed(2)}
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
            <Button onClick={handleDownloadPDF} startIcon={<DownloadIcon />} disabled={isDownloadingPDF}>
              {isDownloadingPDF ? 'Downloading...' : 'Download PDF'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 