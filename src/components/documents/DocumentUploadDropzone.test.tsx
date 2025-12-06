import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentUploadDropzone } from './DocumentUploadDropzone';
import type { Document } from '@/types';

// Mock useDocumentUpload
const mockUpload = vi.fn();
const mockClearError = vi.fn();

vi.mock('@/hooks/useDocumentUpload', () => ({
  useDocumentUpload: () => ({
    upload: mockUpload,
    isUploading: false,
    uploadProgress: 0,
    error: null,
    clearError: mockClearError,
  }),
}));

const mockDocument: Document = {
  id: 'doc-1',
  userId: 'user-123',
  filename: 'test.pdf',
  storagePath: 'user-123/doc-1.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  category: 'labs',
  title: null,
  description: null,
  documentDate: null,
  labUploadId: null,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

describe('DocumentUploadDropzone', () => {
  const mockOnUploadComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpload.mockResolvedValue(mockDocument);
  });

  it('renders dropzone with instructions', () => {
    render(<DocumentUploadDropzone />);

    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/)).toBeInTheDocument();
    expect(screen.getByText(/PDF or images/)).toBeInTheDocument();
  });

  it('renders category selector', () => {
    render(<DocumentUploadDropzone />);

    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('renders optional metadata fields', () => {
    render(<DocumentUploadDropzone />);

    expect(screen.getByLabelText('Title (optional)')).toBeInTheDocument();
    expect(screen.getByLabelText('Document Date (optional)')).toBeInTheDocument();
  });

  it('defaults to "other" category', () => {
    render(<DocumentUploadDropzone />);

    const select = screen.getByLabelText('Category') as HTMLSelectElement;
    expect(select.value).toBe('other');
  });

  it('uses defaultCategory prop', () => {
    render(<DocumentUploadDropzone defaultCategory="labs" />);

    const select = screen.getByLabelText('Category') as HTMLSelectElement;
    expect(select.value).toBe('labs');
  });

  it('allows changing category', () => {
    render(<DocumentUploadDropzone />);

    const select = screen.getByLabelText('Category');
    fireEvent.change(select, { target: { value: 'prescriptions' } });

    expect((select as HTMLSelectElement).value).toBe('prescriptions');
  });

  it('allows entering title', () => {
    render(<DocumentUploadDropzone />);

    const input = screen.getByLabelText('Title (optional)');
    fireEvent.change(input, { target: { value: 'My Lab Results' } });

    expect((input as HTMLInputElement).value).toBe('My Lab Results');
  });

  it('allows entering document date', () => {
    render(<DocumentUploadDropzone />);

    const input = screen.getByLabelText('Document Date (optional)');
    fireEvent.change(input, { target: { value: '2024-01-15' } });

    expect((input as HTMLInputElement).value).toBe('2024-01-15');
  });

  it('calls upload when file is dropped', async () => {
    render(<DocumentUploadDropzone onUploadComplete={mockOnUploadComplete} />);

    const dropzone = screen.getByText('Click to upload').closest('div')!;
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    const dataTransfer = {
      files: [file],
      types: ['Files'],
    };

    fireEvent.drop(dropzone, { dataTransfer });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(
        file,
        'other',
        expect.objectContaining({})
      );
    });
  });

  it('calls onUploadComplete after successful upload', async () => {
    render(<DocumentUploadDropzone onUploadComplete={mockOnUploadComplete} />);

    const dropzone = screen.getByText('Click to upload').closest('div')!;
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], types: ['Files'] },
    });

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalled();
    });
  });

  it('resets form fields after successful upload', async () => {
    render(<DocumentUploadDropzone />);

    // Fill in fields
    const titleInput = screen.getByLabelText('Title (optional)');
    const dateInput = screen.getByLabelText('Document Date (optional)');

    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

    // Upload
    const dropzone = screen.getByText('Click to upload').closest('div')!;
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], types: ['Files'] },
    });

    await waitFor(() => {
      expect((titleInput as HTMLInputElement).value).toBe('');
      expect((dateInput as HTMLInputElement).value).toBe('');
    });
  });

  it('ignores non-allowed file types on drop', async () => {
    render(<DocumentUploadDropzone />);

    const dropzone = screen.getByText('Click to upload').closest('div')!;
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file], types: ['Files'] },
    });

    await new Promise((r) => setTimeout(r, 100));
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('disables inputs when disabled prop is true', () => {
    render(<DocumentUploadDropzone disabled />);

    expect(screen.getByLabelText('Category')).toBeDisabled();
    expect(screen.getByLabelText('Title (optional)')).toBeDisabled();
    expect(screen.getByLabelText('Document Date (optional)')).toBeDisabled();
  });

  it('shows drag over state', () => {
    render(<DocumentUploadDropzone />);

    const dropzone = screen.getByText('Click to upload').closest('div')!;

    fireEvent.dragOver(dropzone);

    // The dropzone should have the dragging state class
    expect(dropzone).toHaveClass('border-blue-500');
  });

  it('clears drag state on drag leave', () => {
    render(<DocumentUploadDropzone />);

    const dropzone = screen.getByText('Click to upload').closest('div')!;

    fireEvent.dragOver(dropzone);
    expect(dropzone).toHaveClass('border-blue-500');

    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass('border-blue-500');
  });
});
