import { useState, useRef, useEffect } from 'react';
import { Bot, User, Copy, Pencil, Trash2, RotateCcw, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/utils/cn';
import type {
  ChatMessage as ChatMessageType,
  ActivityItem,
  InlineCitation,
  WebSearchResult,
} from '@/types/ai';
import { ActivityPanel } from './ActivityPanel';
import { MessageActionsMenu } from './MessageActionsMenu';
import { MessageDetailsModal } from './MessageDetailsModal';
import { Modal } from '@/components/common';
import { useSwipe } from '@/hooks';

// Shared markdown config for GFM tables
const remarkPlugins = [remarkGfm];

const markdownComponents = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-theme-primary">
      <table className="min-w-full divide-y divide-theme-primary">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-theme-tertiary">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-theme-primary bg-theme-primary">{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="even:bg-theme-secondary hover:bg-info-muted/30 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children, style, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="px-3 py-2 text-xs font-semibold text-theme-secondary uppercase tracking-wider whitespace-nowrap"
      style={style}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, style, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="px-3 py-2 text-sm text-theme-secondary whitespace-nowrap"
      style={style}
      {...props}
    >
      {children}
    </td>
  ),
};

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  isLoading?: boolean;
  /** When true, triggers edit mode for this message (used by keyboard shortcuts) */
  triggerEditMode?: boolean;
  /** Callback when edit mode is entered (to clear the trigger) */
  onEditModeEntered?: () => void;
}

