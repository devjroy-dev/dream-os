# repo: dream-os @ c7c1be1
# R-36.5 · F1 HARDENING — LE DELIVERY HANDOVER

Built at `c7c1be1`, fresh clone, `git fetch -q origin` first, tree clean before the
NAMED BASE was taken. Sibling `dreamos-pwa` cloned beside this repo at `a534329` so
the floor ran sibling-full.

**F2 IS NOT IN THIS DELIVERY. It is HELD on two collisions found before a byte was
written — §6 below. F3 ships zero bytes as ruled. Copy inventory: ZERO.**

---

## 1 · FILE TABLE

| file | state |
|---|---|
| `db/migrations/0129_agents_user_id_unique.sql` | NEW — founder-run, **runs FIRST** |
| `src/api/middleware/agentBridge.js` | MODIFIED — F1 arm (a) |
| `src/engine/src/core/signup.ts` | MODIFIED — `createOwner`, scope-grown by ruling |
| `scripts/b05_r365_agent_race_bench.js` | NEW — 17 cells |
| `scripts/floor-manifest-r365-f1.txt` | NEW — this delivery's declared dirt |
| `docs/specs/TDW_R365_F1_HANDOVER.md` | NEW — this file |

---

## 2 · FOUNDER STEPS — NUMBERED AND ORDERED. THE ORDER IS THE RULING.

`onConflict: 'user_id'` compiles to an `ON CONFLICT (user_id)` inference clause, and
**Postgres ERRORS when no unique index matches it.** Deploying the code before the
index would make every first touch fail loudly — the disease traded for a worse one.
So:

**STEP 1 — run 0129 in the Supabase editor.** Paste the `BEGIN; … COMMIT;` block from
`db/migrations/0129_agents_user_id_unique.sql`.
Its precondition is your own `0 · 0` dedupe witness (CE-224 / R-36.4). If this errors
with *could not create unique index*, the estate has re-duplicated since that witness
— **do not force it**; re-census, dedupe, return here. The error is the guard working.

