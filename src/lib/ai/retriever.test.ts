import { describe, it, expect } from 'vitest';
import { retrieveRelevantEvents, getRetrievalStats } from './retriever';
import type { HealthEvent, LabResult, DoctorVisit, Medication, Intervention, Metric, Vice } from '@/types/events';
import type { QueryAnalysis } from './intentDetector';

// Helper to create mock events
function createLabResult(id: string, date: string, title: string, biomarkers: string[] = []): LabResult {
  return {
    id,
    userId: 'user-123',
    type: 'lab_result',
    title,
    date,
    biomarkers: biomarkers.map((name) => ({ name, value: 100, unit: 'mg/dL' })),
    createdAt: date,
    updatedAt: date,
  };
}

function createDoctorVisit(id: string, date: string, title: string, overrides: Partial<DoctorVisit> = {}): DoctorVisit {
  return {
    id,
    userId: 'user-123',
    type: 'doctor_visit',
    title,
    date,
    doctorName: 'Dr. Smith',
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

function createMedication(id: string, date: string, title: string, overrides: Partial<Medication> = {}): Medication {
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
    ...overrides,
  };
}

function createIntervention(id: string, date: string, title: string, overrides: Partial<Intervention> = {}): Intervention {
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
    ...overrides,
  };
}

function createMetric(id: string, date: string, title: string, overrides: Partial<Metric> = {}): Metric {
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
    ...overrides,
  };
}

