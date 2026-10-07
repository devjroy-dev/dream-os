# TDW · CE-47 · WEB-4 · CUT 25 HANDOVER · the register's records for 0201 and 0202 (dream-os)

Cut at dream-os `2d349dc`, 8 October 2026, for server train 12, AFTER INS's PAY-A package (21 paths, which carries both
.sql files; this cut ships neither). Rung **b269**. No migration of its own. WEB-4 is the one writer of
db/migrations/OUT_OF_ORDER.json. Written from the files' bytes: 0201_payment_links.sql 18dbb3f0..., 0202_pay_oauth_states.sql
0419d5e5... (INS_0201_0202_for_WEB4.zip 62111a37...).

## What changes
- db/migrations/OUT_OF_ORDER.json: records 201 then 202 appended LAST (order is history; 0201 runs before 0202).
  - 201: four new tables (vendor_pay_accounts, vendor_pay_links, vendor_pay_events, vendor_pay_settings; RLS and the four
    service_role grants each, in the transaction); three functions (pay_record_milestone, pay_settle_invoice,
    pay_record_invoice; no SECURITY clause, so invoker rights; EXECUTE to service_role alone). No table's shape is altered;
    its functions write rows in invoices and payment_schedules.
  - 202: two new tables (vendor_pay_oauth_states, vendor_pay_event_answers; RLS and the four grants each); it ALTERS three
    of 0201's tables: vendor_pay_links (binder_id; invoice_id drops NOT NULL; CHECK vendor_pay_links_one_home),
    vendor_pay_events (binder_id, claimed_at, binder_base_received; CHECK vendor_pay_events_not_applied_reason_check dropped
    and re-added by name), vendor_pay_settings (accept_partial boolean NOT NULL DEFAULT false); seven functions, EXECUTE
    to service_role alone. stale_for names the two new tables AND the three altered ones.
  The twelve earlier rows and the README are byte-equal to 2d349dc's.
- scripts/b268_ce47_web4_cut24_bench.js, amended by label: 0218 held at its place (the twelfth row), not as the last.

## A finding for the chair (not mine to cure)
0202's own header (lines 2 to 3) says "New table and two functions only; no existing table altered". Its body, from line
86 on, adds a second table, five more functions and the ALTERs on three tables. The header predates the binder-payments
move and is now wrong about its own file. The record follows the bytes, not the header.

## Proven
b269 9/0 (the order 201 then 202; each record's tables, functions and alterations; stale_for exact, every altered table
named; nothing earlier moved; three mutations); clean tip red. No timing cell. b268 7/0, b267 7/0, b266 6/0, b263 16/0.
The register readers, the source walkers and e-274's five, both trees: see the card. b15 is red on this base ALONE
until INS's package brings the two files.

## Walk card
Nothing for the founder to walk: the register is read by the schema formatter, not by any screen. The proof is b15
green on the train's combined tree.
