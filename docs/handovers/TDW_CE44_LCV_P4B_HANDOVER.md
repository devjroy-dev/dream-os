# repo: dream-os @ 85fda3dc1af715a004f6acdf26ceb3d8b2beaddc (base) · dreamos-pwa @ 320ad7e39f7e70e0fb4be6b37b84b4299a3c8307
# closed (docs only, C-44.1) on dream-os @ 66563f93239321c4fd99d734915cc5ea2286fa5c
# TDW · CE-44 · SEAT LCV-1 · LC-VICTOR P4b · THE ENGINE-BORN WRITE HANDS' RESULT · HANDOVER

**Rung b89.** Code, under the W-1 lift the chair issued for P4b only, so it verifies on the founder's own floor end
to end (`run-floor.sh --delivery scripts/floor-manifest-ce44-lcv1-p4b.txt --check`), installing and building from
the applied tree first.

## 1 · What P4b is, as ruled

The engine-born WRITE hands return a structured result beside their display, so that at P5 the door, running a hand
from the listener's request through `src/lib/executeAndPatch.js` (which returns the WHOLE outcome of
`executeRecordTool`, `:12`, `:20`), reads what happened from `ToolOutcome.result`, never from `display`. **Donna's
voice does not move: every `display` expression is byte-identical.**

**Ruled out, by the chair, with its reason:** `loop.ts` and `donna.ts` carry a result back through Victor's chain,
which R-44.18 removes from the working rooms; building a carrier there teaches machinery a new trick on the eve of its
deletion. So there is no carrier key, no sixth argument to `record()`, and the name collision the pre-cut note found
never arises. `src/lib/undoContract.js` and `chat.js`'s `chipFiling` are NOT touched: their patterns serve the chain's
chips until the chain leaves, and they leave with it. `refused:money_held` (`donna.ts:658`) is not P4b's; at P5 the
door applies `checkMoneyProvenance`'s rule to her own words itself.

**Order:** by the read-first's inventory, money and lifecycle first, because the acts-heard count (26 heard rows, 19 to
20 September) heard none of these hands.

## 2 · The hands and their closed sets

Eighteen write-hand names (`donna_unarchive` beside `donna_retrieve`), each set read line by line from the engine at
`85fda3d`; every set also carries `refused:exception` and `refused:result_unbuildable`. `writeFields`' four returns give
`created`, `updated` and `refused:write_failed` to every hand that writes through it.

| Hand | Codes beyond `writeFields`' |
|---|---|
| `donna_money` | unchanged · replaced · refused: unreadable_amount, missing_direction, not_found |
| `donna_money_edit` | unchanged · corrected · refused: missing_binder, not_found, unreadable_amount, nothing_to_change |
| `donna_date` | unchanged · refused: not_found |
| `donna_client` | refused: v12 |
| `donna_lead` | lead_created · lead_updated · unchanged · refused: no_owner, read_failed, write_failed (its own writer) |
| `donna_stage` | refused: missing_stage, v12 |
| `donna_note` · `donna_note_append` | refused: missing_note (and missing_binder for the append) |
| `donna_phone` · `donna_doc` · `donna_write_reasonforaction_append` | `writeFields`' only |
| `donna_edit` | unchanged · refused: missing_binder, money_not_here, nothing_to_change, not_found |
| `donna_repeatfollowup` | refused: missing_binder, missing_date |
| `donna_hide` | hidden · refused: missing_binder, write_failed |
| `donna_retrieve` · `donna_unarchive` | retrieved · refused: missing_binder, write_failed |
| `donna_merge` | merged · refused: missing_ids, same_record, unreadable_amount, partial |
| `donna_split` | split · refused: missing_binder, not_found, unreadable_amount, nothing_to_change, partial |

`ids` carry `record_id`, `lead_id`, `retired_id` (merge) and `source_id` (split) where the engine holds them. No write
hand names a door line yet (P5 gives the bytes).

## 3 · The lift, and the one line it narrowed by

