# TDW_04 — CHECKER → B4 HANDOFF

**Sitting:** TDW_04 Part B, the CHECKER sitting (ZIP D + ZIP E). **Closed 2026-07-16.**
**Ships from:** `5cdf356` (spine seal) → `356ceaf` (ZIP D) → this ZIP.
**Charter:** `docs/specs/TDW_04_SPINE_TO_CHECKER_HANDOFF.md`.

---

## 0. WHAT LANDED

**`checkOccupancy` has a body.** The seam predicted at `eventWrite.js:241-275` since B2 is wired. The four
verdicts are real: `capacity` · `date_blocked` · `appointment_overlap` · `cluster`.

| | |
|---|---|
| `scripts/checker_bench.js` | **78/78**, from any working directory |
| `scripts/b3_rider_bench.js` | **20/20** — untouched, still green |
| `src/engine/tombstone_bench.js` | **15/15 — now WITNESSED.** Carried as the handoff's *claim* for two sittings because a clean clone cannot run it (needs `npm run build` for `src/engine/dist/core/db.js`). It was run. |
| T19 (L-8 oracle) | **`125000 / 3 / 4`, green, unmoved.** ZIP D wrote no row. |
| `PUBLIC_SCHEMA.md` | gained its **constraints addendum** — §1 **134** · §2 **80** · §3 **204**, all guards green |

