'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import GlobalStyles from '@mui/material/GlobalStyles';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { AuthGuard } from '@/components/auth/auth-guard';
import { MainNav } from '@/components/dashboard/layout/main-nav';
import { SideNav } from '@/components/dashboard/layout/side-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps): React.JSX.Element {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  
  return (
    <AuthGuard>
      <GlobalStyles
        styles={{
          body: {
            '--MainNav-height': '56px',
            '--MainNav-zIndex': 1000,
            '--SideNav-width': '280px',
            '--SideNav-zIndex': 1100,
            '--MobileNav-width': '320px',
            '--MobileNav-zIndex': 1100,
          },
        }}
      />
      <Box
        sx={{
          bgcolor: 'var(--mui-palette-background-default)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          minHeight: '100vh',
        }}
      >
        <SideNav />
        <Box sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column', pl: { lg: 'var(--SideNav-width)' }, minHeight: '100vh' }}>
          <MainNav />
          <main style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
            <Container 
              maxWidth="xl" 
              sx={{ 
                py: { xs: 2, sm: 3, md: 4, lg: '64px' },
                px: { xs: 1, sm: 2, md: 3 },
                pb: { xs: 4, sm: 5, md: 6 }, // Extra bottom padding to account for fixed footer
                flex: '1 1 auto'
              }}
            >
              {children}
            </Container>
          </main>
          
          {/* Bottom Bar with Copyright */}
          <Box
            sx={{
              bgcolor: theme.palette.mode === 'light' ? 'grey.100' : 'grey.900',
              borderTop: `1px solid ${theme.palette.divider}`,
              py: 1,
              px: 2,
              textAlign: 'center',
              position: 'fixed',
              bottom: 0,
              left: { lg: 'var(--SideNav-width)' },
              right: 0,
              zIndex: 1000,
            }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                fontWeight: 400,
              }}
            >
              © 2025 - {currentYear} Developed and Managed by Tetrad Digital
            </Typography>
          </Box>
        </Box>
      </Box>
    </AuthGuard>
  );
} 