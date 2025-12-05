import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runPerformanceTests, formatReport } from './dbPerformance';

// Mock supabase
const mockGetSession = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockEq = vi.fn();
const mockIlike = vi.fn();
const mockNot = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
    from: (table: string) => {
      mockFrom(table);
      return {
        select: (query: string, options?: any) => {
          mockSelect(query, options);
          return {
            order: (col: string, opts: any) => {
              mockOrder(col, opts);
              return {
                limit: (n: number) => {
                  mockLimit(n);
                  return Promise.resolve({ data: [], error: null });
                },
              };
            },
            limit: (n: number) => {
              mockLimit(n);
              return {
                single: () => {
                  mockSingle();
                  return Promise.resolve({ data: { id: 'test-id' }, error: null });
                },
              };
            },
            eq: (col: string, val: any) => {
              mockEq(col, val);
              return {
                limit: (n: number) => {
                  mockLimit(n);
                  return Promise.resolve({ data: [], error: null });
                },
                single: () => {
                  mockSingle();
                  return Promise.resolve({ data: {}, error: null });
                },
              };
            },
            ilike: (col: string, val: string) => {
              mockIlike(col, val);
              return {
                limit: (n: number) => {
                  mockLimit(n);
                  return Promise.resolve({ data: [], error: null });
                },
              };
            },
            not: (col: string, op: string, val: any) => {
              mockNot(col, op, val);
              return Promise.resolve({ data: [], error: null });
            },
            maybeSingle: () => {
              mockMaybeSingle();
              return Promise.resolve({ data: null, error: null });
            },
          };
        },
      };
    },
  },
}));

// Mock dynamic import for createClient
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
  })),
}));

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-key',
    },
  },
});

describe('runPerformanceTests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('returns a performance report', async () => {
    const report = await runPerformanceTests();

    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('supabaseUrl');
    expect(report).toHaveProperty('results');
    expect(report).toHaveProperty('summary');
  });

  it('includes timestamp in ISO format', async () => {
    const report = await runPerformanceTests();
    expect(new Date(report.timestamp).toISOString()).toBe(report.timestamp);
  });

  it('runs auth session check test', async () => {
    const report = await runPerformanceTests();
    const authTest = report.results.find(r => r.test === 'Auth session check');
    expect(authTest).toBeDefined();
    expect(authTest?.status).toBe('success');
  });

  it('runs count events test', async () => {
    const report = await runPerformanceTests();
    const countTest = report.results.find(r => r.test === 'Count events (SELECT count)');
    expect(countTest).toBeDefined();
  });

  it('runs fetch events test', async () => {
    const report = await runPerformanceTests();
    const fetchTest = report.results.find(r => r.test === 'Fetch events (LIMIT 20)');
    expect(fetchTest).toBeDefined();
  });

  it('runs fetch with filter test', async () => {
    const report = await runPerformanceTests();
    const filterTest = report.results.find(r => r.test === 'Fetch with type filter');
    expect(filterTest).toBeDefined();
  });

  it('runs text search test', async () => {
    const report = await runPerformanceTests();
    const searchTest = report.results.find(r => r.test === 'Text search (ilike)');
    expect(searchTest).toBeDefined();
  });

  it('calculates summary statistics', async () => {
    const report = await runPerformanceTests();

    expect(report.summary).toHaveProperty('total');
    expect(report.summary).toHaveProperty('avgLatency');
    expect(report.summary).toHaveProperty('minLatency');
    expect(report.summary).toHaveProperty('maxLatency');
    expect(report.summary).toHaveProperty('failures');
  });

  it('counts total tests correctly', async () => {
    const report = await runPerformanceTests();
    expect(report.summary.total).toBe(report.results.length);
  });

  it('counts failures correctly', async () => {
    const report = await runPerformanceTests();
    const failures = report.results.filter(r => r.status === 'error').length;
    expect(report.summary.failures).toBe(failures);
  });

  it('records duration for each test', async () => {
    const report = await runPerformanceTests();
    for (const result of report.results) {
      expect(typeof result.duration).toBe('number');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    }
  });

  it('handles auth error gracefully', async () => {
    mockGetSession.mockResolvedValueOnce({ error: new Error('Auth failed') });

    const report = await runPerformanceTests();
    const authTest = report.results.find(r => r.test === 'Auth session check');
    expect(authTest?.status).toBe('error');
    expect(authTest?.details).toContain('Auth failed');
  });
});

