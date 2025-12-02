import { Bot, User } from 'lucide-react';
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

// Shared markdown config for GFM tables
const remarkPlugins = [remarkGfm];

const markdownComponents = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-gray-100">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="even:bg-gray-50 hover:bg-blue-50/50 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children, style, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap"
      style={style}
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, style, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap"
      style={style}
      {...props}
    >
      {children}
    </td>
  ),
};

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';

  // Build activity items from message metadata
  const activities = isAssistant ? buildActivityItems(message) : [];

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isAssistant ? 'bg-gray-50' : 'bg-white'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isAssistant ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
        )}
      >
        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900">
            {isAssistant ? 'AI Historian' : 'You'}
          </span>
          <span className="text-xs text-gray-400">
            {formatTime(message.timestamp)}
          </span>
        </div>

        {isAssistant ? (
          <div className="text-sm text-gray-700 prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-strong:text-gray-900">
            {renderContentWithCitations(
              message.content,
              message.citations,
              message.webSearchResults
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
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
          <div className="mt-3 pt-3 border-t border-gray-200">
            <span className="text-xs font-medium text-gray-500">
              Based on {message.sources.length} health event{message.sources.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
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
      className="text-blue-600 cursor-pointer hover:text-blue-800 hover:underline font-medium ml-0.5"
      onClick={handleClick}
      title={tooltipText}
    >
      [{sourceNums.join(',')}]
    </sup>
  );
}
