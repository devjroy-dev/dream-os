-- db/migrations/0193_live_links_declared.sql
-- TDW · CE-47 · WEB-4 cut 12 · F-44.272, OPTION A (the chair, 3 October 2026): THE FILES MADE TO MATCH THE LIVE DATABASE.
-- A NO-OP ON THE LIVE DATABASE. Every statement is guarded so that, where the live database already stands this way, it
-- does nothing; on a database built from the files it brings that database to the live shape.
-- Source of truth: the founder's two READ-ONLY catalogue reads of 3 October 2026 (pg_constraint for the nine tables;
-- information_schema.columns for discover_heroes and the seven linked tables). Nothing here is taken from PUBLIC_SCHEMA.md.
--
-- 1 · THE 22 LINKS the live database carries and no migration declared (contracts, payment_schedules, tds_ledger,
--     team_members, team_messages, team_payments, team_tasks; these tables predate the ladder). Each is added only when its
--     table exists and no constraint of that NAME exists on it; the definition is pg_get_constraintdef's text as read live.
-- 2 · pending_actions: declared by 0002, ABSENT live, read by nothing in src. DROP TABLE IF EXISTS (a no-op live).
--     0184's header says pending_actions cascades; with no such table that sentence describes nothing (the handover says so).
-- 3 · discover_heroes as it stands live: no vendor_id (0044 declared one; a table of that name already existed live, so
--     0044's CREATE TABLE IF NOT EXISTS did nothing there), plus cloudinary_public_id and updated_at, and id defaulting to
--     uuid_generate_v4(). Each statement guarded (IF EXISTS / IF NOT EXISTS / only when the default differs).
-- REVERT: none needed live (nothing changes there). On a files-built database: re-run 0044 and 0002's shapes by hand.

BEGIN;

-- ── 1 · the 22 links ────────────────────────────────────────────────────────────────────────────────────────────────
DO $f44272$
DECLARE l record;
BEGIN
  FOR l IN SELECT * FROM (VALUES
    ('contracts', 'contracts_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL'),
    ('contracts', 'contracts_event_id_fkey', 'FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL'),
    ('contracts', 'contracts_invoice_id_fkey', 'FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL'),
    ('contracts', 'contracts_lead_id_fkey', 'FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL'),
    ('contracts', 'contracts_lead_package_id_fkey', 'FOREIGN KEY (lead_package_id) REFERENCES lead_packages(id) ON DELETE SET NULL'),
    ('contracts', 'contracts_vendor_id_fkey', 'FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE'),
    ('payment_schedules', 'payment_schedules_invoice_id_fkey', 'FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE'),
    ('payment_schedules', 'payment_schedules_vendor_id_fkey', 'FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE'),
    ('tds_ledger', 'tds_ledger_client_id_fkey', 'FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL'),
    ('tds_ledger', 'tds_ledger_invoice_id_fkey', 'FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL'),
    ('tds_ledger', 'tds_ledger_vendor_id_fkey', 'FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE'),
    ('team_members', 'team_members_roster_vendor_id_fkey', 'FOREIGN KEY (roster_vendor_id) REFERENCES vendor_roster(id) ON DELETE SET NULL'),
    ('team_members', 'team_members_vendor_id_fkey', 'FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE'),
    ('team_messages', 'team_messages_linked_event_id_fkey', 'FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL'),
    ('team_messages', 'team_messages_vendor_id_fkey', 'FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE'),
    ('team_payments', 'team_payments_linked_event_id_fkey', 'FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL'),
    ('team_payments', 'team_payments_linked_task_id_fkey', 'FOREIGN KEY (linked_task_id) REFERENCES team_tasks(id) ON DELETE SET NULL'),
    ('team_payments', 'team_payments_team_member_id_fkey', 'FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE'),
    ('team_payments', 'team_payments_vendor_id_fkey', 'FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE'),
    ('team_tasks', 'team_tasks_assigned_to_member_id_fkey', 'FOREIGN KEY (assigned_to_member_id) REFERENCES team_members(id) ON DELETE SET NULL'),
    ('team_tasks', 'team_tasks_linked_event_id_fkey', 'FOREIGN KEY (linked_event_id) REFERENCES events(id) ON DELETE SET NULL'),
    ('team_tasks', 'team_tasks_vendor_id_fkey', 'FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE')
  ) AS v(tbl, con, def)
  LOOP
    IF to_regclass('public.' || l.tbl) IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conname = l.con AND c.conrelid = to_regclass('public.' || l.tbl)) THEN
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', l.tbl, l.con, l.def);
    END IF;
  END LOOP;
END
$f44272$;

-- ── 2 · pending_actions: absent live, read by nothing ───────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.pending_actions;

-- ── 3 · discover_heroes as it stands live ───────────────────────────────────────────────────────────────────────────
ALTER TABLE public.discover_heroes DROP COLUMN IF EXISTS vendor_id;
ALTER TABLE public.discover_heroes ADD COLUMN IF NOT EXISTS cloudinary_public_id text;
ALTER TABLE public.discover_heroes ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
DO $f44272h$
BEGIN
  IF (SELECT column_default FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'discover_heroes' AND column_name = 'id') IS DISTINCT FROM 'uuid_generate_v4()' THEN
    ALTER TABLE public.discover_heroes ALTER COLUMN id SET DEFAULT uuid_generate_v4();
  END IF;
END
$f44272h$;

COMMIT;
