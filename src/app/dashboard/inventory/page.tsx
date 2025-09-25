'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Container,
    Stack,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Alert,
    Grid,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { getAllInventory, createInventory, updateInventory, deleteInventory } from '@/api/inventory-api';
import { type Inventory, type ReturnCause } from '@/types/inventory';

// Return cause values for the select dropdown
const RETURN_CAUSE_VALUES: ReturnCause[] = ['faulty', 'removed', 'surplus'];

interface InventoryItem extends Inventory {
    serialNumber?: string;
    isReturnItem: boolean;
    returnCause?: ReturnCause;
    arStatus: string;
    mrnStatus: string;
    isReturnedToWarehouse: boolean;
    jobId?: string;
}

export default function InventoryPage() {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [open, setOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<Partial<InventoryItem>>({
        name: '',
        description: '',
        serialNumber: '',
        quantity: 1,
        unitPrice: 0,
        isReturnItem: false,
        returnCause: undefined,
        arStatus: '',
        mrnStatus: '',
        jobId: ''
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await getAllInventory();
            setInventory(response.data);
            setError(null);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (item?: InventoryItem) => {
        if (item) {
            setSelectedItem(item);
            setFormData(item);
        } else {
            setSelectedItem(null);
            setFormData({
                name: '',
                description: '',
                serialNumber: '',
                quantity: 1,
                unitPrice: 0,
                isReturnItem: false,
                returnCause: undefined,
                arStatus: '',
                mrnStatus: '',
                jobId: ''
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedItem(null);
    };

    const handleSubmit = async () => {
        try {
            if (selectedItem) {
                await updateInventory(selectedItem.id, formData);
            } else {
                await createInventory(formData);
            }
            await fetchInventory();
            handleClose();
            setError(null);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to save inventory item');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteInventory(id);
                await fetchInventory();
                setError(null);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Failed to delete inventory item');
            }
        }
    };

    return (
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                py: { xs: 2, sm: 4, md: 6, lg: 8 }
            }}
        >
            <Container maxWidth="xl">
                <Stack spacing={3}>
                    <Stack
                        direction="column"
                        justifyContent="space-between"
                        spacing={{ xs: 2, sm: 4 }}
                        sx={{
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'stretch', sm: 'center' }
                        }}
                    >
                        <Stack spacing={1}>
                            <Typography variant="h4">
                                Inventory Management
                            </Typography>
                        </Stack>
                        <Button
                            startIcon={<AddIcon />}
                            variant="contained"
                            onClick={() => { handleOpen(); }}
                            sx={{ 
                                width: { xs: '100%', sm: 'auto' },
                                order: { xs: -1, sm: 0 }
                            }}
                        >
                            Add Item
                        </Button>
                    </Stack>

                    {error ? <Alert severity="error" onClose={() => { setError(null); }}>
                            {error}
                        </Alert> : null}

                    <Card>
                        <TableContainer component={Paper} sx={{ 
                            overflowX: 'auto',
                            '& .MuiTable-root': {
                                minWidth: { xs: 600, sm: 800, md: 1000 }
                            }
                        }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}>Name</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 120, sm: 150 }, display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 100, sm: 120 }, display: { xs: 'none', lg: 'table-cell' } }}>Serial Number</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Quantity</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 80, sm: 100 } }}>Unit Price</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 80, sm: 100 }, display: { xs: 'none', md: 'table-cell' } }}>Return Item</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 80, sm: 100 }, display: { xs: 'none', lg: 'table-cell' } }}>AR Status</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 80, sm: 100 }, display: { xs: 'none', lg: 'table-cell' } }}>MRN Status</TableCell>
                                        <TableCell sx={{ minWidth: { xs: 100, sm: 120 } }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                <Typography color="text.secondary">
                                                    Loading inventory...
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : inventory.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} align="center">
                                                <Typography color="text.secondary">
                                                    No inventory items found
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        inventory.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.name}</TableCell>
                                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                  {item.description}
                                                </TableCell>
                                                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                  {item.serialNumber}
                                                </TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>${item.unitPrice}</TableCell>
                                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                  {item.isReturnItem ? 'Yes' : 'No'}
                                                </TableCell>
                                                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                  {item.arStatus}
                                                </TableCell>
                                                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                                                  {item.mrnStatus}
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => { handleOpen(item); }}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton onClick={() => handleDelete(item.id)}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Stack>
            </Container>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Name"
                                value={formData.name}
                                onChange={(e) => { setFormData({ ...formData, name: e.target.value }); }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) => { setFormData({ ...formData, description: e.target.value }); }}
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Serial Number"
                                value={formData.serialNumber}
                                onChange={(e) => { setFormData({ ...formData, serialNumber: e.target.value }); }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => { setFormData({ ...formData, quantity: Number(e.target.value) }); }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Unit Price"
                                type="number"
                                value={formData.unitPrice}
                                onChange={(e) => { setFormData({ ...formData, unitPrice: Number(e.target.value) }); }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel id="return-item-label">Return Item</InputLabel>
                                <Select
                                    labelId="return-item-label"
                                    label="Return Item"
                                    value={formData.isReturnItem ? 'true' : 'false'}
                                    onChange={(e) => { setFormData({ ...formData, isReturnItem: e.target.value === 'true' }); }}
                                >
                                    <MenuItem value="false">No</MenuItem>
                                    <MenuItem value="true">Yes</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {formData.isReturnItem ? <Grid item xs={12} sm={6}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="return-cause-label">Return Cause</InputLabel>
                                    <Select
                                        labelId="return-cause-label"
                                        label="Return Cause"
                                        value={formData.returnCause || ''}
                                        onChange={(e) => { setFormData({ ...formData, returnCause: e.target.value as ReturnCause }); }}
                                        required
                                    >
                                        {RETURN_CAUSE_VALUES.map((cause) => (
                                            <MenuItem key={cause} value={cause}>
                                                {cause.charAt(0).toUpperCase() + cause.slice(1)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid> : null}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="AR Status"
                                value={formData.arStatus}
                                onChange={(e) => { setFormData({ ...formData, arStatus: e.target.value }); }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="MRN Status"
                                value={formData.mrnStatus}
                                onChange={(e) => { setFormData({ ...formData, mrnStatus: e.target.value }); }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedItem ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 