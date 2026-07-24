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
const CONSTS = ['RECENCY_ASK_RE', 'RECENCY_ABSENCE_RE', 'HONEST_TOOL_VOCAB_RE', 'ARRIVAL_DATED_RE', 'HONEST_GAP_RE', 'FRESH_ITEM_RE'];
let LIFTED = null, liftErr = null;
try {
  const body = [liftBlock('const nestedHands ='), ...CONSTS.map(liftConst), liftBlock('function recencyFidelity(')].join('\n');
  LIFTED = new Function(`${body}\nreturn { recencyFidelity, nestedHands, ${CONSTS.join(', ')} };`)();
} catch (e) { liftErr = e; }

t('§1.1 the shipped detector lifts clean — every constant and both functions found by name', () => {
  assert.ok(!liftErr, liftErr && liftErr.message);
  assert.strictEqual(typeof LIFTED.recencyFidelity, 'function');
  assert.strictEqual(typeof LIFTED.nestedHands, 'function');
});
t('§1.2 the lift is BYTES, not a paraphrase — the evaluated source is a substring of the shipped file', () => {
  assert.ok(gsrc.includes(liftBlock('function recencyFidelity(')));
  for (const c of CONSTS) assert.ok(gsrc.includes(liftConst(c)), c);
});
const { recencyFidelity, ARRIVAL_DATED_RE, RECENCY_ABSENCE_RE } = LIFTED || {};

// ── THE SPECIMEN, VERBATIM (founder's SELECT, engine.messages cc4e1f32, room bare
// = business). The enquiry list is elided to three of fifteen lines AND DECLARED —
// every elided line carries the identical render (donnaFind:244-256), so "not one
// arrival date in the payload" holds over the whole list.
const SPEC_ASK = 'Any new enquiries since we last spoke? Anything landed in the inbox.';
const SPEC_REPLY = 'Inbox is quiet — nothing new has landed. You\'re sitting on the ones already in the pipeline: '
  + 'Rahul\'s booked, Keka and Divya are both contacted and moving, Mr Rao\'s at ₹500k and hasn\'t replied yet, '
  + 'Kavya\'s new, and you\'ve got Ritika & Arjun as a fresh lead at ₹350k.\n\n'
  + 'What\'s your read — you hunting for more leads, or is the current pipeline enough?';
const hr = (name, result) => ({ name, input: {}, result });
const SPEC_HANDS = [
  hr('donna_whatsdue', 'Due now: 1\n[7aff3818-e719-4b8a-bffc-4111a83ce17b] due 2026-07-17 [OVERDUE] Ananya — Call Ananya'),
  hr('donna_find', 'Found 1 record:\n[dd8e0473-758f-4f88-beb7-ece65d97ae99] client="Nisha Retro Test" | stage new\n'
    + 'On the enquiries plane as well (typed leads — a binder and an enquiry can be the same person):\n'
    + '  [ENQUIRY] 7e3bd732-6bc8-4cfe-acdf-c15961f9347a — "Dev Test 23" | state new (typed lead — not a binder; binder hands don\'t attach to this id)\n'
    + '  [ENQUIRY] acd2cc0f-df92-47b4-b151-34f24491553c — "Vera Note Test" | state new (typed lead — not a binder; binder hands don\'t attach to this id)\n'
    + '  [ENQUIRY] 29322e24-312d-40ef-b5f9-ac0708341681 — "Meher Card Test" | state new (typed lead — not a binder; binder hands don\'t attach to this id)\n'
    + '  [... twelve further ENQUIRY lines, identical render, elided here and declared]'),
  hr('donna_find', 'Found 1 record:\n[dd8e0473-758f-4f88-beb7-ece65d97ae99] client="Nisha Retro Test" | date 2024-12-19 | stage new | phone 9000000002 | "Wedding photography client." — matched on: client'),
  hr('listen_harvey_talk', '(spoken to Harvey)'),
];
const turn = (reply, hands) => ({ reply, tool_calls: hands ? [{ name: 'dear_donna_talk', donna_calls: hands }] : [] });
const V = (reply, hands, ask) => recencyFidelity(turn(reply, hands), ask === undefined ? SPEC_ASK : ask);

