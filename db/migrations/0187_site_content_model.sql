-- db/migrations/0187_site_content_model.sql
-- TDW · CE-46 · WEB-4 cut 2 · THE SITE CONTENT MODEL: her six-style site, her looks, collections, questions,
-- testimonials by request, and anonymous visitor counts. Number derived at origin at the cut, skipping 0185 (the
-- redesign's landing) and 0186 (G6-6), both reserved by the chair on 30 September 2026.
--
-- The rulings: the WEB-4 brief (CE-46, 30 September 2026) and the chair's rulings on its read-first (Q6 to Q14).
--
-- ALTERS two tables of 0179 and drops nothing of them (0179's look, pages and sections stay for WEB-1's live door):
--   vendor_sites         + style, styles_picked, palette_id, palette_custom, palette_resolved, font_pair, motion,
--                          corners, texture, button_style, cover_mode, cover, monogram, site_name, copy
--   vendor_testimonials  words now arrive only from the client's own page (ruling 2: she never edits them):
--                          + request_id, occasion, event_month, place, state, approved_at, hidden_at, submitted_at,
--                          video_url, video_duration_s, video_title; body may be null when a video carries the words
-- CREATES (RLS on every one in this transaction, no policy; service_role bypasses; SEC-1 §13):
--   vendor_site_pages, vendor_site_sections, vendor_looks, vendor_look_photos, vendor_collections,
--   vendor_collection_looks, vendor_site_faq, vendor_testimonial_requests, site_visits_daily, look_hearts_daily,
--   site_visit_salt, site_visit_seen
-- A-45.8: the four privileges granted to service_role on every created table, in this file.
-- Limits: each CHECK mirrors src/lib/site/limits.js (the renderer fits words beside pictures only if no field is
-- unbounded). No IP address, cookie or raw token is stored anywhere in this file's tables.
-- Witnesses: public.vendors, public.vendor_packages, public.clients (docs/db/PUBLIC_SCHEMA.md);
--            public.vendor_sites, public.vendor_testimonials (db/migrations/0179_vendor_sites.sql).
--
-- REVERT (by hand, with a witness; never run as part of this file):
--   DROP TABLE public.site_visit_seen, public.site_visit_salt, public.look_hearts_daily, public.site_visits_daily,
--     public.vendor_collection_looks, public.vendor_collections, public.vendor_site_faq, public.vendor_site_sections,
--     public.vendor_site_pages;
--   ALTER TABLE public.vendor_testimonials DROP COLUMN request_id;  DROP TABLE public.vendor_testimonial_requests;
--   ALTER TABLE public.vendor_looks DROP CONSTRAINT vendor_looks_share_photo_fk;
--   DROP TABLE public.vendor_look_photos, public.vendor_looks;
--   (then the added columns of vendor_sites and vendor_testimonials, and restore vendor_testimonials.body NOT NULL)

BEGIN;

-- ── 1 · vendor_sites: her choices ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.vendor_sites
  ADD COLUMN style            text CHECK (style IS NULL OR style IN ('couture', 'noir', 'heritage', 'aurora', 'gallery', 'riviera')),
  ADD COLUMN styles_picked    text[] NOT NULL DEFAULT '{}'
                              CHECK (styles_picked <@ ARRAY['couture', 'noir', 'heritage', 'aurora', 'gallery', 'riviera']::text[]
                                     AND cardinality(styles_picked) <= 6),
  ADD COLUMN palette_id       text CHECK (palette_id IS NULL OR palette_id ~ '^[a-z]{1,16}\.[a-z]{1,16}$'),
  ADD COLUMN palette_custom   jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(palette_custom) = 'object' AND pg_column_size(palette_custom) <= 2048),
  ADD COLUMN palette_resolved jsonb,
  ADD COLUMN font_pair        text CHECK (font_pair IS NULL OR font_pair IN ('bodoni_inter_tight', 'cormorant_manrope', 'italiana_jost',
                                'marcellus_mulish', 'fraunces_jakarta', 'instrument_serif_sans', 'gilda_figtree', 'cormorant_figtree')),
  ADD COLUMN motion           text CHECK (motion IS NULL OR motion IN ('calm', 'lively', 'cinematic')),
  ADD COLUMN corners          text CHECK (corners IS NULL OR corners ~ '^[a-z_]{1,24}$'),
  ADD COLUMN texture          text CHECK (texture IS NULL OR texture ~ '^[a-z_]{1,24}$'),
  ADD COLUMN button_style     text CHECK (button_style IS NULL OR button_style ~ '^[a-z_]{1,24}$'),
  ADD COLUMN cover_mode       text CHECK (cover_mode IS NULL OR cover_mode IN ('slideshow', 'still', 'film')),
  ADD COLUMN cover            jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(cover) = 'array' AND jsonb_array_length(cover) <= 3),
  ADD COLUMN monogram         text CHECK (monogram IS NULL OR char_length(monogram) BETWEEN 1 AND 3),
  ADD COLUMN site_name        text CHECK (site_name IS NULL OR char_length(site_name) BETWEEN 1 AND 40),
  ADD COLUMN copy             jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(copy) = 'object' AND pg_column_size(copy) <= 32768);

