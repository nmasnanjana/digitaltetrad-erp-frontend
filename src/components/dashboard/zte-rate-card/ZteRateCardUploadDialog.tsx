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
import { uploadZteRateCardExcel, uploadZteRateCardData } from '@/api/zte-rate-card-api';
import { useSettings } from '@/contexts/SettingsContext';
import * as XLSX from 'xlsx';

interface ZteRateCardUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingCount: number;
}

interface ExtractedData {
  code: string;
  item: string;
  unit: string;
  price: number;
}

export const ZteRateCardUploadDialog: React.FC<ZteRateCardUploadDialogProps> = ({
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
      
      // Look for the "L3 Unit Price" sheet specifically
      let sheetName = null;
      const possibleSheetNames = [
        'L3 Unit Price',
        'ZTE Rate Card',
        'Rate Card',
        'Rate Cards',
        'Price List',
        'Products',
        'Items'
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

      if (jsonData.length < 10) {
        throw new Error('Excel file must have at least 10 rows (data starts from row 9)');
      }

      // For ZTE format, we know the exact column positions:
      // B column (index 1) = Code
      // C column (index 2) = Item  
      // D column (index 3) = Unit
      // F column (index 5) = Price
      const columnMap = {
        code: 1,    // B column
        item: 2,    // C column
        unit: 3,    // D column
        price: 5    // F column
      };

      // Process data rows starting from row 9 (index 8)
      const extractedData: ExtractedData[] = [];
      for (let i = 8; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        
        if (!row || row.length === 0) continue;

        const code = row[columnMap.code]?.toString().trim();
        const item = row[columnMap.item]?.toString().trim();
        const unit = row[columnMap.unit]?.toString().trim();
        const price = parseFloat(row[columnMap.price]);

        // Skip rows where only item column is populated (as per requirement)
        if (!code && !unit && !price && item) {
          continue;
        }

        // Skip rows with missing required data
        if (!code || !item || !unit || isNaN(price) || price < 0) {
          continue;
        }

        extractedData.push({
          code,
          item,
          unit,
          price
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
      !item.code.trim() || 
      !item.item.trim() || 
      !item.unit.trim() ||
      item.price <= 0
    );

    if (invalidRows.length > 0) {
      setError(`Please fill all required fields in ${invalidRows.length} row(s)`);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Create a new API function to upload the edited data directly
      const response = await uploadZteRateCardData(extractedData);
      
      console.log('Upload successful:', response);
      
      // Show success message
      alert(`Successfully uploaded ${extractedData.length} ZTE rate card records`);
      
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
    item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        {existingCount > 0 ? 'Update ZTE Rate Cards' : 'Upload ZTE Rate Cards'}
      </DialogTitle>
      
      <DialogContent>
        {!previewMode && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              {existingCount > 0 
                ? 'Upload a new Excel file to replace all existing ZTE rate cards. The current rate cards will be deleted.'
                : 'Upload an Excel file containing ZTE rate card data. The file should have the "L3 Unit Price" sheet with data starting from row 9.'
              }
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="zte-rate-card-file-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="zte-rate-card-file-upload">
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
                placeholder="Search by Code, Item, or Unit..."
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
                    <TableCell>Code</TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Price</TableCell>
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
                            value={item.code}
                            onChange={(e) => {
                              const newData = [...extractedData];
                              newData[originalIndex].code = e.target.value;
                              setExtractedData(newData);
                            }}
                            sx={{ minWidth: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.item}
                            onChange={(e) => {
                              const newData = [...extractedData];
                              newData[originalIndex].item = e.target.value;
                              setExtractedData(newData);
                            }}
                            sx={{ minWidth: 200 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.unit}
                            onChange={(e) => {
                              const newData = [...extractedData];
                              newData[originalIndex].unit = e.target.value;
                              setExtractedData(newData);
                            }}
                            sx={{ minWidth: 100 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={item.price}
                            onChange={(e) => {
                              const newData = [...extractedData];
                              newData[originalIndex].price = parseFloat(parseFloat(e.target.value || '0').toFixed(2));
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
                    code: '',
                    item: '',
                    unit: '',
                    price: 0.00
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
