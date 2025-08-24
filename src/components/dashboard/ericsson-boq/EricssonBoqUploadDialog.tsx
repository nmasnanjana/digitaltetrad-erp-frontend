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
  Tabs,
  Tab,
  Chip,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { uploadEricssonBoqExcel } from '@/api/ericsson-boq-api';
import { useSettings } from '@/contexts/SettingsContext';
import * as XLSX from 'xlsx';

interface EricssonBoqUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobId: string;
}

interface ExtractedBoqData {
  project: string;
  siteId: string;
  siteName: string;
  purchaseOrderNumber: string;
}

interface ExtractedBoqItem {
  serviceNumber: string;
  itemDescription: string;
  uom: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  isAdditionalWork: boolean;
  rateCardMatched: boolean;
}

interface ExtractedMaterial {
  slNo: string;
  materialDescription: string;
  qty: string;
  remarks?: string;
}

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
      id={`boq-tabpanel-${index}`}
      aria-labelledby={`boq-tab-${index}`}
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

export const EricssonBoqUploadDialog: React.FC<EricssonBoqUploadDialogProps> = ({
  open,
  onClose,
  onSuccess,
  jobId,
}) => {
  const { formatCurrency } = useSettings();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Editing state
  const [editingBoqItem, setEditingBoqItem] = useState<number | null>(null);
  const [editingRemoveMaterial, setEditingRemoveMaterial] = useState<number | null>(null);
  const [editingSurplusMaterial, setEditingSurplusMaterial] = useState<number | null>(null);
  const [editingProjectInfo, setEditingProjectInfo] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Extracted data
  const [boqData, setBoqData] = useState<ExtractedBoqData | null>(null);
  const [boqItems, setBoqItems] = useState<ExtractedBoqItem[]>([]);
  const [removeMaterials, setRemoveMaterials] = useState<ExtractedMaterial[]>([]);
  const [surplusMaterials, setSurplusMaterials] = useState<ExtractedMaterial[]>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setPreviewMode(false);
      processExcelFile(file);
    }
  };

  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);

    try {
      setProcessingProgress(10);
      
      // Read the file
      const arrayBuffer = await file.arrayBuffer();
      setProcessingProgress(20);
      
      // Parse Excel file
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      setProcessingProgress(30);

      // Check if required sheets exist (with trimmed names to handle spaces)
      const requiredSheets = ['Main', 'BOQ', 'Remove', 'Surplus'];
      const availableSheets = workbook.SheetNames.map(name => name.trim());
      const missingSheets = requiredSheets.filter(sheet => !availableSheets.includes(sheet));
      
      if (missingSheets.length > 0) {
        throw new Error(`Missing required sheets: ${missingSheets.join(', ')}. Available sheets: ${workbook.SheetNames.join(', ')}`);
      }

      setProcessingProgress(40);

      // Extract data from Main sheet
      const mainSheet = workbook.Sheets['Main'];
      const mainData = XLSX.utils.sheet_to_json(mainSheet, { header: 1 });
      
      let project = '', siteId = '', siteName = '', purchaseOrderNumber = '';
      
      for (const row of mainData) {
        if (Array.isArray(row) && row.length >= 2) {
          const key = row[0]?.toString().toLowerCase();
          const value = row[1]?.toString();
          
          if (key?.includes('project')) project = value || '';
          if (key?.includes('site id')) siteId = value || '';
          if (key?.includes('site name')) siteName = value || '';
          if (key?.includes('purchase order number')) purchaseOrderNumber = value || '';
        }
      }

      // Validate required fields from Main sheet
      if (!project || !siteId || !siteName || !purchaseOrderNumber) {
        throw new Error(`Missing required fields from Main sheet. Found: Project=${project}, Site ID=${siteId}, Site Name=${siteName}, PO Number=${purchaseOrderNumber}`);
      }

      setBoqData({
        project,
        siteId,
        siteName,
        purchaseOrderNumber
      });

      setProcessingProgress(50);

      // Extract data from BOQ sheet
      const boqSheet = workbook.Sheets['BOQ'];
      const boqData = XLSX.utils.sheet_to_json(boqSheet, { header: 1 });
      
      // Find headers row
      let headersRow = 0;
      for (let i = 0; i < boqData.length; i++) {
        const row = boqData[i] as any[];
        if (row && row.some(cell => cell?.toString().toLowerCase().includes('service number'))) {
          headersRow = i;
          break;
        }
      }

      const headers = boqData[headersRow] as string[];
      
      // Find column indices
      const columnMap = {
        serviceNumber: headers.findIndex(h => h?.toString().toLowerCase().includes('service number')),
        itemDescription: headers.findIndex(h => h?.toString().toLowerCase().includes('item description')),
        uom: headers.findIndex(h => h?.toString().toLowerCase().includes('uom')),
        qty: headers.findIndex(h => h?.toString().toLowerCase().includes('qty')),
      };

      // Validate column mapping
      const missingColumns = Object.entries(columnMap)
        .filter(([key, index]) => index === -1)
        .map(([key]) => key);

      if (missingColumns.length > 0) {
        throw new Error(`Missing required columns in BOQ sheet: ${missingColumns.join(', ')}`);
      }

      setProcessingProgress(60);

      // Process BOQ items
      const extractedItems: ExtractedBoqItem[] = [];
      let isAdditionalWork = false;

      for (let i = headersRow + 1; i < boqData.length; i++) {
        const row = boqData[i] as any[];
        
        if (!row || row.length === 0) continue;

        // Check if this is the "Additional Work" row
        if (row.some(cell => cell?.toString().toLowerCase().includes('additional work'))) {
          isAdditionalWork = true;
          continue;
        }

        const serviceNumber = row[columnMap.serviceNumber]?.toString().trim();
        const itemDescription = row[columnMap.itemDescription]?.toString().trim();
        const uom = row[columnMap.uom]?.toString().trim();
        const qty = parseFloat(row[columnMap.qty]);

        // Skip rows with missing required data
        if (!serviceNumber || !itemDescription || !uom || isNaN(qty) || qty <= 0) {
          continue;
        }

        // For now, we'll set placeholder values for unit price and total amount
        // These will be calculated by the backend when matching with rate cards
        const unitPrice = 0; // Will be set by backend
        const totalAmount = 0; // Will be calculated by backend

        extractedItems.push({
          serviceNumber,
          itemDescription,
          uom,
          qty,
          unitPrice,
          totalAmount,
          isAdditionalWork,
          rateCardMatched: false // Will be set by backend
        });
      }

      setBoqItems(extractedItems);

      setProcessingProgress(70);

      // Extract data from Remove sheet
      const removeSheet = workbook.Sheets[workbook.SheetNames.find(name => name.trim() === 'Remove') || 'Remove'];
      const removeData = XLSX.utils.sheet_to_json(removeSheet, { header: 1 });
      
      console.log('Remove sheet data:', removeData);
      
      // Use fixed header row 14 (index 13) and column mapping
      let removeHeadersRow = 13; // Row 14 (index 13)
      const removeHeaders = removeData[removeHeadersRow] as string[];
      
      console.log('Remove headers row 14:', removeHeaders);
      
      // Use fixed column indices: B=1, C=2, E=4
      const removeColumnMap = {
        slNo: 1, // B column (index 1)
        materialDescription: 2, // C column (index 2)
        qty: 4, // E column (index 4)
        remarks: 3, // D column (index 3)
      };
      
      console.log('Remove column mapping:', removeColumnMap);

      // Process Remove materials
      const extractedRemoveMaterials: ExtractedMaterial[] = [];
      console.log(`Processing Remove materials from row ${removeHeadersRow + 1} to ${removeData.length}`);
      
      for (let i = removeHeadersRow + 1; i < removeData.length; i++) {
        const row = removeData[i] as any[];
        
        console.log(`Processing Remove row ${i}:`, row);
        
        if (!row || row.length === 0) {
          console.log(`Skipping Remove row ${i} - empty row`);
          continue;
        }

        const slNo = row[removeColumnMap.slNo]?.toString().trim() || '';
        const materialDescription = row[removeColumnMap.materialDescription]?.toString().trim();
        const qty = row[removeColumnMap.qty]?.toString().trim();
        const remarks = row[removeColumnMap.remarks]?.toString().trim() || '';

        console.log(`Remove row ${i} extracted: slNo="${slNo}", materialDescription="${materialDescription}", qty="${qty}", remarks="${remarks}"`);

        // Skip rows with missing required data - only material description and qty are required
        if (!materialDescription || !qty) {
          console.log(`Skipping Remove row ${i} - missing required data`);
          continue;
        }

        console.log(`Adding Remove material: ${materialDescription} (${qty})`);
        extractedRemoveMaterials.push({
          slNo,
          materialDescription,
          qty,
          remarks
        });
      }
      
      console.log(`Found ${extractedRemoveMaterials.length} Remove materials:`, extractedRemoveMaterials);

      setRemoveMaterials(extractedRemoveMaterials);

      setProcessingProgress(80);

      // Extract data from Surplus sheet
      const surplusSheet = workbook.Sheets[workbook.SheetNames.find(name => name.trim() === 'Surplus') || 'Surplus'];
      const surplusData = XLSX.utils.sheet_to_json(surplusSheet, { header: 1 });
      
      console.log('Surplus sheet data:', surplusData);
      
      // Use fixed header row 14 (index 13) and column mapping
      let surplusHeadersRow = 13; // Row 14 (index 13)
      const surplusHeaders = surplusData[surplusHeadersRow] as string[];
      
      console.log('Surplus headers row 14:', surplusHeaders);
      
      // Use fixed column indices: B=1, C=2, E=4
      const surplusColumnMap = {
        slNo: 1, // B column (index 1)
        materialDescription: 2, // C column (index 2)
        qty: 4, // E column (index 4)
        remarks: 3, // D column (index 3)
      };
      
      console.log('Surplus column mapping:', surplusColumnMap);

      // Process Surplus materials
      const extractedSurplusMaterials: ExtractedMaterial[] = [];
      console.log(`Processing Surplus materials from row ${surplusHeadersRow + 1} to ${surplusData.length}`);
      
      for (let i = surplusHeadersRow + 1; i < surplusData.length; i++) {
        const row = surplusData[i] as any[];
        
        console.log(`Processing Surplus row ${i}:`, row);
        
        if (!row || row.length === 0) {
          console.log(`Skipping Surplus row ${i} - empty row`);
          continue;
        }

        const slNo = row[surplusColumnMap.slNo]?.toString().trim() || '';
        const materialDescription = row[surplusColumnMap.materialDescription]?.toString().trim();
        const qty = row[surplusColumnMap.qty]?.toString().trim();
        const remarks = row[surplusColumnMap.remarks]?.toString().trim() || '';

        console.log(`Surplus row ${i} extracted: slNo="${slNo}", materialDescription="${materialDescription}", qty="${qty}", remarks="${remarks}"`);

        // Skip rows with missing required data - only material description and qty are required
        if (!materialDescription || !qty) {
          console.log(`Skipping Surplus row ${i} - missing required data`);
          continue;
        }

        console.log(`Adding Surplus material: ${materialDescription} (${qty})`);
        extractedSurplusMaterials.push({
          slNo,
          materialDescription,
          qty,
          remarks
        });
      }
      
      console.log(`Found ${extractedSurplusMaterials.length} Surplus materials:`, extractedSurplusMaterials);

      setSurplusMaterials(extractedSurplusMaterials);

      setProcessingProgress(100);
      setPreviewMode(true);

      if (extractedItems.length === 0 && extractedRemoveMaterials.length === 0 && extractedSurplusMaterials.length === 0) {
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
    if (!selectedFile) {
      setError('No file selected');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const response = await uploadEricssonBoqExcel(selectedFile, jobId);
      
      console.log('Upload successful:', response);
      
      // Show success message
      alert(`Successfully uploaded BOQ with ${response.data.items?.length || 0} items and ${response.data.materials?.length || 0} materials`);
      
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
    setBoqData(null);
    setBoqItems([]);
    setRemoveMaterials([]);
    setSurplusMaterials([]);
    setError(null);
    setPreviewMode(false);
    setProcessingProgress(0);
    setTabValue(0);
    onClose();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // BOQ Items editing functions
  const handleEditBoqItem = (index: number) => {
    setEditingBoqItem(index);
  };

  const handleSaveBoqItem = (index: number, updatedItem: ExtractedBoqItem) => {
    const newItems = [...boqItems];
    newItems[index] = updatedItem;
    setBoqItems(newItems);
    setEditingBoqItem(null);
  };

  const handleDeleteBoqItem = (index: number) => {
    const newItems = boqItems.filter((_, i) => i !== index);
    setBoqItems(newItems);
  };

  const handleAddBoqItem = () => {
    const newItem: ExtractedBoqItem = {
      serviceNumber: '',
      itemDescription: '',
      uom: '',
      qty: 0,
      unitPrice: 0,
      totalAmount: 0,
      isAdditionalWork: false,
      rateCardMatched: false,
    };
    setBoqItems([...boqItems, newItem]);
    setEditingBoqItem(boqItems.length);
  };

  // Remove Materials editing functions
  const handleEditRemoveMaterial = (index: number) => {
    setEditingRemoveMaterial(index);
  };

  const handleSaveRemoveMaterial = (index: number, updatedMaterial: ExtractedMaterial) => {
    const newMaterials = [...removeMaterials];
    newMaterials[index] = updatedMaterial;
    setRemoveMaterials(newMaterials);
    setEditingRemoveMaterial(null);
  };

  const handleDeleteRemoveMaterial = (index: number) => {
    const newMaterials = removeMaterials.filter((_, i) => i !== index);
    setRemoveMaterials(newMaterials);
  };

  const handleAddRemoveMaterial = () => {
    const newMaterial: ExtractedMaterial = {
      slNo: '',
      materialDescription: '',
      qty: '',
      remarks: '',
    };
    setRemoveMaterials([...removeMaterials, newMaterial]);
    setEditingRemoveMaterial(removeMaterials.length);
  };

  // Surplus Materials editing functions
  const handleEditSurplusMaterial = (index: number) => {
    setEditingSurplusMaterial(index);
  };

  const handleSaveSurplusMaterial = (index: number, updatedMaterial: ExtractedMaterial) => {
    const newMaterials = [...surplusMaterials];
    newMaterials[index] = updatedMaterial;
    setSurplusMaterials(newMaterials);
    setEditingSurplusMaterial(null);
  };

  const handleDeleteSurplusMaterial = (index: number) => {
    const newMaterials = surplusMaterials.filter((_, i) => i !== index);
    setSurplusMaterials(newMaterials);
  };

  const handleAddSurplusMaterial = () => {
    const newMaterial: ExtractedMaterial = {
      slNo: '',
      materialDescription: '',
      qty: '',
      remarks: '',
    };
    setSurplusMaterials([...surplusMaterials, newMaterial]);
    setEditingSurplusMaterial(surplusMaterials.length);
  };

  const regularItems = boqItems.filter(item => !item.isAdditionalWork);
  const additionalWorkItems = boqItems.filter(item => item.isAdditionalWork);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
    >
      <DialogTitle>
        Upload Ericsson BOQ
      </DialogTitle>
      
      <DialogContent>
        {!previewMode && (
          <Box sx={{ py: 2 }}>
            <Typography variant="body1" gutterBottom>
              Upload an Excel file containing Ericsson BOQ data. The file should have the following sheets:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 2 }}>
              <li><strong>Main:</strong> Project information (Project, Site ID, Site Name, Purchase Order Number)</li>
              <li><strong>BOQ:</strong> Service items (Service Number, Item Description, UOM, Qty)</li>
              <li><strong>Remove:</strong> Materials to be removed (SL.No, Material Description, Qty, Remarks)</li>
              <li><strong>Surplus:</strong> Surplus materials (SL.No, Material Description, Qty, Remarks)</li>
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <input
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                id="boq-file-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="boq-file-upload">
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

        {previewMode && boqData && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="BOQ data tabs">
                <Tab label="Project Info" />
                <Tab label={`BOQ Items (${regularItems.length})`} />
                {additionalWorkItems.length > 0 && (
                  <Tab label={`Additional Work (${additionalWorkItems.length})`} />
                )}
                <Tab label={`Remove Materials (${removeMaterials.length})`} />
                <Tab label={`Surplus Materials (${surplusMaterials.length})`} />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Project Information</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => setEditingProjectInfo(true)}
                >
                  Edit Project Info
                </Button>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Project</Typography>
                  {editingProjectInfo ? (
                    <TextField
                      size="small"
                      value={boqData.project}
                      onChange={(e) => setBoqData({ ...boqData, project: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body1">{boqData.project}</Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Site ID</Typography>
                  {editingProjectInfo ? (
                    <TextField
                      size="small"
                      value={boqData.siteId}
                      onChange={(e) => setBoqData({ ...boqData, siteId: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body1">{boqData.siteId}</Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Site Name</Typography>
                  {editingProjectInfo ? (
                    <TextField
                      size="small"
                      value={boqData.siteName}
                      onChange={(e) => setBoqData({ ...boqData, siteName: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body1">{boqData.siteName}</Typography>
                  )}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Purchase Order Number</Typography>
                  {editingProjectInfo ? (
                    <TextField
                      size="small"
                      value={boqData.purchaseOrderNumber}
                      onChange={(e) => setBoqData({ ...boqData, purchaseOrderNumber: e.target.value })}
                      fullWidth
                    />
                  ) : (
                    <Typography variant="body1">{boqData.purchaseOrderNumber}</Typography>
                  )}
                </Box>
              </Box>
              {editingProjectInfo && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={() => setEditingProjectInfo(false)}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CancelIcon />}
                    onClick={() => {
                      // Reset to original values if needed
                      setEditingProjectInfo(false);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">BOQ Items</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddBoqItem}
                >
                  Add Item
                </Button>
              </Box>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Service Number</TableCell>
                      <TableCell>Item Description</TableCell>
                      <TableCell>UOM</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {regularItems.map((item, index) => {
                      const isEditing = editingBoqItem === index;
                      return (
                        <TableRow key={index} hover>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={item.serviceNumber}
                                onChange={(e) => {
                                  const updatedItem = { ...item, serviceNumber: e.target.value };
                                  handleSaveBoqItem(index, updatedItem);
                                }}
                                onBlur={() => setEditingBoqItem(null)}
                                autoFocus
                              />
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.serviceNumber}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={item.itemDescription}
                                onChange={(e) => {
                                  const updatedItem = { ...item, itemDescription: e.target.value };
                                  handleSaveBoqItem(index, updatedItem);
                                }}
                                onBlur={() => setEditingBoqItem(null)}
                              />
                            ) : (
                              <Typography variant="body2">
                                {item.itemDescription}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={item.uom}
                                onChange={(e) => {
                                  const updatedItem = { ...item, uom: e.target.value };
                                  handleSaveBoqItem(index, updatedItem);
                                }}
                                onBlur={() => setEditingBoqItem(null)}
                              />
                            ) : (
                              <Typography variant="body2">
                                {item.uom}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {isEditing ? (
                              <TextField
                                size="small"
                                type="number"
                                value={item.qty}
                                onChange={(e) => {
                                  const updatedItem = { ...item, qty: parseFloat(e.target.value) || 0 };
                                  handleSaveBoqItem(index, updatedItem);
                                }}
                                onBlur={() => setEditingBoqItem(null)}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {item.qty}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditBoqItem(index)}
                                  disabled={isEditing}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteBoqItem(index)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            {additionalWorkItems.length > 0 && (
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Additional Work Items</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      const newItem: ExtractedBoqItem = {
                        serviceNumber: '',
                        itemDescription: '',
                        uom: '',
                        qty: 0,
                        unitPrice: 0,
                        totalAmount: 0,
                        isAdditionalWork: true,
                        rateCardMatched: false,
                      };
                      setBoqItems([...boqItems, newItem]);
                      setEditingBoqItem(boqItems.length);
                    }}
                  >
                    Add Item
                  </Button>
                </Box>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Service Number</TableCell>
                        <TableCell>Item Description</TableCell>
                        <TableCell>UOM</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {additionalWorkItems.map((item, index) => {
                        const actualIndex = boqItems.findIndex(i => i === item);
                        const isEditing = editingBoqItem === actualIndex;
                        return (
                          <TableRow key={index} hover>
                            <TableCell>
                              {isEditing ? (
                                <TextField
                                  size="small"
                                  value={item.serviceNumber}
                                  onChange={(e) => {
                                    const updatedItem = { ...item, serviceNumber: e.target.value };
                                    handleSaveBoqItem(actualIndex, updatedItem);
                                  }}
                                  onBlur={() => setEditingBoqItem(null)}
                                  autoFocus
                                />
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {item.serviceNumber}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <TextField
                                  size="small"
                                  value={item.itemDescription}
                                  onChange={(e) => {
                                    const updatedItem = { ...item, itemDescription: e.target.value };
                                    handleSaveBoqItem(actualIndex, updatedItem);
                                  }}
                                  onBlur={() => setEditingBoqItem(null)}
                                />
                              ) : (
                                <Typography variant="body2">
                                  {item.itemDescription}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {isEditing ? (
                                <TextField
                                  size="small"
                                  value={item.uom}
                                  onChange={(e) => {
                                    const updatedItem = { ...item, uom: e.target.value };
                                    handleSaveBoqItem(actualIndex, updatedItem);
                                  }}
                                  onBlur={() => setEditingBoqItem(null)}
                                />
                              ) : (
                                <Typography variant="body2">
                                  {item.uom}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {isEditing ? (
                                <TextField
                                  size="small"
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) => {
                                    const updatedItem = { ...item, qty: parseFloat(e.target.value) || 0 };
                                    handleSaveBoqItem(actualIndex, updatedItem);
                                  }}
                                  onBlur={() => setEditingBoqItem(null)}
                                />
                              ) : (
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {item.qty}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditBoqItem(actualIndex)}
                                    disabled={isEditing}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteBoqItem(actualIndex)}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            )}

            <TabPanel value={tabValue} index={additionalWorkItems.length > 0 ? 3 : 2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Remove Materials</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddRemoveMaterial}
                >
                  Add Material
                </Button>
              </Box>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>SL.No</TableCell>
                      <TableCell>Material Description</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {removeMaterials.map((material, index) => {
                      const isEditing = editingRemoveMaterial === index;
                      return (
                        <TableRow key={index} hover>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={material.slNo}
                                onChange={(e) => {
                                  const updatedMaterial = { ...material, slNo: e.target.value };
                                  handleSaveRemoveMaterial(index, updatedMaterial);
                                }}
                                onBlur={() => setEditingRemoveMaterial(null)}
                                autoFocus
                              />
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {material.slNo}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={material.materialDescription}
                                onChange={(e) => {
                                  const updatedMaterial = { ...material, materialDescription: e.target.value };
                                  handleSaveRemoveMaterial(index, updatedMaterial);
                                }}
                                onBlur={() => setEditingRemoveMaterial(null)}
                              />
                            ) : (
                              <Typography variant="body2">
                                {material.materialDescription}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={material.qty}
                                onChange={(e) => {
                                  const updatedMaterial = { ...material, qty: e.target.value };
                                  handleSaveRemoveMaterial(index, updatedMaterial);
                                }}
                                onBlur={() => setEditingRemoveMaterial(null)}
                              />
                            ) : (
                              <Typography variant="body2">
                                {material.qty}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={material.remarks || ''}
                                onChange={(e) => {
                                  const updatedMaterial = { ...material, remarks: e.target.value };
                                  handleSaveRemoveMaterial(index, updatedMaterial);
                                }}
                                onBlur={() => setEditingRemoveMaterial(null)}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                {material.remarks || '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditRemoveMaterial(index)}
                                  disabled={isEditing}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteRemoveMaterial(index)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={additionalWorkItems.length > 0 ? 4 : 3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Surplus Materials</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddSurplusMaterial}
                >
                  Add Material
                </Button>
              </Box>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>SL.No</TableCell>
                      <TableCell>Material Description</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Remarks</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {surplusMaterials.map((material, index) => {
                      const isEditing = editingSurplusMaterial === index;
                      return (
                        <TableRow key={index} hover>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={material.slNo}
                                onChange={(e) => {
                                  const updatedMaterial = { ...material, slNo: e.target.value };
                                  handleSaveSurplusMaterial(index, updatedMaterial);
                                }}
                                onBlur={() => setEditingSurplusMaterial(null)}
                                autoFocus
                              />
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {material.slNo}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={material.materialDescription}
                                onChange={(e) => {
                                  const updatedMaterial = { ...material, materialDescription: e.target.value };
                                  handleSaveSurplusMaterial(index, updatedMaterial);
                                }}
                                onBlur={() => setEditingSurplusMaterial(null)}
                              />
                            ) : (
                              <Typography variant="body2">
                                {material.materialDescription}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={material.qty}
                                onChange={(e) => {
                                  const updatedMaterial = { ...material, qty: e.target.value };
                                  handleSaveSurplusMaterial(index, updatedMaterial);
                                }}
                                onBlur={() => setEditingSurplusMaterial(null)}
                              />
                            ) : (
                              <Typography variant="body2">
                                {material.qty}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={material.remarks || ''}
                                onChange={(e) => {
                                  const updatedMaterial = { ...material, remarks: e.target.value };
                                  handleSaveSurplusMaterial(index, updatedMaterial);
                                }}
                                onBlur={() => setEditingSurplusMaterial(null)}
                              />
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                {material.remarks || '-'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="Edit">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditSurplusMaterial(index)}
                                  disabled={isEditing}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteSurplusMaterial(index)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
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
        {previewMode && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={isUploading}
            startIcon={isUploading ? <CircularProgress size={16} /> : <UploadIcon />}
          >
            {isUploading ? 'Uploading...' : 'Upload BOQ'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}; 