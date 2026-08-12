# TDW · ARC OB · CHARTER OB-D · D-2 DESIGN NOTE

**Derived at `33732445350b6bb0c743c2f15078bcb7904bddb1`** (B-09H D2, F-09.173).
Head-guard `"name": "dream-os-backend"` ✓ · `npm ci` exit 0 · `npm run build` exit 0.

Delivered under CE-31 relay OB/№3. **Nothing pushed.** ZIP to the chair before
the founder applies.

---

## 1 · WHAT SHIPPED

| # | file | act |
|---|---|---|
| 1 | `db/migrations/0122_vendor_service_area.sql` | NEW — ruling ①: additive core, two-arm backfill, both CHECKs, stale-stamps, verify SELECTs |
| 2 | `src/lib/onboardingPredicate.js` | NEW — the shared predicate, one home, pure |
| 3 | `src/lib/onboardingGate.js` | NEW — the gate, dark under R-OB.9, bytes withheld |
| 4 | `src/lib/laneFlags.js` | `onboarding.gate_enabled: false` registered |
| 5 | `src/lib/brideInbound.js` | gate mount + `:253` reorder (ruling ④) |
| 6 | `src/lib/vendorInbound.js` | gate mount |
| 7 | `src/api/vendor/me.js` | additive reader migration + service-area validation |
| 8 | `scripts/bOB_d2_onboarding_gate_bench.js` | NEW — 40 cells, one declared gap |
| 9 | this note | — |

