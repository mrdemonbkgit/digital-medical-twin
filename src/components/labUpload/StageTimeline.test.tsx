import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StageTimeline } from './StageTimeline';
import type { ExtractionDebugInfo } from '@/types';

describe('StageTimeline', () => {
  const createDebugInfo = (overrides: Partial<ExtractionDebugInfo> = {}): ExtractionDebugInfo => ({
    totalDurationMs: 5000,
    pdfSizeBytes: 1024000,
    stage1: {
      name: 'Gemini Extraction',
      model: 'gemini-1.5-flash',
      thinkingLevel: 'high',
      durationMs: 2000,
      biomarkersExtracted: 10,
    },
    stage2: {
      name: 'GPT Verification',
      model: 'gpt-4o',
      reasoningEffort: 'medium',
      durationMs: 1500,
      verificationPassed: true,
      correctionsCount: 0,
      skipped: false,
    },
    stage3: {
      name: 'Biomarker Matching',
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
    it('renders section title', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText('Processing Timeline')).toBeInTheDocument();
    });
  });

  describe('stage 1 - extraction', () => {
    it('renders stage 1 name', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText('Gemini Extraction')).toBeInTheDocument();
    });

    it('displays duration', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText('2.0s')).toBeInTheDocument();
    });

    it('shows model name', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText('gemini-1.5-flash')).toBeInTheDocument();
    });

    it('shows thinking level', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText(/Thinking: high/)).toBeInTheDocument();
    });

    it('shows biomarkers extracted count', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText(/Extracted: 10 biomarkers/)).toBeInTheDocument();
    });
  });

  describe('stage 2 - verification', () => {
    it('renders stage 2 name', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText('GPT Verification')).toBeInTheDocument();
    });

    it('shows verification passed', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText('Passed')).toBeInTheDocument();
    });

    it('shows verification failed', () => {
      const debugInfo = createDebugInfo({
        stage2: { ...createDebugInfo().stage2, verificationPassed: false },
      });

      render(<StageTimeline debugInfo={debugInfo} />);

      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('shows skipped when verification was skipped', () => {
      const debugInfo = createDebugInfo({
        stage2: { ...createDebugInfo().stage2, skipped: true },
      });

      render(<StageTimeline debugInfo={debugInfo} />);

      expect(screen.getByText('Skipped')).toBeInTheDocument();
      expect(screen.getByText('Verification was skipped by user preference')).toBeInTheDocument();
    });

    it('shows corrections count when present', () => {
      const debugInfo = createDebugInfo({
        stage2: { ...createDebugInfo().stage2, correctionsCount: 3 },
      });

      render(<StageTimeline debugInfo={debugInfo} />);

      expect(screen.getByText('3 corrections')).toBeInTheDocument();
    });

    it('shows reasoning effort', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText(/Reasoning: medium/)).toBeInTheDocument();
    });
  });

  describe('stage 3 - matching', () => {
    it('renders stage 3 name', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText('Biomarker Matching')).toBeInTheDocument();
    });

    it('shows standards count', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText(/Standards: 200/)).toBeInTheDocument();
    });

    it('shows user gender', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText(/Gender: male/)).toBeInTheDocument();
    });

    it('shows matched count', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('shows unmatched count when present', () => {
      render(<StageTimeline debugInfo={createDebugInfo()} />);

      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  describe('merge stage', () => {
    it('renders merge stage for chunked extraction', () => {
      const debugInfo = createDebugInfo({
        isChunked: true,
        mergeStage: {
          name: 'Merge Results',
          totalBiomarkersBeforeMerge: 15,
          totalBiomarkersAfterMerge: 10,
          duplicatesRemoved: 5,
          conflictsResolved: 0,
        },
      });

      render(<StageTimeline debugInfo={debugInfo} />);

      expect(screen.getByText('Merge Results')).toBeInTheDocument();
      expect(screen.getByText(/15 → 10 biomarkers/)).toBeInTheDocument();
    });

    it('shows duplicates removed', () => {
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

      render(<StageTimeline debugInfo={debugInfo} />);

      expect(screen.getByText(/5 duplicates removed/)).toBeInTheDocument();
    });

    it('shows conflicts resolved', () => {
      const debugInfo = createDebugInfo({
        isChunked: true,
        mergeStage: {
          name: 'Merge',
          totalBiomarkersBeforeMerge: 15,
          totalBiomarkersAfterMerge: 12,
          duplicatesRemoved: 0,
          conflictsResolved: 3,
        },
      });

      render(<StageTimeline debugInfo={debugInfo} />);

      expect(screen.getByText(/3 conflicts resolved/)).toBeInTheDocument();
    });

    it('does not render merge stage for non-chunked extraction', () => {
      const debugInfo = createDebugInfo({ isChunked: false });

      render(<StageTimeline debugInfo={debugInfo} />);

      expect(screen.queryByText('Merge Results')).not.toBeInTheDocument();
    });
  });

  describe('chunked extraction details', () => {
    it('shows pages processed for chunked extraction', () => {
      const debugInfo = createDebugInfo({
        isChunked: true,
        stage1: {
          ...createDebugInfo().stage1,
          pagesProcessed: 5,
          avgPageDurationMs: 400,
        },
      });

      render(<StageTimeline debugInfo={debugInfo} />);

      expect(screen.getByText(/Pages: 5/)).toBeInTheDocument();
      expect(screen.getByText(/Avg: 400ms\/page/)).toBeInTheDocument();
    });
  });

  describe('duration formatting', () => {
    it('formats milliseconds correctly', () => {
      const debugInfo = createDebugInfo({
        stage1: { ...createDebugInfo().stage1, durationMs: 750 },
        stage3: { ...createDebugInfo().stage3, durationMs: 200 },
      });

      render(<StageTimeline debugInfo={debugInfo} />);

      expect(screen.getByText('750ms')).toBeInTheDocument();
    });

    it('formats seconds correctly', () => {
      const debugInfo = createDebugInfo({
        stage1: { ...createDebugInfo().stage1, durationMs: 3500 },
      });

      render(<StageTimeline debugInfo={debugInfo} />);

      expect(screen.getByText('3.5s')).toBeInTheDocument();
    });
  });
});
