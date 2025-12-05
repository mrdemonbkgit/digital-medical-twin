import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DebugSummary } from './DebugSummary';
import type { ExtractionDebugInfo } from '@/types';

describe('DebugSummary', () => {
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

  describe('header', () => {
    it('renders extraction summary title', () => {
      render(<DebugSummary debugInfo={createDebugInfo()} />);

      expect(screen.getByText('Extraction Summary')).toBeInTheDocument();
    });

    it('shows chunked badge for chunked extraction', () => {
      const debugInfo = createDebugInfo({
        isChunked: true,
        pageCount: 5,
      });

      render(<DebugSummary debugInfo={debugInfo} />);

      expect(screen.getByText(/Chunked: 5 pages/)).toBeInTheDocument();
    });

    it('does not show chunked badge for non-chunked extraction', () => {
      render(<DebugSummary debugInfo={createDebugInfo({ isChunked: false })} />);

      expect(screen.queryByText(/Chunked/)).not.toBeInTheDocument();
    });
  });

  describe('total time', () => {
    it('displays total duration in seconds', () => {
      render(<DebugSummary debugInfo={createDebugInfo({ totalDurationMs: 5000 })} />);

      expect(screen.getByText('Total Time')).toBeInTheDocument();
      expect(screen.getByText('5.0s')).toBeInTheDocument();
    });

    it('displays duration in milliseconds when under 1 second', () => {
      render(<DebugSummary debugInfo={createDebugInfo({ totalDurationMs: 800 })} />);

      expect(screen.getByText('800ms')).toBeInTheDocument();
    });
  });

  describe('PDF size', () => {
    it('displays PDF size in KB', () => {
      render(<DebugSummary debugInfo={createDebugInfo({ pdfSizeBytes: 512000 })} />);

      expect(screen.getByText('PDF Size')).toBeInTheDocument();
      expect(screen.getByText('500.0 KB')).toBeInTheDocument();
    });

    it('displays PDF size in MB for larger files', () => {
      render(<DebugSummary debugInfo={createDebugInfo({ pdfSizeBytes: 2097152 })} />);

      expect(screen.getByText('2.00 MB')).toBeInTheDocument();
    });
  });

  describe('biomarkers', () => {
    it('displays biomarker count', () => {
      render(<DebugSummary debugInfo={createDebugInfo()} />);

      expect(screen.getByText('Biomarkers')).toBeInTheDocument();
    });

    it('shows matched/total ratio', () => {
      const debugInfo = createDebugInfo({
        stage1: { ...createDebugInfo().stage1, biomarkersExtracted: 10 },
        stage3: { ...createDebugInfo().stage3, matchedCount: 8, unmatchedCount: 2 },
      });

      render(<DebugSummary debugInfo={debugInfo} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('(8/10)')).toBeInTheDocument();
    });
  });

  describe('verification status', () => {
    it('shows Passed when verification passed', () => {
      const debugInfo = createDebugInfo({
        stage2: { ...createDebugInfo().stage2, verificationPassed: true, skipped: false },
      });

      render(<DebugSummary debugInfo={debugInfo} />);

      expect(screen.getByText('Passed')).toBeInTheDocument();
    });

    it('shows Failed when verification failed', () => {
      const debugInfo = createDebugInfo({
        stage2: { ...createDebugInfo().stage2, verificationPassed: false, skipped: false },
      });

      render(<DebugSummary debugInfo={debugInfo} />);

      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('shows Skipped when verification was skipped', () => {
      const debugInfo = createDebugInfo({
        stage2: { ...createDebugInfo().stage2, skipped: true },
      });

      render(<DebugSummary debugInfo={debugInfo} />);

      expect(screen.getByText('Skipped')).toBeInTheDocument();
    });

    it('shows corrections count when present', () => {
      const debugInfo = createDebugInfo({
        stage2: { ...createDebugInfo().stage2, verificationPassed: true, correctionsCount: 3, skipped: false },
      });

      render(<DebugSummary debugInfo={debugInfo} />);

      expect(screen.getByText('(3 fixes)')).toBeInTheDocument();
    });
  });

  describe('match rate bar', () => {
    it('shows match rate percentage', () => {
      const debugInfo = createDebugInfo({
        stage1: { ...createDebugInfo().stage1, biomarkersExtracted: 10 },
        stage3: { ...createDebugInfo().stage3, matchedCount: 8, unmatchedCount: 2 },
      });

      render(<DebugSummary debugInfo={debugInfo} />);

      expect(screen.getByText('Match Rate')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('does not show match rate when no biomarkers', () => {
      const debugInfo = createDebugInfo({
        stage1: { ...createDebugInfo().stage1, biomarkersExtracted: 0 },
      });

      render(<DebugSummary debugInfo={debugInfo} />);

      expect(screen.queryByText('Match Rate')).not.toBeInTheDocument();
    });
  });

  describe('merge stats', () => {
    it('shows merge stats for chunked extraction', () => {
      const debugInfo = createDebugInfo({
        isChunked: true,
        mergeStage: {
          name: 'Merge',
          totalBiomarkersBeforeMerge: 15,
          totalBiomarkersAfterMerge: 10,
          duplicatesRemoved: 5,
          conflictsResolved: 0,
        },
      });

      render(<DebugSummary debugInfo={debugInfo} />);

      expect(screen.getByText(/15 biomarkers merged to 10/)).toBeInTheDocument();
      expect(screen.getByText(/5 duplicates removed/)).toBeInTheDocument();
    });

    it('does not show merge stats for non-chunked extraction', () => {
      render(<DebugSummary debugInfo={createDebugInfo({ isChunked: false })} />);

      expect(screen.queryByText(/merged to/)).not.toBeInTheDocument();
    });
  });
});
