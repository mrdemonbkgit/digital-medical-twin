import type { HealthEvent, Biomarker } from '@/types/events';
import { formatContextHeader, CONTEXT_FOOTER } from './prompts';

/**
 * Format a single biomarker for context
 */
function formatBiomarker(biomarker: Biomarker): string {
  const flag = biomarker.flag && biomarker.flag !== 'normal' ? ` (${biomarker.flag})` : '';
  const ref =
    biomarker.referenceMin !== undefined && biomarker.referenceMax !== undefined
      ? ` [ref: ${biomarker.referenceMin}-${biomarker.referenceMax}]`
      : '';
  return `- ${biomarker.name}: ${biomarker.value} ${biomarker.unit}${flag}${ref}`;
}

/**
 * Format type-specific details for an event
 */
function formatEventDetails(event: HealthEvent): string {
  const lines: string[] = [];

  switch (event.type) {
    case 'lab_result':
      if (event.labName) lines.push(`Lab: ${event.labName}`);
      if (event.orderingDoctor) lines.push(`Ordered by: ${event.orderingDoctor}`);
      if (event.biomarkers && event.biomarkers.length > 0) {
        lines.push('Biomarkers:');
        lines.push(...event.biomarkers.map(formatBiomarker));
      }
      break;

    case 'doctor_visit':
      lines.push(`Doctor: ${event.doctorName}`);
      if (event.specialty) lines.push(`Specialty: ${event.specialty}`);
      if (event.facility) lines.push(`Facility: ${event.facility}`);
      if (event.diagnosis && event.diagnosis.length > 0) {
        lines.push(`Diagnosis: ${event.diagnosis.join(', ')}`);
      }
      if (event.followUp) lines.push(`Follow-up: ${event.followUp}`);
      break;

    case 'medication':
      lines.push(`Medication: ${event.medicationName}`);
      lines.push(`Dosage: ${event.dosage} ${event.frequency}`);
      if (event.prescriber) lines.push(`Prescriber: ${event.prescriber}`);
      if (event.reason) lines.push(`Reason: ${event.reason}`);
      lines.push(`Started: ${event.startDate}`);
      if (event.endDate) lines.push(`Ended: ${event.endDate}`);
      lines.push(`Status: ${event.isActive ? 'Currently taking' : 'Discontinued'}`);
      if (event.sideEffects && event.sideEffects.length > 0) {
        lines.push(`Side effects: ${event.sideEffects.join(', ')}`);
      }
      break;

    case 'intervention':
      lines.push(`Intervention: ${event.interventionName}`);
      lines.push(`Category: ${event.category}`);
      lines.push(`Started: ${event.startDate}`);
      if (event.endDate) lines.push(`Ended: ${event.endDate}`);
      lines.push(`Status: ${event.isOngoing ? 'Ongoing' : 'Completed'}`);
      if (event.protocol) lines.push(`Protocol: ${event.protocol}`);
      break;

    case 'metric':
      lines.push(`Metric: ${event.metricName}`);
      lines.push(`Value: ${event.value} ${event.unit}`);
      lines.push(`Source: ${event.source}`);
      break;
  }

  return lines.join('\n');
}

/**
 * Format a single event for the context prompt
 */
export function formatEventForContext(event: HealthEvent): string {
  const typeLabel = event.type.toUpperCase().replace('_', ' ');
  const header = `[${typeLabel}] ${event.date}: ${event.title}`;
  const details = formatEventDetails(event);
  const notes = event.notes ? `Notes: ${event.notes}` : '';
  const tags = event.tags && event.tags.length > 0 ? `Tags: ${event.tags.join(', ')}` : '';

  return [header, details, notes, tags].filter(Boolean).join('\n');
}

/**
 * Format multiple events into a context string for the AI prompt
 */
export function formatEventsForContext(
  events: HealthEvent[],
  truncated: boolean = false
): string {
  if (events.length === 0) {
    return `${formatContextHeader(0, false)}

No health events found matching the query criteria.

${CONTEXT_FOOTER}`;
  }

  const formattedEvents = events.map(formatEventForContext).join('\n\n---\n\n');

  return `${formatContextHeader(events.length, truncated)}

${formattedEvents}

${CONTEXT_FOOTER}`;
}

/**
 * Estimate token count for a string
 * Rough estimate: ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
