'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import { getUserById, deleteUser, updateUserActivity } from '@/api/userApi';
import { UserView } from '@/components/dashboard/user/UserView';
import { type User } from '@/types/user';
import { Alert } from '@mui/material';

export default function ViewUserPage(): React.JSX.Element {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = React.useState<User | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const userId = params?.id as string;

  const fetchUser = async () => {
    try {
      const response = await getUserById(userId);
      setUser(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleDelete = async () => {
    if (!user) return;

    try {
      await deleteUser(user.id);
      router.push('/dashboard/user');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleEdit = () => {
    router.push(`/dashboard/user/${userId}`);
  };

  const handleUpdatePassword = () => {
    router.push(`/dashboard/user/${userId}/password`);
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    try {
      await updateUserActivity(user.id, { isActive: !user.isActive });
      await fetchUser(); // Refresh user data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    }
  };

  if (!userId) {
    return <Alert severity="error">Invalid user ID</Alert>;
  }

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!user) {
    return <Alert severity="error">User not found</Alert>;
  }

  return (
    <Stack spacing={3}>
      <Grid container spacing={3} alignItems="center" justifyContent="space-between">
        <Grid xs="auto">
          <Typography variant="h4">{user.firstName} {user.lastName}</Typography>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid xs={12}>
          <UserView
            user={user}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUpdatePassword={handleUpdatePassword}
            onToggleStatus={handleToggleStatus}
          />
        </Grid>
      </Grid>
    </Stack>
  );
}
