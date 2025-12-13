import { useState } from 'react';
import { Search, TrendingUp, X } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');

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
            <p className="py-8 text-center text-danger">{error}</p>
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
                  <h2 className="text-lg font-semibold text-theme-primary">
                    Biomarker Trends
                  </h2>
                  <p className="mt-1 text-sm text-theme-secondary">
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
                <TrendingUp className="h-12 w-12 text-theme-muted" />
                <h3 className="mt-4 text-lg font-medium text-theme-primary">
                  No biomarker data in selected time range
                </h3>
                <p className="mt-2 text-center text-theme-tertiary">
                  Try selecting a longer time range or upload lab results to start tracking.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageWrapper>
    );
  }

  // Filter biomarkers by search query
  const searchLower = searchQuery.toLowerCase().trim();
  const filteredGroupedByCategory = Object.fromEntries(
    Object.entries(groupedByCategory).map(([category, biomarkers]) => [
      category,
      searchLower
        ? biomarkers.filter(
            (b) =>
              b.name.toLowerCase().includes(searchLower) ||
              b.code.toLowerCase().includes(searchLower)
          )
        : biomarkers,
    ])
  ) as typeof groupedByCategory;

  // Count filtered results
  const filteredCount = Object.values(filteredGroupedByCategory).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  // Get ordered categories that have data and are visible
  const categoryOrder = Object.keys(BIOMARKER_CATEGORIES) as Array<
    keyof typeof BIOMARKER_CATEGORIES
  >;
  const orderedCategories = categoryOrder.filter(
    (cat) =>
      filteredGroupedByCategory[cat]?.length > 0 && visibleCategories.includes(cat)
  );

  return (
    <PageWrapper title="Insights">
      <div className="space-y-6">
        {/* Header controls */}
        <Card>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-theme-primary">
                  Biomarker Trends
                </h2>
                <p className="mt-1 text-sm text-theme-secondary">
                  {searchQuery
                    ? `Found ${filteredCount} of ${summaries.length} biomarkers`
                    : `Tracking ${summaries.length} biomarkers from your lab results`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted" />
                  <input
                    type="text"
                    placeholder="Search biomarkers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-theme h-9 w-48 rounded-md pl-9 pr-8 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-secondary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
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
              biomarkers={filteredGroupedByCategory[category]}
            />
          ))}
        </div>

        {/* No search results */}
        {searchQuery && filteredCount === 0 && (
          <Card>
            <CardContent>
              <p className="py-8 text-center text-theme-tertiary">
                No biomarkers found matching "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        )}

        {/* No visible categories */}
        {!searchQuery && orderedCategories.length === 0 && visibleCategories.length === 0 && (
          <Card>
            <CardContent>
              <p className="py-8 text-center text-theme-tertiary">
                No categories selected. Use the category filter to show biomarkers.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}
