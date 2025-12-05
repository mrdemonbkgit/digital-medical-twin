import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageDebugAccordion } from './PageDebugAccordion';
import type { PageDebugInfo } from '@/types';

describe('PageDebugAccordion', () => {
  const createPageDebugInfo = (
    pageNumber: number,
    overrides: Partial<PageDebugInfo> = {}
  ): PageDebugInfo => ({
    pageNumber,
    extraction: {
      durationMs: 1000,
      biomarkersExtracted: 5,
    },
    ...overrides,
  });

  describe('empty state', () => {
    it('returns null when pageDetails is empty', () => {
      const { container } = render(<PageDebugAccordion pageDetails={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it('returns null when pageDetails is undefined', () => {
      const { container } = render(<PageDebugAccordion pageDetails={undefined as any} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('header', () => {
    it('renders section title', () => {
      render(<PageDebugAccordion pageDetails={[createPageDebugInfo(1)]} />);

      expect(screen.getByText('Per-Page Details')).toBeInTheDocument();
    });
  });

  describe('page rows', () => {
    it('renders page number', () => {
      render(<PageDebugAccordion pageDetails={[createPageDebugInfo(1)]} />);

      expect(screen.getByText('Page 1')).toBeInTheDocument();
    });

    it('renders multiple pages', () => {
      const pages = [createPageDebugInfo(1), createPageDebugInfo(2), createPageDebugInfo(3)];

      render(<PageDebugAccordion pageDetails={pages} />);

      expect(screen.getByText('Page 1')).toBeInTheDocument();
      expect(screen.getByText('Page 2')).toBeInTheDocument();
      expect(screen.getByText('Page 3')).toBeInTheDocument();
    });

    it('shows biomarker count', () => {
      render(<PageDebugAccordion pageDetails={[createPageDebugInfo(1)]} />);

      expect(screen.getByText('5 biomarkers')).toBeInTheDocument();
    });

    it('shows singular biomarker for count of 1', () => {
      const page = createPageDebugInfo(1, {
        extraction: { durationMs: 1000, biomarkersExtracted: 1 },
      });

      render(<PageDebugAccordion pageDetails={[page]} />);

      expect(screen.getByText('1 biomarker')).toBeInTheDocument();
    });

    it('shows total duration', () => {
      const page = createPageDebugInfo(1, {
        extraction: { durationMs: 800, biomarkersExtracted: 5 },
        verification: {
          durationMs: 500,
          verificationPassed: true,
          correctionsCount: 0,
          corrections: [],
        },
      });

      render(<PageDebugAccordion pageDetails={[page]} />);

      expect(screen.getByText('1.3s')).toBeInTheDocument();
    });
  });

  describe('verification status icons', () => {
    it('shows check icon for passed verification', () => {
      const page = createPageDebugInfo(1, {
        verification: {
          durationMs: 500,
          verificationPassed: true,
          correctionsCount: 0,
          corrections: [],
        },
      });

      const { container } = render(<PageDebugAccordion pageDetails={[page]} />);

      // Green check circle for passed
      const greenIcon = container.querySelector('.text-green-500');
      expect(greenIcon).toBeInTheDocument();
    });

    it('shows warning icon for failed verification', () => {
      const page = createPageDebugInfo(1, {
        verification: {
          durationMs: 500,
          verificationPassed: false,
          correctionsCount: 2,
          corrections: ['Fix 1', 'Fix 2'],
        },
      });

      const { container } = render(<PageDebugAccordion pageDetails={[page]} />);

      // Amber icon for failed
      const amberIcon = container.querySelector('.text-amber-500');
      expect(amberIcon).toBeInTheDocument();
    });
  });

  describe('expand/collapse', () => {
    it('starts collapsed', () => {
      render(<PageDebugAccordion pageDetails={[createPageDebugInfo(1)]} />);

      expect(screen.queryByText('Extraction')).not.toBeInTheDocument();
    });

    it('expands when clicking page row', () => {
      render(<PageDebugAccordion pageDetails={[createPageDebugInfo(1)]} />);

      fireEvent.click(screen.getByText('Page 1'));

      expect(screen.getByText('Extraction')).toBeInTheDocument();
    });

    it('collapses when clicking expanded page row', () => {
      render(<PageDebugAccordion pageDetails={[createPageDebugInfo(1)]} />);

      fireEvent.click(screen.getByText('Page 1'));
      fireEvent.click(screen.getByText('Page 1'));

      expect(screen.queryByText('Extraction')).not.toBeInTheDocument();
    });

    it('only one page is expanded at a time', () => {
      const pages = [createPageDebugInfo(1), createPageDebugInfo(2)];

      render(<PageDebugAccordion pageDetails={pages} />);

      fireEvent.click(screen.getByText('Page 1'));
      expect(screen.getByText('Extraction')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Page 2'));
      // Only one Extraction label should be visible (for page 2)
      expect(screen.getAllByText('Extraction').length).toBe(1);
    });
  });

  describe('expanded content - extraction', () => {
    it('shows extraction duration', () => {
      const page = createPageDebugInfo(1, {
        extraction: { durationMs: 1200, biomarkersExtracted: 5 },
      });

      render(<PageDebugAccordion pageDetails={[page]} />);
      fireEvent.click(screen.getByText('Page 1'));

      // Duration appears in both header and expanded content
      const durations = screen.getAllByText('1.2s');
      expect(durations.length).toBeGreaterThanOrEqual(1);
    });

    it('shows empty page indicator for 0 biomarkers', () => {
      const page = createPageDebugInfo(1, {
        extraction: { durationMs: 500, biomarkersExtracted: 0 },
      });

      render(<PageDebugAccordion pageDetails={[page]} />);
      fireEvent.click(screen.getByText('Page 1'));

      expect(screen.getByText(/empty page/)).toBeInTheDocument();
    });
  });

  describe('expanded content - verification', () => {
    it('shows verification section when present', () => {
      const page = createPageDebugInfo(1, {
        verification: {
          durationMs: 500,
          verificationPassed: true,
          correctionsCount: 0,
          corrections: [],
        },
      });

      render(<PageDebugAccordion pageDetails={[page]} />);
      fireEvent.click(screen.getByText('Page 1'));

      expect(screen.getByText('Verification')).toBeInTheDocument();
      expect(screen.getByText('Passed')).toBeInTheDocument();
    });

    it('shows "Issues found" for failed verification', () => {
      const page = createPageDebugInfo(1, {
        verification: {
          durationMs: 500,
          verificationPassed: false,
          correctionsCount: 1,
          corrections: ['Value mismatch'],
        },
      });

      render(<PageDebugAccordion pageDetails={[page]} />);
      fireEvent.click(screen.getByText('Page 1'));

      expect(screen.getByText('Issues found')).toBeInTheDocument();
    });

    it('shows corrections list', () => {
      const page = createPageDebugInfo(1, {
        verification: {
          durationMs: 500,
          verificationPassed: false,
          correctionsCount: 2,
          corrections: ['Value mismatch for glucose', 'Unit conversion needed'],
        },
      });

      render(<PageDebugAccordion pageDetails={[page]} />);
      fireEvent.click(screen.getByText('Page 1'));

      expect(screen.getByText('Value mismatch for glucose')).toBeInTheDocument();
      expect(screen.getByText('Unit conversion needed')).toBeInTheDocument();
    });

    it('shows corrections count', () => {
      const page = createPageDebugInfo(1, {
        verification: {
          durationMs: 500,
          verificationPassed: true,
          correctionsCount: 3,
          corrections: ['Fix 1', 'Fix 2', 'Fix 3'],
        },
      });

      render(<PageDebugAccordion pageDetails={[page]} />);
      fireEvent.click(screen.getByText('Page 1'));

      expect(screen.getByText('(3 corrections)')).toBeInTheDocument();
    });
  });
});
