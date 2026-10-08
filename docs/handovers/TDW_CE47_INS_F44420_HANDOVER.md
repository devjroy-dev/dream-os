# repo: dream-os · base bcdb364 · TDW · CE-47 · INS · F-44.420 · HANDOVER

The founder's first live run of the PAY-A checks stopped on two triggers the repo did not know. The chair read both from
the live database (each BEFORE UPDATE, FOR EACH ROW, EXECUTE FUNCTION set_updated_at(), whose body only sets
new.updated_at = now()). This package writes them into the repo and lets the two checks allow them by name.

- db/migrations/0203_record_updated_at_triggers.sql: CREATE OR REPLACE TRIGGER invoices_updated_at and
  payment_schedules_set_updated_at, exactly as live; DROP TRIGGER IF EXISTS invoices_set_updated_at (0008's name, which
  the live database does not have). On the live database this changes nothing. On a database built from the repo the
  old name goes and the live name stands, with the same function: one trigger per table, the same behaviour. No table,
  column, grant or policy changes. A second run is safe. OUT_OF_ORDER.json record 203 is WEB-4's.
- docs/handovers/PAYA_0201_SUPABASE_CHECK.sql and PAYA_0202_SUPABASE_CHECK.sql: the guard allows the two live names and
  0008's name; its stop line is rewritten under R-47.1 (below).

## R-47.1: EVERY LINE A PERSON READS IN THIS PACKAGE, OLD BESIDE NEW
| where | old | new |
|---|---|---|
| both checks, the guard's stop line (read by the founder in the Supabase editor) | "STOP: a trigger this check did not expect: %. Paste this line back; nothing was written." | "The check stopped before writing anything, because it found a trigger it did not expect: %. Copy this line and send it to the chair." |
The checks' eight column names are labels, not sentences, and are unchanged. 0203 has no line a person reads.

## PROVEN (Postgres 16, a database built from the repo: 0201, 0202, 0008's invoices_set_updated_at)
before 0203: invoices.invoices_set_updated_at · after: invoices.invoices_updated_at and
payment_schedules.payment_schedules_set_updated_at · a second run: the same · both checks: eight t each · a stranger
trigger: the new stop line, nothing written.

## FINDING, NOT CURED HERE (b225, already on main)
When b225 is killed from outside (a runner's `timeout`, which sends SIGTERM), its own ceiling handler never runs, and the
Postgres it started is left running in /home/claude/.b225 (two were found after lesson 1 below and stopped by hand).
Cure for a later package: b225 stops every Postgres it started on SIGTERM and SIGINT as it does at its ceiling.
