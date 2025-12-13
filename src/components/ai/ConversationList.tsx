import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare, Plus, Trash2, Pencil, Check, X, Loader2, MoreHorizontal, Search } from 'lucide-react';
import { Button } from '@/components/common';
import { useDebouncedValue } from '@/hooks';
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
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 200);
  const actionsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return conversations;
    }
    const query = debouncedSearch.toLowerCase();
    return conversations.filter((conv) => conv.title.toLowerCase().includes(query));
  }, [conversations, debouncedSearch]);

  // Group conversations by date category
  const groupedConversations = useMemo(() => {
    const groups: Record<string, Conversation[]> = {
      Today: [],
      Yesterday: [],
      'Previous 7 days': [],
      'This month': [],
      Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    filteredConversations.forEach((conv) => {
      const convDate = new Date(conv.updatedAt);
      const convDay = new Date(convDate.getFullYear(), convDate.getMonth(), convDate.getDate());

      if (convDay.getTime() >= today.getTime()) {
        groups.Today.push(conv);
      } else if (convDay.getTime() >= yesterday.getTime()) {
        groups.Yesterday.push(conv);
      } else if (convDay.getTime() >= sevenDaysAgo.getTime()) {
        groups['Previous 7 days'].push(conv);
      } else if (convDay.getTime() >= startOfMonth.getTime()) {
        groups['This month'].push(conv);
      } else {
        groups.Older.push(conv);
      }
    });

    // Return only non-empty groups in order
    return ['Today', 'Yesterday', 'Previous 7 days', 'This month', 'Older']
      .filter((key) => groups[key].length > 0)
      .map((key) => ({ label: key, conversations: groups[key] }));
  }, [filteredConversations]);

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

  return (
    <div className="flex flex-col h-full bg-theme-secondary">
      {/* Header with New Chat button */}
      <div className="p-3 border-b border-theme-primary space-y-2">
        <Button onClick={onNew} className="w-full" size="sm" data-testid="new-conversation">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>

        {/* Search input */}
        {conversations.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="input-theme w-full pl-9 pr-8 py-2 text-sm rounded-lg"
              aria-label="Search conversations"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-theme-tertiary rounded"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5 text-theme-tertiary" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-theme-muted" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-theme-tertiary">
            No conversations yet
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-theme-tertiary">
            No conversations matching "{debouncedSearch}"
          </div>
        ) : (
          <div className="py-2">
            {groupedConversations.map((group) => (
              <div key={group.label}>
                {/* Group header */}
                <div className="px-4 py-2 text-xs font-medium text-theme-tertiary uppercase tracking-wider">
                  {group.label}
                </div>
                {group.conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-2 mx-2 rounded-lg cursor-pointer transition-colors',
                      activeId === conv.id
                        ? 'bg-info-muted text-info'
                        : 'hover:bg-theme-tertiary text-theme-secondary'
                    )}
                    onClick={() => onSelect(conv.id)}
                  >
                    <MessageSquare className="h-4 w-4 flex-shrink-0 text-theme-muted" />

                    {editingId === conv.id ? (
                      <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="input-theme flex-1 px-2 py-1 text-sm rounded focus:ring-1 focus:ring-accent"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 hover:bg-theme-tertiary rounded"
                          title="Save"
                        >
                          <Check className="h-3.5 w-3.5 text-success" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 hover:bg-theme-tertiary rounded"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5 text-theme-tertiary" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{conv.title}</div>
                        </div>
                        {/* Actions - visible toggle on mobile, hover on desktop */}
                        <div ref={showActionsId === conv.id ? actionsRef : null} className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowActionsId(showActionsId === conv.id ? null : conv.id);
                            }}
                            className={cn(
                              'p-2 rounded-full hover:bg-theme-tertiary transition-all min-w-[36px] min-h-[36px] flex items-center justify-center',
                              'sm:opacity-0 sm:group-hover:opacity-100',
                              showActionsId === conv.id && 'opacity-100 bg-theme-tertiary'
                            )}
                            aria-label="Conversation actions"
                          >
                            <MoreHorizontal className="w-4 h-4 text-theme-tertiary" />
                          </button>
                          {/* Actions dropdown */}
                          <div
                            className={cn(
                              'absolute right-0 top-full mt-1 z-10 bg-theme-elevated rounded-lg shadow-lg border border-theme-primary py-1',
                              showActionsId === conv.id ? 'block' : 'hidden sm:group-hover:block'
                            )}
                          >
                            <button
                              onClick={(e) => {
                                handleStartEdit(conv, e);
                                setShowActionsId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-theme-secondary hover:bg-theme-tertiary min-h-[44px]"
                            >
                              <Pencil className="h-4 w-4" />
                              Rename
                            </button>
                            <button
                              onClick={(e) => {
                                handleDelete(conv.id, e);
                                setShowActionsId(null);
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-danger-muted min-h-[44px]"
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
