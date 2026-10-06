-- 0196 · CE-47 · CLB-1 · COLLAB HUB v2: the call's pay and pictures, where it is posted, the admin's prospects.
-- Founder rulings (4 October 2026, via the chair): Rule 1 blind switch-on (rows below start 'pending'; only
-- clb.testers see the features until a row is on); Rule 2 no account names in any post TDW makes.
-- Additive and idempotent. Every new table enables row level security in this same transaction (0170 section 6).
BEGIN;

-- The call: pay as one plain choice, and up to four reference pictures (Cloudinary secure_url strings).
ALTER TABLE public.collab_posts ADD COLUMN IF NOT EXISTS pay_kind text
  CHECK (pay_kind IS NULL OR pay_kind IN ('paid', 'unpaid', 'credit_only'));
ALTER TABLE public.collab_posts ADD COLUMN IF NOT EXISTS reference_urls jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Where a call is posted: one row per account and platform. 'house' is TDW's own account (waits for the
-- admin's approval); 'vendor' is her own (CLB-2). Rule 2: caption never holds '@' (checked before publish).
CREATE TABLE IF NOT EXISTS public.collab_shares (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid        NOT NULL REFERENCES public.collab_posts(id) ON DELETE CASCADE,
  vendor_id    uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  account      text        NOT NULL CHECK (account IN ('house', 'vendor')),
  platform     text        NOT NULL CHECK (platform IN ('instagram', 'threads')),
  state        text        NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'approved', 'published', 'rejected', 'failed')),
  caption      text,
  hashtags     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  image_url    text,
  media_id     text,
  permalink    text,
  error        text,
  decided_by   text,
  decided_at   timestamptz,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, account, platform)
);
CREATE INDEX IF NOT EXISTS collab_shares_state_idx ON public.collab_shares (state, created_at DESC);
ALTER TABLE public.collab_shares ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_shares TO service_role;   -- after 0170 the server reads and writes only by grant

-- Replies that come back on a share (CLB-2 writes them; created now so the call's page has one shape).
CREATE TABLE IF NOT EXISTS public.collab_interest (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          uuid        NOT NULL REFERENCES public.collab_posts(id) ON DELETE CASCADE,
  share_id         uuid        REFERENCES public.collab_shares(id) ON DELETE SET NULL,
  platform         text        NOT NULL CHECK (platform IN ('instagram', 'threads')),
  how              text        NOT NULL CHECK (how IN ('comment', 'reply', 'message')),
  external_user_id text,
  display_name     text,
  body             text,
  vendor_id        uuid        REFERENCES public.vendors(id) ON DELETE SET NULL,
  join_link_sent   boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS collab_interest_post_idx ON public.collab_interest (post_id, created_at DESC);
ALTER TABLE public.collab_interest ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_interest TO service_role;   -- after 0170 the server reads and writes only by grant

-- The admin's prospects (people not on TDW). Rule 2: never read by any publish path; it decides which crafts
-- and cities TDW posts for, and the admin shares a call with them personally.
CREATE TABLE IF NOT EXISTS public.collab_prospects (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  craft            text,
  city             text,
  instagram_handle text,
  threads_handle   text,
  source           text,
  opted_out        boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.collab_prospects ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collab_prospects TO service_role;   -- after 0170 the server reads and writes only by grant

-- The switches (Rule 1). TDW readiness switches, not Meta-gated vendor features (the chair's ruling, CE-47,
-- 4 October 2026): the house accounts need no App Review, so no sweep reads these rows. Seeded 'pending' (clb.testers
-- only); the founder turns each on by hand once the house values are on Railway and one call has been walked.
INSERT INTO public.capabilities (key, kind, status) VALUES
  ('flag.collab_house_instagram', 'flag', 'pending'),
  ('flag.collab_threads',         'flag', 'pending')
ON CONFLICT (key) DO NOTHING;

COMMIT;
