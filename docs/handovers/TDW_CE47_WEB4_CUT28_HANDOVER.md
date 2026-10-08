# TDW · CE-47 · WEB-4 · CUT 28 HANDOVER · record 203, the two time-zone cures (F-44.426), one line (dream-os)

Cut at dream-os `dae04b0` (server train 13 landed), 8 October 2026, for server train 14. No migration of mine: 0203
rides INS's package (F-44.420). Rung: b269, extended by label (§6). Seven paths.

## 1 Record 203 (from its bytes)
The bytes: INS_F44420_SERVER_r1.zip, sha256 6dca6769…6d46, equal to the chair's. 0203_record_updated_at_triggers.sql,
sha256 770bc39f…7336, was read whole. Its claims hold against the repo: `set_updated_at()` is at 0001 :83, and
`invoices_set_updated_at` is at 0008 :66-67.
The record is appended last, after 219. The register now reads 183, 204, 196, 200, 208, 209, 205, 195, 197, 198, 211,
218, 201, 202, 219, 203.
- The record names both triggers that 0203 writes (`invoices_updated_at` and `payment_schedules_set_updated_at`, each on
  `set_updated_at()`) and the old name it drops (`invoices_set_updated_at`).
- stale_for: "none: the snapshot carries no triggers". state: "NOTHING OWED: removed with the others at the next PAIR
  regen". Both are as the chair ruled. The reason holds: public_constraints_dump.sql :72 says triggers are absent from
  the snapshot on purpose.
- The record must still exist, because 0203 fills a hole below the ladder tip and the formatter checks for it.

## 2 F-44.426: the two benches that depended on the host's time zone (the chair's ruling: mine, by label)
- tdw15_p3_daystogo, `utcBasisDays`: `setHours` is now `setUTCHours`. The helper stands for the day count on a UTC host.
  It took the HOST's midnight, so under IST it counted 179 where the IST door correctly says 178 (§3.3). §3.2 still
  shows the two counts disagreeing at 01:30 IST (177 against 178), as it must.
- b92_lcv_p6a 10.14: the cell now expects `new Date('227-03-15').toISOString().split('T')[0]`, which is the date
  createLead derives on the host that runs it. A three-digit year is not ISO, so JavaScript reads it as host-local time.
  The mutation still files a year-227 lead; only the expected day was wrong east of UTC.
Production code is not touched. No TZ export was added to the floor.

The five-zone table, both benches, exit codes:
| Zone | tdw15, dae04b0 | tdw15, cut 28 | b92, dae04b0 | b92, cut 28 |
|---|---|---|---|---|
| UTC | 0 | 0 (13/0) | 0 | 0 (173/0) |
| Asia/Kolkata | 1 | 0 (13/0) | 1 | 0 (173/0) |
| Europe/London | 1 | 0 (13/0) | 0 | 0 (173/0) |
| America/New_York | 0 | 0 (13/0) | 0 | 0 (173/0) |
| Asia/Tokyo | 1 | 0 (13/0) | 1 | 0 (173/0) |
The dae04b0 columns were measured on bcdb364. Neither bench changed between bcdb364 and dae04b0.

## 3 Proven
- **b269:** 20 passed, 0 failed. §6 is new: the record and what it says, plus three mutations (0203 marked OWED; 0203
  placed before 0219; the record removed). Each reddens 6.1. The cells amended by label are 1.1, 5.1 (219 held at the
  fifteenth row) and 5.4.
- **The other register readers:** b268, b267, b266 and b263 each exit 0.
- **On dae04b0 with this cut alone:** b15 is red, as expected ("names `0203`, which has NO .sql file"). b128, b91,
  b07_f0789 and bOB_* ×4 exit 0. b146 and b261 (the domain room) exit 0.
- **On dae04b0 with this cut AND INS's real 0203 beside it:** b15, b128, b91, b07_f0789 and b269 all exit 0.

## 4 R-47.1
| Old | New |
|---|---|
| The search needs a name. (domain.js, cut 26) | Type a name to search for. (the chair's ruling of 8 October, my first proposal) |
No bench pins this line, and none pinned the line before it.
No line is in "the founder's lines" table this cut. The review-request message is unchanged and waits on his word.

## 5 Walk card
There is nothing new for the founder to walk. The search line is the answer to a domain search sent with an empty
box (GET /domain/search with no name). It comes before the plan and gate checks, so any vendor can see it. The
register and the two benches are read by code, not by any screen.
