import { supabase } from '@/lib/supabase';

interface PerformanceResult {
  test: string;
  duration: number;
  status: 'success' | 'error';
  details?: string;
}

interface PerformanceReport {
  timestamp: string;
  supabaseUrl: string;
  results: PerformanceResult[];
  summary: {
    total: number;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    failures: number;
  };
}

async function measureLatency<T>(
  name: string,
  fn: () => Promise<T>
): Promise<PerformanceResult> {
  const start = performance.now();
  try {
    await fn();
    const duration = performance.now() - start;
    return { test: name, duration, status: 'success' };
  } catch (error) {
    const duration = performance.now() - start;
    return {
      test: name,
      duration,
      status: 'error',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function runPerformanceTests(): Promise<PerformanceReport> {
  const results: PerformanceResult[] = [];

  // Test 1: Simple connection test (auth check)
  results.push(
    await measureLatency('Auth session check', async () => {
      const { error } = await supabase.auth.getSession();
      if (error) throw error;
    })
  );

  // Test 2: Simple query - count events
  results.push(
    await measureLatency('Count events (SELECT count)', async () => {
      const { error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
    })
  );

  // Test 3: Fetch first page of events
  results.push(
    await measureLatency('Fetch events (LIMIT 20)', async () => {
      const { error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: false })
        .limit(20);
      if (error) throw error;
    })
  );

  // Test 4: Fetch with filter
  results.push(
    await measureLatency('Fetch with type filter', async () => {
      const { error } = await supabase
        .from('events')
        .select('*')
        .eq('type', 'lab_result')
        .limit(10);
      if (error) throw error;
    })
  );

  // Test 5: Fetch with text search
  results.push(
    await measureLatency('Text search (ilike)', async () => {
      const { error } = await supabase
        .from('events')
        .select('*')
        .ilike('title', '%test%')
        .limit(10);
      if (error) throw error;
    })
  );

  // Test 6: Fetch user tags (aggregate query)
  results.push(
    await measureLatency('Fetch all tags', async () => {
      const { error } = await supabase
        .from('events')
        .select('tags')
        .not('tags', 'is', null);
      if (error) throw error;
    })
  );

  // Test 7: Fetch single event by ID (if we have one)
  const { data: sampleEvent } = await supabase
    .from('events')
    .select('id')
    .limit(1)
    .single();

  if (sampleEvent) {
    results.push(
      await measureLatency('Fetch single event by ID', async () => {
        const { error } = await supabase
          .from('events')
          .select('*')
          .eq('id', sampleEvent.id)
          .single();
        if (error) throw error;
      })
    );
  }

  // Test 8: Fetch user settings
  results.push(
    await measureLatency('Fetch user settings', async () => {
      const { error } = await supabase
        .from('user_settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
    })
  );

  // Test 9: Multiple sequential queries (simulates page load)
  results.push(
    await measureLatency('Sequential: session + events + tags', async () => {
      await supabase.auth.getSession();
      await supabase.from('events').select('*').limit(20);
      await supabase.from('events').select('tags').not('tags', 'is', null);
    })
  );

  // Test 10: Cold start simulation - create new client
  results.push(
    await measureLatency('New client connection', async () => {
      const { createClient } = await import('@supabase/supabase-js');
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const newClient = createClient(url, key);
      await newClient.auth.getSession();
    })
  );

  // Calculate summary
  const successfulResults = results.filter((r) => r.status === 'success');
  const durations = successfulResults.map((r) => r.duration);

  const summary = {
    total: results.length,
    avgLatency: durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0,
    minLatency: durations.length > 0 ? Math.min(...durations) : 0,
    maxLatency: durations.length > 0 ? Math.max(...durations) : 0,
    failures: results.filter((r) => r.status === 'error').length,
  };

  return {
    timestamp: new Date().toISOString(),
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    results,
    summary,
  };
}

export function formatReport(report: PerformanceReport): string {
  const lines: string[] = [
    '╔══════════════════════════════════════════════════════════════╗',
    '║           SUPABASE PERFORMANCE TEST REPORT                  ║',
    '╠══════════════════════════════════════════════════════════════╣',
    `║ Timestamp: ${report.timestamp}`,
    `║ Supabase URL: ${report.supabaseUrl}`,
    '╠══════════════════════════════════════════════════════════════╣',
    '║ RESULTS                                                      ║',
    '╠══════════════════════════════════════════════════════════════╣',
  ];

  for (const result of report.results) {
    const status = result.status === 'success' ? '✓' : '✗';
    const duration = result.duration.toFixed(2).padStart(8);
    const name = result.test.padEnd(40);
    lines.push(`║ ${status} ${name} ${duration}ms`);
    if (result.details) {
      lines.push(`║   └─ Error: ${result.details.slice(0, 50)}`);
    }
  }

  lines.push('╠══════════════════════════════════════════════════════════════╣');
  lines.push('║ SUMMARY                                                      ║');
  lines.push('╠══════════════════════════════════════════════════════════════╣');
  lines.push(`║ Total Tests:    ${report.summary.total}`);
  lines.push(`║ Failures:       ${report.summary.failures}`);
  lines.push(`║ Avg Latency:    ${report.summary.avgLatency.toFixed(2)}ms`);
  lines.push(`║ Min Latency:    ${report.summary.minLatency.toFixed(2)}ms`);
  lines.push(`║ Max Latency:    ${report.summary.maxLatency.toFixed(2)}ms`);
  lines.push('╚══════════════════════════════════════════════════════════════╝');

  // Performance assessment
  const avg = report.summary.avgLatency;
  let assessment = '';
  if (avg < 100) {
    assessment = '🟢 Excellent - Latency is very low';
  } else if (avg < 300) {
    assessment = '🟡 Good - Latency is acceptable';
  } else if (avg < 500) {
    assessment = '🟠 Fair - Latency could be improved';
  } else {
    assessment = '🔴 Poor - High latency detected';
  }
  lines.push('');
  lines.push(`Assessment: ${assessment}`);

  // Recommendations based on results
  if (avg > 300) {
    lines.push('');
    lines.push('Recommendations:');
    lines.push('- Check your Supabase region (should be close to users)');
    lines.push('- Consider enabling connection pooling');
    lines.push('- Check for slow queries in Supabase dashboard');
    lines.push('- Review indexes on frequently queried columns');
  }

  return lines.join('\n');
}

// Make available globally for browser console
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).testDbPerformance = async () => {
    console.log('Running Supabase performance tests...');
    const report = await runPerformanceTests();
    console.log(formatReport(report));
    return report;
  };
}
