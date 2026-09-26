-- scripts/lib/b119r_0173_plant.sql · CE-45 · IGD-1 · cut 2a · A-45.8's rehearsal PLANT for 0173 (a stand-in, not production).
-- Three roles as Supabase has them (service_role BYPASSRLS), the three tables with the columns 0173 touches or keys on, and the
-- privileges as witnessed: service_role holds SELECT, INSERT, UPDATE and DELETE (G6-1's census, 25 September 2026); anon and
-- authenticated hold nothing (0170's REVOKE). Run by scripts/lib/b119r_0173_rehearse.sh on a throwaway Postgres.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE public.vendors (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), name text);
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), vendor_id uuid, counterparty_user_id uuid, counterparty_phone text,
  kind text NOT NULL, state text NOT NULL DEFAULT 'new', mode text NOT NULL DEFAULT 'draft', last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), couple_id uuid, prospect_id uuid);
CREATE TABLE public.leads (id uuid PRIMARY KEY DEFAULT uuid_generate_v4(), vendor_id uuid NOT NULL, name text, phone text,
  source text DEFAULT 'whatsapp');
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors, public.conversations, public.leads TO service_role;
REVOKE ALL ON public.vendors, public.conversations, public.leads FROM anon, authenticated, PUBLIC;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY; ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
INSERT INTO public.vendors (id, name) VALUES ('11111111-1111-1111-1111-111111111111', 'plant vendor');
INSERT INTO public.conversations (vendor_id, counterparty_phone, kind) VALUES ('11111111-1111-1111-1111-111111111111', '+919625759924', 'couple_thread');
INSERT INTO public.leads (vendor_id, name, phone) VALUES ('11111111-1111-1111-1111-111111111111', 'plant lead', '+919625759924');
