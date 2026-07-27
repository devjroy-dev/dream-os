# TDW_06 — THE F-06.86 SITTING · EXECUTOR HANDOVER
## The absence arm learns the other mouth

**Base:** `7f61895` (re-derived at origin, fetch-first, at delivery).
**Role:** LE / executor, code-capable. **Repo:** `devjroy-dev/dream-os` alone (dreamos-pwa untouched).
**Authority:** the thirteenth chair's kickoff (2026-07-28, chat paste-block per the transport law) + chair rulings R-1..R-4 on the read-first, recorded in chat the same day.
**Delta:** `scripts/b06_gauntlet.js` · `scripts/b06_m1_bench.js` · `scripts/b06_m2_bench.js` · this document. Nothing else. **W-1 HELD SHUT** — zero soul, prompt, voice, engine or production-path bytes; this sitting lives in `scripts/` and `docs/specs/` alone. No SQL, no migration, no env var, no engine TS moved (the `npm run build` in the verify line rebuilds an unchanged engine because the gauntlet refuses to run without a dist, by design).

This document carries **no CE number**, touches **no FINDINGS_LOG entry** and **no masterplan row** — those are the chair's (clobber law). The chair cuts the log entry from this handover.

---

## 1. WHAT SHIPPED

### Hole (a) — the arm judges every mouth (R-1: PER-MOUTH, merged corpus REFUSED)

`recencyFidelity` (b06_gauntlet.js) now builds its corpus as **[Victor's outward prose, ...every `listen_harvey_talk` voiced text]** — the four-precedent extraction (`moneySightings` / `timeFidelity`'s own shape) at the arm's own lines — and judges **each mouth separately**: its own honest-vocab strip, its own denial test, its own gap sentence, its own arrival evidence over its own absence-stripped text. `handsDated` is shared (the hands are the estate's, not a mouth's).

