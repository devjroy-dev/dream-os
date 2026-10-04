-- scripts/lib/b207r_0193_files_extras.sql · CE-47 WEB-4 cut 12 (b207): what the FILES declare that live lacks, put back on a
-- copy of the live shape: discover_heroes as 0044 declares it (vendor_id with its cascade, id defaulting to
-- gen_random_uuid(), no cloudinary_public_id, no updated_at) and pending_actions as 0002 declares it.
ALTER TABLE public.discover_heroes DROP COLUMN cloudinary_public_id, DROP COLUMN updated_at;
ALTER TABLE public.discover_heroes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.discover_heroes ADD COLUMN vendor_id uuid REFERENCES public.vendors(id) ON DELETE CASCADE;
CREATE TABLE public.pending_actions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  action_type text NOT NULL, payload jsonb NOT NULL, state text NOT NULL DEFAULT 'pending', summary text,
  expires_at timestamptz, resolved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
