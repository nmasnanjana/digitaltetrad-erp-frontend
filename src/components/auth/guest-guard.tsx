'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';

import { paths } from '@/paths';
import { logger } from '@/lib/default-logger';
import { useUser } from '@/contexts/user-context';

export interface GuestGuardProps {
  children: React.ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const { user, error, isLoading } = useUser();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);

  console.log('[GuestGuard] State:', { user: !!user, error, isLoading, isChecking });

  const checkPermissions = async (): Promise<void> => {
    console.log('[GuestGuard] checkPermissions called');
    if (isLoading) {
      console.log('[GuestGuard] Still loading, returning');
      return;
    }

    if (error) {
      console.log('[GuestGuard] Error detected:', error);
      setIsChecking(false);
      return;
    }

    if (user) {
      console.log('[GuestGuard] User is logged in, redirecting to dashboard');
      logger.debug('[GuestGuard]: User is logged in, redirecting to dashboard');
      router.replace(paths.dashboard.overview);
      return;
    }

    console.log('[GuestGuard] No user, showing sign-in form');
    setIsChecking(false);
  };

  React.useEffect(() => {
    // Only run checkPermissions when loading is complete
    if (!isLoading) {
      checkPermissions().catch(() => {
        // noop
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Expected
  }, [user, error, isLoading]);

  // Show loading state while checking
  if (isLoading || isChecking) {
    return null;
  }

  if (error) {
    return <Alert color="error">{error}</Alert>;
  }

  return <React.Fragment>{children}</React.Fragment>;
}
