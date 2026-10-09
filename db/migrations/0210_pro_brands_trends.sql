-- db/migrations/0210_pro_brands_trends.sql · CE-47 · PRO · P3 · BRAND COLLABORATIONS AND THE TREND ROOM.
-- 0210 is PRO's (PRO 0208-0211). It lands below the applied ladder tip, so WEB-4 writes its OUT_OF_ORDER record.
--
-- pro_brands: the brand list TDW's admin keeps (admin More > Brands). Every row leads with the brand's Instagram handle
--   as the brand's OWN website shows it (source_url is that page). An email is kept only if it is a role address
--   (pr@, collab@, marketing@ ...) shown on the brand's own page, never a person's (the chair's rule, 6 October 2026).
--   A vendor sees a brand only while its state is 'listed'.
-- pro_pitches: one row for each pitch a vendor says she sent. TDW never sends a pitch itself; she sends it from her own
--   Instagram, email or the brand's form. pro_pitch_record() is the ONLY way a row is added: it takes the vendor's lock
--   and refuses a pitch over the limits (3 in an India day, 10 in an India week from Monday, one brand once in 30 days).
-- pro_kits: her media kit's settings (the email she wants brands to write to) and the last Instagram follower count
--   TDW read, with the date it was read.
-- pro_trend_briefs: one weekly brief for a trade in a city, made from enquiries across TDW (counts only; no client or
--   vendor is named). A brief is made only when the week has at least 10 enquiries from at least 3 vendors; an admin
--   approves it, and vendors see it from Monday 9:00 am India time.
--
-- Every name in the function is schema-qualified and it sets no search_path (b91 §2.1 must be able to judge the file);
-- it runs as its caller (SECURITY INVOKER), and only service_role may call it.
-- Service role only after 0170's lock-down: RLS on, the four grants b128 2.1 requires (e-273), and EXECUTE on the one
-- function to service_role alone.
-- REVERT (commented, for the founder):
--   DROP FUNCTION IF EXISTS public.pro_pitch_record(uuid, uuid, text, date, timestamptz, timestamptz, timestamptz);
--   DROP TABLE IF EXISTS public.pro_trend_briefs; DROP TABLE IF EXISTS public.pro_kits;
--   DROP TABLE IF EXISTS public.pro_pitches; DROP TABLE IF EXISTS public.pro_brands;
BEGIN;

CREATE TABLE IF NOT EXISTS public.pro_brands (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 80),
  trades            text[]      NOT NULL CHECK (cardinality(trades) BETWEEN 1 AND 7 AND trades <@ ARRAY['makeup', 'photography', 'designer', 'jewellery', 'decor', 'venue_catering', 'other']::text[]),
  looks_for         text        CHECK (looks_for IS NULL OR char_length(looks_for) <= 300),
  website_url       text        NOT NULL CHECK (website_url ~ '^https://[^\s/]+'),
  instagram_handle  text        NOT NULL CHECK (instagram_handle ~ '^[a-z0-9._]{1,30}$'),
  role_email        text        CHECK (role_email IS NULL OR role_email ~ '^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
  form_url          text        CHECK (form_url IS NULL OR form_url ~ '^https://[^\s/]+'),
  source_url        text        NOT NULL CHECK (source_url ~ '^https://[^\s/]+'),
  followers_min     integer     CHECK (followers_min IS NULL OR followers_min >= 0),
  followers_max     integer     CHECK (followers_max IS NULL OR followers_max >= 0),
  checked_on        date        NOT NULL,
  state             text        NOT NULL DEFAULT 'listed' CHECK (state IN ('listed', 'hidden')),
  created_by        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (followers_min IS NULL OR followers_max IS NULL OR followers_max >= followers_min)
);
CREATE UNIQUE INDEX IF NOT EXISTS pro_brands_handle_uq ON public.pro_brands (instagram_handle);
CREATE INDEX IF NOT EXISTS pro_brands_state_idx ON public.pro_brands (state, name);

CREATE TABLE IF NOT EXISTS public.pro_pitches (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   uuid        NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  brand_id    uuid        NOT NULL REFERENCES public.pro_brands(id) ON DELETE CASCADE,
  channel     text        NOT NULL CHECK (channel IN ('instagram', 'email', 'form')),
  state       text        NOT NULL DEFAULT 'pitched' CHECK (state IN ('pitched', 'replied', 'agreed', 'kit_received', 'posted', 'declined', 'no_reply')),
  post_due    date,
  note        text        CHECK (note IS NULL OR char_length(note) <= 300),
  pitched_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pro_pitches_vendor_idx ON public.pro_pitches (vendor_id, pitched_at DESC);
CREATE INDEX IF NOT EXISTS pro_pitches_brand_idx ON public.pro_pitches (vendor_id, brand_id, pitched_at DESC);

CREATE TABLE IF NOT EXISTS public.pro_kits (
  vendor_id      uuid        PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  contact_email  text        CHECK (contact_email IS NULL OR contact_email ~ '^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  followers      integer     CHECK (followers IS NULL OR followers >= 0),
  followers_on   date,
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pro_trend_briefs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trade        text        NOT NULL CHECK (trade IN ('makeup', 'photography', 'designer', 'jewellery', 'decor', 'venue_catering', 'other')),
  city         text        NOT NULL CHECK (char_length(btrim(city)) BETWEEN 2 AND 60),
  week_start   date        NOT NULL CHECK (extract(isodow FROM week_start) = 1),
  counts       jsonb       NOT NULL,
  news         jsonb       NOT NULL DEFAULT '[]'::jsonb,
  state        text        NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'approved', 'withheld')),
  decided_by   text,
  decided_at   timestamptz,
  made_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trade, city, week_start)
);
CREATE INDEX IF NOT EXISTS pro_trend_briefs_read_idx ON public.pro_trend_briefs (trade, city, state, week_start DESC);

