// Tool executor for agentic AI chat
// Executes tool calls and returns results

import { SupabaseClient } from '@supabase/supabase-js';
import { isValidTool } from './definitions.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClientAny = SupabaseClient<any, any, any>;

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface BiomarkerValue {
  name: string;
  value: number;
  unit: string;
  flag?: string;
  refMin?: number;
  refMax?: number;
}

interface UserProfileRow {
  display_name: string | null;
  gender: string;
  date_of_birth: string;
  height_cm: number | null;
  weight_kg: number | null;
  medical_conditions: string[];
  current_medications: string[];
  allergies: string[];
  surgical_history: string[];
  family_history: Record<string, string[]> | null;
  smoking_status: string | null;
  alcohol_frequency: string | null;
  exercise_frequency: string | null;
}

/**
 * Main executor - routes tool calls to implementations
 */
export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClientAny
): Promise<ToolResult> {
  if (!isValidTool(toolName)) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  try {
    switch (toolName) {
      case 'search_events':
        return await executeSearchEvents(args, userId, supabase);
      case 'get_biomarker_history':
        return await executeGetBiomarkerHistory(args, userId, supabase);
      case 'get_profile':
        return await executeGetProfile(args, userId, supabase);
      case 'get_recent_labs':
        return await executeGetRecentLabs(args, userId, supabase);
      case 'get_medications':
        return await executeGetMedications(args, userId, supabase);
      case 'get_event_details':
        return await executeGetEventDetails(args, userId, supabase);
      default:
        return { success: false, error: `Unimplemented tool: ${toolName}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Tool execution failed',
    };
  }
}

/**
 * search_events - Search health timeline by keyword, type, date range
 */
async function executeSearchEvents(
  args: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClientAny
): Promise<ToolResult> {
  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);

  let query = supabase
    .from('events')
    .select('id, type, date, title, notes, tags, doctor_name, medication_name, lab_name, biomarkers, diagnosis, dosage, frequency, is_active, vice_category, vice_quantity, vice_unit, vice_context, vice_trigger')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  // Filter by event types
  if (args.event_types && Array.isArray(args.event_types) && args.event_types.length > 0) {
    query = query.in('type', args.event_types);
  }

  // Filter by date range
  if (args.start_date && typeof args.start_date === 'string') {
    query = query.gte('date', args.start_date);
  }
  if (args.end_date && typeof args.end_date === 'string') {
    query = query.lte('date', args.end_date);
  }

  // Search by query text
  if (args.query && typeof args.query === 'string') {
    const searchTerm = args.query.replace(/[%_]/g, ''); // Sanitize
    query = query.or(
      `title.ilike.%${searchTerm}%,` +
      `notes.ilike.%${searchTerm}%,` +
      `doctor_name.ilike.%${searchTerm}%,` +
      `medication_name.ilike.%${searchTerm}%,` +
      `lab_name.ilike.%${searchTerm}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Format events for readability
  const formattedEvents = (data || []).map((event) => formatEventForTool(event));

  return {
    success: true,
    data: {
      events: formattedEvents,
      count: formattedEvents.length,
      query: args.query || null,
      filters: {
        types: args.event_types || 'all',
        dateRange: args.start_date || args.end_date ? `${args.start_date || 'any'} to ${args.end_date || 'any'}` : 'all time',
      },
    },
  };
}

/**
 * get_biomarker_history - Get historical values for a specific biomarker
 */
async function executeGetBiomarkerHistory(
  args: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClientAny
): Promise<ToolResult> {
  const biomarkerName = String(args.biomarker_name || '').toLowerCase().trim();

  if (!biomarkerName) {
    return { success: false, error: 'biomarker_name is required' };
  }

  // First, look up biomarker_standards to get all matching names/aliases
  // This allows searching by common abbreviations like "Lp(a)" -> matches "Lipoprotein(a)"
  const { data: standards } = await supabase
    .from('biomarker_standards')
    .select('code, name, aliases');

  // Build a set of all terms to match against (lowercase)
  const matchTerms = new Set<string>([biomarkerName]);

  // Find standards where the search term matches code, name, or any alias
  for (const std of standards || []) {
    const code = (std.code || '').toLowerCase();
    const name = (std.name || '').toLowerCase();
    const aliases = (std.aliases || []) as string[];

    // Check if search term matches this standard
    const allTerms = [code, name, ...aliases.map((a: string) => a.toLowerCase())];
    const matches = allTerms.some(
      (term) => term.includes(biomarkerName) || biomarkerName.includes(term)
    );

    if (matches) {
      // Add all related terms for this biomarker
      matchTerms.add(code);
      matchTerms.add(name);
      for (const alias of aliases) {
        matchTerms.add(alias.toLowerCase());
      }
    }
  }

  // Query lab results
  let query = supabase
    .from('events')
    .select('id, date, lab_name, biomarkers')
    .eq('user_id', userId)
    .eq('type', 'lab_result')
    .not('biomarkers', 'is', null)
    .order('date', { ascending: true });

  if (args.start_date && typeof args.start_date === 'string') {
    query = query.gte('date', args.start_date);
  }
  if (args.end_date && typeof args.end_date === 'string') {
    query = query.lte('date', args.end_date);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Extract matching biomarker values
  const history: Array<{
    date: string;
    labName: string | null;
    name: string;
    value: number;
    unit: string;
    flag?: string;
    refMin?: number;
    refMax?: number;
  }> = [];

  // Convert matchTerms to array for iteration
  const matchTermsArray = Array.from(matchTerms);

  for (const event of data || []) {
    const biomarkers = event.biomarkers as BiomarkerValue[] | null;
    if (!biomarkers) continue;

    for (const b of biomarkers) {
      const bName = b.name.toLowerCase();
      // Check if biomarker name matches any of the terms (either contains or is contained by)
      const isMatch = matchTermsArray.some(
        (term) => bName.includes(term) || term.includes(bName)
      );

      if (isMatch) {
        history.push({
          date: event.date,
          labName: event.lab_name,
          name: b.name,
          value: b.value,
          unit: b.unit,
          flag: b.flag,
          refMin: b.refMin,
          refMax: b.refMax,
        });
      }
    }
  }

  // Calculate trend if we have multiple values
  let trend: string | null = null;
  if (history.length >= 2) {
    const first = history[0].value;
    const last = history[history.length - 1].value;
    const change = ((last - first) / first) * 100;
    if (Math.abs(change) < 5) {
      trend = 'stable';
    } else if (change > 0) {
      trend = `increasing (+${change.toFixed(1)}%)`;
    } else {
      trend = `decreasing (${change.toFixed(1)}%)`;
    }
  }

  return {
    success: true,
    data: {
      biomarker: args.biomarker_name,
      measurements: history,
      count: history.length,
      trend,
      dateRange: history.length > 0
        ? `${history[0].date} to ${history[history.length - 1].date}`
        : 'no data',
    },
  };
}

/**
 * get_profile - Get user profile (all or specific sections)
 */
async function executeGetProfile(
  args: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClientAny
): Promise<ToolResult> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: true, data: { profile: null, message: 'No profile found for this user' } };
  }

  const profile = data as UserProfileRow;
  const sections = args.sections as string[] | undefined;
  const wantsAll = !sections || sections.length === 0 || sections.includes('all');

  const result: Record<string, unknown> = {};

  // Calculate age
  let age: number | null = null;
  if (profile.date_of_birth) {
    const today = new Date();
    const birthDate = new Date(profile.date_of_birth);
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  if (wantsAll || sections?.includes('demographics')) {
    result.demographics = {
      displayName: profile.display_name,
      age,
      gender: profile.gender,
      dateOfBirth: profile.date_of_birth,
      heightCm: profile.height_cm,
      weightKg: profile.weight_kg,
      bmi: profile.height_cm && profile.weight_kg
        ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
        : null,
    };
  }

  if (wantsAll || sections?.includes('medical_history')) {
    result.medicalHistory = {
      conditions: profile.medical_conditions || [],
      surgicalHistory: profile.surgical_history || [],
    };
  }

  if (wantsAll || sections?.includes('medications')) {
    result.currentMedications = profile.current_medications || [];
  }

  if (wantsAll || sections?.includes('allergies')) {
    result.allergies = profile.allergies || [];
  }

  if (wantsAll || sections?.includes('family_history')) {
    result.familyHistory = profile.family_history || {};
  }

  if (wantsAll || sections?.includes('lifestyle')) {
    result.lifestyle = {
      smokingStatus: profile.smoking_status,
      alcoholFrequency: profile.alcohol_frequency,
      exerciseFrequency: profile.exercise_frequency,
    };
  }

  return { success: true, data: { profile: result } };
}

/**
 * get_recent_labs - Get recent lab results with biomarkers
 */
async function executeGetRecentLabs(
  args: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClientAny
): Promise<ToolResult> {
  const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 20);

  const { data, error } = await supabase
    .from('events')
    .select('id, date, title, lab_name, ordering_doctor, biomarkers, notes')
    .eq('user_id', userId)
    .eq('type', 'lab_result')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message };
  }

  // Format labs for readability
  const labs = (data || []).map((lab) => ({
    id: lab.id,
    date: lab.date,
    title: lab.title,
    labName: lab.lab_name,
    orderingDoctor: lab.ordering_doctor,
    biomarkers: (lab.biomarkers as BiomarkerValue[] || []).map((b) => ({
      name: b.name,
      value: b.value,
      unit: b.unit,
      flag: b.flag || 'normal',
      referenceRange: b.refMin !== undefined && b.refMax !== undefined
        ? `${b.refMin}-${b.refMax}`
        : null,
    })),
    notes: lab.notes,
  }));

  return {
    success: true,
    data: {
      labs,
      count: labs.length,
    },
  };
}

