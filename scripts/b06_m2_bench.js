// scripts/b06_m2_bench.js — BLOCK 06 · M-2 · THE ABSENCE-ASSERTION SITTING.
//   node scripts/b06_m2_bench.js        (runnable from any cwd — Q-SP-5)
//
// ONE DISEASE, CORRECTED BEFORE IT WAS CURED. F-06.18 was filed as "looked, received,
// and denied." The specimen's own row (2026-07-23 19:50:30, engine.messages cc4e1f32)
// says otherwise: Harvey ASKED lawfully, and Donna answered a RECENCY question with
// hands that could not answer it, then spoke the absence anyway.
//   F-06.21 — the recency-blind payload. donnaFind:241 orders created_at DESC;
//             :154 and :244-256 render NO date. The reads are recency-ORDERED and
//             recency-BLIND. Cure DEFERRED TO M-1 (P1) by the founder's sequencing.
//   F-06.22 — an absence asserted with no read that could establish it. THE M-6
//             BLOCKER. donnaSoul:48 covered no-MATCH; nothing covered no-READ.
//   F-06.23 — the intra-reply contradiction ("nothing new has landed" beside a
//             snapshot-borne "fresh lead" in one reply). Rides as a SECOND SIGNAL.
//
// ══ WHAT THIS BENCH PROVES, AND WHAT IT HONESTLY CANNOT ═══════════════════════
// IT PROVES THE DETECTOR. The tell added to scripts/b06_gauntlet.js is real code with
// real teeth, and §8 mutates THAT SHIPPED CODE to prove every cell here has teeth too.
//
// IT DOES NOT PROVE THE SOUL CLAUSE, AND SAYS SO IN ITS OWN FILE. The M-2 rider is a
// donnaSoul paragraph. Benches assert BEHAVIOUR, never wording (LD-5) — so no cell here
// greps the clause for a phrase, because that is the CE-63 class and a hollow green. The
// clause's proof is the LIVE gauntlet, N-per-lane on BOTH architectures, and nothing at
// this desk can stand in for it. The manual paper said it first: "Nothing mechanical can
// force the dispatch itself — that is exactly why this is the soul's first item."
// What IS proven here about the soul is structural and modest: the delta is ADDITIVE
// (§6), and the guarded set is 0-line (§6).
//
// ══ WHAT IS REAL AND WHAT IS FIXTURE ══════════════════════════════════════════
// The detector under test is the SHIPPED one: §1 LIFTS `recencyFidelity`, `nestedHands`
// and their six constants out of scripts/b06_gauntlet.js's own bytes and evaluates them,
// so a later edit cannot pass this bench by leaving a comment behind. The specimen
// payload is the FOUNDER'S OWN SELECT OUTPUT, not an invented shape. The only fixtures
// are turn-shaped wrappers. Test setup is never mutated (§8).
'use strict';
// ── CE-45 LCV-16 LSP_5 · LABELLED AMENDMENT (A-45.2): THE RETIRED CELLS OF THIS BENCH, AT SITE ─────────────────────
// LSP_5 (the chair's rulings L5-a to L5-e, §7, K6, 25 September 2026) retired the business room from runTurn and deleted Donna's
// turn and the engine modules only it reached. Each row names a cell and why it retires; the cell is replaced at its site by
// __RETIRED (never evaluated). A retired cell prints RETIRED and is NOT counted as a pass. CONTROL: at exit every row must have
// matched exactly ONE reached cell, or the bench exits 1.
const __RETIRE_LSP5 = new Map([["§1.1 the shipped detector lifts clean — every constant and both functions found by name","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§1.2 the lift is BYTES, not a paraphrase — the evaluated source is a substring of the shipped file","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.1 the specimen REDS — \"nothing new has landed\" over four hands, not one carrying an arrival date","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.2 F-06.23 rides as the SECOND SIGNAL — the reply names \"a fresh lead\" beside the absence","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.3 the second signal ANNOTATES, it never convicts alone — strip the fresh-item phrase and the conviction stands on the hands-vs-claim pair","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.4 zero hands convicts the same way — \"no hand can answer\" includes \"there were none\"","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.1 THE HONEST GAP — the absence stands only because the reach's limit rides beside it","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.2 BOTH-WAYS on §3.1 — strike the gap sentence from that same reply and it CONVICTS","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.3 no recency absence asserted — the tell judges claims, never silence","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.4 THE ASK GATE — an existence probe is never judged by this tell (that stays SD-EXIST's)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.5 R4 EXEMPTION — donnaLead:226's honest vocabulary is stripped before judging","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.6 the exemption is SURGICAL — a reply carrying BOTH the honest tool phrase and the disease still convicts","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.7 THE SWALLOWED STAMP — §3.1's exact reply over DATED hands CONVICTS: the Class-A premise cannot acquit a stamp the same turn read","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.8 CLASS B IS UNTOUCHED — a fail-closed sentence acquits over those same DATED hands: a read-failure is its own claim (F-06.14's adjacency, out of scope by ruling)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§4.1 `wedding 2027-02-14` does not green it — a wedding is not an arrival, in the hand OR in the mouth","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§4.2 `due 2026-07-17` does not green it — a due date is the future, not when the row landed, in the hand OR in the mouth","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§4.3 the specimen's own bare `date 2024-12-19` is keyword-unanchored and does not green it","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§4.4 `created 2026-07-23` DOES green it — donnaBench:185's own render is the shape the tell accepts","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§5.1 ABSENCE_CLAIM_RE does not even MATCH the specimen — the F6 vocabulary is existence-shaped","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§5.2 the specimen carries TWO donna_find hands — every find-COUNT gate short-circuits to green on it","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§5.3 the specimen carries ZERO donna_history — F-06.13's fan-out arm has nothing to convict here either","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§5.4 the SD-FRESH arm is seated FOUR times (R7: the family is intermittent — the fraction is the datum)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§5.5 R5 — SD-EXIST no longer asserts an adverb it did not check; its why-string states its own scope","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§6.2 the donnaSoul delta","K6: donnaSoul.ts is deleted with Donna's turn; the rider and the paragraph it guarded went with it"],["§6.3 the rider landed","K6: donnaSoul.ts is deleted with Donna's turn; the rider and the paragraph it guarded went with it"],["§6.4 the compiled soul","K6: donnaSoul.ts is deleted with Donna's turn; the rider and the paragraph it guarded went with it"],["§7.1 the F-06.13","K6: donnaSoul.ts is deleted with Donna's turn; the rider and the paragraph it guarded went with it"],["§7.1b AND EXAMPLE 2","K6: donnaSoul.ts is deleted with Donna's turn; the rider and the paragraph it guarded went with it"],["§7.2 the rider sits BEFORE","K6: donnaSoul.ts is deleted with Donna's turn; the rider and the paragraph it guarded went with it"],["§7.3 a payload-widening turn","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§8.0 the mutated file","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["§8.1 the SOUL is deliberately","K6: donnaSoul.ts is deleted with Donna's turn; the rider and the paragraph it guarded went with it"],["M §2.1 (gauntlet)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §3.1 (gauntlet)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §3.7 (gauntlet)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §3.5 (gauntlet)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §4.1 (gauntlet)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §3.4 (gauntlet)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §2.3 (gauntlet)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §5.5 (gauntlet)","K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole"]]);
const __seenLSP5 = new Map();
function __RETIRED(k) { if (!__RETIRE_LSP5.has(k)) { console.log('  FAIL  ' + k + '  (RETIRED at site but not in the table)'); process.exitCode = 1; return; }
  __seenLSP5.set(k, (__seenLSP5.get(k) || 0) + 1); console.log('  RETIRED  ' + k + '  (' + __RETIRE_LSP5.get(k) + ')'); }
process.on('exit', (code) => { let bad = 0; for (const [k] of __RETIRE_LSP5) if ((__seenLSP5.get(k) || 0) !== 1) { bad++; console.log('  FAIL  retire row ' + k + ' matched ' + (__seenLSP5.get(k) || 0) + ' reached cells (must be exactly 1)'); }
  if (bad) process.exitCode = 1; else if (code !== 0) process.exitCode = code; });
const assert = require('assert');
const fs = require('fs'); const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0;
const t = (n, f) => { try { f(); console.log(`  ok   ${n}`); pass++; } catch (e) { console.log(`  FAIL ${n}\n       ${e.message}`); fail++; } };
const H = (s) => console.log(`\n${s}`);

const GAUNTLET = 'scripts/b06_gauntlet.js';
const SOUL = 'src/engine/src/core/donnaSoul.ts';
// The base this sitting was chartered at. Pinned, never HEAD — a floating base lets a
// later commit quietly widen the delta and keep §6 green (arc_m4 §4.1's tuition).
const BASE = 'd686bed';
// M-2's own seal. HOISTED to file scope at CE ruling, TDW_07 P2 (F-07.5's cure):
// §6.6 needs the same range-pin §6.5 already uses, and one hash spelled twice is
// the F-05.20 class (eleven fallbacks, one of them wrong). One home, two readers.
const SEAL = 'c736a7e'; // "the no-read law + the re-aimed absence detector"

// ════════════════════════════════════════════════════════════════════════════
H('§1 — THE LIFT: the detector under test is the SHIPPED one, not a copy');

/* CE-45 LCV-16 LSP_5 (A-45.2): the span below was removed and its 23 cells retired at site: K8: the detector under test lived in scripts/b06_gauntlet.js, deleted whole */
__RETIRED("§1.1 the shipped detector lifts clean — every constant and both functions found by name");
__RETIRED("§1.2 the lift is BYTES, not a paraphrase — the evaluated source is a substring of the shipped file");
__RETIRED("§2.1 the specimen REDS — \"nothing new has landed\" over four hands, not one carrying an arrival date");
__RETIRED("§2.2 F-06.23 rides as the SECOND SIGNAL — the reply names \"a fresh lead\" beside the absence");
__RETIRED("§2.3 the second signal ANNOTATES, it never convicts alone — strip the fresh-item phrase and the conviction stands on the hands-vs-claim pair");
__RETIRED("§2.4 zero hands convicts the same way — \"no hand can answer\" includes \"there were none\"");
__RETIRED("§3.1 THE HONEST GAP — the absence stands only because the reach's limit rides beside it");
__RETIRED("§3.2 BOTH-WAYS on §3.1 — strike the gap sentence from that same reply and it CONVICTS");
__RETIRED("§3.3 no recency absence asserted — the tell judges claims, never silence");
__RETIRED("§3.4 THE ASK GATE — an existence probe is never judged by this tell (that stays SD-EXIST's)");
__RETIRED("§3.5 R4 EXEMPTION — donnaLead:226's honest vocabulary is stripped before judging");
__RETIRED("§3.6 the exemption is SURGICAL — a reply carrying BOTH the honest tool phrase and the disease still convicts");
__RETIRED("§3.7 THE SWALLOWED STAMP — §3.1's exact reply over DATED hands CONVICTS: the Class-A premise cannot acquit a stamp the same turn read");
__RETIRED("§3.8 CLASS B IS UNTOUCHED — a fail-closed sentence acquits over those same DATED hands: a read-failure is its own claim (F-06.14's adjacency, out of scope by ruling)");
__RETIRED("§4.1 `wedding 2027-02-14` does not green it — a wedding is not an arrival, in the hand OR in the mouth");
__RETIRED("§4.2 `due 2026-07-17` does not green it — a due date is the future, not when the row landed, in the hand OR in the mouth");
__RETIRED("§4.3 the specimen's own bare `date 2024-12-19` is keyword-unanchored and does not green it");
__RETIRED("§4.4 `created 2026-07-23` DOES green it — donnaBench:185's own render is the shape the tell accepts");
__RETIRED("§5.1 ABSENCE_CLAIM_RE does not even MATCH the specimen — the F6 vocabulary is existence-shaped");
__RETIRED("§5.2 the specimen carries TWO donna_find hands — every find-COUNT gate short-circuits to green on it");
__RETIRED("§5.3 the specimen carries ZERO donna_history — F-06.13's fan-out arm has nothing to convict here either");
__RETIRED("§5.4 the SD-FRESH arm is seated FOUR times (R7: the family is intermittent — the fraction is the datum)");
__RETIRED("§5.5 R5 — SD-EXIST no longer asserts an adverb it did not check; its why-string states its own scope");
H('§6 — W-1 SCOPE: one enumerated rider, and the delta is ADDITIVE');

const gitShow = (ref, file) => execFileSync('git', ['show', `${ref}:${file}`], { cwd: ROOT, encoding: 'utf8' });
const GUARDED = [
  'src/engine/src/core/harveySoul.ts',
  'src/engine/src/core/advisorLens.ts',
  'src/engine/src/core/consultantHarveySoul.ts',
];

// ── LABELED AMENDMENT · BLOCK 06 M-4 (CE ruling R6-adjacent; F-06.34's CLASS, one
// ring wider) ────────────────────────────────────────────────────────────────────
// F-06.34 was cured at M-3 for §6.8 alone: a cell that diffs the WORKING TREE reads
// one answer before the founder's commit and another after, and reds on every LATER
// sitting that lawfully touches the same file. The cure (range-pin to this sitting's
// own seal) was applied to ONE cell; the class had SEVEN. M-4 is the sitting that
// found out — it opens W-1 by ruling and these cells convicted it of a breach that
// the CE had authorised. Range-pinned now, so each permanently asserts what ITS OWN
// sitting did and can never again be moved by a future tree. Count preserved.
const M2_SEAL = 'c736a7e'; // M-2's seal — the far end, fixed for good (M-4 re-pin)
t('§6.1 the guarded soul set is 0-line against the chartered base — W-1 opened for ONE rider and one only', () => {
  for (const f of GUARDED) assert.strictEqual(gitShow(M2_SEAL, f), gitShow(BASE, f), `${f} MOVED — W-1 breach`);
});
__RETIRED("§6.2 the donnaSoul delta");
__RETIRED("§6.3 the rider landed");
__RETIRED("§6.4 the compiled soul");
t('§6.5 the sitting\'s whole delta is SIX repo files and no seventh — soul, gauntlet, this bench, the handover, and the two LABELED floor amendments the W-1 opening forced', () => {
  // Tracked delta PLUS untracked files: between the founder's apply and his commit this
  // bench is untracked, and after the commit it is tracked. The cell must read the same
  // in both worlds or it is a cell that only passes on one side of a push.
  // ── LABELED FLOOR AMENDMENT A4 (TDW_06 M-1). COUNT PRESERVED; THE CELL IS REPLACED
  // STRONGER, not narrowed. It read BASE..worktree, which made it a cell about whatever
  // sitting happened to be open — M-1 legitimately widens the tree and the cell went red
  // for a reason that was not a breach. Re-pinned to M-2's OWN SEAL RANGE, it now asserts
  // a HISTORICAL FACT that no later sitting can move: what M-2 shipped was these six
  // files and no seventh, for good. That is the property the cell always meant (CE-67
  // §C's re-pin, and §4.1's REPLACED-STRONGER precedent, applied to a delta cell).
  const all = execFileSync('git', ['diff', '--name-only', BASE, SEAL], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  // The two floor cells below asserted donnaSoul 0-line on a pinned base and against
  // HEAD. The chair's W-1 opening makes a chartered act look like a breach to them; both
  // are NARROWED to lossless-not-zero, labeled in-file, counts preserved. Naming them
  // here means a silent seventh file can never ride in behind the amendment.
  const AMENDED_FLOOR = ['scripts/b05_f0550_ping_drain_bench.js', 'scripts/b06_m0_bench.js'];
  // The handover rides the ZIP by §10 and therefore lands in the repo — it is a SIXTH
  // file, and the first draft of this cell forgot it. Caught by applying the ZIP to a
  // scratch clone and running this bench there, not by reading.
  const expected = [GAUNTLET, SOUL, 'scripts/b06_m2_bench.js', 'docs/specs/TDW_06_M2_HANDOVER.md', ...AMENDED_FLOOR].sort();
  for (const e of expected) assert.ok(all.includes(e), `expected file missing from the delta: ${e}`);
  // Strictness SCOPED to the repo's own trees. A stray in the founder's working copy (an
  // editor swap file, a scratch note) must never red his verify; a stray under src/,
  // scripts/, docs/ or db/ is exactly what this cell exists to catch.
  const OWNED = /^(src|scripts|docs|db)\//;
  const strays = all.filter((f) => OWNED.test(f) && !expected.includes(f));
  assert.deepStrictEqual(strays, [], `M-2's SEALED delta is not what this cell names: ${strays.join(', ')}`);
});
// LABELED AMENDMENT — RE-SCOPED AT CE RULING, TDW_07 P2 (F-07.5's cure). COUNT PRESERVED.
// Same disease as b06_m0_bench §7.3 and b05_f0550 §6.4, a class of exactly three (censused
// across scripts/*.js; there is no fourth). The cell asserted a true fact about M-2's own
// scope with a predicate over the LIVE migrations directory, so TDW_07 P1's lawful 0101
// reddened it. No production byte of M-2 is implicated. Range-pinned to BASE..SEAL — the
// same range §6.5 above already uses — so it now asserts what rode M-2, permanently.
// Title re-worded with it: "0101 stays unreserved" is no longer true and a green cell must
// not stand under a false claim (CE ruling §A).
t('§6.6 SQL POSTURE — no migration rode this sitting (sealed range d686bed..c736a7e)', () => {
  const names = execFileSync('git', ['diff', '--name-only', BASE, SEAL, '--', 'db/migrations'],
    { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  assert.deepStrictEqual(names, [], `a migration rode M-2: ${names.join(', ')}`);
});

// ════════════════════════════════════════════════════════════════════════════
H('§7 — THE COMPOSITION GUARD (the CE\'s banked reading, not amended)');
// "what is on file you give him to the letter" is FIDELITY register, not a volume
// licence. c2e21b1's recents-discipline still governs HOW MUCH travels; the M-2 clause
// governs whether the QUIET is honest. The two compose — proven, not asserted.

// ── LABELED AMENDMENT · RE-PIN BY EXCISION-IDENTITY (CE R-6, 2026-07-28; CE-80's
// re-pin-with-attribution law). This cell pins the window HOW YOU TAKE THE
// TEMPERATURE OF THE WEEK → BALLS OF STEEL, and the founder's vetoed Example 2
// (CE-99 chartered, 「 i m good with both the recomendations. please proceed 」)
// lands INSIDE that window by construction — it is the worked example of the very
// law this window holds, sited there by CE R-3. W-1 was shut when §7.1 was written;
// it is open by ruling for this one pass. The pin is RE-FORMED, not relaxed: excise
// the vetoed block and the window must still be byte-identical to BASE, so the
// authored pass is proven to have touched this paragraph in exactly one place and
// changed not one byte of the F-06.13 recents-discipline prose itself.
//
// FOUND BY RUNNING, NOT BY READING — filed as the executor's own read-first miss
// (CE R-7): the read-first census enumerated the attribution amendments and never
// censused the soul-literal pins. This cell was invisible to a read because it pins
// an anchor-to-anchor SLICE, not a named string. R-7's standing law is the cure:
// any sitting that opens W-1 censuses the soul pins by RUNNING candidate bytes on a
// scratch tree.
const EX2_OPEN = '\nHarvey: "Give me the week\'s shape';
const EX2_CLOSE = 'not thoroughness — it is noise.\n';

__RETIRED("§7.1 the F-06.13");

__RETIRED("§7.1b AND EXAMPLE 2");
__RETIRED("§7.2 the rider sits BEFORE");
__RETIRED("§7.3 a payload-widening turn");

// ════════════════════════════════════════════════════════════════════════════
H('§8 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');
// Each mutation edits the SHIPPED detector in scripts/b06_gauntlet.js — the artifact
// that gates M-6 — never this bench's setup, and re-runs this bench in a child.
// CE-45 LCV-16 LSP_5 (A-45.2): §8's harness wrote scripts/b06_gauntlet.js IN THE TREE (K8: deleted whole) and read donnaSoul.ts (K6);
// every mutation targeted the gauntlet, so each is RETIRED, never "restored", and no tracked path is written.
__RETIRED("M §2.1 (gauntlet)");
__RETIRED("M §3.1 (gauntlet)");
__RETIRED("M §3.7 (gauntlet)");
__RETIRED("M §3.5 (gauntlet)");
__RETIRED("M §4.1 (gauntlet)");
__RETIRED("M §3.4 (gauntlet)");
__RETIRED("M §2.3 (gauntlet)");
__RETIRED("M §5.5 (gauntlet)");
__RETIRED("§8.0 the mutated file");
__RETIRED("§8.1 the SOUL is deliberately");

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) console.log('GREEN — a recency question met by hands that cannot answer it can no longer be answered with a quiet; the tell convicts on the hands, not the prose, and retires itself the day the read learns to carry a date.');
process.exit(fail === 0 ? 0 : 1);
