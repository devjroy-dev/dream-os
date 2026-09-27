-- scripts/lib/b136cr_0176_plant.sql · CE-46 · IGD-2 · cut 2c · A-45.8's rehearsal PLANT for 0176 (a stand-in, not production).
-- vendor_ig_connections as witnessed (b119br's plant, plus 0174's four columns), service_role holding its table privileges,
-- anon and authenticated holding nothing (0170).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE TABLE public.vendor_ig_connections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid NOT NULL UNIQUE, ig_user_id text,
  access_token text, token_expires_at timestamptz, connected_at timestamptz, last_refreshed_at timestamptz, pending_state_nonce text,
  pending_state_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  ig_username text, insights_granted_at timestamptz, messages_granted_at timestamptz, dm_state text NOT NULL DEFAULT 'off',
  dm_consented_at timestamptz, dm_subscribed_at timestamptz);
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_ig_connections TO service_role;
REVOKE ALL ON public.vendor_ig_connections FROM anon, authenticated, PUBLIC;
ALTER TABLE public.vendor_ig_connections ENABLE ROW LEVEL SECURITY;
INSERT INTO public.vendor_ig_connections (vendor_id, ig_user_id) VALUES ('23165e38-6510-4639-ab6a-9f35bab93742', '28467548409515620');
