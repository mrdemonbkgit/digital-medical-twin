import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { BiomarkerSummary } from '@/lib/insights/dataProcessing';

interface SparklineCardProps {
  biomarker: BiomarkerSummary;
}

export function SparklineCard({ biomarker }: SparklineCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/insights/${biomarker.code}`);
  };

  // Prepare chart data
  const chartData = biomarker.dataPoints.map((point) => ({
    date: point.date,
    value: point.value,
  }));

  // Determine if out of range
  const isHigh = biomarker.flag === 'high';
  const isLow = biomarker.flag === 'low';
  const isOutOfRange = isHigh || isLow;

  // Get line color based on status
  const lineColor = isOutOfRange ? '#EF4444' : '#3B82F6'; // red-500 or blue-500

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex flex-col rounded-lg border p-3 text-left transition-all hover:shadow-md',
        isOutOfRange
          ? 'border-red-200 bg-red-50 hover:border-red-300'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-gray-900">
            {biomarker.name}
          </h4>
        </div>
        {isOutOfRange && (
          <AlertTriangle
            className={cn(
              'ml-2 h-4 w-4 flex-shrink-0',
              isHigh ? 'text-red-500' : 'text-amber-500'
            )}
          />
        )}
      </div>

      {/* Sparkline */}
      <div className="mb-2 h-12">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              {/* Reference lines for range */}
              {biomarker.referenceMin !== undefined && (
                <ReferenceLine
                  y={biomarker.referenceMin}
                  stroke="#D1D5DB"
                  strokeDasharray="2 2"
                />
              )}
              {biomarker.referenceMax !== undefined && (
                <ReferenceLine
                  y={biomarker.referenceMax}
                  stroke="#D1D5DB"
                  strokeDasharray="2 2"
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={lineColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          // Single data point - show as centered dot
          <div className="flex h-full items-center justify-center">
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                isOutOfRange ? 'bg-red-500' : 'bg-blue-500'
              )}
            />
          </div>
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline justify-between">
        <span
          className={cn(
            'text-lg font-semibold',
            isOutOfRange ? 'text-red-700' : 'text-gray-900'
          )}
        >
          {biomarker.latestValue}
        </span>
        <span className="text-sm text-gray-500">{biomarker.unit}</span>
      </div>

      {/* Flag badge */}
      {isOutOfRange && (
        <div className="mt-2">
          <span
            className={cn(
              'inline-block rounded-full px-2 py-0.5 text-xs font-medium',
              isHigh
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
            )}
          >
            {isHigh ? 'HIGH' : 'LOW'}
          </span>
        </div>
      )}
    </button>
  );
}
