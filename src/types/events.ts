export type EventType =
  | 'lab_result'
  | 'doctor_visit'
  | 'medication'
  | 'intervention'
  | 'metric'
  | 'vice';

export interface BaseEvent {
  id: string;
  userId: string;
  type: EventType;
  date: string;
  title: string;
  notes?: string;
  tags?: string[];
  isPrivate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Biomarker {
  standardCode?: string; // Links to biomarker_standards.code (optional for unmatched biomarkers)
  name: string;
  value: number | string; // Numeric for quantitative, string for qualitative (e.g., "Negative", "Trace", "+")
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  flag?: 'high' | 'low' | 'normal';
  isQualitative?: boolean; // True for dipstick/qualitative results like "Negative", "Positive"
}

export interface LabResultAttachment {
  id: string;
  filename: string;
  url: string;
  storagePath: string;
  uploadedAt: string;
}

export interface LabResult extends BaseEvent {
  type: 'lab_result';
  // Lab info
  labName?: string;
  orderingDoctor?: string;
  // Results
  biomarkers: Biomarker[];
  // Attachments
  attachments?: LabResultAttachment[];
}

export interface DoctorVisit extends BaseEvent {
  type: 'doctor_visit';
  doctorName: string;
  specialty?: string;
  facility?: string;
  diagnosis?: string[];
  followUp?: string;
}

export interface Medication extends BaseEvent {
  type: 'medication';
  medicationName: string;
  dosage: string;
  frequency: string;
  prescriber?: string;
  reason?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  sideEffects?: string[];
}

export type InterventionCategory =
  | 'diet'
  | 'exercise'
  | 'supplement'
  | 'sleep'
  | 'stress'
  | 'other';

export interface Intervention extends BaseEvent {
  type: 'intervention';
  interventionName: string;
  category: InterventionCategory;
  startDate: string;
  endDate?: string;
  protocol?: string;
  isOngoing: boolean;
}

export type MetricSource =
  | 'whoop'
  | 'oura'
  | 'apple_health'
  | 'garmin'
  | 'manual';

export interface Metric extends BaseEvent {
  type: 'metric';
  source: MetricSource;
  metricName: string;
  value: number;
  unit: string;
}

export type ViceCategory = 'alcohol' | 'masturbation' | 'smoking' | 'drugs';

export interface Vice extends BaseEvent {
  type: 'vice';
  viceCategory: ViceCategory;
  quantity?: number;
  unit?: string;
  context?: string;
  trigger?: string;
  isPrivate: true; // Vice events are always private
}

export type HealthEvent =
  | LabResult
  | DoctorVisit
  | Medication
  | Intervention
  | Metric
  | Vice;

// Specific input types for each event
export type CreateLabResultInput = Omit<LabResult, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type CreateDoctorVisitInput = Omit<DoctorVisit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type CreateMedicationInput = Omit<Medication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type CreateInterventionInput = Omit<Intervention, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type CreateMetricInput = Omit<Metric, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type CreateViceInput = Omit<Vice, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export type CreateEventInput =
  | CreateLabResultInput
  | CreateDoctorVisitInput
  | CreateMedicationInput
  | CreateInterventionInput
  | CreateMetricInput
  | CreateViceInput;

export type UpdateEventInput = Partial<CreateEventInput>;

// Filter types for querying events
export interface EventFilters {
  eventTypes?: EventType[];
  startDate?: string;
  endDate?: string;
  search?: string;
  tags?: string[];
  includePrivate?: boolean; // Include private events (e.g., vice entries)
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form validation errors
export type EventFormErrors = {
  [key: string]: string | undefined;
};