`snapshotTypes.ts` (+12 −0): the `WriteResult` type above `:82`, and `result?: WriteResult | null` on `ToolOutcome`
after `:130`. `recordPrimitives.ts` (+48 −44): `writeFields`' four returns and the case returns named in the pre-cut
note, each gaining a `result` key; pass-throughs keep `writeFields`' result. `donnaLead.ts` (+8 −7): its eight returns.

**Narrowed, by the chair's ruling (option A):** `recordPrimitives.ts:794`, `return { display: V13 };`, is left byte for
byte. V13 fires only when the booked set is supplied, and the door's path (`executeAndPatch.js:12`, three arguments)
carries none, so a result code there would describe a refusal the door's path cannot produce; and b84's mutation M17
anchors on that exact compiled text. `refused:v13` left `donna_money_edit`'s set. **b84 is UNAMENDED and green.**
V12's two return lines (`:751`, `:773`) keep their result keys: no bench anchors on them (b84's `:659` anchors the V12
CONDITION line, which P4b does not touch), and b84 is green with them.

**For the top of P5's read-first (the chair's):** V12 at `:751` and `:773` also fires only when the booked set is
supplied, which only Victor's chain does. When the door runs `donna_client` or `donna_stage` through `executeAndPatch`,
neither control fires. R-43.5 and R-43.11 must then be enforced BY THE DOOR on its own path, by its own check on the
booked fact it already builds (`bookedFacts.js`) or by passing the set; which, is P5's to weigh.

## 4 · How "display unchanged" is pinned (C-44.7)

**The predicate:** in the three engine files, every removed line reappears as an added line identical once the
`result:` key is taken out, and nothing else is added besides the new type. On the working diff: `recordPrimitives.ts`
44 removed, 44 restored; `donnaLead.ts` 7 removed, 7 restored. b89 measures it on the FIXED range
`85fda3d..<the commit that added b89>` once that commit exists (class a), and on the manifest's three engine paths at
delivery (class b).

**Driven, per hand, on the compiled engine:** every write hand called with the same fake database at BASE (built from
git at `85fda3d` into a cache) and NEW; every display identical; every result read by `handResult.fromOutcome()` to a
code in that hand's set. If `85fda3d` is absent from the clone, the cell FAILS naming it.

## 5 · Total

