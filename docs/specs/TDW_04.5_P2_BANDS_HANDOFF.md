# TDW_04.5 · P2 — THE WEDDING-BAND VIEW · EXECUTOR HANDOVER

**Bases (re-derived at origin, fetch-first, at the moment of writing — CE-22):**
dream-os `1fbf90c` · dreamos-pwa `bf2c79b`. Both trees were clean at first motion (§11).

**Sitting shape:** read ladder stated → read-first → CE rulings F1–F7 → derivations (1)–(3)
reported → CE rulings on F2(b)/F4(c)/§1-field/F-04.104 → build. Founder veto ANSWERED
**YES to all six strings** before build (§10 veto slot, recorded 2026-07-22).

---

## §1 — ORIGIN MOVED MID-SITTING (accounted, not absorbed silently)

`653c3b1` → **`1fbf90c`** arrived between the read-first and the derivations: **CE-57**,
docs-only, 3 files, +15/−7. Read whole before proceeding. Three consequences named:

1. **F-04.103 FILED** — the executor's α-2 report ("F-04.103 exists nowhere at `653c3b1`")
   was TRUE when written and is DISCHARGED by this push. No chair defect stands.
2. **§10 re-amended to SEVEN parts** — the READ LADDER is part 3; the FOUNDER SMOKE CARD
   and the VETO SLOT join ACCEPTANCE. This sitting already satisfied all three.
3. **The build base moved.** Every hash in this delivery reads `1fbf90c`.

---

## §2 — WHAT SHIPPED

### dream-os (3 files)

| File | What |
|---|---|
| `src/api/vendor/bands.js` | **NEW.** `GET /api/v2/vendor/bands/:vendorId?from&to` — the board's one round trip. |
| `src/api/vendor/core.js` | **+1 line.** Mount beside its `day.js` sibling. |
| `scripts/b0450_bands_bench.js` | **NEW.** 46 asserts over the REAL builder. |

