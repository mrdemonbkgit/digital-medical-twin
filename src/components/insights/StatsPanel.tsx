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
        'rounded-lg border border-theme-primary bg-theme-primary p-4',
        className
      )}
    >
      <p className="text-sm font-medium text-theme-tertiary">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-theme-primary">{value}</p>
      {subValue && <p className="mt-0.5 text-sm text-theme-tertiary">{subValue}</p>}
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
      ? 'text-danger bg-danger-muted'
      : direction === 'down'
        ? 'text-success bg-success-muted'
        : 'text-theme-secondary bg-theme-tertiary';

  const iconColorClass =
    direction === 'up'
      ? 'text-danger'
      : direction === 'down'
        ? 'text-success'
        : 'text-theme-muted';

  return (
    <div className="rounded-lg border border-theme-primary bg-theme-primary p-4">
      <p className="text-sm font-medium text-theme-tertiary">Trend</p>
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
      <p className="mt-0.5 text-sm text-theme-tertiary">
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
