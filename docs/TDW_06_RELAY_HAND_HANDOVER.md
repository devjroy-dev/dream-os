# TDW_06 · RELAY SEAM · SITTING TWO — THE HAND · LE HANDOVER

**repo:** dream-os · **base:** `9d0bc62c52c7e8a0667068cea45e2d384a2a2249` · **role:** LE (never pushes)
**delta:** 3 files modified, 6 new. **Souls and prompt surfaces: 0-line. dreamos-pwa: 0 bytes.**

## WHAT SHIPPED

| subject | file | ruling |
|---|---|---|
| the two relay SIGNALS | `src/engine/src/core/tools/relayCouple.ts` **NEW** | R-29.17 (1b) · R-29.25 (a) |
| registration + signal dispatch | `src/engine/src/core/donna.ts` | R-29.17 |
| the store's ONE lifecycle writer | `src/lib/vendor/coupleDrafts.js` **NEW** | charter · R-29.20 |
| the re-sited send | `src/lib/vendor/relayToCouple.js` **NEW** | R-29.3 · R-29.16 |
| the door's composition seat | `src/lib/vendor/relaySeat.js` **NEW** | R-29.18 · R-29.23 |
| the WA door seat | `src/lib/vendorInbound.js` | R-29.21 (5b) |
| `refusal_reason` | `db/migrations/0118_…_refusal_reason.sql` **NEW** | R-29.20 |
| 60 cells | `scripts/b06_relay_hand_bench.js` **NEW** | ratified |
| one labelled amendment | `scripts/tdw10_combined_cap_bench.js` | see below |

**F-10.113 DIES HERE.** A live-reachable instrument by which a vendor reaches a
bride now exists, and `vendor_relay` — reserved at sitting one with zero writers
— gains its first and only writer at `relayToCouple.js`.

## PROOF

- **60/60 green** at the cured tree. **4/60 green at the uncured tree — 56 red.**
  The four green at BOTH trees are invariants and each is named: **§3.7** the
  integration cell (it reads sitting one's shipped work, which is present at both
  trees and must stay so) · **§5.1** the engine holds no store writer and no
  transport (**required** to be green in both — it is the property this sitting
  must not break) · **§6.1** `relaySeam.ts` byte-identical at origin · **§7.6**
  the corpse's caller set unmoved.
- **Nine production mutations**, each defacing PRODUCTION code, each with an
  anchor-absent DECLARED FAIL: alter the stored body · drop the bytes from the
  SHOW frame · un-pin the lane · force an attempt on a closed window · remove the
  approve-state guard · loosen the E3 name guard · drop expiry-at-read.
- **Gates:** `node --check` clean on all four touched/new `.js`. `npm run build`
  (= `build:engine`, `strict: true`) **EXIT 0**.

## THE FLOOR — paired against the charter as bytes

| cell | charter | this delivery |
|---|---|---|
| relay_foundations | 42 | **42/42** |
| tier | 81 | **81** |
| billing | 52 | **52** |
| micro | 23 | **23** |
| selfserve | 30 | **30** |
| combined_cap | 37 | **37** (after the amendment below) |
| forkc | 113 | **113/113** |
| meter | 28/29 | **28/29** |
| f0555 | 22/23 | **22/23** |
| f0772 | 158/159 | **158/159** |

Also re-run and unmoved: `b06_f0613_relay_bench` (its §2.11 is the cell that
forbids a second `RELAY_DEED_SEAM` in `loop.ts`, and R-29.23 turns on it).

**THE ONE LABELLED AMENDMENT — `tdw10_combined_cap_bench.js` §6.4, RATIFY-OR-REVERT.**
Sitting one re-aimed this cell from `0116` to `0117` and wrote down that a cell
left asserting an old tip *"would have gone red at the next migration and been
'fixed' by deleting it."* That prediction came true one sitting later, at
`0118`. **Re-aimed again, count PRESERVED at 37, teeth kept whole** — 0116 AND
0117 both still asserted present, 0113 still asserted an unwritten hole, the
attributed 0063 duplicate fence untouched.

## SELF-CAUGHT DEFECTS, DISCLOSED AT DISCOVERY

**1. MY SUPABASE DOUBLE RETURNED ONE ROW WHERE PRODUCTION RETURNS AN ARRAY.**
Twenty-four cells failed on the first run and the cause was mine, not the code's:
`.select()` without `maybeSingle()` resolves to a LIST in supabase-js, and my
double collapsed every read to a single row. Every list-shaped production query —
`resolveRecipient`'s lead sweep, `coupleWindowOpen`'s conversation scan — was
being fed a shape no caller could use. **This is sitting one's own double-defect
class recurring one sitting later**, and I record it because the register does not
soften on repetition. Cured by giving the double the real shape and letting
`maybeSingle`/`single` collapse it.

