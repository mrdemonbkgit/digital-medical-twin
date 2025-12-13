import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { PageWrapper } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, Button, FullPageSpinner } from '@/components/common';
import {
  DocumentUploadDropzone,
  DocumentList,
  DocumentViewer,
  DocumentEditModal,
} from '@/components/documents';
import { useDocuments } from '@/hooks/useDocuments';
import { useDocumentMutation } from '@/hooks/useDocumentMutation';
import { useRequireProfile } from '@/hooks/useRequireProfile';
import type { Document, UpdateDocumentInput } from '@/types';

export function DocumentsPage() {
  const { isLoading: isProfileLoading, isComplete } = useRequireProfile();
  const { documents, isLoading, error, refetch } = useDocuments();
  const { update, remove, isUpdating } = useDocumentMutation();

  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleUploadComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleView = useCallback((doc: Document) => {
    setViewingDocument(doc);
  }, []);

  const handleEdit = useCallback((doc: Document) => {
    setEditingDocument(doc);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      await remove(id);
      await refetch();
    } finally {
      setDeletingId(null);
    }
  }, [remove, refetch]);

  const handleSave = useCallback(async (id: string, input: UpdateDocumentInput) => {
    await update(id, input);
    await refetch();
  }, [update, refetch]);

  // Show loading while checking profile status
  if (isProfileLoading) {
    return <FullPageSpinner />;
  }

  // Will redirect if profile not complete
  if (!isComplete) {
    return null;
  }

  return (
    <PageWrapper title="Documents">
      <div className="space-y-6">
        {/* Header with back link */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Page description */}
        <Card>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FolderOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-theme-primary">
                  Document Storage
                </h2>
                <p className="mt-1 text-theme-secondary">
                  Store and organize your health-related documents. Upload lab results,
                  prescriptions, imaging reports, discharge summaries, and more.
                  Lab result PDFs can be sent for automatic biomarker extraction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload zone */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentUploadDropzone onUploadComplete={handleUploadComplete} />
          </CardContent>
        </Card>

        {/* Documents list */}
        <Card>
          <CardHeader>
            <CardTitle>Your Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8 text-danger">
                <p className="text-sm">{error}</p>
                <Button variant="secondary" size="sm" onClick={refetch} className="mt-3">
                  Try again
                </Button>
              </div>
            ) : (
              <DocumentList
                documents={documents}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                deletingId={deletingId}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <DocumentViewer
        document={viewingDocument}
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
      />

      <DocumentEditModal
        document={editingDocument}
        isOpen={!!editingDocument}
        onClose={() => setEditingDocument(null)}
        onSave={handleSave}
        isSaving={isUpdating}
      />
    </PageWrapper>
  );
}