ALTER TABLE public.pro_brands       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_pitches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_kits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pro_trend_briefs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_brands       TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_pitches      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_kits         TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pro_trend_briefs TO service_role;

-- p_day_start, p_week_start, p_month_ago: the start of her India day, of her India week (Monday) and the moment 30 days
-- ago, computed by the caller (src/lib/brands/rules.js windows()), so the limits have one home and the bench reads it.
CREATE OR REPLACE FUNCTION public.pro_pitch_record(p_vendor uuid, p_brand uuid, p_channel text, p_post_due date,
  p_day_start timestamptz, p_week_start timestamptz, p_month_ago timestamptz)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE n_day integer; n_week integer;
BEGIN
  -- one pitch at a time per vendor: her vendor row is the lock
  PERFORM 1 FROM public.vendors WHERE id = p_vendor FOR UPDATE;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pro_brands WHERE id = p_brand AND state = 'listed') THEN RETURN 'not_listed'; END IF;
  IF EXISTS (SELECT 1 FROM public.pro_pitches WHERE vendor_id = p_vendor AND brand_id = p_brand AND pitched_at > p_month_ago) THEN RETURN 'brand_30'; END IF;
  SELECT count(*) INTO n_day FROM public.pro_pitches WHERE vendor_id = p_vendor AND pitched_at >= p_day_start;
  IF n_day >= 3 THEN RETURN 'day_3'; END IF;
  SELECT count(*) INTO n_week FROM public.pro_pitches WHERE vendor_id = p_vendor AND pitched_at >= p_week_start;
  IF n_week >= 10 THEN RETURN 'week_10'; END IF;
  INSERT INTO public.pro_pitches (vendor_id, brand_id, channel, post_due) VALUES (p_vendor, p_brand, p_channel, p_post_due);
  RETURN 'recorded';
END;
$$;
REVOKE ALL ON FUNCTION public.pro_pitch_record(uuid, uuid, text, date, timestamptz, timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pro_pitch_record(uuid, uuid, text, date, timestamptz, timestamptz, timestamptz) TO service_role;

COMMIT;
