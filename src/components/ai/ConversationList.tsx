import { useState } from 'react';
import { MessageSquare, Plus, Trash2, Pencil, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/common';
import { cn } from '@/utils/cn';
import type { Conversation } from '@/types/conversations';

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  isLoading,
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartEdit = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      onDelete(id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header with New Chat button */}
      <div className="p-3 border-b border-gray-200">
        <Button onClick={onNew} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-gray-500">
            No conversations yet
          </div>
        ) : (
          <div className="py-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors',
                  activeId === conv.id
                    ? 'bg-blue-100 text-blue-900'
                    : 'hover:bg-gray-100 text-gray-700'
                )}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-400" />

                {editingId === conv.id ? (
                  <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Save"
                    >
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{conv.title}</div>
                      <div className="text-xs text-gray-500">{formatDate(conv.updatedAt)}</div>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => handleStartEdit(conv, e)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
