-- scripts/lib/b200r_0191_plant.sql · CE-47 · WEB-4 cut 7 · the extra tables 0191 touches, as PUBLIC_SCHEMA.md and 0149 give
-- them (only the columns and CHECKs 0191 relies on), owned by the editor so 0191 runs as it does on Supabase. Run after b160r's.
CREATE TABLE public.leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid NOT NULL, name text, phone text,
  source text DEFAULT 'whatsapp', state text NOT NULL DEFAULT 'new', created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), deleted_at timestamptz);
CREATE TABLE public.conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), vendor_id uuid, counterparty_phone text, kind text NOT NULL);
CREATE TABLE public.capabilities (key text PRIMARY KEY, kind text NOT NULL, status text NOT NULL,
  CONSTRAINT capabilities_kind_check CHECK (kind IN ('template','permission','scope','flag')),
  CONSTRAINT capabilities_status_check CHECK (status IN ('pending','approved','rejected','paused','armed','on','off')),
  CONSTRAINT capabilities_key_grammar_check CHECK (key ~ '^(template|perm|scope|flag)\.[a-z0-9_.]+$'));
ALTER TABLE public.leads OWNER TO editor; ALTER TABLE public.conversations OWNER TO editor; ALTER TABLE public.capabilities OWNER TO editor;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads, public.conversations, public.capabilities TO service_role;
