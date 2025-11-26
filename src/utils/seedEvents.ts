import { supabase } from '@/lib/supabase';
import type { Biomarker } from '@/types';

// Helper to get date relative to today
function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export async function seedMockEvents(): Promise<{ success: boolean; message: string }> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'User not authenticated' };
  }

  const mockEvents = [
    // Lab Result - Today
    {
      user_id: user.id,
      type: 'lab_result',
      date: daysAgo(0),
      title: 'Annual Blood Panel',
      notes: 'Fasting blood work for annual physical',
      lab_name: 'Quest Diagnostics',
      ordering_doctor: 'Dr. Sarah Chen',
      biomarkers: [
        { name: 'Total Cholesterol', value: 195, unit: 'mg/dL', referenceMin: 0, referenceMax: 200, flag: 'normal' },
        { name: 'LDL Cholesterol', value: 118, unit: 'mg/dL', referenceMin: 0, referenceMax: 100, flag: 'high' },
        { name: 'HDL Cholesterol', value: 62, unit: 'mg/dL', referenceMin: 40, referenceMax: 100, flag: 'normal' },
        { name: 'Triglycerides', value: 85, unit: 'mg/dL', referenceMin: 0, referenceMax: 150, flag: 'normal' },
        { name: 'Fasting Glucose', value: 92, unit: 'mg/dL', referenceMin: 70, referenceMax: 100, flag: 'normal' },
        { name: 'HbA1c', value: 5.4, unit: '%', referenceMin: 4.0, referenceMax: 5.7, flag: 'normal' },
      ] as Biomarker[],
    },
    // Doctor Visit - 2 days ago
    {
      user_id: user.id,
      type: 'doctor_visit',
      date: daysAgo(2),
      title: 'Annual Physical Exam',
      notes: 'Routine checkup. Blood pressure slightly elevated. Recommended more exercise and reducing sodium intake.',
      doctor_name: 'Dr. Sarah Chen',
      specialty: 'Internal Medicine',
      facility: 'Bay Area Medical Center',
      diagnosis: ['Essential hypertension, stage 1', 'Vitamin D deficiency'],
      follow_up: '2024-06-15',
    },
    // Medication - 3 days ago
    {
      user_id: user.id,
      type: 'medication',
      date: daysAgo(3),
      title: 'Started Vitamin D3',
      notes: 'Taking with breakfast for better absorption',
      medication_name: 'Vitamin D3',
      dosage: '5000 IU',
      frequency: 'Once daily',
      prescriber: 'Dr. Sarah Chen',
      reason: 'Vitamin D deficiency',
      start_date: daysAgo(3),
      is_active: true,
    },
    // Metric - 1 day ago
    {
      user_id: user.id,
      type: 'metric',
      date: daysAgo(1),
      title: 'Morning Weight',
      source: 'manual',
      metric_name: 'Weight',
      value: 172.5,
      unit: 'lbs',
    },
    // Metric - Today
    {
      user_id: user.id,
      type: 'metric',
      date: daysAgo(0),
      title: 'Blood Pressure Reading',
      notes: 'Taken at home, seated, after 5 min rest',
      source: 'manual',
      metric_name: 'Blood Pressure',
      value: 128,
      unit: 'mmHg (systolic)',
    },
    // Intervention - 7 days ago
    {
      user_id: user.id,
      type: 'intervention',
      date: daysAgo(7),
      title: 'Started Mediterranean Diet',
      notes: 'Following PREDIMED study guidelines. Focusing on olive oil, nuts, fish, and vegetables.',
      intervention_name: 'Mediterranean Diet',
      category: 'diet',
      start_date: daysAgo(7),
      protocol: 'Increase olive oil to 4 tbsp/day, fish 3x/week, nuts daily, reduce red meat to 1x/week',
    },
    // Intervention - 14 days ago
    {
      user_id: user.id,
      type: 'intervention',
      date: daysAgo(14),
      title: 'Morning Walk Routine',
      notes: '30 minute brisk walk before breakfast',
      intervention_name: 'Morning Walking',
      category: 'exercise',
      start_date: daysAgo(14),
      protocol: '30 min walk, 6 days/week, target HR 100-120 bpm',
    },
    // Lab Result - 30 days ago
    {
      user_id: user.id,
      type: 'lab_result',
      date: daysAgo(30),
      title: 'Vitamin D Level Check',
      lab_name: 'LabCorp',
      ordering_doctor: 'Dr. Sarah Chen',
      biomarkers: [
        { name: '25-Hydroxyvitamin D', value: 22, unit: 'ng/mL', referenceMin: 30, referenceMax: 100, flag: 'low' },
      ] as Biomarker[],
    },
    // Metric - 5 days ago (Whoop)
    {
      user_id: user.id,
      type: 'metric',
      date: daysAgo(5),
      title: 'HRV Recovery',
      notes: 'Weekly average from Whoop',
      source: 'whoop',
      metric_name: 'HRV',
      value: 48,
      unit: 'ms',
    },
    // Medication - completed course
    {
      user_id: user.id,
      type: 'medication',
      date: daysAgo(45),
      title: 'Completed Antibiotic Course',
      medication_name: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'Three times daily',
      prescriber: 'Dr. James Wilson',
      reason: 'Sinus infection',
      start_date: daysAgo(55),
      end_date: daysAgo(45),
      is_active: false,
    },
  ];

  const { error } = await supabase.from('events').insert(mockEvents);

  if (error) {
    return { success: false, message: `Failed to seed events: ${error.message}` };
  }

  return { success: true, message: `Successfully added ${mockEvents.length} mock events` };
}

export async function clearAllEvents(): Promise<{ success: boolean; message: string }> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'User not authenticated' };
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    return { success: false, message: `Failed to clear events: ${error.message}` };
  }

  return { success: true, message: 'All events cleared' };
}
