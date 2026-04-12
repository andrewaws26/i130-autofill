// Centralized API logging to Supabase
// Logs every extract/generate attempt with timing, outcome, and diagnostics
// No PII — only metadata

let serviceClient: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;

function getClient() {
  if (serviceClient) return serviceClient;
  try {
    // Dynamic import to avoid issues when env vars aren't set
    const { createClient } = require('@supabase/supabase-js');
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    serviceClient = createClient(url, key);
    return serviceClient;
  } catch {
    return null;
  }
}

interface LogEntry {
  endpoint: 'extract' | 'generate';
  status: 'success' | 'error' | 'fallback';
  status_code?: number;
  duration_ms?: number;
  file_count?: number;
  file_types?: string[];
  fields_extracted?: number;
  relationship?: string;
  validation_issues?: string[];
  save_tier?: number;
  failed_fields?: string[];
  failed_field_count?: number;
  error_message?: string;
  error_type?: string;
}

export async function logApiCall(entry: LogEntry): Promise<void> {
  // Always log to console for Vercel's built-in logs
  console.log(JSON.stringify({ event: `i130_${entry.endpoint}`, ...entry, timestamp: new Date().toISOString() }));

  // Try to log to Supabase (non-blocking, never throws)
  try {
    const client = getClient();
    if (!client) return;

    // Use .from<any> to bypass generated types (table may not be in schema yet)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (client as any).from('api_logs').insert({
      endpoint: entry.endpoint,
      status: entry.status,
      status_code: entry.status_code,
      duration_ms: entry.duration_ms,
      file_count: entry.file_count,
      file_types: entry.file_types,
      fields_extracted: entry.fields_extracted,
      relationship: entry.relationship,
      validation_issues: entry.validation_issues,
      save_tier: entry.save_tier,
      failed_fields: entry.failed_fields,
      failed_field_count: entry.failed_field_count,
      error_message: entry.error_message,
      error_type: entry.error_type,
    });
  } catch {
    // Logging should never break the API
  }
}
