'use client';

import React from 'react';
import { Stack, Paper, Typography, Divider, IconButton, Tooltip, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Clear as ClearIcon } from '@mui/icons-material';
import { ExpenseType } from '@/types/expense';
import { Job } from '@/types/job';
import { OperationType } from '@/types/operationType';

export interface ExpenseFilters {
    createdStartDate?: string;
    createdEndDate?: string;
    expenseTypeId?: number;
    category?: 'job' | 'operation';
    jobId?: string;
    operationTypeId?: number;
    status?: string;
}

interface ExpenseFiltersProps {
    filters: ExpenseFilters;
    onFilterChange: (filters: ExpenseFilters) => void;
    expenseTypes: ExpenseType[];
    jobs: Job[];
    operationTypes: OperationType[];
}

export const ExpenseFilters: React.FC<ExpenseFiltersProps> = ({
    filters,
    onFilterChange,
    expenseTypes,
    jobs,
    operationTypes
}) => {
    const handleDateChange = (field: 'createdStartDate' | 'createdEndDate') => (date: Date | null) => {
        onFilterChange({
            ...filters,
            [field]: date ? date.toISOString() : undefined
        });
    };

    const handleSelectChange = (field: keyof ExpenseFilters) => (event: any) => {
        if (field === 'category') {
            // When changing category, clear the related selection
            onFilterChange({
                ...filters,
                category: event.target.value,
                jobId: undefined,
                operationTypeId: undefined
            });
        } else {
            onFilterChange({
                ...filters,
                [field]: event.target.value
            });
        }
    };

    const clearCreatedDates = () => {
        onFilterChange({
            ...filters,
            createdStartDate: undefined,
            createdEndDate: undefined
        });
    };

    const clearCategoryFilter = () => {
        onFilterChange({
            ...filters,
            category: undefined,
            jobId: undefined,
            operationTypeId: undefined
        });
    };

    return (
        <Box sx={{ mb: 3, position: 'relative', zIndex: 1 }}>
            <Stack 
                direction="row" 
                spacing={2} 
                alignItems="center"
                sx={{
                    flexWrap: 'nowrap',
                    overflowX: 'auto',
                    pb: 1,
                    '&::-webkit-scrollbar': {
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: '#f1f1f1',
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: '#888',
                        borderRadius: '4px',
                    },
                }}
            >
                {/* Created Date Range */}
                <Paper 
                    elevation={1}
                    sx={{ 
                        p: 1.5, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        width: 'fit-content',
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <Typography variant="subtitle2" sx={{ minWidth: 50 }}>Created</Typography>
                    <Divider orientation="vertical" flexItem />
                    <Stack direction="row" spacing={1} alignItems="center">
                        <DatePicker
                            label="From"
                            value={filters.createdStartDate ? new Date(filters.createdStartDate) : null}
                            onChange={handleDateChange('createdStartDate')}
                            slotProps={{ 
                                textField: { 
                                    size: 'small',
                                    sx: { width: 110 }
                                } 
                            }}
                        />
                        <DatePicker
                            label="To"
                            value={filters.createdEndDate ? new Date(filters.createdEndDate) : null}
                            onChange={handleDateChange('createdEndDate')}
                            slotProps={{ 
                                textField: { 
                                    size: 'small',
                                    sx: { width: 110 }
                                } 
                            }}
                        />
                        {(filters.createdStartDate || filters.createdEndDate) && (
                            <Tooltip title="Clear dates">
                                <IconButton size="small" onClick={clearCreatedDates}>
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Paper>

                {/* Expense Type */}
                <FormControl 
                    size="small" 
                    sx={{ 
                        minWidth: 200,
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <InputLabel>Expense Type</InputLabel>
                    <Select
                        value={filters.expenseTypeId?.toString() || ''}
                        label="Expense Type"
                        onChange={(e) => onFilterChange({
                            ...filters,
                            expenseTypeId: e.target.value ? Number(e.target.value) : undefined
                        })}
                        MenuProps={{
                            PaperProps: {
                                sx: { maxHeight: 300 }
                            }
                        }}
                    >
                        <MenuItem value="">All</MenuItem>
                        {expenseTypes.map((type) => (
                            <MenuItem key={type.id} value={type.id}>
                                {type.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Category */}
                <FormControl 
                    size="small" 
                    sx={{ 
                        minWidth: 150,
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <InputLabel>Category</InputLabel>
                    <Select
                        value={filters.category || ''}
                        label="Category"
                        onChange={handleSelectChange('category')}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="job">Job</MenuItem>
                        <MenuItem value="operation">Operation</MenuItem>
                    </Select>
                </FormControl>

                {/* Job/Operation Type - Only show when category is selected */}
                {filters.category && (
                    <Stack 
                        direction="row" 
                        spacing={1} 
                        alignItems="center"
                        sx={{ 
                            flexShrink: 0,
                            position: 'relative',
                            zIndex: 2
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ minWidth: 50 }}>
                            {filters.category === 'operation' ? 'Operation' : 'Job'}
                        </Typography>
                        <Divider orientation="vertical" flexItem />
                        {filters.category === 'operation' ? (
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Operation Type</InputLabel>
                                <Select
                                    value={filters.operationTypeId?.toString() || ''}
                                    label="Operation Type"
                                    onChange={(e) => onFilterChange({
                                        ...filters,
                                        operationTypeId: e.target.value ? Number(e.target.value) : undefined
                                    })}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: { maxHeight: 300 }
                                        }
                                    }}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {operationTypes.map((type) => (
                                        <MenuItem key={type.id} value={type.id}>
                                            {type.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Job</InputLabel>
                                <Select
                                    value={filters.jobId || ''}
                                    label="Job"
                                    onChange={handleSelectChange('jobId')}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: { maxHeight: 300 }
                                        }
                                    }}
                                >
                                    <MenuItem value="">All</MenuItem>
                                    {jobs.map((job) => (
                                        <MenuItem key={job.id} value={job.id}>
                                            {job.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        {(filters.jobId || filters.operationTypeId) && (
                            <Tooltip title="Clear selection">
                                <IconButton size="small" onClick={clearCategoryFilter}>
                                    <ClearIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                )}

                {/* Status */}
                <FormControl 
                    size="small" 
                    sx={{ 
                        minWidth: 150,
                        flexShrink: 0,
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={filters.status || ''}
                        label="Status"
                        onChange={handleSelectChange('status')}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="on_progress">On Progress</MenuItem>
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="denied">Denied</MenuItem>
                    </Select>
                </FormControl>
            </Stack>
        </Box>
    );
}; 