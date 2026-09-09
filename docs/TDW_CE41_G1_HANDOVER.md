# CE-41 · SEAT G · G1 — ADVISOR OFF THE VENDOR WHATSAPP LANE

Base `b5052382b7bfee93ba4277bafd50fc1b941a4427` — **re-pinned** from `c52e92a`
after seat F's F1b landed mid-sitting. Floor and the uncured measurement re-run
at the new base.
R-41.104 · R-41.105 · F-41.95 · c-41.45 · c-41.46 · c-41.47 · c-41.48 · c-41.49 · `0154`.

**Precondition:** `npm install` then `npm run build:engine`. `b63` and `b65` §2.3
require `src/engine/dist`; a container without it reports a module-not-found that
is not a defect (ruling 3 of the re-pin note).

---

## §0 — THE MIGRATION NUMBER, DERIVED AGAINST THE RE-PIN NOTE

**It is `0154`, not `0155`.** The note allocated `0155` on the expectation that
F1b took `0154`. Derived at the re-pinned tip:

```
git ls-tree --name-only b505238 db/migrations/   ->  tail 0153_wa_vendor_route_seed.sql
```

F1b shipped **no migration** — its diff is seven files, none under `db/`.
`OUT_OF_ORDER.json`'s register is empty and no `0154` exists anywhere in the
tree. LD-8 says the number is derived at the cut and never claimed from memory;
that holds for a number arriving in a kickoff exactly as it holds for one
arriving in a seat's own head. Shipping `0155` would leave a permanent hole at
`0154` and make every later reader derive why. Filed, not silently obeyed —
the chair overrules in one line if there is a reservation this seat cannot see.

---

## §0b — TWO THINGS THE CHAIR RULED (carried, now closed)

Both accepted in the re-pin note; kept here as the record of why the bytes are
what they are.

**(1) R-41.105's log line does not print `surface=`.** The ruling named
`[engine:mode] surface=… room=business override=yes|no`. The engine cannot
supply the surface: `RunTurnArgs` carries no such field, and `loop.ts` has no
other source for it in scope. Inferring one from `modeOverride`'s presence would
print a fact the file derived rather than received — which is F-41.96's exact
disease (a line reporting the route it intended instead of the wire it took) one
lane over, and this seat will not ship it. The line ships as:

```
[engine:mode] room=<consult|advisor|business> override=<yes|no>
```

`override=yes` already identifies the WhatsApp lane, because the WhatsApp door
is the only caller that passes the field. If the chair wants the word, the
honest way is a second field on `RunTurnArgs` carrying the surface — more than
R-41.105 opened, so it is not taken here.

**(2) F-41.95's re-description is wider than the defect.** Ruling 1 says the
guard "convicts every lookup reply for a flipped vendor." Driven at this tree
(bench §7.4), that is false: a lookup answer carrying no mutation or state word
— `Nothing is on file for 18 December.` — reaches the ladder as `narrated_lookup`
and **walks in both rooms** (`prior_turn_unverified` with no hands,
`corroborated_lookup` with one). What the advisory room convicts is the lookup
answer that *also* carries a state claim — `18 December 2026 is unblocked and
available.`, which is the estate's own 21:42:07 production row. The class is
narrower than the sentence. **The cure is not affected**: the room is gone either
way, and both shapes now earn Donna's read hand. Recorded in the bench so it is
not re-derived; the chair rules the wording.

---

## §1 — WHAT SHIPPED

| File | What |
|---|---|
| `src/lib/modelRouter.js` | `waLaneMode()` — the one home. `vendorLanes(surface, extra, opts)` gains a per-surface advisor arm; `wa_vendor` passes `{ advisor: false }`. |
| `src/api/vendor-engine/chat.js` | The route limb: on `wa_vendor` the column is **not asked**. `waLaneMode` imported. c-41.45. |
| `src/engine/src/core/loop.ts` | `modeOverride?: 'business'` on `RunTurnArgs`; `args.modeOverride ?? agent.victor_mode` at `:299`; the `[engine:mode]` witness line. |
| `src/lib/vendorInbound.js` | `waLaneMode` imported (not via `deps`); `modeOverride` passed at **both** `runTurn` sites. |
| `db/migrations/0154_wa_vendor_advisor_drop.sql` | Drops the orphaned `model.wa_vendor.advisor` row. |
| `scripts/b65_g1_wa_advisor_off_bench.js` | New, 29 cells, seven sections. |
| `scripts/b65_mutations.js` | New, 21 mutations. |
| `scripts/b63_mutations.js` | c-41.46 — M14's anchor re-derived. |
| `scripts/b63_f1_model_routes_bench.js` | c-41.49 — §9's F-41.96 fixture re-sited to `pwa_vendor`. |

**The route limb skips the read, it does not overrule it.** A
`readVictorMode()` whose answer is discarded leaves a live reader of the column
on this lane and keeps it one edit from mattering again. On `wa_vendor` the
question is never asked — bench §1.2 proves it by watching the double's read log,
not by checking the tier that came back, because an assertion on the tier alone
passes on a lane that asks and then discards (mutation M10).

**The room limb is the half that reaches the vendor.** Cure the route alone and
the lane routes business while still *answering* from the advisory room: no
Donna, no estate, no read hands, and the wire guard convicting his lookups.
That was this seat's blocking report and it is why R-41.105 was needed.

**`0154` is the smaller half of Fork C.** `admin/modelRoutes.js` builds its GET
from `LANES` (`:124`, `:137`) and guards its POST on `LANE_BY_KEY` (`:182`) —
neither reads the database to decide what *exists*. A DELETE alone would have
been a cure one tap undoes. The registry arm closes it; the migration removes the
orphan.

