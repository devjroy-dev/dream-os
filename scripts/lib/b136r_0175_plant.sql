-- scripts/lib/b136r_0175_plant.sql · CE-46 · IGD-2 · cut 2b · A-45.8's rehearsal PLANT for 0175 (a stand-in, not production).
-- The three Supabase roles (service_role BYPASSRLS), public.conversations with its witnessed columns (PUBLIC_SCHEMA.md :454 plus
-- 0173's two), and the privileges as witnessed: service_role holds SELECT, INSERT, UPDATE and DELETE; anon and authenticated hold
-- nothing (0170's REVOKE). Run by scripts/lib/b136r_0175_rehearse.sh on a throwaway Postgres.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), vendor_id uuid, counterparty_user_id uuid, counterparty_phone text,
  kind text NOT NULL, state text NOT NULL DEFAULT 'new', mode text NOT NULL DEFAULT 'draft', last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), couple_id uuid, prospect_id uuid,
  channel text NOT NULL DEFAULT 'whatsapp', counterparty_ig_id text);
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO service_role;
REVOKE ALL ON public.conversations FROM anon, authenticated, PUBLIC;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
INSERT INTO public.conversations (id, vendor_id, kind, channel, counterparty_ig_id)
  VALUES ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'couple_thread', 'instagram', 'IGSID_PLANT');
INSERT INTO public.conversations (vendor_id, counterparty_phone, kind)
  VALUES ('11111111-1111-1111-1111-111111111111', '+919625759924', 'couple_thread');
