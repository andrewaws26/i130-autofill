-- API activity logs for extract and generate endpoints
-- Captures every attempt with outcome, timing, and diagnostics
-- No PII stored — only metadata for analysis

CREATE TABLE IF NOT EXISTS api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- What happened
  endpoint TEXT NOT NULL,              -- 'extract' or 'generate'
  status TEXT NOT NULL,                -- 'success', 'error', 'fallback'
  status_code INTEGER,                 -- HTTP status returned
  duration_ms INTEGER,                 -- How long the request took

  -- Extract-specific
  file_count INTEGER,                  -- Number of files uploaded
  file_types TEXT[],                   -- MIME types of uploaded files
  fields_extracted INTEGER,            -- How many fields had values
  relationship TEXT,                   -- 'Spouse', 'Parent', etc.
  validation_issues TEXT[],            -- Date/SSN/state format warnings

  -- Generate-specific
  save_tier INTEGER,                   -- Which save attempt succeeded (1-4)
  failed_fields TEXT[],                -- Fields that couldn't be filled
  failed_field_count INTEGER,          -- Count of failed fields

  -- Error info
  error_message TEXT,                  -- Error message (no PII)
  error_type TEXT                      -- 'timeout', 'auth', 'overloaded', 'pdf_save', 'unknown'
);

-- Index for querying by endpoint and time
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs (endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_logs (status, created_at DESC);

-- RLS: only service role can insert (API routes use service client)
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything on api_logs"
  ON api_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read logs (for a future admin dashboard)
CREATE POLICY "Authenticated users can read api_logs"
  ON api_logs
  FOR SELECT
  TO authenticated
  USING (true);
