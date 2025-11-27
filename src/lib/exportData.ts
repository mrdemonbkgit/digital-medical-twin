import type { HealthEvent } from '@/types';

export interface ExportOptions {
  format: 'json' | 'csv';
  filename?: string;
}

/**
 * Export health events to JSON format
 */
export function exportToJSON(events: HealthEvent[], filename?: string): void {
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    count: events.length,
    events: events,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });

  downloadBlob(blob, filename || `health-events-${formatDateForFilename()}.json`);
}

/**
 * Export health events to CSV format
 */
export function exportToCSV(events: HealthEvent[], filename?: string): void {
  if (events.length === 0) {
    return;
  }

  // Define CSV columns - flatten common fields plus type-specific ones
  const columns = [
    'id',
    'type',
    'date',
    'title',
    'notes',
    'tags',
    'createdAt',
    'updatedAt',
    // Lab Result
    'labName',
    'orderingDoctor',
    'biomarkers',
    // Doctor Visit
    'doctorName',
    'specialty',
    'facility',
    'diagnosis',
    'followUp',
    // Medication
    'medicationName',
    'dosage',
    'frequency',
    'prescriber',
    'reason',
    'startDate',
    'endDate',
    'isActive',
    'sideEffects',
    // Intervention
    'interventionName',
    'category',
    'protocol',
    'isOngoing',
    // Metric
    'source',
    'metricName',
    'value',
    'unit',
  ];

  const rows = events.map((event) => {
    return columns.map((col) => {
      const value = (event as unknown as Record<string, unknown>)[col];

      if (value === undefined || value === null) {
        return '';
      }

      if (Array.isArray(value)) {
        // For arrays like tags, diagnosis, biomarkers - stringify them
        return JSON.stringify(value);
      }

      if (typeof value === 'object') {
        return JSON.stringify(value);
      }

      if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }

      // Escape quotes and wrap in quotes if contains comma/quote/newline
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    });
  });

  const csvContent = [columns.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename || `health-events-${formatDateForFilename()}.csv`);
}

/**
 * Export events with the specified format
 */
export function exportEvents(
  events: HealthEvent[],
  options: ExportOptions = { format: 'json' }
): void {
  if (options.format === 'csv') {
    exportToCSV(events, options.filename);
  } else {
    exportToJSON(events, options.filename);
  }
}

/**
 * Create and trigger download of a blob
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format current date for filename (YYYY-MM-DD)
 */
function formatDateForFilename(): string {
  return new Date().toISOString().split('T')[0];
}
