# TDW_04.5 · P5 — EXECUTOR HANDOVER: THE MONEY LOOP

**Bases (re-derived fetch-first, §11 first motion clean on both):**
`673f645` (dream-os) · `9063547` (dreamos-pwa) · **Role:** executor (Opus per CE-49)
**SQL SCOPE: ZERO, AS CHARTERED.** No migration authored, none shipped, none owed.
`0096`'s successor space is untouched.

---

## §1 — WHAT SHIPPED

### dream-os — 2 new, 3 modified

| File | What |
|---|---|
| `src/lib/vendor/binderTitles.js` | **NEW.** D1's one home: the binder-title hop + `titleOfRecord`. Carries the three-fact refusal of `buildBands` reuse in its own comment, per the CE's direction. |
| `scripts/b0455_money_loop_bench.js` | **NEW.** 73 asserts over the REAL routers. |
| `src/api/vendor/studio/payments.js` | F-04.116's cure + `GET /by-wedding` · `GET /functions` · `GET /suggest`. |
| `src/api/vendor/collab.js` | A3's enabling field: `roster_id` on the connect response, additive. |
| `src/api/vendor/bands.js` | The hop moves out; the import moves in. Behaviour unchanged. |

### dreamos-pwa — 4 new, 2 modified

| File | What |
|---|---|
| `lib/vendor/settleWords.ts` | **NEW.** The vetoed vocabulary + `settle`/`canSettle`/`suggestionLine`/`weddingLabel`. Framework-agnostic, browser-free. |
| `lib/vendor/api/payments.ts` | **NEW.** The three reads. Zero writes. |
| `scripts/settleWords.proof.ts` + `scripts/run-settle-proof.sh` | **NEW.** 37 asserts over the REAL lib. |
| `app/vendor/studio/team-payments/page.tsx` | The `By wedding` board, the loose lane, the function picker, the suggestion. |
| `app/vendor/collab/[post_id]/responses/page.tsx` | A3: the Settle row → bridge door → the stub. |

**`cabinet.js` / `cabinet.ts`: never opened. `eventWrite.js`: 0-line diff — this
sitting writes no calendar. `occupancy.js`, `scrub.js`, every soul/prompt file:
0-line diff. W-1 clean.**

---

## §2 — THE RULINGS, AS BUILT

- **R4+R6 / THE CHOOSER IS DEAD.** One shape: a `team_payments` payout. The stub
  writes no `expenses` row and the bench asserts that it does not — so
  `mark-paid`'s existing auto-create stays the only road into the expense
  ledger and the two cannot disagree. Non-person costs keep the existing
  Expenses surface, as ruled.
- **R1 → B1 / F-04.116 CURED.** `notes` joins the mark-paid update only when the
  body carries it. **"Carries it" is read as a non-empty string** — disclosed,
  because an empty box is somebody's blank input, never an instruction to erase
  a thread they cannot see. Erasure has no caller and is therefore not offered.
- **C1+C2.** The stub asks which function; no pick is lawful and lands in the
  loose lane. The gate does **not** require a function — proven in the proof's §1,
  because forcing a wedding would make the vendor invent one.
- **A3.** The Settle row walks P4's bridge door first. **The roster edge is
  looked up by the counterparty's vendor id rather than taken from the connect
  call** — so a connection accepted *before* this deploy settles exactly like one
  accepted after it. `roster_id` still ships and is read; it is not depended on.
