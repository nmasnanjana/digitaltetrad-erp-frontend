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
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import UploadIcon from '@mui/icons-material/Upload';
import { getSettings, updateSettings, resetSettings, SettingsData } from '@/api/settingsApi';
import { useSettings } from '@/contexts/SettingsContext';

export const Settings: React.FC = () => {
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    currency: 'USD',
    vat_percentage: 0,
    vat_number: '',
    business_registration_number: '',
    contact_number: '',
    email: '',
    finance_email: '',
    company_name: '',
    company_address: '',
    company_logo: '',
    bank_account: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await getSettings();
      const data = response.data;
      console.log('Loaded settings:', data);
      console.log('Company logo exists:', !!data.company_logo);
      setSettings(data);
      
      setFormData({
        currency: data.currency,
        vat_percentage: data.vat_percentage,
        vat_number: data.vat_number || '',
        business_registration_number: data.business_registration_number || '',
        contact_number: data.contact_number || '',
        email: data.email || '',
        finance_email: data.finance_email || '',
        company_name: data.company_name,
        company_address: data.company_address || '',
        company_logo: data.company_logo || '',
        bank_account: data.bank_account || '',
      });
      setError(null);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await updateSettings({
        ...formData,
      });

      const updatedSettings = response.data;
      setSettings(updatedSettings);
      setSuccess('Settings saved successfully!');
      refreshSettings(); // Refresh settings in context
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await resetSettings();
      const resetData = response.data;
      setSettings(resetData);
      
      setFormData({
        currency: resetData.currency,
        vat_percentage: resetData.vat_percentage,
        vat_number: resetData.vat_number || '',
        business_registration_number: resetData.business_registration_number || '',
        contact_number: resetData.contact_number || '',
        email: resetData.email || '',
        finance_email: resetData.finance_email || '',
        company_name: resetData.company_name,
        company_address: resetData.company_address || '',
        company_logo: resetData.company_logo || '',
        bank_account: resetData.bank_account || '',
      });

      setSuccess('Settings reset to defaults successfully!');
      setResetDialogOpen(false);
      refreshSettings(); // Refresh settings in context
    } catch (err) {
      console.error('Error resetting settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Logo file size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          company_logo: result
        }));
        setError(null);
        setSuccess('Logo uploaded successfully! Click "Save Settings" to apply changes.');
      };
      reader.onerror = () => {
        setError('Failed to read the image file. Please try again.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearLogo = () => {
    setFormData(prev => ({
      ...prev,
      company_logo: ''
    }));
    setError(null);
    setSuccess('Logo cleared. Click "Save Settings" to apply changes.');
  };

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
              Global Settings
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<RestartAltIcon />}
                onClick={() => setResetDialogOpen(true)}
                disabled={saving}
              >
                Reset to Defaults
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Box>

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

          <Grid container spacing={3}>
            {/* Company Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Company Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={formData.company_name}
                onChange={(e) => handleFormChange('company_name', e.target.value)}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={formData.currency}
                  label="Currency"
                  onChange={(e) => handleFormChange('currency', e.target.value)}
                >
                  <MenuItem value="USD">USD ($)</MenuItem>
                  <MenuItem value="EUR">EUR (€)</MenuItem>
                  <MenuItem value="GBP">GBP (£)</MenuItem>
                  <MenuItem value="AED">AED (د.إ)</MenuItem>
                  <MenuItem value="SAR">SAR (ر.س)</MenuItem>
                  <MenuItem value="QAR">QAR (ر.ق)</MenuItem>
                  <MenuItem value="KWD">KWD (د.ك)</MenuItem>
                  <MenuItem value="BHD">BHD (د.ب)</MenuItem>
                  <MenuItem value="OMR">OMR (ر.ع)</MenuItem>
                  <MenuItem value="LKR">LKR (LKR)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="subtitle1">Company Logo</Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="logo-upload"
                  type="file"
                  onChange={handleLogoUpload}
                />
                <label htmlFor="logo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    size="small"
                  >
                    Upload Logo
                  </Button>
                </label>
              </Box>
              
              {/* Logo Display Section */}
              {(formData.company_logo || settings?.company_logo) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
                  <Avatar
                    src={formData.company_logo || settings?.company_logo}
                    alt="Company Logo"
                    sx={{ 
                      width: 80, 
                      height: 80,
                      border: '2px solid #e0e0e0'
                    }}
                    variant="rounded"
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      Company Logo
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.company_logo ? 'New logo ready to save' : 'Current logo from settings'}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={handleClearLogo}
                    sx={{ minWidth: 'auto', px: 1 }}
                  >
                    Clear
                  </Button>
                </Box>
              )}
              
              {/* No Logo Message */}
              {!formData.company_logo && !settings?.company_logo && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, p: 2, border: '1px dashed #e0e0e0', borderRadius: 1, backgroundColor: '#fafafa' }}>
                  <Avatar
                    sx={{ 
                      width: 80, 
                      height: 80,
                      border: '2px dashed #e0e0e0',
                      backgroundColor: '#f5f5f5'
                    }}
                    variant="rounded"
                  >
                    <UploadIcon sx={{ fontSize: 30, color: '#999' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      No company logo uploaded
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Click "Upload Logo" to add your company logo
                    </Typography>
                  </Box>
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Address"
                multiline
                rows={3}
                value={formData.company_address}
                onChange={(e) => handleFormChange('company_address', e.target.value)}
                placeholder="Enter company address (multi-line)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contact Number"
                value={formData.contact_number}
                onChange={(e) => handleFormChange('contact_number', e.target.value)}
                placeholder="e.g., +94761219119"
                helperText="Include country code (e.g., +94 for Sri Lanka, +1 for USA, +44 for UK)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Business Registration Number"
                value={formData.business_registration_number}
                onChange={(e) => handleFormChange('business_registration_number', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Finance Email"
                type="email"
                value={formData.finance_email}
                onChange={(e) => handleFormChange('finance_email', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bank Account Details"
                multiline
                rows={4}
                value={formData.bank_account}
                onChange={(e) => handleFormChange('bank_account', e.target.value)}
                placeholder="Enter bank account details including account number, bank name, IBAN, etc."
              />
            </Grid>

            {/* VAT Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                VAT Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="VAT Number"
                value={formData.vat_number}
                onChange={(e) => handleFormChange('vat_number', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="VAT Percentage"
                type="number"
                value={formData.vat_percentage}
                onChange={(e) => handleFormChange('vat_percentage', parseFloat(e.target.value) || 0)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                inputProps={{
                  min: 0,
                  max: 100,
                  step: 0.01,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Reset Settings to Defaults</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all settings to their default values? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleReset} color="error" variant="contained" disabled={saving}>
            {saving ? 'Resetting...' : 'Reset to Defaults'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}; 