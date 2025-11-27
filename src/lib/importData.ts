import type { HealthEvent, CreateEventInput, EventType } from '@/types';

// Valid event types
const VALID_EVENT_TYPES: EventType[] = [
  'lab_result',
  'doctor_visit',
  'medication',
  'intervention',
  'metric',
];

export interface ImportResult {
  success: boolean;
  events: CreateEventInput[];
  errors: string[];
  warnings: string[];
}

export interface ImportedData {
  version?: string;
  exportedAt?: string;
  count?: number;
  events: HealthEvent[];
}

/**
 * Parse and validate JSON import data
 */
export function parseImportFile(content: string): ImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const events: CreateEventInput[] = [];

  try {
    const data = JSON.parse(content) as ImportedData;

    // Validate structure
    if (!data.events || !Array.isArray(data.events)) {
      return {
        success: false,
        events: [],
        errors: ['Invalid file format: missing "events" array'],
        warnings: [],
      };
    }

    // Check version compatibility
    if (data.version && data.version !== '1.0') {
      warnings.push(`File version "${data.version}" may not be fully compatible`);
    }

    // Validate each event
    for (let i = 0; i < data.events.length; i++) {
      const event = data.events[i];
      const eventErrors: string[] = [];

      // Validate required base fields
      if (!event.type || !VALID_EVENT_TYPES.includes(event.type)) {
        eventErrors.push(`Invalid or missing event type`);
      }

      if (!event.date) {
        eventErrors.push(`Missing date`);
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date)) {
        eventErrors.push(`Invalid date format (expected YYYY-MM-DD)`);
      }

      if (!event.title || typeof event.title !== 'string') {
        eventErrors.push(`Missing or invalid title`);
      }

      // Type-specific validation
      if (event.type === 'lab_result') {
        if (!event.biomarkers || !Array.isArray(event.biomarkers)) {
          eventErrors.push(`Missing or invalid biomarkers array`);
        }
      }

      if (event.type === 'doctor_visit') {
        if (!event.doctorName || typeof event.doctorName !== 'string') {
          eventErrors.push(`Missing doctor name`);
        }
      }

      if (event.type === 'medication') {
        if (!event.medicationName) eventErrors.push(`Missing medication name`);
        if (!event.dosage) eventErrors.push(`Missing dosage`);
        if (!event.frequency) eventErrors.push(`Missing frequency`);
        if (!event.startDate) eventErrors.push(`Missing start date`);
        if (event.isActive === undefined) eventErrors.push(`Missing isActive flag`);
      }

      if (event.type === 'intervention') {
        if (!event.interventionName) eventErrors.push(`Missing intervention name`);
        if (!event.category) eventErrors.push(`Missing category`);
        if (!event.startDate) eventErrors.push(`Missing start date`);
        if (event.isOngoing === undefined) eventErrors.push(`Missing isOngoing flag`);
      }

      if (event.type === 'metric') {
        if (!event.metricName) eventErrors.push(`Missing metric name`);
        if (event.value === undefined) eventErrors.push(`Missing value`);
        if (!event.unit) eventErrors.push(`Missing unit`);
        if (!event.source) eventErrors.push(`Missing source`);
      }

      if (eventErrors.length > 0) {
        errors.push(`Event ${i + 1} (${event.title || 'untitled'}): ${eventErrors.join(', ')}`);
      } else {
        // Convert to CreateEventInput (strip id, userId, createdAt, updatedAt)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, userId, createdAt, updatedAt, ...createInput } = event;
        events.push(createInput as CreateEventInput);
      }
    }

    return {
      success: errors.length === 0,
      events,
      errors,
      warnings,
    };
  } catch (err) {
    return {
      success: false,
      events: [],
      errors: [`Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`],
      warnings: [],
    };
  }
}

/**
 * Read file content as text
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
