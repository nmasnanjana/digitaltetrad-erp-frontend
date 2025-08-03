'use client';

import * as React from 'react';

import type { User } from '@/types/user';
import { authClient } from '@/lib/auth/client';
import { logger } from '@/lib/logger';

export interface UserContextValue {
  user: User | null;
  error: string | null;
  isLoading: boolean;
  checkSession: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export interface UserProviderProps {
  children: React.ReactNode;
}

export function UserProvider({ children }: UserProviderProps): React.JSX.Element {
  console.log('UserProvider rendering');
  
  const [state, setState] = React.useState<{ user: User | null; error: string | null; isLoading: boolean }>({
    user: null,
    error: null,
    isLoading: true,
  });
  const [isCheckingSession, setIsCheckingSession] = React.useState<boolean>(false);

  const checkSession = React.useCallback(async (): Promise<void> => {
    if (isCheckingSession) {
      console.log('checkSession already in progress, skipping');
      return;
    }
    
    console.log('checkSession called');
    setIsCheckingSession(true);
    
    try {
      const { data, error } = await authClient.getUser();
      console.log('getUser response:', { data, error });

      if (error) {
        console.log('getUser error:', error);
        logger.error(error);
        setState((prev) => ({ ...prev, user: null, error: 'Something went wrong', isLoading: false }));
        return;
      }

      if (!data) {
        console.log('No user data');
        setState((prev) => ({ ...prev, user: null, error: null, isLoading: false }));
        return;
      }

      // Ensure role and permissions are properly loaded
      if (!data.role) {
        console.log('User role not loaded');
        logger.error('User role not loaded');
        setState((prev) => ({ ...prev, user: null, error: 'User role not loaded', isLoading: false }));
        return;
      }

      console.log('Setting user state:', data);
      setState((prev) => ({ ...prev, user: data, error: null, isLoading: false }));
    } catch (err) {
      console.log('checkSession error:', err);
      logger.error(err instanceof Error ? err.message : 'Unknown error');
      setState((prev) => ({ ...prev, user: null, error: 'Something went wrong', isLoading: false }));
    } finally {
      setIsCheckingSession(false);
    }
  }, [isCheckingSession]);

  const signOut = React.useCallback(async (): Promise<void> => {
    await authClient.signOut();
    setState((prev) => ({ ...prev, user: null, error: null, isLoading: false }));
  }, []);

  React.useEffect(() => {
    console.log('UserProvider useEffect triggered');
    
    const timeoutId = setTimeout(() => {
      console.log('UserProvider timeout - forcing loading to false');
      setState((prev) => ({ ...prev, isLoading: false }));
    }, 5000); // 5 second timeout

    checkSession().catch((err) => {
      console.log('UserProvider checkSession error:', err);
      logger.error(err instanceof Error ? err.message : 'Unknown error');
      // noop
    });

    return () => { clearTimeout(timeoutId); };
  }, []); // Empty dependency array - only run once

  console.log('UserProvider state:', state);

  return <UserContext.Provider value={{ ...state, checkSession, signOut }}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue {
  const value = React.useContext(UserContext);

  if (value === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return value;
}
