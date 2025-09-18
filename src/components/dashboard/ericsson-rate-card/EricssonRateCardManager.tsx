"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  CircularProgress,
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
  IconButton,
  Tooltip,
  Chip,
  TextField,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { 
  getAllEricssonRateCards, 
  deleteAllEricssonRateCards,
  uploadEricssonRateCardExcel,
  type EricssonRateCardData 
} from '@/api/ericsson-rate-card-api';
import { useSettings } from '@/contexts/SettingsContext';
import { EricssonRateCardUploadDialog } from './EricssonRateCardUploadDialog';

export const EricssonRateCardManager: React.FC = () => {
  const { formatCurrency, currencySymbol } = useSettings();
  const [rateCards, setRateCards] = useState<EricssonRateCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadRateCards();
  }, []);

  const loadRateCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllEricssonRateCards();
      setRateCards(response.data);
    } catch (err) {
      console.error('Error loading rate cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rate cards');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setSuccess('Rate cards uploaded successfully!');
    loadRateCards();
    setUploadDialogOpen(false);
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all rate cards? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteAllEricssonRateCards();
      setRateCards([]);
      setSuccess('All rate cards deleted successfully!');
    } catch (err) {
      console.error('Error deleting rate cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete rate cards');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRateCards();
  };

  // Filter data based on search term
  const filteredRateCards = rateCards.filter(card =>
    card.product_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.product_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Ericsson Rate Cards
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
              {rateCards.length > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteAll}
                  disabled={loading}
                >
                  Delete All
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
                disabled={loading}
              >
                {rateCards.length > 0 ? 'Update Rate Cards' : 'Upload Rate Cards'}
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {rateCards.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No rate cards uploaded
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload an Excel file containing Ericsson rate card data to get started.
              </Typography>
              <Button
                variant="contained"
                startIcon={<UploadIcon />}
                onClick={() => setUploadDialogOpen(true)}
              >
                Upload Rate Cards
              </Button>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Rate Cards ({filteredRateCards.length} of {rateCards.length} items)
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
              
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product Code</TableCell>
                      <TableCell>Product Description</TableCell>
                      <TableCell align="right">Rate</TableCell>
                      <TableCell>Uploaded</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRateCards.map((card) => (
                      <TableRow key={card.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {card.product_code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {card.product_description}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatCurrency(card.product_rate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {card.uploaded_at ? new Date(card.uploaded_at).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>

      <EricssonRateCardUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
        existingCount={rateCards.length}
      />
    </Box>
  );
}; 