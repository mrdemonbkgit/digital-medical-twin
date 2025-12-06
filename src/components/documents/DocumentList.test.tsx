import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DocumentList } from './DocumentList';
import type { Document } from '@/types';

// Mock DocumentCard to avoid nested complexity
vi.mock('./DocumentCard', () => ({
  DocumentCard: ({ document, onEdit, onDelete, onView }: any) => (
    <div data-testid={`doc-card-${document.id}`}>
      <span>{document.title || document.filename}</span>
      <span data-testid="category">{document.category}</span>
      <button onClick={() => onEdit(document)}>Edit</button>
      <button onClick={() => onDelete(document.id)}>Delete</button>
      <button onClick={() => onView(document)}>View</button>
    </div>
  ),
}));

const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    userId: 'user-123',
    filename: 'lab-results.pdf',
    storagePath: 'user-123/doc-1.pdf',
    fileSize: 1024000,
    mimeType: 'application/pdf',
    category: 'labs',
    title: 'Blood Test',
    description: null,
    documentDate: '2024-01-15',
    labUploadId: null,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: 'doc-2',
    userId: 'user-123',
    filename: 'prescription.pdf',
    storagePath: 'user-123/doc-2.pdf',
    fileSize: 512000,
    mimeType: 'application/pdf',
    category: 'prescriptions',
    title: 'Monthly Prescription',
    description: null,
    documentDate: null,
    labUploadId: null,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: 'doc-3',
    userId: 'user-123',
    filename: 'another-lab.pdf',
    storagePath: 'user-123/doc-3.pdf',
    fileSize: 256000,
    mimeType: 'application/pdf',
    category: 'labs',
    title: 'Cholesterol Panel',
    description: null,
    documentDate: '2024-01-20',
    labUploadId: null,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('DocumentList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);
  const mockOnView = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    renderWithRouter(
      <DocumentList
        documents={[]}
        isLoading={true}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('Loading documents...')).toBeInTheDocument();
  });

  it('shows empty state when no documents', () => {
    renderWithRouter(
      <DocumentList
        documents={[]}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByText('No documents yet')).toBeInTheDocument();
    expect(screen.getByText('Upload your first document above')).toBeInTheDocument();
  });

  it('renders all documents', () => {
    renderWithRouter(
      <DocumentList
        documents={mockDocuments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    expect(screen.getByTestId('doc-card-doc-1')).toBeInTheDocument();
    expect(screen.getByTestId('doc-card-doc-2')).toBeInTheDocument();
    expect(screen.getByTestId('doc-card-doc-3')).toBeInTheDocument();
  });

  it('shows category tabs with counts', () => {
    renderWithRouter(
      <DocumentList
        documents={mockDocuments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // All tab shows total count
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Labs tab shows 2
    expect(screen.getByText('Labs')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    // Prescriptions tab shows 1
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('filters documents by category when tab clicked', () => {
    renderWithRouter(
      <DocumentList
        documents={mockDocuments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // Initially all documents shown
    expect(screen.getByTestId('doc-card-doc-1')).toBeInTheDocument();
    expect(screen.getByTestId('doc-card-doc-2')).toBeInTheDocument();
    expect(screen.getByTestId('doc-card-doc-3')).toBeInTheDocument();

    // Click Labs tab
    fireEvent.click(screen.getByText('Labs'));

    // Only lab documents should be visible
    expect(screen.getByTestId('doc-card-doc-1')).toBeInTheDocument();
    expect(screen.getByTestId('doc-card-doc-3')).toBeInTheDocument();
    expect(screen.queryByTestId('doc-card-doc-2')).not.toBeInTheDocument();
  });

  it('hides empty category tabs', () => {
    renderWithRouter(
      <DocumentList
        documents={mockDocuments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    // These categories have no documents
    expect(screen.queryByText('Imaging')).not.toBeInTheDocument();
    expect(screen.queryByText('Discharge Summaries')).not.toBeInTheDocument();
    expect(screen.queryByText('Insurance')).not.toBeInTheDocument();
  });

  it('passes deletingId to DocumentCard', () => {
    renderWithRouter(
      <DocumentList
        documents={mockDocuments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
        deletingId="doc-1"
      />
    );

    // Component should still render (DocumentCard handles the disabled state)
    expect(screen.getByTestId('doc-card-doc-1')).toBeInTheDocument();
  });

  it('calls onEdit callback from DocumentCard', () => {
    renderWithRouter(
      <DocumentList
        documents={mockDocuments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(mockDocuments[0]);
  });

  it('calls onDelete callback from DocumentCard', () => {
    renderWithRouter(
      <DocumentList
        documents={mockDocuments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(mockDocuments[0].id);
  });

  it('calls onView callback from DocumentCard', () => {
    renderWithRouter(
      <DocumentList
        documents={mockDocuments}
        isLoading={false}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onView={mockOnView}
      />
    );

    const viewButtons = screen.getAllByText('View');
    fireEvent.click(viewButtons[0]);

    expect(mockOnView).toHaveBeenCalledWith(mockDocuments[0]);
  });
});
