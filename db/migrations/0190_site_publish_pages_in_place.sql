-- db/migrations/0190_site_publish_pages_in_place.sql
-- TDW · CE-47 · WEB-4 cut 6 · PUBLISH KEEPS A PAGE'S ROW (the chair's item a on cut 5).
-- Number derived at origin at the cut (main 00fe68b; 0186 reserved by the chair for G6-6).
-- WHY: 0189's site_publish_draft soft-deleted every page and re-inserted, so a page's id changed on each Publish and
--   any section carrying page_id would be orphaned.
-- WHAT: REPLACES public.site_publish_draft(uuid) with the same function, one difference: her draft's pages are
--   UPDATED IN PLACE BY SLUG (title, position, shown), a slug not yet live is inserted, and only live pages ABSENT from
--   the draft are soft-deleted. Settings and sections exactly as 0189. No table, no column, no data touched.
--   The grants are restated (0184's shape): EXECUTE to service_role only.
-- Witness: db/migrations/0189_site_drafts.sql; public.vendor_site_pages (0187; unique (vendor_id, slug) while live).
-- REVERT (by hand, with a witness): re-run 0189's CREATE OR REPLACE FUNCTION block alone.

BEGIN;

CREATE OR REPLACE FUNCTION public.site_publish_draft(p_vendor uuid)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY INVOKER
AS $fn$
DECLARE
  d     public.vendor_site_drafts%ROWTYPE;
  s     jsonb;
  e     jsonb;
  pos   integer := 0;
  at    timestamptz := now();
  slugs text[] := '{}';
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
    FOR e IN SELECT * FROM jsonb_array_elements(d.pages) LOOP
      slugs := slugs || (e->>'slug');
      UPDATE public.vendor_site_pages SET title = e->>'title', position = pos,
        shown = COALESCE((e->>'shown')::boolean, true), updated_at = at
      WHERE vendor_id = p_vendor AND slug = e->>'slug' AND deleted_at IS NULL;
      IF NOT FOUND THEN
        INSERT INTO public.vendor_site_pages (vendor_id, slug, title, position, shown)
        VALUES (p_vendor, e->>'slug', e->>'title', pos, COALESCE((e->>'shown')::boolean, true));
      END IF;
      pos := pos + 1;
    END LOOP;
    UPDATE public.vendor_site_pages SET deleted_at = at, updated_at = at
    WHERE vendor_id = p_vendor AND deleted_at IS NULL AND NOT (slug = ANY (slugs));
  END IF;

  DELETE FROM public.vendor_site_drafts WHERE vendor_id = p_vendor;
  RETURN at;
END;
$fn$;

-- ── A-45.8 (restated) ────────────────────────────────────────
REVOKE ALL ON FUNCTION public.site_publish_draft(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.site_publish_draft(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.site_publish_draft(uuid) TO service_role;

COMMIT;
