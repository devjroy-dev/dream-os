-- 0153_wa_vendor_route_seed.sql — CE-41 · SEAT F · F-41.46.
-- Number derived by command at the cut: `git ls-tree --name-only
-- 0b27cc67a0bfe3dfc7bc5c9b57bb532df24dd67e db/migrations/` — tail is
-- 0152_payment_reminders_receipts.sql. Never claimed from memory (LD-8).
--
-- ═══════════════════════════════════════════════════════════════════════════
-- WHAT THIS DOES, AND WHY IT CHANGES NOTHING
-- ═══════════════════════════════════════════════════════════════════════════
-- The WhatsApp vendor lane has always routed on `model.pwa_vendor.<tier>`: it
-- calls the same builder the PWA door calls and the builder named that surface.
-- Two wires, one switch, and only one of them labelled — F-41.46.
--
-- The code half of the cure shipped in this same packet: the WA door now names
-- `wa_vendor`, and a `wa_vendor` key with NO ROW resolves through its
-- `pwa_vendor` twin. So the lane is already correct without this file. What this
-- file adds is SEPARABILITY: with a row of its own, the founder can move Victor
-- or Donna on WhatsApp without touching either one in the app.
--
-- THE VALUES ARE COPIES OF THE LIVE ROWS, BYTE FOR BYTE. Not of the 0073/0082
-- seeds — those are history and they disagree with the database on three keys
-- (F0 §2a). The source is the founder's own SELECT of 2026-09-08, quoted below
-- verbatim so the next sitting can check this file against it without asking
-- anyone. Copying the LIVE values is what makes this migration a no-op on the
-- wire: the borrowed answer and the seeded answer are the same answer.
--
--   model.pwa_vendor.advisor    {"provider":"deepseek","model":"deepseek-v4-flash"}
--   model.pwa_vendor.essential  {"provider":"anthropic","model":"claude-haiku-4-5-20251001","donna_provider":"deepseek","donna_model":"deepseek-v4-flash"}
--   model.pwa_vendor.prestige   {"provider":"anthropic","model":"claude-haiku-4-5-20251001","donna_provider":"deepseek","donna_model":"deepseek-v4-flash"}
--   model.pwa_vendor.signature  {"provider":"anthropic","model":"claude-haiku-4-5-20251001","donna_provider":"deepseek","donna_model":"deepseek-v4-flash"}
--
-- ═══════════════════════════════════════════════════════════════════════════
-- THE TWO TIERS THIS FILE DELIBERATELY DOES NOT SEED
-- ═══════════════════════════════════════════════════════════════════════════
-- · `trial` — there is a live `model.pwa_vendor.trial` row and it is copied
--   NOWHERE, because no code path can ask for it. `vendors_tier_check`
--   (0115:118) admits basic | essential | signature | prestige, and 0115:104
--   moved every old trial vendor into `basic`. Seeding a WhatsApp twin of an
--   unreachable row would be decoration (R-40.60). The pwa row's own retirement
--   is filed, not done here — F0 §5.
--
-- · `basic` — THE DEFAULT TIER HAS NO ROW ON EITHER SURFACE, and that is the
--   unnumbered finding of F0 §4: `vendors.tier` defaults to 'basic', 0115 moved
--   the old trial vendors into it, and `model.pwa_vendor.basic` exists in
--   neither the database nor the code matrix. It resolves on the bare literal at
--   the foot of `resolveModel` — Haiku, with NO donna split — so Donna is
--   Anthropic on the basic tier and DeepSeek on all four others, and nothing has
--   ever said so.
--
--   This file does not fix that by seeding, because a seed here is a LIVE
--   BEHAVIOUR CHANGE wearing a migration's clothes: copy the trial row's shape
--   and every basic vendor's Donna moves to DeepSeek tonight, decided by an
--   executor. Seat F does not change a lane's live value. The panel shipped in
--   this packet SHOWS the basic lane with `has_row: false`, and the door creates
--   its row — seeded from what is live, so nothing moves but the role tapped —
--   the first time the founder chooses. The switch is his.
--
-- ═══════════════════════════════════════════════════════════════════════════
-- PROVENANCE (SQL-provenance law; R-40.27 — the constraints, not the columns
-- alone, for every table written)
-- ═══════════════════════════════════════════════════════════════════════════
--   public.admin_config · docs/db/PUBLIC_SCHEMA.md:43-49 · 4 columns
--       1. key         text NOT NULL                              (:46)
--       2. value       text NOT NULL                              (:47)
--       3. description text                                       (:48)
--       4. updated_at  timestamptz NOT NULL default now()         (:49)
--   CONSTRAINTS · docs/db/PUBLIC_SCHEMA.md:1514-1518
--       [PRIMARY KEY] admin_config_pkey — PRIMARY KEY (key)       (:1517-1518)
--   INDEXES · docs/db/PUBLIC_SCHEMA.md:3088-3092
--       admin_config_pkey UNIQUE btree (key)                      (:3092)
--
--   `value` is text holding JSON, not jsonb — D7's shape, parsed defensively by
--   `parseRoute`. Written as text here for that reason.
--   `description` is nullable and is filled, because a row with no description is
--   a row the next sitting has to derive the purpose of.
--   ON CONFLICT DO NOTHING against the PRIMARY KEY above: this migration is a
--   SEED and must never overwrite a value the founder has since chosen. A re-run
--   is a no-op, which is 0114/0115's own pattern.
--
-- NO SCHEMA MOVES. No table, column, constraint or index is created or altered,
-- so `docs/db/PUBLIC_SCHEMA.md` needs no regen with this delivery.

