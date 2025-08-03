import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import type { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { ArrowDown as ArrowDownIcon } from '@phosphor-icons/react/dist/ssr/ArrowDown';
import { ArrowUp as ArrowUpIcon } from '@phosphor-icons/react/dist/ssr/ArrowUp';
import { CurrencyDollar as CurrencyDollarIcon } from '@phosphor-icons/react/dist/ssr/CurrencyDollar';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { CreditCard as CreditCardIcon } from '@phosphor-icons/react/dist/ssr/CreditCard';
import { useSettings } from '@/contexts/SettingsContext';

export interface ExpenseAmountsProps {
  title: string;
  value: number;
  trend: 'up' | 'down';
  diff: number;
  color?: 'primary' | 'error' | 'info' | 'success' | 'warning';
  sx?: SxProps<Theme>;
}

const iconMapping = {
  'Total Amount': CurrencyDollarIcon,
  'Approved Amount': CheckCircleIcon,
  'Pending Amount': ClockIcon,
  'Rejected Amount': CurrencyDollarIcon,
  'Paid Amount': CreditCardIcon,
};

const colorMapping = {
  primary: 'var(--mui-palette-primary-main)',
  success: 'var(--mui-palette-success-main)',
  warning: 'var(--mui-palette-warning-main)',
  error: 'var(--mui-palette-error-main)',
  info: 'var(--mui-palette-info-main)',
};

export function ExpenseAmounts({ title, value, trend, diff, color = 'primary', sx }: ExpenseAmountsProps) {
  const { formatCurrency } = useSettings();
  const TrendIcon = trend === 'up' ? ArrowUpIcon : ArrowDownIcon;
  const trendColor = trend === 'up' ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-error-main)';
  const IconComponent = iconMapping[title as keyof typeof iconMapping] || CurrencyDollarIcon;
  const backgroundColor = colorMapping[color];

  return (
    <Card sx={sx}>
      <CardContent>
        <Stack spacing={3}>
          <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }} spacing={3}>
            <Stack spacing={1}>
              <Typography color="text.secondary" variant="overline">
                {title}
              </Typography>
              <Typography variant="h4">{formatCurrency(value)}</Typography>
            </Stack>
            <Avatar sx={{ backgroundColor, height: '56px', width: '56px' }}>
              <IconComponent fontSize="var(--icon-fontSize-lg)" />
            </Avatar>
          </Stack>
          <Stack sx={{ alignItems: 'center' }} direction="row" spacing={2}>
            <Stack sx={{ alignItems: 'center' }} direction="row" spacing={0.5}>
              <TrendIcon color={trendColor} fontSize="var(--icon-fontSize-md)" />
              <Typography color={trendColor} variant="body2">
                {diff}%
              </Typography>
            </Stack>
            <Typography color="text.secondary" variant="caption">
              Since last month
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
} 