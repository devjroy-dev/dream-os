-- db/migrations/0189_site_drafts.sql
-- TDW · CE-47 · WEB-4 cut 5 · HER SITE'S DRAFT, AND PUBLISH IN ONE TRANSACTION (the chair's item 1; WEB-6's W6-k).
-- Number derived at origin at the cut (main a0bfe02; 0186 reserved by the chair for G6-6).
-- WHY: vendor_sites and the section rows ARE the live site, so her room's Publish had nothing to hold a change.
-- WHAT (additive; nothing dropped; no data touched):
--   CREATES public.vendor_site_drafts: one row per vendor holding her unpublished SETTINGS (a patch of vendor_sites
--     columns), SECTIONS (her home's section rows by key) and PAGES (Prestige). Looks, collections, questions,
--     testimonials and prices are NOT drafted (the chair's ruling).
--   CREATES public.site_publish_draft(uuid): applies her draft to the live rows and deletes it, in the one transaction
--     a function call is; stamps vendor_sites.published_at (0179's column; null until the first publish, which is how
--     her room reads is_live). A missing draft publishes nothing and returns null.
--   RLS on the new table; A-45.8: SELECT, INSERT, UPDATE, DELETE to service_role; the function's EXECUTE to service_role
--     only (0184's shape). 0170's default privileges already keep anon and authenticated off both.
-- Witnesses: public.vendor_sites (0179, 0187), public.vendor_site_sections and public.vendor_site_pages (0187).
-- REVERT (by hand, with a witness; never run as part of this file):
--   DROP FUNCTION IF EXISTS public.site_publish_draft(uuid); DROP TABLE IF EXISTS public.vendor_site_drafts;

BEGIN;

CREATE TABLE public.vendor_site_drafts (
  vendor_id   uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  settings    jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(settings) = 'object' AND pg_column_size(settings) <= 65536),
  sections    jsonb CHECK (sections IS NULL OR (jsonb_typeof(sections) = 'array' AND jsonb_array_length(sections) <= 40
                                                AND pg_column_size(sections) <= 262144)),
  pages       jsonb CHECK (pages IS NULL OR (jsonb_typeof(pages) = 'array' AND jsonb_array_length(pages) <= 12)),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_site_drafts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.site_publish_draft(p_vendor uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY INVOKER
AS $fn$
DECLARE
  d   public.vendor_site_drafts%ROWTYPE;
  s   jsonb;
  e   jsonb;
  pos integer := 0;
  at  timestamptz := now();
BEGIN
  SELECT * INTO d FROM public.vendor_site_drafts WHERE vendor_id = p_vendor FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  s := d.settings;

  INSERT INTO public.vendor_sites (vendor_id) VALUES (p_vendor) ON CONFLICT (vendor_id) DO NOTHING;
  UPDATE public.vendor_sites SET
    style          = CASE WHEN s ? 'style'          THEN s->>'style'          ELSE style END,
    styles_picked  = CASE WHEN s ? 'styles_picked'  THEN ARRAY(SELECT jsonb_array_elements_text(s->'styles_picked')) ELSE styles_picked END,
    palette_id     = CASE WHEN s ? 'palette_id'     THEN s->>'palette_id'     ELSE palette_id END,
    palette_custom = CASE WHEN s ? 'palette_custom' THEN s->'palette_custom'  ELSE palette_custom END,
    font_pair      = CASE WHEN s ? 'font_pair'      THEN s->>'font_pair'      ELSE font_pair END,
    motion         = CASE WHEN s ? 'motion'         THEN s->>'motion'         ELSE motion END,
    corners        = CASE WHEN s ? 'corners'        THEN s->>'corners'        ELSE corners END,
    texture        = CASE WHEN s ? 'texture'        THEN s->>'texture'        ELSE texture END,
    button_style   = CASE WHEN s ? 'button_style'   THEN s->>'button_style'   ELSE button_style END,
    cover_mode     = CASE WHEN s ? 'cover_mode'     THEN s->>'cover_mode'     ELSE cover_mode END,
    cover          = CASE WHEN s ? 'cover'          THEN s->'cover'           ELSE cover END,
    monogram       = CASE WHEN s ? 'monogram'       THEN s->>'monogram'       ELSE monogram END,
    site_name      = CASE WHEN s ? 'site_name'      THEN s->>'site_name'      ELSE site_name END,
    copy           = CASE WHEN s ? 'copy'           THEN s->'copy'            ELSE copy END,
    credit_shown   = CASE WHEN s ? 'credit_shown'   THEN (s->>'credit_shown')::boolean ELSE credit_shown END,
    published_at   = at,
    unpublished_at = NULL,
    updated_at     = at
  WHERE vendor_id = p_vendor;

  IF d.sections IS NOT NULL THEN
    FOR e IN SELECT * FROM jsonb_array_elements(d.sections) LOOP
      UPDATE public.vendor_site_sections SET
        variant = COALESCE(e->>'variant', 'default'), shown = COALESCE((e->>'shown')::boolean, true),
        position = COALESCE((e->>'position')::integer, 0), eyebrow = e->>'eyebrow', heading = e->>'heading',
        body = COALESCE(e->'body', '{}'::jsonb), updated_at = at
      WHERE vendor_id = p_vendor AND key = e->>'key' AND page_id IS NULL AND deleted_at IS NULL;
      IF NOT FOUND THEN
        INSERT INTO public.vendor_site_sections (vendor_id, key, variant, shown, position, eyebrow, heading, body)
        VALUES (p_vendor, e->>'key', COALESCE(e->>'variant', 'default'), COALESCE((e->>'shown')::boolean, true),
                COALESCE((e->>'position')::integer, 0), e->>'eyebrow', e->>'heading', COALESCE(e->'body', '{}'::jsonb));
      END IF;
    END LOOP;
  END IF;

  IF d.pages IS NOT NULL THEN
    UPDATE public.vendor_site_pages SET deleted_at = at WHERE vendor_id = p_vendor AND deleted_at IS NULL;
    FOR e IN SELECT * FROM jsonb_array_elements(d.pages) LOOP
      INSERT INTO public.vendor_site_pages (vendor_id, slug, title, position, shown)
      VALUES (p_vendor, e->>'slug', e->>'title', pos, COALESCE((e->>'shown')::boolean, true));
      pos := pos + 1;
    END LOOP;
  END IF;

  DELETE FROM public.vendor_site_drafts WHERE vendor_id = p_vendor;
  RETURN at;
END;
$fn$;

-- ── A-45.8 ───────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_site_drafts TO service_role;
REVOKE ALL ON FUNCTION public.site_publish_draft(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.site_publish_draft(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.site_publish_draft(uuid) TO service_role;

COMMIT;
