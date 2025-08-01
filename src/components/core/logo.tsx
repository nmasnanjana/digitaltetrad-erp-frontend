'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useColorScheme } from '@mui/material/styles';

import { NoSsr } from '@/components/core/no-ssr';

const HEIGHT = 60;
const WIDTH = 60;

type Color = 'dark' | 'light';

export interface LogoProps {
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

export function Logo({ color = 'dark', emblem, height = HEIGHT, width = WIDTH }: LogoProps): React.JSX.Element {
  // Temporarily use default logo without settings
  let url: string;

  if (emblem) {
    url = color === 'light' ? '/assets/logo-emblem.svg' : '/assets/logo-emblem--dark.svg';
  } else {
    url = color === 'light' ? '/assets/logo.svg' : '/assets/logo--dark.svg';
  }

  return <Box alt="logo" component="img" height={height} src={url} width={width} />;
}

export interface DynamicLogoProps {
  colorDark?: Color;
  colorLight?: Color;
  emblem?: boolean;
  height?: number;
  width?: number;
}

export function DynamicLogo({
  colorDark = 'light',
  colorLight = 'dark',
  height = HEIGHT,
  width = WIDTH,
  ...props
}: DynamicLogoProps): React.JSX.Element {
  const { colorScheme } = useColorScheme();
  const color = colorScheme === 'dark' ? colorDark : colorLight;

  return (
    <NoSsr fallback={<Box sx={{ height: `${height}px`, width: `${width}px` }} />}>
      <Logo color={color} height={height} width={width} {...props} />
    </NoSsr>
  );
}
