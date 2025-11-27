import { describe, it, expect } from 'vitest';
import { analyzeQuery } from './intentDetector';

describe('intentDetector', () => {
  describe('analyzeQuery', () => {
    describe('intent detection', () => {
      it('detects trend intent', () => {
        const result = analyzeQuery('How has my cholesterol changed over time?');
        expect(result.intent).toBe('trend');
        expect(result.confidence).toBeGreaterThan(0);
      });

      it('detects comparison intent', () => {
        const result = analyzeQuery('Compare my labs before and after starting medication');
        expect(result.intent).toBe('comparison');
      });

      it('detects correlation intent', () => {
        const result = analyzeQuery('Is my sleep related to my HRV?');
        expect(result.intent).toBe('correlation');
      });

      it('detects summary intent', () => {
        const result = analyzeQuery('Give me an overview of all my health data');
        expect(result.intent).toBe('summary');
      });

      it('detects specific intent', () => {
        const result = analyzeQuery('What was my last A1C result?');
        expect(result.intent).toBe('specific');
      });

      it('defaults to general intent when no keywords match', () => {
        const result = analyzeQuery('Hello');
        expect(result.intent).toBe('general');
        expect(result.confidence).toBeLessThanOrEqual(0.3);
      });

      it('handles regex patterns in intent keywords', () => {
        const result = analyzeQuery('Did my weight change after the diet?');
        expect(result.intent).toBe('correlation');
      });
    });

    describe('keyword extraction', () => {
      it('extracts meaningful keywords', () => {
        const result = analyzeQuery('Show me my cholesterol and blood pressure results');
        expect(result.keywords).toContain('cholesterol');
        expect(result.keywords).toContain('blood');
        expect(result.keywords).toContain('pressure');
        expect(result.keywords).toContain('results');
      });

      it('filters out stop words', () => {
        const result = analyzeQuery('What is the trend of my glucose?');
        expect(result.keywords).not.toContain('what');
        expect(result.keywords).not.toContain('is');
        expect(result.keywords).not.toContain('the');
        expect(result.keywords).not.toContain('of');
        expect(result.keywords).not.toContain('my');
      });

      it('filters out short words', () => {
        const result = analyzeQuery('Is it ok to skip a test?');
        expect(result.keywords).not.toContain('is');
        expect(result.keywords).not.toContain('it');
        expect(result.keywords).not.toContain('ok');
        expect(result.keywords).not.toContain('to');
      });

      it('deduplicates keywords', () => {
        const result = analyzeQuery('cholesterol cholesterol cholesterol');
        expect(result.keywords.filter((k) => k === 'cholesterol')).toHaveLength(1);
      });

      it('converts keywords to lowercase', () => {
        const result = analyzeQuery('CHOLESTEROL Test RESULTS');
        expect(result.keywords).toContain('cholesterol');
        expect(result.keywords).toContain('test');
        expect(result.keywords).toContain('results');
      });
    });

    describe('date range extraction', () => {
      it('extracts relative date range (years)', () => {
        const result = analyzeQuery('Show me data from the past 2 years');
        expect(result.dateRange).toBeDefined();
        expect(result.dateRange?.start).toBeDefined();
        expect(result.dateRange?.end).toBeDefined();
      });

      it('extracts relative date range (months)', () => {
        const result = analyzeQuery('Show me data from the last 6 months');
        expect(result.dateRange).toBeDefined();
      });

      it('extracts relative date range (weeks)', () => {
        const result = analyzeQuery('Show me data from the past 4 weeks');
        expect(result.dateRange).toBeDefined();
      });

      it('extracts relative date range (days)', () => {
        const result = analyzeQuery('Show me data from the last 30 days');
        expect(result.dateRange).toBeDefined();
      });

      it('extracts "since" patterns with year', () => {
        const result = analyzeQuery('Show me everything since 2023');
        expect(result.dateRange).toBeDefined();
        expect(result.dateRange?.start).toBe('2023-01-01');
      });

      it('extracts single year', () => {
        const result = analyzeQuery('What were my results in 2024?');
        expect(result.dateRange).toBeDefined();
        expect(result.dateRange?.start).toBe('2024-01-01');
        expect(result.dateRange?.end).toBe('2024-12-31');
      });

      it('extracts year range', () => {
        const result = analyzeQuery('Compare 2022 to 2024');
        expect(result.dateRange).toBeDefined();
        expect(result.dateRange?.start).toBe('2022-01-01');
        expect(result.dateRange?.end).toBe('2024-12-31');
      });

      it('returns undefined when no date pattern found', () => {
        const result = analyzeQuery('Show me my cholesterol');
        expect(result.dateRange).toBeUndefined();
      });
    });

    describe('event type detection', () => {
      it('detects lab_result type', () => {
        const result = analyzeQuery('Show me my bloodwork and lab results');
        expect(result.eventTypes).toContain('lab_result');
      });

      it('detects doctor_visit type', () => {
        const result = analyzeQuery('When was my last doctor appointment?');
        expect(result.eventTypes).toContain('doctor_visit');
      });

      it('detects medication type', () => {
        const result = analyzeQuery('What medications am I taking?');
        expect(result.eventTypes).toContain('medication');
      });

      it('detects intervention type', () => {
        const result = analyzeQuery('How has my diet and exercise affected my health?');
        expect(result.eventTypes).toContain('intervention');
      });

      it('detects metric type', () => {
        const result = analyzeQuery('Show me my HRV and heart rate data');
        expect(result.eventTypes).toContain('metric');
      });

      it('detects multiple event types', () => {
        const result = analyzeQuery('Compare my lab results with my medication changes');
        expect(result.eventTypes).toContain('lab_result');
        expect(result.eventTypes).toContain('medication');
      });

      it('returns undefined when no event type matches', () => {
        const result = analyzeQuery('How am I doing overall?');
        expect(result.eventTypes).toBeUndefined();
      });

      it('is case insensitive', () => {
        const result = analyzeQuery('CHOLESTEROL LAB TEST');
        expect(result.eventTypes).toContain('lab_result');
      });

      it('deduplicates event types', () => {
        const result = analyzeQuery('lab lab lab bloodwork blood test');
        expect(result.eventTypes?.filter((t) => t === 'lab_result')).toHaveLength(1);
      });
    });

    describe('entity extraction', () => {
      it('extracts quoted terms', () => {
        const result = analyzeQuery('Search for "Total Cholesterol" values');
        expect(result.entities).toContain('Total Cholesterol');
      });

      it('extracts capitalized words as potential names', () => {
        const result = analyzeQuery('Results from Dr. Smith at Mayo clinic');
        expect(result.entities).toContain('Smith');
        expect(result.entities).toContain('Mayo');
      });

      it('ignores common capitalized words', () => {
        const result = analyzeQuery('What is the trend? How has it changed?');
        expect(result.entities).not.toContain('What');
        expect(result.entities).not.toContain('How');
      });

      it('extracts doctor names with prefix', () => {
        const result = analyzeQuery('My visit with Dr. Johnson');
        expect(result.entities.some((e) => e.toLowerCase().includes('johnson'))).toBe(true);
      });

      it('deduplicates entities', () => {
        const result = analyzeQuery('"Test" "Test" Smith Smith');
        expect(result.entities.filter((e) => e === 'Test')).toHaveLength(1);
        expect(result.entities.filter((e) => e === 'Smith')).toHaveLength(1);
      });
    });

    describe('confidence scoring', () => {
      it('returns higher confidence for multiple keyword matches', () => {
        const lowConfidence = analyzeQuery('Show me trends');
        const highConfidence = analyzeQuery('How has my cholesterol changed over time and what is the trend pattern?');

        expect(highConfidence.confidence).toBeGreaterThan(lowConfidence.confidence);
      });

      it('returns confidence between 0 and 1', () => {
        const queries = [
          'Hello',
          'Show me trends',
          'What is the pattern over time in my health history?',
        ];

        for (const query of queries) {
          const result = analyzeQuery(query);
          expect(result.confidence).toBeGreaterThanOrEqual(0);
          expect(result.confidence).toBeLessThanOrEqual(1);
        }
      });

      it('caps confidence at 1', () => {
        const result = analyzeQuery(
          'trend over time history changes progression evolved trending pattern how has'
        );
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });

    describe('full analysis', () => {
      it('returns complete QueryAnalysis object', () => {
        const result = analyzeQuery('Show me my cholesterol trends from the past 2 years');

        expect(result).toHaveProperty('intent');
        expect(result).toHaveProperty('keywords');
        expect(result).toHaveProperty('dateRange');
        expect(result).toHaveProperty('eventTypes');
        expect(result).toHaveProperty('entities');
        expect(result).toHaveProperty('confidence');
      });

      it('handles empty query', () => {
        const result = analyzeQuery('');

        expect(result.intent).toBe('general');
        expect(result.keywords).toEqual([]);
        expect(result.confidence).toBeLessThanOrEqual(0.3);
      });

      it('handles complex query with all elements', () => {
        const result = analyzeQuery(
          'Compare my "Total Cholesterol" lab results from Dr. Smith over the past 2 years'
        );

        expect(result.intent).toBe('comparison');
        expect(result.keywords.length).toBeGreaterThan(0);
        expect(result.dateRange).toBeDefined();
        expect(result.eventTypes).toContain('lab_result');
        expect(result.entities).toContain('Total Cholesterol');
        expect(result.entities).toContain('Smith');
      });
    });
  });
});
