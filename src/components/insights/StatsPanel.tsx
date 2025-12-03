import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { TrendStats } from '@/lib/insights/dataProcessing';

interface StatsPanelProps {
  stats: TrendStats;
  unit: string;
}

function StatCard({
  label,
  value,
  subValue,
  className,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4',
        className
      )}
    >
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {subValue && <p className="mt-0.5 text-sm text-gray-500">{subValue}</p>}
    </div>
  );
}

function TrendCard({
  direction,
  changePercent,
}: {
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
}) {
  const Icon =
    direction === 'up'
      ? TrendingUp
      : direction === 'down'
        ? TrendingDown
        : Minus;

  const colorClass =
    direction === 'up'
      ? 'text-red-600 bg-red-50'
      : direction === 'down'
        ? 'text-green-600 bg-green-50'
        : 'text-gray-600 bg-gray-50';

  const iconColorClass =
    direction === 'up'
      ? 'text-red-500'
      : direction === 'down'
        ? 'text-green-500'
        : 'text-gray-400';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm font-medium text-gray-500">Trend</p>
      <div className="mt-1 flex items-center gap-2">
        <Icon className={cn('h-6 w-6', iconColorClass)} />
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-lg font-semibold',
            colorClass
          )}
        >
          {direction === 'stable'
            ? 'Stable'
            : `${changePercent > 0 ? '+' : ''}${changePercent}%`}
        </span>
      </div>
      <p className="mt-0.5 text-sm text-gray-500">
        {direction === 'up'
          ? 'Increasing'
          : direction === 'down'
            ? 'Decreasing'
            : 'No significant change'}
      </p>
    </div>
  );
}

export function StatsPanel({ stats, unit }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <StatCard label="Current" value={stats.current} subValue={unit} />
      <StatCard label="Average" value={stats.average} subValue={unit} />
      <StatCard label="Min" value={stats.min} subValue={unit} />
      <StatCard label="Max" value={stats.max} subValue={unit} />
      <TrendCard
        direction={stats.trendDirection}
        changePercent={stats.changePercent}
      />
    </div>
  );
}
