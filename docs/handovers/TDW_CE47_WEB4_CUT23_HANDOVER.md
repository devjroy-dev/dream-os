# TDW · CE-47 · WEB-4 · CUT 23 HANDOVER · the register's record for 0211 (dream-os)

Cut at dream-os `d92edea`, 7 October 2026, for server train 8, AFTER PRO's P2 server package (TDW_CE47_PRO_P2_SRV.zip,
which carries db/migrations/0211_pro_gear_bills.sql). Rung **b267**. No migration of its own. WEB-4 is the one writer of
db/migrations/OUT_OF_ORDER.json.

## What changes
- db/migrations/OUT_OF_ORDER.json: record 211 appended LAST (order is history): 183, 204, 196, 200, 208, 209, 205, 195,
  197, 198, 211. Written from 0211's bytes (sha256 80cca6b6...), with PRO's draft as input: three new tables
  (`gear_items`, `gear_requests`, `bill_drafts`; RLS on; SELECT, INSERT, UPDATE, DELETE to service_role) and one function,
  `pro_gear_accept(uuid, uuid)` (SECURITY INVOKER; EXECUTE revoked from PUBLIC, anon and authenticated, granted to
  service_role alone). Additive: no existing table altered (the new tables reference `vendors` and `expenses`). The ten
  earlier rows and the README are byte-equal to d92edea's.
- scripts/b266_ce47_web4_cut22_bench.js, amended by label: 0198 is held at its place in history (the tenth row), not as
  the last; 1.1 reads the first ten rows.

## Proven
b267 7/0 (the order; the record says what 0211 does; nothing earlier moved; two mutations). Clean tip: red. No timing
cell. b266 6/0, b263 16/0. Every register reader and the source walkers, both trees, engines built: see the card. b15 is
red on this base ALONE until PRO's package brings 0211's file; with 0211 beside it, green (proven here).

## Walk card
Nothing for the founder to walk: the register is read by the schema formatter, not by any screen. The proof is b15
green on the train's combined tree.