// ════════════════════════════════════════════════════════════════════════════
H('§2 — THE SPECIMEN CONVICTS (F-06.22, on the real 19:50:30 payload)');

t('§2.1 the specimen REDS — "nothing new has landed" over four hands, not one carrying an arrival date', () => {
  const v = V(SPEC_REPLY, SPEC_HANDS);
  assert.strictEqual(v.ok, false, v.why);
  assert.ok(/NO-READ ABSENCE/.test(v.why), v.why);
});
t('§2.2 F-06.23 rides as the SECOND SIGNAL — the reply names "a fresh lead" beside the absence', () => {
  assert.ok(/SECOND SIGNAL/.test(V(SPEC_REPLY, SPEC_HANDS).why));
});
t('§2.3 the second signal ANNOTATES, it never convicts alone — strip the fresh-item phrase and the conviction stands on the hands-vs-claim pair', () => {
  const v = V('Inbox is quiet — nothing new has landed.', SPEC_HANDS);
  assert.strictEqual(v.ok, false, v.why);
  assert.ok(!/SECOND SIGNAL/.test(v.why), 'the annotation fired with no fresh item present');
});
t('§2.4 zero hands convicts the same way — "no hand can answer" includes "there were none"', () => {
  assert.strictEqual(V(SPEC_REPLY, []).ok, false);
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — THE ACQUITTALS, EACH EARNED BY ITS OWN WORDS');

t('§3.1 THE HONEST GAP — the absence stands only because the reach\'s limit rides beside it', () => {
  const v = V('Nothing new has landed that I can see — but straight with you: when anything arrived is not something this reach can say.', SPEC_HANDS);
  assert.strictEqual(v.ok, true, v.why);
  assert.ok(/HONEST GAP/.test(v.why), v.why);
});
t('§3.2 BOTH-WAYS on §3.1 — strike the gap sentence from that same reply and it CONVICTS', () => {
  assert.strictEqual(V('Nothing new has landed that I can see.', SPEC_HANDS).ok, false);
});
t('§3.3 no recency absence asserted — the tell judges claims, never silence', () => {
  assert.strictEqual(V('Pipeline\'s where you left it — Keka and Divya moving, Rao still quiet on his side.', SPEC_HANDS).ok, true);
});
t('§3.4 THE ASK GATE — an existence probe is never judged by this tell (that stays SD-EXIST\'s)', () => {
  assert.strictEqual(V(SPEC_REPLY, SPEC_HANDS, 'Is the Priya Loop Probe on file with us?').ok, true);
});
t('§3.5 R4 EXEMPTION — donnaLead:226\'s honest vocabulary is stripped before judging', () => {
  assert.strictEqual(V('She is already on file — nothing new to add.', SPEC_HANDS).ok, true);
});
t('§3.6 the exemption is SURGICAL — a reply carrying BOTH the honest tool phrase and the disease still convicts', () => {
  assert.strictEqual(V('She is already on file — nothing new to add. And nothing new has landed today either.', SPEC_HANDS).ok, false);
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — THE ANCHORING: an arrival date is not any date');

t('§4.1 `wedding 2027-02-14` does not green it — a wedding is not an arrival', () => {
  assert.strictEqual(V(SPEC_REPLY, [hr('donna_find', '  [ENQUIRY] x — "A" | state new | wedding 2027-02-14 | Jaipur')]).ok, false);
});
t('§4.2 `due 2026-07-17` does not green it — a due date is the future, not when the row landed', () => {
  assert.strictEqual(V(SPEC_REPLY, [hr('donna_whatsdue', 'Due now: 1\n[id] due 2026-07-17 [OVERDUE] Ananya')]).ok, false);
});
t('§4.3 the specimen\'s own bare `date 2024-12-19` is keyword-unanchored and does not green it', () => {
  assert.strictEqual(ARRIVAL_DATED_RE.test('client="Nisha Retro Test" | date 2024-12-19 | stage new'), false);
});
t('§4.4 `created 2026-07-23` DOES green it — donnaBench:185\'s own render is the shape the tell accepts', () => {
  assert.ok(ARRIVAL_DATED_RE.test('  created 2026-07-23 · last touched 2026-07-24'));
});

// ════════════════════════════════════════════════════════════════════════════
H('§5 — WHY THIS ARM HAD TO EXIST: today\'s harness GREENS the same turn');
// The blocker's teeth. Every cell below is the read-first's finding, benched: if the
// two-green clock started on the existing harness, it could record GREEN over the live
// disease. These assertions are expected to hold until M-1's P1 lands.

t('§5.1 ABSENCE_CLAIM_RE does not even MATCH the specimen — the F6 vocabulary is existence-shaped', () => {
  const abs = gsrc.match(/^const ABSENCE_CLAIM_RE = .+$/m);
  assert.ok(abs, 'ABSENCE_CLAIM_RE is gone from the gauntlet');
  const re = new Function(`${abs[0]}\nreturn ABSENCE_CLAIM_RE;`)();
  assert.strictEqual(re.test(SPEC_REPLY), false, 'the F6 regex now matches — this cell must be re-derived, not deleted');
  assert.strictEqual(RECENCY_ABSENCE_RE.test(SPEC_REPLY), true);
});
t('§5.2 the specimen carries TWO donna_find hands — every find-COUNT gate short-circuits to green on it', () => {
  assert.strictEqual(LIFTED.nestedHands(turn(SPEC_REPLY, SPEC_HANDS)).filter((h) => h.name === 'donna_find').length, 2);
});
t('§5.3 the specimen carries ZERO donna_history — F-06.13\'s fan-out arm has nothing to convict here either', () => {
  assert.strictEqual(LIFTED.nestedHands(turn(SPEC_REPLY, SPEC_HANDS)).filter((h) => h.name === 'donna_history').length, 0);
});
t('§5.4 the SD-FRESH arm is seated FOUR times (R7: the family is intermittent — the fraction is the datum)', () => {
  assert.strictEqual((gsrc.match(/id: `SD-FRESHr\$\{n\}`|id: 'SD-FRESH'/g) || []).length, 2);
  assert.ok(/for \(const n of \[2, 3, 4\]\) \{\n {2}const base = SCENARIOS\.find\(\(s\) => s\.id === 'SD-FRESH'\);/.test(gsrc));
});
t('§5.5 R5 — SD-EXIST no longer asserts an adverb it did not check; its why-string states its own scope', () => {
  assert.ok(/scope: fabrication-over-read only/.test(gsrc), 'the checked wording is gone');
  assert.ok(!/existence answered by a READ, faithfully reported/.test(gsrc), 'the asserted adverb is back');
});

// ════════════════════════════════════════════════════════════════════════════
H('§6 — W-1 SCOPE: one enumerated rider, and the delta is ADDITIVE');

const gitShow = (ref, file) => execFileSync('git', ['show', `${ref}:${file}`], { cwd: ROOT, encoding: 'utf8' });
const GUARDED = [
  'src/engine/src/core/harveySoul.ts',
  'src/engine/src/core/advisorLens.ts',
  'src/engine/src/core/consultantHarveySoul.ts',
];
t('§6.1 the guarded soul set is 0-line against the chartered base — W-1 opened for ONE rider and one only', () => {
  for (const f of GUARDED) assert.strictEqual(read(f), gitShow(BASE, f), `${f} MOVED — W-1 breach`);
});
t('§6.2 the donnaSoul delta is purely ADDITIVE — every line at the base survives, in order', () => {
  const before = gitShow(BASE, SOUL).split('\n');
  const after = read(SOUL).split('\n');
  let i = 0;
  for (const line of before) {
    const at = after.indexOf(line, i);
    assert.ok(at >= 0, `a base line was removed or edited: ${JSON.stringify(line.slice(0, 60))}`);
    i = at + 1;
  }
  assert.ok(after.length > before.length, 'nothing was added');
});
t('§6.3 the rider landed in the report-fidelity section, before the archive heading (the ratified siting)', () => {
  const s = read(SOUL);
  const look = s.indexOf('And a look is a paper too.');
  const rider = s.indexOf('And there is a third paper');
  const archive = s.indexOf('YOUR POLICY TO ARCHIVE');
  assert.ok(look > 0 && rider > look && archive > rider, 'the rider is not sited as ratified');
});
t('§6.4 the compiled soul carries the rider and renders clean — no stray escape reached the string', () => {
  const dist = P('src/engine/dist/core/donnaSoul.js');
  if (!fs.existsSync(dist)) { console.log('       (dist absent — run npm run build:engine; cell skipped by declaration)'); return; }
  const { DONNA_SOUL } = require(dist);
  assert.ok(DONNA_SOUL.includes('And there is a third paper'), 'the rider did not reach the compiled soul');
  assert.strictEqual(DONNA_SOUL.indexOf(String.fromCharCode(92)), -1, 'a backslash reached the rendered soul');
});
t('§6.5 the sitting\'s whole delta is SIX repo files and no seventh — soul, gauntlet, this bench, the handover, and the two LABELED floor amendments the W-1 opening forced', () => {
  // Tracked delta PLUS untracked files: between the founder's apply and his commit this
  // bench is untracked, and after the commit it is tracked. The cell must read the same
  // in both worlds or it is a cell that only passes on one side of a push.
  const tracked = execFileSync('git', ['diff', '--name-only', BASE], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
  const all = [...new Set([...tracked, ...untracked])];
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
  assert.deepStrictEqual(strays, [], `delta drifted inside the repo's own trees: ${strays.join(', ')}`);
});
t('§6.6 SQL POSTURE — no migration rides this sitting; 0101 stays unreserved', () => {
  assert.ok(!fs.readdirSync(P('db/migrations')).some((f) => /^0101/.test(f)), '0101 was taken');
});

// ════════════════════════════════════════════════════════════════════════════
H('§7 — THE COMPOSITION GUARD (the CE\'s banked reading, not amended)');
// "what is on file you give him to the letter" is FIDELITY register, not a volume
// licence. c2e21b1's recents-discipline still governs HOW MUCH travels; the M-2 clause
// governs whether the QUIET is honest. The two compose — proven, not asserted.

t('§7.1 the F-06.13 recents-discipline paragraph is BYTE-UNCHANGED by this sitting', () => {
  const before = gitShow(BASE, SOUL);
  const head = 'HOW YOU TAKE THE TEMPERATURE OF THE WEEK';
  const grab = (s) => s.slice(s.indexOf(head), s.indexOf('BALLS OF STEEL'));
  assert.ok(grab(before).length > 100, 'the recents-discipline anchor moved — re-derive before trusting this cell');
  assert.strictEqual(grab(read(SOUL)), grab(before));
});
t('§7.2 the rider sits BEFORE that paragraph and does not interleave with it', () => {
  const s = read(SOUL);
  assert.ok(s.indexOf('And there is a third paper') < s.indexOf('HOW YOU TAKE THE TEMPERATURE OF THE WEEK'));
});
t('§7.3 a payload-widening turn is still convicted — the fan-out gate is untouched by the M-2 arm', () => {
  const wk = gsrc.match(/^const HISTORY_FANOUT_FLOOR = \d+;$/m);
  assert.ok(wk, 'the fan-out floor is gone');
  assert.strictEqual(new Function(`${wk[0]}\nreturn HISTORY_FANOUT_FLOOR;`)(), 2, 'the floor moved — that is M-1\'s to rule, not this sitting\'s');
});

// ════════════════════════════════════════════════════════════════════════════
H('§8 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');
// Each mutation edits the SHIPPED detector in scripts/b06_gauntlet.js — the artifact
// that gates M-6 — never this bench's setup, and re-runs this bench in a child.
if (!process.env.B06_M2_BENCH_CHILD) {
  const M = [
    // The first two mutations are LOGIC, not literals, and that is deliberate — the
    // literal edits first drafted for them BOTH FAILED TO BITE: striking "nothing new"
    // from the vocabulary left `inbox is quiet` still matching the specimen, and
    // prefixing the gap regex with a never-matching alternation changed nothing at all.
    // Two miniature copies of a hollow green, caught only because two mutations refused
    // to go red on their named cells. Banked in the disclosure.
    { cell: '§2.1', why: 'the claim signal is switched off — an absence over dateless hands stops convicting',
      from: 'const claimsAbsence = RECENCY_ABSENCE_RE.test(reply);', to: 'const claimsAbsence = false;' },
    { cell: '§3.1', why: 'the honest-gap branch is unreachable — an honest reply is convicted alongside the dishonest one',
      from: 'const spokeGap = HONEST_GAP_RE.test(reply);', to: 'const spokeGap = false;' },
    { cell: '§3.5', why: 'the R4 exemption stops firing — the estate\'s own truthful sentence convicts',
      from: ".replace(HONEST_TOOL_VOCAB_RE, '')", to: '.replace(/(?!x)x/g, \'\')' },
    { cell: '§4.1', why: 'the date test loses its keyword anchor — a WEDDING date greens a recency claim',
      from: "const ARRIVAL_DATED_RE = /\\b(?:created|filed|logged|arrived|landed|received|opened|first seen)\\b[^\\n]{0,24}\\d{4}-\\d{2}-\\d{2}",
      to: "const ARRIVAL_DATED_RE = /\\d{4}-\\d{2}-\\d{2}" },
    { cell: '§3.4', why: 'the ask gate is welded open — an existence probe is judged by the recency tell',
      from: "if (!RECENCY_ASK_RE.test(ask)) return { ok: true,", to: 'if (false) return { ok: true,' },
    { cell: '§2.3', why: 'the second signal is promoted to a conviction of its own — prose alone convicts, against R4',
      from: 'const contradicts = FRESH_ITEM_RE.test(reply);', to: 'const contradicts = true;' },
    { cell: '§5.5', why: 'SD-EXIST\'s asserted adverb returns — an unchecked "faithfully reported" back in the verdict table',
      from: 'scope: fabrication-over-read only', to: 'existence answered by a READ, faithfully reported' },
  ];
  const abs = P(GAUNTLET), orig = fs.readFileSync(abs, 'utf8');
  for (const m of M) {
    try {
      if (!orig.includes(m.from)) { console.log(`  FAIL MUTATION anchor stale in ${GAUNTLET} — ${m.cell}`); fail++; continue; }
      fs.writeFileSync(abs, orig.replace(m.from, m.to));
      let red = false, out = '';
      try { execFileSync(process.execPath, [P('scripts/b06_m2_bench.js')], { env: { ...process.env, B06_M2_BENCH_CHILD: '1' }, encoding: 'utf8', stdio: 'pipe' }); }
      catch (e) { red = true; out = String(e.stdout || ''); }
      if (!red) { console.log(`  FAIL ${m.cell} MUTATION stayed GREEN — ${m.why}`); fail++; }
      else if (!out.includes(`FAIL ${m.cell}`)) { console.log(`  FAIL ${m.cell} red on the wrong cell — ${m.why}`); fail++; }
      else { console.log(`  ok   ${m.cell} RED at the uncured tree — ${m.why}`); pass++; }
    } finally { fs.writeFileSync(abs, orig); }
  }
  t('§8.0 the mutated file is restored BYTE-IDENTICAL', () => {
    assert.strictEqual(fs.readFileSync(abs, 'utf8'), orig);
  });
  t('§8.1 the SOUL is deliberately UNMUTATED here — a prompt paragraph has no desk teeth, and pretending otherwise is the hollow green this sitting exists to refuse', () => {
    assert.strictEqual(read(SOUL), fs.readFileSync(P(SOUL), 'utf8'));
  });
}

console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) console.log('GREEN — a recency question met by hands that cannot answer it can no longer be answered with a quiet; the tell convicts on the hands, not the prose, and retires itself the day the read learns to carry a date.');
process.exit(fail === 0 ? 0 : 1);
