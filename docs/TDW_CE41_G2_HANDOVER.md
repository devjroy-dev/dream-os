# CE-41 · SEAT G · G2 — THE ROOM IS THE ROOM'S, NOT THE VENDOR'S

Base `3ffe9c9162aa659a544aec5a93ec5a16011395fd`, derived at the cut.
R-41.107 · F-41.110. No migration, no SQL, no write.

**Precondition:** `npm install` then `npm run build:engine`.

---

## §1 — THE CONTRACT WITH THE PWA (seat D · D2)

**One field. One legal value. Nothing else changes in the pwa.**

`POST /api/v2/vendor-e/chat`, in the **request body**:

```json
{ "message": "…", "room": "advisor" }
```

- **`room: "advisor"`** — the only value that asserts anything.
- **Absent, empty, misspelled, or any other value** → no assertion. The turn falls through to the column exactly as every turn does today. **Fail-closed and silent** — no 400. A page sending a stale value must still be able to talk, and the honest failure of a bad assertion is the business room, which is where R-39.22 puts anyone whose room cannot be established.
- Works identically on the **SSE** and **JSON** paths. Both are threaded; mutation **M32** exists to RED a packet that cures one and not the other.

**Who sends it:** the **Advisor page's own ask bar** at `/vendor/advisor` — the bar in image 1, the one whose placeholder reads *"Ask TDW — 'Am I free on 14 Feb?'"*.

**Who does not:** the **shared Ask TDW sheet**. It sends nothing and stays business on every page it opens on — `/vendor/rooms`, `/vendor/support`, and on top of `/vendor/advisor` too. Founder's ruling, 2026-09-09. Whether that sheet today carries page context is moot by that ruling: **it must not send one.**

**Not `mode`.** This door's own header says *`ai_primer / mode are accepted and ignored`*, so `mode` is a live word here with an existing meaning. Giving an ignored field a behaviour is how a caller that has been sending it harmlessly for months starts changing rooms without anyone deciding that. Mutation **M31** reds a door that reads `body.mode`.

**The Advisor page's main surface stays as it is** — its own shell, its own header, its own intro copy, its own ask bar, distinct from the shared sheet. That is the founder's ruling on the surface and nothing in this packet proposes a byte of it. Copy veto is his.

---

## §2 — WHAT SHIPPED

| File | What |
|---|---|
| `src/lib/modelRouter.js` | `resolveVendorRoom({ surface, modeOverride, roomAssert, columnMode })` — the route's home for the precedence. |
| `src/engine/src/core/loop.ts` | `roomAssert?: 'advisor'` on `RunTurnArgs`; the three-term precedence at `:299`; `[engine:mode]` gains `assert=` and `source=`. |
| `src/api/vendor-engine/chat.js` | The door reads `body.room`; `buildLlmForTurn` takes and routes on `roomAssert`; both PWA paths thread it. |
| `scripts/b65_g1_wa_advisor_off_bench.js` | §8, thirteen cells. |
| `scripts/b65_mutations.js` | M23–M34; seven G1 anchors re-derived. |
| `scripts/b63_f1_model_routes_bench.js` | one anchor re-derived. |

**The precedence, chair-ruled, in order:**

1. **The surface.** `wa_vendor` is `waLaneMode()` and nothing else can speak (R-41.104). An assertion is not weighed on that lane — it is unreachable.
2. **`modeOverride`** — a door saying `business`. Type-narrow so no door can push a vendor *into* the advisory room.
3. **`roomAssert`** — a page saying `advisor`. Type-narrow the other way, so no page can force a vendor *out* either.
4. **The column** — last, and on its way out.

**Two fields, not one.** A single `room?: 'business'|'advisor'` would be smaller and would walk straight through `b65_mutations` **M3**, which exists to RED exactly that widening. Two polarities, neither able to express the other's word: the asymmetry *is* the fence. **M26** reds the collapse.

**The route follows the asserted room, and it must.** Teaching only `loop.ts:299` about `roomAssert` would put the Advisor page's turns in the advisory room on the *business model*, because the column is on its way out and will soon never say `advisor`. **M29** reds that.

**Nothing is written.** `applyModeFlip` still has exactly three occurrences estate-wide — its definition, the PATCH door, and the WhatsApp `business` arm. **§8.12** counts them; **M33** reds a packet that cures the room by writing the column.

---

## §3 — THE WITNESS

`[engine:mode] room=<business|advisor|consult> override=<yes|no> assert=<yes|no> source=<override|assert|column>`

`source=` names the term that actually decided, so a turn's room is legible without re-deriving the precedence from the file. On an Advisor-page turn after seat D conforms: `room=advisor assert=yes source=assert`. On any shared-sheet turn: `room=business assert=no source=column`.

`surface=` is still absent and still deliberate — the engine does not know it, and inferring one would be F-41.96's disease. The door's `[model]` line carries the surface on the same turn.

---

## §4 — WHAT REMAINS AFTER THIS PACKET

- **The column is now last in every path and written by nothing but the WhatsApp way-home.** It retires in a later packet, as ruled. Until then it is what keeps the one orphan `advisor` row's app behaviour unchanged.
- **F-41.113** — the chip's removal shipped without draining what it wrote. One agent of twenty-seven. Block 09.
- **F-41.111 / F-41.112** — Victor asserting a room contradicting the row, and the wire guard having no family for a self-configuration claim. Deferred, soul sitting + guard.
- **The walk** (R-41.104 §6) is now performable: G1 is in the deployed tree, and the orphan row is its fixture. Identify the vendor before touching it, and do not send `business mode` from that number until R-41.104 has been witnessed live — that word is the only thing that empties the fixture.

---

## §5 — WHAT THIS SEAT GOT WRONG

- **§8.1 carried its own copy of the thing it mirrors.** It transcribed the engine's precedence instead of reading it, so a mutation inverting the engine's actual order left it green. Re-cut to parse the `??` chain out of `loop.ts`. The harness found it; reading did not.
- **Two mutations were unsound on their own run** — M27 was a no-op, M28 was unobservable. M28's re-cut carries a real derivation worth keeping: terms 3 and 4 *cannot conflict* given the narrow types, so their relative order has no witness at all.
- **§8.8 counted the function definition as a call site** and reported 3/2 on a correct tree.
- **Eight anchors across two benches died on G2's edits** and had to be re-derived. Foreseeable — G1's own c-41.46 was the same class, one packet earlier — and not foreseen.