---

## §2 — THE WALK (R-41.104 §6, as re-worded by Fork F's ruling)

`soul=` is **not** a witness on this lane. It exists at one site in the estate,
`src/agent/closerEngine.js:1282`, and that is the marketing lane's.

1. In the PWA, flip **DEV440** to advisor (the chip). Confirm the app shows the
   Advisor room.
2. Send Victor one WhatsApp message that asks him to look something up —
   e.g. *anything booked for 18 December?*
3. **Witness (i)** — he answers. Victor's words, not `STAGE2_LINE_LOOKUP`
   ("There was a small glitch…"). No advisory register.
4. **Witness (ii)** — Railway prints
   `[model] surface=wa_vendor tier=essential role=victor provider=… model=…`
   (`tier` is DEV440's **product** tier, never `advisor`).
5. **Witness (iii)** — Railway prints `[engine:mode] room=business override=yes`.
6. Back in the app: Victor is **still the advisor**. Flip DEV440 back.

A disagreement between any of these and the rendered surface is a finding against
the instrument, not the surface (R-39.15).

---

## §3 — FOR SEAT E/F: F-41.88, AND ONE WORDING DRIFT

**F-41.88 (pwa, not touched here).** The Advisor row under *Answer vendors on
WhatsApp* disappears from the panel the moment F2b reads the new lane set — the
server no longer offers the lane, so `GET /admin/model_routes` stops returning
it and the POST refuses the key. No pwa byte is *required* for correctness; the
byte is whatever the panel does with a lane set that shrank by one. Verified
here: `LANE_BY_KEY.has('model.wa_vendor.advisor') === false` (bench §4.2).

**Wording drift, not a defect.** `b63`'s §8 cell is named *"0153 seeds exactly
the four reachable wa_vendor tiers"*. It reads the `0153` **file**, which is
untouched, so it is green and correct — but one of those four keys is no longer
a reachable lane. Seat F's wording, seat F's call. Not touched.

---

## §4 — FENCES HELD

- `victorLines.js`'s `ADVISOR_ON_WHATSAPP` is byte-untouched, asserted **at its
  sha256 load-time guard** (§6.1) rather than transcribed — a cell carrying the
  founder-vetoed bytes would be a second home for them, and the guard is stronger
  than a cell: it kills the process at boot, where a cell only reddens a run
  someone has to read.
- `0080`'s CHECK still admits `advisor` (§5.2) — the PWA needs the word.
- `vendorMode.js` untouched (§5.3); `business` stays legal as the way home (§6.3).
- The cure is a **read**, never a write: one `applyModeFlip` call site remains on
  this lane, the `business` arm of F-40.3's cure (§7.5, mutation M21).
- `laneFlags.js`, the OTP lanes, `capabilities.js`: not touched.
- The pwa repo: not touched.

---

## §4b — THE RE-PIN, AND F1b's ONE COLLISION

F1b touched three files this packet also touches. Resolved by hand against F1b's
own diff, not by a merge tool:

- **`chat.js`** — F1b's work is entirely below this seat's: it rewrote the donna
  wiring branch and R-41.87's line from `:2832` down. This seat's three edits are
  the import (`:42`), c-41.45 (`~:1545`) and the route limb (`~:2816`). Disjoint,
  re-applied onto F1b's file, syntax-checked.
- **`modelRouter.js`** — F1b added `model.bride_app.default` after
  `model.harvest.default`. This seat's edits are `waLaneMode()`, `vendorLanes`'
  third parameter and the `wa_vendor` call. Disjoint. Verified after: the bride
  lane is still in `LANE_BY_KEY`.
- **`b63_mutations.js`** — F1b re-derived four anchors and added ten mutations.
  M14 was not among them and still carried the pre-R-41.104 line; c-41.46 lands
  on F1b's file unchanged in substance. 30/30.

**c-41.49 is the one real collision, and it is a fixture, not a defect.** F1b's
§9 cell drove the founder's 04:37 state through `surface: 'wa_vendor'` and reached
the Anthropic-Donna split via the WhatsApp lane's **advisor tier**. R-41.104
removes that path, so the fixture fell through to the DEFAULTS matrix, where
there is no split at all, and the cell reported `donnaTransport is absent` — a
Donna that was never routed, read as F-41.96 regressing. Re-sited to
`surface: 'pwa_vendor'`, which is the same row and the same state on the lane
R-41.104 §4(d) leaves the room on. **Verified both ways by command**: 57/57 at
the uncured F1b tree as well as the cured one, so the correction does not weaken
the cell. Seat F should know its cell moved.

---

## §5 — WHAT THIS SEAT GOT WRONG

- **Two cells shipped vacuous in the first cut** and were caught by the mutation
  harness, not by reading: §1.1 asserted a provider that the DEFAULTS matrix
  supplies by another route, and §3.2 pinned an assignment where a ternary arm
  walks past. Both re-cut. Recorded because the manifest's own law is that a
  vacuous green is the failure mode the harness exists to find, and it found two.
- **The first §7 called the classifier once.** `wireGuardSpecimen` calls it
  twice; a single call with `priorDeed` undefined returns `prior_deed_pending`
  and never reaches a verdict. The cell read that as the answer and would have
  reported a specimen it had not driven.
- **The bench header claimed a §7 red at the uncured tree** before §7 was
  measured. It greens both ways by construction. Corrected in place.
- **The first packet was cut against a tip that moved under it.** The base was
  re-derived at the cut and was correct then; F1b landed during the sitting. The
  floor, the uncured measurement and all three overlapping files were re-done at
  `b505238` rather than the diff being replayed on trust — which is how c-41.49
  was found at all.
