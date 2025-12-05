import { describe, it, expect } from 'vitest';
import {
  SYSTEM_PROMPT,
  getIntentGuidance,
  formatContextHeader,
  CONTEXT_FOOTER,
  SUGGESTED_QUESTIONS,
} from './prompts';
import type { QueryIntent } from '@/types/ai';

describe('prompts', () => {
  describe('SYSTEM_PROMPT', () => {
    it('is defined and non-empty', () => {
      expect(SYSTEM_PROMPT).toBeDefined();
      expect(SYSTEM_PROMPT.length).toBeGreaterThan(0);
    });

    it('contains key role instructions', () => {
      expect(SYSTEM_PROMPT).toContain('health historian');
      expect(SYSTEM_PROMPT).toContain('Your Role');
      expect(SYSTEM_PROMPT).toContain('Critical Rules');
    });

    it('contains medical disclaimer instruction', () => {
      expect(SYSTEM_PROMPT).toContain('Medical Disclaimer');
      expect(SYSTEM_PROMPT).toContain('not medical advice');
    });

    it('contains response guidelines', () => {
      expect(SYSTEM_PROMPT).toContain('Response Guidelines');
      expect(SYSTEM_PROMPT).toContain('markdown');
    });
  });

  describe('getIntentGuidance', () => {
    it('returns trend guidance for trend intent', () => {
      const guidance = getIntentGuidance('trend');

      expect(guidance).toContain('Trend Analysis');
      expect(guidance).toContain('changes over time');
      expect(guidance).toContain('chronologically');
    });

    it('returns comparison guidance for comparison intent', () => {
      const guidance = getIntentGuidance('comparison');

      expect(guidance).toContain('Comparison');
      expect(guidance).toContain('side-by-side');
      expect(guidance).toContain('tables');
    });

    it('returns correlation guidance for correlation intent', () => {
      const guidance = getIntentGuidance('correlation');

      expect(guidance).toContain('Correlation Analysis');
      expect(guidance).toContain('relationships');
      expect(guidance).toContain('causation');
    });

    it('returns summary guidance for summary intent', () => {
      const guidance = getIntentGuidance('summary');

      expect(guidance).toContain('Summary');
      expect(guidance).toContain('comprehensive overview');
    });

    it('returns specific guidance for specific intent', () => {
      const guidance = getIntentGuidance('specific');

      expect(guidance).toContain('Specific Lookup');
      expect(guidance).toContain('directly and precisely');
    });

    it('returns general guidance for general intent', () => {
      const guidance = getIntentGuidance('general');

      expect(guidance).toContain('General Question');
    });

    it('returns general guidance for unknown intent', () => {
      const guidance = getIntentGuidance('unknown' as QueryIntent);

      expect(guidance).toContain('General Question');
    });
  });

  describe('formatContextHeader', () => {
    it('formats header with event count', () => {
      const header = formatContextHeader(10, false);

      expect(header).toContain('HEALTH TIMELINE CONTEXT');
      expect(header).toContain('Total events provided: 10');
    });

    it('includes truncation note when truncated', () => {
      const header = formatContextHeader(50, true);

      expect(header).toContain('Total events provided: 50');
      expect(header).toContain('omitted due to context limits');
    });

    it('does not include truncation note when not truncated', () => {
      const header = formatContextHeader(5, false);

      expect(header).not.toContain('omitted');
    });
  });

  describe('CONTEXT_FOOTER', () => {
    it('is defined', () => {
      expect(CONTEXT_FOOTER).toBeDefined();
    });

    it('contains end marker', () => {
      expect(CONTEXT_FOOTER).toContain('END CONTEXT');
    });
  });

  describe('SUGGESTED_QUESTIONS', () => {
    it('is an array', () => {
      expect(Array.isArray(SUGGESTED_QUESTIONS)).toBe(true);
    });

    it('has multiple questions', () => {
      expect(SUGGESTED_QUESTIONS.length).toBeGreaterThan(0);
    });

    it('contains health-related questions', () => {
      const allQuestions = SUGGESTED_QUESTIONS.join(' ');
      expect(allQuestions).toMatch(/health|medication|lab|doctor/i);
    });

    it('questions are strings', () => {
      SUGGESTED_QUESTIONS.forEach((q) => {
        expect(typeof q).toBe('string');
        expect(q.length).toBeGreaterThan(0);
      });
    });
  });
});
