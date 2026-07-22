# TDW_04.5 — F-04.101 + Q2(a) RIDER + §9 · EXECUTOR HANDOVER

repo: dream-os @ e400e45 · one sitting · executor: Opus (CE-49) · rulings applied:
CE ruling R1–R5 (ninth chair), F-04.101 + Q2(a) + §9.

---

## WHAT LANDED

### 1. F-04.101 — the joint gets its guard (R1)

`scripts/b0498_fresh_crew_rider_bench.js` grows a **§6** section (labeled,
F-04.101-attributed) that drives the **real** `processVendorInbound` through the
C3 fence with a `"fresh"` fixture, over the `b05_m2` bench's own deterministic-
supabase-fake pattern extended with write capture.

Driven through **both transports** (`twilioInputsFrom` and `metaInputsFrom`) — the
m2 two-path doctrine applied to the fence, so a transport that skipped the
short-circuit cannot hide behind the one that took it.

The short-circuit is asserted **whole**, per transport:
- the outbound `messages` row's `body` **is** `FRESH_THREAD_LINE`
- the sent bytes are that same line (row and wire agree)
- `conversations.last_message_at` is bumped
- **`runTurn` is invoked ZERO times** (call-counting stub)
- the thread is abandoned via the **real** `abandonActiveThread` — `state`
  `'abandoned'`, never a delete (engine.conversations is served by the fake, so
  the seam does its real read-then-update)
- the inbound audit row is still written

Plus the both-ways limb at the joint (`"start fresh tomorrow"` falls **through**
to the engine — `runTurn` ran, nothing abandoned, no fresh-line row), a
cross-transport byte-identity assert on the send sequence, and §6c holding
`vendorInbound.js` **0-line** (the fence is driven, never edited).

**`matchFreshWord`, `FRESH_THREAD_LINE`, `abandonActiveThread` and `matchModeWord`
are passed REAL** into the door's deps. Only the LLM turn and the sender are
stubbed.

### 2. Q2(a) — the plane clause (R3) and its witness (R2)

The C4 header at **both homes** gains the chair's ruled clause, verbatim:

> ` For event_id use the booking's name from the lines below, never a note or description.`

- `src/lib/vendor/calendarSignals.js:508` — one line
- `src/api/vendor-engine/chat.js:1236` — one line

Amended bracket: **329 bytes, byte-identical across both homes.**

`scripts/b0498_fresh_crew_rider_bench.js` grows a **§7** section (labeled,
Q2(a)/F-04.101-attributed) witnessing the **full bracket bytes-exact** at both
homes. Section [4]'s existing `.includes(BLIND)` substring witness is
**untouched** — the amendment set against it is EMPTY, which is precisely why
§7 exists: an appended clause slides past a substring witness unguarded.

### 3. §9 — the undeclared lockfile

`src/engine/package-lock.json` (151 bytes, empty lockfile, no deps) landed **at
e400e45 itself** beneath a commit message claiming "engine 0-line". A ZIP cannot
delete: the apply paste-block carries an explicit `rm` line before the git line,
disclosed as the §7 apply command's one lawful extension this delivery.

Root `package-lock.json`'s engines sync (`>=20.0.0` → `>=22.0.0`) **KEEPS**
(ruled, F-05.3-aligned) — untouched by this delivery.

---

## PRODUCTION DELTA (exactly R4's scope)

