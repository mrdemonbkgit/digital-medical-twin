import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryFilter, useVisibleCategories } from './CategoryFilter';
import type { BiomarkerCategory } from '@/types/biomarker';
import { renderHook, act } from '@testing-library/react';

// Mock cn utility
vi.mock('@/utils/cn', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

// Mock BIOMARKER_CATEGORIES
vi.mock('@/types/biomarker', () => ({
  BIOMARKER_CATEGORIES: {
    metabolic: { label: 'Metabolic' },
    lipid: { label: 'Lipid Panel' },
    thyroid: { label: 'Thyroid' },
    vitamin: { label: 'Vitamins' },
  },
}));

describe('CategoryFilter', () => {
  const availableCategories: BiomarkerCategory[] = ['metabolic', 'lipid', 'thyroid'];
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders toggle button with count', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={['metabolic', 'lipid']}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByText('Categories (2/3)')).toBeInTheDocument();
    });

    it('dropdown is hidden by default', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={availableCategories}
          onChange={mockOnChange}
        />
      );
      expect(screen.queryByText('Select All')).not.toBeInTheDocument();
    });

    it('opens dropdown when button clicked', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={availableCategories}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('Categories (3/3)'));

      expect(screen.getByText('Select All')).toBeInTheDocument();
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });

    it('displays category labels', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={availableCategories}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('Categories (3/3)'));

      expect(screen.getByText('Metabolic')).toBeInTheDocument();
      expect(screen.getByText('Lipid Panel')).toBeInTheDocument();
      expect(screen.getByText('Thyroid')).toBeInTheDocument();
    });
  });

  describe('toggle behavior', () => {
    it('removes category when clicked', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={availableCategories}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('Categories (3/3)'));
      fireEvent.click(screen.getByText('Metabolic'));

      expect(mockOnChange).toHaveBeenCalledWith(['lipid', 'thyroid']);
    });

    it('adds category when clicked', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={['lipid']}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('Categories (1/3)'));
      fireEvent.click(screen.getByText('Metabolic'));

      expect(mockOnChange).toHaveBeenCalledWith(['lipid', 'metabolic']);
    });

    it('select all selects all categories', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={['lipid']}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('Categories (1/3)'));
      fireEvent.click(screen.getByText('Select All'));

      expect(mockOnChange).toHaveBeenCalledWith(availableCategories);
    });

    it('clear all clears all categories', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={availableCategories}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('Categories (3/3)'));
      fireEvent.click(screen.getByText('Clear All'));

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('checkbox state', () => {
    it('shows check for visible categories', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={['metabolic']}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('Categories (1/3)'));

      // The checked category button should have the blue styling
      const metabolicButton = screen.getByText('Metabolic').closest('button');
      const checkbox = metabolicButton?.querySelector('div');
      expect(checkbox?.className).toContain('bg-blue-600');
    });
  });

  describe('close behavior', () => {
    it('closes dropdown when backdrop clicked', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={availableCategories}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('Categories (3/3)'));
      expect(screen.getByText('Select All')).toBeInTheDocument();

      // Click the backdrop (fixed inset element)
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop) fireEvent.click(backdrop);

      expect(screen.queryByText('Select All')).not.toBeInTheDocument();
    });

    it('rotates chevron when open', () => {
      render(
        <CategoryFilter
          availableCategories={availableCategories}
          visibleCategories={availableCategories}
          onChange={mockOnChange}
        />
      );

      fireEvent.click(screen.getByText('Categories (3/3)'));

      const chevron = document.querySelector('svg');
      // SVG className is accessed differently
      const className = chevron?.className.baseVal || chevron?.getAttribute('class') || '';
      expect(className).toContain('rotate-180');
    });
  });
});

describe('useVisibleCategories', () => {
  const availableCategories: BiomarkerCategory[] = ['metabolic', 'lipid', 'thyroid'];

  beforeEach(() => {
    localStorage.clear();
  });

  it('returns all available categories by default', () => {
    const { result } = renderHook(() => useVisibleCategories(availableCategories));
    expect(result.current[0]).toEqual(availableCategories);
  });

  it('persists to localStorage when updated', () => {
    const { result } = renderHook(() => useVisibleCategories(availableCategories));

    act(() => {
      result.current[1](['metabolic']);
    });

    expect(localStorage.getItem('insights-visible-categories')).toBe('["metabolic"]');
  });

  it('loads from localStorage on mount', () => {
    localStorage.setItem('insights-visible-categories', '["lipid"]');

    const { result } = renderHook(() => useVisibleCategories(availableCategories));
    expect(result.current[0]).toEqual(['lipid']);
  });

  it('filters out unavailable categories from localStorage', () => {
    localStorage.setItem('insights-visible-categories', '["lipid", "unknown"]');

    const { result } = renderHook(() => useVisibleCategories(availableCategories));
    expect(result.current[0]).toEqual(['lipid']);
  });

  it('handles invalid localStorage JSON', () => {
    localStorage.setItem('insights-visible-categories', 'invalid json');

    const { result } = renderHook(() => useVisibleCategories(availableCategories));
    expect(result.current[0]).toEqual(availableCategories);
  });
});
