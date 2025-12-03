import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getUserTags,
  getAllEvents,
} from './events';

// Mock supabase
const mockSingle = vi.fn();
const mockRange = vi.fn();
const mockOverlaps = vi.fn();
const mockOr = vi.fn();
const mockLte = vi.fn();
const mockGte = vi.fn();
const mockIn = vi.fn();
const mockNot = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

const mockUserId = 'user-123';

// Sample event rows (database format - snake_case)
const mockLabResultRow = {
  id: 'event-1',
  user_id: mockUserId,
  type: 'lab_result',
  date: '2024-01-01',
  title: 'Lipid Panel',
  notes: 'Fasting blood test',
  tags: ['annual', 'cholesterol'],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  lab_name: 'Quest Diagnostics',
  ordering_doctor: 'Dr. Smith',
  biomarkers: [{ name: 'LDL', value: 100, unit: 'mg/dL', flag: 'normal' }],
  // Null fields for other types
  doctor_name: null,
  specialty: null,
  facility: null,
  diagnosis: null,
  follow_up: null,
  medication_name: null,
  dosage: null,
  frequency: null,
  prescriber: null,
  reason: null,
  start_date: null,
  end_date: null,
  is_active: null,
  side_effects: null,
  intervention_name: null,
  category: null,
  protocol: null,
  source: null,
  metric_name: null,
  value: null,
  unit: null,
};

const mockDoctorVisitRow = {
  id: 'event-2',
  user_id: mockUserId,
  type: 'doctor_visit',
  date: '2024-01-15',
  title: 'Annual Checkup',
  notes: null,
  tags: ['annual'],
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  doctor_name: 'Dr. Johnson',
  specialty: 'Internal Medicine',
  facility: 'City Hospital',
  diagnosis: ['Healthy'],
  follow_up: '2025-01-15',
  // Null fields
  lab_name: null,
  ordering_doctor: null,
  biomarkers: null,
  medication_name: null,
  dosage: null,
  frequency: null,
  prescriber: null,
  reason: null,
  start_date: null,
  end_date: null,
  is_active: null,
  side_effects: null,
  intervention_name: null,
  category: null,
  protocol: null,
  source: null,
  metric_name: null,
  value: null,
  unit: null,
};

const mockMedicationRow = {
  id: 'event-3',
  user_id: mockUserId,
  type: 'medication',
  date: '2024-02-01',
  title: 'Vitamin D',
  notes: null,
  tags: ['supplement'],
  created_at: '2024-02-01T00:00:00Z',
  updated_at: '2024-02-01T00:00:00Z',
  medication_name: 'Vitamin D3',
  dosage: '5000 IU',
  frequency: 'daily',
  prescriber: null,
  reason: 'Low vitamin D',
  start_date: '2024-02-01',
  end_date: null,
  is_active: true,
  side_effects: null,
  // Null fields
  lab_name: null,
  ordering_doctor: null,
  biomarkers: null,
  doctor_name: null,
  specialty: null,
  facility: null,
  diagnosis: null,
  follow_up: null,
  intervention_name: null,
  category: null,
  protocol: null,
  source: null,
  metric_name: null,
  value: null,
  unit: null,
};

const mockEventRows = [mockLabResultRow, mockDoctorVisitRow, mockMedicationRow];