/**
 * get_medications - Get active or all medications
 */
async function executeGetMedications(
  args: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClientAny
): Promise<ToolResult> {
  const activeOnly = args.active_only !== false; // Default true

  let query = supabase
    .from('events')
    .select('id, date, title, medication_name, dosage, frequency, prescriber, reason, start_date, end_date, is_active, side_effects, notes')
    .eq('user_id', userId)
    .eq('type', 'medication')
    .order('date', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  // Format medications
  const medications = (data || []).map((med) => ({
    id: med.id,
    name: med.medication_name || med.title,
    dosage: med.dosage,
    frequency: med.frequency,
    prescriber: med.prescriber,
    reason: med.reason,
    startDate: med.start_date || med.date,
    endDate: med.end_date,
    isActive: med.is_active,
    sideEffects: med.side_effects,
    notes: med.notes,
  }));

  return {
    success: true,
    data: {
      medications,
      count: medications.length,
      activeOnly,
    },
  };
}

/**
 * get_event_details - Get full details of a specific event
 */
async function executeGetEventDetails(
  args: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClientAny
): Promise<ToolResult> {
  const eventId = String(args.event_id || '');

  if (!eventId) {
    return { success: false, error: 'event_id is required' };
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('user_id', userId) // Security: ensure user owns event
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { success: false, error: 'Event not found' };
    }
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: { event: formatEventForTool(data) },
  };
}

