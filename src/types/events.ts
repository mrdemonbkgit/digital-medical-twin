export type EventType =
  | 'lab_result'
  | 'doctor_visit'
  | 'medication'
  | 'intervention'
  | 'metric';

export interface BaseEvent {
  id: string;
  userId: string;
  type: EventType;
  date: string;
  title: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Biomarker {
  name: string;
  value: number;
  unit: string;
  secondaryValue?: number; // Alternative unit value (e.g., mmol/L if primary is mg/dL)
  secondaryUnit?: string; // Alternative unit
  referenceMin?: number;
  referenceMax?: number;
  flag?: 'high' | 'low' | 'normal';
}

export interface LabResultAttachment {
  id: string;
  filename: string;
  url: string;
  storagePath: string;
  uploadedAt: string;
}

export type ClientGender = 'male' | 'female' | 'other';

export interface LabResult extends BaseEvent {
  type: 'lab_result';
  // Patient info (extracted from PDF)
  clientName?: string;
  clientGender?: ClientGender;
  clientBirthday?: string;
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

export type HealthEvent =
  | LabResult
  | DoctorVisit
  | Medication
  | Intervention
  | Metric;

// Specific input types for each event
export type CreateLabResultInput = Omit<LabResult, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type CreateDoctorVisitInput = Omit<DoctorVisit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type CreateMedicationInput = Omit<Medication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type CreateInterventionInput = Omit<Intervention, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type CreateMetricInput = Omit<Metric, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export type CreateEventInput =
  | CreateLabResultInput
  | CreateDoctorVisitInput
  | CreateMedicationInput
  | CreateInterventionInput
  | CreateMetricInput;

export type UpdateEventInput = Partial<CreateEventInput>;

// Filter types for querying events
export interface EventFilters {
  eventTypes?: EventType[];
  startDate?: string;
  endDate?: string;
  search?: string;
  tags?: string[];
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
