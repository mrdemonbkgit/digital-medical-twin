import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LabUploadCard } from './LabUploadCard';
import type { LabUpload } from '@/types';

// Mock the API
vi.mock('@/api/labUploads', () => ({
  getLabUploadPdfUrl: vi.fn(),
}));

import { getLabUploadPdfUrl } from '@/api/labUploads';

const mockUploadComplete: LabUpload = {
  id: 'upload-1',
  userId: 'user-123',
  filename: 'lab-results-complete.pdf',
  storagePath: 'user-123/upload-1.pdf',
  fileSize: 1024000,
  status: 'complete',
  processingStage: null,
  skipVerification: false,
  extractedData: {
    biomarkers: [
      { name: 'LDL', value: 100, unit: 'mg/dL' },
      { name: 'HDL', value: 60, unit: 'mg/dL' },
    ],
  },
  extractionConfidence: 0.95,
  verificationPassed: true,
  corrections: ['Fixed LDL unit'],
  errorMessage: null,
  createdAt: '2024-01-01T00:00:00Z',
  startedAt: '2024-01-01T00:00:01Z',
  completedAt: '2024-01-01T00:00:10Z',
  eventId: null,
};

// Helper to create a processing upload with a recent startedAt (to avoid "stuck" state)
const createProcessingUpload = (overrides: Partial<LabUpload> = {}): LabUpload => ({
  ...mockUploadComplete,
  id: 'upload-2',
  filename: 'lab-results-processing.pdf',
  status: 'processing',
  processingStage: 'extracting_gemini',
  extractedData: null,
  verificationPassed: null,
  corrections: null,
  completedAt: null,
  startedAt: new Date(Date.now() - 30000).toISOString(), // 30 seconds ago
  ...overrides,
});

// Static reference for backward compatibility - but prefer createProcessingUpload() in tests
const mockUploadProcessing: LabUpload = {
  ...mockUploadComplete,
  id: 'upload-2',
  filename: 'lab-results-processing.pdf',
  status: 'processing',
  processingStage: 'extracting_gemini',
  extractedData: null,
  verificationPassed: null,
  corrections: null,
  completedAt: null,
  // Note: startedAt inherited from mockUploadComplete may be old
};

const mockUploadFailed: LabUpload = {
  ...mockUploadComplete,
  id: 'upload-3',
  filename: 'lab-results-failed.pdf',
  status: 'failed',
  extractedData: null,
  verificationPassed: null,
  corrections: null,
  errorMessage: 'Failed to extract biomarkers',
  completedAt: null,
};

