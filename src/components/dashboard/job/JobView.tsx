"use client";

import React, { useEffect, useState } from 'react';
import { type Job } from '@/types/job';
import { type Expense } from '@/types/expense';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Divider,
  Chip,
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
  LinearProgress,
  TextField,
  IconButton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { getExpensesByJob } from '@/api/expense-api';
import { uploadHuaweiPoExcel, getHuaweiPosByJobId, deleteHuaweiPoByJobId, downloadHuaweiPoFile, createHuaweiPo, updateHuaweiPo, deleteHuaweiPo } from '@/api/huawei-po-api';
import { useSettings } from '@/contexts/SettingsContext';
import * as XLSX from 'xlsx';
import LockIcon from '@mui/icons-material/Lock';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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

interface AddPoFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  jobId: string;
  customerId: number;
  initialData?: any;
  isEdit?: boolean;
}

const AddPoForm: React.FC<AddPoFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting,
  jobId,
  customerId,
  initialData,
  isEdit = false
}) => {
  const [formData, setFormData] = useState({
    siteCode: initialData?.siteCode || '',
    siteId: initialData?.siteId || '',
    siteName: initialData?.siteName || '',
    poNo: initialData?.poNo || '',
    lineNo: initialData?.lineNo || '',
    itemCode: initialData?.itemCode || '',
    itemDescription: initialData?.itemDescription || '',
    unitPrice: initialData?.unitPrice || 0,
    requestedQuantity: initialData?.requestedQuantity || 0
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      site_code: formData.siteCode,
      site_id: formData.siteId,
      site_name: formData.siteName,
      po_no: formData.poNo,
      line_no: formData.lineNo,
      item_code: formData.itemCode,
      item_description: formData.itemDescription,
      unit_price: formData.unitPrice,
      requested_quantity: formData.requestedQuantity,
      job_id: jobId,
      customer_id: customerId
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Site Code"
            value={formData.siteCode}
            onChange={(e) => { handleInputChange('siteCode', e.target.value); }}
            required
            disabled={isSubmitting}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Site ID"
            value={formData.siteId}
            onChange={(e) => { handleInputChange('siteId', e.target.value); }}
            required
            disabled={isSubmitting}
            size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Site Name"
            value={formData.siteName}
            onChange={(e) => { handleInputChange('siteName', e.target.value); }}
            required
            disabled={isSubmitting}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="PO Number"
            value={formData.poNo}
            onChange={(e) => { handleInputChange('poNo', e.target.value); }}
            required
            disabled={isSubmitting}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="PO Line Number"
            value={formData.lineNo}
            onChange={(e) => { handleInputChange('lineNo', e.target.value); }}
            required
            disabled={isSubmitting}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Item Code"
            value={formData.itemCode}
            onChange={(e) => { handleInputChange('itemCode', e.target.value); }}
            required
            disabled={isSubmitting}
            size="small"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Unit Price"
            type="number"
            value={formData.unitPrice}
            onChange={(e) => { handleInputChange('unitPrice', parseFloat(e.target.value) || 0); }}
            required
            disabled={isSubmitting}
            size="small"
            inputProps={{ min: 0, step: 0.01 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Requested Quantity"
            type="number"
            value={formData.requestedQuantity}
            onChange={(e) => { handleInputChange('requestedQuantity', parseInt(e.target.value) || 0); }}
            required
            disabled={isSubmitting}
            size="small"
            inputProps={{ min: 1 }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Item Description"
            value={formData.itemDescription}
            onChange={(e) => { handleInputChange('itemDescription', e.target.value); }}
            required
            disabled={isSubmitting}
            size="small"
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={isSubmitting}
        >
          {isSubmitting ? (isEdit ? 'Updating...' : 'Adding...') : (isEdit ? 'Update PO' : 'Add PO')}
        </Button>
      </Box>
    </Box>
  );
};

interface JobViewProps {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (newStatus: Job['status']) => void;
}

export const JobView: React.FC<JobViewProps> = ({
  job,
  onEdit,
  onDelete,
  onUpdateStatus,
}) => {
  const { formatCurrency } = useSettings();
  
  const router = useRouter();
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);
  const [nextStatus, setNextStatus] = React.useState<Job['status'] | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Upload dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [excelData, setExcelData] = useState<HuaweiPoData[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Huawei PO data states
  const [huaweiPoData, setHuaweiPoData] = useState<any[]>([]);
  const [huaweiPoLoading, setHuaweiPoLoading] = useState(true);
  const [huaweiPoError, setHuaweiPoError] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Download state
  const [isDownloading, setIsDownloading] = useState(false);

  // Add PO dialog state
  const [addPoDialogOpen, setAddPoDialogOpen] = useState(false);

  // Individual PO management states
  const [editPoDialogOpen, setEditPoDialogOpen] = useState(false);
  const [selectedPoForEdit, setSelectedPoForEdit] = useState<any>(null);
  const [isEditingPo, setIsEditingPo] = useState(false);
  const [isDeletingIndividualPo, setIsDeletingIndividualPo] = useState(false);

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        setLoading(true);
        console.log('Loading expenses for job:', job.id);
        const response = await getExpensesByJob(job.id);
        console.log('Expenses response:', response.data);
        setExpenses(response.data);
        setError(null);
      } catch (err) {
        console.error('Error loading expenses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load expenses');
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, [job.id]);

  // Load Huawei PO data for Huawei jobs
  useEffect(() => {
    const loadHuaweiPoData = async () => {
      if (!isHuaweiJob()) {
        setHuaweiPoLoading(false);
        return;
      }

      try {
        setHuaweiPoLoading(true);
        console.log('Loading Huawei PO data for job:', job.id);
        const response = await getHuaweiPosByJobId(job.id);
        console.log('Huawei PO response:', response);
        setHuaweiPoData(response);
        setHuaweiPoError(null);
      } catch (err) {
        console.error('Error loading Huawei PO data:', err);
        setHuaweiPoError(err instanceof Error ? err.message : 'Failed to load Huawei PO data');
      } finally {
        setHuaweiPoLoading(false);
      }
    };

    loadHuaweiPoData();
  }, [job.id]);

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'open':
        return 'default';
      case 'in progress':
        return 'primary';
      case 'installed':
        return 'info';
      case 'qc':
        return 'warning';
      case 'pat':
        return 'secondary';
      case 'closed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getTypeColor = (type: Job['type']) => {
    switch (type) {
      case 'supply and installation':
        return 'primary';
      case 'installation':
        return 'secondary';
      case 'maintenance':
        return 'info';
      default:
        return 'default';
    }
  };

  const getNextStatus = (currentStatus: Job['status']): Job['status'] | null => {
    const statusOrder: Job['status'][] = ['open', 'in progress', 'installed', 'qc', 'pat', 'closed'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    return currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;
  };

  const handleStatusUpdate = () => {
    if (nextStatus) {
      onUpdateStatus(nextStatus);
      setStatusDialogOpen(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      processExcelFile(file);
    }
  };

  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setUploadDialogOpen(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProcessingProgress(20);

      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      setProcessingProgress(40);

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      setProcessingProgress(60);

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      setProcessingProgress(80);

      // Extract headers from first row
      const headers = jsonData[0] as string[];
      
      // Find column indices
      const columnMap = {
        site_code: headers.findIndex(h => h?.toLowerCase().includes('site code')),
        site_id: headers.findIndex(h => h?.toLowerCase().includes('site id')),
        site_name: headers.findIndex(h => h?.toLowerCase().includes('site name')),
        po_no: headers.findIndex(h => h?.toLowerCase().includes('po no')),
        line_no: headers.findIndex(h => h?.toLowerCase().includes('po line no')),
        item_code: headers.findIndex(h => h?.toLowerCase().includes('item code')),
        item_description: headers.findIndex(h => h?.toLowerCase().includes('item description')),
        unit_price: headers.findIndex(h => h?.toLowerCase().includes('unit price')),
        requested_quantity: headers.findIndex(h => h?.toLowerCase().includes('requested qty')),
      };

      // Process data rows (skip header row)
      const processedData: HuaweiPoData[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (row && row.some(cell => cell !== undefined && cell !== null && cell !== '')) {
          processedData.push({
            id: 0, // Temporary ID for new data
            customerId: job.customer_id,
            siteCode: row[columnMap.site_code]?.toString() || '',
            siteId: row[columnMap.site_id]?.toString() || '',
            siteName: row[columnMap.site_name]?.toString() || '',
            poNo: row[columnMap.po_no]?.toString() || '',
            lineNo: row[columnMap.line_no]?.toString() || '',
            itemCode: row[columnMap.item_code]?.toString() || '',
            itemDescription: row[columnMap.item_description]?.toString() || '',
            unitPrice: parseFloat(row[columnMap.unit_price]) || 0,
            requestedQuantity: parseInt(row[columnMap.requested_quantity]) || 0,
            invoicedPercentage: 0, // Default value for new PO data
            uploadedAt: undefined
          });
        }
      }

      setExcelData(processedData);
      setProcessingProgress(100);
    } catch (error) {
      console.error('Error processing Excel file:', error);
      setError('Failed to process Excel file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDataEdit = (index: number, field: keyof HuaweiPoData, value: string | number) => {
    const updatedData = [...excelData];
    updatedData[index] = { ...updatedData[index], [field]: value };
    setExcelData(updatedData);
  };

  const handleSubmitData = async () => {
    if (!selectedFile || !isHuaweiJob()) {
      console.error('No file selected or not a Huawei job');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingProgress(0);

      // Upload file and data to backend
      const response = await uploadHuaweiPoExcel(
        job.id,
        job.customer_id,
        selectedFile
      );

      console.log('Upload successful:', response);
      
      // Show success message (you can add a toast notification here)
      const actionText = huaweiPoData.length === 0 ? 'uploaded' : 'updated';
      alert(`Successfully ${actionText} ${response.data.recordsImported} records for job ${job.id}`);
      
      // Close dialog and reset state
      setUploadDialogOpen(false);
      setExcelData([]);
      setSelectedFile(null);
      setProcessingProgress(0);
      
      // Refresh Huawei PO data to show the newly uploaded data
      if (isHuaweiJob()) {
        try {
          const huaweiPoResponse = await getHuaweiPosByJobId(job.id);
          setHuaweiPoData(huaweiPoResponse);
          setHuaweiPoError(null);
        } catch (err) {
          console.error('Error refreshing Huawei PO data:', err);
        }
      }
      
    } catch (error) {
      console.error('Error uploading data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload data';
      const actionText = huaweiPoData.length === 0 ? 'Upload' : 'Update';
      alert(`${actionText} failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteHuaweiPo = async () => {
    if (!isHuaweiJob()) {
      console.error('Not a Huawei job');
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = await deleteHuaweiPoByJobId(job.id);
      
      console.log('Delete successful:', response);
      
      // Show success message
      alert(`Successfully deleted Huawei PO records for job ${job.id}`);
      
      // Close dialog
      setDeleteDialogOpen(false);
      
      // Refresh Huawei PO data (should be empty now)
      setHuaweiPoData([]);
      setHuaweiPoError(null);
      
    } catch (error) {
      console.error('Error deleting Huawei PO data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete Huawei PO data';
      alert(`Delete failed: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadHuaweiPo = async () => {
    if (!isHuaweiJob()) {
      console.error('Not a Huawei job');
      return;
    }

    try {
      setIsDownloading(true);
      
      const blob = await downloadHuaweiPoFile(job.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `huawei_po_${job.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Download successful');
      
    } catch (error) {
      console.error('Error downloading Huawei PO file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file';
      alert(`Download failed: ${errorMessage}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Check if job is associated with Huawei customer
  const isHuaweiJob = () => {
    return job.customer?.name?.toLowerCase() === 'huawei';
  };

  // Helper function to check if any PO has been invoiced
  const hasInvoicedPos = () => {
    return huaweiPoData.some(po => {
      const invoicedPercentage = typeof po.invoiced_percentage === 'string' ? 
        parseFloat(po.invoiced_percentage) : 
        typeof po.invoiced_percentage === 'number' ? po.invoiced_percentage : 0;
      return invoicedPercentage > 0;
    });
  };

  // Helper function to count frozen POs
  const getFrozenPoCount = () => {
    return huaweiPoData.filter(po => {
      const invoicedPercentage = typeof po.invoiced_percentage === 'string' ? 
        parseFloat(po.invoiced_percentage) : 
        typeof po.invoiced_percentage === 'number' ? po.invoiced_percentage : 0;
      return invoicedPercentage > 0;
    }).length;
  };

  // Helper function to check if all POs are frozen
  const areAllPosFrozen = () => {
    return huaweiPoData.length > 0 && getFrozenPoCount() === huaweiPoData.length;
  };

  // Individual PO management functions
  const handleAddPo = async (poData: any) => {
    try {
      setIsEditingPo(true);
      await createHuaweiPo(poData);
      
      // Refresh PO data
      const response = await getHuaweiPosByJobId(job.id);
      setHuaweiPoData(response);
      setAddPoDialogOpen(false);
      
      alert('PO added successfully!');
    } catch (error) {
      console.error('Error adding PO:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add PO';
      alert(`Add PO failed: ${errorMessage}`);
    } finally {
      setIsEditingPo(false);
    }
  };

  const handleEditPo = async (poData: any) => {
    try {
      setIsEditingPo(true);
      await updateHuaweiPo(selectedPoForEdit.id, poData);
      
      // Refresh PO data
      const response = await getHuaweiPosByJobId(job.id);
      setHuaweiPoData(response);
      setEditPoDialogOpen(false);
      setSelectedPoForEdit(null);
      
      alert('PO updated successfully!');
    } catch (error) {
      console.error('Error updating PO:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update PO';
      alert(`Update PO failed: ${errorMessage}`);
    } finally {
      setIsEditingPo(false);
    }
  };

  const handleDeleteIndividualPo = async (poId: number) => {
    if (!window.confirm('Are you sure you want to delete this PO record?')) {
      return;
    }

    try {
      setIsDeletingIndividualPo(true);
      await deleteHuaweiPo(poId);
      
      // Refresh PO data
      const response = await getHuaweiPosByJobId(job.id);
      setHuaweiPoData(response);
      
      alert('PO deleted successfully!');
    } catch (error) {
      console.error('Error deleting PO:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete PO';
      alert(`Delete PO failed: ${errorMessage}`);
    } finally {
      setIsDeletingIndividualPo(false);
    }
  };

  const openEditPoDialog = (po: any) => {
    setSelectedPoForEdit(po);
    setEditPoDialogOpen(true);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Job Details
          </Typography>
          <Divider />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Job ID
            </Typography>
            <Typography variant="body1">{job.id}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Job Name
            </Typography>
            <Typography variant="body1">{job.name}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={job.status}
                color={getStatusColor(job.status)}
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Type
            </Typography>
            <Chip
              label={job.type}
              color={getTypeColor(job.type)}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Team
            </Typography>
            <Typography variant="body1">
              {job.team?.name || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Customer
            </Typography>
            <Typography variant="body1">
              {job.customer?.name || '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Created At
            </Typography>
            <Typography variant="body1">
              {job.createdAt ? new Date(job.createdAt).toLocaleString() : '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1">
              {job.updatedAt ? new Date(job.updatedAt).toLocaleString() : '-'}
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Completion Status
            </Typography>
            <Typography variant="body1">
              {job.completed_at 
                ? `Completed on ${new Date(job.completed_at).toLocaleString()}`
                : 'Not completed yet'}
            </Typography>
          </Grid>
        </Grid>

        {loading ? <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Loading expenses...
            </Typography>
          </Box> : null}

        {error ? <Box sx={{ mt: 4 }}>
            <Typography variant="h6" color="error" gutterBottom>
              Error loading expenses: {error}
            </Typography>
          </Box> : null}

        {!loading && !error && expenses.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Related Expenses
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.expenseType?.name || '-'}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        {expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {!loading && !error && expenses.length === 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No expenses found for this job
            </Typography>
          </Box>
        )}

        {/* Huawei PO Data Section - Only for Huawei jobs */}
        {isHuaweiJob() && (
          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Huawei Purchase Orders
              </Typography>
              {huaweiPoData.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    onClick={() => {
                      // Trigger file input for PO variations
                      document.getElementById('excel-file-input')?.click();
                    }}
                    disabled={areAllPosFrozen()}
                    title={areAllPosFrozen() ? "Cannot update - all PO records have been invoiced and are frozen" : ""}
                  >
                    PO Variations
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => { setAddPoDialogOpen(true); }}
                    disabled={areAllPosFrozen()}
                    title={areAllPosFrozen() ? "Cannot add - all PO records have been invoiced and are frozen" : ""}
                  >
                    Add PO
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={handleDownloadHuaweiPo}
                    disabled={isDownloading}
                  >
                    {isDownloading ? 'Downloading...' : 'Download PO'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => { setDeleteDialogOpen(true); }}
                    disabled={isDeleting || hasInvoicedPos()}
                    title={hasInvoicedPos() ? "Cannot delete - some PO records have been invoiced" : ""}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete All PO Data'}
                  </Button>
                </Box>
              )}
            </Box>
            
            {huaweiPoLoading ? <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  Loading Huawei PO data...
                </Typography>
                <LinearProgress />
              </Box> : null}

            {huaweiPoError ? <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="error" gutterBottom>
                  Error loading Huawei PO data: {huaweiPoError}
                </Typography>
              </Box> : null}

            {!huaweiPoLoading && !huaweiPoError && huaweiPoData.length > 0 && (
              <TableContainer component={Paper} sx={{ maxHeight: 400, overflowX: 'auto' }}>
                <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 100 }}>Site Code</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Site ID</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Site Name</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>PO NO.</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>PO Line NO.</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Item Code</TableCell>
                      <TableCell sx={{ minWidth: 200 }}>Item Description</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Unit Price</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Requested Qty</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Invoiced %</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Status</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Uploaded At</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {huaweiPoData.map((po, index) => {
                      const invoicedPercentage = typeof po.invoicedPercentage === 'string' ? 
                        parseFloat(po.invoicedPercentage) : 
                        typeof po.invoicedPercentage === 'number' ? po.invoicedPercentage : 0;
                      const isFrozen = invoicedPercentage > 0;
                      
                      return (
                        <TableRow 
                          key={po.id || index}
                          sx={{
                            backgroundColor: isFrozen ? 'grey.50' : 'inherit',
                            '&:hover': {
                              backgroundColor: isFrozen ? 'grey.100' : 'action.hover'
                            }
                          }}
                        >
                          <TableCell sx={{ minWidth: 100 }}>{po.siteCode}</TableCell>
                          <TableCell sx={{ minWidth: 100 }}>{po.siteId}</TableCell>
                          <TableCell sx={{ minWidth: 150 }}>{po.siteName}</TableCell>
                          <TableCell sx={{ minWidth: 120 }}>{po.poNo}</TableCell>
                          <TableCell sx={{ minWidth: 120 }}>{po.lineNo}</TableCell>
                          <TableCell sx={{ minWidth: 120 }}>{po.itemCode}</TableCell>
                          <TableCell sx={{ minWidth: 200 }}>
                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                              {po.itemDescription}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ minWidth: 100 }}>
                            {formatCurrency(po.unitPrice)}
                          </TableCell>
                          <TableCell sx={{ minWidth: 120 }}>{po.requestedQuantity}</TableCell>
                          <TableCell sx={{ minWidth: 120 }}>
                            {invoicedPercentage > 0 ? `${invoicedPercentage}%` : '-'}
                          </TableCell>
                          <TableCell sx={{ minWidth: 120 }}>
                            {isFrozen ? (
                              <Chip 
                                label="Frozen" 
                                color="default" 
                                size="small"
                                icon={<LockIcon />}
                                title="This PO has been invoiced and cannot be modified"
                                sx={{ 
                                  backgroundColor: 'grey.200',
                                  color: 'grey.700',
                                  '& .MuiChip-icon': {
                                    color: 'grey.600'
                                  }
                                }}
                              />
                            ) : (
                              <Chip 
                                label="Editable" 
                                color="success" 
                                size="small"
                                title="This PO can be modified"
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ minWidth: 120 }}>
                            {po.uploadedAt ? new Date(po.uploadedAt).toLocaleDateString() : '-'}
                          </TableCell>
                          <TableCell sx={{ minWidth: 100 }}>
                            <IconButton
                              size="small"
                              onClick={() => { openEditPoDialog(po); }}
                              disabled={isFrozen}
                              title="Edit PO"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteIndividualPo(po.id)}
                              disabled={isFrozen}
                              title="Delete PO"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Warning message for invoiced POs */}
            {hasInvoicedPos() && (
              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark" sx={{ fontSize: '0.875rem' }}>
                  <strong>Note:</strong> {areAllPosFrozen() 
                    ? `All ${getFrozenPoCount()} PO record(s) are frozen due to invoicing. No modifications are allowed.`
                    : `${getFrozenPoCount()} PO record(s) are frozen due to invoicing. These cannot be modified or deleted.`
                  }
                </Typography>
              </Box>
            )}

            {!huaweiPoLoading && !huaweiPoError && huaweiPoData.length === 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No Huawei PO data found for this job. Upload an Excel file to get started.
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          {getNextStatus(job.status) && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setNextStatus(getNextStatus(job.status));
                setStatusDialogOpen(true);
              }}
            >
              Next Phase
            </Button>
          )}
          {isHuaweiJob() && huaweiPoData.length === 0 && (
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                // Trigger file input
                document.getElementById('excel-file-input')?.click();
              }}
            >
              Upload PO
            </Button>
          )}
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={onEdit}
          >
            Edit Job
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onDelete}
          >
            Delete Job
          </Button>
        </Box>
      </CardContent>

      <Dialog open={statusDialogOpen} onClose={() => { setStatusDialogOpen(false); }}>
        <DialogTitle>Update Job Status</DialogTitle>
        <DialogContent>
          Are you sure you want to update the job status to {nextStatus}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setStatusDialogOpen(false); }}>Cancel</Button>
          <Button onClick={handleStatusUpdate} color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => { setUploadDialogOpen(false); }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {huaweiPoData.length === 0 ? 'Upload PO Excel File' : 'PO Variations - Update Existing PO Data'}
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

          {!isProcessing && excelData.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {huaweiPoData.length === 0 ? 'Extracted Data' : 'PO Variations Data'} ({excelData.length} rows)
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {huaweiPoData.length === 0 
                  ? 'Review and edit the data before submitting' 
                  : 'Review and edit the PO variations before updating existing data'
                }
              </Typography>
              
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Site Code</TableCell>
                      <TableCell>Site ID</TableCell>
                      <TableCell>Site Name</TableCell>
                      <TableCell>PO NO.</TableCell>
                      <TableCell>PO Line NO.</TableCell>
                      <TableCell>Item Code</TableCell>
                      <TableCell>Item Description</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Requested Qty</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {excelData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.siteCode}
                            onChange={(e) => { handleDataEdit(index, 'siteCode', e.target.value); }}
                            variant="standard"
                            disabled={isProcessing}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.siteId}
                            onChange={(e) => { handleDataEdit(index, 'siteId', e.target.value); }}
                            variant="standard"
                            disabled={isProcessing}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.siteName}
                            onChange={(e) => { handleDataEdit(index, 'siteName', e.target.value); }}
                            variant="standard"
                            disabled={isProcessing}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.poNo}
                            onChange={(e) => { handleDataEdit(index, 'poNo', e.target.value); }}
                            variant="standard"
                            disabled={isProcessing}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.lineNo}
                            onChange={(e) => { handleDataEdit(index, 'lineNo', e.target.value); }}
                            variant="standard"
                            disabled={isProcessing}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.itemCode}
                            onChange={(e) => { handleDataEdit(index, 'itemCode', e.target.value); }}
                            variant="standard"
                            disabled={isProcessing}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={row.itemDescription}
                            onChange={(e) => { handleDataEdit(index, 'itemDescription', e.target.value); }}
                            variant="standard"
                            multiline
                            maxRows={2}
                            disabled={isProcessing}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={row.unitPrice}
                            onChange={(e) => { handleDataEdit(index, 'unitPrice', parseFloat(e.target.value) || 0); }}
                            variant="standard"
                            disabled={isProcessing}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={row.requestedQuantity}
                            onChange={(e) => { handleDataEdit(index, 'requestedQuantity', parseInt(e.target.value) || 0); }}
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

          {isProcessing ? <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading data to server...
              </Typography>
              <LinearProgress />
            </Box> : null}

          {!isProcessing && excelData.length === 0 && !error && (
            <Typography variant="body2" color="text.secondary">
              No data found in the Excel file or file format is not supported.
            </Typography>
          )}

          {error ? <Typography variant="body2" color="error">
              {error}
            </Typography> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUploadDialogOpen(false); }} disabled={isProcessing}>
            Cancel
          </Button>
          {excelData.length > 0 && (
            <Button 
              onClick={handleSubmitData} 
              color="primary" 
              variant="contained"
              disabled={isProcessing}
            >
              {isProcessing 
                ? (huaweiPoData.length === 0 ? 'Uploading...' : 'Updating...') 
                : (huaweiPoData.length === 0 ? 'Submit Data' : 'Update PO Data')
              }
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); }}>
        <DialogTitle>Delete Huawei PO Data</DialogTitle>
        <DialogContent>
          {hasInvoicedPos() ? (
            <Box>
              <Typography variant="body1" color="error" gutterBottom>
                {areAllPosFrozen() 
                  ? 'Cannot delete Huawei PO data for this job - all PO records are frozen.'
                  : 'Cannot delete Huawei PO data for this job.'
                }
              </Typography>
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                {areAllPosFrozen() 
                  ? 'All PO records have been invoiced and cannot be deleted:'
                  : 'The following PO records have been invoiced and cannot be deleted:'
                }
              </Typography>
              <Box sx={{ mt: 1, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                {huaweiPoData
                  .filter(po => {
                    const invoicedPercentage = typeof po.invoiced_percentage === 'string' ? 
                      parseFloat(po.invoiced_percentage) : 
                      typeof po.invoiced_percentage === 'number' ? po.invoiced_percentage : 0;
                    return invoicedPercentage > 0;
                  })
                  .map((po, index) => (
                    <Typography key={po.id || index} variant="body2" color="error.dark">
                      • PO {po.po_no} (Line {po.line_no}) - {po.invoiced_percentage}% invoiced
                    </Typography>
                  ))}
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {areAllPosFrozen() 
                  ? 'All PO records with invoices cannot be deleted to maintain data integrity. This job is completely frozen.'
                  : 'PO records with invoices cannot be deleted to maintain data integrity. You can only delete PO records that have 0% invoiced.'
                }
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" gutterBottom>
                Are you sure you want to delete all Huawei PO data for this job?
              </Typography>
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                This action will:
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Delete all {huaweiPoData.length} PO records from the database</li>
                <li>Remove the uploaded Excel file from the server</li>
                <li>This action cannot be undone</li>
              </ul>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDeleteDialogOpen(false); }} disabled={isDeleting}>
            {hasInvoicedPos() ? 'Close' : 'Cancel'}
          </Button>
          {!hasInvoicedPos() && (
            <Button 
              onClick={handleDeleteHuaweiPo} 
              color="error" 
              variant="contained"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete All Data'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Add PO Dialog */}
      <Dialog 
        open={addPoDialogOpen} 
        onClose={() => { setAddPoDialogOpen(false); }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New PO</DialogTitle>
        <DialogContent>
          <AddPoForm 
            onSubmit={handleAddPo}
            onCancel={() => { setAddPoDialogOpen(false); }}
            isSubmitting={isEditingPo}
            jobId={job.id}
            customerId={job.customer_id}
          />
        </DialogContent>
      </Dialog>

      {/* Edit PO Dialog */}
      <Dialog 
        open={editPoDialogOpen} 
        onClose={() => {
          setEditPoDialogOpen(false);
          setSelectedPoForEdit(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit PO</DialogTitle>
        <DialogContent>
          {selectedPoForEdit ? <AddPoForm 
              onSubmit={handleEditPo}
              onCancel={() => {
                setEditPoDialogOpen(false);
                setSelectedPoForEdit(null);
              }}
              isSubmitting={isEditingPo}
              jobId={job.id}
              customerId={job.customer_id}
              initialData={selectedPoForEdit}
              isEdit
            /> : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
