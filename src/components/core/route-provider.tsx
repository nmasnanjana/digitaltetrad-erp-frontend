'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { UserProvider } from '@/contexts/user-context';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ReactQueryProvider } from '@/lib/react-query/provider';
import { FaviconUpdater } from '@/components/core/favicon-updater';

interface RouteProviderProps {
  children: React.ReactNode;
}

export function RouteProvider({ children }: RouteProviderProps): React.JSX.Element {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/auth');

  // For auth routes, use minimal providers
  if (isAuthRoute) {
    return (
      <ThemeProvider>
        <UserProvider>
          {children}
        </UserProvider>
      </ThemeProvider>
    );
  }

  // For app routes, use full providers
  return (
    <ReactQueryProvider>
      <SettingsProvider>
        <UserProvider>
          <ThemeProvider>
            {children}
            <FaviconUpdater />
          </ThemeProvider>
        </UserProvider>
      </SettingsProvider>
    </ReactQueryProvider>
  );
} 