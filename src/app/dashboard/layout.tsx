import * as React from 'react';
import type { Viewport } from 'next';

import '@/styles/global.css';

import { UserProvider } from '@/contexts/user-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { ReactQueryProvider } from '@/lib/react-query/provider';
import { FaviconUpdater } from '@/components/core/favicon-updater';
import { DashboardLayout } from '@/components/dashboard/layout/dashboard-layout';

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <LocalizationProvider>
          <ReactQueryProvider>
            <SettingsProvider>
              <UserProvider>
                <ThemeProvider>
                  <DashboardLayout>
                    {children}
                  </DashboardLayout>
                  <FaviconUpdater />
                </ThemeProvider>
              </UserProvider>
            </SettingsProvider>
          </ReactQueryProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}
