# TDW_06 — FLOOR RE-PIN MICRO · EXECUTOR HANDOVER

Base: `6c212ef` (re-derived at origin, fetch-first, at delivery). Delta: **8 files** —
seven under `scripts/`, plus this handover. **Zero production bytes. W-1 absolute, held.**
Findings travel unnumbered from this session; F-06.53/54/55/56/57 were minted by the chair.

---

## 1. WHAT SHIPPED, BY FINDING

### F-06.53 — the base-pinned W-1 cells convicting the ruled M-4 arc

Three cells asserted "no soul byte has moved" with a pinned base and a **live far end**,
so each of them convicted `daacf4f` · `c35f84f` · `2b89b5c` — the founder-vetoed M-4 arc.
Derived by `git log <base>..origin/main` over each cell's own pathspec: those three
commits and no fourth. (`c736a7e` touches only `donnaSoul.ts`, which is leg 2's file and
correctly outside leg 1's list — the chair's precision correction, adopted.)

**`b05_f0550_ping_drain_bench.js` §6.1 leg 1 → RANGE-PINNED `2028a0d..5335bb2`.**
The estate's own §6.6/§6.8 precedent (`b06_m1_bench:288` — *"the far end is M-1's own
seal, not the live tree"*). This micro's charter was never "no soul byte ever moves
again"; it was "F-05.50(b) touched no soul byte" — a historical fact about this micro's
own base and its own seal, unmovable by any later push. **Leg 2 is deliberately left
live-pinned at `2028a0d`, byte-untouched** (CE ruling §1): the donnaSoul-LOSSLESS
tripwire is a genuinely live guard, green at 2+/0−, and a rider that may only ADD is
worth watching forward. Named residual: it reds on any future donnaSoul **deletion** —
which is the point of it.

**`b05_arc_m5_bench.js` §4.1 → RANGE-PINNED `8560ca0..a80dac8` + PATHSPEC-SCOPED.**
Two defects in one move. The referent, as above. And a substring hazard the chair ruled
dead in the same breath: `out.includes('brideTools')` over a **full-tree** name-only diff
would fire on any future path containing that text — a `brideToolsHelper.js`, a doc named
for the file. `arc_m4` §4.1's own amendment had already named and fixed this; the cell
inherits the fix.

**`b05_arc_m4_bench.js` §4.1 → (a1): THE BASE DOES NOT MOVE. THE ALLOWLIST WIDENS.**
This is the estate's **one live-forward W-1 guard**, and it stays one. Three sibling
cells (`b05_arc_m1` §6.2 and §6.4, `b05_arc_m2` §5.3 — the boilerplate is in all three,
not one) were re-aimed to their own delivered-file lists *precisely so this cell could
hold the job alone*, "where an exact expected file list makes it meaningful." So:

> **FIRING ON LAWFUL SOUL WORK IS THE DESIGN, NOT THE DEFECT.** The cell is asking for
> the founder's ratification to be written down. Re-pin-with-attribution is a REQUIRED
> STEP OF ANY SOUL-TOUCHING SEAL — you extend the list, in the same ZIP that moves the
> byte, naming the ruling that moved it. You do not range-pin this cell away.

Each entry now carries its authority in-comment:

| file | ratified by |
|---|---|
| `src/agent/brideTools.js` | `4eff7f6` — ARC M4's rider |
| `src/agent/miraSoul.js` | `4eff7f6` — ARC M4's rider |
| `src/agent/brideSystemPrompt.js` | `daacf4f` — TDW_06 M-4, founder-vetoed |
| `src/agent/coupleSystemPrompt.js` | `daacf4f` + `c35f84f` — M-4 arc + the CE-77 revert |

**NAMED FORWARD so no session relitigates it: F-06.51's chartered bride-lane register
sitting WILL fire this cell when it lands.** That is the ritual working. That sitting
amends here, with attribution, as part of its own seal.

### F-06.54 — the register cure's bench wake, all planes (12 cells, 4 benches)

