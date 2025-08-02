'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';
import { Chart } from '@/components/core/chart';

export interface ExpenseTrendsProps {
  data: {
    period: string;
    jobAmount: number;
    operationAmount: number;
  }[];
  sx?: SxProps;
}

export function ExpenseTrends({ data, sx }: ExpenseTrendsProps): React.JSX.Element {
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
      <CardHeader title="Weekly Expense Trends" />
      <CardContent>
        <Chart height={350} options={chartOptions} series={chartSeries} type="area" width="100%" />
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
      opacity: 1,
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.1,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.8,
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
        formatter: (value) => `$${value.toLocaleString()}`
      }
    },
    xaxis: {
      axisBorder: { color: theme.palette.divider, show: true },
      axisTicks: { color: theme.palette.divider, show: true },
      categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      labels: { 
        offsetY: 5, 
        style: { colors: theme.palette.text.secondary } 
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