describe('events API', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth setup
    mockGetUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Setup chainable mock - each method returns an object with all possible next methods
    const chainable = {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      in: mockIn,
      gte: mockGte,
      lte: mockLte,
      or: mockOr,
      overlaps: mockOverlaps,
      not: mockNot,
      order: mockOrder,
      range: mockRange,
      single: mockSingle,
    };

    mockFrom.mockReturnValue(chainable);
    mockSelect.mockReturnValue(chainable);
    mockEq.mockReturnValue(chainable);
    mockIn.mockReturnValue(chainable);
    mockGte.mockReturnValue(chainable);
    mockLte.mockReturnValue(chainable);
    mockOr.mockReturnValue(chainable);
    mockOverlaps.mockReturnValue(chainable);
    mockNot.mockReturnValue(chainable);
    mockOrder.mockReturnValue(chainable);
    mockInsert.mockReturnValue(chainable);
    mockUpdate.mockReturnValue(chainable);
    mockDelete.mockReturnValue(chainable);

    // Default return values
    mockRange.mockReturnValue({ data: mockEventRows, error: null, count: 3 });
    mockSingle.mockReturnValue({ data: mockLabResultRow, error: null });
  });

  describe('getEvents', () => {
    it('fetches events with default pagination', async () => {
      const result = await getEvents();

      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockOrder).toHaveBeenCalledWith('date', { ascending: false });
      expect(mockRange).toHaveBeenCalledWith(0, 19); // Default page 1, limit 20
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('transforms snake_case to camelCase', async () => {
      const result = await getEvents();

      const labResult = result.data.find((e) => e.type === 'lab_result');
      expect(labResult).toBeDefined();
      expect(labResult).toHaveProperty('labName', 'Quest Diagnostics');
      expect(labResult).toHaveProperty('orderingDoctor', 'Dr. Smith');
      expect(labResult).toHaveProperty('userId', mockUserId);
      expect(labResult).toHaveProperty('createdAt');
    });

    it('applies pagination params', async () => {
      await getEvents({}, { page: 3, limit: 10 });

      expect(mockRange).toHaveBeenCalledWith(20, 29); // (3-1)*10 to (3-1)*10+10-1
    });

    it('filters by event types', async () => {
      await getEvents({ eventTypes: ['lab_result', 'doctor_visit'] });

      expect(mockIn).toHaveBeenCalledWith('type', ['lab_result', 'doctor_visit']);
    });

    it('filters by date range', async () => {
      await getEvents({ startDate: '2024-01-01', endDate: '2024-12-31' });

      expect(mockGte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockLte).toHaveBeenCalledWith('date', '2024-12-31');
    });

    it('filters by search term', async () => {
      await getEvents({ search: 'lipid' });

      // Privacy filter uses .not(), search uses .or()
      expect(mockNot).toHaveBeenCalledWith('is_private', 'eq', true);
      expect(mockOr).toHaveBeenCalledTimes(1);
      const searchOrArg = mockOr.mock.calls[0][0];
      expect(searchOrArg).toContain('title.ilike.%lipid%');
    });

    it('filters by tags', async () => {
      await getEvents({ tags: ['annual', 'checkup'] });

      expect(mockOverlaps).toHaveBeenCalledWith('tags', ['annual', 'checkup']);
    });

    it('calculates hasMore correctly', async () => {
      mockRange.mockReturnValue({ data: mockEventRows, error: null, count: 100 });

      const result = await getEvents({}, { page: 1, limit: 20 });

      expect(result.hasMore).toBe(true);
    });

    it('throws error when query fails', async () => {
      mockRange.mockReturnValue({ data: null, error: { message: 'Database error' }, count: null });

      await expect(getEvents()).rejects.toThrow('Failed to fetch events');
    });
  });

  describe('getEvent', () => {
    it('fetches single event by id', async () => {
      const result = await getEvent('event-1');

      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(mockEq).toHaveBeenCalledWith('id', 'event-1');
      expect(mockSingle).toHaveBeenCalled();
      expect(result?.id).toBe('event-1');
    });

    it('returns null when not found', async () => {
      mockSingle.mockReturnValue({ data: null, error: { code: 'PGRST116' } });

      const result = await getEvent('nonexistent');

      expect(result).toBeNull();
    });

    it('throws error for other failures', async () => {
      mockSingle.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await expect(getEvent('event-1')).rejects.toThrow('Failed to fetch event');
    });

    it('correctly transforms lab_result type', async () => {
      mockSingle.mockReturnValue({ data: mockLabResultRow, error: null });

      const result = await getEvent('event-1');

      expect(result?.type).toBe('lab_result');
      expect(result).toHaveProperty('labName');
      expect(result).toHaveProperty('biomarkers');
    });

    it('correctly transforms doctor_visit type', async () => {
      mockSingle.mockReturnValue({ data: mockDoctorVisitRow, error: null });

      const result = await getEvent('event-2');

      expect(result?.type).toBe('doctor_visit');
      expect(result).toHaveProperty('doctorName', 'Dr. Johnson');
      expect(result).toHaveProperty('specialty');
      expect(result).toHaveProperty('facility');
    });

    it('correctly transforms medication type', async () => {
      mockSingle.mockReturnValue({ data: mockMedicationRow, error: null });

      const result = await getEvent('event-3');

      expect(result?.type).toBe('medication');
      expect(result).toHaveProperty('medicationName', 'Vitamin D3');
      expect(result).toHaveProperty('dosage');
      expect(result).toHaveProperty('isActive', true);
    });
  });

  describe('createEvent', () => {
    it('creates lab_result event', async () => {
      const input = {
        type: 'lab_result' as const,
        date: '2024-03-01',
        title: 'Blood Work',
        labName: 'LabCorp',
        biomarkers: [{ name: 'Glucose', value: 95, unit: 'mg/dL' }],
      };

      const result = await createEvent(input);

      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(mockInsert).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('creates doctor_visit event', async () => {
      const input = {
        type: 'doctor_visit' as const,
        date: '2024-03-01',
        title: 'Checkup',
        doctorName: 'Dr. Brown',
        specialty: 'Cardiology',
      };

      await createEvent(input);

      expect(mockInsert).toHaveBeenCalled();
    });

    it('creates medication event', async () => {
      const input = {
        type: 'medication' as const,
        date: '2024-03-01',
        title: 'New Prescription',
        medicationName: 'Metformin',
        dosage: '500mg',
        frequency: 'twice daily',
        startDate: '2024-03-01',
        isActive: true,
      };

      await createEvent(input);

      expect(mockInsert).toHaveBeenCalled();
    });

    it('creates intervention event', async () => {
      mockSingle.mockReturnValue({
        data: {
          ...mockLabResultRow,
          id: 'event-new',
          type: 'intervention',
          intervention_name: 'Exercise Program',
          category: 'exercise',
          start_date: '2024-03-01',
        },
        error: null,
      });

      const input = {
        type: 'intervention' as const,
        date: '2024-03-01',
        title: 'New Exercise Routine',
        interventionName: 'Exercise Program',
        category: 'exercise' as const,
        startDate: '2024-03-01',
      };

      const result = await createEvent(input);

      expect(mockInsert).toHaveBeenCalled();
      expect(result.type).toBe('intervention');
    });

    it('creates metric event', async () => {
      mockSingle.mockReturnValue({
        data: {
          ...mockLabResultRow,
          id: 'event-new',
          type: 'metric',
          source: 'whoop',
          metric_name: 'HRV',
          value: 65,
          unit: 'ms',
        },
        error: null,
      });

      const input = {
        type: 'metric' as const,
        date: '2024-03-01',
        title: 'HRV Reading',
        source: 'whoop' as const,
        metricName: 'HRV',
        value: 65,
        unit: 'ms',
      };

      const result = await createEvent(input);

      expect(mockInsert).toHaveBeenCalled();
      expect(result.type).toBe('metric');
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(
        createEvent({
          type: 'lab_result',
          date: '2024-03-01',
          title: 'Test',
          biomarkers: [],
        })
      ).rejects.toThrow('User not authenticated');
    });

    it('throws error when insert fails', async () => {
      mockSingle.mockReturnValue({ data: null, error: { message: 'Insert failed' } });

      await expect(
        createEvent({
          type: 'lab_result',
          date: '2024-03-01',
          title: 'Test',
          biomarkers: [],
        })
      ).rejects.toThrow('Failed to create event');
    });
  });

  describe('updateEvent', () => {
    beforeEach(() => {
      // First call to getEvent returns existing
      // Second call after update returns updated
      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { data: mockLabResultRow, error: null };
        }
        return {
          data: { ...mockLabResultRow, title: 'Updated Title' },
          error: null,
        };
      });
    });

    it('updates event with new values', async () => {
      const result = await updateEvent('event-1', { title: 'Updated Title' });

      expect(mockUpdate).toHaveBeenCalled();
      expect(result.title).toBe('Updated Title');
    });

    it('throws error when user not authenticated', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await expect(updateEvent('event-1', { title: 'New' })).rejects.toThrow(
        'User not authenticated'
      );
    });

    it('throws error when event not found', async () => {
      mockSingle.mockReturnValue({ data: null, error: { code: 'PGRST116' } });

      await expect(updateEvent('nonexistent', { title: 'New' })).rejects.toThrow('Event not found');
    });

    it('throws error when update fails', async () => {
      let callCount = 0;
      mockSingle.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { data: mockLabResultRow, error: null };
        }
        return { data: null, error: { message: 'Update failed' } };
      });

      await expect(updateEvent('event-1', { title: 'New' })).rejects.toThrow(
        'Failed to update event'
      );
    });
  });

  describe('deleteEvent', () => {
    beforeEach(() => {
      mockEq.mockReturnValue({ error: null });
    });

    it('deletes event by id', async () => {
      await expect(deleteEvent('event-1')).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'event-1');
    });

    it('throws error when delete fails', async () => {
      mockEq.mockReturnValue({ error: { message: 'Delete failed' } });

      await expect(deleteEvent('event-1')).rejects.toThrow('Failed to delete event');
    });
  });

  describe('getUserTags', () => {
    beforeEach(() => {
      mockNot.mockReturnValue({
        data: [{ tags: ['annual', 'cholesterol'] }, { tags: ['annual', 'supplement'] }],
        error: null,
      });
    });

    it('returns unique sorted tags', async () => {
      const result = await getUserTags();

      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(mockSelect).toHaveBeenCalledWith('tags');
      expect(mockNot).toHaveBeenCalledWith('tags', 'is', null);
      expect(result).toEqual(['annual', 'cholesterol', 'supplement']);
    });

    it('handles empty tags', async () => {
      mockNot.mockReturnValue({ data: [], error: null });

      const result = await getUserTags();

      expect(result).toEqual([]);
    });

    it('throws error when query fails', async () => {
      mockNot.mockReturnValue({ data: null, error: { message: 'Database error' } });

      await expect(getUserTags()).rejects.toThrow('Failed to fetch tags');
    });
  });

  describe('getAllEvents', () => {
    beforeEach(() => {
      // getAllEvents chains two order() calls, then privacy filter .not(), then may apply other filters
      // Need to track call count to return data on final call
      let orderCallCount = 0;
      mockOrder.mockImplementation(() => {
        orderCallCount++;
        if (orderCallCount === 1) {
          // First order() returns chainable
          return {
            order: mockOrder,
            not: mockNot,
            in: mockIn,
            gte: mockGte,
            lte: mockLte,
            or: mockOr,
            overlaps: mockOverlaps,
          };
        }
        // Second order() returns chainable for filters (privacy .not() is called next)
        return {
          data: mockEventRows,
          error: null,
          not: mockNot,
          in: mockIn,
          gte: mockGte,
          lte: mockLte,
          or: mockOr,
          overlaps: mockOverlaps,
        };
      });

      // Privacy filter .not() is called first, then other filters may follow
      mockNot.mockReturnValue({
        in: mockIn,
        gte: mockGte,
        lte: mockLte,
        or: mockOr,
        overlaps: mockOverlaps,
        data: mockEventRows,
        error: null,
      });

      // After filters applied, the final call returns data
      mockIn.mockReturnValue({
        not: mockNot,
        gte: mockGte,
        lte: mockLte,
        or: mockOr,
        overlaps: mockOverlaps,
        data: mockEventRows,
        error: null,
      });
      mockGte.mockReturnValue({
        not: mockNot,
        lte: mockLte,
        or: mockOr,
        overlaps: mockOverlaps,
        data: mockEventRows,
        error: null,
      });
      mockLte.mockReturnValue({
        not: mockNot,
        or: mockOr,
        overlaps: mockOverlaps,
        data: mockEventRows,
        error: null,
      });
      mockOverlaps.mockReturnValue({
        data: mockEventRows,
        error: null,
      });
    });

    it('fetches all events without pagination', async () => {
      const result = await getAllEvents();

      expect(mockFrom).toHaveBeenCalledWith('events');
      expect(mockRange).not.toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });

    it('applies filters', async () => {
      await getAllEvents({
        eventTypes: ['lab_result'],
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        tags: ['annual'],
      });

      expect(mockIn).toHaveBeenCalledWith('type', ['lab_result']);
      expect(mockGte).toHaveBeenCalledWith('date', '2024-01-01');
      expect(mockLte).toHaveBeenCalledWith('date', '2024-12-31');
      expect(mockOverlaps).toHaveBeenCalledWith('tags', ['annual']);
    });

    it('throws error when query fails', async () => {
      let orderCallCount = 0;
      mockOrder.mockImplementation(() => {
        orderCallCount++;
        if (orderCallCount === 1) {
          return { order: mockOrder };
        }
        // Second order() returns chainable with .not() for privacy filter
        return {
          not: () => ({ data: null, error: { message: 'Database error' } }),
        };
      });

      await expect(getAllEvents()).rejects.toThrow('Failed to fetch events');
    });
  });
});