| file | change |
|---|---|
| `src/lib/vendor/calendarSignals.js` | line 508, one line |
| `src/api/vendor-engine/chat.js` | line 1236, one line |
| `scripts/b0498_fresh_crew_rider_bench.js` | +210 lines (§6, §7, rig, docblock) |
| `src/engine/package-lock.json` | DELETED (via the apply block's `rm`) |

**0-line, asserted or verified:** `src/lib/vendorInbound.js` (§6c holds it) ·
`src/api/vendor-engine/vendorMode.js` · `scripts/b05_m2_vendor_inbound_bench.js` ·
`src/engine/**` · `eventWrite.js` · `occupancy.js` · `scrub.js`.

---

## PROOF (R5)

**Cured tree:** `b0498_fresh_crew_rider` **66/66**, true exit 0 (41 → 66; +25
cases, all labeled).

**The chair's named mutation** — `if (matchFreshWord(body))` →
`if (false && matchFreshWord(body))` at `vendorInbound.js:753`:
- `b0498_fresh_crew_rider` **57/66, exit 1 — 9 FAILs, ALL of them in §6**
  (4 twilio, 4 meta, §6c). Zero FAILs in §1–§5 or §7.
- Every other floor bench: **still green**. The RED is exclusive to the new
  section — which is the finding restated as proof: before §6 existed, that
  mutation REDed *nothing anywhere*.

**One-byte bracket drift** (`description.]` → `descriptions.]`), each home
separately, restored by inverse edit:
- WA home drifted → exit 1: §7's WA exact-byte assert REDs, the cross-home
  identity assert REDs, the clause asserts RED, and §4's pre-existing `headOf`
  witness REDs the divergence.
- App home drifted → exit 1: §7's app exact-byte assert REDs, cross-home REDs,
  §4's `headOf` REDs.
- Restored → **66/66, exit 0**.

**Floor at delivery** (engine built first per CE-53; true exits throughout):

| bench | exit | count |
|---|---|---|
| `b0498_fresh_crew_rider` | 0 | **66/66** (grew from 41) |
| `b0498_wa_assign_punct` | 0 | 17 |
| `b05_m2_vendor_inbound` | 0 | 4 |
| `b0457_assign` | 0 | 30 |
| `b0457_crew` | 0 | 21 |
| `b0457_gap` | 0 | 10 |
| `b0457_crud_crew` | 0 | 19 |
| `b0496_pinlogin_tier` | 0 | 11/11 |
| `b0497_assign_crew_door_guidance` | 0 | ALL GREEN |
| `b5_wa_door` | 0 | 32/32 |
| `b6_referent` | 0 | 36/36 |
| `b6_sitting2` | 1 | **exactly 20/22** — the named F-04.91 pair |
| `checker` | 0 | 101/101 |

Every count byte-stable against the chair's floor except `fresh_crew_rider`,
which grew as chartered.

`node -c` clean on all three touched files.

---

## COPY INVENTORY

**Zero vendor-facing strings.** The plane clause is model-facing snapshot context
— never rendered to a vendor. Disclosed verbatim above. No veto class.
`FRESH_THREAD_LINE` is read, never written. Bench fixture strings are bench-only.

---

## EXECUTOR DISCLOSURES

1. **Oracle exit (self-caught, same turn, read-first phase).** My first floor run
   piped bench output through `tail` and echoed the *pipe's* `$?` — the exact
   incident class the charter names, third instance this arc. Caught before any
   count was banked; harness corrected to `> file; echo $?` and every count in
   this delivery is a true exit.

2. **`git checkout` reverted an uncommitted cure (self-caught, build phase).**
   My first bracket-drift proof restored the drifted file with `git checkout --`,
   which silently reverted the **plane clause itself** — the clause was never
   committed. The run's FAIL pattern looked like a cross-home effect and was not:
   it was the WA home having lost the cure entirely. Diagnosed, clause re-applied,
   both drift proofs re-run with restore-by-inverse-edit. **The FAIL patterns
   reported above are from the clean re-run.** Filed as a live hazard for any
   sitting proving mutations against an uncommitted cure.

3. **§7 caught its own author on its first run.** My bench constant typed a
   typographic apostrophe in `booking's`; production carries ASCII, matching its
   own precedent in the engine tool description (`booking's NAME exactly`). The
   exact-byte witness REDed 3 asserts. The bench was realigned to read
   production's actual bytes — production was not bent to the bench.

4. **`b5_wa_door_smoke` exits 3 by design** (refuses to run without live
   service-role keys). Off-floor, noted for completeness.

5. **`src/engine/dist/`** is built locally for the engine-touching benches and is
   correctly excluded from the ZIP.

---

## NOT IN THIS DELIVERY

- No live witness. Bench-sealed. The Swati pair re-run stays the founder's own
  act under Q5.
- No migration. No SQL.
- Sequencing beyond this sitting is the founder's.
