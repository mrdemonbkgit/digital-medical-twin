import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RawResponseSection } from './RawResponseSection';
import type { ExtractionDebugInfo } from '@/types';

describe('RawResponseSection', () => {
  const createDebugInfo = (overrides: Partial<ExtractionDebugInfo> = {}): ExtractionDebugInfo => ({
    totalDurationMs: 5000,
    pdfSizeBytes: 1024000,
    stage1: {
      name: 'Extraction',
      model: 'gemini-1.5-flash',
      thinkingLevel: 'high',
      durationMs: 2000,
      biomarkersExtracted: 10,
      rawResponse: 'Stage 1 response content',
    },
    stage2: {
      name: 'Verification',
      model: 'gpt-4o',
      reasoningEffort: 'medium',
      durationMs: 1500,
      verificationPassed: true,
      correctionsCount: 0,
      skipped: false,
      rawResponse: 'Stage 2 response content',
    },
    stage3: {
      name: 'Matching',
      durationMs: 500,
      standardsCount: 200,
      userGender: 'male',
      matchedCount: 8,
      unmatchedCount: 2,
      matchDetails: [],
      rawResponse: 'Stage 3 response content',
    },
    ...overrides,
  });

  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  describe('section title', () => {
    it('renders section header', () => {
      render(<RawResponseSection debugInfo={createDebugInfo()} />);

      expect(screen.getByText('Raw AI Responses')).toBeInTheDocument();
    });
  });

  describe('collapsible responses', () => {
    it('renders all three stage response sections', () => {
      render(<RawResponseSection debugInfo={createDebugInfo()} />);

      expect(screen.getByText('Stage 1: Gemini Extraction Response')).toBeInTheDocument();
      expect(screen.getByText('Stage 2: GPT Verification Response')).toBeInTheDocument();
      expect(screen.getByText('Stage 3: Gemini Post-Processing Response')).toBeInTheDocument();
    });

    it('shows file size for responses', () => {
      const debugInfo = createDebugInfo({
        stage1: {
          ...createDebugInfo().stage1,
          rawResponse: 'x'.repeat(10240), // 10KB
        },
      });

      render(<RawResponseSection debugInfo={debugInfo} />);

      expect(screen.getByText('(10.0 KB)')).toBeInTheDocument();
    });
  });

  describe('expand/collapse', () => {
    it('starts collapsed', () => {
      render(<RawResponseSection debugInfo={createDebugInfo()} />);

      expect(screen.queryByText('Stage 1 response content')).not.toBeInTheDocument();
    });

    it('expands when clicking header', () => {
      render(<RawResponseSection debugInfo={createDebugInfo()} />);

      fireEvent.click(screen.getByText('Stage 1: Gemini Extraction Response'));

      expect(screen.getByText('Stage 1 response content')).toBeInTheDocument();
    });

    it('collapses when clicking header again', () => {
      render(<RawResponseSection debugInfo={createDebugInfo()} />);

      const header = screen.getByText('Stage 1: Gemini Extraction Response');
      fireEvent.click(header); // expand
      fireEvent.click(header); // collapse

      expect(screen.queryByText('Stage 1 response content')).not.toBeInTheDocument();
    });
  });

  describe('no response', () => {
    it('shows "(no response)" when rawResponse is undefined', () => {
      const debugInfo = createDebugInfo({
        stage1: {
          ...createDebugInfo().stage1,
          rawResponse: undefined,
        },
      });

      render(<RawResponseSection debugInfo={debugInfo} />);

      expect(screen.getByText('(no response)')).toBeInTheDocument();
    });

    it('is not expandable when no response', () => {
      const debugInfo = createDebugInfo({
        stage1: { ...createDebugInfo().stage1, rawResponse: undefined },
      });

      const { container } = render(<RawResponseSection debugInfo={debugInfo} />);

      // The no-response container has bg-theme-secondary styling
      const noResponseContainer = container.querySelector('.bg-theme-secondary');
      expect(noResponseContainer).toBeInTheDocument();
      expect(screen.getByText('(no response)')).toBeInTheDocument();
    });
  });

  describe('copy button', () => {
    it('shows copy button when expanded', () => {
      render(<RawResponseSection debugInfo={createDebugInfo()} />);

      fireEvent.click(screen.getByText('Stage 1: Gemini Extraction Response'));

      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('does not show copy button when collapsed', () => {
      render(<RawResponseSection debugInfo={createDebugInfo()} />);

      expect(screen.queryByText('Copy')).not.toBeInTheDocument();
    });

    it('copies content to clipboard', async () => {
      render(<RawResponseSection debugInfo={createDebugInfo()} />);

      fireEvent.click(screen.getByText('Stage 1: Gemini Extraction Response'));
      fireEvent.click(screen.getByText('Copy'));

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Stage 1 response content');
    });

    it('shows "Copied" after copying', async () => {
      render(<RawResponseSection debugInfo={createDebugInfo()} />);

      fireEvent.click(screen.getByText('Stage 1: Gemini Extraction Response'));
      fireEvent.click(screen.getByText('Copy'));

      await waitFor(() => {
        expect(screen.getByText('Copied')).toBeInTheDocument();
      });
    });
  });

  describe('content display', () => {
    it('renders content in pre tag with mono font', () => {
      render(<RawResponseSection debugInfo={createDebugInfo()} />);

      fireEvent.click(screen.getByText('Stage 1: Gemini Extraction Response'));

      const pre = screen.getByText('Stage 1 response content');
      expect(pre.tagName).toBe('PRE');
      expect(pre).toHaveClass('font-mono');
    });
  });
});
