import React from 'react';
import { User } from '@/types/user';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useRouter } from 'next/navigation';

interface UserViewProps {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onUpdatePassword: () => void;
  onToggleStatus: () => void;
}

export const UserView: React.FC<UserViewProps> = ({
  user,
  onEdit,
  onDelete,
  onUpdatePassword,
  onToggleStatus,
}) => {
  const [statusDialogOpen, setStatusDialogOpen] = React.useState(false);

  const handleStatusToggle = () => {
    setStatusDialogOpen(true);
  };

  const handleConfirmStatusToggle = () => {
    onToggleStatus();
    setStatusDialogOpen(false);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            User Details
          </Typography>
          <Divider />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              First Name
            </Typography>
            <Typography variant="body1">{user.firstName}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Name
            </Typography>
            <Typography variant="body1">{user.lastName || '-'}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Username
            </Typography>
            <Typography variant="body1">{user.username}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body1">{user.email || '-'}</Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Role
            </Typography>
            <Chip
              label={user.role}
              color={user.role === 'admin' ? 'primary' : 'default'}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={user.isActive ? 'Active' : 'Inactive'}
                color={user.isActive ? 'success' : 'error'}
                size="small"
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Last Login
            </Typography>
            <Typography variant="body1">
              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={onEdit}
          >
            Edit User
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={onUpdatePassword}
          >
            Update Password
          </Button>
          <Button
            variant="contained"
            color={user.isActive ? 'error' : 'success'}
            onClick={handleStatusToggle}
          >
            {user.isActive ? 'Deactivate User' : 'Activate User'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onDelete}
          >
            Delete User
          </Button>
        </Box>

        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)}>
          <DialogTitle>
            {user.isActive ? 'Deactivate User' : 'Activate User'}
          </DialogTitle>
          <DialogContent>
            Are you sure you want to {user.isActive ? 'deactivate' : 'activate'} user {user.firstName} {user.lastName || ''}?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmStatusToggle}
              color={user.isActive ? 'error' : 'success'}
              variant="contained"
            >
              {user.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