The engine builds plain object literals from values it already holds; nothing it adds can throw. The door's reader,
`handResult.fromOutcome(hand, outcome)`, is TOTAL: a missing or malformed result, a code outside the hand's set, or an
`ok` that disagrees with the code yields the minimal frozen result. **The hand position is guarded too (e-16):**
`minimal()` takes the hand through a guarded name conversion inside its own `try`, falling back to a frozen result
with hand `'unknown'`, and `make()` guards `hand` on a new first line, its `try … catch` line byte for byte as before
(b88's M5 anchors there). The fuzz table is hostile in the outcome AND the hand position: 450 calls, zero throws; a
mutation restoring `minimal()`'s old unguarded line turns it red.

## 6 · Files

| Path | Against `85fda3d` |
|---|---|
| `src/engine/src/core/snapshotTypes.ts` | +12 −0 |
| `src/engine/src/core/tools/recordPrimitives.ts` | +48 −44 |
| `src/engine/src/core/tools/donnaLead.ts` | +8 −7 |
| `src/lib/vendor/handResult.js` | +72 −5 |
| `scripts/b88_lcv_p4a_bench.js` | +5 −2 (cell 1.1 only, by the chair's ruling) |
| `scripts/b89_lcv_p4b_bench.js` · `scripts/floor-manifest-ce44-lcv1-p4b.txt` · this handover | new |

## 7 · Errors owned

- **e-16.** The reader was reported TOTAL with its fuzz table extended, but the table put hostile values only in the
  OUTCOME position. The chair called `fromOutcome` with a hand whose `toString` and `valueOf` throw: 6 of 6 threw,
  inside the catch itself, because `minimal()` converted the hand unguarded (`hasOwnProperty.call(CODES, hand)`).
  Unreachable today, since every caller passes a literal hand name; but the contract is TOTAL and P5 builds on it.
  e-12's class again: a "never throws" no cell exercised from that side. Cured as §5 says.

- **e-15.** b88's cell 1.1 pinned `handResult.CODES` to exactly P4a's three hands, a live module's key set, C-44.7's
  class; the sweep before P4a's re-cut found three places in b88 and missed this one. Amended to presence only, with a
  mutation proving it reddens when a P4a hand is missing. b89 was checked for the same class before the cut: no cell
  pins the count or the key list of hands.

## 8 · The walk card (P4b)

**Nothing a vendor reads changes, and nothing Donna reads changes.** P4b adds a result beside what the engine already
says; no reply, chip, line or tool description moves. So the card is the floor and the benches, and one read of the
panel: none. (Under C-44.8, a card that asks him to look for a change that does not exist would be a guessing game.)

## 9 · P4b's close: landed, and the lift lapsed

**Landed** at `66563f93239321c4fd99d734915cc5ea2286fa5c` (parent `85fda3d`; eight paths as the manifest, byte-identical to
`TDW_CE44_LCV1_P4B_dream-os_85fda3d_r3.zip`, sha256 `faf18bec3a549567b2f3d21d5267a37c546435d24dfe144a28d6e5c4d2759559`). On
the founder's Codespace: step 0 printed `ONLY r3 REMAINS`; Block 1's hash gate passed and the guard read `SAFE TO APPLY —
dream-os · main · 85fda3d · clean`, then `APPLIED: 8 files from the manifest`; Block 2 read `b89 · 35 pass · 0 fail`, `b88 ·
79 pass · 0 fail`, `b84 · 130 ok, 0 failed`, GREEN; the floor read `[F-14.16] declared files unmoved — set and contents
both verified.`, `FLOOR = NAMED BASE, no delta  (refusals, not in base: 4)`, FLOOR GREEN. Railway ACTIVE on the commit. b89's
display cell now measures the fixed range `85fda3d..66563f9` (C-44.7, class a).

**The lift, as used, exactly:** `src/engine/src/core/snapshotTypes.ts` (the `WriteResult` type and one optional `result`
field on `ToolOutcome`); `src/engine/src/core/tools/recordPrimitives.ts` (`writeFields`' four returns and the case returns
named in §3, less `:794`, V13, left byte for byte by the chair's option A); `src/engine/src/core/tools/donnaLead.ts` (its
eight returns). Nothing else under `src/engine/` moved. **The lift LAPSED with this commit** (the chair's ruling): the
engine, every soul and every lens file are closed again; a later packet needing an engine byte names its exact lines in a
pre-cut note and asks.

**P4 is complete:** every record-writing hand, door-born (P4a) and engine-born (P4b), returns a structured result in a
closed code set through a TOTAL reader; every display byte Donna's model reads is unmoved.

## 10 · C-44.9, from the founder's words

The founder, verbatim, 2026-09-20: *"can you ask LC not to use the same file name when he is regenerating a package or a
packet"*. **C-44.9, standing law: a re-cut never reuses a file name.** The first cut is `<NAME>.zip`, then `<NAME>_r2.zip`,
`_r3.zip` and so on, and the message says which r it is. Why it is not cosmetic: P4b's second cut reached the chair as
"…85fda3d__1_.zip" because the browser renamed the duplicate; an apply block names the original file exactly, so it would not
find the "(1)" copy, and if a REJECTED cut still sat in his Codespace root under the original name, it would apply that one;
`base_guard.sh` checks the tip and the tree, not which ZIP is unpacked. **With it, every apply block verifies the ZIP's
sha256 BEFORE unzip, inside the same `&&` chain,** against the hash the chair confirmed, printing the hash it found on a
mismatch and taking the frozen STOP line; and the walk's first step clears any older ZIP of that name family from his
Codespace root, keeping only the confirmed one.

## 11 · Findings, rows and counts recorded at P4b's close

**The acts-heard count** (read-only, all vendors, from the first row carrying `meta.listener`), as the founder ran it: heard
rows **26**, from 2026-09-19 21:07:38 UTC to 2026-09-20 05:29:40 UTC; `listener_error` **0**; request null **0**; heard with
no acts **10**. Acts, all `claude-haiku-4-5-20251001`: `invoice · task · pwa` 9; `find · search · whatsapp` 3; `find · search
· pwa` 2; `relay · task · whatsapp` 1; `whatsdue · search · whatsapp` 1. The act rows sum to 16, the heard rows with acts.
Thin and test-shaped (the nine invoices are P4a's walk and its retries); re-run at every read-first. **Ruled from it:** the
lookups (`find`, `whatsdue`, `history`, `tally`) are NOT in P4; under R-44.18 they become door renderers at P7.

**F-44.49 (for P5): MINTED is not SERVED.** `generateInvoiceForBinder` (`src/api/vendor/invoices.js`) has four outcomes: a
package invoice with its PDF is served; a package invoice without one is rendered (the existing invoice gets its PDF now); a
current non-package invoice is served or rendered the same way; only when none is current does `createInvoice` mint. All four
answer `{ ok, invoice_number, pdf_url }`, so the fact dies at the return, and `handResult.js`'s invoice set knows only
`minted`. On P4a's walk, "Re-issue the same invoice for Walk45" took the served path and the chip read "Invoice minted:
TDW/DEV440/19". **Victor's prose on that turn, verbatim, as an exhibit for P5:** "Invoice re-issued for Walk45 — Rs 80,000,
wedding 25 September 2026. The paper is down." **Cure ruled for P5, not built:** an additive `made` on each return, `minted` or
`served` (rendered folded into served); the invoice set gains `served`; each its own line key when the invoice sentence gets
its one home (F-44.48). Door files.

**F-44.50 (LC-3): the leads row's cross-chip is matched by phone alone.** "Dev Test 3i b" showed NEW and "In your books ·
Confirmed booking". The rows, as the founder ran them, `leads_named` 1 on every row: (a) Dev Test 3i b, phone tail
`9111111111`, `new`, `her_binder_id` null, created 2026-09-17 16:23:48 UTC; (b) ONE binder on her phone, **Walk45**,
`confirmed booking`, `29ac835e…`, created 2026-09-20 05:27:39 UTC, `hidden` false, `leads_behind` "Walk45 (booked)",
`after_v12` true; (c) one other lead on her phone, **Walk45**, `booked`, `binder_id` `29ac835e…`. **V12 holds:** the only
booked-stage binder opened after `c424e39` has its booked lead behind it. **The fault is the display's**
(`app/vendor/(shell)/leads/body.tsx`, `binderByPhone`, `phoneKey`): two leads on one number show one booking twice.
**Cure ruled for LC-3:** match by the lead's own `binder_id` first; fall back to the phone only where `binder_id` is null, and
then only to a binder no other lead already claims by `binder_id`. Recorded: 91111 11111 is a third shared test number beside
R-43.17's two; it reaches no handset (R-43.18) and goes with the clean-out before the first real vendor.

**The door-path fact (for the top of P5's read-first):** V12 (`recordPrimitives.ts:751`, `:773`) and V13 (`:794`) fire only
when the booked set is supplied, which only Victor's chain does; `src/lib/executeAndPatch.js` calls `executeRecordTool` with
three arguments. When the door runs a hand from the listener's request, neither control fires, so R-43.5 and R-43.11 must be
enforced by the door on its own path. `checkMoneyProvenance` (`donna.ts:651`) likewise runs only in Donna's turn; the door
applies its rule to her own words itself.

## 12 · Errors owned at P4b's close

- **e-14.** The acts-heard count's SELECT was sent to the chair and, in the same message, a card told the founder what he
  would see when he ran it; in a message he relays, a runnable text beside a card reads as an instruction, and he ran it
  before the chair's confirm. The form since: runnable text awaiting the chair's read goes under a first line "FOR THE CHAIR
  ONLY: NOT TO BE RUN" with no card for him; the card follows the confirm.
- **e-15, e-16** (§7 above).
- **The chair's c-44.22 to c-44.24** stand in P4a's handover, §11, landed at `85fda3d`.

---

Trust evidence over narrative, including this file. Sequencing beyond this sitting is the founder's.
