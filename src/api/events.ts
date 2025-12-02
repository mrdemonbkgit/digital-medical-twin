import { supabase } from '@/lib/supabase';
import { escapePostgrestValue } from '@/utils/validation';
import type {
  HealthEvent,
  CreateEventInput,
  UpdateEventInput,
  EventFilters,
  PaginationParams,
  PaginatedResponse,
  LabResult,
  DoctorVisit,
  Medication,
  Intervention,
  Metric,
  Biomarker,
  CreateLabResultInput,
  CreateDoctorVisitInput,
  CreateMedicationInput,
  CreateInterventionInput,
  CreateMetricInput,
} from '@/types';

// Database row type (snake_case)
interface EventRow {
  id: string;
  user_id: string;
  type: string;
  date: string;
  title: string;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  // Lab Result
  lab_name: string | null;
  ordering_doctor: string | null;
  biomarkers: Biomarker[] | null;
  // Doctor Visit
  doctor_name: string | null;
  specialty: string | null;
  facility: string | null;
  diagnosis: string[] | null;
  follow_up: string | null;
  // Medication
  medication_name: string | null;
  dosage: string | null;
  frequency: string | null;
  prescriber: string | null;
  reason: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean | null;
  side_effects: string[] | null;
  // Intervention
  intervention_name: string | null;
  category: string | null;
  protocol: string | null;
  // Metric
  source: string | null;
  metric_name: string | null;
  value: number | null;
  unit: string | null;
}

// Convert database row to typed HealthEvent
function rowToEvent(row: EventRow): HealthEvent {
  const base = {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    title: row.title,
    notes: row.notes || undefined,
    tags: row.tags || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  switch (row.type) {
    case 'lab_result':
      return {
        ...base,
        type: 'lab_result',
        labName: row.lab_name || undefined,
        orderingDoctor: row.ordering_doctor || undefined,
        biomarkers: row.biomarkers || [],
      } as LabResult;

    case 'doctor_visit':
      return {
        ...base,
        type: 'doctor_visit',
        doctorName: row.doctor_name || '',
        specialty: row.specialty || undefined,
        facility: row.facility || undefined,
        diagnosis: row.diagnosis || undefined,
        followUp: row.follow_up || undefined,
      } as DoctorVisit;

    case 'medication':
      return {
        ...base,
        type: 'medication',
        medicationName: row.medication_name || '',
        dosage: row.dosage || '',
        frequency: row.frequency || '',
        prescriber: row.prescriber || undefined,
        reason: row.reason || undefined,
        startDate: row.start_date || '',
        endDate: row.end_date || undefined,
        isActive: row.is_active ?? true,
        sideEffects: row.side_effects || undefined,
      } as Medication;

    case 'intervention':
      return {
        ...base,
        type: 'intervention',
        interventionName: row.intervention_name || '',
        category: (row.category || 'other') as Intervention['category'],
        startDate: row.start_date || '',
        endDate: row.end_date || undefined,
        protocol: row.protocol || undefined,
        isOngoing: !row.end_date,
      } as Intervention;

    case 'metric':
      return {
        ...base,
        type: 'metric',
        source: (row.source || 'manual') as Metric['source'],
        metricName: row.metric_name || '',
        value: row.value || 0,
        unit: row.unit || '',
      } as Metric;

    default:
      throw new Error(`Unknown event type: ${row.type}`);
  }
}

// Type guards for CreateEventInput
function isLabResult(input: CreateEventInput): input is CreateLabResultInput {
  return input.type === 'lab_result';
}

function isDoctorVisit(input: CreateEventInput): input is CreateDoctorVisitInput {
  return input.type === 'doctor_visit';
}

function isMedication(input: CreateEventInput): input is CreateMedicationInput {
  return input.type === 'medication';
}

function isIntervention(input: CreateEventInput): input is CreateInterventionInput {
  return input.type === 'intervention';
}

function isMetric(input: CreateEventInput): input is CreateMetricInput {
  return input.type === 'metric';
}

// Convert CreateEventInput to database row format
function eventToRow(
  input: CreateEventInput,
  userId: string
): Omit<EventRow, 'id' | 'created_at' | 'updated_at'> {
  const base = {
    user_id: userId,
    type: input.type,
    date: input.date,
    title: input.title,
    notes: input.notes || null,
    tags: input.tags || null,
    // Initialize all type-specific fields to null
    lab_name: null as string | null,
    ordering_doctor: null as string | null,
    biomarkers: null as Biomarker[] | null,
    doctor_name: null as string | null,
    specialty: null as string | null,
    facility: null as string | null,
    diagnosis: null as string[] | null,
    follow_up: null as string | null,
    medication_name: null as string | null,
    dosage: null as string | null,
    frequency: null as string | null,
    prescriber: null as string | null,
    reason: null as string | null,
    start_date: null as string | null,
    end_date: null as string | null,
    is_active: null as boolean | null,
    side_effects: null as string[] | null,
    intervention_name: null as string | null,
    category: null as string | null,
    protocol: null as string | null,
    source: null as string | null,
    metric_name: null as string | null,
    value: null as number | null,
    unit: null as string | null,
  };

  if (isLabResult(input)) {
    return {
      ...base,
      lab_name: input.labName || null,
      ordering_doctor: input.orderingDoctor || null,
      biomarkers: input.biomarkers,
    };
  }

  if (isDoctorVisit(input)) {
    return {
      ...base,
      doctor_name: input.doctorName,
      specialty: input.specialty || null,
      facility: input.facility || null,
      diagnosis: input.diagnosis || null,
      follow_up: input.followUp || null,
    };
  }

  if (isMedication(input)) {
    return {
      ...base,
      medication_name: input.medicationName,
      dosage: input.dosage,
      frequency: input.frequency,
      prescriber: input.prescriber || null,
      reason: input.reason || null,
      start_date: input.startDate,
      end_date: input.endDate || null,
      is_active: input.isActive,
      side_effects: input.sideEffects || null,
    };
  }

  if (isIntervention(input)) {
    return {
      ...base,
      intervention_name: input.interventionName,
      category: input.category,
      start_date: input.startDate,
      end_date: input.endDate || null,
      protocol: input.protocol || null,
    };
  }

  if (isMetric(input)) {
    return {
      ...base,
      source: input.source,
      metric_name: input.metricName,
      value: input.value,
      unit: input.unit,
    };
  }

  return base;
}

export async function getEvents(
  filters?: EventFilters,
  pagination?: PaginationParams
): Promise<PaginatedResponse<HealthEvent>> {
  const page = pagination?.page || 1;
  const limit = pagination?.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.eventTypes && filters.eventTypes.length > 0) {
    query = query.in('type', filters.eventTypes);
  }

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }

  if (filters?.search) {
    // Sanitize search input to prevent PostgREST filter injection
    const safeSearch = escapePostgrestValue(filters.search);
    if (safeSearch) {
      // Search across multiple fields for better discoverability
      query = query.or(
        `title.ilike.%${safeSearch}%,` +
        `notes.ilike.%${safeSearch}%,` +
        `doctor_name.ilike.%${safeSearch}%,` +
        `medication_name.ilike.%${safeSearch}%,` +
        `intervention_name.ilike.%${safeSearch}%,` +
        `metric_name.ilike.%${safeSearch}%,` +
        `lab_name.ilike.%${safeSearch}%`
      );
    }
  }

  if (filters?.tags && filters.tags.length > 0) {
    // Filter events that contain any of the specified tags
    query = query.overlaps('tags', filters.tags);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  const events = (data as EventRow[]).map(rowToEvent);
  const total = count || 0;

  return {
    data: events,
    total,
    page,
    limit,
    hasMore: offset + events.length < total,
  };
}