**STEP 2 — run the two verify blocks, each pasted ALONE** (0123's law: the editor
renders only the last statement's result set). Both are in 0129's footer, commented.
- BLOCK 1 expects exactly one row, and `indexdef` **must contain UNIQUE**.
- BLOCK 2 expects **zero rows**.

**STEP 3 — git push** (your line, separate paste block below). Railway redeploys and
the code that needs the arbiter meets an arbiter that already exists.

---

## 3 · WHAT MOVED, AND WHY

**`agentBridge.js`** — the bare read-then-insert became upsert-on-conflict-re-read.
`ignoreDuplicates: true` is load-bearing and is **not** the supabase-js default: the
default (`false`) compiles to `ON CONFLICT DO UPDATE`, which would let the race
**loser overwrite the winner's** `display_name`/`profession_preset` with whatever it
happened to hold. `DO NOTHING` makes the loser a reader, which is what it should
always have been. The empty result set is the race verdict, read off the wire —
`bornHere` — and the `agent_owner` anchor is gated on it. That gate is the ruling's
loser-safe clause: **`agent_owner` has no unique index of its own**, so an ungated
loser would give one agent two anchors — this cure re-creating its own disease one
table sideways.

**`signup.ts` `createOwner`** — same shape, scope grown by chair ruling. Before 0129
a racing loser here minted a silent duplicate; **under** 0129 that same loser gets a
23505, which this function converts into `agents insert failed: …` thrown at a real
person mid-signup. The index does not create the race, it changes the symptom from
quiet corruption to a loud stranger at the door. `existed` now reports `!bornHere`,
because telling a caller it *created* an agent it merely *found* is the same lie the
returning-user path at `:59` exists to avoid.

**`mintDemoOwner` is untouched, and that is derived rather than overlooked**: it
inserts a fresh `users` row every call (`auth_user_id` null), so its `user_id` cannot
collide. An always-fresh minter has no race to lose. §2.5 asserts it stayed bare — a
guard against a later sitting "finishing the job" and quietly widening scope.

---

## 4 · BENCH — 17 CELLS, BOTH WAYS PROVEN ON PRODUCTION SOURCE

`node scripts/b05_r365_agent_race_bench.js` → **17 passed, 0 failed** at the cured tree.

Nine mutations, **every one applied to production source, none to bench setup**:

| # | mutation (production source) | reddens |
|---|---|---|
| M1 | bridge `upsert` → bare `insert` | §1.1 §1.2 §1.3 |
| M2 | `ignoreDuplicates: true` → `false` | §1.2 |
| M3 | `agent_owner` moved out of the `bornHere` gate | §1.5 |
| M4 | loser re-read deleted | §1.4 |
| M5 | `signup.ts` `upsert` → bare `insert` | §2.1 |
| M6 | `existed: !bornHere` → `existed: false` | §2.4 |
| M7 | `mintDemoOwner` also converted (scope creep) | §2.5 |
| M8 | 0129 `UNIQUE` dropped | §3.1 |
| M9 | 0129 precondition witness unnamed | §3.3 |

**A DEFECT IN THIS BENCH, FOUND BY THE BOTH-WAYS RUN AND FIXED — disclosed because a
misleading red costs a sitting exactly as a false green does.** M6's first run
reddened **four** cells, not one: §2's window ended on `existed: !bornHere };`, the
very byte §2.4 asserts, so mutating it collapsed the window and made §2.1/§2.2/§2.3
report *"createOwner still bare-inserts"* about a tree whose insert was fine. Both
windows now close on a declaration no cell reads, and the rule is written into the
`windowFrom` header. This is the same class as `tdw10`'s own noted boundary bug; I
reproduced it before reading that warning, not after.

**A SECOND CORRECTION, CAUGHT BY THE FLOOR NOT BY ME.** The first draft did the
stripper-hygiene work under private cell names (`§0.1`/`§0.2`) and satisfied neither
half of the estate's standing contract. `b07_f0774_stripper_bench` went **RED as a
one-bench floor delta** — it requires a `TDW_STRIPPER_CANARY` marker *and* a `§0.Z`
call-site cell from every bench holding a stripper (F-07.74 + F-07.99). Conformed to
`b05_f056_otp_meta_bench`'s specimen; that bench is back to **20/20 GREEN**.

---

## 5 · FLOOR

- **Instrument: this container.** `npm ci` succeeded, `npm run build:engine` clean, so
  the substitution clause was **not** used and no chair-clone stand-in is claimed.
- **NAMED BASE**, clean tree, sibling-full: **21 RED, `FLOOR = NAMED BASE, no delta`.**
  Tree clean after the run (LESSON 3's guard).
- **AFTER**, `--delivery scripts/floor-manifest-r365-f1.txt --check`:
  **21 RED, `FLOOR = NAMED BASE, no delta`**, `[F-14.16] declared files unmoved — set
  and contents both verified.`
- The new bench joins the floor GREEN, so `scripts/floor-base.txt` is **unchanged** —
  no base edit rides this delivery.
- Count movement: **21 → 21, same names.** Nothing was added to the red set and
  nothing removed.

---

## 6 · ⚠ F2 IS HELD — TWO COLLISIONS, REPORTED NOT WORKED AROUND (§0.2)

The chair ruled F2 = arm (b), tier-scoped degrade. I did not build it. Two things the
read-first did not surface, both derived at `c7c1be1`:

**COLLISION 1 — the estate has a standing in-code ruling that refuses tier-word
predicates BY NAME.** `chat.js:2884-2891`, on `cappedReplyFor`:

> keying on `turns_cap === 0` and never on the tier WORD is deliberate … a tier-word
> predicate would have made this cure a rename's hostage the next time the vocabulary
> moved — 0115's whole lesson.

A degrade gated on *"is this vendor basic?"* is precisely that predicate. It may still
be right — the meter is unreachable in the degrade path, so the tier word looks like
the only signal left — but it contradicts a ruled comment and cannot be written
without the chair lifting or distinguishing it.

**COLLISION 2 — the floor cannot see this cure break, so a wrong build would ship
green.** `tdw10_combined_cap_bench` §1.2 asserts **exactly one** WA branch sending
`WA_CAP_ZERO_LINE`. The degrade adds a second sender. It would slip past only because
the regex requires the branch to open `if (capMeta…)` and mine would open in a
`catch` — *green by spelling accident*, which is not green. And worse: **that bench is
already RED at base** (§6.4 alone: `0121 is the ladder's tip`, stale — the tip is
0128). So a real breakage would hide inside an expected red and the floor would report
*no delta*. That is LESSON 3's exact shape — "correct by luck, over corrupted source".

**A third thing, derived, that may dissolve the fork.** `buildMeta`'s cap read
(`chat.js:2728-2729`) needs **only** `tier` — `admin_config.vendor_ai_daily_<tier>`.
Only the two usage counts need `agentId`. So on a resolve failure the cap value is
still readable, and the degrade could key on `turns_cap === 0` after all, honouring
`cappedReplyFor`'s law and the founder's stated interim lever (a vendor on *any* tier
whose dial he sets to zero gets the same true sentence). **This is a proposal, not a
build.** It carries a live-data dependency I cannot witness from here: `chat.js:2758`
records all eighteen cap keys at **minimum value 3** as of 2026-08-07, so if
`vendor_ai_daily_basic` is not **0** today, this arm degrades a basic vendor to the
hiccup line and F2 does nothing. **A founder SELECT on `admin_config` decides it.**

**FOR THE CHAIR:** F2's arm, and whether the stale `tdw10` §6.4 ladder cell is repaired
in the same sitting so the floor can actually gate the cap seam.

---

## 7 · SCOPE NOTE — OBSERVED, NOT FILED, NOT CURED

`createOwner`'s **users** insert (`signup.ts:70`) is also bare, and two concurrent
signups would both miss `existingUser` and both insert. That arbiter — `auth_user_id`
unique — **already exists and pre-dates 0129**, so it is not a condition this delivery
creates, and the ruling grew scope by one function for the *agents* insert. Left
alone, stated here so it is not rediscovered as new. Chair's call whether it files.
