import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LabUploadsPage } from './LabUploadsPage';

// Mock hooks
vi.mock('@/hooks/useRequireProfile', () => ({
  useRequireProfile: vi.fn(),
}));

// Mock components
vi.mock('@/components/layout', () => ({
  PageWrapper: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-wrapper" data-title={title}>{children}</div>
  ),
}));

vi.mock('@/components/common', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
  Button: ({ children, variant, size }: { children: React.ReactNode; variant?: string; size?: string }) => (
    <button data-variant={variant} data-size={size}>{children}</button>
  ),
  FullPageSpinner: () => <div data-testid="full-page-spinner">Loading...</div>,
}));

vi.mock('@/components/labUpload', () => ({
  LabUploadDropzone: ({ onUploadComplete }: { onUploadComplete: () => void }) => (
    <div data-testid="lab-upload-dropzone">
      <button onClick={onUploadComplete}>Complete Upload</button>
    </div>
  ),
  LabUploadList: ({ onRefetchRef }: { onRefetchRef: (fn: () => Promise<void>) => void }) => {
    // Simulate providing refetch function
    const mockRefetch = vi.fn().mockResolvedValue(undefined);
    onRefetchRef(mockRefetch);
    return <div data-testid="lab-upload-list">Upload List</div>;
  },
}));

import { useRequireProfile } from '@/hooks/useRequireProfile';

const mockUseRequireProfile = vi.mocked(useRequireProfile);

const renderWithRouter = () => {
  return render(
    <MemoryRouter>
      <LabUploadsPage />
    </MemoryRouter>
  );
};

describe('LabUploadsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('profile loading', () => {
    it('shows full page spinner while profile is loading', () => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: true,
        isComplete: false,
        profile: null,
      });

      renderWithRouter();

      expect(screen.getByTestId('full-page-spinner')).toBeInTheDocument();
    });

    it('returns null when profile is not complete', () => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: false,
        profile: null,
      });

      const { container } = renderWithRouter();

      expect(container.firstChild).toBeNull();
    });
  });

  describe('page structure', () => {
    beforeEach(() => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John' },
      });
    });

    it('renders page wrapper with title', () => {
      renderWithRouter();

      expect(screen.getByTestId('page-wrapper')).toHaveAttribute('data-title', 'Lab Uploads');
    });

    it('renders dashboard back link', () => {
      renderWithRouter();

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders biomarker reference link', () => {
      renderWithRouter();

      expect(screen.getByText('Biomarker Reference')).toBeInTheDocument();
    });
  });

  describe('page description', () => {
    beforeEach(() => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John' },
      });
    });

    it('renders page title', () => {
      renderWithRouter();

      expect(screen.getByText('Upload Lab Results')).toBeInTheDocument();
    });

    it('renders page description text', () => {
      renderWithRouter();

      expect(screen.getByText(/Upload your lab result PDFs here/)).toBeInTheDocument();
      expect(screen.getByText(/Our AI will extract biomarkers/)).toBeInTheDocument();
    });
  });

  describe('upload zone', () => {
    beforeEach(() => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John' },
      });
    });

    it('renders upload section title', () => {
      renderWithRouter();

      expect(screen.getByText('Upload PDF')).toBeInTheDocument();
    });

    it('renders lab upload dropzone', () => {
      renderWithRouter();

      expect(screen.getByTestId('lab-upload-dropzone')).toBeInTheDocument();
    });
  });

  describe('uploads list', () => {
    beforeEach(() => {
      mockUseRequireProfile.mockReturnValue({
        isLoading: false,
        isComplete: true,
        profile: { displayName: 'John' },
      });
    });

    it('renders uploads section title', () => {
      renderWithRouter();

      expect(screen.getByText('Your Uploads')).toBeInTheDocument();
    });

    it('renders lab upload list', () => {
      renderWithRouter();

      expect(screen.getByTestId('lab-upload-list')).toBeInTheDocument();
    });
  });
});
