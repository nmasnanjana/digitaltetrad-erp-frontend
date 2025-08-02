'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';
import { Chart } from '@/components/core/chart';

export interface ExpenseTimeChartProps {
  data: {
    date: string;
    jobAmount: number;
    operationAmount: number;
  }[];
  sx?: SxProps;
}

export function ExpenseTimeChart({ data, sx }: ExpenseTimeChartProps): React.JSX.Element {
  const chartOptions = useChartOptions();
  const chartSeries = [
    {
      name: 'Job Expenses',
      data: data.map(item => item.jobAmount || 0)
    },
    {
      name: 'Operation Expenses',
      data: data.map(item => item.operationAmount || 0)
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

function useChartOptions(): ApexOptions {
  const theme = useTheme();

  return {
    chart: { 
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: [theme.palette.primary.main, theme.palette.success.main],
    dataLabels: { enabled: false },
    fill: { 
      opacity: 0.3,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.1,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.6,
        opacityTo: 0.2,
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
      size: 5,
      colors: [theme.palette.primary.main, theme.palette.success.main],
      strokeColors: theme.palette.background.paper,
      strokeWidth: 3,
      hover: {
        size: 8,
      }
    },
    stroke: { 
      curve: 'smooth',
      width: 6,
      colors: [theme.palette.primary.main, theme.palette.success.main]
    },
    theme: { mode: theme.palette.mode },
    tooltip: {
      shared: true,
      intersect: false,
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
      title: { text: 'Value' },
      labels: {
        formatter: (value) => value.toLocaleString(),
        style: { colors: theme.palette.text.secondary },
      },
    },
  };
} 