-- ── 2 · custom pages (Prestige) and sections ───────────────────────────────────────────────────────────────────
CREATE TABLE public.vendor_site_pages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  slug        text NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  title       text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 40),
  position    integer NOT NULL DEFAULT 0,
  shown       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
ALTER TABLE public.vendor_site_pages ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX vendor_site_pages_slug_uidx ON public.vendor_site_pages (vendor_id, slug) WHERE deleted_at IS NULL;

CREATE TABLE public.vendor_site_sections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  page_id     uuid REFERENCES public.vendor_site_pages(id) ON DELETE CASCADE,
  key         text NOT NULL CHECK (key ~ '^(cover|looks|collections|band|reviews|pricing|studio|journal|faq|enquire|custom-[a-z0-9-]{1,40})$'),
  variant     text NOT NULL DEFAULT 'default' CHECK (variant ~ '^[a-z0-9-]{1,24}$'),
  shown       boolean NOT NULL DEFAULT true,
  position    integer NOT NULL DEFAULT 0,
  eyebrow     text CHECK (eyebrow IS NULL OR char_length(eyebrow) BETWEEN 1 AND 32),
  heading     text CHECK (heading IS NULL OR char_length(heading) BETWEEN 1 AND 60),
  body        jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(body) = 'object' AND pg_column_size(body) <= 16384),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
ALTER TABLE public.vendor_site_sections ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX vendor_site_sections_home_key_uidx ON public.vendor_site_sections (vendor_id, key) WHERE page_id IS NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX vendor_site_sections_page_key_uidx ON public.vendor_site_sections (page_id, key) WHERE page_id IS NOT NULL AND deleted_at IS NULL;