export function ChatMessage({
  message,
  onRegenerate,
  onEdit,
  onDelete,
  isLoading = false,
  triggerEditMode = false,
  onEditModeEntered,
}: ChatMessageProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [swipeActionsRevealed, setSwipeActionsRevealed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAssistant = message.role === 'assistant';
  const isUser = message.role === 'user';

  // Swipe gesture support for mobile
  const [swipeHandlers, swipeState] = useSwipe({
    threshold: 50,
    onSwipeLeft: () => setSwipeActionsRevealed(true),
    onSwipeRight: () => setSwipeActionsRevealed(false),
    enabled: !isEditing, // Disable swipe when editing
  });

  // Build activity items from message metadata
  const activities = isAssistant ? buildActivityItems(message) : [];

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  // Handle keyboard shortcut trigger for edit mode
  useEffect(() => {
    if (triggerEditMode && message.role === 'user' && onEdit && !isEditing) {
      setEditContent(message.content);
      setIsEditing(true);
      onEditModeEntered?.();
    }
  }, [triggerEditMode, message.role, message.content, onEdit, isEditing, onEditModeEntered]);

  const handleStartEdit = () => {
    setEditContent(message.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent.trim() !== message.content) {
      onEdit?.(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      handleCancelEdit();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.(message.id);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
    setSwipeActionsRevealed(false);
  };

  const handleSwipeAction = (action: () => void) => {
    action();
    setSwipeActionsRevealed(false);
  };

  // Calculate transform for swipe animation
  const getSwipeTransform = () => {
    if (swipeActionsRevealed && !swipeState.isSwiping) {
      return 'translateX(-120px)';
    }
    if (swipeState.isSwiping && swipeState.offset < 0) {
      // Swiping left - limit to -120px
      return `translateX(${Math.max(swipeState.offset, -120)}px)`;
    }
    if (swipeState.isSwiping && swipeState.offset > 0 && swipeActionsRevealed) {
      // Swiping right to close
      return `translateX(${Math.min(swipeState.offset - 120, 0)}px)`;
    }
    return 'translateX(0)';
  };

  return (
    <>
      {/* Outer container for swipe - overflow-hidden only on mobile for swipe, visible on desktop for menu */}
      <div className="relative overflow-hidden sm:overflow-visible rounded-lg">
        {/* Swipe action buttons (revealed when swiping left) - mobile only */}
        <div
          className={cn(
            'absolute right-0 top-0 bottom-0 flex items-center gap-1 px-2',
            'sm:hidden', // Only show on mobile
            swipeActionsRevealed || swipeState.isSwiping ? 'opacity-100' : 'opacity-0'
          )}
          style={{ width: '120px' }}
        >
          <button
            onClick={handleCopy}
            className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-info hover:bg-info/80 text-white transition-colors"
            aria-label={copyFeedback ? 'Copied!' : 'Copy message'}
          >
            <Copy className="h-4 w-4" />
          </button>
          {isAssistant && onRegenerate && (
            <button
              onClick={() => handleSwipeAction(() => onRegenerate(message.id))}
              disabled={isLoading}
              className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-warning hover:bg-warning/80 text-white transition-colors disabled:opacity-50"
              aria-label="Regenerate response"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          {isUser && onEdit && !isEditing && (
            <button
              onClick={() => handleSwipeAction(handleStartEdit)}
              className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-warning hover:bg-warning/80 text-white transition-colors"
              aria-label="Edit message"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {isUser && onDelete && (
            <button
              onClick={() => handleSwipeAction(handleDeleteClick)}
              className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-danger hover:bg-danger/80 text-white transition-colors"
              aria-label="Delete message"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => handleSwipeAction(() => setShowDetails(true))}
            className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-theme-tertiary hover:bg-theme-secondary text-theme-secondary transition-colors"
            aria-label="View details"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>

        {/* Message content (transforms on swipe) */}
        <div
          {...swipeHandlers}
          className={cn(
            'group flex gap-3 p-4 rounded-lg relative',
            isAssistant ? 'bg-theme-secondary' : 'bg-theme-primary',
            'sm:transform-none' // Disable transform on desktop
          )}
          style={{
            transform: getSwipeTransform(),
            transition: swipeState.isSwiping ? 'none' : 'transform 0.2s ease-out',
          }}
        >
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            isAssistant ? 'bg-info-muted text-info' : 'bg-theme-tertiary text-theme-tertiary'
          )}
        >
          {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-theme-primary">
              {isAssistant ? 'AI Historian' : 'You'}
            </span>
            <span className="text-xs text-theme-muted">
              {formatTime(message.timestamp)}
            </span>
          </div>

        {isAssistant ? (
          <div className="text-sm text-theme-secondary prose prose-sm prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-theme-primary">
            {renderContentWithCitations(
              message.content,
              message.citations,
              message.webSearchResults
            )}
          </div>
        ) : isEditing ? (
          <div className="space-y-2">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-theme w-full px-3 py-2 text-sm rounded-lg resize-none min-h-[80px]"
              rows={3}
              aria-label="Edit message"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-sm text-theme-secondary hover:bg-theme-tertiary rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || editContent.trim() === message.content}
                className="px-3 py-1.5 text-sm bg-accent text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save & Submit
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-theme-secondary whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}

        {/* ChatGPT-style Activity Panel */}
        {isAssistant && activities.length > 0 && (
          <ActivityPanel
            activities={activities}
            elapsedTime={message.elapsedTime}
            defaultExpanded={false}
          />
        )}

        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-theme-primary">
            <span className="text-xs font-medium text-theme-tertiary">
              Based on {message.sources.length} health event{message.sources.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Actions menu - hidden on mobile (use swipe), appears on hover for desktop */}
      <div
        ref={actionsRef}
        className={cn(
          'absolute top-2 right-2',
          'hidden sm:block sm:opacity-0 sm:group-hover:opacity-100 transition-opacity'
        )}
      >
        <MessageActionsMenu
          message={message}
          onShowDetails={() => setShowDetails(true)}
          onRegenerate={onRegenerate ? () => onRegenerate(message.id) : undefined}
          onEdit={isUser && onEdit && !isEditing ? handleStartEdit : undefined}
          onDelete={isUser && onDelete ? handleDeleteClick : undefined}
          isLoading={isLoading}
        />
      </div>
    </div>
      </div>

      {/* Details modal */}
      <MessageDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        message={message}
      />

      {/* Delete confirmation dialog */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        title="Delete message?"
        size="sm"
      >
        <p className="text-sm text-theme-secondary mb-4">
          This will also delete all messages after this one. This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleCancelDelete}
            className="px-3 py-1.5 text-sm text-theme-secondary hover:bg-theme-tertiary rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            className="px-3 py-1.5 text-sm bg-danger text-white rounded-md hover:opacity-90 transition-opacity"
          >
            Delete
          </button>
        </div>
      </Modal>
    </>
  );
}

// Helper to convert API response metadata to activity timeline items
function buildActivityItems(message: ChatMessageType): ActivityItem[] {
  const items: ActivityItem[] = [];

  // Add reasoning steps as thinking activities
  if (message.reasoning?.steps) {
    message.reasoning.steps.forEach((step, idx) => {
      items.push({
        id: `thinking-${idx}`,
        type: 'thinking',
        title: step.title,
        content: step.content,
      });
    });
  }

  // Add tool calls
  if (message.toolCalls?.length) {
    message.toolCalls.forEach(call => {
      items.push({
        id: call.id,
        type: 'tool_call',
        title: call.name,
        toolCall: call,
        status: call.status,
      });
    });
  }

  // Add web search results
  if (message.webSearchResults?.length) {
    items.push({
      id: 'web-search',
      type: 'web_search',
      title: 'Searching for relevant information',
      sources: message.webSearchResults,
    });
  }

  return items;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

// Render content with superscript citation markers (Wikipedia-style)
function renderContentWithCitations(
  content: string,
  citations?: InlineCitation[],
  sources?: WebSearchResult[]
): React.ReactNode {
  if (!citations?.length || !sources?.length) {
    return (
      <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    );
  }

  // Sort citations by startIndex ascending to process in order
  const sortedCitations = [...citations].sort((a, b) => a.endIndex - b.endIndex);

  // Build segments: text pieces interleaved with citation markers
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedCitations.forEach((citation, idx) => {
    // Get unique source numbers (1-indexed for display)
    const sourceNums = [...new Set(citation.sourceIndices)]
      .filter((i) => i < sources.length)
      .map((i) => i + 1);

    if (sourceNums.length === 0) return;

    // Add text before this citation (if any new text)
    if (citation.endIndex > lastIndex) {
      const textBefore = content.slice(lastIndex, citation.endIndex);
      if (textBefore) {
        segments.push(
          <ReactMarkdown
            key={`text-${idx}`}
            remarkPlugins={remarkPlugins}
            components={{ ...markdownComponents, p: 'span' }}
          >
            {textBefore}
          </ReactMarkdown>
        );
      }
    }

    // Add citation marker
    segments.push(
      <CitationMarker key={`cite-${idx}`} sources={sources} sourceNums={sourceNums} />
    );

    lastIndex = citation.endIndex;
  });

  // Add remaining text after last citation
  if (lastIndex < content.length) {
    segments.push(
      <ReactMarkdown
        key="text-final"
        remarkPlugins={remarkPlugins}
        components={{ ...markdownComponents, p: 'span' }}
      >
        {content.slice(lastIndex)}
      </ReactMarkdown>
    );
  }

  return <div className="inline">{segments}</div>;
}

// Clickable superscript citation marker
function CitationMarker({
  sources,
  sourceNums,
}: {
  sources: WebSearchResult[];
  sourceNums: number[];
}) {
  // Convert 1-indexed sourceNums to 0-indexed for array access
  const sourceIndices = sourceNums.map((n) => n - 1).filter((i) => i >= 0 && i < sources.length);

  const handleClick = () => {
    // Scroll to the sources section
    const sourcesSection = document.querySelector('[data-sources-section]');
    if (sourcesSection) {
      sourcesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const tooltipText = sourceIndices
    .map((i) => `[${i + 1}] ${sources[i]?.title || sources[i]?.url}`)
    .join('\n');

  return (
    <sup
      className="text-accent cursor-pointer hover:opacity-80 hover:underline font-medium ml-0.5"
      onClick={handleClick}
      title={tooltipText}
    >
      [{sourceNums.join(',')}]
    </sup>
  );
}
