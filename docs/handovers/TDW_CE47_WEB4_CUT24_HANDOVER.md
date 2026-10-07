# TDW · CE-47 · WEB-4 · CUT 24 HANDOVER · the register's record for 0218 (dream-os)

Cut at dream-os `a75c2bd`, 7 October 2026, for server train 11, AFTER PTN's A2-1 (24 paths, which carries
db/migrations/0218_partner_calls.sql; this cut does not ship the .sql). Rung **b268**. No migration of its own. WEB-4 is
the one writer of db/migrations/OUT_OF_ORDER.json.

## What changes
- db/migrations/OUT_OF_ORDER.json: record 218 appended LAST (order is history): 183, 204, 196, 200, 208, 209, 205, 195,
  197, 198, 211, 218. 0218 creates `partner_sends` and `partner_answers` (RLS on; the four service_role grants in the
  same transaction) and adds the foreign key `collab_interest_partner_fk` on `collab_interest` (the partner link 0197 left
  without one). Because it alters an existing table, `collab_interest` is named in stale_for beside the two new tables.
  The eleven earlier rows and the README are byte-equal to a75c2bd's.
- scripts/b267_ce47_web4_cut23_bench.js, amended by label: 0211 is held at its place in history (the eleventh row), not
  as the last; 1.1 reads the first eleven rows.

## Proven
b268 7/0 (the order; what 0218 does; nothing earlier moved; two mutations); clean tip red. No timing cell. b267 7/0,
b266 6/0, b263 16/0. The register readers, the source walkers and e-274's five, both trees: see the card. b15 is red on
this base ALONE until PTN's A2-1 brings 0218's file.

## Walk card
Nothing for the founder to walk: the register is read by the schema formatter, not by any screen. The proof is b15
green on the train's combined tree.