-- ── 3 · looks and their photographs ────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.vendor_looks (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  title             text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 60),
  slug              text NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at      timestamptz,
  category          text CHECK (category IS NULL OR char_length(category) BETWEEN 1 AND 24),
  year_label        text CHECK (year_label IS NULL OR char_length(year_label) BETWEEN 1 AND 12),
  description       text CHECK (description IS NULL OR char_length(description) <= 600),
  included          jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(included) = 'array' AND jsonb_array_length(included) <= 12),
  from_price_text   text CHECK (from_price_text IS NULL OR char_length(from_price_text) BETWEEN 1 AND 32),
  from_price_rupees integer CHECK (from_price_rupees IS NULL OR from_price_rupees > 0),
  package_id        uuid REFERENCES public.vendor_packages(id) ON DELETE SET NULL,
  credits           jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(credits) = 'array' AND jsonb_array_length(credits) <= 8),
  videos            jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(videos) = 'array' AND jsonb_array_length(videos) <= 4),
  related_ids       uuid[] NOT NULL DEFAULT '{}' CHECK (cardinality(related_ids) <= 4),
  new_mark          boolean NOT NULL DEFAULT true,
  seo_title         text CHECK (seo_title IS NULL OR char_length(seo_title) BETWEEN 1 AND 70),
  seo_description   text CHECK (seo_description IS NULL OR char_length(seo_description) BETWEEN 1 AND 160),
  share_photo_id    uuid,
  source            text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'phone', 'instagram')),
  ig_media_id       text CHECK (ig_media_id IS NULL OR char_length(ig_media_id) BETWEEN 1 AND 64),
  position          integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  CHECK (status = 'draft' OR published_at IS NOT NULL)
);
ALTER TABLE public.vendor_looks ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX vendor_looks_slug_uidx ON public.vendor_looks (vendor_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX vendor_looks_published_idx ON public.vendor_looks (vendor_id, position) WHERE status = 'published' AND deleted_at IS NULL;

CREATE TABLE public.vendor_look_photos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  look_id           uuid NOT NULL REFERENCES public.vendor_looks(id) ON DELETE CASCADE,
  vendor_id         uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  image_url         text NOT NULL CHECK (image_url ~ '^https://'),
  width             integer CHECK (width IS NULL OR width > 0),
  height            integer CHECK (height IS NULL OR height > 0),
  focal_portrait_x  numeric(5,2) NOT NULL DEFAULT 50 CHECK (focal_portrait_x BETWEEN 0 AND 100),
  focal_portrait_y  numeric(5,2) NOT NULL DEFAULT 50 CHECK (focal_portrait_y BETWEEN 0 AND 100),
  focal_landscape_x numeric(5,2) NOT NULL DEFAULT 50 CHECK (focal_landscape_x BETWEEN 0 AND 100),
  focal_landscape_y numeric(5,2) NOT NULL DEFAULT 50 CHECK (focal_landscape_y BETWEEN 0 AND 100),
  caption           text CHECK (caption IS NULL OR char_length(caption) BETWEEN 1 AND 60),
  alt               text CHECK (alt IS NULL OR char_length(alt) BETWEEN 1 AND 125),
  position          integer NOT NULL DEFAULT 0,
  approval_state    text NOT NULL DEFAULT 'pending' CHECK (approval_state IN ('pending', 'approved', 'rejected')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
ALTER TABLE public.vendor_look_photos ENABLE ROW LEVEL SECURITY;
CREATE INDEX vendor_look_photos_look_idx ON public.vendor_look_photos (look_id, position) WHERE deleted_at IS NULL;
ALTER TABLE public.vendor_looks ADD CONSTRAINT vendor_looks_share_photo_fk
  FOREIGN KEY (share_photo_id) REFERENCES public.vendor_look_photos(id) ON DELETE SET NULL;

-- ── 4 · collections (Signature and up) ─────────────────────────────────────────────────────────────────────────
CREATE TABLE public.vendor_collections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name            text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 40),
  slug            text NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  description     text CHECK (description IS NULL OR char_length(description) <= 200),
  cover_photo_id  uuid REFERENCES public.vendor_look_photos(id) ON DELETE SET NULL,
  position        integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
ALTER TABLE public.vendor_collections ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX vendor_collections_slug_uidx ON public.vendor_collections (vendor_id, slug) WHERE deleted_at IS NULL;

CREATE TABLE public.vendor_collection_looks (
  collection_id  uuid NOT NULL REFERENCES public.vendor_collections(id) ON DELETE CASCADE,
  look_id        uuid NOT NULL REFERENCES public.vendor_looks(id) ON DELETE CASCADE,
  position       integer NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, look_id)
);
ALTER TABLE public.vendor_collection_looks ENABLE ROW LEVEL SECURITY;

-- ── 5 · questions ──────────────────────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.vendor_site_faq (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  question    text NOT NULL CHECK (char_length(question) BETWEEN 1 AND 120),
  answer      text NOT NULL CHECK (char_length(answer) BETWEEN 1 AND 600),
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);
ALTER TABLE public.vendor_site_faq ENABLE ROW LEVEL SECURITY;
CREATE INDEX vendor_site_faq_vendor_idx ON public.vendor_site_faq (vendor_id, position) WHERE deleted_at IS NULL;

-- ── 6 · testimonials by request (ruling 2; Q12: 30 days, single use, the phone nulled at use or expiry) ──────
-- No wamid column yet: b51's law is that every table holding a wamid is reachable by the receipt router with the
-- wamid UNIQUE; the send (cut 4, behind "Coming soon" until Meta approves the template) adds both together.
CREATE TABLE public.vendor_testimonial_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id    uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  client_id    uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  person_name  text NOT NULL CHECK (char_length(person_name) BETWEEN 1 AND 80),
  phone        text CHECK (phone IS NULL OR phone ~ '^\+[0-9]{8,15}$'),
  token_hash   text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  origin       text NOT NULL CHECK (origin IN ('vendor', 'after_delivery')),
  sent_via     text CHECK (sent_via IS NULL OR sent_via IN ('whatsapp_template', 'copied')),
  sent_at      timestamptz,
  expires_at   timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  used_at      timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (used_at IS NULL OR phone IS NULL)
);
ALTER TABLE public.vendor_testimonial_requests ENABLE ROW LEVEL SECURITY;
CREATE INDEX vendor_testimonial_requests_vendor_idx ON public.vendor_testimonial_requests (vendor_id, created_at DESC);
CREATE INDEX vendor_testimonial_requests_phone_sweep_idx ON public.vendor_testimonial_requests (expires_at) WHERE phone IS NOT NULL;

