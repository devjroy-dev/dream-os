# TDW_04.5 — F-04.98 C3 + C4 + F-05.19 RIDER · EXECUTOR HANDOVER

repo: dream-os @ 6620782 · one sitting · executor: Opus (CE-49) · rulings applied:
F1/F2/F3/F4 (forks) + R1–R5 (the b05_m2 verbatim-guard collision).
Clobber law: this file rides the ZIP. It is not a CE entry and touches neither
FINDINGS_LOG.md nor the masterplan.

## WHAT SHIPPED

**C3 — the fresh-thread word (WA vendor lane).**
`vendorMode.js`: `FRESH_WORD` + `matchFreshWord` (pure, whole-message, trimmed,
case-insensitive) + `FRESH_THREAD_LINE`, homed beside their mode-word siblings and
exported. `MODE_WORDS` and `matchModeWord` are byte-identical — the sibling-predicate
shape (ruling F1) exists precisely so the flip predicate's ('advisor'|'business'|null)
contract is never widened.
`vendorInbound.js`: the intercept, FENCED per R1(a), sited immediately after the
mode-word block. It calls `abandonActiveThread` DIRECTLY (F2b) — `victor_mode` is
neither read nor written; a fresh thread is not a room change, it is the same room,
empty. It short-circuits exactly as the flip does (send → outbound row →
`last_message_at` → log → return), so the engine does not run that turn and cannot
re-populate the thread it just emptied.
ONE line, no changed/noop split (F2a): `abandonActiveThread` is idempotent by
construction, so the line states a truth on a live room and an already-fresh room
alike. The mode words need their split because "switched" would be a false state
claim; mimicking it here would be pattern without the pattern's reason.
`index.js`: `abandonActiveThread` added to the existing `chat` require;
`matchFreshWord` + `FRESH_THREAD_LINE` to the existing `vendorMode` require; all
three into `vendorInboundDeps`. This is the ONLY production dep-assembly site —
verified by enumerating every caller of `processVendorInbound`.

**C4 — the crew-blindness disclosure, BOTH homes (ruling F3).**
`calendarSignals.js:492` (WA door) and `chat.js:1099` (app door): the rendered
snapshot header now discloses its own crew-blindness and points at the tool. The two
headers are byte-identical (md5-verified, and asserted on the BUILT strings by the
bench, not on source text). The engine is 0-line: F-04.97's tool description still
carries its own line, untouched — the cure is additive, one mind told the same thing
on both surfaces (F-04.65).

**RIDER F-05.19 — the marketing status log.**
`marketingIndex.js`: each delivery error now names itself as `code:title`, so a 131049
identifies itself instead of hiding behind `errors=1`. Extractor 0-line —
`metaInbound.js` untouched; it already handed over the raw `errors[]`.

## TWO DISCLOSED DEVIATIONS (executor-flagged, for ratification)

1. **`statusLogLine` lifted to a named exported function** in `marketingIndex.js`,
   rather than the format being appended inline at the print site. Reason, stated
   plainly: my first cut of the bench re-typed the formatter locally and PASSED on the
   uncured tree — vacuous, and caught only by running the uncured column. A formatter
   living inside an unexported async handler cannot be driven by a bench, and a bench
   that re-types the format string proves only that the bench can type. Same file, same
   site, zero extractor lines, no behaviour beyond the ruled append.
2. **The C4 sentence ships as** `Crew assignments are not shown here — signal
   donna_assign_crew; the calendar adjudicates.` — capital C and a terminal period
   (two characters off the chartered string), because it now follows a sentence inside
   the header. Identical in both homes.

## THE b05_m2 VERBATIM-GUARD COLLISION (R1) — WHAT WAS DONE AND WHY IT IS NOT A WEAKENING

The M2 bench pins `vendorInbound.js`'s core byte-identical to a frozen historical
region (`git show 3afc4ba:src/index.js`, 181–970). Adding door logic there — which the
charter instructed — collides with it head-on.

The executor's P7b-precedent theory was WRONG and the chair killed it by derivation.
Re-derived here by command and confirmed: `git merge-base --is-ancestor 3075544 3afc4ba`
returns true, and the frozen region already carries `matchModeWord` at its line 684 —
the mode block is baseline bytes, not a precedent for adding anything.