export async function getEvent(id: string): Promise<HealthEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch event: ${error.message}`);
  }

  return rowToEvent(data as EventRow);
}

export async function createEvent(input: CreateEventInput): Promise<HealthEvent> {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const row = eventToRow(input, user.id);

  const { data, error } = await supabase
    .from('events')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`);
  }

  return rowToEvent(data as EventRow);
}

export async function updateEvent(
  id: string,
  input: UpdateEventInput
): Promise<HealthEvent> {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // First get the existing event to merge with updates
  const existing = await getEvent(id);
  if (!existing) {
    throw new Error('Event not found');
  }

  // Merge existing with updates
  const merged = { ...existing, ...input } as CreateEventInput;
  const row = eventToRow(merged, user.id);

  const { data, error } = await supabase
    .from('events')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update event: ${error.message}`);
  }

  return rowToEvent(data as EventRow);
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete event: ${error.message}`);
  }
}

// Get all unique tags used by the current user
export async function getUserTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('events')
    .select('tags')
    .not('tags', 'is', null);

  if (error) {
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }

  // Flatten all tags and get unique values
  const allTags = (data as { tags: string[] | null }[])
    .flatMap((row) => row.tags || [])
    .filter((tag): tag is string => Boolean(tag));

  const uniqueTags = [...new Set(allTags)].sort();
  return uniqueTags;
}

// Get all events without pagination (for export)
export async function getAllEvents(filters?: EventFilters): Promise<HealthEvent[]> {
  let query = supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.eventTypes && filters.eventTypes.length > 0) {
    query = query.in('type', filters.eventTypes);
  }

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }

  if (filters?.search) {
    // Sanitize search input to prevent PostgREST filter injection
    const safeSearch = escapePostgrestValue(filters.search);
    if (safeSearch) {
      query = query.or(
        `title.ilike.%${safeSearch}%,` +
        `notes.ilike.%${safeSearch}%,` +
        `doctor_name.ilike.%${safeSearch}%,` +
        `medication_name.ilike.%${safeSearch}%,` +
        `intervention_name.ilike.%${safeSearch}%,` +
        `metric_name.ilike.%${safeSearch}%,` +
        `lab_name.ilike.%${safeSearch}%`
      );
    }
  }

  if (filters?.tags && filters.tags.length > 0) {
    // Filter events that contain any of the specified tags
    query = query.overlaps('tags', filters.tags);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch events: ${error.message}`);
  }

  return (data as EventRow[]).map(rowToEvent);
}
