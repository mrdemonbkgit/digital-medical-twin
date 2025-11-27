/**
 * AI Integration Module
 *
 * This module provides the RAG (Retrieval-Augmented Generation) pipeline
 * for the AI Historian feature, allowing users to query their health history
 * using natural language.
 */

// Intent detection and query analysis
export { analyzeQuery, type QueryAnalysis } from './intentDetector';

// Context formatting for AI prompts
export {
  formatEventForContext,
  formatEventsForContext,
  estimateTokens,
} from './contextFormatter';

// Token budgeting and truncation
export {
  calculateBudget,
  truncateToFit,
  getBalancedSample,
  type TokenBudget,
  type TruncationResult,
} from './tokenManager';

// Event retrieval
export { retrieveRelevantEvents, getRetrievalStats } from './retriever';

// System prompts
export {
  SYSTEM_PROMPT,
  getIntentGuidance,
  SUGGESTED_QUESTIONS,
  formatContextHeader,
  CONTEXT_FOOTER,
} from './prompts';

// Provider adapters
export {
  createProvider,
  getDefaultModel,
  isValidModelForProvider,
  type AIProviderAdapter,
  type ProviderMessage,
  type CompletionOptions,
  type CompletionResponse,
  AIProviderError,
} from './providers';

// Encryption utilities (server-side only)
export { encrypt, decrypt, generateKey } from './encryption';
