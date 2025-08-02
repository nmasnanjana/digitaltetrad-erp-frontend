'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';
import { Chart } from '@/components/core/chart';

export interface ExpenseTypeBreakdownProps {
  data: {
    type: string;
    amount: number;
  }[];
  sx?: SxProps;
}

export function ExpenseTypeBreakdown({ data, sx }: ExpenseTypeBreakdownProps): React.JSX.Element {
  const chartOptions = useChartOptions(data.map(item => item.type));
  const chartSeries = [
    {
      name: 'Amount',
      data: data.map(item => item.amount)
    }
  ];

  return (
    <Card sx={sx}>
      <CardHeader title="Expense Type Breakdown" />
      <CardContent>
        <Chart height={350} options={chartOptions} series={chartSeries} type="bar" width="100%" />
      </CardContent>
    </Card>
  );
}

function useChartOptions(categories: string[]): ApexOptions {
  const theme = useTheme();

  return {
    chart: { 
      background: 'transparent', 
      stacked: false, 
      toolbar: { show: false } 
    },
    colors: [theme.palette.primary.main, theme.palette.success.main],
    dataLabels: { enabled: false },
    fill: { opacity: 1, type: 'solid' },
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
    plotOptions: { 
      bar: { 
        columnWidth: '40px',
        borderRadius: 4,
        horizontal: false,
      } 
    },
    stroke: { 
      colors: ['transparent'], 
      show: true, 
      width: 2 
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
      categories,
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