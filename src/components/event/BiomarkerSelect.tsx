import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { BiomarkerStandard, BiomarkerCategory } from '@/types';
import { BIOMARKER_CATEGORIES } from '@/types/biomarker';

interface BiomarkerSelectProps {
  biomarkers: BiomarkerStandard[];
  value: string | null; // standardCode
  onChange: (standard: BiomarkerStandard | null) => void;
  disabled?: boolean;
  error?: string;
  excludeCodes?: string[]; // Codes already selected (to prevent duplicates)
}

export function BiomarkerSelect({
  biomarkers,
  value,
  onChange,
  disabled = false,
  error,
  excludeCodes = [],
}: BiomarkerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the selected biomarker
  const selectedBiomarker = useMemo(
    () => biomarkers.find((b) => b.code === value) || null,
    [biomarkers, value]
  );

  // Filter biomarkers based on search and exclusions
  const filteredBiomarkers = useMemo(() => {
    const available = biomarkers.filter((b) => !excludeCodes.includes(b.code));

    if (!searchQuery.trim()) return available;

    const query = searchQuery.toLowerCase();
    return available.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.code.toLowerCase().includes(query) ||
        b.aliases.some((alias) => alias.toLowerCase().includes(query))
    );
  }, [biomarkers, searchQuery, excludeCodes]);

  // Group filtered biomarkers by category
  const groupedBiomarkers = useMemo(() => {
    const grouped: Partial<Record<BiomarkerCategory, BiomarkerStandard[]>> = {};

    for (const biomarker of filteredBiomarkers) {
      if (!grouped[biomarker.category]) {
        grouped[biomarker.category] = [];
      }
      grouped[biomarker.category]!.push(biomarker);
    }

    return grouped;
  }, [filteredBiomarkers]);

  // Category order for display
  const categoryOrder: BiomarkerCategory[] = [
    'metabolic',
    'lipid_panel',
    'cbc',
    'hematology',
    'liver',
    'kidney',
    'pancreatic',
    'electrolyte',
    'mineral',
    'thyroid',
    'hormone',
    'vitamin',
    'nutrition',
    'iron',
    'inflammation',
    'autoimmune',
    'cardiac',
    'coagulation',
    'blood_gas',
    'tumor_marker',
    'urinalysis',
    'other',
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (biomarker: BiomarkerStandard) => {
    onChange(biomarker);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-theme-secondary mb-1">
        Biomarker
      </label>

      {/* Selected value display / trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-left',
          'border rounded-lg bg-theme-primary',
          'focus:outline-none focus:ring-1',
          disabled && 'bg-theme-secondary text-theme-tertiary cursor-not-allowed',
          error
            ? 'border-danger focus:border-danger focus:ring-danger'
            : 'border-theme-primary focus:border-accent focus:ring-accent'
        )}
      >
        {selectedBiomarker ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-theme-primary">{selectedBiomarker.name}</span>
            <span className="text-xs text-theme-muted font-mono shrink-0">
              {selectedBiomarker.code}
            </span>
          </div>
        ) : (
          <span className="text-theme-muted">Select biomarker...</span>
        )}

        <div className="flex items-center gap-1 ml-2">
          {selectedBiomarker && !disabled && (
            <X
              className="w-4 h-4 text-theme-muted hover:text-theme-secondary"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-theme-muted transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {error && <p className="text-sm text-danger mt-1">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-theme-primary border border-theme-primary rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-theme-primary">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search biomarkers..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-theme-primary rounded focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-64">
            {filteredBiomarkers.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-theme-tertiary">
                No biomarkers found
              </div>
            ) : (
              categoryOrder.map((category) => {
                const items = groupedBiomarkers[category];
                if (!items || items.length === 0) return null;

                const categoryInfo = BIOMARKER_CATEGORIES[category];

                return (
                  <div key={category}>
                    <div className="px-3 py-1.5 bg-theme-secondary text-xs font-medium text-theme-tertiary uppercase tracking-wide sticky top-0">
                      {categoryInfo.label}
                    </div>
                    {items.map((biomarker) => (
                      <button
                        key={biomarker.code}
                        type="button"
                        onClick={() => handleSelect(biomarker)}
                        className={cn(
                          'w-full px-3 py-2 text-left hover:bg-info-muted flex items-center justify-between',
                          value === biomarker.code && 'bg-info-muted'
                        )}
                      >
                        <div>
                          <span className="text-sm text-theme-primary">{biomarker.name}</span>
                          {biomarker.aliases.length > 0 && (
                            <span className="ml-2 text-xs text-theme-muted">
                              ({biomarker.aliases[0]})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-theme-muted font-mono">
                          {biomarker.standardUnit}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
