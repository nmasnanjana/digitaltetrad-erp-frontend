'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';
import { Chart } from '@/components/core/chart';

export interface ExpenseAmountTrendProps {
  data: {
    date: string;
    totalAmount: number;
  }[];
  sx?: SxProps;
}

export function ExpenseAmountTrend({ data, sx }: ExpenseAmountTrendProps): React.JSX.Element {
  const chartOptions = useChartOptions();
  const chartSeries = [
    {
      name: 'Total Expenses',
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

function useChartOptions(): ApexOptions {
  const theme = useTheme();

  return {
    chart: { 
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: [theme.palette.primary.main],
    dataLabels: { enabled: false },
    fill: { 
      opacity: 0.4,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.1,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.7,
        opacityTo: 0.3,
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
      size: 6,
      colors: [theme.palette.primary.main],
      strokeColors: theme.palette.background.paper,
      strokeWidth: 3,
      hover: {
        size: 9,
      }
    },
    stroke: { 
      curve: 'smooth',
      width: 6,
      colors: [theme.palette.primary.main],
      dashArray: [8, 8] // Makes dots more spaced and visible
    },
    theme: { mode: theme.palette.mode },
    tooltip: {
      shared: false,
      intersect: true,
      y: {
        formatter: (value) => `$${value.toLocaleString()}`
      }
    },
    xaxis: {
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { color: theme.palette.divider, show: true },
      categories: Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      labels: { 
        offsetY: 5, 
        style: { colors: theme.palette.text.secondary },
        rotate: -45,
        rotateAlways: false
      },
    },
    yaxis: {
      title: { text: 'Total Amount ($)' },
      labels: {
        formatter: (value) => `$${value.toLocaleString()}`,
        style: { colors: theme.palette.text.secondary },
      },
    },
  };
} 