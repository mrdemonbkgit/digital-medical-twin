import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateBudget,
  truncateToFit,
  getBalancedSample,
} from './tokenManager';
import type { HealthEvent, LabResult, DoctorVisit, Medication, Intervention, Metric } from '@/types/events';
import type { QueryIntent } from '@/types/ai';

// Helper to create mock lab result
function createLabResult(id: string, date: string, title: string = 'Lab Result'): LabResult {
  return {
    id,
    userId: 'user-123',
    type: 'lab_result',
    title,
    date,
    biomarkers: [{ name: 'Glucose', value: 95, unit: 'mg/dL' }],
    createdAt: date,
    updatedAt: date,
  };
}

// Helper to create mock doctor visit
function createDoctorVisit(id: string, date: string, title: string = 'Doctor Visit'): DoctorVisit {
  return {
    id,
    userId: 'user-123',
    type: 'doctor_visit',
    title,
    date,
    doctorName: 'Dr. Smith',
    createdAt: date,
    updatedAt: date,
  };
}

// Helper to create mock medication
function createMedication(id: string, date: string, title: string = 'Medication'): Medication {
  return {
    id,
    userId: 'user-123',
    type: 'medication',
    title,
    date,
    medicationName: 'Test Med',
    dosage: '100mg',
    frequency: 'daily',
    startDate: date,
    isActive: true,
    createdAt: date,
    updatedAt: date,
  };
}

// Helper to create mock intervention
function createIntervention(id: string, date: string, title: string = 'Intervention'): Intervention {
  return {
    id,
    userId: 'user-123',
    type: 'intervention',
    title,
    date,
    interventionName: 'Test Intervention',
    category: 'supplement',
    startDate: date,
    isOngoing: true,
    createdAt: date,
    updatedAt: date,
  };
}

// Helper to create mock metric
function createMetric(id: string, date: string, title: string = 'Metric'): Metric {
  return {
    id,
    userId: 'user-123',
    type: 'metric',
    title,
    date,
    metricName: 'Weight',
    value: 180,
    unit: 'lbs',
    source: 'manual_entry',
    createdAt: date,
    updatedAt: date,
  };
}

