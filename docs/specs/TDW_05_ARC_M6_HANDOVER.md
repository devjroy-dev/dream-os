# TDW_05 — COUPLE-LANE MECHANICAL ARC · MOVEMENT M6 · HANDOVER (THE ARC'S LAST)
**Base `a80dac8`. §11 first motion clean. Two §0.2 reports filed at read-first; both ruled before a byte moved.**

## 1. C9(a) — THE COUPLE PLANE HAS ONE WRITER
**NEW `src/lib/coupleEventWrite.js`.** Seven writes routed: `brideEngine` :574 insert · :1044 update · :1072 delete + `api/couple/events.js` :65 insert · :138 update · :162 update(state) · :183 delete. **The two SELECTs stay** (:902, :26) — sole-**WRITER**, never sole reader, stated in the home's header so nobody widens it by analogy.

**A PURE MOVE.** Each function returns supabase's `{data, error}` verbatim, so every call site keeps its own error handling byte-identical. `couple_id` is re-asserted on every update/delete WHERE — an update keyed on id alone would let one couple edit another's row. The gate **mirrors `eventWrite.js:462` by citation**. **Occupancy DEFERRED-NAMED** in the header: vendor-supply semantics, not ported, not implied. **`eventWrite.js` 0-line, asserted.**

## 2. F-05.51 — FOUR DOORS, NOT ONE
`:378 · :486 · :579 · :702` all routed through `inboundRow`. The charter named one; **the world was a set of four** — my own banked class at CE-63, caught by the census the trio discipline demands. Curing the filed site alone would have shipped a green over three live holes.

## 3. THE OTHER RIDERS
**F-05.49** — `channel: 'web'` on the sanctuary pre-insert. **Derived, never invented:** `'web'` is the estate's own second channel value, live at eight sites; the column is `text NOT NULL` with no CHECK. No founder SELECT was needed and none was asked for.
**REJECT-LOUDLY** — `resolveAgentForVendor` compares the passed id to the vendor's own `users.auth_user_id` and throws named. The throw names the value, the expected value, F-05.47, and the fix. **No live subject** (M3 cured the only deviant); §4 drives it synthetically and says so. §4.2 proves a correct caller gets *past* the fence.
**f0532 display strings** — three sites, zero assertion changes, count 9 untouched.
**prospectCopy holding_line** — the founder's bytes, pasted verbatim, labeled at site with the promise-with-no-machinery class named.

## 4. 🛑 THE ARC'S THIRD FLOOR MOVE — UNCHARTERED, DISCLOSED, RATIFY-OR-REVERT
`b5c_prospect_lane_bench` matched the holding line on `/give me a moment/i` — **the very promise the founder's rider removes.** Left alone it forbids the copy he just ruled in. **Count preserved, amended in place, labeled**, and **re-aimed at `PROSPECT_COPY.holding_line` itself** rather than a phrase copied into the bench — so it can never drift from the shipped bytes again. The CE chartered two floor moves; this is a third, forced by §4's rider. **Named, not slipped in.**

## 5. THE CENSUS QUESTION — ANSWERED, AND IT IS A TRUE HOLE
**The vendor MEDIA path never reaches `inboundRow`.** `vendorInbound:230` writes the audit PAIR (inbound + outbound) as bare objects, and the branch **`return`s before `:790`**, the file's only `inboundRow` call on the vendor lane. So a redelivered media webhook has **no durable dedupe** — only the per-process LRU, which a restart empties. **A redelivered calendar image is a double OCR turn today.** Vendor lane, not F-05.51's couple set. **Reported, not cured** — the chair homes it.

## 6. PROVEN
`b05_arc_m6_bench` **20/20**, five production mutations RED. **Floor: 23 harnesses, all rc=0** — f0532=9 · arc_m4=18 · arc_m5=11 · arc_m1=53 · arc_m2=27 · arc_m3=11 · crons=48 · sendwa=55 · prospect=47 · checker=101 · all others unchanged. W-1 clean. `node --check` clean on all six touched sources. SQL: **zero** — no migration, no founder-run SQL, 0101 unreserved.

## 7. THE ARC IS BUILT
M1–M6 complete. **The founder's arc-seal smoke card walks ONCE, now.**
