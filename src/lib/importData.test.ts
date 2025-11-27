import { describe, it, expect } from 'vitest';
import { parseImportFile } from './importData';

describe('importData', () => {
  describe('parseImportFile', () => {
    it('parses valid JSON with events', () => {
      const content = JSON.stringify({
        version: '1.0',
        exportedAt: '2025-11-27T12:00:00Z',
        count: 1,
        events: [
          {
            id: '123',
            type: 'lab_result',
            date: '2025-11-27',
            title: 'Blood Test',
            biomarkers: [{ name: 'Glucose', value: 100, unit: 'mg/dL' }],
          },
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(true);
      expect(result.events.length).toBe(1);
      expect(result.errors.length).toBe(0);
      // id should be stripped from CreateEventInput
      expect(result.events[0]).not.toHaveProperty('id');
    });

    it('returns error for invalid JSON', () => {
      const result = parseImportFile('not valid json {{{');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to parse JSON');
    });

    it('returns error for missing events array', () => {
      const content = JSON.stringify({ version: '1.0' });
      const result = parseImportFile(content);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('missing "events" array');
    });

    it('adds warning for incompatible version', () => {
      const content = JSON.stringify({
        version: '2.0',
        events: [
          {
            type: 'lab_result',
            date: '2025-11-27',
            title: 'Test',
            biomarkers: [],
          },
        ],
      });

      const result = parseImportFile(content);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('not be fully compatible');
    });

    it('validates required base fields', () => {
      const content = JSON.stringify({
        events: [
          { title: 'Test' }, // missing type and date
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid or missing event type');
      expect(result.errors[0]).toContain('Missing date');
    });

    it('validates date format', () => {
      const content = JSON.stringify({
        events: [
          {
            type: 'lab_result',
            date: '11/27/2025', // wrong format
            title: 'Test',
            biomarkers: [],
          },
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Invalid date format');
    });

    it('validates lab_result specific fields', () => {
      const content = JSON.stringify({
        events: [
          {
            type: 'lab_result',
            date: '2025-11-27',
            title: 'Test',
            // missing biomarkers
          },
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('biomarkers');
    });

    it('validates doctor_visit specific fields', () => {
      const content = JSON.stringify({
        events: [
          {
            type: 'doctor_visit',
            date: '2025-11-27',
            title: 'Checkup',
            // missing doctorName
          },
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('doctor name');
    });

    it('validates medication specific fields', () => {
      const content = JSON.stringify({
        events: [
          {
            type: 'medication',
            date: '2025-11-27',
            title: 'Started Vitamin D',
            // missing required fields
          },
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('medication name');
      expect(result.errors[0]).toContain('dosage');
      expect(result.errors[0]).toContain('frequency');
    });

    it('validates intervention specific fields', () => {
      const content = JSON.stringify({
        events: [
          {
            type: 'intervention',
            date: '2025-11-27',
            title: 'Started Keto',
            // missing required fields
          },
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('intervention name');
      expect(result.errors[0]).toContain('category');
    });

    it('validates metric specific fields', () => {
      const content = JSON.stringify({
        events: [
          {
            type: 'metric',
            date: '2025-11-27',
            title: 'Weight',
            // missing required fields
          },
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('metric name');
      expect(result.errors[0]).toContain('value');
      expect(result.errors[0]).toContain('unit');
    });

    it('accepts valid complete medication event', () => {
      const content = JSON.stringify({
        events: [
          {
            type: 'medication',
            date: '2025-11-27',
            title: 'Started Vitamin D',
            medicationName: 'Vitamin D3',
            dosage: '5000 IU',
            frequency: 'daily',
            startDate: '2025-11-27',
            isActive: true,
          },
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(true);
      expect(result.events.length).toBe(1);
    });

    it('handles multiple events with mixed validity', () => {
      const content = JSON.stringify({
        events: [
          {
            type: 'lab_result',
            date: '2025-11-27',
            title: 'Valid Lab',
            biomarkers: [],
          },
          {
            type: 'invalid_type',
            date: '2025-11-27',
            title: 'Invalid Event',
          },
          {
            type: 'doctor_visit',
            date: '2025-11-27',
            title: 'Valid Visit',
            doctorName: 'Dr. Smith',
          },
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(false); // has errors
      expect(result.events.length).toBe(2); // 2 valid events
      expect(result.errors.length).toBe(1); // 1 invalid event
    });

    it('strips metadata fields from events', () => {
      const content = JSON.stringify({
        events: [
          {
            id: 'should-be-stripped',
            userId: 'should-be-stripped',
            createdAt: '2025-11-27T12:00:00Z',
            updatedAt: '2025-11-27T12:00:00Z',
            type: 'lab_result',
            date: '2025-11-27',
            title: 'Test',
            biomarkers: [],
          },
        ],
      });

      const result = parseImportFile(content);

      expect(result.success).toBe(true);
      expect(result.events[0]).not.toHaveProperty('id');
      expect(result.events[0]).not.toHaveProperty('userId');
      expect(result.events[0]).not.toHaveProperty('createdAt');
      expect(result.events[0]).not.toHaveProperty('updatedAt');
    });
  });
});