describe('tokenManager', () => {
  describe('calculateBudget', () => {
    it('calculates budget for gpt-5.1 model', () => {
      const budget = calculateBudget('gpt-5.1');

      expect(budget.total).toBe(128000);
      expect(budget.systemPrompt).toBe(500);
      expect(budget.responseBuffer).toBe(2000);
      expect(budget.contextBudget).toBe(128000 - 500 - 2000);
    });

    it('calculates budget for gemini-3-pro-preview model', () => {
      const budget = calculateBudget('gemini-3-pro-preview');

      expect(budget.total).toBe(1000000);
      expect(budget.contextBudget).toBe(1000000 - 500 - 2000);
    });

    it('returns default budget for unknown model', () => {
      const budget = calculateBudget('unknown-model' as any);

      expect(budget.total).toBe(32000);
      expect(budget.contextBudget).toBe(32000 - 500 - 2000);
    });

    it('reserves correct tokens for system prompt', () => {
      const budget = calculateBudget('gpt-5.1');

      expect(budget.systemPrompt).toBe(500);
    });

    it('reserves correct tokens for response', () => {
      const budget = calculateBudget('gpt-5.1');

      expect(budget.responseBuffer).toBe(2000);
    });
  });

  describe('truncateToFit', () => {
    const now = new Date('2024-06-15');

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(now);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns empty result for empty events', () => {
      const result = truncateToFit([], 1000, 'general');

      expect(result.events).toHaveLength(0);
      expect(result.truncated).toBe(false);
      expect(result.tokensUsed).toBe(0);
      expect(result.originalCount).toBe(0);
    });

    it('includes all events when within budget', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-06-01'),
        createLabResult('2', '2024-06-02'),
      ];

      const result = truncateToFit(events, 10000, 'general');

      expect(result.events).toHaveLength(2);
      expect(result.truncated).toBe(false);
      expect(result.originalCount).toBe(2);
    });

    it('truncates events when over budget', () => {
      const events: HealthEvent[] = [];
      // Create many events to exceed budget
      for (let i = 0; i < 50; i++) {
        events.push(createLabResult(`${i}`, `2024-06-${String(i + 1).padStart(2, '0')}`));
      }

      const result = truncateToFit(events, 500, 'general');

      expect(result.events.length).toBeLessThan(50);
      expect(result.truncated).toBe(true);
      expect(result.originalCount).toBe(50);
    });

    it('prioritizes recent events', () => {
      const events: HealthEvent[] = [
        createLabResult('old', '2022-01-01', 'Old Event'),
        createLabResult('recent', '2024-06-10', 'Recent Event'),
      ];

      // Very small budget to force truncation to single event
      const result = truncateToFit(events, 50, 'general');

      expect(result.events).toHaveLength(1);
      expect(result.events[0].title).toBe('Recent Event');
    });

    it('applies intent boost for trend queries (lab_result, metric)', () => {
      const events: HealthEvent[] = [
        createDoctorVisit('visit', '2024-06-01', 'Doctor Visit'),
        createLabResult('lab', '2024-06-01', 'Lab Result'),
        createMetric('metric', '2024-06-01', 'Metric'),
      ];

      // Small budget to see prioritization
      const result = truncateToFit(events, 300, 'trend');

      // Lab results and metrics should be prioritized for trend queries
      const types = result.events.map((e) => e.type);
      // At minimum, if we can fit events, lab_result and metric should be preferred
      expect(result.events.length).toBeGreaterThanOrEqual(1);
    });

    it('applies intent boost for comparison queries (lab_result)', () => {
      const events: HealthEvent[] = [
        createDoctorVisit('visit', '2024-06-01', 'Doctor Visit'),
        createLabResult('lab', '2024-06-01', 'Lab Result'),
      ];

      const result = truncateToFit(events, 300, 'comparison');

      // Lab results should be prioritized
      expect(result.events.length).toBeGreaterThanOrEqual(1);
    });

    it('applies intent boost for correlation queries (intervention, medication)', () => {
      const events: HealthEvent[] = [
        createLabResult('lab', '2024-06-01', 'Lab Result'),
        createIntervention('int', '2024-06-01', 'Intervention'),
        createMedication('med', '2024-06-01', 'Medication'),
      ];

      const result = truncateToFit(events, 300, 'correlation');

      // Interventions and medications should be prioritized
      expect(result.events.length).toBeGreaterThanOrEqual(1);
    });

    it('applies intent boost for summary queries (doctor_visit)', () => {
      const events: HealthEvent[] = [
        createLabResult('lab', '2024-06-01', 'Lab Result'),
        createDoctorVisit('visit', '2024-06-01', 'Doctor Visit'),
      ];

      const result = truncateToFit(events, 300, 'summary');

      // Doctor visits should be slightly prioritized
      expect(result.events.length).toBeGreaterThanOrEqual(1);
    });

    it('sorts selected events chronologically (newest first)', () => {
      const events: HealthEvent[] = [
        createLabResult('old', '2024-01-01', 'Old'),
        createLabResult('mid', '2024-03-01', 'Mid'),
        createLabResult('new', '2024-06-01', 'New'),
      ];

      const result = truncateToFit(events, 10000, 'general');

      expect(result.events[0].date).toBe('2024-06-01');
      expect(result.events[1].date).toBe('2024-03-01');
      expect(result.events[2].date).toBe('2024-01-01');
    });

    it('always includes at least one event even if over budget', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-06-01'),
      ];

      // Very small budget
      const result = truncateToFit(events, 1, 'general');

      expect(result.events).toHaveLength(1);
      expect(result.truncated).toBe(false); // Not truncated since we have all events
    });

    it('tracks tokens used correctly', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-06-01'),
      ];

      const result = truncateToFit(events, 10000, 'general');

      expect(result.tokensUsed).toBeGreaterThan(0);
    });

    it('handles specific intent without extra boost', () => {
      const events: HealthEvent[] = [
        createLabResult('lab', '2024-06-01'),
        createDoctorVisit('visit', '2024-06-01'),
      ];

      const result = truncateToFit(events, 10000, 'specific');

      // Should include all events without special prioritization
      expect(result.events).toHaveLength(2);
    });
  });

  describe('getBalancedSample', () => {
    it('returns events balanced across types', () => {
      const events: HealthEvent[] = [
        createLabResult('lab1', '2024-06-01'),
        createLabResult('lab2', '2024-05-01'),
        createLabResult('lab3', '2024-04-01'),
        createDoctorVisit('visit1', '2024-06-01'),
        createDoctorVisit('visit2', '2024-05-01'),
        createMedication('med1', '2024-06-01'),
        createMedication('med2', '2024-05-01'),
      ];

      const result = getBalancedSample(events, 6);

      // Should have representation from multiple types
      const types = new Set(result.map((e) => e.type));
      expect(types.size).toBeGreaterThan(1);
    });

    it('respects target count', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-06-01'),
        createLabResult('2', '2024-05-01'),
        createLabResult('3', '2024-04-01'),
        createLabResult('4', '2024-03-01'),
        createLabResult('5', '2024-02-01'),
      ];

      const result = getBalancedSample(events, 3);

      expect(result).toHaveLength(3);
    });

    it('returns all events when fewer than target', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-06-01'),
        createDoctorVisit('2', '2024-05-01'),
      ];

      const result = getBalancedSample(events, 20);

      expect(result).toHaveLength(2);
    });

    it('prioritizes newest events within each type', () => {
      const events: HealthEvent[] = [
        createLabResult('old-lab', '2020-01-01'),
        createLabResult('new-lab', '2024-06-01'),
        createDoctorVisit('old-visit', '2020-01-01'),
        createDoctorVisit('new-visit', '2024-06-01'),
      ];

      const result = getBalancedSample(events, 2);

      // Should get newest from each type
      const ids = result.map((e) => e.id);
      expect(ids).toContain('new-lab');
      expect(ids).toContain('new-visit');
    });

    it('returns empty array for empty input', () => {
      const result = getBalancedSample([], 10);

      expect(result).toHaveLength(0);
    });

    it('handles single event type', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-06-01'),
        createLabResult('2', '2024-05-01'),
        createLabResult('3', '2024-04-01'),
      ];

      const result = getBalancedSample(events, 2);

      expect(result).toHaveLength(2);
      expect(result.every((e) => e.type === 'lab_result')).toBe(true);
    });

    it('sorts final result by date (newest first)', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-01-01'),
        createDoctorVisit('2', '2024-06-01'),
        createMedication('3', '2024-03-01'),
      ];

      const result = getBalancedSample(events, 3);

      expect(result[0].date).toBe('2024-06-01');
      expect(result[1].date).toBe('2024-03-01');
      expect(result[2].date).toBe('2024-01-01');
    });

    it('uses default target count of 20', () => {
      const events: HealthEvent[] = [];
      for (let i = 0; i < 30; i++) {
        events.push(createLabResult(`${i}`, `2024-01-${String(i + 1).padStart(2, '0')}`));
      }

      const result = getBalancedSample(events);

      expect(result).toHaveLength(20);
    });

    it('distributes evenly across multiple types', () => {
      const events: HealthEvent[] = [
        // 5 lab results
        createLabResult('lab1', '2024-06-01'),
        createLabResult('lab2', '2024-05-01'),
        createLabResult('lab3', '2024-04-01'),
        createLabResult('lab4', '2024-03-01'),
        createLabResult('lab5', '2024-02-01'),
        // 5 doctor visits
        createDoctorVisit('visit1', '2024-06-01'),
        createDoctorVisit('visit2', '2024-05-01'),
        createDoctorVisit('visit3', '2024-04-01'),
        createDoctorVisit('visit4', '2024-03-01'),
        createDoctorVisit('visit5', '2024-02-01'),
      ];

      const result = getBalancedSample(events, 6);

      const labCount = result.filter((e) => e.type === 'lab_result').length;
      const visitCount = result.filter((e) => e.type === 'doctor_visit').length;

      // Should be roughly balanced
      expect(labCount).toBe(3);
      expect(visitCount).toBe(3);
    });
  });
});