const mockUploadPending: LabUpload = {
  ...mockUploadComplete,
  id: 'upload-4',
  filename: 'lab-results-pending.pdf',
  status: 'pending',
  processingStage: null,
  extractedData: null,
  verificationPassed: null,
  corrections: null,
  startedAt: null,
  completedAt: null,
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LabUploadCard', () => {
  const mockOnDelete = vi.fn();
  const mockOnRetry = vi.fn();
  const mockOnPreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(getLabUploadPdfUrl).mockResolvedValue('https://example.com/pdf');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Common elements', () => {
    it('renders filename', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('lab-results-complete.pdf')).toBeInTheDocument();
    });

    it('renders file size', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      // File size of 1024000 bytes = ~1000 KB = ~1 MB
      expect(screen.getByText(/KB|MB/)).toBeInTheDocument();
    });

    it('calls onDelete when delete button is clicked', async () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      const deleteButton = screen.getByTitle('Delete');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('upload-1');
    });

    it('shows deleting state', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
          isDeleting
        />
      );

      const deleteButton = screen.getByTitle('Delete');
      expect(deleteButton.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('opens PDF in new tab when View PDF button clicked', async () => {
      const mockOpen = vi.fn();
      vi.stubGlobal('open', mockOpen);

      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      const viewButton = screen.getByTitle('View PDF');
      fireEvent.click(viewButton);

      await waitFor(() => {
        expect(getLabUploadPdfUrl).toHaveBeenCalledWith('user-123/upload-1.pdf');
        expect(mockOpen).toHaveBeenCalledWith('https://example.com/pdf', '_blank');
      });

      vi.unstubAllGlobals();
    });
  });

  describe('Pending status', () => {
    it('renders pending badge', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadPending}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('Processing status', () => {
    it('renders processing badge', () => {
      renderWithRouter(
        <LabUploadCard
          upload={createProcessingUpload()}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Processing')).toBeInTheDocument();
    });

    it('shows processing stage message', () => {
      renderWithRouter(
        <LabUploadCard
          upload={createProcessingUpload()}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Extracting with Gemini...')).toBeInTheDocument();
    });

    it('disables delete button when processing', () => {
      renderWithRouter(
        <LabUploadCard
          upload={createProcessingUpload()}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      const deleteButton = screen.getByTitle('Delete');
      expect(deleteButton).toBeDisabled();
    });

    it('shows verifying GPT stage message', () => {
      renderWithRouter(
        <LabUploadCard
          upload={createProcessingUpload({ processingStage: 'verifying_gpt' })}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Verifying with GPT...')).toBeInTheDocument();
    });
  });

  describe('Failed status', () => {
    it('renders failed badge', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadFailed}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('shows error message', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadFailed}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Failed to extract biomarkers')).toBeInTheDocument();
    });

    it('shows retry button and calls onRetry', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadFailed}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      const retryButton = screen.getByRole('button', { name: /Retry Extraction/ });
      fireEvent.click(retryButton);

      expect(mockOnRetry).toHaveBeenCalledWith('upload-3');
    });
  });

  describe('Complete status', () => {
    it('renders complete badge', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('shows biomarker count', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText(/2 biomarkers extracted/)).toBeInTheDocument();
    });

    it('shows singular biomarker text for single biomarker', () => {
      const singleBiomarkerUpload = {
        ...mockUploadComplete,
        extractedData: {
          biomarkers: [{ name: 'LDL', value: 100, unit: 'mg/dL' }],
        },
      };

      renderWithRouter(
        <LabUploadCard
          upload={singleBiomarkerUpload}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText(/1 biomarker extracted/)).toBeInTheDocument();
    });

    it('shows verified badge when verification passed', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Verified')).toBeInTheDocument();
    });

    it('shows unverified badge when verification not passed', () => {
      const unverifiedUpload = {
        ...mockUploadComplete,
        verificationPassed: false,
      };

      renderWithRouter(
        <LabUploadCard
          upload={unverifiedUpload}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText('Unverified')).toBeInTheDocument();
    });

    it('shows corrections count', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      expect(screen.getByText(/1 correction applied/)).toBeInTheDocument();
    });

    it('shows Preview button and calls onPreview', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      const previewButton = screen.getByRole('button', { name: /Preview/ });
      fireEvent.click(previewButton);

      expect(mockOnPreview).toHaveBeenCalledWith(mockUploadComplete);
    });

    it('shows Create Event link when no eventId', () => {
      renderWithRouter(
        <LabUploadCard
          upload={mockUploadComplete}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      const createLink = screen.getByRole('link', { name: /Create Event/ });
      expect(createLink).toHaveAttribute(
        'href',
        '/event/new/lab_result?fromUpload=upload-1'
      );
    });

    it('shows View Event link when eventId exists', () => {
      const linkedUpload = {
        ...mockUploadComplete,
        eventId: 'event-123',
      };

      renderWithRouter(
        <LabUploadCard
          upload={linkedUpload}
          onDelete={mockOnDelete}
          onRetry={mockOnRetry}
          onPreview={mockOnPreview}
        />
      );

      const viewLink = screen.getByRole('link', { name: /View Event/ });
      expect(viewLink).toHaveAttribute('href', '/event/event-123');
    });
  });
});
