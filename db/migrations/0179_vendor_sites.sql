-- db/migrations/0179_vendor_sites.sql
-- TDW · CE-46 · WEB-1 cut 4 · THE VENDOR'S SITE, ONE ROW PER VENDOR, AND THE TWO PRESTIGE TABLES.
-- Base 79a3102. Number allocated by the chair.
--
-- The founder's rulings: R-46.7 (a builder, not a page), R-46.8 (premium and alive), R-46.9 (tiers by
-- capability; Basic gets one look by trade, Essential all three; 28 September).
--
-- vendor_sites        her site's choices: the look, her page order and what is shown, per-page sections
--                     and SEO bytes, the credit switch (Signature may remove it), publish state.
--                     No row = the defaults: the look from her trade, every page her tier allows, shown.
-- vendor_stories      Prestige: a written story with a cover (cut 8 edits and publishes it).
-- vendor_testimonials Signature: a couple's words she typed, only with their consent recorded.
--
-- SEC-1 (§13): RLS on every new table in this transaction, no policy (service_role bypasses).
-- A-45.8: the four privileges granted to service_role in the same file, rehearsed as service_role.
-- ROLLBACK (by hand, with a witness): DROP TABLE public.vendor_testimonials, public.vendor_stories, public.vendor_sites;

BEGIN;

CREATE TABLE public.vendor_sites (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid NOT NULL UNIQUE REFERENCES public.vendors(id) ON DELETE CASCADE,
  look            text CHECK (look IS NULL OR look IN ('quiet', 'bloom', 'atelier')),
  look_options    jsonb NOT NULL DEFAULT '{}'::jsonb,
  pages           jsonb NOT NULL DEFAULT '[]'::jsonb,
  sections        jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo             jsonb NOT NULL DEFAULT '{}'::jsonb,
  credit_shown    boolean NOT NULL DEFAULT true,
  published_at    timestamptz,
  unpublished_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_sites ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.vendor_stories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title         text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  slug          text NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  body          text NOT NULL DEFAULT '',
  cover_url     text,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  UNIQUE (vendor_id, slug)
);
ALTER TABLE public.vendor_stories ENABLE ROW LEVEL SECURITY;
CREATE INDEX vendor_stories_vendor_idx ON public.vendor_stories (vendor_id) WHERE deleted_at IS NULL;

CREATE TABLE public.vendor_testimonials (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id     uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  author        text NOT NULL CHECK (char_length(author) BETWEEN 1 AND 80),
  body          text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 600),
  wedding_when  text,
  consented_at  timestamptz NOT NULL,
  position      integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);
ALTER TABLE public.vendor_testimonials ENABLE ROW LEVEL SECURITY;
CREATE INDEX vendor_testimonials_vendor_idx ON public.vendor_testimonials (vendor_id) WHERE deleted_at IS NULL;

-- A-45.8
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_sites, public.vendor_stories, public.vendor_testimonials TO service_role;

COMMIT;
