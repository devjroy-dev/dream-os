-- 0197 · CE-47 · CLB-2a · THE COLLAB ROLE LIST, PARTNER ROWS ON A CALL, AND CALLS SENT BY TDW.
-- Rulings (CE-47, 6 October 2026): a call's roles are the collab role list, apart from vendor categories: the eleven
-- (src/agent/categories.js) plus model, stylist and studio, one home at src/lib/collab/roles.js. PTN's partners put
-- people forward on a call (collab_interest, source 'partner'). The admin's "Forward a request" makes a call for her
-- (collab_posts.source 'tdw_forward'). Additive, one transaction. One new table, with its grant (e-273).
BEGIN;

-- ── 1. The collab role list on both role columns (0123 holds the vendor eleven; vendor sign-up is untouched). ──
ALTER TABLE public.collab_posts DROP CONSTRAINT IF EXISTS collab_posts_requirement_type_check;
ALTER TABLE public.collab_posts ADD CONSTRAINT collab_posts_requirement_type_check
  CHECK (requirement_type IN ('planning', 'designer', 'photography', 'makeup', 'hairstylist', 'jewellery', 'decor',
    'venue_catering', 'performer', 'content_creator', 'other', 'model', 'stylist', 'studio'));
ALTER TABLE public.collab_post_items DROP CONSTRAINT IF EXISTS collab_post_items_requirement_type_check;
ALTER TABLE public.collab_post_items ADD CONSTRAINT collab_post_items_requirement_type_check
  CHECK (requirement_type IN ('planning', 'designer', 'photography', 'makeup', 'hairstylist', 'jewellery', 'decor',
    'venue_catering', 'performer', 'content_creator', 'other', 'model', 'stylist', 'studio'));

-- ── 2. How many people a role needs ("2 models"). ──
ALTER TABLE public.collab_post_items ADD COLUMN IF NOT EXISTS needed int NOT NULL DEFAULT 1
  CHECK (needed BETWEEN 1 AND 20);

-- ── 3. A call TDW sends for her, at her request. ──
ALTER TABLE public.collab_posts ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'vendor'
  CHECK (source IN ('vendor', 'tdw_forward'));
ALTER TABLE public.collab_posts ADD COLUMN IF NOT EXISTS asked_at timestamptz;
ALTER TABLE public.collab_posts ADD COLUMN IF NOT EXISTS budget_from integer CHECK (budget_from IS NULL OR budget_from >= 0);
ALTER TABLE public.collab_posts ADD COLUMN IF NOT EXISTS budget_to integer CHECK (budget_to IS NULL OR budget_to >= 0);

-- ── 4. People a partner puts forward land on the call's Interested list. partner_id carries no foreign key here:
-- PTN's partner_orgs arrives in PTN's own migration, which may add it. Partner rows never hold a phone or email. ──
ALTER TABLE public.collab_interest ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'instagram'
  CHECK (source IN ('instagram', 'threads', 'partner'));
UPDATE public.collab_interest SET source = platform WHERE source <> platform AND platform IS NOT NULL;
ALTER TABLE public.collab_interest ADD COLUMN IF NOT EXISTS partner_id uuid;
ALTER TABLE public.collab_interest ADD COLUMN IF NOT EXISTS send_id uuid;
ALTER TABLE public.collab_interest ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.collab_interest ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE public.collab_interest ADD COLUMN IF NOT EXISTS agreed_at timestamptz;
ALTER TABLE public.collab_interest ALTER COLUMN platform DROP NOT NULL;
ALTER TABLE public.collab_interest ALTER COLUMN how DROP NOT NULL;
ALTER TABLE public.collab_interest DROP CONSTRAINT IF EXISTS collab_interest_partner_shape;
ALTER TABLE public.collab_interest ADD CONSTRAINT collab_interest_partner_shape CHECK (
  (source = 'partner' AND partner_id IS NOT NULL AND send_id IS NOT NULL AND display_name IS NOT NULL AND join_link_sent = false)
  OR (source <> 'partner' AND platform IS NOT NULL AND how IS NOT NULL));
CREATE UNIQUE INDEX IF NOT EXISTS collab_interest_partner_once
  ON public.collab_interest (send_id, lower(display_name)) WHERE source = 'partner';

-- ── 5. The house account's refreshed tokens (TDW's own Instagram and Threads). A row here is used before the
-- Railway value; only src/lib/collab/publish.js reads or writes it (never a door, never the admin config list). ──
CREATE TABLE IF NOT EXISTS public.collab_house_tokens (
  platform     text        PRIMARY KEY CHECK (platform IN ('instagram', 'threads')),
  token        text        NOT NULL,
  refreshed_at timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz
);
ALTER TABLE public.collab_house_tokens ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_house_tokens TO service_role;   -- after 0170 the server reads and writes only by grant

COMMIT;
