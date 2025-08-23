'use client';

import { useState, useEffect } from 'react';
import {
    Box,
    Card,
    Container,
    Stack,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    FormControlLabel,
    Checkbox,
    Grid,
    CircularProgress,
    Alert,
    Divider,
    Tooltip,
    TextField,
    InputAdornment,
} from '@mui/material';
import { Edit as EditIcon, Save as SaveIcon, Search as SearchIcon } from '@mui/icons-material';
import { paths } from '@/paths';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { type Permission } from '@/types/permission';
import { type Role } from '@/types/role';
import { authClient } from '@/lib/auth/client';

export default function PermissionPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, error: authError } = useUser();
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [permissionSearchTerm, setPermissionSearchTerm] = useState('');

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push(paths.auth.signIn);
                return;
            }

            const hasPermission = user.role?.name === 'developer' || user.role?.permissions?.some(
                p => p.module === 'permission' && (p.action === 'read' || p.action === 'assignpermissionstorole') && p.isActive
            );

            if (!hasPermission) {
                console.log('User role:', user.role);
                console.log('User permissions:', user.role?.permissions);
                router.push(paths.dashboard.overview);
                return;
            }

            fetchRoles();
            fetchPermissions();
        }
    }, [authLoading, user, router]);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await authClient.getAllRoles();
            if (response.error) {
                throw new Error(response.error);
            }
            if (response.data) {
                setRoles(response.data);
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error fetching roles');
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4575/api';
            const response = await fetch(`${baseURL}/permissions`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
                },
                credentials: 'include',
            });
            if (!response.ok) throw new Error('Failed to fetch permissions');
            const data = await response.json();
            setPermissions(data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error fetching permissions');
        }
    };

    const handleEditPermissions = (role: Role) => {
        setSelectedRole(role);
        setSelectedPermissions(role.permissions?.map(p => p.id) || []);
        setPermissionSearchTerm(''); // Reset search when opening dialog
        setOpenDialog(true);
    };

    const handlePermissionChange = (permissionId: string) => {
        setSelectedPermissions(prev => 
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;

        try {
            const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4575/api';
            const response = await fetch(`${baseURL}/permissions/roles/${selectedRole.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
                },
                credentials: 'include',
                body: JSON.stringify({ permissionIds: selectedPermissions }),
            });

            if (!response.ok) throw new Error('Failed to save permissions');

            setOpenDialog(false);
            fetchRoles(); // Refresh roles to get updated permissions
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error saving permissions');
        }
    };

    const filteredRoles = roles.filter(role => 
        role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPermissions = permissions.filter(permission => 
        permission.module.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
        permission.action.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
        permission.description?.toLowerCase().includes(permissionSearchTerm.toLowerCase())
    );

    if (authLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    if (authError) {
        return (
            <Box p={3}>
                <Alert severity="error">{authError}</Alert>
            </Box>
        );
    }

    return (
        <Box
            component="main"
            sx={{
                flexGrow: 1,
                py: { xs: 2, sm: 4, md: 6, lg: 8 },
                backgroundColor: 'background.default'
            }}
        >
            <Container maxWidth="xl">
                <Stack spacing={3}>
                    <Stack
                        direction="column"
                        justifyContent="space-between"
                        alignItems="stretch"
                        spacing={{ xs: 2, sm: 4 }}
                        sx={{
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'stretch', sm: 'center' }
                        }}
                    >
                        <Stack spacing={1}>
                            <Typography variant="h4" color="text.primary">
                                Permission Management
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Manage role permissions and access controls
                            </Typography>
                        </Stack>
                    </Stack>

                    {error ? <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert> : null}

                    <Card sx={{ p: { xs: 1, sm: 2 } }}>
                        <Stack spacing={2}>
                            <TextField
                                fullWidth
                                placeholder="Search roles..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 2 }}
                            />

                            {loading ? (
                                <Box display="flex" justifyContent="center" p={3}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <TableContainer component={Paper} elevation={0} sx={{ 
                                    overflowX: 'auto',
                                    '& .MuiTable-root': {
                                        minWidth: { xs: 400, sm: 600, md: 800 }
                                    }
                                }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold', minWidth: { xs: 100, sm: 120 } }}>Role</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', minWidth: { xs: 120, sm: 150 }, display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', minWidth: { xs: 150, sm: 200 } }}>Permissions</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: { xs: 80, sm: 100 } }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredRoles.map((role) => (
                                                <TableRow 
                                                    key={role.id}
                                                    hover
                                                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                                >
                                                    <TableCell>
                                                        <Typography variant="subtitle1" color="text.primary">
                                                            {role.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {role.description || 'No description'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                            {role.permissions?.map((permission) => (
                                                                <Chip
                                                                    key={permission.id}
                                                                    label={`${permission.module}.${permission.action}`}
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                    sx={{ m: 0.5 }}
                                                                />
                                                            ))}
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Edit Permissions">
                                                            <IconButton
                                                                onClick={() => { handleEditPermissions(role); }}
                                                                color="primary"
                                                                size="small"
                                                            >
                                                                <EditIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Stack>
                    </Card>
                </Stack>
            </Container>

            <Dialog
                open={openDialog}
                onClose={() => { setOpenDialog(false); }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        boxShadow: 3
                    }
                }}
            >
                <DialogTitle>
                    <Typography variant="h6">
                        Edit Permissions - {selectedRole?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Select the permissions to assign to this role
                    </Typography>
                </DialogTitle>
                <Divider />
                <DialogContent>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            placeholder="Search permissions by module, action, or description..."
                            value={permissionSearchTerm}
                            onChange={(e) => { setPermissionSearchTerm(e.target.value); }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                        
                                                <Grid container spacing={2}>
                            {filteredPermissions.map((permission) => (
                                <Grid item xs={12} sm={6} md={4} key={permission.id}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={selectedPermissions.includes(permission.id)}
                                                onChange={() => { handlePermissionChange(permission.id); }}
                                                color="primary"
                                            />
                                        }
                                        label={
                                            <Stack spacing={0.5}>
                                                <Typography variant="body2">
                                                    {`${permission.module}.${permission.action}`}
                                                </Typography>
                                                {permission.description ? <Typography variant="caption" color="text.secondary">
                                                        {permission.description}
                                                    </Typography> : null}
                                            </Stack>
                                        }
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions sx={{ p: 2 }}>
                    <Button 
                        onClick={() => { setOpenDialog(false); }}
                        variant="outlined"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSavePermissions}
                        variant="contained"
                        startIcon={<SaveIcon />}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
} 