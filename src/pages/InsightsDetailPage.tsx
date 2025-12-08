import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardContent, LoadingSpinner } from '@/components/common';
import { useBiomarkerDetail } from '@/hooks/useBiomarkerDetail';
import { useInsightsTimeRange } from '@/hooks/useInsightsTimeRange';
import { TimeRangeFilter, TrendChart, StatsPanel } from '@/components/insights';
import { BIOMARKER_CATEGORIES } from '@/types/biomarker';
import { ROUTES } from '@/routes/routes';

export function InsightsDetailPage() {
  const { code } = useParams<{ code: string }>();
  const [timeRange, setTimeRange] = useInsightsTimeRange();

  const { timeSeries, stats, standard, isLoading, error } = useBiomarkerDetail(
    code || null,
    timeRange
  );

  if (isLoading) {
    return (
      <PageWrapper title="Biomarker Details">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Biomarker Details">
        <Card>
          <CardContent>
            <p className="py-8 text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  // No data for this biomarker in selected time range
  if (!timeSeries) {
    return (
      <PageWrapper title="Biomarker Details">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
          <Link
            to={ROUTES.INSIGHTS}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Insights
          </Link>
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-lg font-medium text-gray-900">
                No data found in selected time range
              </p>
              <p className="mt-2 text-gray-500">
                Try selecting a longer time range to see historical data.
              </p>
            </div>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  const isHigh = timeSeries.flag === 'high';
  const isLow = timeSeries.flag === 'low';
  const isOutOfRange = isHigh || isLow;
  const categoryInfo = BIOMARKER_CATEGORIES[timeSeries.category];

  return (
    <PageWrapper title={timeSeries.name}>
      <div className="space-y-6">
        {/* Back link and header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              to={ROUTES.INSIGHTS}
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Insights
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {timeSeries.name}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {categoryInfo?.label || timeSeries.category}
            </p>
          </div>
          <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
        </div>

        {/* Flag alert */}
        {isOutOfRange && (
          <div
            className={`flex items-center gap-2 rounded-lg px-4 py-3 ${
              isHigh
                ? 'bg-red-50 text-red-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              Latest value is {isHigh ? 'above' : 'below'} the reference range
            </span>
          </div>
        )}

        {/* Chart */}
        <Card>
          <CardContent>
            <TrendChart biomarker={timeSeries} />
          </CardContent>
        </Card>

        {/* Stats */}
        {stats && <StatsPanel stats={stats} unit={timeSeries.unit} />}

        {/* Reference info */}
        <Card>
          <CardContent>
            <h3 className="font-medium text-gray-900">Reference Information</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Reference Range</p>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {timeSeries.referenceMin !== undefined &&
                  timeSeries.referenceMax !== undefined
                    ? `${timeSeries.referenceMin} - ${timeSeries.referenceMax} ${timeSeries.unit}`
                    : 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data Points</p>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {timeSeries.dataPoints.length} measurement
                  {timeSeries.dataPoints.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Clinical significance from standard */}
            {standard?.clinicalSignificance && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-500">
                  Clinical Significance
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  {standard.clinicalSignificance}
                </p>
              </div>
            )}

            {standard?.description && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-500">Description</p>
                <p className="mt-2 text-sm text-gray-700">
                  {standard.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
