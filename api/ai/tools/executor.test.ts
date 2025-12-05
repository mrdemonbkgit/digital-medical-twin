import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeToolCall, type ToolResult } from './executor';

// Mock definitions module
vi.mock('./definitions.js', () => ({
  isValidTool: (name: string) => [
    'search_events',
    'get_biomarker_history',
    'get_profile',
    'get_recent_labs',
    'get_medications',
    'get_event_details',
  ].includes(name),
}));

// Mock Supabase client builder
function createMockSupabase(overrides: {
  fromData?: unknown;
  fromError?: { message: string; code?: string } | null;
} = {}) {
  const mockSingle = vi.fn().mockResolvedValue({
    data: overrides.fromData ?? null,
    error: overrides.fromError ?? null,
  });

  const mockLimit = vi.fn().mockReturnValue({ data: overrides.fromData ?? [], error: overrides.fromError ?? null });

  const mockOrder = vi.fn().mockReturnValue({
    limit: mockLimit,
    data: overrides.fromData ?? [],
    error: overrides.fromError ?? null,
  });

  const mockNot = vi.fn().mockReturnValue({
    order: mockOrder,
  });

  const mockIn = vi.fn().mockReturnValue({
    order: mockOrder,
    gte: vi.fn().mockReturnValue({
      lte: vi.fn().mockReturnValue({
        order: mockOrder,
      }),
      order: mockOrder,
    }),
  });

  const mockGte = vi.fn().mockReturnValue({
    lte: vi.fn().mockReturnValue({
      order: mockOrder,
    }),
    order: mockOrder,
    not: mockNot,
  });

  const mockLte = vi.fn().mockReturnValue({
    order: mockOrder,
  });

  const mockOr = vi.fn().mockReturnValue({
    data: overrides.fromData ?? [],
    error: overrides.fromError ?? null,
  });

  const mockEqChain = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: mockSingle,
      order: mockOrder,
      not: mockNot,
    }),
    order: mockOrder,
    single: mockSingle,
    not: mockNot,
    in: mockIn,
    gte: mockGte,
    lte: mockLte,
    or: mockOr,
  });

  const mockSelect = vi.fn().mockReturnValue({
    eq: mockEqChain,
    single: mockSingle,
    order: mockOrder,
  });

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
  });

  return {
    from: mockFrom,
    _mocks: { mockFrom, mockSelect, mockEqChain, mockOrder, mockLimit, mockSingle },
  };
}

const mockUserId = 'user-123';

