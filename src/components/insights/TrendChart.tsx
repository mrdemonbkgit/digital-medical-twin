import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { BiomarkerSummary } from '@/lib/insights/dataProcessing';

interface TrendChartProps {
  biomarker: BiomarkerSummary;
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  biomarker,
}: {
  active?: boolean;
  payload?: Array<{ payload: { date: string; value: number; flag?: string } }>;
  biomarker: BiomarkerSummary;
}) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  const flag = data.flag;
  const isOutOfRange = flag === 'high' || flag === 'low';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
      <p className="text-sm text-gray-500">
        {format(parseISO(data.date), 'MMM d, yyyy')}
      </p>
      <p className="text-lg font-semibold text-gray-900">
        {data.value} {biomarker.unit}
      </p>
      {isOutOfRange && (
        <span
          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            flag === 'high'
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {flag?.toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function TrendChart({ biomarker }: TrendChartProps) {
  // Prepare chart data
  const chartData = biomarker.dataPoints.map((point) => ({
    date: point.date,
    value: point.value,
    flag: point.flag,
  }));

  // Calculate Y-axis domain
  const values = chartData.map((d) => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);

  // Include reference range in domain
  let yMin = dataMin;
  let yMax = dataMax;

  if (biomarker.referenceMin !== undefined) {
    yMin = Math.min(yMin, biomarker.referenceMin);
  }
  if (biomarker.referenceMax !== undefined) {
    yMax = Math.max(yMax, biomarker.referenceMax);
  }

  // Add some padding
  const padding = (yMax - yMin) * 0.1 || 1;
  yMin = Math.floor(yMin - padding);
  yMax = Math.ceil(yMax + padding);

  // Format X-axis dates
  const formatXAxis = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr;
    }
  };

  const hasReferenceRange =
    biomarker.referenceMin !== undefined && biomarker.referenceMax !== undefined;

  return (
    <div className="h-48 sm:h-64 lg:h-80 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
          />

          <YAxis
            domain={[yMin, yMax]}
            stroke="#9CA3AF"
            fontSize={12}
            tickLine={false}
            width={50}
          />

          <Tooltip content={<CustomTooltip biomarker={biomarker} />} />

          {/* Reference range band */}
          {hasReferenceRange && (
            <ReferenceArea
              y1={biomarker.referenceMin}
              y2={biomarker.referenceMax}
              fill="#10B981"
              fillOpacity={0.1}
              stroke="#10B981"
              strokeOpacity={0.3}
              strokeDasharray="3 3"
            />
          )}

          {/* Reference lines at min/max */}
          {biomarker.referenceMin !== undefined && (
            <ReferenceLine
              y={biomarker.referenceMin}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{
                value: `Min: ${biomarker.referenceMin}`,
                position: 'right',
                fill: '#10B981',
                fontSize: 11,
              }}
            />
          )}
          {biomarker.referenceMax !== undefined && (
            <ReferenceLine
              y={biomarker.referenceMax}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{
                value: `Max: ${biomarker.referenceMax}`,
                position: 'right',
                fill: '#10B981',
                fontSize: 11,
              }}
            />
          )}

          {/* Data line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{
              fill: '#3B82F6',
              strokeWidth: 2,
              r: 4,
            }}
            activeDot={{
              fill: '#3B82F6',
              strokeWidth: 0,
              r: 6,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
