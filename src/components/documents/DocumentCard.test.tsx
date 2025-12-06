import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DocumentCard } from './DocumentCard';
import type { Document } from '@/types';

// Mock useSendToLabUploads
vi.mock('@/hooks/useSendToLabUploads', () => ({
  useSendToLabUploads: () => ({
    sendToLabUploads: vi.fn().mockResolvedValue({ id: 'lab-upload-1' }),
    isSending: false,
    error: null,
    clearError: vi.fn(),
  }),
}));

const mockLabDocument: Document = {
  id: 'doc-1',
  userId: 'user-123',
  filename: 'lab-results.pdf',
  storagePath: 'user-123/doc-1.pdf',
  fileSize: 1024000,
  mimeType: 'application/pdf',
  category: 'labs',
  title: 'Blood Test January',
  description: null,
  documentDate: '2024-01-15',
  labUploadId: null,
  createdAt: '2024-01-15T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
};

const mockImageDocument: Document = {
  ...mockLabDocument,
  id: 'doc-2',
  filename: 'scan.jpg',
  mimeType: 'image/jpeg',
  category: 'imaging',
  title: 'X-Ray Scan',
};

const mockPrescriptionDocument: Document = {
  ...mockLabDocument,
  id: 'doc-3',
  filename: 'prescription.pdf',
  category: 'prescriptions',
  title: null,
};

const mockExtractedDocument: Document = {
  ...mockLabDocument,
  id: 'doc-4',
  labUploadId: 'lab-upload-1',
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DocumentCard', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);
  const mockOnView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders document with title', () => {
    renderWithRouter(
      <DocumentCard
        document={mockLabDocument}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Blood Test January')).toBeInTheDocument();
    expect(screen.getByText('lab-results.pdf')).toBeInTheDocument();
  });

  it('renders document filename when no title', () => {
    renderWithRouter(
      <DocumentCard
        document={mockPrescriptionDocument}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('prescription.pdf')).toBeInTheDocument();
  });

  it('shows file size and date', () => {
    renderWithRouter(
      <DocumentCard
        document={mockLabDocument}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // File size should be displayed (1000KB = ~1MB)
    expect(screen.getByText(/1000.0 KB/)).toBeInTheDocument();
    // Date should be displayed (new format: "Jan 15, 2024")
    expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    renderWithRouter(
      <DocumentCard
        document={mockLabDocument}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const editButton = screen.getByTitle('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockLabDocument);
  });

  it('calls onDelete when delete button clicked', () => {
    renderWithRouter(
      <DocumentCard
        document={mockLabDocument}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(mockLabDocument.id);
  });

  it('calls onView when view button clicked', () => {
    renderWithRouter(
      <DocumentCard
        document={mockLabDocument}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const viewButton = screen.getByTitle('View');
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockLabDocument);
  });

  it('shows Extract Biomarkers button for lab PDFs without extraction', () => {
    renderWithRouter(
      <DocumentCard
        document={mockLabDocument}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Extract Biomarkers')).toBeInTheDocument();
  });

  it('shows View Extraction Results for already extracted documents', () => {
    renderWithRouter(
      <DocumentCard
        document={mockExtractedDocument}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('View Extraction Results')).toBeInTheDocument();
    expect(screen.queryByText('Extract Biomarkers')).not.toBeInTheDocument();
  });

  it('does not show extract button for non-lab documents', () => {
    renderWithRouter(
      <DocumentCard
        document={mockPrescriptionDocument}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.queryByText('Extract Biomarkers')).not.toBeInTheDocument();
    expect(screen.queryByText('View Extraction Results')).not.toBeInTheDocument();
  });

  it('does not show extract button for image documents in labs', () => {
    const labImage = { ...mockLabDocument, mimeType: 'image/jpeg' };

    renderWithRouter(
      <DocumentCard
        document={labImage}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.queryByText('Extract Biomarkers')).not.toBeInTheDocument();
  });

  it('disables delete button when isDeleting is true', () => {
    renderWithRouter(
      <DocumentCard
        document={mockLabDocument}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        isDeleting={true}
      />
    );

    const deleteButton = screen.getByTitle('Delete');
    expect(deleteButton).toBeDisabled();
  });

});
