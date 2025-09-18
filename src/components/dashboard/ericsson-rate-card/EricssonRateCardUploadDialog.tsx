"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  IconButton,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { uploadEricssonRateCardExcel, uploadEricssonRateCardData } from '@/api/ericsson-rate-card-api';
import { useSettings } from '@/contexts/SettingsContext';
import * as XLSX from 'xlsx';

interface EricssonRateCardUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCount: number;
}

interface ExtractedData {
  product_code: string;
  product_description: string;
  product_rate: number;
}

export const EricssonRateCardUploadDialog: React.FC<EricssonRateCardUploadDialogProps> = ({
  open,
  onClose,
  onSuccess,
  existingCount,
}) => {
  const { formatCurrency } = useSettings();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
           const [error, setError] = useState<string | null>(null);
         const [previewMode, setPreviewMode] = useState(false);
         const [searchTerm, setSearchTerm] = useState<string>('');

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setExtractedData([]);
      setPreviewMode(false);
      processExcelFile(file);
    }
  };

  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      setProcessingProgress(25);
      
      // Read the file
      const arrayBuffer = await file.arrayBuffer();
      setProcessingProgress(50);
      
                   // Parse Excel file
             const workbook = XLSX.read(arrayBuffer, { type: 'array' });
             
             // Look for the rate card sheet - try multiple possible names
             let sheetName = null;
             const possibleSheetNames = [
                 'Rate Card Price Revision - 2023',
                 'Rate Card',
                 'Rate Cards',
                 'Price List',
                 'Products'
             ];
             
             for (const name of possibleSheetNames) {
                 if (workbook.SheetNames.includes(name)) {
                     sheetName = name;
                     break;
                 }
             }
             
             // If no specific sheet found, use the first sheet
             if (!sheetName) {
                 sheetName = workbook.SheetNames[0];
             }
             
             const worksheet = workbook.Sheets[sheetName];
             const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      setProcessingProgress(75);

      if (jsonData.length < 2) {
        throw new Error('Excel file must have at least 2 rows (headers and data)');
      }

      // Extract headers from first row
      const headers = jsonData[0] as string[];
      
      console.log('Excel headers found:', headers);
      
      if (!headers || headers.length === 0) {
        throw new Error('Could not find headers in the Excel file');
      }
      
                   // Find column indices for the expected columns
             const columnMap = {
               productCode: headers.findIndex(h => h?.toString().toLowerCase().includes('product') && h?.toString().toLowerCase().includes('code')),
               productDescription: headers.findIndex(h => h?.toString().toLowerCase().includes('product') && h?.toString().toLowerCase().includes('description')),
               productRate: headers.findIndex(h => h?.toString().toLowerCase().includes('rate') || h?.toString().toLowerCase().includes('price') || h?.toString().toLowerCase().includes('proposed')),
             };

             // Fallback column mapping if exact matches not found
             if (columnMap.productCode === -1) {
               columnMap.productCode = headers.findIndex(h => h?.toString().toLowerCase().includes('code'));
             }
             if (columnMap.productDescription === -1) {
               columnMap.productDescription = headers.findIndex(h => h?.toString().toLowerCase().includes('description'));
             }
             if (columnMap.productRate === -1) {
               columnMap.productRate = headers.findIndex(h => h?.toString().toLowerCase().includes('amount') || h?.toString().toLowerCase().includes('cost') || h?.toString().toLowerCase().includes('lkr'));
             }

      console.log('Column map:', columnMap);

      // Validate that we found required columns
      const missingColumns = Object.entries(columnMap)
        .filter(([key, index]) => index === -1)
        .map(([key]) => key);

      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}. Found columns: ${headers.join(', ')}`);
      }

      // Process data rows starting from row 2 (index 1)
      const extractedData: ExtractedData[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        
        if (!row || row.length === 0) continue;

        const productCode = row[columnMap.productCode]?.toString().trim();
        const productDescription = row[columnMap.productDescription]?.toString().trim();
        const productRate = parseFloat(row[columnMap.productRate]);

        // Skip rows with missing required data
        if (!productCode || !productDescription || isNaN(productRate) || productRate < 0) {
          continue;
        }

        extractedData.push({
          product_code: productCode,
          product_description: productDescription,
          product_rate: productRate
        });
      }

      setProcessingProgress(100);
      setExtractedData(extractedData);
      setPreviewMode(true);

      if (extractedData.length === 0) {
        setError('No valid data found in the Excel file. Please check the file format and data.');
      }

    } catch (err) {
      console.error('Error processing Excel file:', err);
      setError(err instanceof Error ? err.message : 'Failed to process Excel file');
    } finally {
      setIsProcessing(false);
    }
  };

           const handleSubmit = async () => {
           if (extractedData.length === 0) {
             setError('No data to upload');
             return;
           }

           // Validate that all required fields are filled
           const invalidRows = extractedData.filter(item => 
             !item.product_code.trim() || 
             !item.product_description.trim() || 
             item.product_rate <= 0
           );

           if (invalidRows.length > 0) {
             setError(`Please fill all required fields in ${invalidRows.length} row(s)`);
             return;
           }

           try {
             setIsUploading(true);
             setError(null);

             // Create a new API function to upload the edited data directly
             const response = await uploadEricssonRateCardData(extractedData);
             
             console.log('Upload successful:', response);
             
             // Show success message
             alert(`Successfully uploaded ${extractedData.length} rate card records`);
             
             // Close dialog and reset state
             onSuccess();
             handleClose();
             
           } catch (error) {
             console.error('Error uploading data:', error);
             const errorMessage = error instanceof Error ? error.message : 'Failed to upload data';
             setError(`Upload failed: ${errorMessage}`);
           } finally {
             setIsUploading(false);
           }
         };

  const handleClose = () => {
    setSelectedFile(null);
    setExtractedData([]);
    setError(null);
    setPreviewMode(false);
    setProcessingProgress(0);
    onClose();
  };

           // Filter data based on search term
         const filteredData = extractedData.filter(item =>
           item.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.product_description.toLowerCase().includes(searchTerm.toLowerCase())
         );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        {existingCount > 0 ? 'Update Ericsson Rate Cards' : 'Upload Ericsson Rate Cards'}
      </DialogTitle>
      
      <DialogContent>
        {!previewMode && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              {existingCount > 0 
                ? 'Upload a new Excel file to replace all existing rate cards. The current rate cards will be deleted.'
                : 'Upload an Excel file containing Ericsson rate card data. The file should have columns for Product Code, Product Description, and Rate.'
              }
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="rate-card-file-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="rate-card-file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<UploadIcon />}
                  disabled={isProcessing}
                >
                  Select Excel File
                </Button>
              </label>
            </Box>

            {selectedFile && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected file: {selectedFile.name}
                </Typography>
              </Box>
            )}

            {isProcessing && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Processing Excel file...
                </Typography>
                <LinearProgress variant="determinate" value={processingProgress} />
              </Box>
            )}
          </Box>
        )}

                       {previewMode && extractedData.length > 0 && (
                 <Box sx={{ mt: 2 }}>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                     <Typography variant="h6">
                       Preview ({filteredData.length} of {extractedData.length} items)
                     </Typography>
                   </Box>
                   
                   <Box sx={{ mb: 2 }}>
                     <TextField
                       fullWidth
                       size="small"
                       placeholder="Search by Product Code or Description..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       InputProps={{
                         startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                       }}
                     />
                   </Box>
            
                               <TableContainer component={Paper} sx={{ maxHeight: 500, overflowY: 'auto' }}>
                     <Table stickyHeader size="small">
                       <TableHead>
                         <TableRow>
                           <TableCell>Product Code</TableCell>
                           <TableCell>Product Description</TableCell>
                           <TableCell align="right">Rate</TableCell>
                           <TableCell align="center">Actions</TableCell>
                         </TableRow>
                       </TableHead>
                                                <TableBody>
                           {filteredData.map((item, index) => {
                             // Find the original index in extractedData for editing
                             const originalIndex = extractedData.findIndex(originalItem => 
                               originalItem === item
                             );
                             return (
                           <TableRow key={index} hover>
                             <TableCell>
                               <TextField
                                 size="small"
                                 value={item.product_code}
                                 onChange={(e) => {
                                   const newData = [...extractedData];
                                   newData[originalIndex].product_code = e.target.value;
                                   setExtractedData(newData);
                                 }}
                                 sx={{ minWidth: 150 }}
                               />
                             </TableCell>
                             <TableCell>
                               <TextField
                                 size="small"
                                 value={item.product_description}
                                 onChange={(e) => {
                                   const newData = [...extractedData];
                                   newData[originalIndex].product_description = e.target.value;
                                   setExtractedData(newData);
                                 }}
                                 sx={{ minWidth: 200 }}
                               />
                             </TableCell>
                             <TableCell align="right">
                               <TextField
                                 size="small"
                                 type="number"
                                 value={item.product_rate}
                                 onChange={(e) => {
                                   const newData = [...extractedData];
                                   newData[originalIndex].product_rate = parseFloat(e.target.value) || 0;
                                   setExtractedData(newData);
                                 }}
                                 sx={{ minWidth: 100 }}
                               />
                             </TableCell>
                             <TableCell align="center">
                               <IconButton
                                 size="small"
                                 color="error"
                                 onClick={() => {
                                   const newData = extractedData.filter((_, i) => i !== originalIndex);
                                   setExtractedData(newData);
                                 }}
                               >
                                 <DeleteIcon fontSize="small" />
                                                                </IconButton>
                               </TableCell>
                             </TableRow>
                           );
                           })}
                       </TableBody>
                     </Table>
                   </TableContainer>
                   
                   <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <Typography variant="body2" color="text.secondary">
                       Total Items: {extractedData.length}
                     </Typography>
                     <Button
                       variant="outlined"
                       startIcon={<AddIcon />}
                       onClick={() => {
                         const newData = [...extractedData, {
                           product_code: '',
                           product_description: '',
                           product_rate: 0
                         }];
                         setExtractedData(newData);
                       }}
                     >
                       Add New Row
                     </Button>
                   </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>
          Cancel
        </Button>
        {previewMode && extractedData.length > 0 && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {isUploading ? 'Uploading...' : (existingCount > 0 ? 'Update Rate Cards' : 'Upload Rate Cards')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}; 