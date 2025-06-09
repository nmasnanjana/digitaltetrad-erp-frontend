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

// API base URL
const API_BASE_URL = 'http://localhost:4575/api';

// Return cause enum
enum ReturnCause {
    FAULTY = 'faulty',
    REMOVED = 'removed',
    SURPLUS = 'surplus'
}

interface InventoryItem {
    id: string;
    name: string;
    description?: string;
    serialNumber?: string;
    quantity: number;
    unitPrice: number;
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
            const response = await fetch(`${API_BASE_URL}/inventory`);
            if (!response.ok) {
                throw new Error('Failed to fetch inventory');
            }
            const data = await response.json();
            setInventory(data);
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
            const url = selectedItem 
                ? `${API_BASE_URL}/inventory/${selectedItem.id}`
                : `${API_BASE_URL}/inventory`;
            
            const method = selectedItem ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to save inventory item');
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
                const response = await fetch(`${API_BASE_URL}/inventory/${id}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete inventory item');
                }

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
                py: 8
            }}
        >
            <Container maxWidth="xl">
                <Stack spacing={3}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        spacing={4}
                    >
                        <Stack spacing={1}>
                            <Typography variant="h4">
                                Inventory Management
                            </Typography>
                        </Stack>
                        <Button
                            startIcon={<AddIcon />}
                            variant="contained"
                            onClick={() => handleOpen()}
                        >
                            Add Item
                        </Button>
                    </Stack>

                    {error && (
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <Card>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Description</TableCell>
                                        <TableCell>Serial Number</TableCell>
                                        <TableCell>Quantity</TableCell>
                                        <TableCell>Unit Price</TableCell>
                                        <TableCell>Return Item</TableCell>
                                        <TableCell>AR Status</TableCell>
                                        <TableCell>MRN Status</TableCell>
                                        <TableCell>Actions</TableCell>
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
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell>{item.serialNumber}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>${item.unitPrice}</TableCell>
                                                <TableCell>{item.isReturnItem ? 'Yes' : 'No'}</TableCell>
                                                <TableCell>{item.arStatus}</TableCell>
                                                <TableCell>{item.mrnStatus}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => handleOpen(item)}>
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
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Serial Number"
                                value={formData.serialNumber}
                                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Quantity"
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Unit Price"
                                type="number"
                                value={formData.unitPrice}
                                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
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
                                    onChange={(e) => setFormData({ ...formData, isReturnItem: e.target.value === 'true' })}
                                >
                                    <MenuItem value="false">No</MenuItem>
                                    <MenuItem value="true">Yes</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        {formData.isReturnItem && (
                            <Grid item xs={12} sm={6}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="return-cause-label">Return Cause</InputLabel>
                                    <Select
                                        labelId="return-cause-label"
                                        label="Return Cause"
                                        value={formData.returnCause || ''}
                                        onChange={(e) => setFormData({ ...formData, returnCause: e.target.value as ReturnCause })}
                                        required
                                    >
                                        {Object.values(ReturnCause).map((cause) => (
                                            <MenuItem key={cause} value={cause}>
                                                {cause.charAt(0).toUpperCase() + cause.slice(1)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="AR Status"
                                value={formData.arStatus}
                                onChange={(e) => setFormData({ ...formData, arStatus: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="MRN Status"
                                value={formData.mrnStatus}
                                onChange={(e) => setFormData({ ...formData, mrnStatus: e.target.value })}
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