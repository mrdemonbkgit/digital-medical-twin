import type { AIModel, QueryIntent } from '@/types/ai';
import type { HealthEvent } from '@/types/events';
import { formatEventForContext, estimateTokens } from './contextFormatter';

/**
 * Token budget configuration
 */
export interface TokenBudget {
  total: number;
  systemPrompt: number;
  responseBuffer: number;
  contextBudget: number;
}

/**
 * Context window sizes for different models
 * These are estimates and should be updated as model capabilities change
 */
const MODEL_CONTEXT_WINDOWS: Record<AIModel, number> = {
  'gpt-5.2': 400000,
  'gemini-3-pro-preview': 1000000,
};

/**
 * Calculate token budget for a given model
 */
export function calculateBudget(model: AIModel): TokenBudget {
  const total = MODEL_CONTEXT_WINDOWS[model] || 32000;
  const systemPrompt = 500; // Reserve for system prompt
  const responseBuffer = 2000; // Reserve for AI response

  return {
    total,
    systemPrompt,
    responseBuffer,
    contextBudget: total - systemPrompt - responseBuffer,
  };
}

/**
 * Calculate relevance score for an event based on intent
 */
function calculateRelevanceScore(
  event: HealthEvent,
  intent: QueryIntent,
  now: Date = new Date()
): number {
  // Base score: recency (events in past year score higher)
  const eventDate = new Date(event.date);
  const daysSinceEvent = Math.floor(
    (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const recencyScore = Math.max(0, 1 - daysSinceEvent / 730); // 2 years = 0 score

  // Intent-specific boosts
  let intentBoost = 0;

  switch (intent) {
    case 'trend':
      // Boost lab results and metrics for trend analysis
      if (event.type === 'lab_result' || event.type === 'metric') {
        intentBoost = 0.3;
      }
      break;

    case 'comparison':
      // Boost lab results for comparisons
      if (event.type === 'lab_result') {
        intentBoost = 0.3;
      }
      break;

    case 'correlation':
      // Boost interventions and medications for correlation queries
      if (event.type === 'intervention' || event.type === 'medication') {
        intentBoost = 0.3;
      }
      break;

    case 'summary':
      // Boost doctor visits for summaries
      if (event.type === 'doctor_visit') {
        intentBoost = 0.2;
      }
      break;

    case 'specific':
      // No specific boost, rely on search relevance
      break;

    case 'general':
    default:
      // Slight boost for recent doctor visits and lab results
      if (event.type === 'doctor_visit' || event.type === 'lab_result') {
        intentBoost = 0.1;
      }
      break;
  }

  // Type diversity bonus (to avoid all events being same type)
  // This is handled at the selection level, not here

  return recencyScore + intentBoost;
}

/**
 * Result of truncating events to fit budget
 */
export interface TruncationResult {
  events: HealthEvent[];
  truncated: boolean;
  tokensUsed: number;
  originalCount: number;
}

/**
 * Truncate events to fit within token budget
 * Prioritizes events by relevance score (recency + intent match)
 */
export function truncateToFit(
  events: HealthEvent[],
  budget: number,
  intent: QueryIntent
): TruncationResult {
  if (events.length === 0) {
    return {
      events: [],
      truncated: false,
      tokensUsed: 0,
      originalCount: 0,
    };
  }

  // Score and sort events by relevance
  const scored = events.map((event) => ({
    event,
    score: calculateRelevanceScore(event, intent),
  }));

  scored.sort((a, b) => b.score - a.score);

  // Greedily add events until budget exhausted
  const selected: HealthEvent[] = [];
  let tokensUsed = 0;

  // Reserve some tokens for context header/footer (~100 tokens)
  const effectiveBudget = budget - 100;

  for (const { event } of scored) {
    const formatted = formatEventForContext(event);
    const tokens = estimateTokens(formatted);

    // Add separator tokens (~10 per event)
    const totalTokens = tokens + 10;

    if (tokensUsed + totalTokens > effectiveBudget) {
      // Check if we have at least some events
      if (selected.length === 0) {
        // Force include at least one event even if over budget
        selected.push(event);
        tokensUsed += totalTokens;
      }
      break;
    }

    selected.push(event);
    tokensUsed += totalTokens;
  }

  // Re-sort selected events chronologically (newest first)
  selected.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    events: selected,
    truncated: selected.length < events.length,
    tokensUsed,
    originalCount: events.length,
  };
}

/**
 * Get a balanced sample of events across types
 * Useful for summary queries
 */
export function getBalancedSample(
  events: HealthEvent[],
  targetCount: number = 20
): HealthEvent[] {
  const byType: Record<string, HealthEvent[]> = {};

  // Group by type
  for (const event of events) {
    if (!byType[event.type]) {
      byType[event.type] = [];
    }
    byType[event.type].push(event);
  }

  // Sort each group by date (newest first)
  for (const type in byType) {
    byType[type].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const types = Object.keys(byType);
  const perType = Math.ceil(targetCount / types.length);
  const result: HealthEvent[] = [];

  // Take up to perType events from each type
  for (const type of types) {
    result.push(...byType[type].slice(0, perType));
  }

  // Sort final result by date (newest first)
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return result.slice(0, targetCount);
}
