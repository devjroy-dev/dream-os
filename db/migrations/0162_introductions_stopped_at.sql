-- ─────────────────────────────────────────────────────────────────────────────
-- 0162 · J1-IN · INTRODUCTIONS — HER STOP GETS ITS OWN COLUMN
-- CE-42 seat E, packet 4a's last. Cut at dream-os 03c9183.
-- Number ALLOCATED BY THE CHAIR (R-40.44 / LD-8), never claimed. Ladder tail
-- derived by command immediately before writing:
--   `ls db/migrations | grep -E '^[0-9]{4}' | sort | tail -1` → 0161.
--
-- ── WHY NOT A `status` VALUE ──────────────────────────────────────────────────
-- The chair's first lean was to mark the row `stopped`. 0161's CHECK does not
-- admit it, so this would have been a widening — and widening was refused for a
-- derived reason rather than a stylistic one.
--
-- `status` IS THE RECEIPT VOCABULARY. `src/lib/vendor/relayStatus.js:420-425` is
-- the ninth router arm and it UPDATES `status` by wamid whenever Meta speaks. So:
--   • she STOPs after `delivered` → the write destroys the receipt, and the
--     vendor can no longer tell a delivered introduction from an undelivered one;
--   • a `read` receipt arrives after the STOP → it silently overwrites `stopped`,
--     and the STOP disappears from the row that recorded it.
-- Two facts — "did this message arrive" and "did she ask us to stop" — cannot
-- share one column when a webhook owns the column and a human owns the fact.
--
-- ── NULLABLE, AND NO DEFAULT ─────────────────────────────────────────────────
-- Absence is the ordinary state. `stopped_at is null` is the whole predicate and
-- there is nothing to backfill: every existing row is a row nobody has stopped.
--
-- ── PROVENANCE (protocol §10, SQL-provenance law) ────────────────────────────
--   public.introductions — db/migrations/0161_introductions.sql, this table's
--                          own witness; it does not yet appear in
--                          docs/db/PUBLIC_SCHEMA.md (snapshot tail 0154).
-- No index: the column is read only on a row already resolved by id or by the
-- suffix match, never scanned on its own.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.introductions add column if not exists stopped_at timestamptz;

comment on column public.introductions.stopped_at is
  'J1-IN / Fork A: the moment an introduction recipient sent STOP on the marketing line. She is NEVER written to public.prospects — a stranger who never opted in to TDW''s own marketing must not become one of its rows by saying no, and prospects.state=''opted_out'' is terminal and cross-line. Deliberately NOT a status value: status is the receipt vocabulary that relayStatus.js writes by wamid, and a STOP sharing that column would be overwritten by a later read receipt, or would destroy a delivered one.';
