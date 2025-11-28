import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LabUploadDropzone } from './LabUploadDropzone';

// Mock the hook
vi.mock('@/hooks/useLabUploadProcessor', () => ({
  useLabUploadProcessor: vi.fn(),
}));

import { useLabUploadProcessor } from '@/hooks/useLabUploadProcessor';

describe('LabUploadDropzone', () => {
  const mockUploadAndProcess = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useLabUploadProcessor).mockReturnValue({
      uploadAndProcess: mockUploadAndProcess,
      isUploading: false,
      uploadProgress: 0,
      processingUploadId: null,
      processingStage: null,
      error: null,
      clearError: mockClearError,
    });
  });

  it('renders upload instructions', () => {
    render(<LabUploadDropzone />);
    expect(screen.getByText(/Click to upload/)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/)).toBeInTheDocument();
    expect(screen.getByText(/PDF files only/)).toBeInTheDocument();
  });

  it('renders skip verification checkbox', () => {
    render(<LabUploadDropzone />);
    expect(screen.getByLabelText(/Skip GPT verification/)).toBeInTheDocument();
  });

  it('calls uploadAndProcess when file is selected', async () => {
    const user = userEvent.setup();
    mockUploadAndProcess.mockResolvedValue({ id: 'upload-1' });

    render(<LabUploadDropzone />);

    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    expect(mockUploadAndProcess).toHaveBeenCalledWith(file, false);
  });

  it('passes skipVerification when checkbox is checked', async () => {
    const user = userEvent.setup();
    mockUploadAndProcess.mockResolvedValue({ id: 'upload-1' });

    render(<LabUploadDropzone />);

    // Check the skip verification checkbox
    const checkbox = screen.getByLabelText(/Skip GPT verification/);
    await user.click(checkbox);

    // Upload file
    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    expect(mockUploadAndProcess).toHaveBeenCalledWith(file, true);
  });

  it('calls onUploadComplete callback after successful upload', async () => {
    const user = userEvent.setup();
    const onUploadComplete = vi.fn();
    mockUploadAndProcess.mockResolvedValue({ id: 'upload-1' });

    render(<LabUploadDropzone onUploadComplete={onUploadComplete} />);

    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalled();
    });
  });

  it('shows uploading state', () => {
    vi.mocked(useLabUploadProcessor).mockReturnValue({
      uploadAndProcess: mockUploadAndProcess,
      isUploading: true,
      uploadProgress: 50,
      processingUploadId: null,
      processingStage: null,
      error: null,
      clearError: mockClearError,
    });

    render(<LabUploadDropzone />);

    expect(screen.getByText(/Uploading... 50%/)).toBeInTheDocument();
  });

  it('returns to default state during processing (processing shown in list)', () => {
    // After upload completes, dropzone returns to default state
    // Processing status is shown in the uploads list instead
    vi.mocked(useLabUploadProcessor).mockReturnValue({
      uploadAndProcess: mockUploadAndProcess,
      isUploading: false,
      uploadProgress: 100,
      processingUploadId: 'upload-1',
      processingStage: 'extracting_gemini',
      error: null,
      clearError: mockClearError,
    });

    render(<LabUploadDropzone />);

    // Should show default upload instructions, not processing state
    expect(screen.getByText(/Click to upload/)).toBeInTheDocument();
    expect(screen.queryByText(/Extracting with Gemini.../)).not.toBeInTheDocument();
  });

  it('shows error message', () => {
    vi.mocked(useLabUploadProcessor).mockReturnValue({
      uploadAndProcess: mockUploadAndProcess,
      isUploading: false,
      uploadProgress: 0,
      processingUploadId: null,
      processingStage: null,
      error: 'Only PDF files are allowed',
      clearError: mockClearError,
    });

    render(<LabUploadDropzone />);

    expect(screen.getByText('Only PDF files are allowed')).toBeInTheDocument();
  });

  it('disables interaction when disabled prop is true', () => {
    render(<LabUploadDropzone disabled />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();

    const checkbox = screen.getByLabelText(/Skip GPT verification/);
    expect(checkbox).toBeDisabled();
  });

  it('disables interaction when busy uploading', () => {
    vi.mocked(useLabUploadProcessor).mockReturnValue({
      uploadAndProcess: mockUploadAndProcess,
      isUploading: true,
      uploadProgress: 50,
      processingUploadId: null,
      processingStage: null,
      error: null,
      clearError: mockClearError,
    });

    render(<LabUploadDropzone />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();

    const checkbox = screen.getByLabelText(/Skip GPT verification/);
    expect(checkbox).toBeDisabled();
  });

  it('handles drag and drop', async () => {
    mockUploadAndProcess.mockResolvedValue({ id: 'upload-1' });

    render(<LabUploadDropzone />);

    const dropzone = screen.getByText(/Click to upload/).closest('div')!;

    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = {
      files: [file],
      types: ['Files'],
    };

    // Drag over
    fireEvent.dragOver(dropzone, { dataTransfer });

    // Drop
    fireEvent.drop(dropzone, { dataTransfer });

    await waitFor(() => {
      expect(mockUploadAndProcess).toHaveBeenCalledWith(file, false);
    });
  });

  it('ignores non-PDF files on drop', () => {
    render(<LabUploadDropzone />);

    const dropzone = screen.getByText(/Click to upload/).closest('div')!;

    const file = new File(['content'], 'test.docx', { type: 'application/msword' });
    const dataTransfer = {
      files: [file],
      types: ['Files'],
    };

    fireEvent.drop(dropzone, { dataTransfer });

    expect(mockUploadAndProcess).not.toHaveBeenCalled();
  });

  it('clears error before new upload', async () => {
    const user = userEvent.setup();
    mockUploadAndProcess.mockResolvedValue({ id: 'upload-1' });

    render(<LabUploadDropzone />);

    const file = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);

    expect(mockClearError).toHaveBeenCalled();
  });

  it('applies dragging styles when file is dragged over', () => {
    render(<LabUploadDropzone />);

    const dropzone = screen.getByText(/Click to upload/).closest('div')!;

    fireEvent.dragOver(dropzone, {
      dataTransfer: { types: ['Files'] },
    });

    expect(dropzone).toHaveClass('border-blue-500');
  });

  it('removes dragging styles when file leaves', () => {
    render(<LabUploadDropzone />);

    const dropzone = screen.getByText(/Click to upload/).closest('div')!;

    fireEvent.dragOver(dropzone, {
      dataTransfer: { types: ['Files'] },
    });

    fireEvent.dragLeave(dropzone, {
      dataTransfer: { types: ['Files'] },
    });

    expect(dropzone).not.toHaveClass('border-blue-500');
  });

});
