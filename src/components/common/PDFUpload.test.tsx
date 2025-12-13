import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PDFUpload, ExtractionStatus } from './PDFUpload';
import type { LabResultAttachment } from '@/types/events';

const mockAttachment: LabResultAttachment = {
  filename: 'blood-test-results.pdf',
  storagePath: 'uploads/user-123/blood-test-results.pdf',
  url: 'https://storage.example.com/uploads/user-123/blood-test-results.pdf',
  uploadedAt: '2024-01-15T10:00:00Z',
  mimeType: 'application/pdf',
  size: 102400,
};

describe('PDFUpload', () => {
  const mockOnUpload = vi.fn();
  const mockOnDelete = vi.fn();

  const defaultProps = {
    attachment: null,
    onUpload: mockOnUpload,
    onDelete: mockOnDelete,
    isUploading: false,
    uploadProgress: 0,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('upload zone rendering', () => {
    it('renders upload zone when no attachment', () => {
      render(<PDFUpload {...defaultProps} />);
      expect(screen.getByText(/Click to upload/)).toBeInTheDocument();
      expect(screen.getByText(/drag and drop/)).toBeInTheDocument();
    });

    it('shows file type hint', () => {
      render(<PDFUpload {...defaultProps} />);
      expect(screen.getByText(/PDF files only/)).toBeInTheDocument();
    });

    it('shows max file size hint', () => {
      render(<PDFUpload {...defaultProps} />);
      expect(screen.getByText(/max 10MB/)).toBeInTheDocument();
    });

    it('has hidden file input', () => {
      render(<PDFUpload {...defaultProps} />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass('hidden');
    });

    it('file input accepts only PDFs', () => {
      render(<PDFUpload {...defaultProps} />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveAttribute('accept', 'application/pdf');
    });
  });

  describe('file selection', () => {
    it('triggers onUpload when file is selected', async () => {
      mockOnUpload.mockResolvedValue(mockAttachment);
      render(<PDFUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });

      await userEvent.upload(input, file);

      expect(mockOnUpload).toHaveBeenCalledWith(file);
    });

    it('opens file dialog when upload zone is clicked', async () => {
      render(<PDFUpload {...defaultProps} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      const uploadZone = screen.getByText(/Click to upload/).closest('div');
      fireEvent.click(uploadZone!);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('does not open file dialog when disabled', () => {
      render(<PDFUpload {...defaultProps} disabled />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      const uploadZone = screen.getByText(/Click to upload/).closest('div');
      fireEvent.click(uploadZone!);

      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('does not open file dialog when uploading', () => {
      render(<PDFUpload {...defaultProps} isUploading uploadProgress={50} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(input, 'click');

      // Find any clickable area
      const uploadingText = screen.getByText(/Uploading/);
      fireEvent.click(uploadingText.closest('div')!);

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe('drag and drop', () => {
    it('shows drag state when dragging over', () => {
      const { container } = render(<PDFUpload {...defaultProps} />);
      const dropZone = container.querySelector('.border-dashed');

      fireEvent.dragOver(dropZone!);

      expect(dropZone).toHaveClass('border-accent');
      expect(dropZone).toHaveClass('bg-info-muted');
    });

    it('removes drag state when leaving', () => {
      const { container } = render(<PDFUpload {...defaultProps} />);
      const dropZone = container.querySelector('.border-dashed');

      fireEvent.dragOver(dropZone!);
      fireEvent.dragLeave(dropZone!);

      expect(dropZone).not.toHaveClass('border-accent');
    });

    it('triggers upload on drop', async () => {
      mockOnUpload.mockResolvedValue(mockAttachment);
      const { container } = render(<PDFUpload {...defaultProps} />);
      const dropZone = container.querySelector('.border-dashed');

      const file = new File(['pdf content'], 'dropped.pdf', { type: 'application/pdf' });
      const dataTransfer = {
        files: [file],
      };

      fireEvent.drop(dropZone!, { dataTransfer });

      await waitFor(() => {
        expect(mockOnUpload).toHaveBeenCalledWith(file);
      });
    });

    it('ignores non-PDF files on drop', () => {
      const { container } = render(<PDFUpload {...defaultProps} />);
      const dropZone = container.querySelector('.border-dashed');

      const file = new File(['text content'], 'test.txt', { type: 'text/plain' });
      const dataTransfer = {
        files: [file],
      };

      fireEvent.drop(dropZone!, { dataTransfer });

      expect(mockOnUpload).not.toHaveBeenCalled();
    });
  });

  describe('uploading state', () => {
    it('shows uploading message', () => {
      render(<PDFUpload {...defaultProps} isUploading uploadProgress={45} />);
      expect(screen.getByText(/Uploading/)).toBeInTheDocument();
    });

    it('shows upload progress percentage', () => {
      render(<PDFUpload {...defaultProps} isUploading uploadProgress={45} />);
      expect(screen.getByText(/45%/)).toBeInTheDocument();
    });

    it('shows progress bar', () => {
      const { container } = render(<PDFUpload {...defaultProps} isUploading uploadProgress={60} />);
      const progressBar = container.querySelector('.bg-accent');
      expect(progressBar).toHaveStyle({ width: '60%' });
    });

    it('shows spinner when uploading', () => {
      const { container } = render(<PDFUpload {...defaultProps} isUploading uploadProgress={30} />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('error display', () => {
    it('shows error message when error prop is set', () => {
      render(<PDFUpload {...defaultProps} error="File too large" />);
      expect(screen.getByText('File too large')).toBeInTheDocument();
    });

    it('shows error with alert icon', () => {
      const { container } = render(<PDFUpload {...defaultProps} error="Upload failed" />);
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
      // Check for danger text styling
      const errorDiv = screen.getByText('Upload failed').closest('div');
      expect(errorDiv).toHaveClass('text-danger');
    });
  });

  describe('attachment display', () => {
    it('shows attachment filename', () => {
      render(<PDFUpload {...defaultProps} attachment={mockAttachment} />);
      expect(screen.getByText('blood-test-results.pdf')).toBeInTheDocument();
    });

    it('shows upload date', () => {
      render(<PDFUpload {...defaultProps} attachment={mockAttachment} />);
      expect(screen.getByText(/Uploaded/)).toBeInTheDocument();
    });

    it('shows view link', () => {
      render(<PDFUpload {...defaultProps} attachment={mockAttachment} />);
      const viewLink = screen.getByText('View');
      expect(viewLink).toHaveAttribute('href', mockAttachment.url);
      expect(viewLink).toHaveAttribute('target', '_blank');
    });

    it('shows delete button', () => {
      render(<PDFUpload {...defaultProps} attachment={mockAttachment} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('calls onDelete when delete button is clicked', async () => {
      mockOnDelete.mockResolvedValue(undefined);
      render(<PDFUpload {...defaultProps} attachment={mockAttachment} />);

      const deleteButton = screen.getByRole('button');
      await userEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith(mockAttachment.storagePath);
    });

    it('disables delete button when disabled', () => {
      render(<PDFUpload {...defaultProps} attachment={mockAttachment} disabled />);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows loading state during deletion', async () => {
      mockOnDelete.mockImplementation(() => new Promise(() => {})); // Never resolves
      const { container } = render(<PDFUpload {...defaultProps} attachment={mockAttachment} />);

      const deleteButton = screen.getByRole('button');
      await userEvent.click(deleteButton);

      await waitFor(() => {
        const spinner = container.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
      });
    });
  });

  describe('disabled state', () => {
    it('applies disabled styling to upload zone', () => {
      const { container } = render(<PDFUpload {...defaultProps} disabled />);
      const dropZone = container.querySelector('.border-dashed');
      expect(dropZone).toHaveClass('opacity-50');
      expect(dropZone).toHaveClass('cursor-not-allowed');
    });

    it('disables file input when disabled', () => {
      render(<PDFUpload {...defaultProps} disabled />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeDisabled();
    });
  });
});

describe('ExtractionStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('idle state', () => {
    it('renders nothing when idle', () => {
      const { container } = render(<ExtractionStatus extractionStage="idle" />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('active extraction stages', () => {
    it('shows uploading message', () => {
      render(<ExtractionStatus extractionStage="uploading" />);
      expect(screen.getByText('Uploading PDF...')).toBeInTheDocument();
    });

    it('shows fetching message', () => {
      render(<ExtractionStatus extractionStage="fetching_pdf" />);
      expect(screen.getByText('Fetching PDF from storage...')).toBeInTheDocument();
    });

    it('shows Gemini extraction message', () => {
      render(<ExtractionStatus extractionStage="extracting_gemini" />);
      expect(screen.getByText(/Stage 1.*Gemini/i)).toBeInTheDocument();
    });

    it('shows GPT verification message', () => {
      render(<ExtractionStatus extractionStage="verifying_gpt" />);
      expect(screen.getByText(/Stage 2.*Verifying/i)).toBeInTheDocument();
    });

    it('shows spinner during active stages', () => {
      const { container } = render(<ExtractionStatus extractionStage="uploading" />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('displays elapsed time when startTime provided', () => {
      const startTime = Date.now() - 5000; // 5 seconds ago
      render(<ExtractionStatus extractionStage="extracting_gemini" startTime={startTime} />);

      // Advance timer to update elapsed time
      vi.advanceTimersByTime(1000);

      expect(screen.getByText(/0:0[5-6]/)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message', () => {
      render(<ExtractionStatus extractionStage="error" />);
      expect(screen.getByText('Extraction failed')).toBeInTheDocument();
    });

    it('has danger styling for error', () => {
      render(<ExtractionStatus extractionStage="error" />);
      const errorDiv = screen.getByText('Extraction failed').closest('div');
      expect(errorDiv).toHaveClass('text-danger');
      expect(errorDiv).toHaveClass('bg-danger-muted');
    });
  });

  describe('complete state', () => {
    it('shows success message when verification passed', () => {
      render(
        <ExtractionStatus
          extractionStage="complete"
          verificationPassed={true}
          corrections={[]}
        />
      );
      expect(screen.getByText('Extraction verified successfully')).toBeInTheDocument();
    });

    it('shows biomarker count when provided', () => {
      render(
        <ExtractionStatus
          extractionStage="complete"
          verificationPassed={true}
          corrections={[]}
          biomarkerCount={15}
        />
      );
      expect(screen.getByText(/Extracted 15 biomarkers/)).toBeInTheDocument();
    });

    it('uses singular form for single biomarker', () => {
      render(
        <ExtractionStatus
          extractionStage="complete"
          verificationPassed={true}
          corrections={[]}
          biomarkerCount={1}
        />
      );
      expect(screen.getByText(/Extracted 1 biomarker$/)).toBeInTheDocument();
    });

    it('shows corrections when present', () => {
      render(
        <ExtractionStatus
          extractionStage="complete"
          verificationPassed={true}
          corrections={['Fixed glucose value', 'Corrected cholesterol unit']}
        />
      );
      expect(screen.getByText(/2 fixes/)).toBeInTheDocument();
      expect(screen.getByText('Fixed glucose value')).toBeInTheDocument();
      expect(screen.getByText('Corrected cholesterol unit')).toBeInTheDocument();
    });

    it('shows singular fix text for single correction', () => {
      render(
        <ExtractionStatus
          extractionStage="complete"
          verificationPassed={true}
          corrections={['Fixed value']}
        />
      );
      expect(screen.getByText(/1 fix\)/)).toBeInTheDocument();
    });

    it('has warning styling for corrections', () => {
      render(
        <ExtractionStatus
          extractionStage="complete"
          verificationPassed={true}
          corrections={['Fix 1']}
        />
      );
      const correctionDiv = screen.getByText(/corrected/i).closest('div');
      expect(correctionDiv).toHaveClass('text-warning');
      expect(correctionDiv).toHaveClass('bg-warning-muted');
    });

    it('has success styling for successful verification', () => {
      render(
        <ExtractionStatus
          extractionStage="complete"
          verificationPassed={true}
          corrections={[]}
        />
      );
      const successDiv = screen.getByText(/verified successfully/).closest('div');
      expect(successDiv).toHaveClass('text-success');
      expect(successDiv).toHaveClass('bg-success-muted');
    });
  });
});
