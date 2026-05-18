-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0030: landing_assets
--
-- CONTEXT
-- Phase 2, Session P2-5. Landing page session.
--
-- This migration creates two structurally-identical tables that back the
-- two image surfaces of the public landing page (thedreamwedding.in):
--
--   landing_slides     — full-bleed background slideshow that plays across
--                        the landing page AND through every screen of the
--                        auth flow (sign in, OTP, PIN setup, invite path)
--                        until the user lands on their home page. Slides
--                        rotate every ~4.5s. One slide per screen state
--                        (slide advances when the user advances).
--
--   exploring_photos   — swipe-tap gallery shown when an anonymous landing
--                        page visitor taps the "Just Exploring" entry. Pure
--                        editorial mood photography (brides, mandaps,
--                        florals, jewellery). No vendor profile data —
--                        Discover preview is a different feature for
--                        post-login surfaces (Phase 2 Block 5).
--
-- Both tables follow the same dual-source pattern:
--   1. Paste any Cloudinary URL  → cloudinary_public_id stays NULL
--   2. Upload from computer      → admin panel pushes to Cloudinary cloud
--                                  'dccso5ljv', persists image_url +
--                                  cloudinary_public_id together
--
-- Admin UI for managing rows ships in the post-Phase 2 admin session.
-- Until then, Swati or Dev maintains rows via Supabase SQL Editor.
--
-- Design decisions:
--
--   PARALLEL SHAPE
--   Both tables have identical columns. They could have been collapsed into
--   one table with a 'surface' discriminator column, but they serve
--   semantically distinct purposes with potentially divergent future needs
--   (e.g. exploring_photos may grow ordering by aesthetic_tag, captions
--   may matter only for one surface, etc.). Two tables keeps each surface
--   evolvable without migration coordination.
--
--   image_url IS THE SINGLE SOURCE OF TRUTH
--   The frontend reads image_url and renders it. It doesn't care whether
--   the URL was pasted or uploaded. cloudinary_public_id exists only so
--   the post-Phase 2 admin panel can offer a "delete from Cloudinary too"
--   option when removing a row, rather than orphaning assets.
--
--   active boolean
--   Allows toggle without delete. Useful for seasonal swaps where the
--   image might be re-activated later.
--
--   display_order int
--   Frontend orders ASC. Negative values allowed for "always first".
--
--   IDEMPOTENT SEED
--   The seed inserts at the bottom of this file are guarded by a NOT EXISTS
--   subquery on (image_url) per table. Re-running the migration on a fresh
--   environment will not duplicate rows. Re-running on an already-seeded
--   environment is a no-op.
--
--   Three Cloudinary URLs are seeded into both tables at P2-5. Same images
--   appear in landing slideshow AND Just Exploring gallery for launch.
--   Swati expands either set independently via SQL Editor or, post-admin
--   session, via the admin UI.
--
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. landing_slides ───────────────────────────────────────────────────────