**NOT shipped, deliberately:** the redirect bytes (unvetoed — §3); the
`vendor/onboarding.js` endpoint cure (F-OB.2, not in D-2 scope); the
retirements (ruling ③ order: they land only after arming); the W-1 prefeed work
(D-3 under ruling ⑤'s lift).

---

## 2 · INSERTION RANGE — for the B-09H collision check

Per the standing coordination rule (relay OB/№2 ②). `brideInbound.js` is the
shared file; B-09H's D-3 restructures it, and the two diffs never fly
simultaneously.

**OB-D's `brideInbound.js` footprint is THREE disjoint points, no restructuring,
no reflow of surrounding code:**

| point | anchor at `3373244` | act | Δ lines |
|---|---|---|---|
| A | import block, immediately after the `coupleAiCap` require (`:51`) | +1 require line | +1 |
| B | the circle-claim `safeName` assignment (`:253`) | 1 line changed in place + 16 comment lines above | +16 |
| C | between the `!couple` dead-end return and the `TDW_10.C · THE METER` comment (`:350`–`:352` pre-diff) | +30 line block inserted whole | +30 |

Point **C is the only insertion in the turn body**, and it sits in the gap
between two existing blocks rather than inside either. Point **B changes one
expression** and adds comment above it. **No existing line is deleted, moved, or
re-indented anywhere in the file.** If B-09H D-3 lands first, this diff
re-derives at that tip and the three anchors are re-found by their text, not by
line number.

`vendorInbound.js` footprint: import `+1`; one `+30` block between the vendors
lookup and the image-throttle branch. No line deleted or moved.

---

## 3 · THE TWO REDIRECT BYTES — DRAFTS FOR THE FOUNDER'S VETO

**Not shipped.** `BRIDE_REDIRECT_BYTE` and `VENDOR_REDIRECT_BYTE` are `null` in
`onboardingGate.js`, and the gate fails closed on missing copy: an armed flag
with an unvetoed byte logs and does not gate. Nothing on this page can reach a
wire until a byte below is approved and pasted in.

Brief, per CE-31 §COPY: *the first sentence a new person ever receives from the
estate — warm, one link, no apology, no AI-talk.* Ruling ② adds: this names a
DIFFERENT STATE from `DEAD_END_REPLY` (which stays untouched) — the account
exists, the fields are missing.

**BRIDE LANE — three drafts**

> B1 「 Hi! Before we start planning, I need a couple of details about your wedding. Two minutes here and I'm all yours: thedreamwedding.in 」

> B2 「 Lovely to hear from you! I just need your details first so I can actually be useful — thedreamwedding.in takes about two minutes. 」

> B3 「 Hi! Let's get you set up first — a few quick details at thedreamwedding.in and then we can get into the good part. 」

**VENDOR LANE — three drafts**

> V1 「 Hi! Before I can start working for you, I need your business details. It takes two minutes: thedreamai.in 」

> V2 「 Welcome! Set up your profile at thedreamai.in — a few details about your work — and then I'm ready to go. 」

> V3 「 Hi! I need a few details about your business before I can be useful. Two minutes at thedreamai.in and we're running. 」

**Notes for the veto.** No apology and no "sorry" in any draft, per the brief.
No AI-talk: none says model, assistant, or AI. One link each. **The two links
differ** (`thedreamwedding.in` for brides, `thedreamai.in` for vendors) — this
matches the estate's own live usage: `DEAD_END_REPLY` points brides at
`thedreamwedding.in` (`brideIndex.js:51`) and `systemPrompt.js` points vendors
at `thedreamai.in`. **Please confirm both hosts** — if OB-P mounts the form on a
different path, the byte carries the path and these drafts change.

**Amend freely.** The approved sentence will be recorded verbatim in 「 」 and
frozen at the byte; the bench pins bytes, not prose.

---

## 4 · BOTH-WAYS PROOF — the mutation table

Bench run **bare**, exit code as the second independent method.

- Cured tree: **40 passed, 0 failed, VERDICT GREEN, exit 0**
- Every mutation below was **RUN against the production file**, the bench re-run,
  and the file restored. None is asserted from reading.

| cell | production mutation | result |
|---|---|---|
| 1.5 | `moneyPresent`: `v > 0` → `v >= 0` | RED, exit 1 |
| 1.9 | `vendorComplete`: `vendor \|\| {}` → `vendor` | RED, exit 1 |
| 1.11 | `onboarding_state` added to a predicate branch | RED, exit 1 |
| 2.2 | `serviceAreaPresent`: drop the `select_cities` arm | RED, exit 1 |
| 2.6 | 0122: `is distinct from` → `=` in the pairing CHECK | RED, exit 1 |
| 2.8 | 0122: backfill arm 1 assigns `'worldwide'` | RED, exit 1 |
| 2.9 | 0122: add a `rate_starting` column | RED, exit 1 |
| 2.11 | `me.js`: drop `service_area` from a `.select()` | RED, exit 1 |
| 3.1 | `laneFlags`: flag default → `true` | RED, exit 1 |
| 3.3 | `onboardingGate`: `BRIDE_REDIRECT_BYTE = "hi"` | RED, exit 1 |
| 3.4 | `brideIndex.js`: one byte of `DEAD_END_REPLY` | RED, exit 1 |
| 3.6 | bride gate block moved below the meter mint | RED, exit 1 |
| 3.7 | vendor gate block moved below the throttle branch | RED, exit 1 |
| 4.1 | restore `(profileName \|\| claim.invitee_name)` | RED, exit 1 |
| 5.1 | 0122: delete the STALE stamp | RED, exit 1 |
| 5.4 | 0122: add a `drop column` | RED, exit 1 |
| 6.3 | `onboardingGate`: delete the copy lock | RED, exit 1 |
| **6.4** | delete the try/catch | **NOT PROVABLE — declared, see §5** |

---

## 5 · FOUR BENCH DEFECTS, SELF-CAUGHT, ON THE RECORD

All four were found **by running**, not by reading, and three of them were cells
that looked green while asserting nothing.

**B-1 · cell 2.8 reddened on correct code.** It split on the UPDATE statement
head and read the whole tail, sweeping in §3's token CHECK — which must name
`'worldwide'`. Re-scoped to the two UPDATE statements. *A cell that reddens on
the right answer is broken, not strict.*

**B-2 · cell 3.2 was vacuous.** Registered an `async` function inside the sync
`cell` helper, so it compared a Promise to `true` and could never pass — it was
counted as a failure the first run and would have been "fixed" by deleting it.
Replaced with a real async cell in a new §6.

**B-3 · cells 6.3 and 6.4 were vacuous.** `laneFlags` carries a **60-second
in-process cache**. Cell 6.1 resolved the flag to `false` and cached it, so
every later cell read 6.1's answer and never consulted its own stub. 6.3 was
asserting the cache. Cured with `_resetLaneFlagCache()` per cell, plus a new
anti-vacuity cell **6.3b** that counts stub hits and reddens if the read never
lands. **This is the general hazard for any future cell in this file: assert
that your fixture was consulted, not merely that the answer was what you wanted.**

**B-4 · cell 6.4 is not provable at this delivery.** Two fixtures were tried and
both were hollow: a hostile supabase (swallowed by `laneFlags`' own try) and a
detonating row (never reached — the **copy lock short-circuits before the
predicate**, because the bytes are withheld). With no vetoed byte resident there
is no path to the `catch`. **Declared as a gap in-bench rather than dressed as a
pass; the both-ways proof is OWED at the veto delivery.**

---

## 6 · CARRIED TO THE CHAIR

**⓵ THE VENDOR "NAME" READING — must rule before the gate arms.**
`vendorComplete` reads R-OB.6's mandatory vendor *name* as **`users.name`**, on
two grounds: COMMON's bride half names `users.name` explicitly (one predicate
should not mean two tables by one word), and `api/vendor/onboarding.js:56-57`
already treats `users.name` as the vendor's name from signup. The live
alternative is **`vendors.business_name`**, which `coupleSystemPrompt.js:77`
prefers when `users.name` is absent. **OB-P's form will validate whichever field
this file names**, so a wrong reading makes every vendor incomplete on a field
she has already filled. The gate is dark, so nothing is refused meanwhile — but
this must be ruled before OB-P seats, not after.

**⓶ `category` IS IN `me.js`'s `LOCKED_FIELDS`** (`:176`). R-OB.6 makes it
MANDATORY for vendors, and the predicate reads it, but no vendor can currently
set or correct it through the profile API — it is writable only by the retiring
conversational flow (`agent/onboarding.js:268`) and by admin. When ruling ③'s
retirement lands, **category loses its last vendor-reachable writer.** The
endpoint cure (F-OB.2) must open it, or the arc creates an unfillable mandatory
field. Not fixed here: the endpoint cure is not D-2 scope. **Flagged as a
sequencing dependency on ③.**

**⓷ `me.js` D-2/D-3 split, declared.** D-2 is **additive only**: `service_area`
/ `service_cities` join both selects, the allowlist, both response shapes, and
the validator. **`open_to_travel` and `travel_notes` were left entirely alone** —
removing a name from the allowlist stops new writes (the F4 precedent in that
file), and this repo cannot see whether the PWA's Discover Profile still sends
them. Pulling them would degrade a live editor on a guess. Their removal is D-3,
coordinated with OB-P, enforced by the arc's completion cell.

**⓸ 0122's NULL reading, declared in-migration.** `open_to_travel` is
`boolean default false` and therefore nullable. Backfill arm 2 uses `IS NOT
TRUE`, treating NULL and false alike, because both mean "never said yes" and the
conversational question's other half ("mostly within {city}") is true of both.
If the chair reads NULL as *never asked*, arm 2 narrows to `= false` — a
one-predicate amendment in a later migration, not a rewrite.

**⓹ 6.4's owed proof** (§5, B-4) — rides the veto delivery.

---

## 7 · APPLY

Head-guard first: `head -2 package.json` must read `"name": "dream-os-backend"`.

```
unzip -o OB_D2_dream-os.zip && cp -r deploy/* . && rm -rf deploy OB_D2_dream-os.zip
```

Then, in order:

1. `npm ci && npm run build` — both exit 0
2. `node scripts/bOB_d2_onboarding_gate_bench.js ; echo $?` — GREEN, exit 0
3. **0122 is founder-run in the Supabase SQL editor**, not by any script. Its
   §6 verify SELECTs are at the foot of the file — paste the three result sets
   back before the git line.
4. The git line is its own paste-block, and it never runs on a failing verify.

**The gate is dark and the bytes are withheld, so applying this changes no
observable behaviour on either lane.** That is the intended state.
