/**
 * User-friendly labels for AI tool names.
 * Used in StreamingIndicator UI and ARIA announcements.
 */
export const TOOL_LABELS: Record<string, string> = {
  get_profile: 'Retrieving your profile',
  get_medications: 'Checking medications',
  get_recent_labs: 'Retrieving lab results',
  get_biomarker_history: 'Analyzing biomarker trends',
  search_events: 'Searching health timeline',
  get_events: 'Searching health timeline',
  get_event_details: 'Getting event details',
};

/**
 * Get user-friendly label for a tool name.
 * Falls back to "Running {toolName}" for unknown tools.
 */
export function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] || `Running ${toolName}`;
}
