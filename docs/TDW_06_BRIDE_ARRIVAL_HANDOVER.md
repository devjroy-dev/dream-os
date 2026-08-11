# TDW_06 · THE BRIDE'S ARRIVAL — EXECUTOR HANDOVER

**Base tip: `9f98dfa` (the CE-214 seal), re-derived fetch-first at first motion.**
**Delivery: one ZIP, nine files. Zero pwa bytes. Zero migrations. Zero new copy.**

**R-29.34 APPLIES TO THIS DOCUMENT.** Every claim names where it can be
re-derived. Nothing here is a memory.

---

## §1 · WHAT SHIPPED, BY ACCEPTANCE NUMBER

**A1 — HER REPLY ROUTES TO THE DOORBELL'S VENDOR.**
`vendorInbound.js` gains **Step B.9**, sited by ruling **after Step B, before
Step C** (fork 1(b)). It asks the store the question the router asked *her* on
walk eight, and it does not route — it **pins**: the pinned row collapses Step
C's set to one, and the *same* single-thread terminal that has always handled
one thread runs unchanged. Two new readers on the store
(`coupleDrafts.js`: `standingDoorbellFor`, `approvedForPhone`), both riding
`idx_pending_couple_drafts_phone_open` — the partial index `0117` created for
exactly this, with the purpose in its own migration comment.

Only **doorbell-marked** rows answer routing. A merely `approved` draft means she
was never written to, so she cannot be replying to it, and letting it steer her
would be the estate inferring intent from its own unsent mail.

**A2 — THE WINDOW OPENS AT HER ARRIVAL.** The reader-less `windowJustOpened`
consumer is **retired** from the vendor seat under retire-with-the-reader. It was
not merely unwired: it sat in a function her inbound never calls, and its
`approvedFor(vendor.id)` keyed on a value her arrival does not hold. The shape
was itself evidence of the wrong seat. Forward pointer by **path and symbol**.

**A3 — AUTO-SEND, END TO END.** `sendApproved` extracted and exported as
`sendApprovedDraft` (fork 4(b)); `coupleArrival.js` invokes it from the couple
lane at all four vendor-resolved terminals. Window-first is untouched —
`relayToCouple` still asks `coupleWindowOpen` first, exactly as the vendor's own
turn does. The vendor is told on his own handset, lane-pinned, in registry bytes.

**A4 — THE RECEIPT CHAIN.** `relayStatus.js` is new; `index.js`'s status loop is
now a thin call. `:223`'s blind update — no `.select()`, no count, swallowing
catch — **dies inside it**. A match is counted and read back; a match to nothing
is **named by name**; a non-unique sid is declared. `relayReceipt` is gated on
the witness, so a receipt can never be the first thing that notices a sid the
estate does not hold.

**A5 — REPLACE-NEVER-APPEND.** On a turn the wire guard judged a costume *and*
where the seat produced a store-derived outcome, the relay line **replaces** the
model's prose; the thread row is patched to the same bytes. Wire and thread
agree. **Zero `chat.js` bytes**: the `{ ...result, reply: '' }` replace idiom was
already shipped at the costume patch a few statements below — the estate's own,
not invented here. The append survives for every honest turn.

**A6 — THE STAGING TURN CARRIES ITS OWN BLOCK.** There is no lookup that can find
a row the turn has not written yet, so the cure is that the instruction **stops
being conditional on a row**. `RELAY_STANDING_LAW` ships on every turn;
`pendingRelayBlock` is **byte-untouched** and still rides on top when a row is
open. A store fault now fails to the *smaller truth*, never to silence.

**A7 — HER ARRIVAL IS ON FILE (F-06.179).** The doorbell path reuses a persisting
terminal rather than carrying a second copy of the insert. The still-ambiguous
ask branch is **declared-bounded**, not silently blind: `messages.conversation_id`
is NOT NULL and no vendor is resolved, so her first message cannot honestly land;
`[routing:unfiled_inbound]` is its witness, and her disambiguating reply persists
at Step A where the auto-send fires.

---

## §2 · PROOF

| bench | result |
|---|---|
| **`b06_bride_arrival_bench` (NEW)** | **57/57** — cured tree · **10/57** at pristine `9f98dfa` |
| `b06_relay_hand_bench` | 126/126 (4 labelled amendments) |
| `b06_relay_foundations_bench` | 42/42 |
| `b06_f0613_relay_bench` | 40/40 |
| `b06_forkc_wireguard_bench` | 113/113 (1 labelled amendment) |
| tier · billing · micro · selfserve · combined_cap | 81 · 52 · 23 · 30 · 37 |
| meter · f0555 · f0772 | 28/29 · 22/23 · 158/159 — chartered elder reds |
| `npm run build` (= `build:engine`, strict TRUE) | **EXIT 0** |

**BOTH-WAYS:** 47 of 57 cells go **red** at the uncured charter tip. The 10 that
stay green must: every one asserts *preservation* — the append surviving for
honest turns, `pendingRelayBlock` byte-untouched, `chat.js` unmodified, the
registry bytes unchanged, the ask branch's persist-lessness, and
`coupleWindowOpen`'s own contract. A cell that goes red when nothing was
supposed to change would be the defect.

