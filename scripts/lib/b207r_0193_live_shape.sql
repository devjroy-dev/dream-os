-- scripts/lib/b207r_0193_live_shape.sql · CE-47 WEB-4 cut 12 (b207): the LIVE shape of the nine tables, built from the founder's
-- read-only reads of 3 October 2026 (information_schema.columns: the eight tables' columns, types, nullability, defaults,
-- in live order). The referenced tables are stand-ins (id only). The 22 links are in b207r_0193_live_links.sql, so the
-- rehearsal can build the live database (shape + links) and the files' database (shape without them, 0044 and 0002 put back).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE public.vendors (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.clients (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.events (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.invoices (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.lead_packages (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.vendor_roster (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  name text NOT NULL,
  role text,
  phone text,
  daily_rate_inr integer,
  notes text,
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  page_token uuid NOT NULL DEFAULT uuid_generate_v4(),
  roster_vendor_id uuid
);
CREATE TABLE public.team_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  assigned_to_member_id uuid,
  linked_event_id uuid,
  title text NOT NULL,
  description text,
  due_date date,
  priority text NOT NULL DEFAULT 'normal'::text,
  state text NOT NULL DEFAULT 'open'::text,
  completed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  client_id uuid,
  lead_id uuid,
  invoice_id uuid,
  title text NOT NULL,
  storage_path text,
  file_size integer,
  mime_type text DEFAULT 'application/pdf'::text,
  notes text,
  state text NOT NULL DEFAULT 'draft'::text,
  sent_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  event_id uuid,
  terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  annexes jsonb NOT NULL DEFAULT '{}'::jsonb,
  deposit_pct numeric,
  deposit_received_at timestamptz,
  number text,
  lead_package_id uuid
);
CREATE TABLE public.payment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  milestone_label text NOT NULL,
  pct numeric NOT NULL,
  amount_due integer NOT NULL,
  due_date date,
  state text NOT NULL DEFAULT 'pending'::text,
  paid_at timestamptz,
  paid_amount integer,
  ordinal integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tds_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  invoice_id uuid,
  client_id uuid,
  client_name text NOT NULL,
  client_pan text,
  client_tan text,
  gross_amount integer NOT NULL,
  tds_rate numeric NOT NULL,
  tds_amount integer NOT NULL,
  net_received integer NOT NULL,
  section text,
  deduction_date date NOT NULL,
  financial_year text NOT NULL,
  certificate_no text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.team_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  sent_to_count integer,
  linked_event_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.team_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  team_member_id uuid NOT NULL,
  linked_event_id uuid,
  linked_task_id uuid,
  description text,
  amount_inr integer NOT NULL,
  state text NOT NULL DEFAULT 'owed'::text,
  paid_at timestamptz,
  paid_via text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.discover_heroes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_url text NOT NULL,
  cloudinary_public_id text,
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
