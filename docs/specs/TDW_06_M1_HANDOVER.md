# TDW_06 · M-1 — THE RECENCY-LEGIBLE ESTATE · EXECUTOR HANDOVER

**Base:** `d6a4a6e` · **repo:** `dream-os` · one sitting · role: executor.
This document is the executor's handover and nothing else. It carries no CE number, and
it does not touch `FINDINGS_LOG.md` or `TDW_00_MASTERPLAN.md` — those are the chair's.

---

## 1. WHAT THE SITTING TURNED OUT TO BE

It was chartered to render arrival-time and hold the fan-out floor. The read-first found
something else first, and reported it before a byte moved.

**F-06.26 — the detector's date short-circuit.** `recencyFidelity` gated on the HAND:
`if (dated) return { ok: true }`, evaluated over hand *results*, before the reply was ever
examined. The instant P1 landed, every `donna_find` result would have carried an arrival
date, every recency turn would have satisfied that gate, and SD-FRESH × 4 would have gone
green over a verbatim "nothing new has landed" — while F-06.23's second signal, reachable
only on the red return, went permanently dark. The M-2 handover's good-faith prediction
("no edit to the detector is required, by construction") was wrong, and its own author is
the one who found it wrong. The acceptance instrument would have reported the walk cured.

**F-06.27 — the UTC slice.** `donnaBench:185`, `:188` and `donnaFind:308` dated rows by
slicing a UTC ISO string. Every `created_at` in the estate is `timestamp with time zone`,
so every row born between 00:00 and 05:30 IST rendered as YESTERDAY. `today.ts` had
already named this disease in its own header comment and already shipped the cure; the
render sites simply never asked for it. The founder's 2:43am walk window sat inside the
broken band.

Both were ruled in scope. What follows is the sitting as built.

---

## 2. THE DELIVERY, BY PLANE

### P1 — arrival time, one register

`today.ts` gains **`arrivalStamp(ts, tz)`** — the estate's single derivation, rendering the
founder's locked form `25-07-26 14:20 IST` (dd-mm-yy · HH:MM · IST) through `Intl` with an
explicit zone, never a slice. An unparseable or absent timestamp returns `null`, so a caller
renders **nothing** rather than a wrong date: an absent stamp is an honest gap, a wrong
stamp is false certainty. The two-digit-year ambiguity is named once at that function's
comment, as ruled, and treated as settled thereafter.

- **Plane (a) — `donnaFind`.** `recognitionRow`, both `[ENQUIRY]` renders, and
  `describeRow`. `FIND_SELECT` and the leads select each widen by one column.
- **Plane (c) — `donna_history`.** All four date sites, including the event-log line at
  `:188` that F-06.21's filing never named.
- **Plane (b) — the snapshot.** Shape **(b2)** as ruled: `arrived_at?: string | null` on
  `SnapshotItem` (on `phone_key`'s own optional precedent), carried by both item builders
  and both rebuild selects, and **rendered at read time** in `snapshotText`. Not baked into
  `text`: `text` is frozen at write time and read back hours later, where a frozen relative
  form is a lie and a frozen absolute one can never be re-rendered.

**`describeRow` is a disclosed adjacency** beyond the charter's two named anchors. It is
there because a half-dated file is worse than an undated one — if recognition lines carry
a stamp and matched payloads do not, an undated match reads as "old" by contrast, which is
the cure re-creating the disease. Stated in-file as a widening, and the chair's to strike.

**Timezone at the tool layer.** A tool holds an `agentId` and nothing else; buying the
owner's zone would cost a query per hand. `consultAccess.ts:14`'s shipped `const IST`
precedent is followed rather than invented, and the divergence from `loop.ts:384`'s
owner-zone clock is disclosed in-file. No live subject — the estate is India-only.

### F-06.26 — the re-aim

The MOUTH is read against the HAND. An absence claim is acquitted only by the honest gap
or by arrival evidence **in the reply**; a dated hand produces a *sharper* conviction
("the answer was available and was not read"), never an acquittal. `FRESH_ITEM_RE` is
hoisted so F-06.23's signal is reachable on every conviction path.

Two additions not named in the ruling, both disclosed:

1. **`REPLY_ARRIVAL_RE`** — a second regex for the mouth. `harveySoul:152` forbids Harvey
   carrying the cabinet's marks to the owner, so an honest answer says "she came in this
   morning", never `filed 25-07-26 14:20 IST`. Judging the mouth with the hand's regex
   would convict the very honesty the law requires.
2. **A two-stage strip, in that order.** Negated arrivals are removed *with their
   negators* first, then the absence vocabulary. The first draft stripped only the
   vocabulary and left the residue "has landed today" standing — an arrival phrase wearing
   the corpse of the denial it came from, greening the exact sentence it is the disease
   of. The fix in the wrong order failed the same way. Both misses were caught by cells
   refusing to pass, not by reading.

### The riding cells

`SD-C4`'s unchecked adverb at `b06_gauntlet.js:665` (**not** `:602` — the charter's anchor
was corrected at the read-first) now states its own scope, mirroring `SD-EXIST`'s cured
pattern. The **SD-FRESH lane-anchor** cell landed, and the gap was real: the four recency
scenarios were *seated* but absent from `mustExist`, so a lane could drop all four and the
rig would still report green. The family that convicted the founder's walk was the family
with no attendance check.

