import { describe, it, expect } from 'vitest';
import {
  TOOL_DEFINITIONS,
  toOpenAITools,
  toGeminiTools,
  getToolNames,
  isValidTool,
} from './definitions';

describe('TOOL_DEFINITIONS', () => {
  it('exports tool definitions object', () => {
    expect(TOOL_DEFINITIONS).toBeDefined();
    expect(typeof TOOL_DEFINITIONS).toBe('object');
  });

  it('includes search_events tool', () => {
    expect(TOOL_DEFINITIONS.search_events).toBeDefined();
    expect(TOOL_DEFINITIONS.search_events.name).toBe('search_events');
    expect(TOOL_DEFINITIONS.search_events.description).toContain('Search');
  });

  it('includes get_biomarker_history tool', () => {
    expect(TOOL_DEFINITIONS.get_biomarker_history).toBeDefined();
    expect(TOOL_DEFINITIONS.get_biomarker_history.name).toBe('get_biomarker_history');
    expect(TOOL_DEFINITIONS.get_biomarker_history.parameters.required).toContain('biomarker_name');
  });

  it('includes get_profile tool', () => {
    expect(TOOL_DEFINITIONS.get_profile).toBeDefined();
    expect(TOOL_DEFINITIONS.get_profile.name).toBe('get_profile');
  });

  it('includes get_recent_labs tool', () => {
    expect(TOOL_DEFINITIONS.get_recent_labs).toBeDefined();
    expect(TOOL_DEFINITIONS.get_recent_labs.name).toBe('get_recent_labs');
  });

  it('includes get_medications tool', () => {
    expect(TOOL_DEFINITIONS.get_medications).toBeDefined();
    expect(TOOL_DEFINITIONS.get_medications.name).toBe('get_medications');
  });

  it('includes get_event_details tool', () => {
    expect(TOOL_DEFINITIONS.get_event_details).toBeDefined();
    expect(TOOL_DEFINITIONS.get_event_details.name).toBe('get_event_details');
    expect(TOOL_DEFINITIONS.get_event_details.parameters.required).toContain('event_id');
  });

  describe('search_events parameters', () => {
    const tool = TOOL_DEFINITIONS.search_events;

    it('has query parameter', () => {
      expect(tool.parameters.properties.query).toBeDefined();
      expect(tool.parameters.properties.query.type).toBe('string');
    });

    it('has event_types parameter with enum', () => {
      expect(tool.parameters.properties.event_types).toBeDefined();
      expect(tool.parameters.properties.event_types.type).toBe('array');
      expect(tool.parameters.properties.event_types.items?.enum).toContain('lab_result');
      expect(tool.parameters.properties.event_types.items?.enum).toContain('medication');
    });

    it('has date range parameters', () => {
      expect(tool.parameters.properties.start_date).toBeDefined();
      expect(tool.parameters.properties.end_date).toBeDefined();
    });

    it('has limit parameter', () => {
      expect(tool.parameters.properties.limit).toBeDefined();
      expect(tool.parameters.properties.limit.type).toBe('integer');
    });
  });

  describe('get_profile parameters', () => {
    const tool = TOOL_DEFINITIONS.get_profile;

    it('has sections parameter with enum', () => {
      expect(tool.parameters.properties.sections).toBeDefined();
      expect(tool.parameters.properties.sections.items?.enum).toContain('demographics');
      expect(tool.parameters.properties.sections.items?.enum).toContain('medical_history');
      expect(tool.parameters.properties.sections.items?.enum).toContain('all');
    });
  });

  describe('tool structure', () => {
    it('all tools have required properties', () => {
      for (const [name, tool] of Object.entries(TOOL_DEFINITIONS)) {
        expect(tool.name).toBe(name);
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.parameters).toBeDefined();
        expect(tool.parameters.type).toBe('object');
        expect(tool.parameters.properties).toBeDefined();
      }
    });
  });
});