- **`ok` = worst-of-mouths.** A guilty relay convicts the turn even where Victor's mouth earned its acquittal, and vice versa; the conviction line **names its mouth** ("on the relay to Harvey"). An earned acquittal is one mouth's alone and cannot launder the other's — the merged-corpus fork was refused precisely because an arrival in his sentence would have excused a denial in hers (F-04.78's geometry institutionalized), and because a merged conviction cannot say *who*, and the cures live in different souls.
- **`quality` speaks for VICTOR'S MOUTH ALONE, by ruling.** The attribution arm's gate reads `quality` to attribute the relay channel; a quality that spoke for the relay would attribute her own sentence against itself (the census circularity, derived at read-first, closed at R-1). Relay convictions ride `ok`/`why` only.
- **Single-mouth turns reduce to the pre-F-06.86 path exactly** — no relay present, the historic return strings byte-for-byte (asserted at selftest [27]'s reduction cell).
- **The DATES DROPPED / DATES CARRIED census is untouched in code and unchanged in gating:** `handAttribution`'s `verdictTurnsOnIt` still reads `quality === 'denied'`, and quality's subject did not move. What DOES change on a live run: a relay-guilty turn now REDs the lane verdict where it previously greened — that is the cure, and it stacks on CE-90's not-byte-comparable caveat (§5 below), never replaces it.

### Hole (b) — the landing-verb requirement retired (R-2: W1 + W2; W3 DECLINED-WATCHED)

`RECENCY_ABSENCE_RE` gains exactly two arms, both ruled:

- **W1** — the inbox-state arm widens `inbox is quiet` → `inbox is (?:quiet|clear|empty)`. A state needs no landing verb.
- **W2** — the verbless bounded arm `\bno (?:new|fresh) (?:enquir|lead|message)\w*\b`, bounded by the noun class and **double-bounded by the `RECENCY_ASK_RE` gate** (only a recency ask is ever judged; existence turns stay `ABSENCE_CLAIM_RE`'s, unchanged).

**THE W3 WATCH, NAMED PER R-2:** the state-of-slate arm (`slate is empty` / `all quiet on the … front` shapes) was proposed at read-first and **DECLINED-WATCHED** by the chair — no live specimen; CE-81's discipline, a widening earns its arms by evidence. **It returns the day a live turn speaks such a shape, with that specimen as its fixture.** Any run reader who meets a verbless slate-shape absence that walks should hand the verbatim sentence up unnumbered.

**Masking, asserted as cells, never prose:** F-06.84's acquitting phrases ("this reach cannot say", "unknown this turn") match **no** widened arm and still walk to `HONEST_GAP_RE`'s acquittal — F-06.84 stays un-ruled by this sitting. The widening changes no case mode (`/i` before and after) — F-06.35's gap stays its own finding's job (CE-81's `/Donna/` case-exact precedent, applied as a `flags === 'i'` cell).

### R-4 — F-06.90's comment cure, both in-file instances

The gauntlet's lifter paper (the siting comment above `handAttribution`) claimed **four** benches lift `recencyFidelity`, naming `b06_m4b_bench` — false at 7f61895: m4b lifts `openerFidelity` via a range slice that never reaches the arm; the true lifters are **m1/m2/m3**. Cured in the comment AND in the [23] cell title that repeated the same sentence, each cure naming F-06.90. (The kickoff's repetition of the error is the chair's, owned as correction №1 in the ruling record.)

---

## 2. PROOF

**Selftest 278 → 297** (+19, all in the new section **[27]**; every pre-existing cell green and unamended). [27] carries, as named cells: the four chartered hole-(b) specimens **verbatim** (quiet/clear · have-landed/since-we-spoke), the e2e twin pair (verbless denial convicts / verbless denial bounded by its own arrival walks), the four masking cells (F-06.84 ×3 incl. e2e-through-the-widened-set, F-06.35 case-mode), the **wrong-mouth pair** (honest reply over an absence-speaking relay = CONVICT naming the relay; the inverse convicts Victor's mouth with no relay tail), quality-speaks-for-Victor, each-mouth-earns-its-own-words, worst-of-mouths on the double denial, the relay NO-READ shape, **R-1's non-vacuity by construction** (the refused merged corpus simulated on the wrong-mouth fixture itself — it acquits where per-mouth convicts), the single-mouth reduction across all four quality states, and the structural pin on the extraction expression.

**Both-ways, four mutations of the SHIPPED code — never test setup — each run out-of-process, tree restored byte-identical after each (cmp-verified), reds enumerated:**

| Mutation | Result |
|---|---|
| **M-A** — the extraction reverted (`listen_harvey_talk` → a never-matching name inside the arm alone) | **292/297 — 5 RED**, on exactly hole-(a) ①⑤⑥ + R-1 NON-VACUOUS + STRUCTURAL |
| **M-B** — W1 reverted (`clear\|empty` struck) | **296/297 — 1 RED**, hole-(b) ② alone |
| **M-C** — W2 reverted (the verbless arm struck) | **296/297 — 1 RED**, hole-(b) ④ alone |
| **M-D** — worst-of-mouths killed (`judged.slice(1)` → empty slice) | **293/297 — 4 RED**, hole-(a) ①⑤⑥ + R-1 NON-VACUOUS |

M-A **is** the uncured extraction — the uncured tree fails on exactly the cures.

**The floor at delivery, every count run by command at the cured tree, matching the kickoff §5 exactly:**

```
b06 m0 50 · m1 45 · m2 39 · m3 37 · m4 33 · m4b 24 · m4c 20 · m4d 16
f0658 20 · f0667 16 · f0681 12 · advisor 16 · advisor_route 16 · 0081 12
sonnet 13 · donna_cache 16 · b0461_p6 25 · b6_floors 47 · b6_s1 24 · b6_sitting2 22
b05 f0550 31 · arc_m2 27 · arc_m4 18 · arc_m5 11
gauntlet --rig-selftest 297/297  (was 278; +19, section [27] — the disclosed growth)
KNOWN RED, not this sitting's: b06_meter_bench 28/29 (F-06.41), carried loudly
```

**SKIPPED, NAMED (floor-method law):** `b6_door_rider_bench` — creds; the named credential-drop specimen, never counted green. Live gauntlet lanes — founder's keys, live-lane. Benches outside §5's list + `donna_cache` — no shipped byte reaches their surfaces (this delta is three `scripts/` files and one doc), a declared judgement, not a claim of coverage.

---

## 3. LABELED FLOOR AMENDMENTS — both count-preserving, ratify-or-revert

**(a) `b06_m1_bench` — three mutation needles follow the shipped bytes** into the per-mouth loop (`text`/`dated`/`fresh`). Labeled at site with the F-06.86 attribution. **Each mutation's MEANING is unchanged** (strip order reversed / date test off / signal un-hoisted) — re-aimed at the referent, never re-aimed to stay green (m1 §4.1's own A2 form). The `§2.1` needle (`if (!claimsAbsence) {`) survives untouched — the shipped code kept that line byte-exact. **45/45, mutations green in the child harness.**

**(b) `b06_m2_bench` — four mutation needles follow the shipped bytes**, labeled at site. `§3.5`'s needle goes **FULL-LINE by the chair's ruling** (the vocab-strip fragment could in principle recur; a full line has one home — this file's own A3 first-match lesson). `§3.4` (ask gate) and `§4.1` (`REPLY_ARRIVAL_RE`) needles untouched — their referent lines did not move. **39/39, mutations green.**

**`b06_m3_bench`: ZERO amendment, as measured** — its two GAUNTLET needles target the `quality` ternary, which shipped byte-preserved (deliberately: the ternary is m3's referent and the census gate's subject). 37/37. **`b06_m4b_bench`: ZERO amendment** — its slice (`_OPENER_DEFLECT_RE` → the M-2 marker) contains no shipped byte of this sitting. 24/24.

---

## 4. THE RETROSPECTIVE DERIVATION (Fork 3, transport approved at R-3)

**The ruled premise:** the arm judged Victor's `r.reply` alone from `c736a7e` (2026-07-24, the M-2 commit that shipped the re-aimed detector) to this ZIP. Therefore every SD-FRESH / SD-ABS / SD-EXIST "absence honest" **green** in that window was scored with Donna's relay invisible, and **no such green is re-used as a baseline** until this derivation is read against it. This **stacks on CE-90's not-byte-comparable caveat** (the fixture repair) and on NOTE_12 §9.6 (numbers from before a rig repair are the prior era) — it replaces neither.

**Evidence-base classes, per R-3** — each item below carries one: **[MP]** masterplan row 42 (committed) · **[LOG]** a FINDINGS_LOG entry (committed) · **[HO]** a committed handover/walk-note under `docs/specs/` · **[N12]** NOTE_12 alone — *declared as such, never laundered into a log citation* (the CE-82→90/92 log band is absent at origin, F-06.88) · **[GAP]** underivable at origin (chat-side transcripts, founder SELECTs — declared, not filled).

**SD-FRESH family (SD-FRESH · r2 · r3 · r4):**
1. **The M-1 walk record** (CE-72, 2026-07-25: "zero false absences in thirteen; six of nine cold arrivals spoken") — [LOG]+[MP]. **VOIDED as baseline** (live turns; a relay could have spoken absence unseen). The walk's *positive* datum (arrivals spoken in Victor's mouth) is a Victor's-mouth fact and survives as such; its "no false absence" half is the voided part.
2. **The CE-73 cold-run record** (twelve cold turns, twelve dispatches) — [LOG]+[MP]. Its subject was **snapshot-origin provenance** (`tool_calls` null-ness), not this arm's mouth: **F-06.25's closure is NOT voided** by F-06.86. The absence-honest greens *within* those runs: **VOIDED as baseline.**
3. **The CE-82 69-turn / three-lane record** — **[N12] only** (NOTE_12 §6; no log entry exists). Same split as item 2: the F-06.25 closure it carried stands on its own predicate; any absence-honest green within: **VOIDED as baseline**, and the record itself is NOTE_12-resting, declared.
4. **The two attempted acceptance evenings** (both RED overall) — family-level greens within them: **[GAP]**. The per-turn transcripts were never committed; nothing is enumerated, nothing is filled.
5. **The CE-92 measurement**: "attributed conviction fired zero times in 69 turns; all nine DATES CARRIED sat on SD-FRESH turns; RED three lanes" — [MP]. "**L3 SD-FRESHr4 passed on both holes at once**" — **[N12]**, declared. That pass is the derivation's named specimen and is **VOIDED**: it greened through exactly the two holes this ZIP closes.

**SD-ABS / SD-EXIST families — the scope split, stated honestly:** these verdicts never call `recencyFidelity`; their absence-honest greens ride `absenceFidelity` + a reply-only fail-closed test. Their wrong-mouth exposure is therefore **F-06.91's** (minted OPEN at this sitting's rulings: the existence-family relay-blindness mirror — a relay fabricating presence or absence is invisible to all three sites), which is **unbuilt by ruling** and sits beside SD-REL/F-04.78 on the board. Consequence for the retrospective: their desk selftest greens stand **for what they tested** (Victor's mouth against the find's own result — scripted relays known); their live greens in the window (same records as items 1–5, same provenance classes) are **not re-usable as relay-honesty evidence** until F-06.91 is ruled and built. Nothing is claimed cured for these families by this ZIP.

**One sentence for the next run's reader:** the first live gauntlet after this ZIP is a **first measurement on the corrected question**, comparable to nothing before it (this derivation + CE-90 + the F-06.82 notice, stacked); F-06.87's **TIME DRIFT watch is the first thing that run reads**, and a relay-named conviction appearing where a green used to sit is the cure working, not a regression.

---

## 5. FINDINGS FILED THIS SITTING (unnumbered, per the law — the chair mints)

1. **The masking-e2e cell tolerates W1's absence by design, disclosed:** under mutation M-B the F-06.84 e2e cell stays green (the fixture acquits as `gap` whether or not "inbox is clear" matches) — its subject is the acquittal surviving the widening, and hole-(b) ② carries W1's teeth alone. Stated so a future reader does not mistake the cell for W1's floor.
2. **The W3 watch** (§1 above) — standing, named, specimen-gated.

Nothing else surfaced; the read-first's three hand-ups were minted at the ruling (F-06.90 cured here; F-06.91 OPEN, board; the cite drifts owned as chair correction №2).

---

## 6. WHAT THE FOUNDER MUST DO — and what he must not

**Dashboard/console acts: NONE.** No env var, no Railway change, no Meta change, no SQL. This sitting reads no table and writes none.

The apply block, the verify line and the git line ride the chat message this ZIP came with. The verify line ends in the D-10 STOP; the git line is its own paste-block. **Do not run the git line over a red verify.** The verify's `npm run build` step rebuilds an unchanged engine — the gauntlet refuses to run distless by design, and a clean Codespace clone is distless.

**Live witness: none this sitting, by the kickoff's own acceptance** — the cure's live verdict is the NEXT gauntlet run, founder-run with his keys, declared-not-claimed; no smoke card rides.

---

## 7. WHAT THE NEXT SITTING PICKS UP

Nothing from this one. The board in the ruled order, founder-sequenced: **SD-REL / F-04.78** (F-06.91 sits naturally beside it) → **F-06.13's fan-out** → **F-06.84** → the evenings. The clock is at ZERO; nothing in this sitting moves it. Sequencing is the founder's.
