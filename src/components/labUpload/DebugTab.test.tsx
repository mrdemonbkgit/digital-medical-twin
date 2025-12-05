import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DebugTab } from './DebugTab';
import type { ExtractionDebugInfo } from '@/types';

// Mock child components
vi.mock('./DebugSummary', () => ({
  DebugSummary: ({ debugInfo }: any) => (
    <div data-testid="debug-summary">Summary: {debugInfo.totalDurationMs}ms</div>
  ),
}));

vi.mock('./StageTimeline', () => ({
  StageTimeline: ({ debugInfo }: any) => (
    <div data-testid="stage-timeline">Timeline</div>
  ),
}));

vi.mock('./MatchDetailsTable', () => ({
  MatchDetailsTable: ({ matchDetails }: any) => (
    <div data-testid="match-details">{matchDetails.length} matches</div>
  ),
}));

vi.mock('./RawResponseSection', () => ({
  RawResponseSection: ({ debugInfo }: any) => (
    <div data-testid="raw-responses">Raw Responses</div>
  ),
}));

vi.mock('./PageDebugAccordion', () => ({
  PageDebugAccordion: ({ pageDetails }: any) => (
    <div data-testid="page-accordion">{pageDetails.length} pages</div>
  ),
}));

describe('DebugTab', () => {
  const createDebugInfo = (overrides: Partial<ExtractionDebugInfo> = {}): ExtractionDebugInfo => ({
    totalDurationMs: 5000,
    pdfSizeBytes: 1024000,
    stage1: {
      name: 'Extraction',
      model: 'gemini-1.5-flash',
      thinkingLevel: 'high',
      durationMs: 2000,
      biomarkersExtracted: 10,
    },
    stage2: {
      name: 'Verification',
      model: 'gpt-4o',
      reasoningEffort: 'medium',
      durationMs: 1500,
      verificationPassed: true,
      correctionsCount: 0,
      skipped: false,
    },
    stage3: {
      name: 'Matching',
      durationMs: 500,
      standardsCount: 200,
      userGender: 'male',
      matchedCount: 8,
      unmatchedCount: 2,
      matchDetails: [],
    },
    ...overrides,
  });

  describe('no debug info', () => {
    it('shows empty state when debugInfo is undefined', () => {
      render(<DebugTab debugInfo={undefined} />);

      expect(screen.getByText('No debug information available for this extraction.')).toBeInTheDocument();
    });

    it('shows bug icon in empty state', () => {
      const { container } = render(<DebugTab debugInfo={undefined} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('shows help text about when debug info is captured', () => {
      render(<DebugTab debugInfo={undefined} />);

      expect(screen.getByText(/Debug info is only captured/)).toBeInTheDocument();
    });
  });

  describe('with debug info', () => {
    it('renders DebugSummary', () => {
      render(<DebugTab debugInfo={createDebugInfo()} />);

      expect(screen.getByTestId('debug-summary')).toBeInTheDocument();
    });

    it('renders StageTimeline', () => {
      render(<DebugTab debugInfo={createDebugInfo()} />);

      expect(screen.getByTestId('stage-timeline')).toBeInTheDocument();
    });

    it('renders RawResponseSection', () => {
      render(<DebugTab debugInfo={createDebugInfo()} />);

      expect(screen.getByTestId('raw-responses')).toBeInTheDocument();
    });
  });

  describe('match details', () => {
    it('renders MatchDetailsTable when matchDetails has items', () => {
      const debugInfo = createDebugInfo({
        stage3: {
          name: 'Matching',
          durationMs: 500,
          standardsCount: 200,
          userGender: 'male',
          matchedCount: 2,
          unmatchedCount: 0,
          matchDetails: [
            { originalName: 'Glucose', matchedCode: 'glucose', matchedName: 'Glucose', validationIssues: [] },
            { originalName: 'A1C', matchedCode: 'hba1c', matchedName: 'HbA1c', validationIssues: [] },
          ],
        },
      });

      render(<DebugTab debugInfo={debugInfo} />);

      expect(screen.getByTestId('match-details')).toBeInTheDocument();
      expect(screen.getByText('2 matches')).toBeInTheDocument();
    });

    it('does not render MatchDetailsTable when matchDetails is empty', () => {
      render(<DebugTab debugInfo={createDebugInfo()} />);

      expect(screen.queryByTestId('match-details')).not.toBeInTheDocument();
    });
  });

  describe('chunked extraction', () => {
    it('renders PageDebugAccordion for chunked extraction with pageDetails', () => {
      const debugInfo = createDebugInfo({
        isChunked: true,
        pageDetails: [
          { pageNumber: 1, extraction: { durationMs: 1000, biomarkersExtracted: 5 } },
          { pageNumber: 2, extraction: { durationMs: 800, biomarkersExtracted: 3 } },
        ],
      });

      render(<DebugTab debugInfo={debugInfo} />);

      expect(screen.getByTestId('page-accordion')).toBeInTheDocument();
      expect(screen.getByText('2 pages')).toBeInTheDocument();
    });

    it('does not render PageDebugAccordion when not chunked', () => {
      const debugInfo = createDebugInfo({ isChunked: false });

      render(<DebugTab debugInfo={debugInfo} />);

      expect(screen.queryByTestId('page-accordion')).not.toBeInTheDocument();
    });

    it('does not render PageDebugAccordion when pageDetails is empty', () => {
      const debugInfo = createDebugInfo({
        isChunked: true,
        pageDetails: [],
      });

      render(<DebugTab debugInfo={debugInfo} />);

      expect(screen.queryByTestId('page-accordion')).not.toBeInTheDocument();
    });
  });
});