BEGIN;

INSERT INTO public.admin_config (key, value, description) VALUES
  ('model.wa_vendor.essential',
   '{"provider":"anthropic","model":"claude-haiku-4-5-20251001","donna_provider":"deepseek","donna_model":"deepseek-v4-flash"}',
   'Victor + Donna on the WhatsApp vendor line, essential tier. F-41.46: seeded as a byte copy of model.pwa_vendor.essential live at 2026-09-08, so this row changes no routed byte; it exists to make the WhatsApp lane switchable apart from the app lane. With no row here the lane falls back to its pwa_vendor twin.'),
  ('model.wa_vendor.signature',
   '{"provider":"anthropic","model":"claude-haiku-4-5-20251001","donna_provider":"deepseek","donna_model":"deepseek-v4-flash"}',
   'Victor + Donna on the WhatsApp vendor line, signature tier. Byte copy of model.pwa_vendor.signature live at 2026-09-08 (F-41.46).'),
  ('model.wa_vendor.prestige',
   '{"provider":"anthropic","model":"claude-haiku-4-5-20251001","donna_provider":"deepseek","donna_model":"deepseek-v4-flash"}',
   'Victor + Donna on the WhatsApp vendor line, prestige tier. Byte copy of model.pwa_vendor.prestige live at 2026-09-08 (F-41.46).'),
  ('model.wa_vendor.advisor',
   '{"provider":"deepseek","model":"deepseek-v4-flash"}',
   'Victor on the WhatsApp vendor line in the advisor room (victor_mode=advisor, F-06.4 — not a product tier). Byte copy of model.pwa_vendor.advisor live at 2026-09-08 (F-41.46).')
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- AFTER: the four rows, and the two absences that are the point
-- ═══════════════════════════════════════════════════════════════════════════
-- Run as its own paste block (R-40.31 — the editor renders only the last result):
--
--   select key, value from public.admin_config
--    where key like 'model.%' order by key;
--
-- EXPECT twelve rows: the eight of 2026-09-08 plus the four above. EXPECT no
-- `model.wa_vendor.basic` and no `model.wa_vendor.trial`, for the two reasons
-- stated above. EXPECT `model.pwa_vendor.basic` still absent — the finding stands
-- until the chair rules it; it is now VISIBLE on the panel rather than silent.
