'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import { useUser } from '@/contexts/user-context';
import { paths } from '@/paths';
import { logger } from '@/lib/logger';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps): React.JSX.Element | null {
  const router = useRouter();
  const { user, error, isLoading } = useUser();
  const [isChecking, setIsChecking] = React.useState<boolean>(true);

  console.log('[AuthGuard] State:', { user: Boolean(user), error, isLoading, isChecking });

  const checkPermissions = async (): Promise<void> => {
    console.log('[AuthGuard] checkPermissions called');
    if (isLoading) {
      console.log('[AuthGuard] Still loading, returning');
      return;
    }

    if (error) {
      console.log('[AuthGuard] Error detected:', error);
      setIsChecking(false);
      return;
    }

    if (!user) {
      console.log('[AuthGuard] No user, redirecting to sign in');
      logger.debug('[AuthGuard]: User is not logged in, redirecting to sign in');
      router.replace(paths.auth.signIn);
      return;
    }

    console.log('[AuthGuard] User authenticated, showing dashboard');
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
