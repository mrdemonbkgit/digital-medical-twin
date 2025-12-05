import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatEventForContext,
  formatEventsForContext,
  estimateTokens,
  formatUserProfileForContext,
} from './contextFormatter';
import type {
  LabResult,
  DoctorVisit,
  Medication,
  Intervention,
  Metric,
  Vice,
} from '@/types/events';
import type { UserProfileRow } from '@/types/userProfile';

// Helper to create mock lab result
function createLabResult(overrides: Partial<LabResult> = {}): LabResult {
  return {
    id: 'lab-1',
    userId: 'user-123',
    type: 'lab_result',
    title: 'Blood Panel',
    date: '2024-03-15',
    biomarkers: [
      { name: 'Glucose', value: 95, unit: 'mg/dL', flag: 'normal' },
    ],
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
    ...overrides,
  };
}

// Helper to create mock doctor visit
function createDoctorVisit(overrides: Partial<DoctorVisit> = {}): DoctorVisit {
  return {
    id: 'visit-1',
    userId: 'user-123',
    type: 'doctor_visit',
    title: 'Annual Checkup',
    date: '2024-03-15',
    doctorName: 'Dr. Smith',
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
    ...overrides,
  };
}

// Helper to create mock medication
function createMedication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'med-1',
    userId: 'user-123',
    type: 'medication',
    title: 'Metformin',
    date: '2024-03-15',
    medicationName: 'Metformin',
    dosage: '500mg',
    frequency: 'twice daily',
    startDate: '2024-01-01',
    isActive: true,
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
    ...overrides,
  };
}

// Helper to create mock intervention
function createIntervention(overrides: Partial<Intervention> = {}): Intervention {
  return {
    id: 'int-1',
    userId: 'user-123',
    type: 'intervention',
    title: 'Low Carb Diet',
    date: '2024-03-15',
    interventionName: 'Low Carb Diet',
    category: 'diet',
    startDate: '2024-01-01',
    isOngoing: true,
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
    ...overrides,
  };
}

// Helper to create mock metric
function createMetric(overrides: Partial<Metric> = {}): Metric {
  return {
    id: 'metric-1',
    userId: 'user-123',
    type: 'metric',
    title: 'Weight',
    date: '2024-03-15',
    metricName: 'Weight',
    value: 180,
    unit: 'lbs',
    source: 'manual_entry',
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
    ...overrides,
  };
}

// Helper to create mock vice
function createVice(overrides: Partial<Vice> = {}): Vice {
  return {
    id: 'vice-1',
    userId: 'user-123',
    type: 'vice',
    title: 'Alcohol',
    date: '2024-03-15',
    viceCategory: 'alcohol',
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
    ...overrides,
  };
}

