import { useState, useMemo } from 'react';
import { Loader2, FolderOpen } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  type Document,
  type DocumentCategory,
} from '@/types';

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  onEdit: (document: Document) => void;
  onDelete: (id: string) => Promise<void>;
  onView: (document: Document) => void;
  deletingId?: string | null;
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc';

export function DocumentList({
  documents,
  isLoading,
  onEdit,
  onDelete,
  onView,
  deletingId = null,
}: DocumentListProps) {
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Count documents per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length };
    for (const cat of DOCUMENT_CATEGORIES) {
      counts[cat] = documents.filter((d) => d.category === cat).length;
    }
    return counts;
  }, [documents]);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    const filtered = activeCategory === 'all'
      ? documents
      : documents.filter((d) => d.category === activeCategory);

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          if (!a.documentDate && !b.documentDate) return 0;
          if (!a.documentDate) return 1;
          if (!b.documentDate) return -1;
          return b.documentDate.localeCompare(a.documentDate);
        case 'date-asc':
          if (!a.documentDate && !b.documentDate) return 0;
          if (!a.documentDate) return 1;
          if (!b.documentDate) return -1;
          return a.documentDate.localeCompare(b.documentDate);
        case 'name-asc':
          const nameA = a.title || a.filename;
          const nameB = b.title || b.filename;
          return nameA.localeCompare(nameB);
      }
    });
  }, [documents, activeCategory, sortBy]);

  // Category tabs with counts
  const tabs = [
    { key: 'all' as const, label: 'All' },
    ...DOCUMENT_CATEGORIES.map((cat) => ({
      key: cat,
      label: DOCUMENT_CATEGORY_LABELS[cat],
    })),
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mb-3" />
        <p className="text-sm">Loading documents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category tabs and sort */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const count = categoryCounts[tab.key] || 0;
            const isActive = activeCategory === tab.key;

            // Hide empty categories (except "All")
            if (tab.key !== 'all' && count === 0) return null;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(tab.key)}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                `}
              >
                {tab.label}
                <span className={`ml-1.5 ${isActive ? 'text-blue-200' : 'text-gray-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white flex-shrink-0"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="name-asc">Name A-Z</option>
        </select>
      </div>

      {/* Document grid or empty state */}
      {filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <FolderOpen className="h-12 w-12 mb-3 text-gray-300" />
          <p className="text-sm font-medium">No documents yet</p>
          <p className="text-xs mt-1">Upload your first document above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              isDeleting={deletingId === doc.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
