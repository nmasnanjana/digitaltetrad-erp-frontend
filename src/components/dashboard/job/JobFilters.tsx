import React from 'react';
import {
    Box,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Stack,
    Divider,
    Typography,
    Paper,
    IconButton,
    Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { JobFilters as JobFiltersType } from '@/api/jobApi';
import { Customer } from '@/types/customer';
import { Job } from '@/types/job';
import ClearIcon from '@mui/icons-material/Clear';

interface JobFiltersProps {
    filters: JobFiltersType;
    onFilterChange: (filters: JobFiltersType) => void;
    customers: Customer[];
}

export const JobFilters: React.FC<JobFiltersProps> = ({
    filters,
    onFilterChange,
    customers,
}) => {
    const handleDateChange = (field: keyof JobFiltersType, value: Date | null) => {
        onFilterChange({
            ...filters,
            [field]: value ? value.toISOString() : undefined,
        });
    };

    const handleSelectChange = (field: keyof JobFiltersType, value: string | number | undefined) => {
        onFilterChange({
            ...filters,
            [field]: value,
        });
    };

    const clearCreatedDates = () => {
        onFilterChange({
            ...filters,
            createdStartDate: undefined,
            createdEndDate: undefined,
        });
    };

    const clearCompletedDates = () => {
        onFilterChange({
            ...filters,
            completedStartDate: undefined,
            completedEndDate: undefined,
        });
    };

    const getDateValue = (dateString?: string): Date | null => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? null : date;
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 1, 
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <Typography variant="body2" sx={{ color: 'text.secondary', px: 1 }}>
                        Created
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <DatePicker
                                label="From"
                                value={getDateValue(filters.createdStartDate)}
                                onChange={(date) => handleDateChange('createdStartDate', date)}
                                slotProps={{ textField: { size: 'small', sx: { width: 130 } } }}
                            />
                            <DatePicker
                                label="To"
                                value={getDateValue(filters.createdEndDate)}
                                onChange={(date) => handleDateChange('createdEndDate', date)}
                                slotProps={{ textField: { size: 'small', sx: { width: 130 } } }}
                            />
                            {(filters.createdStartDate || filters.createdEndDate) && (
                                <Tooltip title="Clear dates">
                                    <IconButton 
                                        size="small" 
                                        onClick={clearCreatedDates}
                                        sx={{ ml: 1 }}
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </LocalizationProvider>
                </Paper>

                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 1, 
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    <Typography variant="body2" sx={{ color: 'text.secondary', px: 1 }}>
                        Completed
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <DatePicker
                                label="From"
                                value={getDateValue(filters.completedStartDate)}
                                onChange={(date) => handleDateChange('completedStartDate', date)}
                                slotProps={{ textField: { size: 'small', sx: { width: 130 } } }}
                            />
                            <DatePicker
                                label="To"
                                value={getDateValue(filters.completedEndDate)}
                                onChange={(date) => handleDateChange('completedEndDate', date)}
                                slotProps={{ textField: { size: 'small', sx: { width: 130 } } }}
                            />
                            {(filters.completedStartDate || filters.completedEndDate) && (
                                <Tooltip title="Clear dates">
                                    <IconButton 
                                        size="small" 
                                        onClick={clearCompletedDates}
                                        sx={{ ml: 1 }}
                                    >
                                        <ClearIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    </LocalizationProvider>
                </Paper>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={filters.status || ''}
                        label="Status"
                        onChange={(e) => handleSelectChange('status', e.target.value || undefined)}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="in progress">In Progress</MenuItem>
                        <MenuItem value="installed">Installed</MenuItem>
                        <MenuItem value="qc">QC</MenuItem>
                        <MenuItem value="pat">PAT</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                        value={filters.type || ''}
                        label="Type"
                        onChange={(e) => handleSelectChange('type', e.target.value || undefined)}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="supply and installation">Supply and Installation</MenuItem>
                        <MenuItem value="installation">Installation</MenuItem>
                        <MenuItem value="maintenance">Maintenance</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Customer</InputLabel>
                    <Select
                        value={filters.customer_id?.toString() || ''}
                        label="Customer"
                        onChange={(e) => handleSelectChange('customer_id', e.target.value ? Number(e.target.value) : undefined)}
                    >
                        <MenuItem value="">All</MenuItem>
                        {customers.map((customer) => (
                            <MenuItem key={customer.id} value={customer.id}>
                                {customer.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Stack>
        </Box>
    );
}; 