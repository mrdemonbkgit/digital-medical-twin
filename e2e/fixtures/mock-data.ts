/**
 * Mock data for e2e tests
 */

// Get dates relative to today for realistic test data
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const lastWeek = new Date(today);
lastWeek.setDate(today.getDate() - 7);

const formatDate = (d: Date) => d.toISOString().split('T')[0];

export const mockEvents = [
  {
    id: 'event-1',
    user_id: 'test-user-id',
    type: 'lab_result',
    title: 'Comprehensive Metabolic Panel',
    date: formatDate(today),
    notes: 'Annual checkup bloodwork',
    metadata: {
      biomarkers: [
        { name: 'Glucose', value: 95, unit: 'mg/dL', referenceRange: '70-100' },
        { name: 'Cholesterol', value: 185, unit: 'mg/dL', referenceRange: '<200' },
      ],
    },
    tags: ['bloodwork', 'annual'],
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
  },
  {
    id: 'event-2',
    user_id: 'test-user-id',
    type: 'doctor_visit',
    title: 'Annual Physical',
    date: formatDate(yesterday),
    notes: 'Regular checkup with Dr. Smith',
    metadata: {
      provider: 'Dr. Smith',
      facility: 'City Medical Center',
    },
    tags: ['checkup'],
    created_at: yesterday.toISOString(),
    updated_at: yesterday.toISOString(),
  },
  {
    id: 'event-3',
    user_id: 'test-user-id',
    type: 'medication',
    title: 'Started Vitamin D supplement',
    date: formatDate(lastWeek),
    notes: 'Daily 2000 IU',
    metadata: {
      dosage: '2000 IU',
      frequency: 'daily',
    },
    tags: ['supplements'],
    created_at: lastWeek.toISOString(),
    updated_at: lastWeek.toISOString(),
  },
];

export const mockConversations = [
  {
    id: 'conv-1',
    user_id: 'test-user-id',
    title: 'Recent lab results question',
    provider: 'openai',
    model: 'gpt-4o',
    created_at: today.toISOString(),
    updated_at: today.toISOString(),
  },
  {
    id: 'conv-2',
    user_id: 'test-user-id',
    title: 'Blood pressure trends',
    provider: 'openai',
    model: 'gpt-4o',
    created_at: yesterday.toISOString(),
    updated_at: yesterday.toISOString(),
  },
];

export const mockConversationMessages = [
  {
    id: 'msg-1',
    conversation_id: 'conv-1',
    role: 'user',
    content: 'What were my recent lab results?',
    created_at: today.toISOString(),
  },
  {
    id: 'msg-2',
    conversation_id: 'conv-1',
    role: 'assistant',
    content: 'Based on your health data, your most recent lab results from today show a Comprehensive Metabolic Panel. Your glucose level is 95 mg/dL (within normal range of 70-100) and cholesterol is 185 mg/dL (below the recommended limit of 200).',
    created_at: today.toISOString(),
  },
];

export const mockChatResponse = {
  content: 'Based on your health data, your cholesterol levels have been consistently in the healthy range over the past year. Your most recent reading of 185 mg/dL is below the recommended limit of 200 mg/dL.',
  elapsedTime: '2.1s',
};

export const mockAISettings = {
  id: 'settings-1',
  user_id: 'test-user-id',
  provider: 'openai',
  model: 'gpt-4o',
  openai_reasoning_effort: 'medium',
  gemini_thinking_level: null,
  created_at: today.toISOString(),
  updated_at: today.toISOString(),
};

export const mockUserProfile = {
  id: 'test-user-id',
  display_name: 'Test User',
  date_of_birth: '1990-01-15',
  biological_sex: 'male',
  created_at: lastWeek.toISOString(),
  updated_at: lastWeek.toISOString(),
};

export const mockLabUpload = {
  id: 'upload-1',
  user_id: 'test-user-id',
  file_path: 'test-user-id/lab-report.pdf',
  original_filename: 'lab-report.pdf',
  status: 'complete',
  processing_stage: 'done',
  extracted_data: {
    biomarkers: [
      { name: 'Glucose', value: 95, unit: 'mg/dL' },
      { name: 'Cholesterol', value: 185, unit: 'mg/dL' },
    ],
  },
  created_at: today.toISOString(),
  updated_at: today.toISOString(),
};

export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
};

export const mockSession = {
  access_token: 'mock-access-token-12345',
  refresh_token: 'mock-refresh-token-12345',
  expires_in: 3600,
  token_type: 'bearer',
  user: mockUser,
};
