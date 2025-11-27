import type { QueryIntent, QueryAnalysis } from '@/types/ai';
import type { EventType } from '@/types/events';

// Re-export QueryAnalysis type for consumers
export type { QueryAnalysis } from '@/types/ai';

/**
 * Keywords that trigger each intent type
 */
const INTENT_KEYWORDS: Record<QueryIntent, string[]> = {
  trend: [
    'over time',
    'trend',
    'history of',
    'changes in',
    'how has',
    'progression',
    'evolved',
    'changed',
    'trending',
    'pattern',
  ],
  comparison: [
    'compare',
    'before and after',
    'vs',
    'versus',
    'difference between',
    'compared to',
    'before',
    'after',
    'differ',
  ],
  correlation: [
    'related to',
    'affect',
    'when i',
    'did .* change',
    'connection',
    'impact',
    'cause',
    'effect',
    'relationship',
    'linked',
  ],
  summary: [
    'summarize',
    'summary',
    'overview',
    'all my',
    'list all',
    'prepare for',
    'everything about',
    'full history',
    'complete',
  ],
  specific: [
    'last',
    'most recent',
    'when did',
    'what was',
    'show me',
    'find',
    'latest',
  ],
  general: [],
};

/**
 * Event type keywords for detecting which types to retrieve
 */
const EVENT_TYPE_KEYWORDS: Record<EventType, string[]> = {
  lab_result: [
    'lab',
    'bloodwork',
    'blood test',
    'test result',
    'biomarker',
    'cholesterol',
    'a1c',
    'hba1c',
    'vitamin',
    'iron',
    'thyroid',
    'liver',
    'kidney',
    'glucose',
    'hemoglobin',
  ],
  doctor_visit: [
    'doctor',
    'visit',
    'appointment',
    'checkup',
    'check-up',
    'consultation',
    'specialist',
    'cardiologist',
    'endocrinologist',
    'physician',
  ],
  medication: [
    'medication',
    'medicine',
    'drug',
    'prescription',
    'pill',
    'taking',
    'dosage',
    'dose',
    'prescribe',
  ],
  intervention: [
    'intervention',
    'diet',
    'exercise',
    'supplement',
    'sleep',
    'meditation',
    'lifestyle',
    'routine',
    'habit',
    'protocol',
  ],
  metric: [
    'metric',
    'measurement',
    'hrv',
    'heart rate',
    'weight',
    'blood pressure',
    'sleep score',
    'steps',
    'whoop',
    'oura',
  ],
};

/**
 * Date pattern regex for extracting date references
 */
const DATE_PATTERNS = {
  // "March 2024", "Jan 2023"
  monthYear: /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})\b/gi,
  // "2024", "2023"
  year: /\b(20\d{2})\b/g,
  // "past 3 years", "last 6 months"
  relative: /\b(past|last)\s+(\d+)\s+(year|month|week|day)s?\b/gi,
  // "since January", "since 2023"
  since: /\bsince\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b/gi,
};

/**
 * Extract entities (names, specific terms) from query
 */
