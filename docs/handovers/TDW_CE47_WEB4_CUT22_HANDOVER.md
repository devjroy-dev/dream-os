# TDW · CE-47 · WEB-4 · CUT 22 HANDOVER · the register's record for 0198 (dream-os)

Cut at dream-os `d5ae450`, 7 October 2026, for server train 7, AFTER CLB's HUB-1 server package (HUB1_SRV_1.zip, which
carries db/migrations/0198_hub_profiles_credits.sql). Rung **b266**. No migration of its own. WEB-4 is the one writer of
db/migrations/OUT_OF_ORDER.json.

## What changes
- db/migrations/OUT_OF_ORDER.json: record 198 appended LAST (order is history): 183, 204, 196, 200, 208, 209, 205, 195,
  197, 198. 0198 creates `hub_profiles` and `hub_credits`, additive, nothing existing altered, and runs after 0216, 0217
  and 0220 are applied, so it fills a hole below the ladder tip. Written from the chair's description of the file; WEB-4
  did not hold 0198's bytes. The nine earlier rows and the README are byte-equal to d5ae450's.
- scripts/b263_ce47_web4_cut17_bench.js 5.1, amended by label: it holds the first nine rows in order (the register goes on).
- NOT here: record 201 (INS PAY-A), when the chair calls it.

## Proven
b266 6/0 (the order; the record's tables and state; nothing earlier moved; two mutations). Clean tip: 3 passed, 3 failed.
No timing cell. Every reader of the register and the 34 source walkers, both trees: exits and output identical, except
b15_schema_register, which is red on this base ALONE. The formatter aborts on record 198 until CLB's package brings 0198's
file, ahead of this cut in train 7. The chair proves b15 green on the combined tree.

## Walk card
Nothing for the founder to walk: the register is read by the schema formatter, not by any screen. The proof is b15 green
on the train's combined tree.
