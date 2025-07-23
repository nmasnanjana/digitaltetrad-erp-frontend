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
} from '@mui/material';
import * as XLSX from 'xlsx';
import { getAllHuaweiPos } from '@/api/huaweiPoApi';
import { getAllCustomers } from '@/api/customerApi';

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
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [correlatedData, setCorrelatedData] = useState<CorrelatedData[]>([]);
  const [huaweiPoData, setHuaweiPoData] = useState<HuaweiPoData[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load Huawei PO data for correlation
  useEffect(() => {
    loadHuaweiPoData();
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
          isCorrelated: true
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
          isCorrelated: false
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
    return correlatedData.every(item => 
      item.need_to_invoice_percentage >= 0 && 
      item.need_to_invoice_percentage <= 100
    );
  };

  const getTotalPercentage = () => {
    return correlatedData.reduce((sum, item) => sum + item.need_to_invoice_percentage, 0);
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
                            disabled={isProcessing}
                            inputProps={{
                              min: 0,
                              max: 100,
                              step: 0.01
                            }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {!validatePercentages() && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Please ensure all percentages are between 0 and 100.
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
          <Button onClick={() => setUploadDialogOpen(false)} disabled={isProcessing}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 