Applied shape (Ruling №1's class, 4th instance):
- The C3 block is fenced with exact markers `// F-04.98 C3 BEGIN (CE-ruled, ninth
  chair — fresh word)` … `// F-04.98 C3 END`. The markers are in-code attribution and
  the mechanical fence, one home.
- `verbatimDiff()` splices ONLY the lines between those exact markers, inclusive, out
  of `actual` — symmetric to the existing `expected`-side filter that drops the two
  extraction-removed requires. Assertions untouched. Header note names F-04.98.
- Jurisdiction is stated in the amendment's own comment: this bench guards extraction
  fidelity of the ORIGINAL bytes and continues to; the fenced block is post-extraction
  feature code whose guard is this sitting's own bench. No bench is asked to see what
  another proves.
- The M2 dep fixture gained the three C3 deps. `matchFreshWord: () => false`, so the
  fixture text takes the engine path exactly as before — the two-path byte-identity
  proof is untouched, and "fresh" never rides that fixture (disjoint strings).

**R1(d), the surgical proof — the fence cannot swallow neighbour drift.** Three
production mutations OUTSIDE the fence, each REDing the guard: immediately above it
(drift at core line 694), immediately below it (700), and far away in the core (675).
Restore → 4/4 green.

One incidental find while fencing: my original insertion carried a separator blank line
after the block. It was removed rather than absorbed into the fence — a fence that
swallows a baseline blank is exactly the creep R1(d) exists to forbid.

## PROOF

- Sitting bench `scripts/b0498_fresh_crew_rider_bench.js`: **41/41 cured**.
- **Uncured tree: 18/41** — 23 FAILs on exactly the cures (C3 12 · C4 4 · rider 7).
  Invariant cases (mode contract, thread seam, engine-untouched, extractor 0-line)
  correctly stay green on BOTH trees; they are invariants, not cures.
- **Non-vacuity by PRODUCTION mutation**, each convicting precisely and only its own
  cases: `===`→`.includes()` on the predicate → the two contains-cases; altering the WA
  header alone → the byte-identity case; dropping `title` from the formatter → the title
  cases. Tree restores to 41/41 after each.
- **Sealed floor, byte-stable, counts matching:** b0498 17 · assign 30 · crew 21 ·
  gap 10 · crud_crew 19 · b0496 11/11 · b0497 ALL GREEN · b5_wa_door 32 · referent 36 ·
  checker 101 · b6_sitting2 EXACTLY 20/22 (the F-04.91 pair).
- **Regression sweep green:** m2 4/4 · media_shim 14/14 · wa_words 19/19 ·
  fresh_thread 10/10 · pwa_flip_seam 9/9 · m1b 6/6 · prospect_lane 47/47 ·
  door_rider 15/15 · webhookcore 43/43 · m1_transport 16/16 · meta_router 31/31.
- **Guards:** engine diff 0 lines · `eventWrite.js` / `occupancy.js` / `scrub.js`
  0 lines each · `node --check` clean on every touched file.
- Engine build step run per CE-53 (`npm install` + `tsc`, exit 0) before any
  engine-touching bench.

## R5 — WITNESS PATH, CODE HALF (derived by command at this base)

    handset +918757788550
      → POST /webhook/meta                          src/index.js:212
      → metaInputsFrom(msg, req.body, resolvedMedia) src/index.js:239
      → processVendorInbound(inputs, vendorInboundDeps) src/index.js:240
      → mode-word gate, PASS-THROUGH on non-mode text  vendorInbound.js:727
      → fresh-word gate, PASS-THROUGH on non-"fresh" text vendorInbound.js:753
      → fetchCalendarSnapshot (now carrying the C4 line) vendorInbound.js:769
      → runTurn(...)                                  vendorInbound.js:776
      → donna_assign_crew signal collected            calendarSignals.js:240
      → applyCalendarSignals → mutateEvents           calendarSignals.js:535
      → mutationLines → reply suffix                  calendarSignals.js:550, :356
      → sendWhatsApp(phone, replyText, [])            vendorInbound.js:830

Both witness sentences are non-"fresh", non-mode text: they pass BOTH gates untouched
and reach the engine exactly as they did before this sitting. That is the property the
witness tests.

STATE HALF is the chair's, from the witnessed record (Note VIII §3): Swati on the
roster, assigned to "Ananya - recce" 2026-07-25. The founder confirms it unchanged at
witness time and walks ONCE, after proof.

## WHAT THIS SITTING DID NOT DO

- No migration, no SQL, no secret, no push.
- Bride lane untouched. Reported in the read-first and unchanged: `brideInbound.js` has
  no mode/fresh-word analogue and `runBrideAgenticTurn` takes no calendar snapshot, so
  neither the C3 seam nor the C4 blindness class has a counterpart there.
- F4 (streaming happy-path) closed by audit with no cure: the SSE block reaches
  `mutateEvents` at `chat.js:1490` unconditionally on the happy path.
- The clash witness stays DEFERRED (F-04.88 + F-04.92 pair) — byte-ready-dormant, not
  this sitting's to wake.
