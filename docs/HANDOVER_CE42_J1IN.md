# CE-42 · SEAT E · J1-IN · THE INBOUND ARM (F-42.69) — HANDOVER
base `7a18bf6` · migration `0162` · bench `b71` · floor: NAMED BASE, no delta

1. A stranger who received an introduction and replies now lands as ONE lead for that
   vendor (`source='introduction'`, `notes='Met at <where_met>'`) and NEVER as a prospect —
   the branch reads above the STOP arm because `prospects.js:185` opens STOP with
   `findOrCreateProspectByPhone`, so "STOP first" was "mint a prospect first".
2. Her STOP stamps `introductions.stopped_at` (migration 0162) and creates nothing.
   NOT a `status` value: `relayStatus.js:420-425` owns `status` by wamid and a later
   `read` receipt would have silently erased the STOP, or the STOP a `delivered`.
3. F-42.90 cured at the stage door — `recipient_phone` had NO stored form (raw
   `trim()`), which defeated `alreadyIntroduced`'s `.eq` AND 0161's UNIQUE, i.e.
   R-41.11's no-follow-up law itself. Now E.164 through the estate's own normaliser.
   Founder's SELECT at the cut: 0 rows, 0 repairable — the backfill UPDATE is DROPPED,
   never run, and the column was cured before it wrote a bad row.
4. The match is by SUFFIX (`vendorForPhone`'s pattern), because her inbound is bare
   digits and the column has held mixed forms. Two vendors, one handset → MOST RECENT
   row that actually reached her wins; one message is one lead. NO INDEX added — a scan
   of a small table on every marketing inbound, named per the ruling.
5. WITHHELD: `INTRO_NOT_FOUND` / `INTRO_NOT_STAGED` are NOT in this ZIP. Both already
   have a speaker at `src/api/vendor/introductions.js:167` and `:169` (E3's radius),
   neither carries a founder veto, and `assertLineHashes` dies at boot on drift — so
   they would be boot-fragility bought for dead bytes. Returned as a veto sheet.

## DECLARED READINGS (taken openly, not quietly)
- `reachedHer` admits `read` and `sent_no_receipt` alongside the chair's "sent/delivered".
  A `read` row is the LIKELIEST match — she read it, then replied — and excluding it
  would have dropped the ordinary case.
- `leads.source` is NEVER overwritten on the update path. A lead that arrived through
  Discover and later replied to an introduction still arrived through Discover.
- Two leads for one vendor on one last-ten → the newest is updated and the ambiguity is
  logged. `vendorForPhone` refuses to guess in this shape; refusing HERE would discard
  her enquiry entirely, which is strictly worse. F-42.70's register.
- `assistance.js` carries an EXPORT LINE ONLY (`e164FromLastTen`), zero behaviour, so the
  `+91` literal keeps one home (`DEFAULT_COUNTRY:68`, R-41.34).

## e-2 — MY OWN DEFECT, FOUND BY THE FLOOR AND CURED IN THIS ZIP
The first cut of `matchInboundIntroduction` handled the RETURNED `error` and not a
THROW, under a comment promising the lane could never be taken down. Three prospect-lane
benches went ERROR, not RED, on `.like is not a function`. A true-sounding sentence over
code that could not keep it. Both halves are now guarded: the match falls through to
`:184`; the writes return `introduction_failed` and NEVER fall through, because falling
through is what would mint the prospect Fork A forbids.

## FLOOR NOTES FOR THE NEXT SEAT
- 23 RED + 4 REFUSED = NAMED BASE, no delta. The 4 refusals (`b06_gauntlet`,
  `b5_wa_door_smoke`, `bf1_bride_tool_fidelity_bench`, `test-shape`) are clone layout,
  exactly as run-floor's own header warns.
- `b05_arc_m5`, the `b06_m*` cluster, `b06_f0658/f0681`, `b06_forkc` reddened on a SHALLOW
  clone with `fatal: bad revision`. `git fetch --unshallow` → all green. Not a delta.
- ⚠ LESSON 3 HAPPENED AGAIN, to this seat. A floor run killed mid-bench by a harness
  timeout left `src/engine/src/core/tools/recordPrimitives.ts` MUTATED —
  `Rs ${inr(v)}` → `Rs ${v}`, the money register law. Found by run-floor's own
  contamination check, not by any bench, and restored by hand. The cap that manufactures
  a red can corrupt production source; the guard is what caught it.

## OPEN / NEXT
- F-42.96 (seat B): the vendor's push notice. `lead_alert_utility` does NOT carry it —
  it says *couple*, *wedding*, *through your page*, none true of an introduction.
- F-42.91: R-41.131's `enq-` reply half is absent from `prospects.js`; its own charter.
- F-42.92: `createLead`'s exact-equality dedupe over a mixed register; guarded file.
- F-42.93: `introductions.js` header says "Four" vetoed bytes; there are five.