function extractEntities(query: string): string[] {
  const entities: string[] = [];

  // Look for quoted terms
  const quotedMatches = query.match(/"([^"]+)"/g);
  if (quotedMatches) {
    entities.push(...quotedMatches.map((m) => m.replace(/"/g, '')));
  }

  // Look for capitalized words (potential names)
  const words = query.split(/\s+/);
  for (const word of words) {
    // Skip common words and check for capitalization
    if (
      word.length > 2 &&
      /^[A-Z][a-z]+$/.test(word) &&
      !['The', 'What', 'When', 'How', 'Why', 'Show', 'Tell', 'List'].includes(
        word
      )
    ) {
      entities.push(word);
    }
  }

  // Look for "Dr." or "Doctor" followed by name
  const doctorMatch = query.match(/\b(dr\.?|doctor)\s+([a-z]+)/gi);
  if (doctorMatch) {
    entities.push(...doctorMatch);
  }

  return [...new Set(entities)]; // Deduplicate
}

/**
 * Extract date range from query
 */
function extractDateRange(
  query: string
): { start?: string; end?: string } | undefined {
  const now = new Date();

  // Check for relative dates first
  const relativeMatch = query.match(DATE_PATTERNS.relative);
  if (relativeMatch) {
    const match = relativeMatch[0].toLowerCase();
    const numMatch = match.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : 1;

    const unitMatch = match.match(/(year|month|week|day)/);
    const unit = unitMatch ? unitMatch[1] : 'year';

    const startDate = new Date(now);
    switch (unit) {
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - num);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - num);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - num * 7);
        break;
      case 'day':
        startDate.setDate(startDate.getDate() - num);
        break;
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0],
    };
  }

  // Check for "since" patterns
  const sinceMatch = query.match(DATE_PATTERNS.since);
  if (sinceMatch) {
    // Simplified: just use year if mentioned
    const yearMatch = sinceMatch[0].match(/\d{4}/);
    if (yearMatch) {
      return {
        start: `${yearMatch[0]}-01-01`,
        end: now.toISOString().split('T')[0],
      };
    }
  }

  // Check for specific years
  const yearMatches = query.match(DATE_PATTERNS.year);
  if (yearMatches && yearMatches.length >= 1) {
    const years = yearMatches.map((y) => parseInt(y, 10)).sort();
    if (years.length === 1) {
      return {
        start: `${years[0]}-01-01`,
        end: `${years[0]}-12-31`,
      };
    } else {
      return {
        start: `${years[0]}-01-01`,
        end: `${years[years.length - 1]}-12-31`,
      };
    }
  }

  return undefined;
}

/**
 * Detect which event types are relevant to the query
 */
function detectEventTypes(query: string): EventType[] | undefined {
  const lowerQuery = query.toLowerCase();
  const matchedTypes: EventType[] = [];

  for (const [type, keywords] of Object.entries(EVENT_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        matchedTypes.push(type as EventType);
        break;
      }
    }
  }

  return matchedTypes.length > 0 ? [...new Set(matchedTypes)] : undefined;
}

/**
 * Extract keywords from query for search
 */
function extractKeywords(query: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'is',
    'are',
    'was',
    'were',
    'be',
    'been',
    'being',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'could',
    'should',
    'may',
    'might',
    'must',
    'shall',
    'can',
    'need',
    'what',
    'when',
    'where',
    'who',
    'which',
    'how',
    'why',
    'this',
    'that',
    'these',
    'those',
    'i',
    'me',
    'my',
    'mine',
    'we',
    'us',
    'our',
    'you',
    'your',
    'it',
    'its',
    'show',
    'tell',
    'give',
    'list',
    'find',
    'get',
    'about',
    'please',
  ]);

  const words = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return [...new Set(words)];
}

/**
 * Detect the primary intent of the query
 */
function detectIntent(query: string): { intent: QueryIntent; confidence: number } {
  const lowerQuery = query.toLowerCase();
  let bestIntent: QueryIntent = 'general';
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === 'general') continue;

    let score = 0;
    for (const keyword of keywords) {
      if (keyword.includes('.*')) {
        // Regex pattern
        const regex = new RegExp(keyword, 'i');
        if (regex.test(lowerQuery)) {
          score += 2;
        }
      } else if (lowerQuery.includes(keyword)) {
        score += keyword.split(' ').length; // Longer phrases score higher
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as QueryIntent;
    }
  }

  // Calculate confidence (0-1)
  const confidence = bestScore > 0 ? Math.min(bestScore / 5, 1) : 0.3;

  return { intent: bestIntent, confidence };
}

/**
 * Analyze a user query to determine intent and extract relevant information
 */
export function analyzeQuery(query: string): QueryAnalysis {
  const { intent, confidence } = detectIntent(query);
  const keywords = extractKeywords(query);
  const dateRange = extractDateRange(query);
  const eventTypes = detectEventTypes(query);
  const entities = extractEntities(query);

  return {
    intent,
    keywords,
    dateRange,
    eventTypes,
    entities,
    confidence,
  };
}
