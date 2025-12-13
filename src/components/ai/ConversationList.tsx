import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Plus, Trash2, Pencil, Check, X, Loader2, MoreHorizontal } from 'lucide-react';
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
  const [showActionsId, setShowActionsId] = useState<string | null>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showActionsId && actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActionsId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionsId]);

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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-zinc-800">
      {/* Header with New Chat button */}
      <div className="p-3 border-b border-gray-200 dark:border-zinc-700">
        <Button onClick={onNew} className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-zinc-400" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-zinc-400">
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
                    ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100'
                    : 'hover:bg-gray-100 text-gray-700 dark:hover:bg-zinc-700 dark:text-zinc-300'
                )}
                onClick={() => onSelect(conv.id)}
              >
                <MessageSquare className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-zinc-400" />

                {editingId === conv.id ? (
                  <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded"
                      title="Save"
                    >
                      <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded"
                      title="Cancel"
                    >
                      <X className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-400" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{conv.title}</div>
                      <div className="text-xs text-gray-500 dark:text-zinc-400">{formatDate(conv.updatedAt)}</div>
                    </div>
                    {/* Actions - visible toggle on mobile, hover on desktop */}
                    <div ref={showActionsId === conv.id ? actionsRef : null} className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActionsId(showActionsId === conv.id ? null : conv.id);
                        }}
                        className={cn(
                          'p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-600 transition-all min-w-[36px] min-h-[36px] flex items-center justify-center',
                          'sm:opacity-0 sm:group-hover:opacity-100',
                          showActionsId === conv.id && 'opacity-100 bg-gray-200 dark:bg-zinc-600'
                        )}
                        aria-label="Conversation actions"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                      </button>
                      {/* Actions dropdown */}
                      <div
                        className={cn(
                          'absolute right-0 top-full mt-1 z-10 bg-white dark:bg-zinc-700 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-1',
                          showActionsId === conv.id ? 'block' : 'hidden sm:group-hover:block'
                        )}
                      >
                        <button
                          onClick={(e) => {
                            handleStartEdit(conv, e);
                            setShowActionsId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-600 min-h-[44px]"
                        >
                          <Pencil className="h-4 w-4" />
                          Rename
                        </button>
                        <button
                          onClick={(e) => {
                            handleDelete(conv.id, e);
                            setShowActionsId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 min-h-[44px]"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
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