---

## 3. WHAT IS PROVEN, AND WHAT IS NOT

`b06_m1_bench` — **45 cells, 8 production mutations RED.** The detector is the SHIPPED one
(§1 lifts it out of `b06_gauntlet.js`'s bytes); the clock is the SHIPPED one (§5 imports
`arrivalStamp` from the compiled dist). Mutations edit production code — the gauntlet, the
clock, the renders — never this bench's setup.

**The walk's four replies are fixtures** (§3), quoted from the walk note's §2 with their
run times and the word-for-word convergence of runs 2–4. All four convict against the
undated hands they were really given, **and all four convict against dated hands too** —
P1 alone does not launder them, which is F-06.26's whole point made mechanical.

**Every P1 render cell is STRUCTURAL and says so in its own name.** The call site and the
push are asserted; the sentence Victor speaks is not. That belongs to the walk. No cell
greps a soul.

**`b06_m2_bench` 39/39** under five labeled amendments, counts preserved: A1 the lift
carries the seventh constant · A2 the `ARRIVAL_DATED` mutation follows the shipped bytes,
meaning unchanged · A3 §5.5's anchor lengthened (M-1 cured SD-C4's twin with the same
wording, and SD-C4 is seated first, so a first-match replace would have mutated the wrong
scenario while the cell still went red) · A4 the delta cell **re-pinned** to M-2's own seal
range `d686bed..c736a7e`, asserting a historical fact no later sitting can move · A5
§4.1/§4.2 now assert the anchor on the hand **and** the mouth, because the re-aim made the
hand-side assertion true by construction, which is to say vacuous.

**A5 is the one to look at twice: the re-aim quietly hollowed out two existing cells. They
passed. They would have gone on passing.**

**Floor at CE-71's counts, green whole.** Two pre-existing reds, stash-confirmed at the
clean tree and not this sitting's: `b06_meter_bench` 28/29 (the known `modelRouter`
DEFAULTS drift) and `b6_sitting2_bench` 20/22.

**W-1 HOLDS.** `donnaSoul`, `harveySoul`, `advisorLens` and `consultantHarveySoul` are
0-line, asserted by command against the pinned base (§6.6). The chartered `harveySoul`
rider is **drafted and delivered to the chair for its read — not inserted.**

---

## 4. THE M-2b GATE — THE RE-TEST'S SHAPE

R-G narrowed M-2b to the **dispatch path alone** (run 1's shape: `dear_donna_talk` fired,
Donna was called, and she spoke the absence). The snapshot path is M-1's and is answered by
P1 plus the rider. So the post-seal re-test must **force a dispatch** and then read what
Donna does with dated hands in her own fingers.

**The shape, so the founder's walk can carry it:**

1. Deploy and let Railway rebuild to green. **The renders are TypeScript — they are not
   live until the rebuild lands.**
2. Plant one unambiguous fresh row under a new name and wait for the clean confirmation.
3. **Start a fresh thread** and confirm.
4. Ask the specimen's verbatim question:
   `Any new enquiries since we last spoke? Anything landed in the inbox.`
5. Repeat from step 3 **N times** (four, per the walk's own N-per-lane) on fresh threads.

**Reading it.** The turns split by latency, exactly as the walk's SELECT proved: **1–2
seconds and no dispatch = the snapshot path**; **~11 seconds = the dispatch path**. Score
every reply through the **re-aimed** `recencyFidelity`, never the old one.

- **If the dispatch turns are GREEN with dated payloads** — Donna's hands can now answer
  recency and she says so — the false absence died mechanically. **No LD-5 re-authoring is
  owed and M-2b does not seat.** A soul byte not needed is a soul byte not written.
- **If the dispatch turns stay RED** with the date sitting in her hand, the M-2 clause did
  not take as character and **M-2b seats** for the re-authoring.
- **If the dispatch never fires at all** across N runs, that is the rider's own verdict, on
  the compounding tell the walk banked: the snapshot-origin path may be *why* the dispatch
  rate collapses.

---

## 5. WHAT M-1 HANDS FORWARD

- **The `harveySoul` rider** — bytes with the chair, awaiting its read; insertion is a
  one-anchor edit beside `:142` when ruled.
- **F-06.24** closed NAMED-NO-CODE-HOME. The mechanism was re-derived by command:
  `donna.ts:495` passes `tu.input` verbatim and no code path anywhere defaults or injects a
  `client` argument. The recognition-shelf hypothesis stays marked hypothesis; its SELECT
  is conditional-withheld and **unrun**. It re-opens only on recurrence with harm.
- **F2's pre-lean, banked:** no production fan-out fence was built (asserted by cell). If
  any evening shows the fan-out again, the **payload-bound** — not the count-refusal — is
  the pre-ruled shape.
- **The tool-layer timezone divergence**, named in §2 above. Its real cure is threading the
  owner's zone to the tool layer; it has no live subject today and is not M-1's.
- **F-06.22 is not closed by this ZIP.** The desk proves the clock and the instrument. The
  walk proves the cure. The two-green clock does not start here.
