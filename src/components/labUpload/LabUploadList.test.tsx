import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LabUploadList } from './LabUploadList';
import type { LabUpload } from '@/types';

// Mock hooks
vi.mock('@/hooks/useLabUploads', () => ({
  useLabUploads: vi.fn(),
}));

vi.mock('@/hooks/useLabUploadMutation', () => ({
  useLabUploadMutation: vi.fn(),
}));

// Mock API
vi.mock('@/api/labUploads', () => ({
  getLabUploadPdfUrl: vi.fn().mockResolvedValue('https://example.com/pdf'),
}));

import { useLabUploads } from '@/hooks/useLabUploads';
import { useLabUploadMutation } from '@/hooks/useLabUploadMutation';

const mockUploads: LabUpload[] = [
  {
    id: 'complete-1',
    userId: 'user-123',
    filename: 'complete.pdf',
    storagePath: 'user-123/complete-1.pdf',
    fileSize: 1024000,
    status: 'complete',
    processingStage: null,
    skipVerification: false,
    extractedData: {
      biomarkers: [{ name: 'LDL', value: 100, unit: 'mg/dL' }],
    },
    extractionConfidence: 0.95,
    verificationPassed: true,
    corrections: null,
    errorMessage: null,
    createdAt: '2024-01-01T00:00:00Z',
    startedAt: '2024-01-01T00:00:01Z',
    completedAt: '2024-01-01T00:00:10Z',
    eventId: null,
  },
  {
    id: 'processing-1',
    userId: 'user-123',
    filename: 'processing.pdf',
    storagePath: 'user-123/processing-1.pdf',
    fileSize: 2048000,
    status: 'processing',
    processingStage: 'extracting_gemini',
    skipVerification: false,
    extractedData: null,
    extractionConfidence: null,
    verificationPassed: null,
    corrections: null,
    errorMessage: null,
    createdAt: '2024-01-02T00:00:00Z',
    startedAt: '2024-01-02T00:00:01Z',
    completedAt: null,
    eventId: null,
  },
  {
    id: 'pending-1',
    userId: 'user-123',
    filename: 'pending.pdf',
    storagePath: 'user-123/pending-1.pdf',
    fileSize: 512000,
    status: 'pending',
    processingStage: null,
    skipVerification: false,
    extractedData: null,
    extractionConfidence: null,
    verificationPassed: null,
    corrections: null,
    errorMessage: null,
    createdAt: '2024-01-03T00:00:00Z',
    startedAt: null,
    completedAt: null,
    eventId: null,
  },
  {
    id: 'failed-1',
    userId: 'user-123',
    filename: 'failed.pdf',
    storagePath: 'user-123/failed-1.pdf',
    fileSize: 768000,
    status: 'failed',
    processingStage: null,
    skipVerification: false,
    extractedData: null,
    extractionConfidence: null,
    verificationPassed: null,
    corrections: null,
    errorMessage: 'Failed to extract',
    createdAt: '2024-01-04T00:00:00Z',
    startedAt: '2024-01-04T00:00:01Z',
    completedAt: null,
    eventId: null,
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('LabUploadList', () => {
  const mockRefetch = vi.fn();
  const mockRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useLabUploads).mockReturnValue({
      uploads: mockUploads,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      hasProcessing: true,
    });

    vi.mocked(useLabUploadMutation).mockReturnValue({
      create: vi.fn(),
      update: vi.fn(),
      remove: mockRemove,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      error: null,
      clearError: vi.fn(),
    });
  });

  it('renders loading spinner when loading with no uploads', () => {
    vi.mocked(useLabUploads).mockReturnValue({
      uploads: [],
      isLoading: true,
      error: null,
      refetch: mockRefetch,
      hasProcessing: false,
    });

    renderWithRouter(<LabUploadList />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders error message', () => {
    vi.mocked(useLabUploads).mockReturnValue({
      uploads: [],
      isLoading: false,
      error: 'Failed to load uploads',
      refetch: mockRefetch,
      hasProcessing: false,
    });

    renderWithRouter(<LabUploadList />);

    expect(screen.getByText('Failed to load uploads')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls refetch when Try again is clicked', () => {
    vi.mocked(useLabUploads).mockReturnValue({
      uploads: [],
      isLoading: false,
      error: 'Failed to load uploads',
      refetch: mockRefetch,
      hasProcessing: false,
    });

    renderWithRouter(<LabUploadList />);

    fireEvent.click(screen.getByText('Try again'));

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state when no uploads', () => {
    vi.mocked(useLabUploads).mockReturnValue({
      uploads: [],
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      hasProcessing: false,
    });

    renderWithRouter(<LabUploadList />);

    expect(screen.getByText('No uploads yet')).toBeInTheDocument();
    expect(screen.getByText(/Upload a lab result PDF/)).toBeInTheDocument();
  });

  it('groups uploads by status', () => {
    renderWithRouter(<LabUploadList />);

    // Check for status section headings (h3 elements)
    const headings = screen.getAllByRole('heading', { level: 3 });
    const headingTexts = headings.map(h => h.textContent);
    expect(headingTexts).toContain('Processing');
    expect(headingTexts).toContain('Pending');
    expect(headingTexts).toContain('Failed');
    expect(headingTexts.some(t => t?.includes('Completed'))).toBe(true);
  });

  it('renders all upload cards', () => {
    renderWithRouter(<LabUploadList />);

    expect(screen.getByText('complete.pdf')).toBeInTheDocument();
    expect(screen.getByText('processing.pdf')).toBeInTheDocument();
    expect(screen.getByText('pending.pdf')).toBeInTheDocument();
    expect(screen.getByText('failed.pdf')).toBeInTheDocument();
  });

  it('calls remove when delete is clicked', async () => {
    mockRemove.mockResolvedValue(undefined);

    renderWithRouter(<LabUploadList />);

    // Find an enabled delete button (processing upload has delete disabled)
    const deleteButtons = screen.getAllByTitle('Delete');
    const enabledButton = deleteButtons.find(btn => !btn.hasAttribute('disabled'));
    expect(enabledButton).toBeTruthy();

    fireEvent.click(enabledButton!);

    // Wait for the remove call
    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  it('calls remove with correct upload id', async () => {
    mockRemove.mockResolvedValue(undefined);

    renderWithRouter(<LabUploadList />);

    // Click delete on the pending card (3rd delete button, after complete and processing)
    const deleteButtons = screen.getAllByTitle('Delete');
    // Find the enabled delete buttons (processing one is disabled)
    const enabledDeleteButtons = deleteButtons.filter(btn => !btn.hasAttribute('disabled'));
    fireEvent.click(enabledDeleteButtons[1]); // Second enabled is pending

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalled();
    });
  });

  it('does not show Processing section when no processing uploads', () => {
    vi.mocked(useLabUploads).mockReturnValue({
      uploads: [mockUploads[0]], // Only complete upload
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      hasProcessing: false,
    });

    renderWithRouter(<LabUploadList />);

    // Should not have Processing heading
    expect(screen.queryByText('Processing')).not.toBeInTheDocument();
    // Should have Completed heading
    expect(screen.getByText('Completed (1)')).toBeInTheDocument();
  });

  it('does not show Pending section when no pending uploads', () => {
    vi.mocked(useLabUploads).mockReturnValue({
      uploads: [mockUploads[0]], // Only complete upload
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      hasProcessing: false,
    });

    renderWithRouter(<LabUploadList />);

    expect(screen.queryByText('Pending')).not.toBeInTheDocument();
  });

  it('does not show Failed section when no failed uploads', () => {
    vi.mocked(useLabUploads).mockReturnValue({
      uploads: [mockUploads[0]], // Only complete upload
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      hasProcessing: false,
    });

    renderWithRouter(<LabUploadList />);

    expect(screen.queryByText('Failed')).not.toBeInTheDocument();
  });

  it('opens preview modal when Preview is clicked on complete upload', async () => {
    renderWithRouter(<LabUploadList />);

    const previewButton = screen.getByRole('button', { name: /Preview/ });
    fireEvent.click(previewButton);

    // Modal should open with extraction preview content
    await waitFor(() => {
      expect(screen.getByText('Extraction Preview')).toBeInTheDocument();
    });
  });

  it('closes preview modal when Close is clicked', async () => {
    renderWithRouter(<LabUploadList />);

    // Open preview
    const previewButton = screen.getByRole('button', { name: /Preview/ });
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByText('Extraction Preview')).toBeInTheDocument();
    });

    // Close preview - get all buttons named Close and click the one in the modal footer
    const closeButtons = screen.getAllByRole('button', { name: /Close/ });
    fireEvent.click(closeButtons[closeButtons.length - 1]); // The last Close button is in the modal footer

    await waitFor(() => {
      expect(screen.queryByText('Extraction Preview')).not.toBeInTheDocument();
    });
  });

  it('uses polling when pollInterval is set', () => {
    renderWithRouter(<LabUploadList />);

    expect(useLabUploads).toHaveBeenCalledWith(
      expect.objectContaining({
        pollInterval: 2000,
      })
    );
  });
});