**Riders:** F-04.58 (the dedupe's missing `deleted_at`) · F-04.59 (`'florist'` → decor).
**Filed:** F-04.58, F-04.59, **F-04.60** (positive witness). **Closed:** Finding #1 → ROTATED; Finding #12 ruled.
**Backfilled:** the F-04.50–54 log gap.

---

## 1. B4'S OPENING ITEM, AND IT IS NOT CLOSE

### F-04.55 — **both doors still swallow the payload. The checker is correct and unread.**

This is not a caveat. It is the block's tallest live item and it went live the moment ZIP D landed:

- **CRUD** (`events.js:261`, `:299`): `if (!result.ok) return errRes(res, 400, result.error)` — a conflict return
  `{ok:false, conflict}` **has no `error` field**, so the vendor receives a bare **`{"ok":false}`**. `holding`,
  `capacity`, `message` — all discarded.
- **chat** (`chat.js:188-193`): `console.error(…, r.conflict && r.conflict.kind)` — **the kind goes to the server
  log. Victor never sees it. The vendor never sees it.**

**Every vendor-facing sentence in `occupancy.js` is written, correct, on `main`, and read by nobody.** They were
authored now so B4 is a wiring job and not an authoring job. **They are on the veto list.**

**Consequence, stated flatly:** the checker returns a byte-identical `ConflictPayload` from both source positions
and **both doors will swallow it**. **Spec §5's founder smoke cannot pass** — *"receive `date_blocked` in his
voice"* has no voice to arrive in. It is deferred to where it becomes provable, which is B4. **Q-S-1(i) ruled the
crown proof to the `writeEvent` boundary precisely because of this**, and that is where it is benched.

**The new tail:** the FAIL-CLOSED refusal (`"Couldn't verify the calendar — nothing was changed. Try again."`)
rides the `error` field, so **CRUD's bare-400 swallows its text too.** The refusal itself lands today; the
sentence does not. Same disease, and B4's cure covers both.

### F-04.56 — the lockstep's third outcome

`force: true` shipped; the ledger records **conflict overridden** and **drag refused by block**. **The third
outcome — a fail-closed verify or a plain refusal — is `console.warn` to the server only**, because inventing a
ledger vocabulary the CE did not rule is how a wire grows a fifth kind nobody ratified. **The binder moves and
that event does not, and only the server log knows.** Vendor-facing surfacing (*"your wedding move overloaded the
15th"*) is B4's, with F-04.55.

**⚠ F-04.56's own headline is now false as worded** and this sitting did not touch it: it asserts *"date_blocked
still refuses by Q-B3-8, so a drag can never land on a block."* **That sentence was false when written** — the
door had no second term — and is true **only** because of Q-C-3's gate. **The corrections convention says update
in place. It was not ruled, so it was not taken.** Raised again here.

---

## 2. THE DOC-SWEEP LIST

**Nothing here is code. Every item is a document asserting something the estate has since outgrown.** None is
urgent; each is the kind of thing that becomes a finding when someone trusts it.

| # | item | state | cost |
|---|---|---|---|
| 1 | **`docs/SCHEMA.md:5`** — *"Latest migration applied: 0064 (2026-05-30)"* | **The ladder is at 0077, applied.** Stale on its own front page. Named inside F-04.57's entry, never fixed. | one line |
| 2 | **`docs/TDW_00_MASTERPLAN.md`'s 04 row** | **Stale by six sittings** (B1 · B2 · B3 · spine · checker · this). The protocol says update the status table each delivery; it has not been. | one row |
| 3 | **`events_vendor_date_blocked_idx`** — redundant index | `CREATE INDEX … (vendor_id, event_date) WHERE (kind = 'blocked')` is **strictly wider** than `events_vendor_date_blocked_unique_idx`'s `WHERE (kind = 'blocked' AND deleted_at IS NULL)`, which supersedes it for every query the narrower one serves. Costs write throughput on every block; buys reads that already have a better index. **Likely residue from 0075's correction.** | **"someone should look."** **DDL is NOT proposed** — dropping an index is destructive-adjacent and **the read paths that might depend on the wider predicate were not verified.** |
| 4 | **F-04.56's headline** | false as worded (see §1). Correction-in-place, unruled. | one sentence |

---

## 3. THE SHAPE THAT KEEPS RECURRING — F-04.36, three instances and counting

**Two things that must agree, in two places, with no forcing function.** Named as one item because it is one item:

1. **F-04.59** — `categories.js`'s `CATEGORY_ALIASES` (which knows the 2026-05-15 florist merge) and
   `categoryFraming.js`'s ladder (which `profileFor` actually consults, and which did not). **The word is fixed.
   The structure is not.** A vendor typing *"florist"* got occupancy OFF; one typing *"floral decor"* got decor's
   1. Same trade, two answers, **silently** — the miss fell through rather than erroring.
2. **F-04.60** — `occupancy.js`'s ternary and `events_kind_check`'s thirteen values. **They agree exactly, today,
   verified by command.** Nothing fails if a migration adds a fourteenth kind: it lands in NEITHER, consumes no
   capacity, and nobody is told.
3. **Q-B3-10** — the anchor rule, implemented twice (`chat.js`'s `isWeddingAnchor` takes `req`; `events.js:321`
   inlines it). **They share `isOccupying` — the SET has one home. The RULE does not.**

***"They agree today; I read both" is the sentence someone wrote about the kind lists before F-04.36.***
**Proposal for 06, not taken: a bench that FAILS when they diverge. An agreement is only a guarantee once
something breaks when it stops being true.**

---

## 4. WHAT THIS SITTING PROVED ABOUT ITS OWN PROCESS

**§0.2 earned its keep four times, and every instance was a ruling that could not execute as worded:**

- **Q-C-1** — the checker's context is the **PATCH, not the ROW**. `ctx.kind` is `undefined` on **all nine**
  update shapes, so a checker keyed on it is blind on every update path. Found by instrumenting the real seam.
- **Q-C-3** — **`force` beat every verdict**, including `date_blocked`. Found by *running the ruling before
  building on it*: a forced booking landed on a block and wrote **`"[forced 2026-07-16] You've blocked 19 July"`**
  into the vendor's own note. **§2.5's `force: true` was ruled safe on a premise nobody had run.** The premise was
  reasonable, written by people who knew the code, and false. **The report cost one round trip. The alternative
  cost a vendor his blocked day.**
- **C5/C9's advisories** — a bare `if (conflict && !force)` blocks the write C9 was ruled **three times** never to
  block. Cured with `isRefusal`.
- **The five door-line siblings** — `state`/`deleted_at` in the ctx, `deriveSlot`'s `kind`, the note branch's
  guard. Each a **necessary condition of a ruling already written**; each disclosed by name for one-word veto.
  **A deviation disclosed is process; a deviation discovered is a breach.**

**§0.1 fired twice on the executor's own work, both times against something already written:**

- **The exclusion's "deciding case is the unblock"** — argued in the opening packet, **false against the code the
  same executor then built**: Item 3's `deleted_at` guard returns `null` before the block query. Corrected in
  place, struck-not-deleted. The deciding case is the **re-book**.
- **The dead short-circuit** — `touchesSpatial` tested `!== undefined`, but the door computes `slot: derivedSlot`
  on every call and deriveSlot returns **`null`**. So the ruled clause **never fired once** and a bench asserting
  it would have passed green. **Found by the bench, not by reading.**

**And one process fact worth more than the bug it caused:** the ZIP D apply block was written for a laptop
(`~/dream-os`, `~/Downloads`) and the founder is in a **Codespace** (`/workspaces/dream-os`). The protocol says
every shell line gets pasted into a real pty first. **The heredoc was tested; the apply block was not** — because
it looked obvious, and because the executor's pty **could not have run it anyway**. *A pty check that cannot reach
the target environment is not a check.* **Standing: every apply block targets `/workspaces/dream-os`, ZIP uploaded
by drag into the VS Code explorer. Never `~/Downloads`.**

---

## 5. OPEN, INHERITED, UNPROVEN — carried, not discharged

**No bench in this estate proves any of these. Each needs a live turn.**

- **F-04.42** (add-and-strike) — shipped, **no production witness**. Move an event off a date via Victor; no
  `donna_unblock_date` may appear in the turn. *The row will not tell you — only the log will.*
- **F-04.44** (both selects) — shipped, **no production witness**.
- **T12** (retroLink) — inherited, **never proven, three blocks running**.
- **ERROR gate** — bench-only by deliberate restraint, CE-accepted.
- **T1** — Twilio-blocked.
- **The block-close T19** — owed, undischarged. `125000 / 3 / 4` must be green again **with its full header and
  pasted rows**.

---

## 6. ONE UNEXPLAINED THING

The founder's terminal printed **`All changed .js files passed syntax check.`** during the ZIP D commit. **That
string does not exist anywhere in this repository** — not in the tree, not in `.git/hooks`, not in `.githooks`, no
`husky`, no `lint-staged`, no `core.hooksPath`. **It is a script that lives on one machine and is not in the
estate.**

**Two reasons it matters:** *(a)* Q-SP-5's law — *a cure nobody can re-run quietly stops being a cure* — and a
syntax gate nobody else can run is a gate the next executor will assume is protecting them. *(b)* **It may be the
missing home for §3's forcing function.** A pre-commit hook that already walks changed `.js` files is exactly
where a divergence test belongs. **Unresolved; raised, not diagnosed.**

---

**A green oracle is not a clean estate. It counts money and rows; it never asks whether a binder's date is a
wedding.** `125000 / 3 / 4` was green through the entire F-04.43/46 background rate — **green while Ananya's
binder said her wedding was her recce.**