create table if not exists landing_slides (
  id                    uuid primary key default uuid_generate_v4(),
  image_url             text not null,
  cloudinary_public_id  text,
  caption               text,
  display_order         integer not null default 0,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists landing_slides_active_order_idx
  on landing_slides(display_order)
  where active = true;

drop trigger if exists landing_slides_updated_at on landing_slides;
create trigger landing_slides_updated_at
  before update on landing_slides
  for each row execute function set_updated_at();

comment on table landing_slides is
  'Full-bleed background slideshow for thedreamwedding.in landing page and the entire pre-login auth flow. Added P2-5.';
comment on column landing_slides.image_url is
  'Cloudinary delivery URL. Single source of truth — frontend renders this directly.';
comment on column landing_slides.cloudinary_public_id is
  'Cloudinary public_id when uploaded via admin panel (enables "delete from Cloudinary too"). NULL when URL was pasted from outside.';
comment on column landing_slides.display_order is
  'ASC order. Lower = earlier in rotation. Frontend cycles through active rows in this order.';
comment on column landing_slides.active is
  'Toggle without delete. false = skipped by the public endpoint.';

-- ── 2. exploring_photos ─────────────────────────────────────────────────────

create table if not exists exploring_photos (
  id                    uuid primary key default uuid_generate_v4(),
  image_url             text not null,
  cloudinary_public_id  text,
  caption               text,
  display_order         integer not null default 0,
  active                boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists exploring_photos_active_order_idx
  on exploring_photos(display_order)
  where active = true;

drop trigger if exists exploring_photos_updated_at on exploring_photos;
create trigger exploring_photos_updated_at
  before update on exploring_photos
  for each row execute function set_updated_at();

comment on table exploring_photos is
  'Editorial mood gallery shown to anonymous landing page visitors who tap "Just Exploring". Distinct from Discover preview (which shows real vendor profiles inside the PWA, Phase 2 Block 5). Added P2-5.';
comment on column exploring_photos.image_url is
  'Cloudinary delivery URL. Single source of truth — frontend renders this directly.';
comment on column exploring_photos.cloudinary_public_id is
  'Cloudinary public_id when uploaded via admin panel. NULL when URL was pasted from outside.';

-- ── 3. Idempotent seed ──────────────────────────────────────────────────────
--
-- Three Cloudinary URLs from cloud dccso5ljv, locked in P2-5 planning.
-- Same images seeded into both tables so launch-day visuals match across
-- the landing slideshow and the Just Exploring gallery.
--
-- The hardcoded FALLBACK_SLIDES array in dreamos-pwa frontend uses these
-- same URLs as the emergency-failure visual layer (Writer 2, P2-5 Block B).

insert into landing_slides (image_url, display_order, active)
select 'https://res.cloudinary.com/dccso5ljv/image/upload/IMG_2544.PNG_cyeqlj', 1, true
where not exists (
  select 1 from landing_slides
  where image_url = 'https://res.cloudinary.com/dccso5ljv/image/upload/IMG_2544.PNG_cyeqlj'
);

insert into landing_slides (image_url, display_order, active)
select 'https://res.cloudinary.com/dccso5ljv/image/upload/Facetune_14-05-2026-11-06-49_qs4dg6', 2, true
where not exists (
  select 1 from landing_slides
  where image_url = 'https://res.cloudinary.com/dccso5ljv/image/upload/Facetune_14-05-2026-11-06-49_qs4dg6'
);

insert into landing_slides (image_url, display_order, active)
select 'https://res.cloudinary.com/dccso5ljv/image/upload/Facetune_24-03-2026-22-59-53_f2tfsy', 3, true
where not exists (
  select 1 from landing_slides
  where image_url = 'https://res.cloudinary.com/dccso5ljv/image/upload/Facetune_24-03-2026-22-59-53_f2tfsy'
);

insert into exploring_photos (image_url, display_order, active)
select 'https://res.cloudinary.com/dccso5ljv/image/upload/IMG_2544.PNG_cyeqlj', 1, true
where not exists (
  select 1 from exploring_photos
  where image_url = 'https://res.cloudinary.com/dccso5ljv/image/upload/IMG_2544.PNG_cyeqlj'
);

insert into exploring_photos (image_url, display_order, active)
select 'https://res.cloudinary.com/dccso5ljv/image/upload/Facetune_14-05-2026-11-06-49_qs4dg6', 2, true
where not exists (
  select 1 from exploring_photos
  where image_url = 'https://res.cloudinary.com/dccso5ljv/image/upload/Facetune_14-05-2026-11-06-49_qs4dg6'
);

insert into exploring_photos (image_url, display_order, active)
select 'https://res.cloudinary.com/dccso5ljv/image/upload/Facetune_24-03-2026-22-59-53_f2tfsy', 3, true
where not exists (
  select 1 from exploring_photos
  where image_url = 'https://res.cloudinary.com/dccso5ljv/image/upload/Facetune_24-03-2026-22-59-53_f2tfsy'
);
