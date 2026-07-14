# HANDOVER — TDW_03 (CRUDS), CLOSED AT P2 (founder consolidation ruling, 2026-07-14)
**Executor session → the board.** P1 + P2 shipped and PROVEN; P3–P6 absorbed into
TDW_04 v2 (`docs/specs/TDW_04_LEDGER_AND_CALENDAR_FINAL.md`, commit 7f591e0).
Two sittings, one evening. This document is 04's inheritance.

## SHIPPED + PROVEN
**P1 — structural split + landing retirement** (PROVEN by founder smoke after the F1
reversion cycle): 774-line monofile → `components/vendor/slices/` (SliceShell / SliceRow /
DetailSheet + FilterRail/BulkBar stubs) + five colocated slice modules + 38-line thin
router. All logic verbatim; zero behavior change proven per-slice. Landing retired →
redirect (stored-else-`leads`, Q2) — reverted same night when smoke found the landing WAS
the slice switcher (F1), re-executed at P2 behind its successor.
**P2 — the Slice Door + binder cards** (PROVEN: founder smoke + §4.2 confession verified
verbatim in Meera's note/timeline via SQL, 19:52 correction: 20k→60k confessed twice):
chip row per the CE addendum (route-derived active, existing hook write path, accent
token, counts slot reserved for 09); retirement re-executed door-first (two commits);
Clients slice = binder cards from the raw cabinet — money hairline, stage tones, story
timeline on the '\n' accumulation breaks, Edit via the POST door (note APPENDS, labelled
honestly), Ask Victor prefill-not-fire via the Hub's real `draft` param.
**Riders executed (CE-ruled):** (A) leads plane repoint — LD-1's frontend completion;
Piece 4-A leads adapter RETIRED as drift; fetchLeads/fetchLeadDetail/patchLeadState/
createLead/updateLead all typed; real lead thread restored (the adapter had hardcoded
conversation: []); F3 dissolved (binder ids at typed routes). (B) expenses delete →
binder /hide + successMessage polish. R1(b) cross-plane whisper both directions
(phone-key, display-only). Engine rider: recordPrimitives comments corrected to
verified append truth (the description was honest; the comments lied).
**Laws authored:** `docs/TDW_03_CROSSPLANE_CENSUS.md` (R3, standing regression harness;
re-run at 04/06/16 block-closes + any dispatch change).

## RESIDUE — 04 v2's INHERITANCE (named, with owners)
1. **P3 wishbone (absorbed):** the wire is LIVE and waiting — typed leads carry
   `draft` {missing, complete_inline PATCH /leads/:id, tell_victor}; binders carry
   `missing_cells` + draft (complete_inline is **POST** /binders/:v/:id/edit — SCHEMA
   truth, not the spec literal's PATCH). P2 chips render, taps DORMANT by ruling.
   `recordCompleteness.js` names 03 (now 04) as its sole amender. Hub prefill param
   is `draft`, NOT `primer` (primer sans autoSend=1 is a no-op) — spec literal wrong,
   code verified. Prefill-not-fire is the standing primer grammar (CE micro-ruling 2).
2. **P4 interactions (absorbed):** swipes/bulk/filter/sort/pull-refresh + the honest
   delete story. F2 (no post-delete refetch — raw fetch bypasses the invalidation bus,
   pre-existing since the monofile) is CURED HERE via optimistic+undo, not before.
   The P1 remount-on-slice-change nuance is a LIVE path since the Door — P4 judges it.
   Invoice cancel guard is DELIBERATE ("Cannot cancel a fully paid invoice") — not a bug.
   Clients destructive actions arrive here (cards have none by P2 ruling; /hide door ready).
3. **P5/P6 (absorbed):** mastheads (numbers are INK), AddSheet draft-first, skeletons;
   portfolio-first splash per the TDW_13 F-3 addendum (module-scope flag, never a render
   gate, overlay only).
4. **SliceScreen tenancy:** lives inside SliceShell.tsx, CE-ratified. Invoice schedule +
   lead-thread machinery still in it verbatim, guarded by slice — migrate to modules as
   phases rebuild them. SCHEDULE_ENABLED=false stands (route unbuilt).
5. **Cross-plane:** Exhibits A (Meera lost/booked, PHONE-ASYMMETRIC — the flagship twin
   is invisible to the R1(b) chip, by disclosed design; strongest argument for 16's real
   spine) and B (Kavya, Jaipur/Udaipur split-plane edit) SEALED — do not reconcile.
   R2 boundary: dispatch may announce, never link; no soft refs before 16.
6. **Engine lane (02-HOTFIX, not 04's):** stripped sub-1k-token calls; false-not-done
   (Simran); duplicate dispatch (Simran ×2, Ritika ×2); Finding 7 — plane-partial
   consult (Victor read only the typed snapshot, declared "no payment in flight" over a
   ₹20k-received booked binder, 20:30 UTC transcript). Partially addressed by 7f591e0's
   predecessor commit (F12/F15) — verify coverage against this list at hotfix close.

## DRIFT LOG (spec-vs-code, cumulative)
Heredoc delivery retired (§7 amendment governs) · search ln ~214 stale · getCabinet ln 68
· READ FIRST's `src/api/vendor/cabinet.js` doesn't exist — live handler is
`vendor-engine/cabinet.js`, mounted at the vendor path by core.js:34 · binder
complete_inline verb POST · 0072 leads-only (Amendment One) · Hub prefill = `draft` ·
`linked_binder_id` absent from cabinet payload (calendar chip omitted; the gap is
upstream — a future block wiring linked-calendar chips must add it to EVENT_SELECT/
RECORD_SELECT first) · verify-script slips: SliceDoor count (2 not 3), Meera chip
prediction (phone-asymmetric) — both underlying checks sound, both logged as executor
authoring errors.

## VERIFICATION STATE AT CLOSE
tsc --noEmit clean on cleared cache at every delivery (baseline 0). Founder smokes:
P1 full pass (post-F1), P2 Door+cards pass, §4.2 SQL-proven. Engine tsc: byte-identical
pristine-vs-patched (comment rider). No migrations consumed (ladder untouched: 0074 top,
0068 hole harmless).