function createVice(id: string, date: string, title: string, overrides: Partial<Vice> = {}): Vice {
  return {
    id,
    userId: 'user-123',
    type: 'vice',
    title,
    date,
    viceCategory: 'alcohol',
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

function createAnalysis(overrides: Partial<QueryAnalysis> = {}): QueryAnalysis {
  return {
    intent: 'general',
    confidence: 0.8,
    keywords: [],
    entities: [],
    ...overrides,
  };
}

describe('retriever', () => {
  describe('retrieveRelevantEvents', () => {
    describe('date range filtering', () => {
      it('filters events by start date', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Early'),
          createLabResult('2', '2024-06-01', 'Middle'),
          createLabResult('3', '2024-12-01', 'Late'),
        ];

        const analysis = createAnalysis({
          dateRange: { start: '2024-05-01' },
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(2);
        expect(result.map((e) => e.id)).toEqual(['3', '2']);
      });

      it('filters events by end date', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Early'),
          createLabResult('2', '2024-06-01', 'Middle'),
          createLabResult('3', '2024-12-01', 'Late'),
        ];

        const analysis = createAnalysis({
          dateRange: { end: '2024-07-01' },
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(2);
        expect(result.map((e) => e.id)).toEqual(['2', '1']);
      });

      it('filters events by both start and end date', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Early'),
          createLabResult('2', '2024-06-01', 'Middle'),
          createLabResult('3', '2024-12-01', 'Late'),
        ];

        const analysis = createAnalysis({
          dateRange: { start: '2024-03-01', end: '2024-09-01' },
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('2');
      });

      it('returns all events when no date range specified', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Event 1'),
          createLabResult('2', '2024-06-01', 'Event 2'),
        ];

        const analysis = createAnalysis();

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(2);
      });
    });

    describe('event type filtering', () => {
      it('filters events by single type', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Lab'),
          createDoctorVisit('2', '2024-01-02', 'Visit'),
          createMedication('3', '2024-01-03', 'Med'),
        ];

        const analysis = createAnalysis({
          eventTypes: ['lab_result'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('lab_result');
      });

      it('filters events by multiple types', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Lab'),
          createDoctorVisit('2', '2024-01-02', 'Visit'),
          createMedication('3', '2024-01-03', 'Med'),
        ];

        const analysis = createAnalysis({
          eventTypes: ['lab_result', 'medication'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(2);
        expect(result.map((e) => e.type)).toContain('lab_result');
        expect(result.map((e) => e.type)).toContain('medication');
      });

      it('returns all events when no types specified', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Lab'),
          createDoctorVisit('2', '2024-01-02', 'Visit'),
        ];

        const analysis = createAnalysis({
          eventTypes: [],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(2);
      });
    });

    describe('keyword scoring', () => {
      it('scores events with keyword matches higher', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Blood Panel'),
          createLabResult('2', '2024-01-02', 'Lipid Panel'),
          createLabResult('3', '2024-01-03', 'Other Test'),
        ];

        const analysis = createAnalysis({
          keywords: ['lipid'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result[0].id).toBe('2'); // Lipid Panel should be first
      });

      it('scores title matches higher than content matches', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Glucose Test', ['Glucose']),
          createLabResult('2', '2024-01-02', 'Other Test', ['Glucose']),
        ];

        const analysis = createAnalysis({
          keywords: ['glucose'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        // Title match should rank higher
        expect(result[0].id).toBe('1');
      });

      it('gives bonus for entity matches', () => {
        const events: HealthEvent[] = [
          createDoctorVisit('1', '2024-01-01', 'Checkup', { doctorName: 'Dr. Johnson' }),
          createDoctorVisit('2', '2024-01-02', 'Visit', { doctorName: 'Dr. Smith' }),
        ];

        const analysis = createAnalysis({
          entities: ['Dr. Johnson'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result[0].id).toBe('1');
      });

      it('returns all events sorted by date when no keywords match', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Event A'),
          createLabResult('2', '2024-06-01', 'Event B'),
          createLabResult('3', '2024-03-01', 'Event C'),
        ];

        const analysis = createAnalysis({
          keywords: ['nonexistent'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(3);
        // Should be sorted by date (newest first)
        expect(result[0].id).toBe('2');
        expect(result[1].id).toBe('3');
        expect(result[2].id).toBe('1');
      });

      it('returns events sorted by score when matches exist', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Blood Test'),
          createLabResult('2', '2024-01-02', 'Cholesterol Panel', ['cholesterol', 'HDL', 'LDL']),
          createLabResult('3', '2024-01-03', 'Lipid Profile', ['cholesterol']),
        ];

        const analysis = createAnalysis({
          keywords: ['cholesterol'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        // Event 2 has cholesterol in biomarkers, Event 3 has it in biomarkers too
        // Both should rank higher than Event 1
        expect(result[0].id).not.toBe('1');
      });
    });

    describe('searchable text building', () => {
      it('includes lab result specific fields', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Test', ['Glucose', 'Hemoglobin']),
        ];
        (events[0] as LabResult).labName = 'Quest Diagnostics';
        (events[0] as LabResult).orderingDoctor = 'Dr. Wilson';

        const analysis = createAnalysis({
          keywords: ['quest'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
      });

      it('includes doctor visit specific fields', () => {
        const events: HealthEvent[] = [
          createDoctorVisit('1', '2024-01-01', 'Visit', {
            specialty: 'Cardiology',
            facility: 'City Hospital',
            diagnosis: ['Hypertension'],
          }),
        ];

        const analysis = createAnalysis({
          keywords: ['cardiology'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result[0].id).toBe('1');
      });

      it('includes medication specific fields', () => {
        const events: HealthEvent[] = [
          createMedication('1', '2024-01-01', 'Med', {
            medicationName: 'Metformin',
            prescriber: 'Dr. Garcia',
            reason: 'Blood sugar control',
          }),
        ];

        const analysis = createAnalysis({
          keywords: ['metformin'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result[0].id).toBe('1');
      });

      it('includes intervention specific fields', () => {
        const events: HealthEvent[] = [
          createIntervention('1', '2024-01-01', 'Diet', {
            interventionName: 'Keto Diet',
            category: 'diet',
            protocol: 'Low carb high fat',
          }),
        ];

        const analysis = createAnalysis({
          keywords: ['keto'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result[0].id).toBe('1');
      });

      it('includes metric specific fields', () => {
        const events: HealthEvent[] = [
          createMetric('1', '2024-01-01', 'Weight', {
            metricName: 'Body Weight',
            source: 'smart_scale',
          }),
        ];

        const analysis = createAnalysis({
          keywords: ['smart_scale'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result[0].id).toBe('1');
      });

      it('includes vice specific fields', () => {
        const events: HealthEvent[] = [
          createVice('1', '2024-01-01', 'Drink', {
            viceCategory: 'alcohol',
            context: 'Social gathering',
            trigger: 'Stress',
          }),
        ];

        const analysis = createAnalysis({
          keywords: ['stress'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result[0].id).toBe('1');
      });

      it('includes notes in searchable text', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Test'),
        ];
        events[0].notes = 'Fasting blood work';

        const analysis = createAnalysis({
          keywords: ['fasting'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result[0].id).toBe('1');
      });

      it('includes tags in searchable text', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Test'),
        ];
        events[0].tags = ['annual', 'routine'];

        const analysis = createAnalysis({
          keywords: ['annual'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result[0].id).toBe('1');
      });
    });

    describe('combined filtering', () => {
      it('applies date range and event type filters together', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Early Lab'),
          createLabResult('2', '2024-06-01', 'Middle Lab'),
          createDoctorVisit('3', '2024-06-01', 'Middle Visit'),
          createLabResult('4', '2024-12-01', 'Late Lab'),
        ];

        const analysis = createAnalysis({
          eventTypes: ['lab_result'],
          dateRange: { start: '2024-05-01' },
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(2);
        expect(result.every((e) => e.type === 'lab_result')).toBe(true);
      });

      it('applies all filters and keyword scoring together', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Glucose Test'),
          createLabResult('2', '2024-06-01', 'Glucose Test'),
          createLabResult('3', '2024-06-01', 'Other Test'),
          createDoctorVisit('4', '2024-06-01', 'Glucose Checkup'),
        ];

        const analysis = createAnalysis({
          eventTypes: ['lab_result'],
          dateRange: { start: '2024-05-01' },
          keywords: ['glucose'],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('2'); // Glucose Test should rank first
      });
    });

    describe('edge cases', () => {
      it('handles empty events array', () => {
        const result = retrieveRelevantEvents([], createAnalysis());

        expect(result).toHaveLength(0);
      });

      it('handles analysis with no keywords or entities', () => {
        const events: HealthEvent[] = [
          createLabResult('1', '2024-01-01', 'Test'),
        ];

        const analysis = createAnalysis({
          keywords: [],
          entities: [],
        });

        const result = retrieveRelevantEvents(events, analysis);

        expect(result).toHaveLength(1);
      });
    });
  });

  describe('getRetrievalStats', () => {
    it('counts total events', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-01-01', 'Lab 1'),
        createLabResult('2', '2024-01-02', 'Lab 2'),
        createDoctorVisit('3', '2024-01-03', 'Visit'),
      ];

      const stats = getRetrievalStats(events);

      expect(stats.totalCount).toBe(3);
    });

    it('groups events by type', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-01-01', 'Lab 1'),
        createLabResult('2', '2024-01-02', 'Lab 2'),
        createDoctorVisit('3', '2024-01-03', 'Visit'),
        createMedication('4', '2024-01-04', 'Med'),
      ];

      const stats = getRetrievalStats(events);

      expect(stats.byType).toEqual({
        lab_result: 2,
        doctor_visit: 1,
        medication: 1,
      });
    });

    it('calculates correct date range', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-06-15', 'Middle'),
        createLabResult('2', '2024-01-01', 'Earliest'),
        createLabResult('3', '2024-12-31', 'Latest'),
      ];

      const stats = getRetrievalStats(events);

      expect(stats.dateRange.earliest).toBe('2024-01-01T00:00:00.000Z');
      expect(stats.dateRange.latest).toBe('2024-12-31T00:00:00.000Z');
    });

    it('handles empty array', () => {
      const stats = getRetrievalStats([]);

      expect(stats.totalCount).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.dateRange.earliest).toBeNull();
      expect(stats.dateRange.latest).toBeNull();
    });

    it('handles single event', () => {
      const events: HealthEvent[] = [
        createLabResult('1', '2024-06-15', 'Only'),
      ];

      const stats = getRetrievalStats(events);

      expect(stats.totalCount).toBe(1);
      expect(stats.byType).toEqual({ lab_result: 1 });
      expect(stats.dateRange.earliest).toBe('2024-06-15T00:00:00.000Z');
      expect(stats.dateRange.latest).toBe('2024-06-15T00:00:00.000Z');
    });
  });
});
