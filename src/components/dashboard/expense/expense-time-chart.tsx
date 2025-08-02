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

export interface ExpenseTimeChartProps {
  data: {
    date: string;
    jobAmount: number;
    operationAmount: number;
  }[];
  sx?: SxProps;
}

export function ExpenseTimeChart({ data, sx }: ExpenseTimeChartProps): React.JSX.Element {
  const { currencySymbol } = useSettings();
  const theme = useTheme();

  const chartOptions: ApexOptions = {
    chart: { 
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: [theme.palette.primary.main, theme.palette.success.main],
    dataLabels: { enabled: false },
    fill: { 
      opacity: 1,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.1,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 0.4,
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
      show: true,
      position: 'top',
      horizontalAlign: 'right'
    },
    markers: {
      size: 4,
      colors: [theme.palette.primary.main, theme.palette.success.main],
      strokeColors: theme.palette.background.paper,
      strokeWidth: 2,
      hover: {
        size: 6,
      }
    },
    stroke: { 
      curve: 'smooth',
      width: 3
    },
    theme: { mode: theme.palette.mode },
    tooltip: {
      shared: true,
      intersect: false,
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
      title: { text: `Amount (${currencySymbol})` },
      labels: {
        formatter: (value) => `${currencySymbol}${value.toLocaleString()}`,
        style: { colors: theme.palette.text.secondary },
      },
    },
  };

  const chartSeries = [
    {
      name: 'Job Expenses',
      data: data.map(item => item.jobAmount)
    },
    {
      name: 'Operation Expenses',
      data: data.map(item => item.operationAmount)
    }
  ];

  return (
    <Card sx={sx}>
      <CardHeader title="Expense Trends - Last 30 Days" />
      <CardContent>
        <Chart height={350} options={chartOptions} series={chartSeries} type="line" width="100%" />
      </CardContent>
    </Card>
  );
} 