'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';
import { NoSsr } from '@/components/core/no-ssr';
import { getPublicSettings, type PublicSettings } from '@/api/publicApi';

const HEIGHT = 60;
const WIDTH = 60;

type Color = 'dark' | 'light';

export interface SystemLogoProps {
  color?: Color;
  emblem?: boolean;
  height?: number;
  width?: number;
}

// Placeholder logo component
function PlaceholderLogo({ height, width, companyName }: { height: number; width: number; companyName?: string }) {
  return (
    <Box
      sx={{
        height,
        width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'primary.main',
        borderRadius: 1,
        color: 'primary.contrastText',
        fontWeight: 'bold',
        fontSize: Math.max(10, Math.min(16, height * 0.3)),
        textAlign: 'center',
        padding: 1,
        boxSizing: 'border-box',
      }}
    >
      {companyName ? (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            fontSize: 'inherit',
            lineHeight: 1.2,
            wordBreak: 'break-word',
          }}
        >
          {companyName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3)}
        </Typography>
      ) : (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            fontSize: 'inherit',
          }}
        >
          ERP
        </Typography>
      )}
    </Box>
  );
}

export function SystemLogo({ color = 'dark', emblem, height = HEIGHT, width = WIDTH }: SystemLogoProps): React.JSX.Element {
  const [settings, setSettings] = React.useState<PublicSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        console.log('Fetching public settings...');
        const response = await getPublicSettings();
        console.log('Public settings response:', response.data);
        setSettings(response.data);
        setError(false);
      } catch (err) {
        console.error('Failed to fetch public settings:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Show placeholder while loading or on error
  if (loading) {
    return <PlaceholderLogo height={height} width={width} companyName="Loading..." />;
  }

  // Show the uploaded logo if available
  if (settings?.company_logo && settings.company_logo.trim() !== '') {
    console.log('Displaying uploaded logo:', settings.company_logo.substring(0, 50) + '...');
    return (
      <Box 
        component="img" 
        alt="Company Logo" 
        height={height} 
        width={width} 
        src={settings.company_logo}
        sx={{
          objectFit: 'contain',
          maxHeight: height,
          maxWidth: width,
        }}
      />
    );
  }

  // Show placeholder with company name or default ERP
  console.log('No logo available, showing placeholder with company name:', settings?.company_name);
  return <PlaceholderLogo height={height} width={width} companyName={settings?.company_name} />;
}

export interface DynamicSystemLogoProps {
  colorDark?: Color;
  colorLight?: Color;
  emblem?: boolean;
  height?: number;
  width?: number;
}

export function DynamicSystemLogo({
  colorDark = 'light',
  colorLight = 'dark',
  height = HEIGHT,
  width = WIDTH,
  ...props
}: DynamicSystemLogoProps): React.JSX.Element {
  const { colorScheme } = useColorScheme();
  const color = colorScheme === 'dark' ? colorDark : colorLight;

  return (
    <NoSsr fallback={<Box sx={{ height: `${height}px`, width: `${width}px` }} />}>
      <SystemLogo color={color} height={height} width={width} {...props} />
    </NoSsr>
  );
} 