describe('toOpenAITools', () => {
  it('returns an array', () => {
    const tools = toOpenAITools();
    expect(Array.isArray(tools)).toBe(true);
  });

  it('includes web_search_preview when enabled', () => {
    const tools = toOpenAITools(true);
    const webSearch = tools.find((t: any) => t.type === 'web_search_preview');
    expect(webSearch).toBeDefined();
  });

  it('excludes web_search_preview when disabled', () => {
    const tools = toOpenAITools(false);
    const webSearch = tools.find((t: any) => t.type === 'web_search_preview');
    expect(webSearch).toBeUndefined();
  });

  it('includes function tools', () => {
    const tools = toOpenAITools(false);
    const functionTools = tools.filter((t: any) => t.type === 'function');
    expect(functionTools.length).toBe(Object.keys(TOOL_DEFINITIONS).length);
  });

  it('formats function tools correctly', () => {
    const tools = toOpenAITools(false);
    const searchTool = tools.find((t: any) => t.name === 'search_events');

    expect(searchTool).toBeDefined();
    expect(searchTool).toHaveProperty('type', 'function');
    expect(searchTool).toHaveProperty('name', 'search_events');
    expect(searchTool).toHaveProperty('description');
    expect(searchTool).toHaveProperty('parameters');
  });

  it('preserves parameter structure', () => {
    const tools = toOpenAITools(false);
    const biomarkerTool = tools.find((t: any) => t.name === 'get_biomarker_history');

    expect(biomarkerTool?.parameters).toHaveProperty('type', 'object');
    expect(biomarkerTool?.parameters).toHaveProperty('properties');
    expect(biomarkerTool?.parameters).toHaveProperty('required');
  });
});

describe('toGeminiTools', () => {
  it('returns an array', () => {
    const tools = toGeminiTools();
    expect(Array.isArray(tools)).toBe(true);
  });

  it('includes Google Search when enabled', () => {
    const tools = toGeminiTools(true);
    const googleSearch = tools.find((t: any) => t.googleSearch !== undefined);
    expect(googleSearch).toBeDefined();
  });

  it('excludes Google Search when disabled', () => {
    const tools = toGeminiTools(false);
    const googleSearch = tools.find((t: any) => t.googleSearch !== undefined);
    expect(googleSearch).toBeUndefined();
  });

  it('includes function declarations', () => {
    const tools = toGeminiTools(false);
    const funcDecl = tools.find((t: any) => t.functionDeclarations !== undefined);
    expect(funcDecl).toBeDefined();
    expect(funcDecl.functionDeclarations).toHaveLength(Object.keys(TOOL_DEFINITIONS).length);
  });

  it('formats function declarations correctly', () => {
    const tools = toGeminiTools(false);
    const funcDecl = tools.find((t: any) => t.functionDeclarations !== undefined);
    const searchFunc = funcDecl.functionDeclarations.find((f: any) => f.name === 'search_events');

    expect(searchFunc).toBeDefined();
    expect(searchFunc).toHaveProperty('name', 'search_events');
    expect(searchFunc).toHaveProperty('description');
    expect(searchFunc).toHaveProperty('parameters');
  });
});

describe('getToolNames', () => {
  it('returns an array of strings', () => {
    const names = getToolNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names.every(n => typeof n === 'string')).toBe(true);
  });

  it('returns all tool names', () => {
    const names = getToolNames();
    expect(names).toContain('search_events');
    expect(names).toContain('get_biomarker_history');
    expect(names).toContain('get_profile');
    expect(names).toContain('get_recent_labs');
    expect(names).toContain('get_medications');
    expect(names).toContain('get_event_details');
  });

  it('matches TOOL_DEFINITIONS keys', () => {
    const names = getToolNames();
    const definitionKeys = Object.keys(TOOL_DEFINITIONS);
    expect(names.sort()).toEqual(definitionKeys.sort());
  });
});

describe('isValidTool', () => {
  it('returns true for valid tool names', () => {
    expect(isValidTool('search_events')).toBe(true);
    expect(isValidTool('get_biomarker_history')).toBe(true);
    expect(isValidTool('get_profile')).toBe(true);
    expect(isValidTool('get_recent_labs')).toBe(true);
    expect(isValidTool('get_medications')).toBe(true);
    expect(isValidTool('get_event_details')).toBe(true);
  });

  it('returns false for invalid tool names', () => {
    expect(isValidTool('invalid_tool')).toBe(false);
    expect(isValidTool('unknown')).toBe(false);
    expect(isValidTool('')).toBe(false);
    expect(isValidTool('SEARCH_EVENTS')).toBe(false); // Case sensitive
  });

  it('returns false for partial matches', () => {
    expect(isValidTool('search')).toBe(false);
    expect(isValidTool('events')).toBe(false);
    expect(isValidTool('get_')).toBe(false);
  });
});