`daacf4f`/`c35f84f` shipped the house money register on both wires (「 forbids both 」:
`Rs X,XX,XXX`, never `₹`, never `k/L/Cr`), and `c35f84f`'s F-06.49 cure re-worded the
enquiry budget render. Every bench that spoke a figure went stale.

- **`b05_arc_m2_bench.js` §1.1** — three properties: **NAMED** (the exact grouped
  literal), **REGISTER-TRUE** (grouped, plus the negative on *both* forbidden shapes),
  **VALUE-UNCHANGED** (commas stripped, the digits are still 4000000 and not 400000).
- **`b6_floors_bench.js` — nine cells.** Five were the loud half, REDding against correct
  code (`:118` the vendor hold, `:199`/`:235` matched money, `:200`/`:236` matched
  budget). **Four were the silent half, and it is the worse half**: negatives whose
  patterns had gone DEAD and so passed vacuously — `:196`/`:232` (`Rs 50000|Rs 125000|…`
  cannot match a grouped render, leaving only `received|pending` with teeth) and
  `:197`/`:233` (bare `40000|55000`, same). **A negative that cannot match is not a
  floor; it is a green with nothing behind it.** All four re-armed on grouped literals.
- **`b6_s1_bench.js` — a CRASH, not a red.** The bench evaluates the real
  `leadSnapshotItem` body out of `harvest.js` source, so the eval scope must carry every
  free name that body uses. `daacf4f` gave it a second one — `rupees` (`harvest.js:311`)
  — and the eval had only `phoneKey`. **`ReferenceError` took the bench's remaining cells
  with it, which is strictly worse than a red: a crash reports nothing.** Cured by
  `phoneKey`'s own pattern: injected from the ONE HOME, `src/lib/witnessLine` — the exact
  module `harvest.js:28` imports, so eval and production normalise money through the same
  bytes and cannot diverge. Under the crash sat exactly one red, `:79`, register class,
  cured under this ruling per CE §4.

**The literals are written out, never computed from `rs()`/`rupees()` inside a cell.**
A bench that derives its expectation from the function under test agrees with that
function's next bug. `arc_m1` §4.4 is the estate's ratified form of this choice.
`:200`/`:236` assert `budget[^|]*Rs 40,000` rather than the full "budget up to Rs …":
the FIGURE and its REGISTER are what the cell is entitled to judge; the connective is
product copy and moved lawfully at `c35f84f`. Disclosed, not silent.

### F-06.55 — the label-token negative (2 cells)

`b6_floors_bench.js:195` / `:231` asserted the withholding by grepping the bare token
`phone ` — and the recognition dump's own withholding **law** says, in prose:
*"Money and phone numbers are deliberately NOT rendered on them."*
**The law announcing the floor convicted the floor.** The value was never present; only
the word was. Re-aimed to `phone \d{6,}` — a phone number, not the word "phone". Every
tooth kept: the matched-block positives at `:199`/`:235` still require
`phone 9811077001` / `phone 9811022001` and still convict a leak. The cell stops
forbidding the estate to explain itself.

### F-06.56 — the weave growth's bench wake (2 cells, `b0461_p6_bench.js`)

At `2b89b5c` the founder ruled 「 move it 」 and the no-machinery law moved TERMINAL in
`harveySoul` — and terminal in `harveySoul` means **inside `PRODUCTION_WEAVE`**. The
weave went 549 → 1060 chars and, for the first time, NAMES the persona inside its own law.

- **The scrub cell's PREMISE DIED and is ruled dead.** "The weave must pass `scrubText`
  byte-identical" was a good proxy only while no soul law needed to name Donna. F-06.52
  ended that: **the law must name what it forbids** — a curtain law that cannot say
  "Donna" cannot forbid narrating her. The two-layer doctrine resolves it without
  weakening anything: **soul carries character** (and may name the persona inside its own
  law), **firewall carries the floor**. Re-aimed from a source property to the WIRE
  property, the one that ever protected a vendor: `!/Donna/.test(scrubText(weave))`.
  **`/Donna/` and NOT `/donna/i` BY RULING** — the lowercase gap is F-06.35's own filed
  finding riding its own cure elsewhere; a case-insensitive assertion here would quietly
  become that finding's bench and mask whether it was ever cured.
