import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToJSON, exportToCSV, exportEvents } from './exportData';
import type { HealthEvent } from '@/types';

// Mock DOM APIs
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();

// Store captured blob content for assertions
let capturedBlobContent: string | null = null;
let capturedBlobType: string | null = null;

beforeEach(() => {
  capturedBlobContent = null;
  capturedBlobType = null;

  // Mock URL API
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = vi.fn();

  // Mock Blob constructor to capture content
  const OriginalBlob = global.Blob;
  vi.spyOn(global, 'Blob').mockImplementation((content, options) => {
    capturedBlobContent = content?.[0] as string || '';
    capturedBlobType = options?.type || '';
    return new OriginalBlob(content, options);
  });

  // Mock document.createElement
  vi.spyOn(document, 'createElement').mockReturnValue({
    href: '',
    download: '',
    click: mockClick,
  } as unknown as HTMLAnchorElement);

  // Mock document.body methods
  vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
  vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const createMockEvent = (overrides: Partial<HealthEvent> = {}): HealthEvent => ({
  id: 'test-id-1',
  userId: 'user-1',
  type: 'metric',
  date: '2024-01-15',
  title: 'Test Event',
  notes: 'Test notes',
  tags: ['tag1', 'tag2'],
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  ...overrides,
});

describe('exportData', () => {
  describe('exportToJSON', () => {
    it('creates JSON blob with correct content type', () => {
      const events = [createMockEvent()];

      exportToJSON(events);

      expect(capturedBlobType).toBe('application/json');
    });

    it('includes metadata in JSON export', () => {
      const events = [createMockEvent()];

      exportToJSON(events);

      const data = JSON.parse(capturedBlobContent!);

      expect(data).toHaveProperty('exportedAt');
      expect(data).toHaveProperty('version', '1.0');
      expect(data).toHaveProperty('count', 1);
      expect(data).toHaveProperty('events');
      expect(data.events).toHaveLength(1);
    });

    it('uses custom filename when provided', () => {
      const events = [createMockEvent()];
      const mockLink = { href: '', download: '', click: mockClick };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      exportToJSON(events, 'custom-export.json');

      expect(mockLink.download).toBe('custom-export.json');
    });

    it('generates default filename with date', () => {
      const events = [createMockEvent()];
      const mockLink = { href: '', download: '', click: mockClick };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      exportToJSON(events);

      expect(mockLink.download).toMatch(/^health-events-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('triggers download flow', () => {
      const events = [createMockEvent()];

      exportToJSON(events);

      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('exports empty events array', () => {
      exportToJSON([]);

      const data = JSON.parse(capturedBlobContent!);

      expect(data.count).toBe(0);
      expect(data.events).toEqual([]);
    });
  });

  describe('exportToCSV', () => {
    it('does nothing for empty events array', () => {
      exportToCSV([]);

      expect(capturedBlobContent).toBeNull();
    });

    it('creates CSV blob with correct content type', () => {
      const events = [createMockEvent()];

      exportToCSV(events);

      expect(capturedBlobType).toBe('text/csv;charset=utf-8;');
    });

    it('includes CSV header row', () => {
      const events = [createMockEvent()];

      exportToCSV(events);

      const lines = capturedBlobContent!.split('\n');

      expect(lines[0]).toContain('id');
      expect(lines[0]).toContain('type');
      expect(lines[0]).toContain('date');
      expect(lines[0]).toContain('title');
    });

    it('exports event data as CSV rows', () => {
      const events = [createMockEvent({ title: 'Test Title', type: 'metric' })];

      exportToCSV(events);

      const lines = capturedBlobContent!.split('\n');

      expect(lines.length).toBeGreaterThan(1);
      expect(lines[1]).toContain('test-id-1');
      expect(lines[1]).toContain('metric');
      expect(lines[1]).toContain('Test Title');
    });

    it('handles arrays by stringifying them', () => {
      const events = [createMockEvent({ tags: ['tag1', 'tag2'] })];

      exportToCSV(events);

      expect(capturedBlobContent).toContain('["tag1","tag2"]');
    });

    it('handles boolean values', () => {
      const events = [createMockEvent({ isActive: true } as unknown as HealthEvent)];

      exportToCSV(events);

      expect(capturedBlobContent).toContain('true');
    });

    it('escapes quotes in values', () => {
      const events = [createMockEvent({ title: 'Test "quoted" title' })];

      exportToCSV(events);

      expect(capturedBlobContent).toContain('""quoted""');
    });

    it('wraps values with commas in quotes', () => {
      const events = [createMockEvent({ notes: 'Note with, comma' })];

      exportToCSV(events);

      expect(capturedBlobContent).toContain('"Note with, comma"');
    });

    it('uses custom filename when provided', () => {
      const events = [createMockEvent()];
      const mockLink = { href: '', download: '', click: mockClick };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      exportToCSV(events, 'custom-export.csv');

      expect(mockLink.download).toBe('custom-export.csv');
    });
  });

  describe('exportEvents', () => {
    it('exports as JSON by default', () => {
      const events = [createMockEvent()];
      const mockLink = { href: '', download: '', click: mockClick };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      exportEvents(events);

      expect(mockLink.download).toMatch(/\.json$/);
    });

    it('exports as JSON when format is json', () => {
      const events = [createMockEvent()];
      const mockLink = { href: '', download: '', click: mockClick };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      exportEvents(events, { format: 'json' });

      expect(mockLink.download).toMatch(/\.json$/);
    });

    it('exports as CSV when format is csv', () => {
      const events = [createMockEvent()];
      const mockLink = { href: '', download: '', click: mockClick };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      exportEvents(events, { format: 'csv' });

      expect(mockLink.download).toMatch(/\.csv$/);
    });

    it('uses custom filename from options', () => {
      const events = [createMockEvent()];
      const mockLink = { href: '', download: '', click: mockClick };
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      exportEvents(events, { format: 'json', filename: 'my-export.json' });

      expect(mockLink.download).toBe('my-export.json');
    });
  });
});
