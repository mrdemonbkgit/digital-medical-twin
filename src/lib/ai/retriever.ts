import type { HealthEvent } from '@/types/events';
import type { QueryAnalysis } from './intentDetector';

/**
 * Filter events based on query analysis
 * This is a simple keyword and date-based retriever
 * For production, consider vector search or more sophisticated retrieval
 */
export function retrieveRelevantEvents(
  events: HealthEvent[],
  analysis: QueryAnalysis
): HealthEvent[] {
  let filtered = [...events];

  // Filter by date range if specified
  if (analysis.dateRange?.start || analysis.dateRange?.end) {
    filtered = filtered.filter((event) => {
      const eventDate = new Date(event.date);

      if (analysis.dateRange?.start && eventDate < new Date(analysis.dateRange.start)) {
        return false;
      }
      if (analysis.dateRange?.end && eventDate > new Date(analysis.dateRange.end)) {
        return false;
      }
      return true;
    });
  }

  // Filter by event types if specified
  if (analysis.eventTypes && analysis.eventTypes.length > 0) {
    filtered = filtered.filter((event) => analysis.eventTypes!.includes(event.type));
  }

  // Score events by keyword relevance
  const scored = filtered.map((event) => ({
    event,
    score: calculateKeywordScore(event, analysis.keywords, analysis.entities),
  }));

  // Sort by score (higher is more relevant)
  scored.sort((a, b) => b.score - a.score);

  // Return events, keeping those with positive scores first
  // but including all events if no keywords matched
  const hasMatches = scored.some((s) => s.score > 0);

  if (hasMatches) {
    // Return matched events first, then others
    return scored.sort((a, b) => b.score - a.score).map((s) => s.event);
  }

  // No keyword matches - return all filtered events sorted by date
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Calculate keyword relevance score for an event
 */
function calculateKeywordScore(
  event: HealthEvent,
  keywords: string[],
  entities: string[]
): number {
  if (keywords.length === 0 && entities.length === 0) {
    return 0;
  }

  let score = 0;
  const searchTerms = [...keywords, ...entities].map((k) => k.toLowerCase());

  // Build searchable text from event
  const searchableText = buildSearchableText(event).toLowerCase();

  // Score based on keyword matches
  for (const term of searchTerms) {
    if (searchableText.includes(term)) {
      // Exact match in title gets higher score
      if (event.title.toLowerCase().includes(term)) {
        score += 3;
      } else {
        score += 1;
      }
    }
  }

  // Bonus for entity matches (more specific)
  for (const entity of entities) {
    if (searchableText.includes(entity.toLowerCase())) {
      score += 2;
    }
  }

  return score;
}

/**
 * Build searchable text from an event
 */
function buildSearchableText(event: HealthEvent): string {
  const parts: string[] = [event.title, event.notes || ''];

  if (event.tags) {
    parts.push(...event.tags);
  }

  switch (event.type) {
    case 'lab_result':
      if (event.labName) parts.push(event.labName);
      if (event.orderingDoctor) parts.push(event.orderingDoctor);
      if (event.biomarkers) {
        parts.push(...event.biomarkers.map((b) => b.name));
      }
      break;

    case 'doctor_visit':
      parts.push(event.doctorName);
      if (event.specialty) parts.push(event.specialty);
      if (event.facility) parts.push(event.facility);
      if (event.diagnosis) parts.push(...event.diagnosis);
      break;

    case 'medication':
      parts.push(event.medicationName);
      if (event.prescriber) parts.push(event.prescriber);
      if (event.reason) parts.push(event.reason);
      break;

    case 'intervention':
      parts.push(event.interventionName);
      parts.push(event.category);
      if (event.protocol) parts.push(event.protocol);
      break;

    case 'metric':
      parts.push(event.metricName);
      parts.push(event.source);
      break;
  }

  return parts.join(' ');
}

/**
 * Get summary statistics for retrieved events
 */
export function getRetrievalStats(events: HealthEvent[]): {
  totalCount: number;
  byType: Record<string, number>;
  dateRange: { earliest: string | null; latest: string | null };
} {
  const byType: Record<string, number> = {};

  for (const event of events) {
    byType[event.type] = (byType[event.type] || 0) + 1;
  }

  const dates = events.map((e) => new Date(e.date).getTime());
  const earliest = dates.length > 0 ? new Date(Math.min(...dates)).toISOString() : null;
  const latest = dates.length > 0 ? new Date(Math.max(...dates)).toISOString() : null;

  return {
    totalCount: events.length,
    byType,
    dateRange: { earliest, latest },
  };
}