- **D1 / THE PURE MOVE, MECHANICALLY PROVEN.** Of **15 lines removed** from
  `bands.js`, **13 appear byte-identical** in the new home. The **two** residues
  are exactly the two declared in the file's header: the `console.warn` literal
  (hard-coded route name → the caller's `label`) and `title: rec && rec.client ?
  rec.client : null` (moved into `titleOfRecord`'s body as a `return`).
  Command: `git diff --unified=0 -- src/api/vendor/bands.js | grep '^-'` sorted
  against the extracted body, `comm -23`. **`b0450` stays 46.**
- **E1.** The loose lane trails the weddings, P2's learned shape.
- **F1 + THE FOUNDER'S UNIT.** `rate × COUNT(functions)` in the payment's wedding
  scope. `COUNT(DISTINCT event_date)` is struck and the proof asserts the copy
  says *functions* — the word follows the arithmetic it describes.

---

## §3 — PROOF

**`b0455_money_loop_bench` — 73/73 GREEN.** Real routers (`payments.js`,
`collab.js`, `bands.js`), real express app, real http listener, the real
`binderTitles` home. Two doubles, both transport-only: the supabase client
(extended with `.schema()` and `.contains()`) and the auth middlewares by
require-cache injection.

**Non-vacuous by PRODUCTION mutation** (real edits to shipped files, each reverted):

| Mutation | Result |
|---|---|
| restore `notes: notes \|\| null` in mark-paid | **70/3 RED** |
| drop the `state` filter from the by-wedding query | **71/2 RED** |
| send binder-less functions to a wedding instead of the loose lane | **68/5 RED** |
| count DISTINCT event_date (the struck unit) | **71/2 RED** |
| answer absence with `amount_inr: 0` instead of null | **68/5 RED** |
| drop `roster_id` from the connect response | **69/4 RED** |
| break the one home (`titleOfRecord` upper-cased in bands) | **70/3 RED** |
| revert | **73/73 restored** |

**TWO BENCH DEFECTS FOUND BY THE MUTATION TEST AND FIXED, BOTH DISCLOSED:**

1. **A real coverage hole.** Dropping the `state` filter first went **GREEN** —
   the arithmetic was covered twice (query *and* helper) but the **lines** were
   not, and "reconciles by hand" means the vendor counts rows. Two asserts added;
   the mutation now REDs. *Caught by mutation, not by eye.*
2. **Two crash-class results hardened into REDs** (the missing `roster_id` and
   the over-strict gate dereferenced into `undefined`). A crash is weaker
   evidence than a RED; both fixes are the bench's, not the code's.

**`settleWords.proof` — 37/37**, driving the REAL lib. Mutations: gate demands a
function **36/1 RED** · the line says "days" **35/2 RED** · `weddingLabel` guesses
on empty **35/2 RED** · the sheet closes on a failed write **36/1 RED** · the note
gains a space **35/2 RED** · revert green.

**THE FLOOR — my own run, byte-stable, before and after:**

```
dream-os
b0450 46 · b0451 111 · b0452 52 · b0453 71 · b0454 19 · b0455 73 (new)
b0457 assign 30 · crew 21 · gap 10 · crud_crew 19
b0496 11/11 · b0497 ALL GREEN
b0498_fresh_crew_rider 66 + b0498_wa_assign_punct 17   <- the "66+17" pair
b05_m2 4 · b5_wa_door 32 · b6_referent 36 · checker 101
b6_sitting2 20/22 — EXACTLY, per F-04.91

dreamos-pwa
tsc --noEmit whole tree: 0
bands 11 · crewCommit 11 · rosterMint 22 · cityMatch 17
assignmentWords 24 · settleWords 37 (new)
```

Engine build green (`npm run build:engine`) · `node --check` clean on all five
touched dream-os files.

**FLOOR CORRECTION CARRIED FORWARD (CE-accepted at the read-first):** the
assignments addendum seals `assignmentWords.proof` at **16**; it reads **24** at
`9063547`, because that tip's own commit touched both the proof and its module.
The kickoff's floor line carried no counts for `b0453`/`b0451`/`b0497` and omitted
`b0454`; the numbers above supersede it.

---

## §4 — EXECUTOR DISCLOSURES (each vetoable on its own)

1. **THE VIEW CONTROL IS ONE CHIP, NOT A TOGGLE PAIR.** The obvious shape was
   `By crew · By wedding` (P2's `Month · Weddings` pattern). **The second word was
   never put to the founder and this sitting's veto ledger is CLOSED**, so rather
   than mint a vendor-facing string on my own authority the control is a filter
   that is on or off and speaks only the word carrying his YES. **If he wants the
   pair, it is one string away and mine to build on his word — not before.**
2. **"Carries it" = a non-empty string** in F-04.116's cure. A stricter reading
   (`!== undefined`) would let an empty input box erase the thread. Ratify-or-revert.
3. **The picker EXCLUDES cancelled functions; the grouping INCLUDES them.** Two
   predicates, stated in the file's head, because they answer different questions:
   *what may I attach money to now* vs *where does existing money live*. The
   **suggestion follows the GROUPING predicate** so the number and the view it is
   checked in cannot disagree.
4. **The suggestion prefills only an EMPTY amount field.** A figure the vendor has
   already typed is his and is never overwritten by a later pick.
5. **`GET /` on this router still uses `select('*', team_members(name))`** —
   F-04.106's convicted shape, **pre-existing and untouched**. My three new reads
   all use explicit column lists. Named, not silently fixed: it is not this
   charter's, and a sealed money route does not get an unruled edit.
6. **`page.tsx:94` reads `localStorage`** for the cancel call's bearer token —
   pre-existing, house-law-violating, and **not touched**. Named for the floating file.
7. **`paid_via: paid_via || null` has F-04.116's exact shape** and was left alone:
   the ruling cured `notes` by name, and `paid_via` is only ever written at
   mark-paid so no thread dies on it. **Named as the sibling, uncured.**
8. **The stub sheet's close IS the confirmation** on the collab side (`onResult`
   is a no-op there) — the responses page has no toast host, and adding one would
   have been chrome this charter did not carter. The payments page keeps its toast.

---

## §5 — WHAT I DID NOT DO

- **No SQL. No migration. No schema doc edited.** `expenses` still has no
  `linked_event_id` (R4) — **reported, unfixed, by ruling.**
- **No expense row is written by the stub.** The chooser is dead.
- **`eventWrite` was not called and no calendar row was written.** The picker
  READS functions; it never edits one.
- **No live witness is claimed.** No settlement exists anywhere. The live witness
  is the FOUNDER's, declared-not-claimed.
- **Nothing was pushed.** LE never pushes.

---

## §6 — THE FOUNDER'S CARD, RECONCILED

| # | Step | Path |
|---|---|---|
| **0** | *(answered from the record at the ruling — the test vendor is prestige; both gates pass)* | — |
| **0b** | Assign Swati to the Ananya recce (one picker tap) so a wedding-carrying payment exists | day sheet / band pip |
| 1 | Accept a collab response → **Settle up** appears on the card | `/vendor/collab/<post>/responses` |
| 2 | Tap it → pick the function → type the amount → **Log it** | the stub sheet |
| 3 | Team Payments → tap **By wedding** → the subtotal reconciles against the rows on screen | `/vendor/studio/team-payments` |
| 4 | New payment for Swati → pick a Malhotra function → the suggestion appears → **EDIT it** before saving | the Log Payment sheet |
| 5 | A payout with no function picked renders in **Not linked to a wedding** | the same board |

**Evidence I read per step:** 1 — the button on his screenshot · 2 — the
`team_payments` row with `notes = collab:<post_id>` · 3 — his counted rows vs the
subtotal · 4 — the suggested figure vs the saved figure (they must DIFFER, which
is the suggest-never-commit witness) · 5 — the lane's heading above his row.

**Sequencing beyond this sitting is the founder's.**
