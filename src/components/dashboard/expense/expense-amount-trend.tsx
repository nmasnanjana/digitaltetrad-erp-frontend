'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';
import { Chart } from '@/components/core/chart';
import { useSettings } from '@/contexts/SettingsContext';

export interface ExpenseAmountTrendProps {
  data: {
    date: string;
    totalAmount: number;
  }[];
  sx?: SxProps;
}

export function ExpenseAmountTrend({ data, sx }: ExpenseAmountTrendProps): React.JSX.Element {
  const { currencySymbol } = useSettings();
  const theme = useTheme();

  const chartOptions: ApexOptions = {
    chart: { 
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: [theme.palette.error.main],
    dataLabels: { enabled: false },
    fill: { 
      opacity: 0.5,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.1,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.5,
        opacityTo: 0.5,
        stops: [0, 50, 100]
      }
    },
    grid: {
      borderColor: theme.palette.divider,
      strokeDashArray: 2,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    legend: { 
      show: false
    },
    markers: {
      size: 4,
      colors: [theme.palette.error.main],
      strokeColors: theme.palette.background.paper,
      strokeWidth: 2,
      hover: {
        size: 6,
      }
    },
    stroke: { 
      curve: 'straight',
      width: 3
    },
    theme: { mode: theme.palette.mode },
    tooltip: {
      shared: false,
      intersect: true,
      y: {
        formatter: (value) => `${currencySymbol}${value.toLocaleString()}`
      }
    },
    xaxis: {
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { color: theme.palette.divider, show: true },
      categories: data.map(item => item.date),
      labels: { 
        offsetY: 5, 
        style: { colors: theme.palette.text.secondary } 
      },
    },
    yaxis: {
      title: { text: `Total Amount (${currencySymbol})` },
      labels: {
        formatter: (value) => `${currencySymbol}${value.toLocaleString()}`,
        style: { colors: theme.palette.text.secondary },
      },
    },
  };

  const chartSeries = [
    {
      name: 'Total Amount',
      data: data.map(item => item.totalAmount)
    }
  ];

  return (
    <Card sx={sx}>
      <CardHeader title="Total Expense Amount Trend - Last 30 Days" />
      <CardContent>
        <Chart height={350} options={chartOptions} series={chartSeries} type="line" width="100%" />
      </CardContent>
    </Card>
  );
} 