'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Button,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import { getAllJobs } from '@/api/job-api';
import { getAllOperationTypes } from '@/api/operationTypeApi';
import { getAllExpenseTypes } from '@/api/expense-api';
import { type Job } from '@/types/job';
import { type OperationType } from '@/types/operationType';
import { type ExpenseType } from '@/types/expense';

export interface ExpenseFilters {
  expenseType: 'all' | 'jobs' | 'operations';
  selectedJobIds: string[];
  selectedOperationIds: string[];
  selectedExpenseTypeIds: string[];
  fromDate: string;
  toDate: string;
  minAmount: string;
  maxAmount: string;
  status: string;
}

interface ExpenseFiltersProps {
  filters: ExpenseFilters;
  onFilterChange: (filters: ExpenseFilters) => void;
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [jobSearch, setJobSearch] = useState('');
  const [operationSearch, setOperationSearch] = useState('');
  const [expenseTypeSearch, setExpenseTypeSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [jobsResponse, operationTypesResponse, expenseTypesResponse] = await Promise.all([
          getAllJobs(),
          getAllOperationTypes(),
          getAllExpenseTypes(),
        ]);
        setJobs(jobsResponse.data);
        setOperationTypes(operationTypesResponse.data);
        setExpenseTypes(expenseTypesResponse.data);
      } catch (error) {
        console.error('Failed to load filter data:', error);
      }
    };
    loadData();
  }, []);

  const handleFilterChange = (field: keyof ExpenseFilters, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const handleJobToggle = (jobId: string) => {
    const newSelectedJobIds = filters.selectedJobIds.includes(jobId)
      ? filters.selectedJobIds.filter(id => id !== jobId)
      : [...filters.selectedJobIds, jobId];
    handleFilterChange('selectedJobIds', newSelectedJobIds);
  };

  const handleOperationToggle = (operationId: string) => {
    const newSelectedOperationIds = filters.selectedOperationIds.includes(operationId)
      ? filters.selectedOperationIds.filter(id => id !== operationId)
      : [...filters.selectedOperationIds, operationId];
    handleFilterChange('selectedOperationIds', newSelectedOperationIds);
  };

  const handleExpenseTypeToggle = (expenseTypeId: string) => {
    const newSelectedExpenseTypeIds = filters.selectedExpenseTypeIds.includes(expenseTypeId)
      ? filters.selectedExpenseTypeIds.filter(id => id !== expenseTypeId)
      : [...filters.selectedExpenseTypeIds, expenseTypeId];
    handleFilterChange('selectedExpenseTypeIds', newSelectedExpenseTypeIds);
  };

  const clearFilters = () => {
    onFilterChange({
      expenseType: 'all',
      selectedJobIds: [],
      selectedOperationIds: [],
      selectedExpenseTypeIds: [],
      fromDate: '',
      toDate: '',
      minAmount: '',
      maxAmount: '',
      status: '',
    });
  };

  const clearDateRange = () => {
    handleFilterChange('fromDate', '');
    handleFilterChange('toDate', '');
  };

  const clearAmountRange = () => {
    handleFilterChange('minAmount', '');
    handleFilterChange('maxAmount', '');
  };

  const hasActiveFilters = () => {
    return (
      filters.expenseType !== 'all' ||
      filters.selectedJobIds.length > 0 ||
      filters.selectedOperationIds.length > 0 ||
      filters.selectedExpenseTypeIds.length > 0 ||
      filters.fromDate ||
      filters.toDate ||
      filters.minAmount ||
      filters.maxAmount ||
      filters.status
    );
  };

  const getDateValue = (dateString?: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  // Filter jobs based on search
  const filteredJobs = jobs.filter(job => 
    job.id.toString().toLowerCase().includes(jobSearch.toLowerCase())
  );

  // Filter operations based on search
  const filteredOperations = operationTypes.filter(operation => 
    operation.name.toLowerCase().includes(operationSearch.toLowerCase())
  );

  // Filter expense types based on search
  const filteredExpenseTypes = expenseTypes.filter(expenseType => 
    expenseType.name.toLowerCase().includes(expenseTypeSearch.toLowerCase())
  );

  return (
    <Box sx={{ mb: 3 }}>
      {/* Filter Toggle Button */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
          size="small"
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
        
        {hasActiveFilters() && (
          <Button
            variant="outlined"
            color="error"
            onClick={clearFilters}
            size="small"
          >
            Clear All Filters
          </Button>
        )}
      </Stack>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="caption" sx={{ alignSelf: 'center', mr: 1 }}>
            Active Filters:
          </Typography>
          
          {filters.expenseType !== 'all' && (
            <Chip
              label={`Type: ${filters.expenseType === 'jobs' ? 'Jobs Only' : 'Operations Only'}`}
              size="small"
              onDelete={() => handleFilterChange('expenseType', 'all')}
            />
          )}
          
          {filters.selectedJobIds.length > 0 && (
            <Chip
              label={`Jobs: ${filters.selectedJobIds.length} selected`}
              size="small"
              onDelete={() => handleFilterChange('selectedJobIds', [])}
            />
          )}
          
          {filters.selectedOperationIds.length > 0 && (
            <Chip
              label={`Operations: ${filters.selectedOperationIds.length} selected`}
              size="small"
              onDelete={() => handleFilterChange('selectedOperationIds', [])}
            />
          )}
          
          {filters.selectedExpenseTypeIds.length > 0 && (
            <Chip
              label={`Expense Types: ${filters.selectedExpenseTypeIds.length} selected`}
              size="small"
              onDelete={() => handleFilterChange('selectedExpenseTypeIds', [])}
            />
          )}
          
          {(filters.minAmount || filters.maxAmount) && (
            <Chip
              label={`Amount: ${filters.minAmount || '0'} - ${filters.maxAmount || '∞'}`}
              size="small"
              onDelete={clearAmountRange}
            />
          )}
          
          {(filters.fromDate || filters.toDate) && (
            <Chip
              label={`Date: ${filters.fromDate || 'Any'} to ${filters.toDate || 'Any'}`}
              size="small"
              onDelete={clearDateRange}
            />
          )}
          
          {filters.status && (
            <Chip
              label={`Status: ${filters.status}`}
              size="small"
              onDelete={() => handleFilterChange('status', '')}
            />
          )}
        </Box>
      )}

      {/* Filter Panel - 2 Rows */}
      {showFilters && (
        <Card variant="outlined">
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filters
            </Typography>
            
            {/* Row 1: Basic Filters */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {/* Expense Type Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Expense Type</InputLabel>
                  <Select
                    value={filters.expenseType}
                    onChange={(e) => handleFilterChange('expenseType', e.target.value)}
                    label="Expense Type"
                  >
                    <MenuItem value="all">All Expenses</MenuItem>
                    <MenuItem value="jobs">Jobs Only</MenuItem>
                    <MenuItem value="operations">Operations Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Status Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="Status"
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="on_progress">In Progress</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="denied">Denied</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Amount Range */}
              <Grid item xs={12} sm={6} md={3}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="Min Amount"
                    type="number"
                    size="small"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    placeholder="0.00"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Max Amount"
                    type="number"
                    size="small"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    placeholder="∞"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                    sx={{ flex: 1 }}
                  />
                  {(filters.minAmount || filters.maxAmount) && (
                    <Tooltip title="Clear amount range">
                      <IconButton size="small" onClick={clearAmountRange}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Grid>

              {/* Date Range */}
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <DatePicker
                      label="From Date"
                      value={getDateValue(filters.fromDate)}
                      onChange={(date) => handleFilterChange('fromDate', date ? date.toISOString().split('T')[0] : '')}
                      slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
                    />
                    <DatePicker
                      label="To Date"
                      value={getDateValue(filters.toDate)}
                      onChange={(date) => handleFilterChange('toDate', date ? date.toISOString().split('T')[0] : '')}
                      slotProps={{ textField: { size: 'small', sx: { flex: 1 } } }}
                    />
                    {(filters.fromDate || filters.toDate) && (
                      <Tooltip title="Clear date range">
                        <IconButton size="small" onClick={clearDateRange}>
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </LocalizationProvider>
              </Grid>
            </Grid>

            {/* Row 2: Multi-Select Dropdowns */}
            <Grid container spacing={2}>
              {/* Job Selection */}
              {filters.expenseType !== 'operations' && (
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Jobs</InputLabel>
                    <Select
                      multiple
                      value={filters.selectedJobIds}
                      onChange={(e) => handleFilterChange('selectedJobIds', e.target.value)}
                      input={<OutlinedInput label="Select Jobs" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={`Job ${value}`} size="small" />
                          ))}
                        </Box>
                      )}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                          },
                        },
                      }}
                    >
                      {/* Search Input */}
                      <MenuItem sx={{ p: 0 }}>
                        <TextField
                          size="small"
                          placeholder="Search jobs..."
                          value={jobSearch}
                          onChange={(e) => setJobSearch(e.target.value)}
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ p: 1 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </MenuItem>
                      
                      {filteredJobs.map((job) => (
                        <MenuItem key={job.id} value={job.id.toString()}>
                          <Checkbox checked={filters.selectedJobIds.includes(job.id.toString())} />
                          <ListItemText primary={`Job ${job.id}`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Operation Selection */}
              {filters.expenseType !== 'jobs' && (
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Operations</InputLabel>
                    <Select
                      multiple
                      value={filters.selectedOperationIds}
                      onChange={(e) => handleFilterChange('selectedOperationIds', e.target.value)}
                      input={<OutlinedInput label="Select Operations" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => {
                            const operation = operationTypes.find(op => op.id.toString() === value);
                            return <Chip key={value} label={operation?.name || value} size="small" />;
                          })}
                        </Box>
                      )}
                      MenuProps={{
                        PaperProps: {
                          style: {
                            maxHeight: 300,
                          },
                        },
                      }}
                    >
                      {/* Search Input */}
                      <MenuItem sx={{ p: 0 }}>
                        <TextField
                          size="small"
                          placeholder="Search operations..."
                          value={operationSearch}
                          onChange={(e) => setOperationSearch(e.target.value)}
                          fullWidth
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ p: 1 }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </MenuItem>
                      
                      {filteredOperations.map((operation) => (
                        <MenuItem key={operation.id} value={operation.id.toString()}>
                          <Checkbox checked={filters.selectedOperationIds.includes(operation.id.toString())} />
                          <ListItemText primary={operation.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Expense Type Selection */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Expense Types</InputLabel>
                  <Select
                    multiple
                    value={filters.selectedExpenseTypeIds}
                    onChange={(e) => handleFilterChange('selectedExpenseTypeIds', e.target.value)}
                    input={<OutlinedInput label="Select Expense Types" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const expenseType = expenseTypes.find(et => et.id.toString() === value);
                          return <Chip key={value} label={expenseType?.name || value} size="small" />;
                        })}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {/* Search Input */}
                    <MenuItem sx={{ p: 0 }}>
                      <TextField
                        size="small"
                        placeholder="Search expense types..."
                        value={expenseTypeSearch}
                        onChange={(e) => setExpenseTypeSearch(e.target.value)}
                        fullWidth
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ p: 1 }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </MenuItem>
                    
                    {filteredExpenseTypes.map((expenseType) => (
                      <MenuItem key={expenseType.id} value={expenseType.id.toString()}>
                        <Checkbox checked={filters.selectedExpenseTypeIds.includes(expenseType.id.toString())} />
                        <ListItemText primary={expenseType.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}; 