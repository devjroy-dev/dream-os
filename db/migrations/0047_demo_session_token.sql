-- 0047_demo_session_token.sql
-- Adds session token columns to vendors for demo auth bypass
-- Demo vendors get a real Supabase JWT minted at creation, valid 48hrs

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS demo_session_token      TEXT,
  ADD COLUMN IF NOT EXISTS demo_session_expires_at TIMESTAMPTZ;

-- Index for token lookup (public endpoint validates token not expired)
CREATE INDEX IF NOT EXISTS vendors_demo_session_token_idx
  ON vendors (demo_session_token)
  WHERE demo_session_token IS NOT NULL;
