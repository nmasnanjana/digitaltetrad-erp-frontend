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
import { Edit as EditIcon, Save as SaveIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import { paths } from '@/paths';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/user-context';
import { type Permission } from '@/types/permission';
import { type Role } from '@/types/role';
import { authClient } from '@/lib/auth/client';
import { permissionApi } from '@/api/permissionApi';
import { roleApi } from '@/api/roleApi';
import { Pagination } from '@/components/dashboard/permission/Pagination';

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
    
    // Pagination state for roles
    const [rolesCurrentPage, setRolesCurrentPage] = useState(1);
    const [rolesLimit, setRolesLimit] = useState(10);
    const [rolesPagination, setRolesPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });
    
    // Pagination state for permissions
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    });

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

            loadRoles();
        }
    }, [authLoading, user, router]);

    // Load roles when pagination/search changes
    useEffect(() => {
        if (!authLoading && user) {
            loadRoles();
        }
    }, [rolesCurrentPage, rolesLimit, searchTerm]);

    // Load permissions when dialog opens or pagination/search changes
    useEffect(() => {
        if (openDialog) {
            loadPermissions(currentPage, limit, permissionSearchTerm);
        }
    }, [openDialog, currentPage, limit, permissionSearchTerm]);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const response = await roleApi.getAllRoles(rolesCurrentPage, rolesLimit, searchTerm);
            setRoles(response.roles);
            setRolesPagination(response.pagination);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error fetching roles');
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    const loadPermissions = async (page: number, itemsPerPage: number, search: string) => {
        try {
            const response = await permissionApi.getAllPermissions(page, itemsPerPage, search);
            setPermissions(response.permissions);
            setPagination(response.pagination);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error fetching permissions');
        }
    };

    const handleEditPermissions = (role: Role) => {
        setSelectedRole(role);
        setSelectedPermissions(role.permissions?.map(p => p.id) || []);
        setPermissionSearchTerm(''); // Reset search when opening dialog
        setCurrentPage(1); // Reset to first page
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
            await permissionApi.assignPermissionsToRole(selectedRole.id, selectedPermissions);
            setOpenDialog(false);
            loadRoles(); // Refresh roles to get updated permissions
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Error saving permissions');
        }
    };

    // Role pagination handlers
    const handleRolesPageChange = (newPage: number) => {
        setRolesCurrentPage(newPage);
    };

    const handleRolesLimitChange = (newLimit: number) => {
        setRolesLimit(newLimit);
        setRolesCurrentPage(1); // Reset to first page when changing limit
    };

    const handleRolesSearch = (value: string) => {
        setSearchTerm(value);
        setRolesCurrentPage(1); // Reset to first page when searching
    };

    const clearRolesSearch = () => {
        setSearchTerm('');
        setRolesCurrentPage(1);
    };

    // Permission pagination handlers
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const handleLimitChange = (newLimit: number) => {
        setLimit(newLimit);
        setCurrentPage(1); // Reset to first page when changing limit
    };

    const handlePermissionSearch = (value: string) => {
        setPermissionSearchTerm(value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const clearPermissionSearch = () => {
        setPermissionSearchTerm('');
        setCurrentPage(1);
    };

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
                                placeholder="Search roles by name or description..."
                                value={searchTerm}
                                onChange={(e) => handleRolesSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchTerm && (
                                        <InputAdornment position="end">
                                            <IconButton
                                                size="small"
                                                onClick={clearRolesSearch}
                                                edge="end"
                                            >
                                                <ClearIcon />
                                            </IconButton>
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
                                <>
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
                                                {roles.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center">
                                                            <Typography variant="body2" color="text.secondary">
                                                                No roles found
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    roles.map((role) => (
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
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    {/* Pagination for roles */}
                                    {rolesPagination.totalCount > 0 && (
                                        <Pagination
                                            currentPage={rolesPagination.currentPage}
                                            totalPages={rolesPagination.totalPages}
                                            totalCount={rolesPagination.totalCount}
                                            limit={rolesPagination.limit}
                                            hasNextPage={rolesPagination.hasNextPage}
                                            hasPrevPage={rolesPagination.hasPrevPage}
                                            onPageChange={handleRolesPageChange}
                                            onLimitChange={handleRolesLimitChange}
                                        />
                                    )}
                                </>
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
                            onChange={(e) => handlePermissionSearch(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                endAdornment: permissionSearchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton
                                            size="small"
                                            onClick={clearPermissionSearch}
                                            edge="end"
                                        >
                                            <ClearIcon />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            size="small"
                        />
                        
                        <Grid container spacing={2}>
                            {permissions.map((permission) => (
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
                        
                        {/* Pagination for permissions */}
                        {pagination.totalCount > 0 && (
                            <Pagination
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                totalCount={pagination.totalCount}
                                limit={pagination.limit}
                                hasNextPage={pagination.hasNextPage}
                                hasPrevPage={pagination.hasPrevPage}
                                onPageChange={handlePageChange}
                                onLimitChange={handleLimitChange}
                            />
                        )}
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