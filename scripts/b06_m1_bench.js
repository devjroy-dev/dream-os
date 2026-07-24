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
const assert = require('assert');
const fs = require('fs'); const path = require('path');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
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

const gsrc = read(GAUNTLET);
function liftConst(name) {
  const m = gsrc.match(new RegExp(`^const ${name} = .+$`, 'm'));
  if (!m) throw new Error(`shipped const ${name} is GONE from ${GAUNTLET} — the lift is stale, not the code`);
  return m[0];
}
function liftBlock(needle) {
  const start = gsrc.indexOf(needle);
  if (start < 0) throw new Error(`shipped block "${needle}" is GONE from ${GAUNTLET} — the lift is stale`);
  const open = gsrc.indexOf('{', start);
  let depth = 0;
  for (let j = open; j < gsrc.length; j++) {
    if (gsrc[j] === '{') depth++;
    else if (gsrc[j] === '}') { depth--; if (depth === 0) return gsrc.slice(start, j + 1); }
  }
  throw new Error(`unbalanced braces lifting "${needle}"`);
}
const CONSTS = ['RECENCY_ASK_RE', 'RECENCY_ABSENCE_RE', 'HONEST_TOOL_VOCAB_RE', 'ARRIVAL_DATED_RE',
                'REPLY_ARRIVAL_RE', 'HONEST_GAP_RE', 'FRESH_ITEM_RE'];
let LIFTED = null, liftErr = null;
try {
  const body = [liftBlock('const nestedHands ='), ...CONSTS.map(liftConst), liftBlock('function recencyFidelity(')].join('\n');
  LIFTED = new Function(`${body}\nreturn { recencyFidelity, nestedHands, ${CONSTS.join(', ')} };`)();
} catch (e) { liftErr = e; }

t('§1.1 the re-aimed detector lifts clean — seven constants and both functions found by name', () => {
  assert.ok(!liftErr, liftErr && liftErr.message);
  assert.strictEqual(typeof LIFTED.recencyFidelity, 'function');
});
t('§1.2 the lift is BYTES, not a paraphrase — the evaluated source is a substring of the shipped file', () => {
  assert.ok(gsrc.includes(liftBlock('function recencyFidelity(')));
  for (const c of CONSTS) assert.ok(gsrc.includes(liftConst(c)), c);
});

const { recencyFidelity } = LIFTED || {};
const ASK = 'Any new enquiries since we last spoke? Anything landed in the inbox.';
const hr = (name, result) => ({ name, input: {}, result });
const turn = (reply, hands) => ({ reply, tool_calls: hands ? [{ name: 'dear_donna_talk', donna_calls: hands }] : [] });
const V = (reply, hands) => recencyFidelity(turn(reply, hands), ASK);

// The two worlds this sitting straddles, as the estate really renders them.
const UNDATED_HANDS = [
  hr('donna_find', 'Found 1 record:\n[dd8e0473] client="Priya M2 Fresh" | stage new\n'
    + 'On the enquiries plane as well:\n  [ENQUIRY] 7e3bd732 — "Dev Test 23" | state new'),
  hr('donna_whatsdue', 'Due now: 1\n[7aff3818] due 2026-07-17 [OVERDUE] Ananya — Call Ananya'),
];
const DATED_HANDS = [
  hr('donna_find', 'Found 1 record:\n[dd8e0473] client="Priya M2 Fresh" | stage new | filed 25-07-26 12:31 IST\n'
    + 'On the enquiries plane as well:\n  [ENQUIRY] 7e3bd732 — "Dev Test 23" | state new | filed 22-07-26 09:04 IST'),
  hr('donna_whatsdue', 'Due now: 1\n[7aff3818] due 2026-07-17 [OVERDUE] Ananya — Call Ananya'),
];

// ════════════════════════════════════════════════════════════════════════════
H('§2 — F-06.26: THE MOUTH IS READ AGAINST THE HAND (the ruled property)');

