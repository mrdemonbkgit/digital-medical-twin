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
  referenceMin?: number;
  referenceMax?: number;
  flag?: 'high' | 'low' | 'normal';
}

export interface LabResult extends BaseEvent {
  type: 'lab_result';
  labName?: string;
  orderingDoctor?: string;
  biomarkers: Biomarker[];
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

export type CreateEventInput = Omit<HealthEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type UpdateEventInput = Partial<CreateEventInput>;
