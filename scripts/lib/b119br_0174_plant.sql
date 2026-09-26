-- scripts/lib/b119br_0174_plant.sql · CE-45 · IGD-1 · cut 2a-ii · A-45.8's rehearsal PLANT for 0174 (a stand-in, never production):
-- Supabase's three roles (service_role BYPASSRLS), vendor_ig_connections with its columns before 0174, and the privileges as the
-- estate holds them on tables it reads and writes: service_role SELECT, INSERT, UPDATE, DELETE; anon and authenticated nothing (0170).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE TABLE public.vendor_ig_connections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid NOT NULL, ig_user_id text,
  access_token text, token_expires_at timestamptz, connected_at timestamptz, last_refreshed_at timestamptz, pending_state_nonce text,
  pending_state_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  ig_username text, insights_granted_at timestamptz);
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_ig_connections TO service_role;
REVOKE ALL ON public.vendor_ig_connections FROM anon, authenticated, PUBLIC;
ALTER TABLE public.vendor_ig_connections ENABLE ROW LEVEL SECURITY;
INSERT INTO public.vendor_ig_connections (vendor_id, ig_user_id) VALUES ('11111111-1111-1111-1111-111111111111', 'ACC1');
