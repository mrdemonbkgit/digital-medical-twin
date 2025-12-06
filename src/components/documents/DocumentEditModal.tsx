import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button, Modal, Input, Select, TextArea } from '@/components/common';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type Document,
  type DocumentCategory,
  type UpdateDocumentInput,
} from '@/types';

interface DocumentEditModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, input: UpdateDocumentInput) => Promise<void>;
  isSaving?: boolean;
}

const categoryOptions = DOCUMENT_CATEGORIES.map((cat) => ({
  value: cat,
  label: DOCUMENT_CATEGORY_LABELS[cat],
}));

export function DocumentEditModal({
  document,
  isOpen,
  onClose,
  onSave,
  isSaving = false,
}: DocumentEditModalProps) {
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentDate, setDocumentDate] = useState('');

  // Reset form when document changes
  useEffect(() => {
    if (document) {
      setCategory(document.category);
      setTitle(document.title || '');
      setDescription(document.description || '');
      setDocumentDate(document.documentDate || '');
    }
  }, [document]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    await onSave(document.id, {
      category,
      title: title.trim() || null,
      description: description.trim() || null,
      documentDate: documentDate || null,
    });

    onClose();
  };

  if (!document) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Document">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <p className="font-medium truncate">{document.filename}</p>
          <p className="text-xs text-gray-500 mt-1">
            Uploaded {new Date(document.createdAt).toLocaleDateString()}
          </p>
        </div>

        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          options={categoryOptions}
          disabled={isSaving}
        />

        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Blood Test Results"
          disabled={isSaving}
        />

        <Input
          type="date"
          label="Document Date"
          value={documentDate}
          onChange={(e) => setDocumentDate(e.target.value)}
          disabled={isSaving}
        />

        <TextArea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes about this document..."
          rows={3}
          disabled={isSaving}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
