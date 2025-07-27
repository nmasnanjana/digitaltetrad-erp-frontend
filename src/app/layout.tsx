import * as React from 'react';
import type { Viewport } from 'next';

import '@/styles/global.css';

import { UserProvider } from '@/contexts/user-context';
import { LocalizationProvider } from '@/components/core/localization-provider';
import { ThemeProvider } from '@/components/core/theme-provider/theme-provider';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { FaviconUpdater } from '@/components/core/favicon-updater';

export const viewport = { width: 'device-width', initialScale: 1 } satisfies Viewport;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <LocalizationProvider>
          <UserProvider>
            <SettingsProvider>
              <FaviconUpdater />
              <ThemeProvider>{children}</ThemeProvider>
            </SettingsProvider>
          </UserProvider>
        </LocalizationProvider>
      </body>
    </html>
  );
}
