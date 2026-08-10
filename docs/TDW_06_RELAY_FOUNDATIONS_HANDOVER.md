# TDW_06 · RELAY SEAM · SITTING ONE — THE FOUNDATIONS · LE HANDOVER

**repo:** dream-os · **base:** `16a407177571d305ddfb38c67b0cd48d57d38d95` · **role:** LE (never pushes)
**delta:** 4 files modified, 3 new. **Souls and prompt surfaces: 0-line. dreamos-pwa: 0 bytes.**

## WHAT SHIPPED

| subject | file | ruling |
|---|---|---|
| W-A merge-not-drop (F-06.151) | `src/agent/engine.js` | charter |
| W-B provenance survives (F-06.152) | `src/agent/engine.js` | R-29.13 arm (a), assembly-time |
| Fork 4 delimiter `"\n\|\n"` | `src/agent/engine.js` | R-29.15 arm (a) |
| W-C the couple-side predicate | `src/lib/vendor/coupleWaWindow.js` **NEW** | R-29.8 arm (d) · R-29.11 · founder 1-a |
| W-D the pending-draft store | `db/migrations/0117_pending_couple_drafts.sql` **NEW** | R-29.14 arm (c) · founder 24h |
| the defused-island label | `src/lib/vendor/replyToCouple.js` | R-29.4 |
| the declared-not-folded disclosure | `src/agent/brideNudge.js` | R-29.8 |
| 41 cells | `scripts/b06_relay_foundations_bench.js` **NEW** | ratified |
| one labelled amendment | `scripts/tdw10_combined_cap_bench.js` | see below |

**THE HAND IS NOT BUILT.** No send path, no transport injection, no SHOW step, no
confirmation model, no writer for `pending_couple_drafts`, no caller for
`coupleWindowOpen`. Those are the next sitting by charter.

## PROOF

- **41/41 green** at the cured tree. **6/41 green at the uncured tree — 35 red.**
  The six that pass at BOTH trees are invariants, not vacuous cells, and each is
  named: §1.2 alternation · §1.4 role-boundary split · §1.5 the regression cell
  (an already-alternating history must be byte-identical to the pre-cure shape —
  it is REQUIRED to be green in both trees) · §2.4 non-relay rows carry no marker
  · §2.5 the `:297-301` premise · §2.6 the ternary is the sole role source.
- **Five production mutations**, each defacing PRODUCTION code, each with an
  anchor-absent DECLARED FAIL so a mutation that cannot apply can never pass
  silently: restore the drop-reduce · strip the marker · single-row scan ·
  `conversation_id` keying · (0117's CHECK is defaced by editing the migration
  the cells parse).
- **§1 and §2 drive the REAL `runCoupleAgenticTurn`**, not exported helpers.
  `engine.js` still exports `{ runCoupleAgenticTurn }` alone — deliberately
  unchanged, because widening it would falsify that file's own F-05.56 island
  label at `:629`, which is outside this sitting's write radius.
- **Gates:** `node --check` clean on all five touched `.js`. `npm run build`
  (= `build:engine`, `strict: true`) **EXIT 0**.

## THE FLOOR — paired against note 28 §4 as bytes

| cell | note 28 §4 | this delivery |
|---|---|---|
| tier | 81 | **81** |
| billing | 52 | **52** |
| micro | 23 | **23** |
| selfserve | 30 | **30** |
| combined_cap | 37 | **37** (after the labelled amendment below) |
| forkc | 113 | **113** |
| meter | 28/29 | **28/29** |
| f0555 | 22/23 | **22/23** |
| f0772 | 158/159 | **158/159** |

**THE ONE LABELLED AMENDMENT — `tdw10_combined_cap_bench.js` §6.4, RATIFY-OR-REVERT.**
The cell asserted `0116` is the ladder's tip. 0117 was RESERVED at this sitting's
charter and lawfully written, so the old assertion is no longer the truth to
assert. **Re-aimed, not deleted; count PRESERVED at 37; teeth kept whole** — 0116
still asserted present, 0113 still asserted an unwritten hole, the attributed 0063
duplicate-set fence untouched. Precedent: `b07_p5_bench`'s M-INVERTED §7.6.

**OBSERVED, INHERITED, NOT MINE:** `b05_p4_crons_bench` is **47 passed / 1 failed**
at BOTH the cured and the uncured trees, same cell (§6.6, the TZ wall-clock cell).
`brideNudge.js`'s only change is a header comment. Not on note 28 §4's nine;
recorded so nobody re-discovers it.

## SELF-CAUGHT DEFECTS, DISCLOSED AT DISCOVERY

**1. TWO OF MY OWN MUTATION CELLS WERE VACUOUS ON FIRST RUN AND I CAUGHT IT.**
§3.11 (m1) passed on a `throw` I had planted at the end of the probe — it would
have gone green over ANY tree. §3.12 (m2) passed because my supabase double only
recorded a `counterparty_phone` filter and ignored every other column, so
re-keying the production query to `id` changed nothing the double could see.
**A guard that survives the defacement of the thing it guards is not a guard, and
both of these did.** Cured by rebuilding the double to apply `eq`/`in` GENERICALLY
as real predicates over real rows, on whatever column production names, and by
deleting the planted throw so m1 turns on an observable verdict flip (fresher
inbound 1h vs older 30h — the founder's own 47-second geometry, one order of
magnitude apart so the flip is unambiguous). Both cells now bite.

**2. THE SITING OF `coupleWaWindow.js` IS MINE, NOT RULED.** R-29.8 ruled arm (d)
and the contract; it did not rule the path. I sited it at
`src/lib/vendor/coupleWaWindow.js`, adjacent to its posture mirror `waWindow.js`,
so the vendor lane's two window predicates live together and no new directory is
minted for one file. **Declared as a choice, cheap to move, the chair's to
overrule.**

## OBSERVED LINES FOR THE SHELF — not this sitting's to touch

- `db/migrations/0002_agent_substrate.sql` ends with
  `alter publication supabase_realtime add table pending_actions;`. That table is
  **founder-witnessed absent from production (2026-08-11)**, so the publication
  line now points at a dropped table. Harmless, possibly already gone with the
  drop. Not touched.
- `counterparty_phone` is not format-normalized estate-wide (the founder's paste:
  `prospect_marketing` bare, `couple_thread` +E164). The allowlist keeps it out of
  this predicate's blast radius and §5.1 asserts the contract. Whether it files as
  a finding is proposed at the seal, not spent here.

## FOR THE NEXT SITTING (THE HAND)

- `coupleWindowOpen` has **no caller**. Wiring it is the hand's.
- `pending_couple_drafts` has **no writer**. Staging is the hand's.
- `RELAY_SENT_BY = 'vendor_relay'` is minted here and **read** here. The WRITER —
  the row a relay actually inserts — arrives with the hand. Until then the marker
  is live and correct and fires on zero production rows.
- `replyToCouple.js`'s label points at all four re-siting destinations by path and
  symbol. Read it before writing the hand.
