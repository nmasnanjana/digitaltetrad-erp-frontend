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
  getAllZteRateCards, 
  deleteAllZteRateCards,
  uploadZteRateCardExcel,
  type ZteRateCardData 
} from '@/api/zte-rate-card-api';
import { useSettings } from '@/contexts/SettingsContext';
import { ZteRateCardUploadDialog } from './ZteRateCardUploadDialog';

export const ZteRateCardManager: React.FC = () => {
  const { formatCurrency, currencySymbol } = useSettings();
  const [rateCards, setRateCards] = useState<ZteRateCardData[]>([]);
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
      const response = await getAllZteRateCards();
      setRateCards(response.data);
    } catch (err) {
      console.error('Error loading rate cards:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rate cards');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setSuccess('ZTE rate cards uploaded successfully!');
    loadRateCards();
    setUploadDialogOpen(false);
  };

  const handleDeleteAll = async () => {
    if (!confirm('Are you sure you want to delete all ZTE rate cards? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteAllZteRateCards();
      setRateCards([]);
      setSuccess('All ZTE rate cards deleted successfully!');
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
    card.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
        }}
      >
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
              ZTE Rate Cards
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
                No ZTE rate cards found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload an Excel file to get started with ZTE rate cards.
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
            <>
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

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Code</TableCell>
                      <TableCell>Item</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="center">Uploaded</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRateCards.map((card) => (
                      <TableRow key={card.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {card.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {card.item}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={card.unit} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(parseFloat(card.price.toFixed(2)))}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption" color="text.secondary">
                            {card.uploaded_at ? new Date(card.uploaded_at).toLocaleDateString() : '-'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredRateCards.length} of {rateCards.length} rate cards
                </Typography>
                <Chip 
                  label={`Total: ${rateCards.length} items`} 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      <ZteRateCardUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
        existingCount={rateCards.length}
      />
    </Box>
  );
};