- **The cap → 1200**, stated rather than deleted: +511 chars ≈ ~130 tokens, inside the
  cached static prefix, so the marginal cost is cache-stable and negligible. Raised with
  headroom, not removed — an unbounded soul constant is how a static prefix stops being
  cheap. **Founder's one-word confirm owed on this number** (a cap is a cost number).

---

## 2. F-06.57 — DIAGNOSED, CURE NOT TOUCHED (CE §6: diagnosis-only)

`b6_sitting2_bench.js` **20/22**, two reds, both source-string assertions against
`donnaFind.ts`:

- `:222` — `src.includes('refer to a record by its name as shown')`
- `:226` — `/most recent records \(active and archived\)/`

**First-red commit: `5ea0153`** (TDW_06 Sitting III, F-06.14's donnaFind no-match reframe,
CE-25, 2026-07-19). Green at `1d211ea`, red at `5ea0153` and every commit since. Bisected
cheaply by testing both predicates against `git show <c>:src/engine/src/core/tools/donnaFind.ts`
— no bench runs needed. **Cause:** F-06.14's own chartered reframe rewrote the prose
("records" → "binders"); the cells asserted the pre-reframe sentences verbatim and were
never amended in that sitting. **Pre-`c736a7e`, outside the M-4 arc, red for eight days
across CE-25 → CE-79 and undisclosed in every floor record.** Holds for its own ruling.

---

## 3. THE PROOF

### Both-ways — five mutations, every one on PRODUCTION files, at a scratch tree

```
RED ✓  M1  moneyGuard.js:127 → raw pre-register form
          → arc_m2   FAIL §1.1 *** prose "4 lakhs", hand 4000000 -> HELD ***
RED ✓  M2  provenanceHold.js:97 (dist) → raw pre-register form
          → b6_floors FAIL  the hold speaks the honest question
RED ✓  M3  donnaFind.js recognitionRow leaks the phone back onto the recognition line
          → b6_floors FAIL  PHONES are gone from the zero-match dump
RED ✓  M4  scrub.js:257 persona arm defanged (/\bDonnaZZ\b/)
          → b0461_p6 FAIL  the FIREWALL clears the weave
RED ✓  M5  brideSystemPrompt.js gains a byte
          → arc_m4   FAIL §4.1
all mutated files restored byte-identical
```

**Disclosed, not quietly re-run:** M3 and M4 stayed GREEN on the first attempt — my
anchors were wrong, not the cells. `String.replace` hit `describeRow`'s `stage` push
before `recognitionRow`'s, and I had defanged thirteen *comment* mentions of "Donna"
instead of the one real arm at `scrub.js:257`. Re-anchored, both convict.

### The range-pinned cells' teeth — shown by range, because they cannot be shown by mutation

M5 reaches only `arc_m4` §4.1, **by ruling**. A historical range assertion cannot be moved
by a working-tree edit; that is the whole point of §1. Labelled as the different thing it is:

```
2028a0d..5335bb2 -- <8 souls>  → EMPTY    (the shipped range: green)
2028a0d..2b89b5c -- <8 souls>  → brideSystemPrompt.js, coupleSystemPrompt.js, harveySoul.ts
8560ca0..a80dac8 -- <6 souls>  → EMPTY    (the shipped range: green)
8560ca0..2b89b5c -- <6 souls>  → brideSystemPrompt.js, coupleSystemPrompt.js
```

### Floor at the cured tip — full run, credentials supplied so nothing is silently skipped

All green except two, both accounted for: **`b06_meter_bench` 28/29** (KNOWN RED, F-06.41,
carried loudly) and **`b6_sitting2_bench` 20/22** (F-06.57, above).

Moved by this ZIP, all labeled: **f0550 31 · arc_m2 27 · arc_m4 18 · arc_m5 11 ·
b6_floors 47 · b6_s1 24 · b0461_p6 24.**

