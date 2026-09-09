-- ─────────────────────────────────────────────────────────────────────────────
-- 0155 · BLOCK 20 · CONCIERGE s2 · R-41.118 + R-41.4(b)/(c)
-- The outsider alert moves to v2 (Utility) and the two bride arms join the plane.
-- CE-41 seat D, D2. Cut at dream-os 0fb3ee234818eecc0146fec391272d6e85e791c7.
-- Ladder tail derived by command immediately before allocation:
--   `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1` → 0154. Number
--   allocated by the chair, never claimed (LD-8).
--
-- WHY v2 (R-41.118). `tdw_assist_lead_outside` was MARKETING filed as Utility —
-- R-41.30 chose "accept, no appeal" to protect the Utility lane. What actually
-- refused it was the per-user MARKETING cap: 131049, FOUR TIMES on one test
-- handset in a single night (rows in assistance_forwards, 2026-09-08 19:29 →
-- 23:45). The honest Utility shape existed all along — an ENQUIRY NOTICE, not an
-- invitation — and the re-file found it. R-41.30's record gains that resolution.
-- 131049 cannot arise on a Utility send, so v1's rows keep their sentence and it
-- stays true for them (S2-5 is keyed on the code, not on the template).
--
-- WHY THE BRIDE ARMS ARE SEPARATE KEYS. Each send is its own plane on the
-- Switchboard (R-41.8): the founder flips what he has walked, one at a time.
--
-- STATUS = 'approved', NOT 'on' (R-41.35's grammar, seat C's register):
--   'approved' is META'S WORD — the template is filed and assessable.
--   'on'       is THE FOUNDER'S — his tap on the Switchboard card.
-- Seeding 'approved' therefore arms nothing. Every arm reads shut until he flips
-- it, which is the posture the chair ruled and the same one 0151 took.
--
-- ⚠ assist_found_vendor IS IN REVIEW AT META, NOT ACTIVE. F-41.114 re-filed its
-- button (it was a quick reply, not the URL the entry claimed) and the edit is
-- being assessed. Its key is seeded 'pending', not 'approved' — the row must not
-- claim a state Meta has not given. The nightly sweep (R-41.36) will move it the
-- day the Manager reads Active; nothing here anticipates that.
--
-- PROVENANCE: public.capabilities ← db/migrations/0149_capabilities.sql
--   line 23  kind   CHECK (kind IN ('template','permission','scope','flag'))
--   line 24  status CHECK (status IN ('pending','approved','rejected','paused','armed','on','off'))
-- Both values below are witnessed against those two lines, not recalled.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.capabilities (key, kind, status, evidence, flipped_at, flipped_by) values
  ('template.tdw_assist_lead_outside_v2', 'template', 'approved',
   'seed: R-41.118 — Active as UTILITY, Meta id 2544506315978894, filed 2026-09-09 07:42 IST (docs/TEMPLATES.md §2 row 10a). Replaces the v1 MARKETING key retired below. approved is Meta''s word; the founder''s tap makes it on.',
   now(), 'seed'),

  ('template.tdw_assist_found_vendor', 'template', 'pending',
   'seed: R-41.4(b) — Meta id 3160852754105015, UTILITY, bride line (docs/TEMPLATES.md §2 row 11). IN REVIEW at Meta, not Active: F-41.114 re-filed the button and the edit is being assessed. pending is the honest word; the nightly sweep moves it when the Manager reads Active.',
   now(), 'seed'),

  ('template.tdw_assist_found_outside', 'template', 'approved',
   'seed: R-41.4(c) — Meta id 3115277355330375, UTILITY, bride line, no button (docs/TEMPLATES.md §2 row 12). approved is Meta''s word; the founder''s tap makes it on.',
   now(), 'seed')
on conflict (key) do nothing;

-- ── v1 RETIRED ───────────────────────────────────────────────────────────────
-- Set OFF, not deleted. The row is the only durable record of what the estate
-- sent before 2026-09-09 and of why it stopped; deleting it would take the
-- evidence with the key. No reader in src/ names this key after this rider —
-- CAPABILITY_KEYS.TDW_ASSIST_LEAD_OUTSIDE now resolves to the v2 key, and that
-- constant is the one home every reader goes through.
--
-- IDEMPOTENT AND NARROW: this cannot resurrect a key the founder has since
-- turned off for his own reasons, and it touches exactly one row.
update public.capabilities
   set status     = 'off',
       evidence   = 'retired by 0155 (R-41.118): superseded by template.tdw_assist_lead_outside_v2, which is UTILITY and not subject to the per-user marketing cap that produced four 131049s on 2026-09-08. Row kept, not deleted — it is the record of what was sent before.',
       flipped_at = now(),
       flipped_by = 'seed'
 where key = 'template.tdw_assist_lead_outside'
   and status <> 'off';