**THE ELDER REDS ARE PRE-EXISTING**, proven by an independent method: the three
were run at a **separate clone of pristine `9f98dfa`** and produced byte-identical
failure lines. Unmoved by this delta.

**FIXTURE-ABSENT COLUMN, MANDATORY, ALL SEVEN:** A1.2 · A2.7 · A3.2 · A4.4 ·
A5.5 · A6.1 · A7.6. A6.1 is the one this sitting's law was minted for.

---

## §3 · LABELLED AMENDMENTS — RATIFY-OR-REVERT, COUNTS PRESERVED

1. **`relay_hand` §9.1** — asserted the pending block is EMPTY with no open row.
   That emptiness *is* F-06.175. Re-authored: the standing law present, and the
   regression it guarded (never claiming a pending draft with none pending)
   **preserved as its own assertion**.
2. **`relay_hand` §13.6** — drove `windowJustOpened` into the vendor seat, a flag
   the cell supplied *itself*. **The both-sides clause (CE-59):** re-aimed at
   `arrivalAutoSend`, the real caller; the old shape's green is retired, not kept.
3. **`relay_hand` §13.7** — same re-aim, and the assertion **hardens**: nothing
   may go to *her*.
4. **`relay_hand` §13.12** — the witness sweep read two files; the auto-send's
   witness lives in a third. Widened by one named file. **No witness string
   dropped** — and where my code had invented `auto_sent`→`auto_send`, the
   **code** was corrected to the floor's token, not the floor to the code.
5. **`forkc_wireguard` §5.8d** — A5 adds a fourth `replyText` writer. The cell
   caught it, correctly. Re-authored **stricter**: the count moves 3→4 *and* the
   fourth must carry its `relayReplacedCostume` flag on the very next statement,
   so an **unguarded** fourth — one that could replace an honest turn's reply —
   still reds.

---

## §4 · THE SEAT'S OWN DEFECTS, DISCLOSED AT DISCOVERY

1. **AN ORDINAL IS NOT AN IDENTITY.** The first auto-send injection counted
   `inboundRow` close-braces and landed on the **vendor** lane's insert while
   **missing the single-thread terminal walk nine runs through**. Reverted;
   re-done by identity (`sent_by: 'couple'`); asserted 4/4.
2. **THE READ-FIRST'S A5 SPAN WAS TOO NARROW** (`:1637-1646`); the true site is
   `:1629-1690`. Mine, and it survived into a chair ratification.
3. **THE BENCH'S OWN STRIPPER DELETED THE LANDMARKS ITS CELLS NAVIGATED BY.** Six
   cells used comment text; `code()` removes comment lines by design. Diagnosed
   by an **independent method** (a line-span read of the raw file), which
   **exonerated the cure**: the pin block reads `conversations` only, zero
   `messages`, zero `.insert(`. Re-derived on real code tokens.
4. **THE STORE DOUBLE SPOKE A CONTRACT ITS SUBJECTS DO NOT SPEAK** — returned an
   object where three call sites await an array, so `coupleWindowOpen` threw and
   reported `window_check_threw`. F-06.172's class inside the bench. Repaired by
   reading every builder chain the subjects issue, never by adjusting to green.
5. **A FIXTURE-SHAPED CELL, MINE.** A3.5/A3.6 handed the cell a row already
   `expired`, so the arm never ran. The arm fires on a **self-heal**, which is
   the only way it fires in production.
6. **§7.3 CAUGHT A REAL CURE DEFECT.** `coupleArrival.js` named
   `pending_couple_drafts` directly. The floor was right — a reader outside the
   store is a second place the column list can drift. Moved into `coupleDrafts.js`
   as `lastExpiredVendorFor`. **Cured at source; no amendment taken.**

---

## §5 · DECLARED, UNDERIVED, AND OWED

- **NO LIVE CLAIM IS MADE.** This container holds no database and no Meta
  console. Every acceptance above is bench- and source-grade. **The walk-nine
  witnesses are the founder's.**
- **THE TOOLCHAIN.** `package.json` carries `"typescript": "^5.6.0"` — a range.
  The lockfile resolves 5.9.3 and the gate is EXIT 0 there. Under a 6.x
  resolution `moduleResolution: "Node"` becomes **TS5107, an error**, and the
  gate hard-fails. Founder-shelf item; **nothing in this ZIP touches it**.
- **`PUBLIC_SCHEMA.md` IS STALE FOR `pending_couple_drafts`** (zero hits). All
  provenance for that table routes to `0117`/`0118`. No SQL is authored from the
  doc for it.
- **F-06.154's DECLARED MISS** — a bare-format `couple_phone` row would not match
  +E164. Asserted by cell A1.6 rather than discovered in production.
- **THE HONEST NOTE THE CHAIR ORDERED CARRIED:** the doorbell promised her
  「 right away 」. On an **expired** draft that promise breaks **silently** until
  the vendor re-sends. Silence to her is the ruling; the founder may add a
  bride-facing byte later and nothing in this build blocks it.

---

## §6 · NEXT

The founder's fixture `SELECT` runs **first**. The walk-nine card is authored
from his pasted rows and **not before them** — the fixture-state law, and this
sitting does not author a card from §5 of the inherited handover.
