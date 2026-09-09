# CE-41 · SEAT F — CLOSE

**Sealed:** dream-os `b505238` (F0 · F1 · F1b, migration `0153`) · dreamos-pwa
`1619cae` (F2 · F2b). **Written at** dream-os `cc00ea3c2fddfe0aefaaeb68cb551a7ac9a58709`,
after seat G's G1 landed on top of the seal. Instruments re-run at that tip before
this note was written: **`b63` 57/57 · `b63_mutations` 30/30**, both green under seat
G's amendments.

**Charter:** R-41.85 — every model lane switchable from the founder's phone, per lane,
per role, with no shell and no deploy. **Delivered.**

---

## 1 · WHAT THE SEAT FOUND

### The largest finding: the basic tier had no route (F-41.86)

`vendors.tier` defaults to `basic`. `0115_tier_vocabulary.sql:104` renamed every
`trial` vendor into it and `:118–120` added the CHECK. That migration rebuilt the four
**cap** keys deliberately at `:137–162` — and left the **route** key behind.

So `model.pwa_vendor.basic` existed in neither the database nor the code matrix, and
every basic vendor resolved on the bare literal at the foot of `resolveModel`: Haiku,
**with no donna split**. Donna was Anthropic on the basic tier and DeepSeek on all four
others. Nothing in the tree, the database or any log had ever said so.

**The founder's own count settled the radius: 25 of 29 vendors.** Eighty-six percent of
the estate, on the default path, arrived at by a rename's radius rather than by any
decision — and **the cheapest tier running the more expensive hand.**

Not cured by this seat, deliberately. Seeding it is a live behaviour change wearing a
migration's clothes, and seat F does not move a lane's live value. It is now a row on
the panel that shows `Anthropic · borrowed` on WhatsApp and `Anthropic · default` in
the app, and the founder's first tap creates its row from what is already live.

### Its companion: a live row nothing can reach (F-41.87)

`model.pwa_vendor.trial` is live, well-formed, carries a donna split, and is asked for
by no code path — the CHECK forbids the tier and `readVictorMode` returns only
`advisor` or `business`. Confirmed from the other side by the count: zero rows hold
the word. It renders read-only on the panel with *No lane reaches this row*, and the
write door refuses it with a 409.

### F-41.46 — two wires, one switch, and only one of them labelled

The WhatsApp vendor door had always routed on `model.pwa_vendor.<tier>`. It now names
its own surface and falls back to the twin when it has no row — **and the trap in that
cure is the part worth carrying forward.** `DEFAULTS` holds no `wa_vendor` entry, so a
naive miss lands on the literal: anthropic, no split. Shipping it that way would have
silently retired DeepSeek from the essential lane and Donna's split from all four, on
the WhatsApp wire, on the day it shipped. The fallback therefore sits *before* the
default matrix and fires only on a genuine row miss. `M1` is that exact defect.

### F-41.96 — the flip that reached the row and stopped

The founder switched Donna to Anthropic at 04:37 and she kept answering on DeepSeek.
`chat.js` set `donnaTransport = undefined` for an explicit Anthropic Donna, which is her
own native path **only when Victor is also Anthropic**; when he is not,
`loop.ts:728`'s `args.donnaTransport ?? transport` hands her his wire. R-41.87's line
printed `provider=anthropic` and was telling the truth about the **route** while the
**wire** was something else.

Cured door-side; the `??` is untouched and simply stops being reached. R-41.87 now
prints `transport=facade|native|shared`, and **`shared` beside a named provider is
itself a finding** — the line is built to be able to say it. Witnessed on the wire at
05:22:14.

### F-41.93 — the stamp belonged to the row

`changed_at` was row-level and the panel rendered it beside every hand, so flipping
Donna made Victor claim an edit he had not had. Per-role stamps in the door; the panel
reads each hand's own. **The guard is the cure, not the read:** the row-level date may
speak only for rows with no per-role stamp at all. Without that one condition the
defect returns one branch lower, wearing a fix.

### F-41.94 — a switch sharing a line with prose

*Answer couples on WhatsApp* broke to four lines at 374 with its value text painted
over the first of them. The flat variant nested a `1fr auto` role row inside the
surface grid's `auto` column; that track sized to text-plus-168px, the title squeezed
to min-content, and the tracks overlapped. **F-41.67's class on the variant its cure
never reached** — seat E fixed the tier row, and the flat row survived because in the
mock it carried no value text beside the switch. Mine did. Cured structurally: every
lane spans the full width, nothing nests, no pixel named.

---

## 2 · WHAT THE SEAT BUILT

| | |
|---|---|
| **The plane** | `model.wa_vendor.<tier>` with a fallback; the lane registry; `SWITCHABLE` built from the F-08.84 classes so no model string is minted; a production cache bust that cascades to borrowers |
| **The doors** | `GET/POST /api/v2/admin/model_routes` — read-merge-write, unknown fields carried, absent rows born from what is live, no free text, the route read back through the router |
| **The witness** | R-41.87 in `buildLlmForTurn`, one home, both doors, naming the wire |
| **The glass** | the Model routes group: six surfaces, tiers as headings, one 44px row per hand, five provenance words, the `Differs from code` chip, the `LLM_PROVIDER` banner |
| **`0153`** | four `wa_vendor` seeds, byte copies of the live rows, `ON CONFLICT DO NOTHING` |
| **Instruments** | `b63` 57/57 · 30/30 mutations · `b61` 51/51 · 33/33 mutations |

**The panel holds no routing map.** Not a lane key, not a provider id, not a model
string — four cells and four mutations exist for that one property, because a copy on
the glass is the day the glass lies about the wire while the founder reads it.

---

