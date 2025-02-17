import { ReactNode } from 'react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  Tooltip,
  Pie as RechartsPie,
  PieChart as RechartsPieChart,
} from 'recharts';

interface ChartContainerProps {
  children: ReactNode;
  config?: {
    width?: number | string;
    height?: number | string;
    minWidth?: number;
    minHeight?: number;
    aspect?: number;
  };
}

export function ChartContainer({ children, config }: ChartContainerProps) {
  return (
    <ResponsiveContainer width="100%" height={config?.height || 400}>
      {children as React.ReactElement}
    </ResponsiveContainer>
  );
}

export const LineChart = RechartsLineChart;
export const Line = RechartsLine;
export const ChartTooltip = Tooltip;
export const PieChart = RechartsPieChart;
export const Pie = RechartsPie;