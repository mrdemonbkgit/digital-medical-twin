import { TrendingUp } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardContent, LoadingSpinner } from '@/components/common';
import { useBiomarkerTrends } from '@/hooks/useBiomarkerTrends';
import { useInsightsTimeRange } from '@/hooks/useInsightsTimeRange';
import {
  FlagsBanner,
  TimeRangeFilter,
  CategoryFilter,
  CategorySection,
  useVisibleCategories,
} from '@/components/insights';
import { BIOMARKER_CATEGORIES } from '@/types/biomarker';

export function InsightsPage() {
  const [timeRange, setTimeRange] = useInsightsTimeRange();

  const {
    summaries,
    groupedByCategory,
    flagCounts,
    categoriesWithData,
    isLoading,
    error,
  } = useBiomarkerTrends(timeRange);

  const [visibleCategories, setVisibleCategories] =
    useVisibleCategories(categoriesWithData);

  if (isLoading) {
    return (
      <PageWrapper title="Insights">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Insights">
        <Card>
          <CardContent>
            <p className="py-8 text-center text-red-600">{error}</p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  // No data empty state
  if (summaries.length === 0) {
    return (
      <PageWrapper title="Insights">
        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Biomarker Trends
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    No data in selected time range
                  </p>
                </div>
                <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-16">
                <TrendingUp className="h-12 w-12 text-gray-300" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No biomarker data in selected time range
                </h3>
                <p className="mt-2 text-center text-gray-500">
                  Try selecting a longer time range or upload lab results to start tracking.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  // Get ordered categories that have data and are visible
  const categoryOrder = Object.keys(BIOMARKER_CATEGORIES) as Array<
    keyof typeof BIOMARKER_CATEGORIES
  >;
  const orderedCategories = categoryOrder.filter(
    (cat) =>
      groupedByCategory[cat]?.length > 0 && visibleCategories.includes(cat)
  );

  return (
    <PageWrapper title="Insights">
      <div className="space-y-6">
        {/* Header controls */}
        <Card>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Biomarker Trends
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Tracking {summaries.length} biomarkers from your lab results
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <CategoryFilter
                  availableCategories={categoriesWithData}
                  visibleCategories={visibleCategories}
                  onChange={setVisibleCategories}
                />
                <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flags banner */}
        <FlagsBanner flagCounts={flagCounts} />

        {/* Category sections */}
        <div className="space-y-4">
          {orderedCategories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              biomarkers={groupedByCategory[category]}
            />
          ))}
        </div>

        {/* No visible categories */}
        {orderedCategories.length === 0 && visibleCategories.length === 0 && (
          <Card>
            <CardContent>
              <p className="py-8 text-center text-gray-500">
                No categories selected. Use the category filter to show biomarkers.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
