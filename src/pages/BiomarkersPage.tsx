import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  LoadingSpinner,
} from '@/components/common';
import { useBiomarkers } from '@/hooks/useBiomarkers';
import { BIOMARKER_CATEGORIES } from '@/types/biomarker';
import type { BiomarkerStandard, BiomarkerCategory } from '@/types';

export function BiomarkersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedBiomarker, setSelectedBiomarker] = useState<BiomarkerStandard | null>(null);

  const { biomarkers, isLoading, error, groupedByCategory } = useBiomarkers({
    searchQuery: searchQuery.length >= 2 ? searchQuery : undefined,
  });

  // Get categories in display order
  const categories = useMemo(() => {
    const categoryOrder: BiomarkerCategory[] = [
      'metabolic',
      'lipid_panel',
      'cbc',
      'liver',
      'kidney',
      'electrolyte',
      'thyroid',
      'vitamin',
      'iron',
      'inflammation',
      'hormone',
      'cardiac',
      'other',
    ];
    return categoryOrder.filter((cat) => groupedByCategory[cat]?.length > 0);
  }, [groupedByCategory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(categories));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  if (isLoading) {
    return (
      <PageWrapper title="Biomarker Reference">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner className="w-8 h-8" />
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Biomarker Reference">
        <Card>
          <CardContent>
            <p className="text-red-600 text-center py-8">{error}</p>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Biomarker Reference">
      <div className="space-y-6">
        {/* Header and Search */}
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Standardized Biomarkers
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Reference information for {biomarkers.length} biomarkers with standard
                  units and reference ranges
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="text-sm text-cyan-600 hover:text-cyan-700"
                >
                  Expand All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={collapseAll}
                  className="text-sm text-cyan-600 hover:text-cyan-700"
                >
                  Collapse All
                </button>
              </div>
            </div>

            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search biomarkers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        {categories.map((category) => {
          const categoryInfo = BIOMARKER_CATEGORIES[category];
          const items = groupedByCategory[category] || [];
          const isExpanded = expandedCategories.has(category);

          return (
            <Card key={category}>
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{categoryInfo.label}</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {categoryInfo.description} ({items.length} biomarkers)
                    </p>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <div className="divide-y divide-gray-100">
                    {items.map((biomarker) => (
                      <BiomarkerRow
                        key={biomarker.id}
                        biomarker={biomarker}
                        isSelected={selectedBiomarker?.id === biomarker.id}
                        onSelect={() =>
                          setSelectedBiomarker(
                            selectedBiomarker?.id === biomarker.id ? null : biomarker
                          )
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}

        {categories.length === 0 && searchQuery && (
          <Card>
            <CardContent>
              <p className="text-center text-gray-500 py-8">
                No biomarkers found matching "{searchQuery}"
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  );
}

interface BiomarkerRowProps {
  biomarker: BiomarkerStandard;
  isSelected: boolean;
  onSelect: () => void;
}

function BiomarkerRow({ biomarker, isSelected, onSelect }: BiomarkerRowProps) {
  const maleRange = biomarker.referenceRanges.male;
  const femaleRange = biomarker.referenceRanges.female;
  const sameRange =
    maleRange.low === femaleRange.low && maleRange.high === femaleRange.high;

  return (
    <div className="py-3">
      <div
        className="flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg"
        onClick={onSelect}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{biomarker.name}</span>
            <span className="text-xs text-gray-400 font-mono">{biomarker.code}</span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm">
            <span className="text-gray-500">
              Unit: <span className="font-mono text-gray-700">{biomarker.standardUnit}</span>
            </span>
            {sameRange ? (
              <span className="text-gray-500">
                Range: <span className="text-gray-700">{maleRange.low} - {maleRange.high}</span>
              </span>
            ) : (
              <>
                <span className="text-gray-500">
                  M: <span className="text-gray-700">{maleRange.low} - {maleRange.high}</span>
                </span>
                <span className="text-gray-500">
                  F: <span className="text-gray-700">{femaleRange.low} - {femaleRange.high}</span>
                </span>
              </>
            )}
          </div>
        </div>
        <Info className="w-4 h-4 text-gray-400" />
      </div>

      {isSelected && (
        <div className="mt-3 ml-4 pl-4 border-l-2 border-cyan-200 space-y-3">
          {biomarker.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Description
              </p>
              <p className="text-sm text-gray-700 mt-1">{biomarker.description}</p>
            </div>
          )}

          {biomarker.clinicalSignificance && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Clinical Significance
              </p>
              <p className="text-sm text-gray-700 mt-1">{biomarker.clinicalSignificance}</p>
            </div>
          )}

          {biomarker.aliases.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Also Known As
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {biomarker.aliases.map((alias) => (
                  <span
                    key={alias}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                  >
                    {alias}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(biomarker.unitConversions).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Unit Conversions
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(biomarker.unitConversions).map(([unit, factor]) => (
                  <span
                    key={unit}
                    className="text-xs text-gray-600"
                  >
                    1 {unit} = {factor} {biomarker.standardUnit}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Male Reference Range
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {maleRange.low} - {maleRange.high} {biomarker.standardUnit}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Female Reference Range
              </p>
              <p className="text-sm text-gray-700 mt-1">
                {femaleRange.low} - {femaleRange.high} {biomarker.standardUnit}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