**2. THREE OF MY OWN CELLS FAILED ON FILES *DOCUMENTING* THE LAW THEY GUARD.**
§6.2 and §6.3 read whole files for `refused:` and `const RELAY_DEED_SEAM`, and
went red on `relaySeat.js`'s header — which quotes the other bench's assertion in
order to record WHY the deed does not ride that seam. **A cell that fails when a
file writes down its own reasoning is a cell that forbids the estate from
explaining itself.** Cured by reading executable lines only. §6.1 was worse: it
counted `refused:` occurrences in `donnaLead.ts` and got 3, because the file's own
prose says the word. Re-derived to `refused: refusedOut` returns (2, correct) and
**paired with an independent method with a different failure mode** — a `git diff
--quiet origin/main` on `relaySeam.ts`, which fails on any byte where a sentence
grep fails only on the sentence.

**3. THE SITING OF `relaySeat.js` IS MINE, NOT RULED.** R-29.23 ruled the door
composes; it did not rule which file. I sited the composition in its own module
beside `coupleDrafts.js` and `relayToCouple.js` rather than as a block inside
`vendorInbound.js` (1661 lines, the estate's most-read door), so the PWA-parity
micro has ONE home to call rather than a block to copy. **Declared as a choice,
cheap to move, the chair's to overrule.**

## SCOPE THE CHARTER NAMED THAT WAS *NOT* SPENT — declared, not skipped

- **`loop.ts` is 0-line.** Under arm (a) the tools are Donna's and register in
  `donna.ts`; no transport crosses into the engine, so `loop.ts` needed nothing.
- **F-06.149's twelfth positional parameter on `runDonnaTurn` WAS NOT SPENT.**
  The charter accepted that cost for a transport injection arm (a) makes
  unnecessary. `donna.ts:418`'s signature is unchanged. **The finding stays open
  and its cost stays unpaid** — the options-object conversion remains its own
  unhurried act.
- **`coupleDrafts.js` has FIVE verbs, not the charter's four.** 0117 constrains
  five states and `expired` had no writer under stage·approve·markSent·refuse.
  `expire` exists and is written only by the read that discovers staleness.

## THE DONNA-FACING SENTENCE (ratified disclosure)

Neither signal claims a completed deed. `donna_relay_stage` returns *"Draft handed
over for X — it will be put in front of the owner word for word"*; `donna_relay_send`
returns *"Approval passed on, naming X"*. Both are true at the moment they are
said. **"Staged", "shown" or "sent" would not be**, and a sentence true only if a
later step succeeds is the exact shape of 「 Sent to Priya… 」. Donna/Harvey
context only; outside the slate and outside W-1.

## THE ELEVEN BYTES — founder-vetoed 2026-08-11 「 approve all 」

All eleven ship byte-exact, carrying their veto words in-comment at
`relaySeat.js` (APPROVED-COPY-CARRIES-ITS-HASH). ⑦ ships single (the opt-out
split is on the founder's shelf, not minted). ⑧ ships both forms. **④ and ⑩ are
bytes with NAMED SUCCESSORS and say so beside themselves.**

**THE ④-FORK IS DOCUMENTED AND DARK.** On `window_closed` the path forks on "is
an approved+mapped vendor→bride template available" — today always NO, so byte ④.
**The awaited template is named in-file: `tdw_enquiry_update_couple`** (APPROVED
at Meta, wire witness complete, mapper micro = ZIP 2). The doorbell lands as a
mapper plus a byte-④ successor, never a re-architecture.

## PROPOSED TO THE CHAIR — F-06 chair-free is `.156`

**F-06.156 — THE MONEY-PROVENANCE FLOOR DOES NOT COVER BYTES LEAVING FOR A BRIDE.**
`provenanceHold.ts`'s `MONEY_WRITE_FIELDS` is an enumerated allowlist of five
tool/field pairs, all of them RECORD writes. The relay's signals are absent from
it **by construction, not by oversight** — the floor was built for figures
entering the record and this is a figure leaving for a customer. So a rupee
amount Harvey composed but the vendor never said passes to a bride without
meeting the floor that exists to stop invented figures. **Mitigated but not
cured** by E3: the vendor sees the exact bytes and must affirm them by name. Not
built — unruled arm, and the charter named no such scope.

## FOR THE NEXT SITTING

- **ZIP 2 is the doorbell rider** (R-29.24), from this same hand, after this banks.
- **The PWA-door parity micro is chartered** (R-29.21) and owes byte ⑩'s retirement.
- The `brideNudge`-fold micro and the bride→vendor mapper micro both share
  `vendorInbound.js` with this delivery — one file never takes two hands.
- **Ladder: 0118 is written. 0119 is free.**