describe('formatReport', () => {
  const sampleReport = {
    timestamp: '2024-01-15T10:30:00.000Z',
    supabaseUrl: 'https://test.supabase.co',
    results: [
      { test: 'Auth session check', duration: 50, status: 'success' as const },
      { test: 'Count events', duration: 100, status: 'success' as const },
      { test: 'Failed test', duration: 200, status: 'error' as const, details: 'Connection timeout' },
    ],
    summary: {
      total: 3,
      avgLatency: 116.67,
      minLatency: 50,
      maxLatency: 200,
      failures: 1,
    },
  };

  it('returns a string', () => {
    const formatted = formatReport(sampleReport);
    expect(typeof formatted).toBe('string');
  });

  it('includes header', () => {
    const formatted = formatReport(sampleReport);
    expect(formatted).toContain('SUPABASE PERFORMANCE TEST REPORT');
  });

  it('includes timestamp', () => {
    const formatted = formatReport(sampleReport);
    expect(formatted).toContain('2024-01-15T10:30:00.000Z');
  });

  it('includes supabase URL', () => {
    const formatted = formatReport(sampleReport);
    expect(formatted).toContain('https://test.supabase.co');
  });

  it('includes test results', () => {
    const formatted = formatReport(sampleReport);
    expect(formatted).toContain('Auth session check');
    expect(formatted).toContain('Count events');
    expect(formatted).toContain('Failed test');
  });

  it('shows success/failure indicators', () => {
    const formatted = formatReport(sampleReport);
    expect(formatted).toContain('✓');
    expect(formatted).toContain('✗');
  });

  it('includes error details', () => {
    const formatted = formatReport(sampleReport);
    expect(formatted).toContain('Connection timeout');
  });

  it('includes summary section', () => {
    const formatted = formatReport(sampleReport);
    expect(formatted).toContain('SUMMARY');
    expect(formatted).toContain('Total Tests:');
    expect(formatted).toContain('Failures:');
    expect(formatted).toContain('Avg Latency:');
    expect(formatted).toContain('Min Latency:');
    expect(formatted).toContain('Max Latency:');
  });

  it('shows excellent assessment for low latency', () => {
    const lowLatencyReport = {
      ...sampleReport,
      summary: { ...sampleReport.summary, avgLatency: 50 },
    };
    const formatted = formatReport(lowLatencyReport);
    expect(formatted).toContain('Excellent');
  });

  it('shows good assessment for acceptable latency', () => {
    const goodLatencyReport = {
      ...sampleReport,
      summary: { ...sampleReport.summary, avgLatency: 200 },
    };
    const formatted = formatReport(goodLatencyReport);
    expect(formatted).toContain('Good');
  });

  it('shows fair assessment for moderate latency', () => {
    const fairLatencyReport = {
      ...sampleReport,
      summary: { ...sampleReport.summary, avgLatency: 400 },
    };
    const formatted = formatReport(fairLatencyReport);
    expect(formatted).toContain('Fair');
  });

  it('shows poor assessment for high latency', () => {
    const poorLatencyReport = {
      ...sampleReport,
      summary: { ...sampleReport.summary, avgLatency: 600 },
    };
    const formatted = formatReport(poorLatencyReport);
    expect(formatted).toContain('Poor');
  });

  it('includes recommendations for high latency', () => {
    const highLatencyReport = {
      ...sampleReport,
      summary: { ...sampleReport.summary, avgLatency: 500 },
    };
    const formatted = formatReport(highLatencyReport);
    expect(formatted).toContain('Recommendations:');
    expect(formatted).toContain('Supabase region');
    expect(formatted).toContain('connection pooling');
  });

  it('does not include recommendations for low latency', () => {
    const lowLatencyReport = {
      ...sampleReport,
      summary: { ...sampleReport.summary, avgLatency: 100 },
    };
    const formatted = formatReport(lowLatencyReport);
    expect(formatted).not.toContain('Recommendations:');
  });
});
