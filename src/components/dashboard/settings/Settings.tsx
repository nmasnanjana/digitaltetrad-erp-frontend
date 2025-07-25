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
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { getSettings, updateSettings, resetSettings, SettingsData } from '@/api/settingsApi';

export const Settings: React.FC = () => {
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
        bank_account: resetData.bank_account || '',
      });

      setSuccess('Settings reset to defaults successfully!');
      setResetDialogOpen(false);
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
                  <MenuItem value="LKR">LKR (රු)</MenuItem>
                </Select>
              </FormControl>
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