ALTER TABLE public.vendor_testimonials
  ADD COLUMN request_id       uuid REFERENCES public.vendor_testimonial_requests(id) ON DELETE SET NULL,
  ADD COLUMN occasion         text CHECK (occasion IS NULL OR char_length(occasion) BETWEEN 1 AND 40),
  ADD COLUMN event_month      date CHECK (event_month IS NULL OR extract(day FROM event_month) = 1),
  ADD COLUMN place            text CHECK (place IS NULL OR char_length(place) BETWEEN 1 AND 40),
  ADD COLUMN state            text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'approved', 'hidden')),
  ADD COLUMN approved_at      timestamptz,
  ADD COLUMN hidden_at        timestamptz,
  ADD COLUMN submitted_at     timestamptz,
  ADD COLUMN video_url        text CHECK (video_url IS NULL OR video_url ~ '^https://'),
  ADD COLUMN video_duration_s integer CHECK (video_duration_s IS NULL OR video_duration_s BETWEEN 1 AND 600),
  ADD COLUMN video_title      text CHECK (video_title IS NULL OR char_length(video_title) BETWEEN 1 AND 60);
ALTER TABLE public.vendor_testimonials ALTER COLUMN body DROP NOT NULL;
ALTER TABLE public.vendor_testimonials ADD CONSTRAINT vendor_testimonials_words_or_video
  CHECK (body IS NOT NULL OR video_url IS NOT NULL);
ALTER TABLE public.vendor_testimonials ADD CONSTRAINT vendor_testimonials_approved_has_time
  CHECK (state <> 'approved' OR approved_at IS NOT NULL);

-- ── 7 · visitors (nobody identified: daily totals, a salted digest rotated and discarded daily) ───────────────
CREATE TABLE public.site_visits_daily (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id  uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  day        date NOT NULL,
  page       text NOT NULL CHECK (page IN ('home', 'look', 'collection', 'journal', 'page')),
  look_id    uuid REFERENCES public.vendor_looks(id) ON DELETE CASCADE,
  source     text NOT NULL CHECK (source IN ('google', 'instagram', 'facebook', 'whatsapp', 'direct', 'other')),
  views      integer NOT NULL DEFAULT 0 CHECK (views >= 0),
  uniques    integer NOT NULL DEFAULT 0 CHECK (uniques >= 0),
  CHECK ((page = 'look') = (look_id IS NOT NULL))
);
ALTER TABLE public.site_visits_daily ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX site_visits_daily_uidx ON public.site_visits_daily
  (vendor_id, day, page, COALESCE(look_id, '00000000-0000-0000-0000-000000000000'::uuid), source);

CREATE TABLE public.look_hearts_daily (
  vendor_id  uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  look_id    uuid NOT NULL REFERENCES public.vendor_looks(id) ON DELETE CASCADE,
  day        date NOT NULL,
  hearts     integer NOT NULL DEFAULT 0 CHECK (hearts >= 0),
  PRIMARY KEY (look_id, day)
);
ALTER TABLE public.look_hearts_daily ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_visit_salt (
  day   date PRIMARY KEY,
  salt  bytea NOT NULL CHECK (octet_length(salt) = 32)
);
ALTER TABLE public.site_visit_salt ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_visit_seen (
  day     date NOT NULL,
  digest  bytea NOT NULL CHECK (octet_length(digest) = 32),
  PRIMARY KEY (day, digest)
);
ALTER TABLE public.site_visit_seen ENABLE ROW LEVEL SECURITY;

-- ── A-45.8 ─────────────────────────────────────────────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.vendor_site_pages, public.vendor_site_sections, public.vendor_looks, public.vendor_look_photos,
  public.vendor_collections, public.vendor_collection_looks, public.vendor_site_faq, public.vendor_testimonial_requests,
  public.site_visits_daily, public.look_hearts_daily, public.site_visit_salt, public.site_visit_seen
TO service_role;

COMMIT;
