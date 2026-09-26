// scripts/b06_m1_bench.js — BLOCK 06 · M-1 · THE RECENCY-LEGIBLE ESTATE.
//   node scripts/b06_m1_bench.js        (runnable from any cwd — Q-SP-5)
//
// ══ THE SITTING IN ONE PARAGRAPH ══════════════════════════════════════════════
// M-2 shipped a soul clause against a false absence and the founder's walk returned
// 0-for-4: four fresh threads, the specimen's own question, four denials over a row
// filed minutes earlier. The SELECT split the locus — run 1 dispatched (Donna spoke the
// absence), runs 2–4 never dispatched at all (Harvey answered off a pre-loaded snapshot,
// 1–2s, tool_calls null). Both halves shared one property: the estate was sorted by
// recency with the recency stripped out of the text. M-1 renders it.
//   P1     — arrival time on three planes: donnaFind's reads, donna_history's lines,
//            and snapshotText itself, in the founder's locked register.
//   F-06.26 — THE DETECTOR'S DATE SHORT-CIRCUIT. Found in M-1's read-first, before a
//            byte moved: recencyFidelity gated on the HAND, so the instant P1 landed it
//            would have greened a verbatim "nothing new" four times over and gone on
//            reporting the walk cured. Re-aimed: the MOUTH is read against the HAND.
//   F-06.27 — THE UTC SLICE. Three shipped renders dated rows by slicing a UTC ISO
//            string, so every row born 00:00–05:30 IST read as YESTERDAY.
//
// ══ WHAT THIS BENCH PROVES, AND WHAT IT HONESTLY CANNOT ═══════════════════════
// IT PROVES THE DETECTOR AND THE CLOCK, by driving the SHIPPED ones. §1 lifts
// recencyFidelity and its seven constants out of b06_gauntlet.js's own bytes. §5 imports
// arrivalStamp from the COMPILED DIST — the function production calls, not a copy. §7
// mutates that production code and re-runs, so no cell here is green over nothing.
//
// IT DOES NOT PROVE THAT VICTOR SPEAKS THE DATE. That is behaviour on a live model and
// it belongs to the founder's walk, N fresh threads, scored through the re-aimed
// detector on both architectures. Every P1 RENDER cell below is STRUCTURAL and says so
// in its own name — the call site is asserted, the sentence is not. Pretending otherwise
// would be the hollow green this block exists to refuse. (Benches assert behaviour, not
// wording: no cell here greps a soul.)
//
// ══ THE WALK FIXTURES, AND THEIR PROVENANCE ══════════════════════════════════
// The four replies in §3 are the FOUNDER'S OWN, from the M-2 walk note's §2 — the run
// times, the sentences, and the word-for-word convergence of runs 2–4. They are quoted,
// not invented, and they are the sharpest fixture this estate has: four sentences a real
// model really produced over a real row it really held.
'use strict';
// ── CE-45 LCV-16 LSP_5 · LABELLED AMENDMENT (A-45.2): THE RETIRED CELLS OF THIS BENCH, AT SITE ─────────────────────
// LSP_5 (the chair's rulings L5-a to L5-e, §7, K6, 25 September 2026) retired the business room from runTurn and deleted Donna's
// turn and the engine modules only it reached. Each row names a cell and why it retires; the cell is replaced at its site by
// __RETIRED (never evaluated). A retired cell prints RETIRED and is NOT counted as a pass. CONTROL: at exit every row must have
// matched exactly ONE reached cell, or the bench exits 1.
const __RETIRE_LSP5 = new Map([["§1.1 the re-aimed detector lifts clean — EIGHT constants (F-06.84 split the gap by phrase class) and both functions found by name","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§1.2 the lift is BYTES, not a paraphrase — the evaluated source is a substring of the shipped file","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.1 THE CURE CELL — a bare \"nothing new\" over DATED hands CONVICTS (the short-circuit is dead)","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.2 a dated hand RAISES the bar — its conviction names the answer as available and unread","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.3 THE ARRIVAL SPOKEN — the absence bounded by arrival evidence in the REPLY is GREEN","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.4 THE HONEST GAP still acquits — the ask outran the reach and the reply said so","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.5 the mouth is judged in HARVEY'S register, not the cabinet's — plain speech acquits, per harveySoul:152","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.6 a denial can never acquit ITSELF — its own arrival verb is stripped with its negator","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.7 F-06.23's second signal is REACHABLE ON EVERY conviction path (it went dark under the old ordering)","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.8 the second signal ANNOTATES, never convicts alone — strip the fresh-item phrase and the verdict is unmoved","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§2.9 silence is not a claim — no absence asserted, nothing to convict, dated hands or not","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.1 all four walk replies CONVICT against the undated hands they were really given (0-for-4, reproduced at the desk)","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.2 all four CONVICT against DATED hands too — P1 alone does not launder them (F-06.26's whole point)","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.3 runs 2–4 are word-identical — the attractor is stable, and the fixture preserves that fact","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.4 the honest counterfactual of each walk reply is GREEN — the cell can be passed, not only failed","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§3.5 the run-1 dispatch shape and the runs-2–4 snapshot shape convict IDENTICALLY — the tell reads the words, not the route","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§4.1 HISTORY_FANOUT_FLOOR","L5-c/K6: its subject (Donna's history hand in donnaBench.ts, the snapshot render in snapshotText, DONNA_WORK_ITERS and TALK_FUSE, HISTORY_FANOUT_FLOOR) is deleted"],["§4.2 F2 RULED A","L5-c/K6: its subject (Donna's history hand in donnaBench.ts, the snapshot render in snapshotText, DONNA_WORK_ITERS and TALK_FUSE, HISTORY_FANOUT_FLOOR) is deleted"],["§5.5 the stamp the estate mints","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["§6.2 plane (c) donna_history","L5-c/K6: its subject (Donna's history hand in donnaBench.ts, the snapshot render in snapshotText, DONNA_WORK_ITERS and TALK_FUSE, HISTORY_FANOUT_FLOOR) is deleted"],["§6.3 plane (b) the snapshot","L5-c/K6: its subject (Donna's history hand in donnaBench.ts, the snapshot render in snapshotText, DONNA_WORK_ITERS and TALK_FUSE, HISTORY_FANOUT_FLOOR) is deleted"],["§6.5 THE SNAPSHOT IS STILL A PROJECTION","L5-c/K6: its subject (Donna's history hand in donnaBench.ts, the snapshot render in snapshotText, DONNA_WORK_ITERS and TALK_FUSE, HISTORY_FANOUT_FLOOR) is deleted"],["§6.7 the riding cells landed","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §2.1 (gauntlet)","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §2.6 (gauntlet)","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §2.3 (gauntlet)","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §2.7 (gauntlet)","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §6.7 (gauntlet)","K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole"],["M §6.3 (donna.ts)","L5-c: the snapshot render (snapshotText) is deleted; the line it mutated no longer exists"]]);
const __seenLSP5 = new Map();
function __RETIRED(k) { if (!__RETIRE_LSP5.has(k)) { console.log('  FAIL  ' + k + '  (RETIRED at site but not in the table)'); process.exitCode = 1; return; }
  __seenLSP5.set(k, (__seenLSP5.get(k) || 0) + 1); console.log('  RETIRED  ' + k + '  (' + __RETIRE_LSP5.get(k) + ')'); }
process.on('exit', (code) => { let bad = 0; for (const [k] of __RETIRE_LSP5) if ((__seenLSP5.get(k) || 0) !== 1) { bad++; console.log('  FAIL  retire row ' + k + ' matched ' + (__seenLSP5.get(k) || 0) + ' reached cells (must be exactly 1)'); }
  if (bad) process.exitCode = 1; else if (code !== 0) process.exitCode = code; });
const assert = require('assert');
const fs = require('fs'); const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const { createShadow, assertUntouched } = require('./lib/mutateCopy.js');
const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0;
const t = (n, f) => { try { f(); console.log(`  ok   ${n}`); pass++; } catch (e) { console.log(`  FAIL ${n}\n       ${e.message}`); fail++; } };
const H = (s) => console.log(`\n${s}`);

const GAUNTLET = 'scripts/b06_gauntlet.js';
const FIND = 'src/engine/src/core/tools/donnaFind.ts';
const HIST = 'src/engine/src/core/tools/donnaBench.ts';
const DONNA = 'src/engine/src/core/donna.ts';
const TYPES = 'src/engine/src/core/snapshotTypes.ts';
const TODAY = 'src/engine/src/core/today.ts';
// The base this sitting was chartered at. Pinned, never HEAD.
const BASE = 'd6a4a6e';

// ════════════════════════════════════════════════════════════════════════════
H('§1 — THE LIFT: the detector under test is the SHIPPED one, not a copy');

/* CE-45 LCV-16 LSP_5 (A-45.2): the span below was removed and its 16 cells retired at site: K8: the detectors under test lived in scripts/b06_gauntlet.js, deleted whole */
__RETIRED("§1.1 the re-aimed detector lifts clean — EIGHT constants (F-06.84 split the gap by phrase class) and both functions found by name");
__RETIRED("§1.2 the lift is BYTES, not a paraphrase — the evaluated source is a substring of the shipped file");
__RETIRED("§2.1 THE CURE CELL — a bare \"nothing new\" over DATED hands CONVICTS (the short-circuit is dead)");
__RETIRED("§2.2 a dated hand RAISES the bar — its conviction names the answer as available and unread");
__RETIRED("§2.3 THE ARRIVAL SPOKEN — the absence bounded by arrival evidence in the REPLY is GREEN");
__RETIRED("§2.4 THE HONEST GAP still acquits — the ask outran the reach and the reply said so");
__RETIRED("§2.5 the mouth is judged in HARVEY'S register, not the cabinet's — plain speech acquits, per harveySoul:152");
__RETIRED("§2.6 a denial can never acquit ITSELF — its own arrival verb is stripped with its negator");
__RETIRED("§2.7 F-06.23's second signal is REACHABLE ON EVERY conviction path (it went dark under the old ordering)");
__RETIRED("§2.8 the second signal ANNOTATES, never convicts alone — strip the fresh-item phrase and the verdict is unmoved");
__RETIRED("§2.9 silence is not a claim — no absence asserted, nothing to convict, dated hands or not");
__RETIRED("§3.1 all four walk replies CONVICT against the undated hands they were really given (0-for-4, reproduced at the desk)");
__RETIRED("§3.2 all four CONVICT against DATED hands too — P1 alone does not launder them (F-06.26's whole point)");
__RETIRED("§3.3 runs 2–4 are word-identical — the attractor is stable, and the fixture preserves that fact");
__RETIRED("§3.4 the honest counterfactual of each walk reply is GREEN — the cell can be passed, not only failed");
__RETIRED("§3.5 the run-1 dispatch shape and the runs-2–4 snapshot shape convict IDENTICALLY — the tell reads the words, not the route");
H('§4 — THE FAN-OUT FLOOR HOLDS WITH DATES RENDERED (the composition law)');

__RETIRED("§4.1 HISTORY_FANOUT_FLOOR");
__RETIRED("§4.2 F2 RULED A");
t('§4.3 the recents dump did NOT widen beyond the date bytes — phones and money stay dropped from recognition (M-4)', () => {
  const rec = read(FIND).slice(read(FIND).indexOf('function recognitionRow('));
  const body = rec.slice(0, rec.indexOf('\n}'));
  assert.ok(/filed \$\{filed\}/.test(body), 'the arrival stamp is not on the recognition line');
  assert.ok(!/r\.phone/.test(body) && !/r\.amount/.test(body), 'recognition regained a phone or a figure — the payload widened');
});
t('§4.4 the enquiry recognition line likewise gained the date AND NOTHING ELSE', () => {
  const src = read(FIND);
  assert.ok(/\| filed \$\{fl\}/.test(src), 'the enquiry recognition render carries no stamp');
  assert.ok(/recognitionOnly/.test(src) && !/budget_max\}\`\)[\s\S]{0,40}recognitionOnly/.test(src));
});

// ════════════════════════════════════════════════════════════════════════════
H('§5 — F-06.27: THE CLOCK. The SHIPPED function, imported from the compiled dist');

let arrivalStamp = null, distErr = null;
try { ({ arrivalStamp } = require(P('src/engine/dist/core/today.js'))); }
catch (e) { distErr = e; }

t('§5.0 the dist is built and exports the production function (npm run build FIRST — the dist-dependent set)', () => {
  assert.ok(!distErr, distErr && `run \`npm run build\` before this bench: ${distErr.message}`);
  assert.strictEqual(typeof arrivalStamp, 'function');
});
t('§5.1 THE UTC CELL — a row born 01:30 IST renders ITS OWN day, where the raw slice rendered yesterday', () => {
  const born = '2026-07-24T20:00:00Z'; // = 2026-07-25 01:30 IST, inside the broken band
  assert.strictEqual(born.slice(0, 10), '2026-07-24', 'the disease, stated: the raw slice says the 24th');
  assert.strictEqual(arrivalStamp(born, 'Asia/Kolkata'), '25-07-26 01:30 IST');
});
t('§5.2 the band is the whole band — 00:00 and 05:29 IST both render the correct local day', () => {
  assert.ok(arrivalStamp('2026-07-24T18:30:00Z', 'Asia/Kolkata').startsWith('25-07-26 00:00'));
  assert.ok(arrivalStamp('2026-07-24T23:59:00Z', 'Asia/Kolkata').startsWith('25-07-26 05:29'));
});
t('§5.3 THE LOCKED REGISTER — dd-mm-yy HH:MM IST, byte-exact, the founder\'s word', () => {
  assert.strictEqual(arrivalStamp('2026-07-25T08:50:00Z', 'Asia/Kolkata'), '25-07-26 14:20 IST');
  assert.ok(/^\d{2}-\d{2}-\d{2} \d{2}:\d{2} IST$/.test(arrivalStamp('2026-01-02T03:04:00Z', 'Asia/Kolkata')));
});
t('§5.4 an absent or unparseable stamp returns NULL — the caller renders nothing, never a wrong date', () => {
  assert.strictEqual(arrivalStamp(null), null);
  assert.strictEqual(arrivalStamp(''), null);
  assert.strictEqual(arrivalStamp('not-a-timestamp'), null);
  assert.strictEqual(arrivalStamp('2026-07-25T08:50:00Z', 'Mars/Olympus'), null);
});
__RETIRED("§5.5 the stamp the estate mints");
t('§5.6 ONE DERIVATION — every P1 site calls arrivalStamp; no site re-slices a timestamp by hand', () => {
  // RE-AIMED (CE-45 LCV-16 LSP_5, labelled): donnaBench.ts is deleted (K6) and donna.ts's only stamp render (snapshotText) with it (L5-c);
  // donnaFind is the P1 site left that renders a stamp, and it must still use the one clock.
  for (const f of [FIND]) {
    assert.ok(/arrivalStamp\(/.test(read(f)), `${f} does not use the estate's clock`);
    assert.ok(!/created_at\.slice\(0, 10\)|created_at\)\.slice\(0, 10\)/.test(read(f)), `${f} still hand-slices a UTC timestamp`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
H('§6 — P1 ON THREE PLANES (STRUCTURAL-DECLARED: the call site, never the sentence)');

t('§6.1 plane (a) donnaFind — the two named anchors and the matched payload all carry the stamp', () => {
  const s = read(FIND);
  // Windows sized to the real bodies (443 and 1188 chars to the call, measured, not guessed)
  // — a window that has to be widened later is a cell that was asserting the comment length.
  // THE CELL ASSERTS THE RENDER, NOT MERELY THE CALL. Its first draft asserted only that
  // arrivalStamp was CALLED at each site — and the §6.1 mutation, which gates the PUSH
  // and leaves the call standing, refused to go red. A stamp computed and thrown away is
  // exactly the shape of the disease; a cell that cannot tell it from a stamp SPOKEN is
  // asserting the wrong thing. Caught by a mutation declining to bite, not by reading.
  assert.ok(/function recognitionRow[\s\S]{0,600}arrivalStamp\(r\.created_at[\s\S]{0,120}if \(filed\) bits\.push\(`filed \$\{filed\}`\)/.test(s), ':154 recognitionRow');
  assert.ok(/function describeRow[\s\S]{0,1400}arrivalStamp\(r\.created_at[\s\S]{0,120}if \(filedAt\) bits\.push\(`filed \$\{filedAt\}`\)/.test(s), 'describeRow (disclosed adjacency)');
  assert.strictEqual((s.match(/arrivalStamp\(l\.created_at/g) || []).length, 2, 'both enquiry renders');
  assert.ok(/created_at'/.test(s) && /notes, created_at/.test(s), 'the selects were widened to fetch the column');
});
__RETIRED("§6.2 plane (c) donna_history");
__RETIRED("§6.3 plane (b) the snapshot");
t('§6.4 (b2) is WHOLE — both item builders and both rebuild selects carry the clock, or the snapshot dates by half', () => {
  assert.ok(/arrived_at: row\.created_at \?\? null/.test(read('src/engine/src/core/tools/recordPrimitives.ts')), 'recordItem');
  // RE-AIMED (CE-45 LCV-16 LSP_5, labelled): donnaLead.ts's leadItem is deleted (K6); the builders and selects that remain are held.
  const d = read(DONNA);
  assert.ok(/state, budget_max, created_at/.test(d) && /note, phone, created_at/.test(d), 'a rebuild select was left narrow');
  assert.ok(/arrived_at: \(l as \{ created_at\?: string \| null \}\)\.created_at/.test(d), 'the rebuilt lead item');
});
__RETIRED("§6.5 THE SNAPSHOT IS STILL A PROJECTION");
t('§6.6 W-1 HOLDS — donnaSoul, harveySoul, advisorLens and consultantHarveySoul are 0-line this sitting', () => {
  const guarded = ['src/engine/src/core/donnaSoul.ts', 'src/engine/src/core/harveySoul.ts',
                   'src/engine/src/core/advisorLens.ts', 'src/engine/src/core/consultantHarveySoul.ts'];
  // M-4 re-pin (F-06.34's class): the far end is M-1's own seal, not the live tree.
  const changed = execFileSync('git', ['diff', '--name-only', `${BASE}..ab011c1`, '--', ...guarded], { cwd: ROOT, encoding: 'utf8' }).trim();
  assert.strictEqual(changed, '', `a guarded soul moved without its own ruling: ${changed}`);
});
__RETIRED("§6.7 the riding cells landed");

// ── LABELED AMENDMENT · BLOCK 06 M-3 · F-06.34 CURED (CE-ruled 2026-07-25, R4) ──────
// THE DEFECT THIS CELL HAD: it measured the delta from BASE to the WORKING TREE — a
// floating tip. That is true for exactly as long as nothing else lands. CE-72's own
// seal push (`7ceb4ef`) touched `docs/FINDINGS_LOG.md` and `docs/TDW_00_MASTERPLAN.md`,
// which protocol §7 REQUIRES of every seal, and this cell went red on the very commit
// that sealed the sitting it guards — and stayed red. Measured: 45/0 at `ab011c1`
// (M-1's code seal), 44/1 at `7ceb4ef`, 44/1 at `981e9ba`. The count in the record was
// honest at its own commit and unreachable ever after; M-3's charter inherited it as a
// floor number no executor could meet.
//
// THE CLASS, banked so no future cell is authored this way: A DELIVERY-SHAPE ASSERTION
// PINNED TO A BASE OUTLIVES ITS OWN DELIVERY. The shape of a delivery is a HISTORICAL
// fact about a commit RANGE, not a live fact about a working tree.
//
// THE CURE, the estate's own re-pin precedent: measure `BASE..SEAL` — the range M-1
// actually shipped in. Twelve files and no thirteenth IN THAT RANGE is a fact no later
// push can move, so this cell now asserts what it always meant to assert and greens
// forever. The untracked leg is RETIRED WITH ITS REASON: it existed to make the cell
// read the same before and after the founder's commit, which a committed RANGE makes
// unnecessary — the range only exists once the commit does.
const SEAL = 'ab011c1'; // M-1's seal — the range's far end, fixed for good
t('§6.8 M-1\'s whole delta was TWELVE repo files and no thirteenth (RANGE-PINNED, F-06.34)', () => {
  const all = execFileSync('git', ['diff', '--name-only', `${BASE}..${SEAL}`], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const expected = [
    TODAY, DONNA, TYPES, FIND, HIST,
    'src/engine/src/core/tools/donnaLead.ts', 'src/engine/src/core/tools/recordPrimitives.ts',
    GAUNTLET, 'scripts/b06_m2_bench.js', 'scripts/b06_m1_bench.js',
    'docs/specs/TDW_06_M2_WALK_NOTE.md', 'docs/specs/TDW_06_M1_HANDOVER.md',
  ].sort();
  for (const e of expected) assert.ok(all.includes(e), `expected file missing from the delta: ${e}`);
  // Strictness SCOPED to the repo's own trees: a stray in the founder's working copy (an
  // editor swap file, a scratch note) must never red his verify; a stray under src/,
  // scripts/, docs/ or db/ is exactly what this cell exists to catch.
  const OWNED = /^(src|scripts|docs|db)\//;
  const strays = all.filter((f) => OWNED.test(f) && !expected.includes(f));
  assert.deepStrictEqual(strays, [], `delta drifted inside the repo's own trees: ${strays.join(', ')}`);
});

// ════════════════════════════════════════════════════════════════════════════
H('§7 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');
// Every mutation edits SHIPPED production code — the gauntlet that gates M-6, the clock
// the estate reads, the renders Donna speaks from — never this bench's setup, and re-runs
// this bench in a child process. A cell that will not go red has proven nothing.
if (!process.env.B06_M1_BENCH_CHILD) {
  const M = [
    { file: GAUNTLET, cell: '§2.1', why: 'F-06.26 ITSELF, restored: the date short-circuit returns and a dated hand acquits a verbatim "nothing new"',
      from: '  if (!claimsAbsence) {', to: '  if (handsDated) return { ok: true, why: `a hand RESULT carried arrival-dated evidence` };\n  if (!claimsAbsence) {' },
    // ── LABELED FLOOR AMENDMENT · F-06.86 (CE R-1, 2026-07-28): the three needles below
    // follow the shipped bytes into the per-mouth loop (`text`/`dated`/`fresh` — the arm
    // now judges every mouth on the wire's chain, Victor's prose first). EACH MUTATION'S
    // MEANING IS UNCHANGED — strip order reversed / date test off / signal un-hoisted —
    // re-aimed at the referent, not re-aimed to stay green (§4.1's own lesson, A2's form).
    // Count preserved: 45. Ratify-or-revert.
    { file: GAUNTLET, cell: '§2.6', why: 'the strip order is reversed — the vocabulary eats the negator and a denial acquits itself on its own leftovers',
      from: "text.replace(NEGATED_ARRIVAL_G, ' ').replace(ABSENCE_G, ' ')", to: "text.replace(ABSENCE_G, ' ').replace(NEGATED_ARRIVAL_G, ' ')" },
    { file: GAUNTLET, cell: '§2.3', why: 'the mouth stops being read — an honest reply that names the arrival is convicted alongside the dishonest one',
      from: 'const dated = REPLY_ARRIVAL_RE.test(stripped);', to: 'const dated = false;' },
    { file: GAUNTLET, cell: '§2.7', why: 'F-06.23\'s signal is un-hoisted back onto one path — it goes dark on the dated conviction',
      from: 'const fresh = FRESH_ITEM_RE.test(text);', to: 'const fresh = false;' },
    { file: GAUNTLET, cell: '§6.7', why: 'SD-C4\'s asserted adverb returns — an unchecked "faithfully reported" back in the verdict table',
      from: 'the on-file question answered by a READ: ${finds.length}', to: 'a donna_find hand read the estate this turn, faithfully reported' },
    { file: TODAY, cell: '§5.1', why: 'F-06.27 ITSELF, restored: the clock hand-slices UTC again and a 01:30 IST row dates itself yesterday',
      from: '    const dmy = new Intl.DateTimeFormat(\'en-GB\', {\n      day: \'2-digit\', month: \'2-digit\', year: \'2-digit\', timeZone: tz,\n    }).format(d).replace(/\\//g, \'-\');',
      to: '    const dmy = ts.slice(8, 10) + \'-\' + ts.slice(5, 7) + \'-\' + ts.slice(2, 4);' },
    { file: FIND, cell: '§6.1', why: 'the recognition line loses its stamp — a recents dump goes recency-blind again (F-06.21)',
      from: '  if (filed) bits.push(`filed ${filed}`);', to: '  if (false) bits.push(`filed ${filed}`);' },
    { file: DONNA, cell: '§6.3', why: 'the snapshot line loses its stamp — F-06.25\'s dominant path goes blind again',
      from: 'lines.push(`- ${it.text}${stampOf(it)}`);', to: 'lines.push(`- ${it.text}`);' },
  ];
  // ── F-38.38 · THIS LEG NO LONGER WRITES TO PRODUCTION SOURCE ───────────────
  //
  // It used to, and this repo paid for it: `src/engine/src/core/donna.ts` was left
  // with `stampOf(it)` stripped from a vendor-facing line after a run was killed
  // before its `finally`. A `finally` GUARDS A THROW AND NOT A SIGNAL. The diff was
  // PLAUSIBLE — a dropped timestamp reads as a deliberate copy edit — so it would
  // have survived review, and F-38.38 was found by killing a run rather than by
  // reading the bench, which had a `finally` and a §7.0 cell and looked airtight.
  //
  // `scripts/lib/mutateCopy.js` is this repo's one home for the cure, the same shape
  // and the same words as the pwa's `.mjs`. The mutation goes into a SHADOW — a
  // symlink farm in `tmpdir` where only the paths a bench materialises are real — and
  // the build and the child both run inside it. Production is never opened for
  // writing, so however this process dies it leaves nothing behind.
  //
  // ⚠ TWO THINGS THE SHADOW NEEDS, AND NEITHER IS OPTIONAL:
  //
  //   `unfold('src/engine')` — F-38.43. `tsc -p src/engine/tsconfig.json` writes to
  //   `outDir: "dist"`, i.e. `src/engine/dist`. Materialising only the mutated file's
  //   path leaves `src/engine` a symlink for runs whose mutations fall elsewhere, and
  //   the build then writes compiled output THROUGH it into production — invisibly,
  //   because build output is untracked and `git status` never mentions it. Witnessed
  //   both ways: without the unfold, production grew a `src/engine/dist`; with it,
  //   production stayed clean.
  //
  //   `shadow.exec` for the child, never `execFileSync('node', …)` — F-38.42. Node
  //   canonicalises the main module's path, so without `--preserve-symlinks` and
  //   `--preserve-symlinks-main` the child reads the REAL repository while standing in
  //   the shadow, and every mutation reports GREEN over a tree nobody read. The helper
  //   owns the flag pair so this cannot be forgotten here.
  //
  // THE PRODUCTION REBUILD IS GONE FROM THE RESTORE PATH, and that is a consequence
  // rather than an optimisation: there is nothing to rebuild, because there was never
  // anything to restore.
  // RETIRED MUTATIONS (CE-45 LCV-16 LSP_5, A-45.2): a mutation whose target is deleted is retired, never "restored".
  __RETIRED("M §2.1 (gauntlet)");
  __RETIRED("M §2.6 (gauntlet)");
  __RETIRED("M §2.3 (gauntlet)");
  __RETIRED("M §2.7 (gauntlet)");
  __RETIRED("M §6.7 (gauntlet)");
  __RETIRED("M §6.3 (donna.ts)");
  for (let k = M.length - 1; k >= 0; k -= 1) if (M[k].file === GAUNTLET || M[k].cell === '§6.3') M.splice(k, 1);
  const REBUILD = new Set([TODAY, FIND, DONNA]); // TS mutations must reach the dist the bench imports
  const PRISTINE = new Map([...new Set(M.map((m) => m.file))].map((f) => [f, fs.readFileSync(P(f), 'utf8')]));
  const shadow = createShadow(ROOT);
  try {
  shadow.unfold('src/engine');
  for (const m of M) {
    const orig = PRISTINE.get(m.file);
    if (!orig.includes(m.from)) { console.log(`  FAIL MUTATION anchor stale in ${m.file} — ${m.cell}`); fail++; continue; }
    shadow.write(m.file, orig.replace(m.from, m.to));
    if (REBUILD.has(m.file)) execFileSync('npm', ['run', 'build'], { cwd: shadow.root, stdio: 'ignore' });
    const r = shadow.exec('scripts/b06_m1_bench.js', [], { env: { ...process.env, B06_M1_BENCH_CHILD: '1' } });
    const out = String(r.stdout || '');
    const red = new RegExp(`FAIL ${m.cell.replace('§', '\\u00a7')}`).test(out);
    if (red) { console.log(`  ok   ${m.cell} RED at the uncured tree — ${m.why}`); pass++; }
    else { console.log(`  FAIL ${m.cell} did NOT go red — ${m.why}`); fail++; }
    // Back to pristine bytes between mutations so mutation N+1 is proved ALONE — a
    // shadow that accumulates would let an earlier mutation's red be read as a later
    // one's, which is a proof that cannot say what it proved.
    shadow.write(m.file, orig);
    if (REBUILD.has(m.file)) execFileSync('npm', ['run', 'build'], { cwd: shadow.root, stdio: 'ignore' });
  }
  // §7.0 SAYS THE STRONGER THING NOW. It used to assert that every mutated file was
  // restored byte-identical; it asserts that production was never written at all, and
  // it reads the bytes back from the REAL tree to say so.
  t('§7.0 production source untouched by the whole mutation leg', () => {
    assertUntouched(ROOT, [...PRISTINE.keys()], PRISTINE);
  });
  } finally { shadow.dispose(); }
  t('§7.1 THE SOULS ARE DELIBERATELY UNMUTATED — a prompt paragraph has no desk teeth, and the walk is where it answers', () => {
    assert.ok(!M.some((m) => /Soul\.ts|Lens\.ts/.test(m.file)));
  });
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (!fail) console.log('GREEN — the estate\'s recency is legible, the clock tells the local truth, and the instrument that grades it can no longer be satisfied by a date it never spoke.');
process.exit(fail ? 1 : 0);
