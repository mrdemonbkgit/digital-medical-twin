// Tool definitions for agentic AI chat
// Defines all available tools and converts to provider-specific formats

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string; enum?: string[] };
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };
}

// Event types available in the database
const EVENT_TYPES = ['lab_result', 'doctor_visit', 'medication', 'intervention', 'metric'] as const;

// Profile sections available
const PROFILE_SECTIONS = ['demographics', 'medical_history', 'medications', 'allergies', 'family_history', 'lifestyle', 'all'] as const;

/**
 * All tool definitions for the agentic health assistant
 */
export const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  search_events: {
    name: 'search_events',
    description: 'Search the user\'s health timeline for events matching criteria. Returns matching events sorted by date (most recent first). Use this to find specific health events, doctor visits, medications, or any health-related entries.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search text to match against event titles, notes, doctor names, medication names, lab names, etc.',
        },
        event_types: {
          type: 'array',
          description: 'Filter by event types. Omit to search all types.',
          items: { type: 'string', enum: [...EVENT_TYPES] },
        },
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format. Only return events on or after this date.',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format. Only return events on or before this date.',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of events to return. Default 20, max 50.',
        },
      },
    },
  },

  get_biomarker_history: {
    name: 'get_biomarker_history',
    description: 'Get historical values for a specific biomarker across all lab results. Use this to track trends over time for biomarkers like cholesterol, glucose, HbA1c, TSH, vitamin D, etc.',
    parameters: {
      type: 'object',
      properties: {
        biomarker_name: {
          type: 'string',
          description: 'Name or code of the biomarker (e.g., "Glucose", "HbA1c", "LDL", "TSH", "Vitamin D")',
        },
        start_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format. Omit for all history.',
        },
        end_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format. Omit for all history.',
        },
      },
      required: ['biomarker_name'],
    },
  },

  get_profile: {
    name: 'get_profile',
    description: 'Get the user\'s health profile including demographics, medical history, current medications, allergies, family history, and lifestyle factors. Use this to understand the user\'s health context.',
    parameters: {
      type: 'object',
      properties: {
        sections: {
          type: 'array',
          description: 'Which sections to retrieve. Omit or include "all" for complete profile.',
          items: { type: 'string', enum: [...PROFILE_SECTIONS] },
        },
      },
    },
  },

  get_recent_labs: {
    name: 'get_recent_labs',
    description: 'Get recent lab results with all biomarker values. Use this to see what labs the user has had recently and their results.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Number of recent lab results to return. Default 5, max 20.',
        },
      },
    },
  },

  get_medications: {
    name: 'get_medications',
    description: 'Get the user\'s medications. Can filter for currently active medications only or include discontinued ones.',
    parameters: {
      type: 'object',
      properties: {
        active_only: {
          type: 'boolean',
          description: 'If true, only return currently active medications. Default true.',
        },
      },
    },
  },

  get_event_details: {
    name: 'get_event_details',
    description: 'Get full details of a specific health event by ID. Use this when you need more information about an event mentioned in search results.',
    parameters: {
      type: 'object',
      properties: {
        event_id: {
          type: 'string',
          description: 'The unique ID of the event to retrieve',
        },
      },
      required: ['event_id'],
    },
  },
};

/**
 * Convert tool definitions to OpenAI Responses API format
 */
export function toOpenAITools(includeWebSearch: boolean = true): unknown[] {
  const tools: unknown[] = [];

  // Include web search if enabled
  if (includeWebSearch) {
    tools.push({ type: 'web_search_preview' });
  }

  // Add function tools
  for (const def of Object.values(TOOL_DEFINITIONS)) {
    tools.push({
      type: 'function',
      function: {
        name: def.name,
        description: def.description,
        parameters: def.parameters,
      },
    });
  }

  return tools;
}

/**
 * Convert tool definitions to Gemini format
 */
export function toGeminiTools(includeGoogleSearch: boolean = true): unknown[] {
  const tools: unknown[] = [];

  // Include Google Search if enabled
  if (includeGoogleSearch) {
    tools.push({ googleSearch: {} });
  }

  // Add function declarations
  const functionDeclarations = Object.values(TOOL_DEFINITIONS).map((def) => ({
    name: def.name,
    description: def.description,
    parameters: def.parameters,
  }));

  if (functionDeclarations.length > 0) {
    tools.push({ functionDeclarations });
  }

  return tools;
}

/**
 * Get list of tool names
 */
export function getToolNames(): string[] {
  return Object.keys(TOOL_DEFINITIONS);
}

/**
 * Check if a tool name is valid
 */
export function isValidTool(name: string): boolean {
  return name in TOOL_DEFINITIONS;
}