## 3 · WHAT THE SEAT GOT WRONG, AND HOW IT WAS CAUGHT

Six, all recorded in the packets they belong to. Four were caught by this seat, two by
other seats' instruments — and that ratio is the honest one.

- **`c-41.34`** — a killed floor left another bench's mutation in
  `recordPrimitives.ts`, a **wallet-law** violation outside my manifest. The
  `--delivery` guard refused the next run and named it. Reversed, not checked out.
- **`c-41.51`** — F2's first cut shipped `app/admin/model-routes/page.tsx`, an orphan
  route with no nav row. **`tdw10_p1_shell` refused it and was right**, and so was the
  ratified IA: Model routes is a group inside the Switchboard, not a room. No bench
  was edited to make it green.
- **`c-41.52`** — I attributed a floor delta by running `node scripts/tdw10_p1_shell*.js`,
  a glob that does not match `.proof.mjs`. It returned rc=1 — a missing file — and I
  nearly reported the defect as someone else's.
- **The dangling symlink at F1** — I checked four above-base benches against a clone
  whose `node_modules` target I had renamed. All four returned rc=1 and I was one step
  from reporting two of my own reds as seat C's.
- **`c-41.53`** — the bride lane would have served `{provider: 'anthropic', model: ''}`.
  True where anyone looks, empty where nobody does. My **first cure was refused by my
  own one-home cell** for introducing a provider literal; the shipped one is a lookup.
- **`c-41.46` / `c-41.49`, found by seat G in my bench.** M14's anchor died when
  R-41.104 gave `vendorLanes` a per-surface advisor arm, and my F-41.96 fixture drove
  the advisor tier on a lane that no longer has one — so it read a missing split as a
  regression. Seat G re-derived both rather than retiring them, and verified F-41.96's
  subject was byte-untouched by reverting its own edits in a scratch tree. **That is
  the right way to inherit another seat's instrument.**

**Two of the six were broken preconditions wearing a defect's costume** — `tools/preflight.sh`'s
own named class, arriving twice in one arc, both one command from being nothing.

---

## 4 · R-41.106 — `??` IS A FINDING, NOT A WARNING

Promoted at the seal, and earned four times.

`b63_mutations` and `b61_mutations` print `??` when a mutation's target matches zero
times. In F1b four anchors died at once because F-41.96 moved the R-41.87 block; in
F2b three died because F-41.94 rewrote the `flat` predicate; seat G's `c-41.46` was a
fifth. **In every case the mutation proved nothing and the cell it guarded was
unproven from that moment on.**

The rule: **a mutation whose anchor has drifted is vacuous, and a harness that treats
"did not fail" as "passed" will report a green suite over an unguarded cell.** The `??`
is the only thing standing between a moved line and a silent hole in the proof. It is
not noise to be tolerated at the bottom of a run; it is a stop.

The corollary seat G's `c-41.47`/`c-41.48` supply from the other direction: a cell can
be vacuous without any anchor moving — §1.1 asserted `provider === 'deepseek'` and a
mutation that deleted the tier slot **passed it**, because the fallback answered
deepseek too. *Same answer, different question.* **Assert the key that was asked for,
not the value that came back.**

---

## 5 · WHAT THIS SEAT HANDS ON

**To seat G.** `0154` deletes `model.wa_vendor.advisor` and R-41.104 takes advisor off
the WhatsApp lane set. **One caution:** `b63 §8`'s four seed cells assert the **`0153`
file**, not the live rows — they read the migration's text. A DELETE cannot red them
and must not be read as though it could. If the chair wants a live-row witness, that is
a new cell against the database, not these.

**To seat E (F-41.85, E2).** The panel is built on the current card's `T` and every
colour is a `T.*` reference — the two authored files contain **no colour literal**, and
`b61 §2` asserts it. When the `--atelier-*` retint lands, the colours to move are all
in one place and there are no others. `modelRoutesCopy.ts` is seat F's copy home,
separate from `switchboardCopy.ts` by R-41.99; if the chair wants one cockpit copy home
it moves whole, and the panel imports three functions and knows nothing else.

**Still standing, all chair-side or another seat's:**

1. **F-41.86** — the basic tier's remedy is a live behaviour decision and the founder's.
2. **F-41.87** — `model.pwa_vendor.trial`'s retirement, one `DELETE`.
3. **`scripts/floor-base.txt` 21 → 23** on dream-os, the chair's next act after seat G.
4. **F-41.108** — R-41.89's persona-name debt, two pwa files, counted on every `b61`
   run so it cannot become the baseline.
5. **`[wire-guard stage2 wa] imperative-miss retry landed the hand; the honest first
   reply was never sent`** — seen on the 05:18 walk turn. Not this plane; named because
   it rode the walk.

---

## 6 · THE LINE OF RECORD

```
SEAT F · CE-41 · MODEL ROUTES · R-41.85
  dream-os    b505238  F0 census · F1 plane + doors · F1b three cures · 0153
  dreamos-pwa 1619cae  F2 panel · F2b three riders
  written at  cc00ea3  (post seat G's G1; b63 57/57, 30/30 re-run there)

CURED     F-41.46 the borrowed lane · F-41.93 the per-role stamp
          F-41.96 the Anthropic Donna's own wire · F-41.94 the flat row at 374
SURFACED  F-41.86 the basic tier has no route — 25 of 29 vendors
          F-41.87 a live row no code path can reach
OWNED     c-41.34 · c-41.51 · c-41.52 · c-41.53 · the F1 symlink
          c-41.46 / c-41.49 — seat G's, in seat F's bench, re-derived not retired
PROMOTED  R-41.106 — `??` is a finding, not a warning
WALKED    05:22:14 · role=donna provider=anthropic transport=facade
```

Seat F stands down.
