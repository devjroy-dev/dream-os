-- db/migrations/0152_payment_reminders_receipts.sql
-- CE-41 · SEAT C · G3.4 s2 — F-40.229 (R-40.110) and R-41.59.
-- (0152 derived at 66b4dc6: `ls db/migrations | grep -E "^[0-9]{4}" | sort | tail -1` → 0151.)
--
-- ── WHY ───────────────────────────────────────────────────────────────────────
-- `public.payment_reminders` has held a `wamid` since 0139 with no receipt arm,
-- no status, and no partial UNIQUE — the exact defect F-40.177 recorded for
-- `lead_alerts` and F-40.229 filed for this table. Meta's `sent`/`delivered`/
-- `read`/`failed` receipts for a reminder land on `relayStatus.js` and fall
-- through every home to `matched=0`. This migration gives the table the shape
-- `0142` gave `referral_alerts`, so the sixth arm in `relayStatus.js` can reach it.
--
-- ── AND WHY THE ONCE-PER-MILESTONE KEY RELAXES (R-41.59) ──────────────────────
-- `payment_reminders_milestone_kind_key UNIQUE (milestone_id, kind)` was the
-- guarantee that a client is never chased twice. It also made a FAILED attempt
-- permanent: the founder's walk of 2026-09-08 spent Shoot day's one send on a
-- refusal that never reached Meta (F-41.14), and the milestone could only be
-- freed by deleting the row. R-41.59: a `failed` row keeps its place in the
-- ledger and stops holding the milestone. The key becomes a partial unique index
-- over the same pair WHERE `status <> 'failed'` — one pending-or-successful
-- attempt per milestone, a retry after a genuine failure, and every attempt still
-- on file.
--
-- ── SQL PROVENANCE (protocol §10) ─────────────────────────────────────────────
-- `public.payment_reminders` (13 columns) is witnessed at docs/db/PUBLIC_SCHEMA.md
-- and defined at db/migrations/0139_payment_reminders.sql — id, vendor_id,
-- milestone_id, invoice_id, kind, milestone_label, amount_due, due_date, to_phone,
-- template, wamid, source, created_at; constraint `payment_reminders_milestone_kind_key
-- UNIQUE (milestone_id, kind)`. The four columns below are new; nothing else moves.
-- The status vocabulary is `referral_alerts`' own (0142:142): queued · sent ·
-- delivered · read · failed, defaulting to queued.
--
-- ⚠ THE REGEN (R-41.9) IS OWED AFTER THIS RUNS — this table's row in
-- PUBLIC_SCHEMA.md gains four columns and two indexes. The founder's regen block
-- covers 0149–0152 in one go.

-- ── 1 · THE RECEIPT COLUMNS ──────────────────────────────────────────────────
alter table public.payment_reminders
  add column if not exists status      text        not null default 'queued',
  add column if not exists error_code  text        null,
  add column if not exists error_title text        null,
  add column if not exists updated_at  timestamptz not null default now();

-- ── 2 · THE STATUS VOCABULARY (0142's own) ───────────────────────────────────
alter table public.payment_reminders
  drop constraint if exists payment_reminders_status_check;
alter table public.payment_reminders
  add constraint payment_reminders_status_check
  check (status = any (array['queued'::text, 'sent'::text, 'delivered'::text, 'read'::text, 'failed'::text]));

-- ── 3 · BACKFILL, HONESTLY ───────────────────────────────────────────────────
-- A row that reached Meta has a wamid: it is at least `sent`. A row with no
-- wamid was decided and never dispatched — it stays `queued`, which is what it
-- has always been. Nothing is invented: no row is called `delivered` or `read`
-- on the strength of a column that never recorded either.
update public.payment_reminders set status = 'sent' where wamid is not null and status = 'queued';

-- ── 4 · THE RECEIPT'S LOOKUP PATH (0142:151's shape) ─────────────────────────
-- PARTIAL: a null wamid is a row no receipt will ever name, and it must not sit
-- in the index the router probes on every status event.
create index if not exists idx_payment_reminders_wamid
  on public.payment_reminders (wamid) where wamid is not null;

-- ── 5 · ONE ROW PER WAMID (0142:158's shape) ─────────────────────────────────
-- The router's `matched === 1` refusal is only meaningful if the database can
-- promise it. PARTIAL for the same reason as the index above.
create unique index if not exists uq_payment_reminders_wamid
  on public.payment_reminders (wamid) where wamid is not null;

-- ── 6 · R-41.59 · THE ONCE-PER-MILESTONE KEY, RELAXED ────────────────────────
-- The table constraint becomes a partial unique index over the same pair. A
-- `failed` row keeps its place in the ledger and no longer holds the milestone;
-- a `queued`, `sent`, `delivered` or `read` row still does. Dropped and recreated
-- in one statement's reach so no window exists in which the milestone is
-- unguarded: the index is created first, the constraint dropped second.
create unique index if not exists uq_payment_reminders_milestone_kind_live
  on public.payment_reminders (milestone_id, kind) where status <> 'failed';
alter table public.payment_reminders
  drop constraint if exists payment_reminders_milestone_kind_key;

-- ── 7 · THE TABLE'S OWN WORD ─────────────────────────────────────────────────
comment on table public.payment_reminders is
  'One row per reminder attempt. `uq_payment_reminders_milestone_kind_live` UNIQUE (milestone_id, kind) WHERE status <> ''failed'' IS the once-per-milestone guarantee (R-G34.3 as relaxed by R-41.59); no code path may rely on checking first. A `failed` row keeps the attempt on file and frees the milestone for a retry. Rows OUTLIVE their milestone by ON DELETE SET NULL with label/amount/invoice denormalised (R-G34.6). wamid NULL means the send never reached Meta; `status` carries Meta''s receipts through relayStatus.js''s sixth arm (F-40.229). Sole writer: src/lib/vendor/paymentReminders.js.';
