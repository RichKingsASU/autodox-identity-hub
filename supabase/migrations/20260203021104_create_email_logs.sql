CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT,
  subject TEXT,
  resend_id TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
