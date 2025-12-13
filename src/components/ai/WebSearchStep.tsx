import { useState } from 'react';
import { Globe } from 'lucide-react';
import type { ActivityItem, WebSearchResult } from '@/types/ai';

interface WebSearchStepProps {
  activities: ActivityItem[];
}

export function WebSearchStep({ activities }: WebSearchStepProps) {
  const [showAll, setShowAll] = useState(false);

  // Collect all sources from web search activities
  const allSources = activities.flatMap(a => a.sources || []);

  if (allSources.length === 0) return null;

  const visibleSources = showAll ? allSources : allSources.slice(0, 3);
  const hiddenCount = allSources.length - 3;

  return (
    <div className="flex gap-2">
      <Globe className="mt-1 h-4 w-4 text-theme-muted flex-shrink-0" />
      <div>
        <span className="text-sm font-medium text-theme-primary">
          Searching for relevant information
        </span>

        {/* Source chips */}
        <div className="mt-2 flex flex-wrap gap-2" data-sources-section>
          {visibleSources.map((source, idx) => (
            <SourceChip key={idx} source={source} index={idx} />
          ))}

          {hiddenCount > 0 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-theme-tertiary hover:bg-theme-secondary rounded-full text-xs text-theme-secondary transition-colors"
            >
              <span className="text-warning">+{hiddenCount}</span> more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface SourceChipProps {
  source: WebSearchResult;
  index: number;
}

function SourceChip({ source, index }: SourceChipProps) {
  // Handle case where URL is empty (search was performed but no external URLs available)
  if (!source.url) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-theme-tertiary rounded-full text-xs text-theme-secondary"
        title={source.snippet || source.title}
        data-sources-section
      >
        <span className="font-semibold text-accent">[{index + 1}]</span>
        <Globe className="h-3.5 w-3.5 text-theme-muted" />
        {truncateTitle(source.title) || source.displayUrl}
      </span>
    );
  }

  const hostname = getHostname(source.url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=16`;
  const displayTitle = source.title || hostname.replace('www.', '');

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-theme-tertiary hover:bg-theme-secondary rounded-full text-xs text-theme-secondary transition-colors"
      title={`${source.title}\n${source.url}`}
      data-sources-section
    >
      <span className="font-semibold text-accent">[{index + 1}]</span>
      <img
        src={faviconUrl}
        alt=""
        className="h-3.5 w-3.5 rounded"
        onError={(e) => {
          // Hide broken favicon images
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <span className="max-w-[200px] truncate">{truncateTitle(displayTitle)}</span>
    </a>
  );
}

function truncateTitle(title: string, maxLength = 40): string {
  if (!title) return '';
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength - 3) + '...';
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
