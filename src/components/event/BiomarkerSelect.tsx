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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Biomarker
      </label>

      {/* Selected value display / trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 text-left',
          'border rounded-lg bg-white',
          'focus:outline-none focus:ring-1',
          disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
        )}
      >
        {selectedBiomarker ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-gray-900">{selectedBiomarker.name}</span>
            <span className="text-xs text-gray-400 font-mono shrink-0">
              {selectedBiomarker.code}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">Select biomarker...</span>
        )}

        <div className="flex items-center gap-1 ml-2">
          {selectedBiomarker && !disabled && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search biomarkers..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-64">
            {filteredBiomarkers.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                No biomarkers found
              </div>
            ) : (
              categoryOrder.map((category) => {
                const items = groupedBiomarkers[category];
                if (!items || items.length === 0) return null;

                const categoryInfo = BIOMARKER_CATEGORIES[category];

                return (
                  <div key={category}>
                    <div className="px-3 py-1.5 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide sticky top-0">
                      {categoryInfo.label}
                    </div>
                    {items.map((biomarker) => (
                      <button
                        key={biomarker.code}
                        type="button"
                        onClick={() => handleSelect(biomarker)}
                        className={cn(
                          'w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between',
                          value === biomarker.code && 'bg-blue-50'
                        )}
                      >
                        <div>
                          <span className="text-sm text-gray-900">{biomarker.name}</span>
                          {biomarker.aliases.length > 0 && (
                            <span className="ml-2 text-xs text-gray-400">
                              ({biomarker.aliases[0]})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 font-mono">
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