**The three seams this endpoint ASKS rather than re-decides** (each is somebody else's one home):

- **`isOccupying`** (`src/lib/vendor/occupancy.js:115`, `OCCUPYING_KINDS :103`) decides the
  gap flag. The three kinds are **not re-listed** in `bands.js`.
- **`normaliseCategory`** (`src/lib/vendor/categoryFraming.js:110`) decides `default_view` —
  the identical call the staffing-gap line makes at `src/api/vendor-engine/chat.js:1202`.
- **THE MONEY RULE IS NOT APPLIED HERE AT ALL** (CE ruling F2(b)). The endpoint ships the
  FOUR RAW WITNESSED CELLS; the client applies the estate's canon. `cabinet.js:103` remains
  the backend's only mirror and was **not touched**.

**Plane + witnesses (SQL-provenance law — every column names its source):**
PUBLIC — `events` (PUBLIC_SCHEMA.md), `team_members` (PUBLIC_SCHEMA.md:732-746),
`crew_confirmations` + `events.assigned_member_ids` (**0087 §A/§D**, post-dating the
2026-07-16 snapshot; witness = the migration file + CE-48's founder `PRESENT×4`).
ENGINE — one enumerated hop to `records` (ENGINE_SCHEMA.md:341-362): `id, client` and the
four money cells `amount` (:344) · `direction` (col 6) · `amount_received` (:359) ·
`amount_pending` (:360). **No SQL ships in this delivery. No migration.**

### dreamos-pwa (8 files)

| File | What |
|---|---|
| `components/vendor/CalendarBands.tsx` | **NEW.** The board: bands, pips, crew circles, whisper. |
| `app/vendor/calendar/page.tsx` | +98/−2. Toggle, in-memory view, one-shot seed, gap→picker. |
| `lib/vendor/types/vendor.ts` | The bands wire contract. |
| `lib/vendor/api/vendor.ts` | `fetchBands` + type registration. |
| `lib/vendor/derive.ts` | **F-04.104 rider** + a disclosed type-only widening (§5). |
| `scripts/bands.proof.ts` · `bands.proof.tsconfig.json` · `run-bands-proof.sh` | **NEW.** 11 asserts. |

---

## §3 — PROOF

**`b0450_bands_bench` 46/46 GREEN.** Drives the REAL `buildBands` over an in-memory
supabase whose filters run for real (the `b0457_crew_bench` Q class, extended with
`.schema('engine')` so the enumerated hop is exercised, not mocked away). The REAL
`isOccupying` and the REAL `normaliseCategory` decide every gap and every default.
**Nothing under test is stubbed** — the only doubles are the network and auth middleware,
neither of which the builder touches.

**NON-VACUITY BY MUTATION OF PRODUCTION CODE** (never test setup), each reverted and the
file re-verified byte-identical:

| # | Production mutation in `bands.js` | Result |
|---|---|---|
| i | `gap: isOccupying(ev.kind) && crew.length===0` → `gap: crew.length===0` | **44/46** — RED on exactly recce + meeting |
| ii | `=== 'planning'` → `=== 'planner'` | **43/46** — RED on exactly the three planner rows |
| iii | delete `.neq('kind','blocked')` | **44/46** — RED on exactly the block-exclusion asserts |

**`bands.proof` 11/11 GREEN.** Mutation: revert F-04.104's `!== ''` clause in
`lib/vendor/derive.ts` → **9/11**, RED on exactly the two empty-string asserts. Restored,
byte-identical.

**SEALED FLOOR, executor-run at this tip** (engine compiled first per CE-53:
`npx tsc -p src/engine/tsconfig.json`):

`checker_bench` **101/101** · `b0457_crew_bench` **21/21** · `b0457_gap_bench` **10/10** ·
`b0457_assign_bench` **30/30** · `b0457_crud_crew_bench` **19/19** ·
`b0497_assign_crew_door_guidance_bench` **ALL GREEN** ·
`b0498_fresh_crew_rider_bench` **66/66** · `b0498_wa_assign_punct_bench` **17/17** ·
`crewCommit.proof` (pwa) **11/11**. **All byte-stable — no amendment, labeled or otherwise.**

**GATES:** `node --check` clean on all three touched `.js` · **PWA `tsc --noEmit` whole-tree
ZERO on a cleared `.next`** (run twice, output confirmed genuinely empty).

**GUARDED FILES, 0-line diff vs origin, verified by command:**
dream-os — `eventWrite.js` · `occupancy.js` · `scrub.js` · `chat.js` · `calendarSignals.js` ·
`src/engine/**` · `leads.js`.
dreamos-pwa — **`CalendarCrewSheet.tsx` · `crewCommit.ts`** (F3's byte-untouched picker,
proven) · `CalendarDaySheet.tsx` · `CalendarBlockSheet.tsx`.

---

## §4 — EXECUTOR DISCLOSURES (each vetoable/bounceable on its own)

1. **A BENCH DEFECT I MADE AND CAUGHT.** The first fixture omitted `vendor_id`, so the
   spine's own `eq()` emptied the board and **every exclusion assert passed VACUOUSLY** —
   a green over an empty set, the exact disease the both-ways law exists to catch. Fixed;
   the reason lives in the fixture comment rather than being quietly patched out.
2. **A TYPE-ONLY WIDENING OF THE CANON, beyond "one clause".** `pendingOf` demanded a whole
   `CabinetBinder`; the band ships four cells, so the ruled F2(b) wiring is impossible
   without it. Param widened to a new `MoneyCells` interface — `CabinetBinder` is
   structurally assignable, so **all four existing call sites are untouched and unchanged**
   (enumerated by command: `Cabinet.tsx:321`, `derive.ts:90`, `api/vendor.ts:119`, `:132`).
   **Zero runtime bytes change** beyond F-04.104's clause. **Flagged rather than buried; the
   chair may bounce it and I will construct the shape at the call site instead.**
3. **The proof re-declares `whisperFor` rather than importing it.** `CalendarBands.tsx` is a
   `'use client'` JSX module and cannot compile standalone in plain node (the
   `crewCommit.proof.ts` precedent works only because that file is dependency-free). The
   **divergence risk is real and named in the proof's own header**; `pendingOf`, the
   load-bearing half, IS the real import — the canon itself is under test.
4. **`src/engine/package-lock.json` was generated by my `npm install` and DELETED before
   packaging.** CE-56 named that file's arrival beneath an "engine 0-line" claim the
   undeclared-rider specimen. It does not ride this ZIP.
5. **`scripts/bands.proof.tsconfig.json` exists because a bare `tsc file.ts` cannot resolve
   the repo's `@/*` alias** (TS2307 on `derive.ts:21`). It supplies exactly that alias and
   sets `noEmitOnError: true` — **no error is suppressed**; a type error stops the run.
   The first version of `run-bands-proof.sh` had `set -e` swallow the failure into a silent
   empty output; caught, and the emit path corrected.
6. **The bench name `b0450_bands_bench` is mine** (0450 ≈ 04.5, mirroring `b0457_*`).
   Rename on a word.

---

## §5 — F-04.104, THE DISCLOSED LABELED RIDER

**The finding:** the canon and its mirror were declared *"one rule, written twice… nothing
else may compute owed by any other means"* and had drifted by exactly one clause —
`cabinet.js:105` tested `explicit !== ''`, `derive.ts:44` did not. An empty string therefore
took **different paths in the two repos**: the mirror inferred, the canon ran
`Number('') || 0` and returned **0** — an unfiled cell read as settled, which is F-04.13's
own convicted disease surviving inside F-04.13's own cure.

**Alignment direction, ruled by the estate's own law** (*"an unfiled cell means unfiled,
not Rs 0"*): an empty string IS unfiled, so it falls through to the inference. **The canon
moved to the mirror, not the reverse.** One clause; one bench case; both directions witnessed.

**Why it rode this sitting:** the whisper imports this exact function. Shipping a new
consumer onto a rule with a known divergence is wiring a convicted class knowingly.

---

## §6 — WIRE POINTS NAMED, NOT BUILT (the two ruled omissions)

1. **BAND-TAP → THE 03 BINDER STORY — OMITTED (CE ruling F4(c)).** Derived at build: the
   binder story is an **in-place expansion inside `components/vendor/slices/BinderCard.tsx:122`**,
   rendered in a `.map()` on `app/vendor/list/[slice]/clients.tsx:82-90`. There is **no
   per-binder route, no `?binder=` param, and no `searchParams` reader anywhere under
   `app/vendor/list/`** (all greps empty). The band head therefore carries no navigation and
   says so in its own comment. **Re-entry key:** a `?binder=<id>` deep-link that auto-expands
   the matching card — its own small sitting, never a P2 rider.
2. **GAP PIP → `Post to Collab` — OMITTED (CE ruling F3).** P4 machinery (`0077`,
   `collab_post_items`, the kind→requirement_type map in spec Appendix A) does not exist at
   HEAD. **Re-entry key:** spec §P4.5; the gap pip's handler is the insertion point.

---

## §7 — THE FOUNDER SMOKE CARD (finalized on the thumb-path derivation)

**The founder only performs and pastes. The executor reads the evidence.**
Run **after both ZIPs are applied and both deploys are green.**

**Thumb-path, derived by command at `1fbf90c`/`bf2c79b`** — the route you actually walk:
landing Sign in (`app/(landing)/page.tsx:548`) → `/vendor/pin-login` (`:98-110` writes
`category` + `_v:2`) → `/vendor` → Calendar tab (`BottomNav.tsx:97`) → `/vendor/calendar`.
The page guard is **session-presence only** (`page.tsx:64`) — no tier gate, no category gate.
`middleware.ts` does not rewrite `/vendor/*` on the main host.

| # | Do this | Paste back | What it witnesses |
|---|---|---|---|
| 1 | Open `/vendor/calendar` as the test vendor. | **Which view it opened on** — Month or Weddings. | `default_view`, server-computed. **The payload also carries the `category` it computed FROM**, so this step is self-witnessing — the executor could not derive your account's category by command (no DB reach) and this closes that gap without a pre-read. |
| 2 | Tap the toggle both ways. Navigate months with ‹ ›. Then **fully reload the page.** | That the choice **held** across month-nav, and **RESET** after the reload. | The in-memory law (spec §3: no storage APIs) witnessed by its own amnesia. |
| 3 | In Weddings, find the **Ananya** band. Look at the **25 Jul recce** pip. | Screenshot of the band. | Title + money whisper + pips. The recce should show **NO crew circle** (Swati is off it — the DB truth this arc established). **The recce is NOT a gap pip** — `recce` is not occupying (`occupancy.js:103`), so no pulse. **If you see a pulse there, that is a finding.** |
| 4 | Find the **Rhea Malhotra** band. Look at the **29 Jul sangeet** pip. | Screenshot. | Swati's brass initial with a **HOLLOW ring** — her `crew_confirmations` row is `pending`, and the ring must say so. |
| 5 | Tap the **sangeet** pip. | Screenshot. | The **day sheet** opens — 04's, unchanged. |
| 6 | Find any pip that **pulses** (a `shoot`, `family`, or `ceremony` with nobody on it) and tap it. | Screenshot. | The **assign picker** opens — the shipped `CalendarCrewSheet`, byte-untouched. |

**No dashboard or console act is required. No env var. No SQL. No migration.**

**A correction to the card as issued, on derived evidence:** the kickoff's step 3 expected
*"the gap pulse"* on the 25 Jul recce. `isOccupying` is `['shoot','family','ceremony']` — a
recce is an appointment and sells no capacity, so it **cannot** be a gap by the estate's own
predicate. Step 3 above is corrected accordingly and step 6 gives the gap its own witness.

---

## §8 — OPEN AT THIS DELIVERY

- The founder's apply + push (both repos) + the smoke card. **The live witness is the
  founder's, declared-not-claimed — nothing in this document asserts production behaviour.**
- The chair's ruling on disclosure **§4.2** (the type widening) and **§4.6** (the bench name).
- **F-04.104's mirror side:** `cabinet.js:105` is now the ALIGNED-TO shape and needs no
  change — but the "one rule, written twice" pair has no test that would catch the NEXT
  drift. Filed as an observation for the chair's routing; no cure proposed here.
- P2's remaining spec surface, untouched by ruling: band-tap navigation (§6.1) and
  Post-to-Collab (§6.2).

**Sequencing beyond this sitting is the founder's.**
