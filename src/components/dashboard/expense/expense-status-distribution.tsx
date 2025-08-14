'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { CheckCircle as CheckCircleIcon } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { Clock as ClockIcon } from '@phosphor-icons/react/dist/ssr/Clock';
import { XCircle as XCircleIcon } from '@phosphor-icons/react/dist/ssr/XCircle';
import type { ApexOptions } from 'apexcharts';
import { Chart } from '@/components/core/chart';

const iconMapping = {
  Approved: CheckCircleIcon,
  Pending: ClockIcon,
  Rejected: XCircleIcon,
};

export interface ExpenseStatusDistributionProps {
  data: {
    status: string;
    count: number;
    percentage: number;
  }[];
  sx?: SxProps;
}

export function ExpenseStatusDistribution({ data, sx }: ExpenseStatusDistributionProps): React.JSX.Element {
  const chartOptions = useChartOptions(data.map(item => item.status));
  const chartSeries = data.map(item => item.count);

  return (
    <Card sx={sx}>
      <CardHeader title="Expense Status Distribution" />
      <CardContent>
        <Stack spacing={2}>
          <Chart height={300} options={chartOptions} series={chartSeries} type="donut" width="100%" />
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'center' }}>
            {data.map((item) => {
              const Icon = iconMapping[item.status as keyof typeof iconMapping];

              return (
                <Stack key={item.status} spacing={1} sx={{ alignItems: 'center' }}>
                  {Icon ? <Icon fontSize="var(--icon-fontSize-lg)" /> : null}
                  <Typography variant="h6">{item.status}</Typography>
                  <Typography color="text.secondary" variant="subtitle2">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function useChartOptions(labels: string[]): ApexOptions {
  const theme = useTheme();

  return {
    chart: { background: 'transparent' },
    colors: [theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main],
    dataLabels: { enabled: false },
    labels,
    legend: { show: false },
    plotOptions: { 
      pie: { 
        expandOnClick: false,
        donut: {
          size: '60%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontFamily: 'inherit',
              color: theme.palette.text.primary,
            },
            value: {
              show: true,
              fontSize: '16px',
              fontFamily: 'inherit',
              color: theme.palette.text.primary,
              formatter: (value) => value.toString(),
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              fontFamily: 'inherit',
              color: theme.palette.text.primary,
              formatter: (w) => {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                return `${total}`;
              },
            },
          },
        },
      } 
    },
    states: { active: { filter: { type: 'none' } }, hover: { filter: { type: 'none' } } },
    stroke: { width: 0 },
    theme: { mode: theme.palette.mode },
    tooltip: { fillSeriesColor: false },
  };
} 