describe('contextFormatter', () => {
  describe('formatEventForContext', () => {
    describe('lab_result', () => {
      it('formats basic lab result', () => {
        const event = createLabResult();

        const result = formatEventForContext(event);

        expect(result).toContain('[LAB RESULT]');
        expect(result).toContain('2024-03-15');
        expect(result).toContain('Blood Panel');
        expect(result).toContain('Biomarkers:');
        expect(result).toContain('Glucose');
        expect(result).toContain('95 mg/dL');
      });

      it('includes lab name when provided', () => {
        const event = createLabResult({ labName: 'Quest Diagnostics' });

        const result = formatEventForContext(event);

        expect(result).toContain('Lab: Quest Diagnostics');
      });

      it('includes ordering doctor when provided', () => {
        const event = createLabResult({ orderingDoctor: 'Dr. Johnson' });

        const result = formatEventForContext(event);

        expect(result).toContain('Ordered by: Dr. Johnson');
      });

      it('formats biomarker with high flag', () => {
        const event = createLabResult({
          biomarkers: [{ name: 'Glucose', value: 150, unit: 'mg/dL', flag: 'high' }],
        });

        const result = formatEventForContext(event);

        expect(result).toContain('150 mg/dL (high)');
      });

      it('formats biomarker with low flag', () => {
        const event = createLabResult({
          biomarkers: [{ name: 'Iron', value: 30, unit: 'mcg/dL', flag: 'low' }],
        });

        const result = formatEventForContext(event);

        expect(result).toContain('30 mcg/dL (low)');
      });

      it('formats biomarker with reference range', () => {
        const event = createLabResult({
          biomarkers: [
            { name: 'Glucose', value: 95, unit: 'mg/dL', referenceMin: 70, referenceMax: 100 },
          ],
        });

        const result = formatEventForContext(event);

        expect(result).toContain('[ref: 70-100]');
      });

      it('handles empty biomarkers array', () => {
        const event = createLabResult({ biomarkers: [] });

        const result = formatEventForContext(event);

        expect(result).toContain('[LAB RESULT]');
        expect(result).not.toContain('Biomarkers:');
      });
    });

    describe('doctor_visit', () => {
      it('formats basic doctor visit', () => {
        const event = createDoctorVisit();

        const result = formatEventForContext(event);

        expect(result).toContain('[DOCTOR VISIT]');
        expect(result).toContain('Doctor: Dr. Smith');
      });

      it('includes specialty when provided', () => {
        const event = createDoctorVisit({ specialty: 'Cardiology' });

        const result = formatEventForContext(event);

        expect(result).toContain('Specialty: Cardiology');
      });

      it('includes facility when provided', () => {
        const event = createDoctorVisit({ facility: 'City Hospital' });

        const result = formatEventForContext(event);

        expect(result).toContain('Facility: City Hospital');
      });

      it('includes diagnosis when provided', () => {
        const event = createDoctorVisit({
          diagnosis: ['Hypertension', 'Diabetes Type 2'],
        });

        const result = formatEventForContext(event);

        expect(result).toContain('Diagnosis: Hypertension, Diabetes Type 2');
      });

      it('includes follow-up when provided', () => {
        const event = createDoctorVisit({ followUp: '3 months' });

        const result = formatEventForContext(event);

        expect(result).toContain('Follow-up: 3 months');
      });
    });

    describe('medication', () => {
      it('formats basic medication', () => {
        const event = createMedication();

        const result = formatEventForContext(event);

        expect(result).toContain('[MEDICATION]');
        expect(result).toContain('Medication: Metformin');
        expect(result).toContain('Dosage: 500mg twice daily');
        expect(result).toContain('Started: 2024-01-01');
        expect(result).toContain('Status: Currently taking');
      });

      it('includes prescriber when provided', () => {
        const event = createMedication({ prescriber: 'Dr. Wilson' });

        const result = formatEventForContext(event);

        expect(result).toContain('Prescriber: Dr. Wilson');
      });

      it('includes reason when provided', () => {
        const event = createMedication({ reason: 'Blood sugar control' });

        const result = formatEventForContext(event);

        expect(result).toContain('Reason: Blood sugar control');
      });

      it('shows discontinued status', () => {
        const event = createMedication({
          isActive: false,
          endDate: '2024-03-01',
        });

        const result = formatEventForContext(event);

        expect(result).toContain('Status: Discontinued');
        expect(result).toContain('Ended: 2024-03-01');
      });

      it('includes side effects when provided', () => {
        const event = createMedication({
          sideEffects: ['Nausea', 'Dizziness'],
        });

        const result = formatEventForContext(event);

        expect(result).toContain('Side effects: Nausea, Dizziness');
      });
    });

    describe('intervention', () => {
      it('formats basic intervention', () => {
        const event = createIntervention();

        const result = formatEventForContext(event);

        expect(result).toContain('[INTERVENTION]');
        expect(result).toContain('Intervention: Low Carb Diet');
        expect(result).toContain('Category: diet');
        expect(result).toContain('Started: 2024-01-01');
        expect(result).toContain('Status: Ongoing');
      });

      it('shows completed status with end date', () => {
        const event = createIntervention({
          isOngoing: false,
          endDate: '2024-03-01',
        });

        const result = formatEventForContext(event);

        expect(result).toContain('Status: Completed');
        expect(result).toContain('Ended: 2024-03-01');
      });

      it('includes protocol when provided', () => {
        const event = createIntervention({ protocol: '16:8 intermittent fasting' });

        const result = formatEventForContext(event);

        expect(result).toContain('Protocol: 16:8 intermittent fasting');
      });
    });

    describe('metric', () => {
      it('formats basic metric', () => {
        const event = createMetric();

        const result = formatEventForContext(event);

        expect(result).toContain('[METRIC]');
        expect(result).toContain('Metric: Weight');
        expect(result).toContain('Value: 180 lbs');
        expect(result).toContain('Source: manual_entry');
      });
    });

    describe('vice', () => {
      it('formats basic vice', () => {
        const event = createVice();

        const result = formatEventForContext(event);

        expect(result).toContain('[VICE]');
        expect(result).toContain('Category: alcohol');
      });

      it('includes quantity when provided', () => {
        const event = createVice({
          quantity: 2,
          unit: 'drinks',
        });

        const result = formatEventForContext(event);

        expect(result).toContain('Amount: 2 drinks');
      });

      it('includes context when provided', () => {
        const event = createVice({ context: 'Social gathering' });

        const result = formatEventForContext(event);

        expect(result).toContain('Context: Social gathering');
      });

      it('includes trigger when provided', () => {
        const event = createVice({ trigger: 'Stress' });

        const result = formatEventForContext(event);

        expect(result).toContain('Trigger: Stress');
      });
    });

    describe('common fields', () => {
      it('includes notes when provided', () => {
        const event = createLabResult({ notes: 'Fasting sample' });

        const result = formatEventForContext(event);

        expect(result).toContain('Notes: Fasting sample');
      });

      it('includes tags when provided', () => {
        const event = createLabResult({ tags: ['routine', 'annual'] });

        const result = formatEventForContext(event);

        expect(result).toContain('Tags: routine, annual');
      });

      it('does not include notes when empty', () => {
        const event = createLabResult({ notes: '' });

        const result = formatEventForContext(event);

        expect(result).not.toContain('Notes:');
      });

      it('does not include tags when empty', () => {
        const event = createLabResult({ tags: [] });

        const result = formatEventForContext(event);

        expect(result).not.toContain('Tags:');
      });
    });
  });

  describe('formatEventsForContext', () => {
    it('formats multiple events with separators', () => {
      const events = [createLabResult(), createDoctorVisit()];

      const result = formatEventsForContext(events);

      expect(result).toContain('=== HEALTH TIMELINE CONTEXT ===');
      expect(result).toContain('Total events provided: 2');
      expect(result).toContain('[LAB RESULT]');
      expect(result).toContain('[DOCTOR VISIT]');
      expect(result).toContain('---');
      expect(result).toContain('=== END CONTEXT ===');
    });

    it('handles empty events array', () => {
      const result = formatEventsForContext([]);

      expect(result).toContain('=== HEALTH TIMELINE CONTEXT ===');
      expect(result).toContain('Total events provided: 0');
      expect(result).toContain('No health events found matching the query criteria.');
      expect(result).toContain('=== END CONTEXT ===');
    });

    it('includes truncation note when truncated is true', () => {
      const events = [createLabResult()];

      const result = formatEventsForContext(events, true);

      expect(result).toContain('Note: Some older or less relevant events were omitted');
    });

    it('does not include truncation note when truncated is false', () => {
      const events = [createLabResult()];

      const result = formatEventsForContext(events, false);

      expect(result).not.toContain('Note: Some older or less relevant events were omitted');
    });
  });

  describe('estimateTokens', () => {
    it('estimates tokens as ~4 characters per token', () => {
      const text = 'Hello world'; // 11 characters

      const result = estimateTokens(text);

      expect(result).toBe(3); // ceil(11/4) = 3
    });

    it('handles empty string', () => {
      const result = estimateTokens('');

      expect(result).toBe(0);
    });

    it('handles longer text', () => {
      const text = 'This is a longer piece of text that we want to estimate tokens for.';
      // 68 characters, ceil(68/4) = 17

      const result = estimateTokens(text);

      expect(result).toBe(17);
    });

    it('rounds up partial tokens', () => {
      const text = 'Hello'; // 5 characters, ceil(5/4) = 2

      const result = estimateTokens(text);

      expect(result).toBe(2);
    });
  });

  describe('formatUserProfileForContext', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-06-15'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('formats complete user profile', () => {
      const profile: UserProfileRow = {
        id: 'profile-1',
        user_id: 'user-123',
        display_name: 'John Doe',
        date_of_birth: '1990-06-15',
        gender: 'male',
        height_cm: 180,
        weight_kg: 80,
        medical_conditions: ['Diabetes', 'Hypertension'],
        current_medications: ['Metformin', 'Lisinopril'],
        allergies: ['Penicillin'],
        surgical_history: ['Appendectomy'],
        family_history: {
          heart_disease: ['Father'],
          diabetes: ['Mother', 'Grandfather'],
        },
        smoking_status: 'never_smoked',
        alcohol_frequency: 'occasionally',
        exercise_frequency: 'regularly',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = formatUserProfileForContext(profile);

      expect(result).toContain('=== USER PROFILE ===');
      expect(result).toContain('Name: John Doe');
      expect(result).toContain('Age: 34 years old');
      expect(result).toContain('Gender: male');
      expect(result).toContain('Height: 180 cm');
      expect(result).toContain('Weight: 80 kg');
      expect(result).toContain('BMI: 24.7');
      expect(result).toContain('Conditions: Diabetes, Hypertension');
      expect(result).toContain('Current Medications: Metformin, Lisinopril');
      expect(result).toContain('Allergies: Penicillin');
      expect(result).toContain('Surgical History: Appendectomy');
      expect(result).toContain('heart disease: Father');
      expect(result).toContain('diabetes: Mother, Grandfather');
      expect(result).toContain('Smoking: never smoked');
      expect(result).toContain('Alcohol: occasionally');
      expect(result).toContain('Exercise: regularly');
      expect(result).toContain('=== END PROFILE ===');
    });

    it('handles null profile', () => {
      const result = formatUserProfileForContext(null);

      expect(result).toContain('=== USER PROFILE ===');
      expect(result).toContain('No profile available.');
      expect(result).toContain('=== END PROFILE ===');
    });

    it('handles profile with missing optional fields', () => {
      const profile: UserProfileRow = {
        id: 'profile-1',
        user_id: 'user-123',
        display_name: null,
        date_of_birth: null,
        gender: null,
        height_cm: null,
        weight_kg: null,
        medical_conditions: null,
        current_medications: null,
        allergies: null,
        surgical_history: null,
        family_history: null,
        smoking_status: null,
        alcohol_frequency: null,
        exercise_frequency: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = formatUserProfileForContext(profile);

      expect(result).toContain('Name: Not provided');
      expect(result).toContain('Gender: Not specified');
      expect(result).toContain('Conditions: None listed');
      expect(result).toContain('Current Medications: None listed');
      expect(result).toContain('Allergies: None listed');
      expect(result).toContain('Surgical History: None listed');
      expect(result).toContain('Family History: None listed');
      expect(result).toContain('Smoking: Not specified');
      expect(result).toContain('Alcohol: Not specified');
      expect(result).toContain('Exercise: Not specified');
    });

    it('calculates age correctly', () => {
      // Set current date to June 15, 2024
      const profile: UserProfileRow = {
        id: 'profile-1',
        user_id: 'user-123',
        display_name: 'Test User',
        date_of_birth: '1990-06-14', // One day before - should be 34
        gender: 'male',
        height_cm: null,
        weight_kg: null,
        medical_conditions: null,
        current_medications: null,
        allergies: null,
        surgical_history: null,
        family_history: null,
        smoking_status: null,
        alcohol_frequency: null,
        exercise_frequency: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = formatUserProfileForContext(profile);

      expect(result).toContain('Age: 34 years old');
    });

    it('calculates age correctly for birthday not yet reached', () => {
      // Set current date to June 15, 2024
      const profile: UserProfileRow = {
        id: 'profile-1',
        user_id: 'user-123',
        display_name: 'Test User',
        date_of_birth: '1990-06-16', // One day after - should be 33
        gender: 'female',
        height_cm: null,
        weight_kg: null,
        medical_conditions: null,
        current_medications: null,
        allergies: null,
        surgical_history: null,
        family_history: null,
        smoking_status: null,
        alcohol_frequency: null,
        exercise_frequency: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = formatUserProfileForContext(profile);

      expect(result).toContain('Age: 33 years old');
    });

    it('calculates BMI correctly', () => {
      const profile: UserProfileRow = {
        id: 'profile-1',
        user_id: 'user-123',
        display_name: 'Test User',
        date_of_birth: null,
        gender: 'male',
        height_cm: 170,
        weight_kg: 70,
        medical_conditions: null,
        current_medications: null,
        allergies: null,
        surgical_history: null,
        family_history: null,
        smoking_status: null,
        alcohol_frequency: null,
        exercise_frequency: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = formatUserProfileForContext(profile);

      // BMI = 70 / (1.7)^2 = 70 / 2.89 = 24.22
      expect(result).toContain('BMI: 24.2');
    });

    it('does not show BMI if height missing', () => {
      const profile: UserProfileRow = {
        id: 'profile-1',
        user_id: 'user-123',
        display_name: 'Test User',
        date_of_birth: null,
        gender: 'male',
        height_cm: null,
        weight_kg: 70,
        medical_conditions: null,
        current_medications: null,
        allergies: null,
        surgical_history: null,
        family_history: null,
        smoking_status: null,
        alcohol_frequency: null,
        exercise_frequency: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = formatUserProfileForContext(profile);

      expect(result).not.toContain('BMI:');
    });

    it('does not show BMI if weight missing', () => {
      const profile: UserProfileRow = {
        id: 'profile-1',
        user_id: 'user-123',
        display_name: 'Test User',
        date_of_birth: null,
        gender: 'male',
        height_cm: 170,
        weight_kg: null,
        medical_conditions: null,
        current_medications: null,
        allergies: null,
        surgical_history: null,
        family_history: null,
        smoking_status: null,
        alcohol_frequency: null,
        exercise_frequency: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = formatUserProfileForContext(profile);

      expect(result).not.toContain('BMI:');
    });

    it('handles empty arrays for medical fields', () => {
      const profile: UserProfileRow = {
        id: 'profile-1',
        user_id: 'user-123',
        display_name: 'Test User',
        date_of_birth: null,
        gender: 'male',
        height_cm: null,
        weight_kg: null,
        medical_conditions: [],
        current_medications: [],
        allergies: [],
        surgical_history: [],
        family_history: {},
        smoking_status: null,
        alcohol_frequency: null,
        exercise_frequency: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = formatUserProfileForContext(profile);

      expect(result).toContain('Conditions: None listed');
      expect(result).toContain('Current Medications: None listed');
      expect(result).toContain('Allergies: None listed');
      expect(result).toContain('Surgical History: None listed');
      expect(result).toContain('Family History: None listed');
    });

    it('formats family history with underscores replaced by spaces', () => {
      const profile: UserProfileRow = {
        id: 'profile-1',
        user_id: 'user-123',
        display_name: 'Test User',
        date_of_birth: null,
        gender: 'male',
        height_cm: null,
        weight_kg: null,
        medical_conditions: null,
        current_medications: null,
        allergies: null,
        surgical_history: null,
        family_history: {
          heart_disease: ['Father'],
          high_blood_pressure: ['Mother'],
        },
        smoking_status: null,
        alcohol_frequency: null,
        exercise_frequency: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      const result = formatUserProfileForContext(profile);

      expect(result).toContain('heart disease: Father');
      expect(result).toContain('high blood pressure: Mother');
    });
  });
});