/**
 * Format an event for tool output (human-readable)
 */
function formatEventForTool(event: Record<string, unknown>): Record<string, unknown> {
  const base = {
    id: event.id,
    type: event.type,
    date: event.date,
    title: event.title,
    notes: event.notes || null,
    tags: event.tags || [],
  };

  switch (event.type) {
    case 'lab_result':
      return {
        ...base,
        labName: event.lab_name,
        orderingDoctor: event.ordering_doctor,
        biomarkers: (event.biomarkers as BiomarkerValue[] || []).map((b) => ({
          name: b.name,
          value: b.value,
          unit: b.unit,
          flag: b.flag || 'normal',
          referenceRange: b.refMin !== undefined && b.refMax !== undefined
            ? `${b.refMin}-${b.refMax}`
            : null,
        })),
      };

    case 'doctor_visit':
      return {
        ...base,
        doctorName: event.doctor_name,
        specialty: event.specialty,
        facility: event.facility,
        diagnosis: event.diagnosis || [],
        followUp: event.follow_up,
      };

    case 'medication':
      return {
        ...base,
        medicationName: event.medication_name,
        dosage: event.dosage,
        frequency: event.frequency,
        prescriber: event.prescriber,
        reason: event.reason,
        startDate: event.start_date,
        endDate: event.end_date,
        isActive: event.is_active,
        sideEffects: event.side_effects || [],
      };

    case 'intervention':
      return {
        ...base,
        interventionName: event.intervention_name,
        category: event.category,
        protocol: event.protocol,
        startDate: event.start_date,
        endDate: event.end_date,
      };

    case 'metric':
      return {
        ...base,
        metricName: event.metric_name,
        value: event.value,
        unit: event.unit,
        source: event.source,
      };

    case 'vice':
      return {
        ...base,
        category: event.vice_category,
        amount: event.vice_quantity,
        unit: event.vice_unit,
        context: event.vice_context,
        trigger: event.vice_trigger,
      };

    default:
      return base;
  }
}