t('§2.1 THE CURE CELL — a bare "nothing new" over DATED hands CONVICTS (the short-circuit is dead)', () => {
  const v = V('Nothing new has landed — the inbox is quiet.', DATED_HANDS);
  assert.strictEqual(v.ok, false, 'a dated hand acquitted a denial — F-06.26 is back');
  assert.ok(/ABSENCE OVER DATED HANDS/.test(v.why), v.why);
});
t('§2.2 a dated hand RAISES the bar — its conviction names the answer as available and unread', () => {
  assert.ok(/available and was not read/.test(V('Nothing new has landed.', DATED_HANDS).why));
});
t('§2.3 THE ARRIVAL SPOKEN — the absence bounded by arrival evidence in the REPLY is GREEN', () => {
  const v = V('Priya M2 Fresh came in this morning; nothing new since.', DATED_HANDS);
  assert.strictEqual(v.ok, true, v.why);
  assert.ok(/the mouth said when/.test(v.why));
});
t('§2.4 THE HONEST GAP still acquits — the ask outran the reach and the reply said so', () => {
  assert.strictEqual(V('Priya M2 Fresh is on file; when she arrived is not something this reach can say.', DATED_HANDS).ok, true);
});
t('§2.5 the mouth is judged in HARVEY\'S register, not the cabinet\'s — plain speech acquits, per harveySoul:152', () => {
  assert.strictEqual(V('Nothing since Priya, who landed today.', DATED_HANDS).ok, true);
  assert.strictEqual(V('Nothing new — well, other than Priya about 40 minutes ago.', DATED_HANDS).ok, true);
});
t('§2.6 a denial can never acquit ITSELF — its own arrival verb is stripped with its negator', () => {
  assert.strictEqual(V('No new enquiries landed today. Inbox is quiet.', DATED_HANDS).ok, false);
  assert.strictEqual(V('Nothing new has landed today either.', DATED_HANDS).ok, false);
});
t('§2.7 F-06.23\'s second signal is REACHABLE ON EVERY conviction path (it went dark under the old ordering)', () => {
  assert.ok(/SECOND SIGNAL/.test(V('Nothing new has landed. You do have a fresh lead in Ritika & Arjun.', DATED_HANDS).why));
  assert.ok(/SECOND SIGNAL/.test(V('Nothing new has landed. You do have a fresh lead in Ritika & Arjun.', UNDATED_HANDS).why));
});
t('§2.8 the second signal ANNOTATES, never convicts alone — strip the fresh-item phrase and the verdict is unmoved', () => {
  assert.strictEqual(V('Priya M2 Fresh landed at 12:31 today. Nothing since.', DATED_HANDS).ok, true);
});
t('§2.9 silence is not a claim — no absence asserted, nothing to convict, dated hands or not', () => {
  assert.strictEqual(V('You have Priya, Ananya and Ritika moving. What do you want to push on?', DATED_HANDS).ok, true);
  assert.strictEqual(V('You have Priya, Ananya and Ritika moving.', UNDATED_HANDS).ok, true);
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — THE WALK\'S FOUR REPLIES, BOTH WAYS (the founder\'s own bytes, M-2 walk note §2)');

const WALK = [
  { run: 1, at: '12:42', reply: 'Inbox is quiet — no new enquiries landed today. But there\'s one thing: Ananya is overdue.' },
  { run: 2, at: '12:45', reply: 'Nothing fresh since we last spoke — inbox is quiet, no new leads today. One overdue follow-up: Ananya.' },
  { run: 3, at: '12:47', reply: 'Nothing fresh since we last spoke — inbox is quiet, no new leads today. One overdue follow-up: Ananya.' },
  { run: 4, at: '12:48', reply: 'Nothing fresh since we last spoke — inbox is quiet, no new leads today. One overdue follow-up: Ananya.' },
];
t('§3.1 all four walk replies CONVICT against the undated hands they were really given (0-for-4, reproduced at the desk)', () => {
  for (const w of WALK) assert.strictEqual(V(w.reply, UNDATED_HANDS).ok, false, `run ${w.run} (${w.at}) acquitted`);
});
t('§3.2 all four CONVICT against DATED hands too — P1 alone does not launder them (F-06.26\'s whole point)', () => {
  for (const w of WALK) assert.strictEqual(V(w.reply, DATED_HANDS).ok, false, `run ${w.run} acquitted post-P1`);
});
t('§3.3 runs 2–4 are word-identical — the attractor is stable, and the fixture preserves that fact', () => {
  assert.strictEqual(WALK[1].reply, WALK[2].reply);
  assert.strictEqual(WALK[2].reply, WALK[3].reply);
});
t('§3.4 the honest counterfactual of each walk reply is GREEN — the cell can be passed, not only failed', () => {
  assert.strictEqual(V('Priya M2 Fresh came in today — nothing after her. One overdue follow-up: Ananya.', DATED_HANDS).ok, true);
});
t('§3.5 the run-1 dispatch shape and the runs-2–4 snapshot shape convict IDENTICALLY — the tell reads the words, not the route', () => {
  assert.strictEqual(V(WALK[0].reply, UNDATED_HANDS).ok, false);
  assert.strictEqual(V(WALK[1].reply, []).ok, false); // zero hands = the snapshot-origin turn
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — THE FAN-OUT FLOOR HOLDS WITH DATES RENDERED (the composition law)');

t('§4.1 HISTORY_FANOUT_FLOOR is BYTE-UNMOVED at 2 — P1 is a per-line addition, never a volume licence', () => {
  assert.ok(/^const HISTORY_FANOUT_FLOOR = 2;$/m.test(gsrc), 'the floor moved in a sitting that had no ruling to move it');
});
t('§4.2 F2 RULED A — no production fence was built; DONNA_WORK_ITERS and TALK_FUSE stand byte-unmoved', () => {
  assert.ok(/^const DONNA_WORK_ITERS = 6;$/m.test(read(DONNA)));
  assert.ok(/^const TALK_FUSE = 5;$/m.test(read('src/engine/src/core/loop.ts')));
  assert.ok(!/HISTORY_(?:CALL|FANOUT)_(?:CAP|LIMIT)/.test(read(DONNA)), 'a fence appeared where the ruling said none');
});
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
t('§5.5 the stamp the estate mints is a stamp the re-aimed detector RECOGNISES — clock and tell agree by construction', () => {
  const line = `  [ENQUIRY] 7e3b — "Priya M2 Fresh" | state new | filed ${arrivalStamp('2026-07-25T07:01:00Z', 'Asia/Kolkata')}`;
  assert.ok(LIFTED.ARRIVAL_DATED_RE.test(line), 'the detector cannot read the estate\'s own new register');
});
t('§5.6 ONE DERIVATION — every P1 site calls arrivalStamp; no site re-slices a timestamp by hand', () => {
  for (const f of [FIND, HIST, DONNA]) {
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
t('§6.2 plane (c) donna_history — both date sites cured, the event log included (the anchor the charter did not name)', () => {
  const s = read(HIST);
  assert.strictEqual((s.match(/arrivalStamp\(/g) || []).length, 4, 'created · touched · set-aside · the event line');
  // Over EXECUTABLE lines only. The first draft of this cell convicted its own comment —
  // the one naming the disease it had just cured. CE-67 §C's grep-over-executable-lines,
  // learned again the small way.
  const code = s.split('\n').filter((ln) => !/^\s*(\/\/|\*|\/\*)/.test(ln)).join('\n');
  assert.ok(!/\.slice\(0, 10\)/.test(code), 'a raw slice survives in the provenance hand');
});
t('§6.3 plane (b) the snapshot — shape (b2): a TYPED FIELD, rendered at READ time, never frozen into text', () => {
  assert.ok(/arrived_at\?: string \| null;/.test(read(TYPES)), 'the optional field is not on SnapshotItem');
  const d = read(DONNA);
  assert.ok(/const stampOf = \(it: SnapshotItem\)[\s\S]{0,200}arrivalStamp\(it\.arrived_at/.test(d), 'the render is not at read time');
  assert.ok(/lines\.push\(`- \$\{it\.text\}\$\{stampOf\(it\)\}`\)/.test(d), 'the snapshot line does not carry the stamp');
});
t('§6.4 (b2) is WHOLE — both item builders and both rebuild selects carry the clock, or the snapshot dates by half', () => {
  assert.ok(/arrived_at: row\.created_at \?\? null/.test(read('src/engine/src/core/tools/recordPrimitives.ts')), 'recordItem');
  assert.ok(/arrived_at: row\.created_at \?\? null/.test(read('src/engine/src/core/tools/donnaLead.ts')), 'leadItem');
  const d = read(DONNA);
  assert.ok(/state, budget_max, created_at/.test(d) && /note, phone, created_at/.test(d), 'a rebuild select was left narrow');
  assert.ok(/arrived_at: \(l as \{ created_at\?: string \| null \}\)\.created_at/.test(d), 'the rebuilt lead item');
});
t('§6.5 THE SNAPSHOT IS STILL A PROJECTION, and the code says so where it renders — dating is not absence-authority', () => {
  const d = read(DONNA);
  assert.ok(/limit\(12\)/.test(d), 'the cap the rider exists for');
  assert.ok(/does NOT make an absence claim honest/.test(d), 'the render must carry its own limit in words');
});
t('§6.6 W-1 HOLDS — donnaSoul, harveySoul, advisorLens and consultantHarveySoul are 0-line this sitting', () => {
  const guarded = ['src/engine/src/core/donnaSoul.ts', 'src/engine/src/core/harveySoul.ts',
                   'src/engine/src/core/advisorLens.ts', 'src/engine/src/core/consultantHarveySoul.ts'];
  const changed = execFileSync('git', ['diff', '--name-only', BASE, '--', ...guarded], { cwd: ROOT, encoding: 'utf8' }).trim();
  assert.strictEqual(changed, '', `a guarded soul moved without its own ruling: ${changed}`);
});
t('§6.7 the riding cells landed — SD-C4\'s adverb is CHECKED, and the recency family is lane-anchored', () => {
  assert.ok(/the on-file question answered by a READ: \$\{finds\.length\}/.test(gsrc), 'SD-C4 still asserts an adverb it did not check');
  assert.ok(!/a donna_find hand read the estate this turn, faithfully reported/.test(gsrc));
  assert.ok(/'SD-FRESH', 'SD-FRESHr2', 'SD-FRESHr3', 'SD-FRESHr4'/.test(gsrc), 'the +3 cell is not anchored');
});

t('§6.8 the sitting\'s whole delta is TWELVE repo files and no thirteenth', () => {
  // Tracked delta PLUS untracked: between the founder's apply and his commit the new
  // files are untracked, and after the commit they are tracked. The cell must read the
  // same in both worlds or it is a cell that only passes on one side of a push.
  const tracked = execFileSync('git', ['diff', '--name-only', BASE], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const all = [...new Set([...tracked, ...untracked])];
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
    { file: GAUNTLET, cell: '§2.6', why: 'the strip order is reversed — the vocabulary eats the negator and a denial acquits itself on its own leftovers',
      from: "reply.replace(NEGATED_ARRIVAL_G, ' ').replace(ABSENCE_G, ' ')", to: "reply.replace(ABSENCE_G, ' ').replace(NEGATED_ARRIVAL_G, ' ')" },
    { file: GAUNTLET, cell: '§2.3', why: 'the mouth stops being read — an honest reply that names the arrival is convicted alongside the dishonest one',
      from: 'const replyDated = REPLY_ARRIVAL_RE.test(stripped);', to: 'const replyDated = false;' },
    { file: GAUNTLET, cell: '§2.7', why: 'F-06.23\'s signal is un-hoisted back onto one path — it goes dark on the dated conviction',
      from: 'const contradicts = FRESH_ITEM_RE.test(reply);', to: 'const contradicts = false;' },
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
  const REBUILD = new Set([TODAY, FIND, DONNA]); // TS mutations must reach the dist the bench imports
  for (const m of M) {
    const abs = P(m.file), orig = fs.readFileSync(abs, 'utf8');
    if (!orig.includes(m.from)) { console.log(`  FAIL MUTATION anchor stale in ${m.file} — ${m.cell}`); fail++; continue; }
    try {
      fs.writeFileSync(abs, orig.replace(m.from, m.to));
      if (REBUILD.has(m.file)) execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'ignore' });
      let out = '';
      try { execFileSync('node', [P('scripts/b06_m1_bench.js')], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, B06_M1_BENCH_CHILD: '1' } }); }
      catch (e) { out = String(e.stdout || ''); }
      const red = new RegExp(`FAIL ${m.cell.replace('§', '\\u00a7')}`).test(out);
      if (red) { console.log(`  ok   ${m.cell} RED at the uncured tree — ${m.why}`); pass++; }
      else { console.log(`  FAIL ${m.cell} did NOT go red — ${m.why}`); fail++; }
    } finally {
      fs.writeFileSync(abs, orig);
      if (REBUILD.has(m.file)) execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'ignore' });
    }
  }
  t('§7.0 every mutated file is restored BYTE-IDENTICAL', () => {
    const dirty = execFileSync('git', ['diff', '--name-only', '--', GAUNTLET, TODAY, FIND, DONNA], { cwd: ROOT, encoding: 'utf8' });
    for (const m of M) assert.ok(fs.readFileSync(P(m.file), 'utf8').includes(m.from), `${m.file} not restored`);
    assert.ok(dirty !== null);
  });
  t('§7.1 THE SOULS ARE DELIBERATELY UNMUTATED — a prompt paragraph has no desk teeth, and the walk is where it answers', () => {
    assert.ok(!M.some((m) => /Soul\.ts|Lens\.ts/.test(m.file)));
  });
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (!fail) console.log('GREEN — the estate\'s recency is legible, the clock tells the local truth, and the instrument that grades it can no longer be satisfied by a date it never spoke.');
process.exit(fail ? 1 : 0);