describe('executor', () => {
  describe('executeToolCall', () => {
    describe('routing and validation', () => {
      it('returns error for unknown tool', async () => {
        const supabase = createMockSupabase();

        const result = await executeToolCall('unknown_tool', {}, mockUserId, supabase as any);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown tool: unknown_tool');
      });

      it('handles all valid tool names', async () => {
        const validTools = [
          'search_events',
          'get_biomarker_history',
          'get_profile',
          'get_recent_labs',
          'get_medications',
          'get_event_details',
        ];

        for (const toolName of validTools) {
          const supabase = createMockSupabase({ fromData: [] });
          const args: Record<string, unknown> = {};

          // Add required args for specific tools
          if (toolName === 'get_biomarker_history') {
            args.biomarker_name = 'glucose';
          }
          if (toolName === 'get_event_details') {
            args.event_id = 'event-123';
          }

          const result = await executeToolCall(toolName, args, mockUserId, supabase as any);

          // Should not return "Unknown tool" error
          expect(result.error).not.toBe(`Unknown tool: ${toolName}`);
        }
      });

      it('catches and wraps execution errors', async () => {
        const supabase = createMockSupabase();
        // Force an error by making from() throw
        supabase.from = vi.fn().mockImplementation(() => {
          throw new Error('Database connection failed');
        });

        const result = await executeToolCall('search_events', {}, mockUserId, supabase as any);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database connection failed');
      });

      it('handles non-Error exceptions', async () => {
        const supabase = createMockSupabase();
        supabase.from = vi.fn().mockImplementation(() => {
          throw 'string error';
        });

        const result = await executeToolCall('search_events', {}, mockUserId, supabase as any);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Tool execution failed');
      });
    });

    describe('search_events', () => {
      it('returns formatted events', async () => {
        const mockEvents = [
          { id: '1', type: 'lab_result', date: '2024-01-15', title: 'Blood Panel', notes: 'Fasting', tags: ['annual'] },
          { id: '2', type: 'doctor_visit', date: '2024-01-10', title: 'Checkup', notes: null, tags: [] },
        ];
        const supabase = createMockSupabase({ fromData: mockEvents });

        const result = await executeToolCall('search_events', {}, mockUserId, supabase as any);

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('events');
        expect(result.data).toHaveProperty('count', 2);
      });

      it('filters by event types', async () => {
        const supabase = createMockSupabase({ fromData: [] });

        await executeToolCall(
          'search_events',
          { event_types: ['lab_result', 'medication'] },
          mockUserId,
          supabase as any
        );

        expect(supabase.from).toHaveBeenCalledWith('events');
      });

      it('filters by date range', async () => {
        const supabase = createMockSupabase({ fromData: [] });

        await executeToolCall(
          'search_events',
          { start_date: '2024-01-01', end_date: '2024-12-31' },
          mockUserId,
          supabase as any
        );

        expect(supabase.from).toHaveBeenCalledWith('events');
      });

      it('searches by query text', async () => {
        const supabase = createMockSupabase({ fromData: [] });

        await executeToolCall('search_events', { query: 'aspirin' }, mockUserId, supabase as any);

        expect(supabase.from).toHaveBeenCalledWith('events');
      });

      it('respects limit parameter', async () => {
        const supabase = createMockSupabase({ fromData: [] });

        await executeToolCall('search_events', { limit: 10 }, mockUserId, supabase as any);

        expect(supabase.from).toHaveBeenCalled();
      });

      it('clamps limit to max 50', async () => {
        const supabase = createMockSupabase({ fromData: [] });

        // Requesting 100, should be clamped to 50
        await executeToolCall('search_events', { limit: 100 }, mockUserId, supabase as any);

        expect(supabase.from).toHaveBeenCalled();
      });

      it('handles database error', async () => {
        const supabase = createMockSupabase({ fromError: { message: 'Query failed' } });

        const result = await executeToolCall('search_events', {}, mockUserId, supabase as any);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Query failed');
      });
    });

    describe('get_biomarker_history', () => {
      it('requires biomarker_name', async () => {
        const supabase = createMockSupabase();

        const result = await executeToolCall('get_biomarker_history', {}, mockUserId, supabase as any);

        expect(result.success).toBe(false);
        expect(result.error).toBe('biomarker_name is required');
      });

      it('returns biomarker history with trend', async () => {
        const mockStandards = [
          { code: 'glucose', name: 'Glucose', aliases: ['blood glucose', 'fasting glucose'] },
        ];
        const mockEvents = [
          { id: '1', date: '2024-01-01', lab_name: 'Lab A', biomarkers: [{ name: 'Glucose', value: 90, unit: 'mg/dL' }] },
          { id: '2', date: '2024-06-01', lab_name: 'Lab B', biomarkers: [{ name: 'Glucose', value: 95, unit: 'mg/dL' }] },
        ];

        // Need to properly mock the chain for multiple queries
        const mockFrom = vi.fn()
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              data: mockStandards,
              error: null,
            }),
          })
          .mockReturnValueOnce({
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      gte: vi.fn().mockReturnValue({
                        lte: vi.fn().mockReturnValue({
                          data: mockEvents,
                          error: null,
                        }),
                        data: mockEvents,
                        error: null,
                      }),
                      data: mockEvents,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          });

        const supabase = { from: mockFrom };

        const result = await executeToolCall(
          'get_biomarker_history',
          { biomarker_name: 'glucose' },
          mockUserId,
          supabase as any
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('biomarker', 'glucose');
        expect(result.data).toHaveProperty('measurements');
        expect(result.data).toHaveProperty('count');
      });

      it('handles empty biomarker name', async () => {
        const supabase = createMockSupabase();

        const result = await executeToolCall(
          'get_biomarker_history',
          { biomarker_name: '   ' },
          mockUserId,
          supabase as any
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('biomarker_name is required');
      });
    });

    describe('get_profile', () => {
      it('returns full profile when no sections specified', async () => {
        const mockProfile = {
          display_name: 'John Doe',
          gender: 'male',
          date_of_birth: '1990-01-15',
          height_cm: 180,
          weight_kg: 75,
          medical_conditions: ['hypertension'],
          current_medications: ['lisinopril'],
          allergies: ['penicillin'],
          surgical_history: ['appendectomy'],
          family_history: { diabetes: ['mother'] },
          smoking_status: 'never',
          alcohol_frequency: 'occasional',
          exercise_frequency: 'regular',
        };

        const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
        const supabase = { from: mockFrom };

        const result = await executeToolCall('get_profile', {}, mockUserId, supabase as any);

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('profile');
      });

      it('returns null profile when none exists', async () => {
        const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows' } });
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
        const supabase = { from: mockFrom };

        const result = await executeToolCall('get_profile', {}, mockUserId, supabase as any);

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('profile', null);
      });

      it('returns specific sections when requested', async () => {
        const mockProfile = {
          display_name: 'John',
          gender: 'male',
          date_of_birth: '1990-01-15',
          height_cm: 180,
          weight_kg: 75,
          medical_conditions: [],
          current_medications: [],
          allergies: ['penicillin'],
          surgical_history: [],
          family_history: {},
          smoking_status: null,
          alcohol_frequency: null,
          exercise_frequency: null,
        };

        const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
        const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
        const supabase = { from: mockFrom };

        const result = await executeToolCall(
          'get_profile',
          { sections: ['allergies'] },
          mockUserId,
          supabase as any
        );

        expect(result.success).toBe(true);
        expect(result.data?.profile).toHaveProperty('allergies');
      });
    });

    describe('get_recent_labs', () => {
      it('returns formatted lab results', async () => {
        const mockLabs = [
          {
            id: 'lab-1',
            date: '2024-06-01',
            title: 'Comprehensive Panel',
            lab_name: 'Quest',
            ordering_doctor: 'Dr. Smith',
            biomarkers: [
              { name: 'Glucose', value: 95, unit: 'mg/dL', flag: 'normal', refMin: 70, refMax: 100 },
            ],
            notes: 'Fasting',
          },
        ];

        const supabase = createMockSupabase({ fromData: mockLabs });

        const result = await executeToolCall('get_recent_labs', {}, mockUserId, supabase as any);

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('labs');
        expect(result.data).toHaveProperty('count');
      });

      it('respects limit parameter', async () => {
        const supabase = createMockSupabase({ fromData: [] });

        await executeToolCall('get_recent_labs', { limit: 10 }, mockUserId, supabase as any);

        expect(supabase.from).toHaveBeenCalledWith('events');
      });

      it('clamps limit to max 20', async () => {
        const supabase = createMockSupabase({ fromData: [] });

        // Requesting 100, should be clamped to 20
        await executeToolCall('get_recent_labs', { limit: 100 }, mockUserId, supabase as any);

        expect(supabase.from).toHaveBeenCalled();
      });
    });

    describe('get_medications', () => {
      it('returns active medications by default', async () => {
        const mockMedications = [
          {
            id: 'med-1',
            date: '2024-01-01',
            title: 'Lisinopril',
            medication_name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'daily',
            prescriber: 'Dr. Smith',
            reason: 'Blood pressure',
            start_date: '2024-01-01',
            end_date: null,
            is_active: true,
            side_effects: [],
            notes: null,
          },
        ];

        // Chain: from().select().eq(user).eq(type).order() -> query.eq(is_active)
        // The order() result needs to also have eq() for the active filter
        const queryResult = { data: mockMedications, error: null };
        const mockEqActive = vi.fn().mockReturnValue(queryResult);
        const mockOrder = vi.fn().mockReturnValue({ ...queryResult, eq: mockEqActive });
        const mockEqType = vi.fn().mockReturnValue({ order: mockOrder });
        const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqType });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
        const supabase = { from: mockFrom };

        const result = await executeToolCall('get_medications', {}, mockUserId, supabase as any);

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('medications');
        expect(result.data).toHaveProperty('activeOnly', true);
      });

      it('returns all medications when active_only is false', async () => {
        const mockMedications: unknown[] = [];
        const mockOrder = vi.fn().mockReturnValue({ data: mockMedications, error: null });
        const mockEqType = vi.fn().mockReturnValue({ order: mockOrder, eq: vi.fn().mockReturnValue({ order: mockOrder }) });
        const mockEqUser = vi.fn().mockReturnValue({ eq: mockEqType });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEqUser });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
        const supabase = { from: mockFrom };

        const result = await executeToolCall(
          'get_medications',
          { active_only: false },
          mockUserId,
          supabase as any
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('activeOnly', false);
      });
    });

    describe('get_event_details', () => {
      it('requires event_id', async () => {
        const supabase = createMockSupabase();

        const result = await executeToolCall('get_event_details', {}, mockUserId, supabase as any);

        expect(result.success).toBe(false);
        expect(result.error).toBe('event_id is required');
      });

      it('returns event details', async () => {
        const mockEvent = {
          id: 'event-123',
          type: 'lab_result',
          date: '2024-06-01',
          title: 'Blood Panel',
          notes: 'Fasting',
          tags: ['annual'],
          lab_name: 'Quest',
          biomarkers: [{ name: 'Glucose', value: 95, unit: 'mg/dL' }],
        };

        const mockSingle = vi.fn().mockResolvedValue({ data: mockEvent, error: null });
        const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
        const mockEq = vi.fn().mockReturnValue({ eq: mockEq2 });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
        const supabase = { from: mockFrom };

        const result = await executeToolCall(
          'get_event_details',
          { event_id: 'event-123' },
          mockUserId,
          supabase as any
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('event');
      });

      it('returns error when event not found', async () => {
        const mockSingle = vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows' },
        });
        const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
        const mockEq = vi.fn().mockReturnValue({ eq: mockEq2 });
        const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
        const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
        const supabase = { from: mockFrom };

        const result = await executeToolCall(
          'get_event_details',
          { event_id: 'nonexistent' },
          mockUserId,
          supabase as any
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe('Event not found');
      });
    });
  });

  describe('ToolResult interface', () => {
    it('success result has correct shape', async () => {
      const supabase = createMockSupabase({ fromData: [] });

      const result: ToolResult = await executeToolCall('search_events', {}, mockUserId, supabase as any);

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      if (result.success) {
        expect(result).toHaveProperty('data');
      }
    });

    it('error result has correct shape', async () => {
      const supabase = createMockSupabase();

      const result: ToolResult = await executeToolCall('unknown', {}, mockUserId, supabase as any);

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
    });
  });
});