Byte-stable: gauntlet `--rig-selftest` **122/122** · b06 m0 50 · m1 45 · m2 39 · m3 37 ·
m4 33 · m4b 24 · m4c 20 · m4d 16 · arc m1 53 · m3 11 · m6 20 · crons 48 · sendwa 55 ·
webhookcore 11 · otp_meta 24 · b0498 58 + punct 17 · meta_router 31 · transport 10 ·
m1b 4 · m2_vendor 2 · onboarding 27 · wa_door 32 · couple_soul 21 · f0532 9 · f0515 4 ·
f0516 4 · f059 10 · media_shim 14 · f0555 23 · b6_door_rider 15 · f79 19 · f80 24 ·
open_question 28 · referent 36 · rider 32 · s2 48 · witness 22 · b3_rider 20 ·
b5_describe 18 · bands 46 · crew_page 111 · collab 52 · collab_wiring 71 ·
owner_assignments 19 · money_loop 73 · assign 30 · crew 21 · crud_crew 19 · gap 10 ·
pinlogin 11.

`node --check` clean on all seven touched files.

### CE §7's floor-record law, honoured and the gap CLOSED

`b6_door_rider_bench` threw at `db.js:11` for want of `SUPABASE_URL` /
`SUPABASE_SERVICE_ROLE_KEY`. **The throw is module-scope only** — dummy values run it
fully offline: **15/15 PASS**, byte-stable at its own historical count. Named here per the
new law, and named as CLOSED rather than merely skipped.

---

## 4. COPY INVENTORY — ZERO

No user-facing string, no model-voiced string. `scripts/` only. The veto slot is empty.
`moneyGuard.js`'s display is a tool result read by the model, not a bride-readable string
(the file's own header at `:105-108`), and it was READ-ONLY here regardless: **the bench
moved to the code, never the reverse.**

**One founder item:** the 1200-char cap (§F-06.56) rides the seal for Dev's one-word
confirm — he ruled the bytes with 「 move it 」; this is only the bench catching up to his
own ruling, but a cap is a cost number and cost numbers get his nod.

---

## 5. CORRECTIONS OWNED BY THIS SESSION

1. **The chair corrected the executor on F-06.54's shape, and the chair was right.** The
   read-first argued for computing the expectation through `rupees()` at run time and
   called a literal the disease. That was circular. Built as ruled, reasoning written into
   the amendment. The record should not read "approved as proposed."
2. **The one-live-guard designation is in three cells across two benches** (`arc_m1` §6.2
   and §6.4, `arc_m2` §5.3), not one. Both the chair's citation and the read-first's were
   partial. All three named in the new header.
3. **`b6_floors` is eleven cells, not seven.** Four green-but-defanged negatives were
   invisible to a red-count sweep. Counts unchanged; teeth restored.
4. **`:195/:59` in the ruling is `:195/:231`.**
5. **Two mutation anchors were wrong before they were right** (§3, disclosed above).

---

## 6. OPEN, AND NOT THIS SITTING'S

- **F-06.57** — `b6_sitting2`'s two reds, diagnosed to `5ea0153`, cure unruled.
- **F-06.41** — `b06_meter_bench` 28/29, pre-existing, homed to the modelRouter micro.
- **THE `b0461_p6` FIND'S PRODUCTION HALF, still unruled and still untouched.** The bench
  is green now, but the underlying behavioural fact stands: `2b89b5c` moved the
  no-machinery law's opening cluster out of the always-on `HARVEY_SOUL` and into
  `PRODUCTION_WEAVE`, which `loop.ts:377` appends only when
  `!isConsult && vendorCategory === 'planning'`. **Non-planner vendors — photographers,
  decorators — no longer carry «The owner hired a counsel, not a control room… no
  narrating your machinery».** The second half of the law (internal keys, back-office
  marks) did stay in `HARVEY_SOUL`, so this is partial, not total. Derived from the
  shipped bytes and the shipped gate; **no live claim is made.** Soul plane, W-1, no
  bytes touched by this sitting.
