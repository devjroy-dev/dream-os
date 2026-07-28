#!/usr/bin/env node
// b06_f0613_relay_bench.js — TDW_06 THE DETERMINISTIC SITTING (2026-07-28).
//
// Two cures, one bench, because they were ruled as one act: the SD-WEEK mechanical
// floor (F-06.13's fan-out, CE-25's HOLD founder-REVERSED on Evening Four's
// repetition) and the SD-REL relay-seam complement (her voiced sentence checked
// against her own hand's structured receipt).
//
// IT DRIVES THE SHIPPED FUNCTIONS, NEVER A COPY: every predicate below is required
// out of `src/engine/dist/core/`, so `npm run build` is a precondition and a mutation
// of production code REDS this file. Source pins are used only where the claim IS
// about the source (a law's presence, a W-1 byte-identity, a coverage boundary).
//
// THE LIVE VERDICT IS OUTSTANDING AND IS NOT THIS BENCH'S: no desk cell witnesses a
// model choosing honestly. What these cells witness is that the WIRE no longer offers
// it the choice on the two convicted shapes — which is the whole of what Path A
// bought. EVENING FIVE's SD-WEEK and SD-REL are the only live verdicts these cures
// will ever get, and they are declared here, never claimed.

const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'src/engine/dist/core');

if (!fs.existsSync(path.join(DIST, 'historyGate.js')) || !fs.existsSync(path.join(DIST, 'relaySeam.js'))) {
  console.error('DIST MISSING — run `npm run build` first. This bench drives the SHIPPED functions, never a copy.');
  process.exit(1);
}

const gate = require(path.join(DIST, 'historyGate.js'));
const seam = require(path.join(DIST, 'relaySeam.js'));

const SRC = {
  gate: fs.readFileSync(path.join(ROOT, 'src/engine/src/core/historyGate.ts'), 'utf8'),
  seam: fs.readFileSync(path.join(ROOT, 'src/engine/src/core/relaySeam.ts'), 'utf8'),
  lead: fs.readFileSync(path.join(ROOT, 'src/engine/src/core/tools/donnaLead.ts'), 'utf8'),
  donna: fs.readFileSync(path.join(ROOT, 'src/engine/src/core/donna.ts'), 'utf8'),
  loop: fs.readFileSync(path.join(ROOT, 'src/engine/src/core/loop.ts'), 'utf8'),
  types: fs.readFileSync(path.join(ROOT, 'src/engine/src/core/snapshotTypes.ts'), 'utf8'),
  bench: fs.readFileSync(path.join(ROOT, 'src/engine/src/core/tools/donnaBench.ts'), 'utf8'),
  soul: fs.readFileSync(path.join(ROOT, 'src/engine/src/core/donnaSoul.ts'), 'utf8'),
};

let pass = 0, fail = 0;
const T = (name, ok) => { if (ok) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}`); } };
const sec = (s) => console.log(`\n${s}`);

// A gate context built the way the work loop builds it: an ask, then a find's yield.
const ctxFor = (ask, { breadth = [], named = [], names = {} } = {}) => {
  const c = gate.makeHistoryGateContext(ask);
  for (const id of breadth) c.breadthIds.add(id);
  for (const id of named) c.namedIds.add(id);
  for (const [id, n] of Object.entries(names)) c.knownNames.set(id, n);
  return c;
};
const SHAPE_ASK = "How's the week looking — who's active, what's on the pile?";
const SWEEP = { breadth: ['rec-g1', 'rec-g2'], names: { 'rec-g1': 'Ishita Gateprobe', 'rec-g2': 'Nandita Sweepcheck' } };

// ───────────────────────────────────────────────────────────────────────────────
sec('§1 THE GATE — the breadth excess refused, the four lawful shapes untaxed (forks A-1(b)/A-2(b))');

T('§1.1 THE CONVICTED SHAPE: a sweep-supplied id on an ask that names no record is REFUSED, and the paper is the shipped bytes',
  gate.historyRefusal('rec-g1', ctxFor(SHAPE_ASK, SWEEP)) === gate.HISTORY_REFUSAL_PAPER);

T('§1.2 L1 — THE OWNER NAMED THE RECORD (by the name the sweep surfaced): UNTAXED',
  gate.historyRefusal('rec-g1', ctxFor('Where does Ishita Gateprobe stand?', SWEEP)) === null);

T('§1.2b L1 — CE-25\'s PROTECTED CASE, COUNT-BLIND: an owner naming several records is untaxed on every one of them',
  ['rec-g1', 'rec-g2'].every((id) => gate.historyRefusal(id, ctxFor(
    'Where do Ishita Gateprobe and Nandita Sweepcheck stand?', SWEEP)) === null));

T('§1.2c L1 — the generous limb: any name-shaped capitalised token past a sentence\'s first word opens the gate (F-04.27: ambiguity resolves toward the read happening)',
  gate.historyRefusal('rec-g1', ctxFor('Pull up Chandrika for me.', SWEEP)) === null);

T('§1.3 L2 — PROVENANCE ("how do you know that"): UNTAXED, the hand\'s own stated purpose',
  gate.historyRefusal('rec-g1', ctxFor('How do you know that?', SWEEP)) === null
  && gate.historyRefusal('rec-g1', ctxFor('show me your sources', SWEEP)) === null);

T('§1.4 L3 — RECONCILIATION BEFORE A WRITE: an ask carrying write intent is UNTAXED (DONNA_STATIC_PREFIX orders her to reconcile before she writes; a gate refusing that read would contradict the estate\'s own cached law)',
  gate.historyRefusal('rec-g1', ctxFor('update the balance on that one', SWEEP)) === null);

T('§1.5 L4 — THE ID CAME FROM A NAMED FIND: UNTAXED, whatever the ask looks like',
  gate.historyRefusal('rec-g9', ctxFor(SHAPE_ASK, { breadth: ['rec-g1'], named: ['rec-g9'] })) === null);

T('§1.5b L4 OUTRANKS AN EARLIER SWEEP on the same id — once the chain has narrowed by name it has narrowed, and the reverse is never true',
  (() => { const c = ctxFor(SHAPE_ASK, SWEEP); c.namedIds.add('rec-g1'); c.breadthIds.delete('rec-g1');
    return gate.historyRefusal('rec-g1', c) === null; })());

T('§1.6 AN ID NO FIND SUPPLIED IS UNTAXED — the gate refuses a chain, never an id',
  gate.historyRefusal('rec-unknown', ctxFor(SHAPE_ASK, SWEEP)) === null);

T('§1.7 FAIL-OPEN ON A MISSING ASK: an empty ask can be judged by nothing, so it is never refused',
  gate.historyRefusal('rec-g1', ctxFor('', SWEEP)) === null);

T('§1.8 AN EMPTY binder_id IS NOT THIS GATE\'S CASE — the door\'s own ERROR speaks (the two registers never collide)',
  gate.historyRefusal('', ctxFor(SHAPE_ASK, SWEEP)) === null);

T('§1.9 isBreadthFind BOTH WAYS: nothing given is the recents SWEEP; any search term makes it a NAMED find',
  gate.isBreadthFind({}) === true && gate.isBreadthFind({ query: '' }) === true
  && gate.isBreadthFind({ query: 'Ishita' }) === false && gate.isBreadthFind({ phone: '9811000000' }) === false);

T('§1.10 F-04.62 — A DELIBERATE REFUSAL IS NEVER A SEARCH FAILURE: the paper opens REFUSED and disowns the failure reading in its first clause; it is not ERROR-prefixed; the hand\'s two genuine ERROR forms are byte-present and unchanged',
  /^REFUSED, and this is not a failure: /.test(gate.HISTORY_REFUSAL_PAPER)
  && !/^ERROR/.test(gate.HISTORY_REFUSAL_PAPER)
  && SRC.bench.includes("ERROR: donna_history needs binder_id.")
  && SRC.bench.includes('ERROR opening history: '));

T('§1.11 THE PAPER STATES WHAT IT REFUSED, WHY, AND THE LAWFUL PATH (F-06.92\'s pattern; F-04.27\'s affordance — a false refusal costs one narrowing step, never a dead end)',
  /the binder was not opened/.test(gate.HISTORY_REFUSAL_PAPER)
  && /named no record/.test(gate.HISTORY_REFUSAL_PAPER)
  && /recents sweep rather than a search by name/.test(gate.HISTORY_REFUSAL_PAPER)
  && /If the owner named this record, or you find it by name first, the read is lawful/.test(gate.HISTORY_REFUSAL_PAPER));

T('§1.12 A-3, RULED: THE PLAIN LEG IS ABSENT, NOT DORMANT — historyGate authors no plain clause anywhere, so the paper cannot reach Victor\'s composer or a vendor by any path',
  !/plain/.test(SRC.gate.replace(/^\/\/.*$/gm, '')));

T('§1.13 THE REFUSAL IS RECORDED UNDER ITS OWN HAND NAME, never donna_history — every reader that counts that name means "a deep read happened", and a refusal keeping it would leave a hollow RED over a wire that refused correctly',
  gate.HISTORY_REFUSED_HAND === 'donna_history_refused'
  && SRC.donna.includes('record(HISTORY_REFUSED_HAND, tu.input, refusal);'));

T('§1.14 THE SITING IS THE WORK LOOP (fork A-1(b)) and executeHistory still has exactly ONE caller — the predicate reads the ask, the chain and the ids where they are formed',
  /const gateCtx = makeHistoryGateContext\(harveyMessage\);/.test(SRC.donna)
  && (SRC.donna.match(/executeHistory\(/g) || []).length === 1);

T('§1.15 THE FAIL-OPEN/FAIL-CLOSED CONTRAST IS STATED WHERE BOTH ARE READ: the provenance hold sits at this same seam and fails CLOSED; this gate fails OPEN, and the asymmetry is named in-comment',
  /provenance hold sits at this same seam[\s\S]{0,400}fails\s*\n?\s*\/\/ CLOSED/.test(SRC.donna)
  || /fails\s+CLOSED[\s\S]{0,400}gate fails OPEN/.test(SRC.donna));

// ───────────────────────────────────────────────────────────────────────────────
sec('§2 THE RELAY SEAM — the echo caught, the honest relay untouched (fork B-2(α))');

const REFUSED_TARA = [
  { field: 'city', stands: 'Jaipur', said: 'Udaipur' },
  { field: 'wedding date', stands: '5 March 2027', said: '5 December 2027' },
];
const DOOR_SENTENCE = "Not written — the record already stands: the city stays Jaipur (you said Udaipur), the wedding date stays 5 March 2027 (you said 5 December 2027). If either should change, say so and I'll change it.";
const ECHO = 'Listen Harvey — Lead updated: Tara Relay Test, Udaipur, 5 Dec 2027, phone on file.';
const HONEST = 'Listen Harvey — Matched the existing Tara Relay Test — her record holds Jaipur, 5 March 2027; the new city and date were not written.';

T('§2.1 THE ECHO IS DETECTED: the relay asserts the value the door refused and never names the value that stands',
  seam.echoedRefusals(ECHO, REFUSED_TARA).length === 1
  && seam.echoedRefusals(ECHO, REFUSED_TARA)[0].field === 'city');

T('§2.2 THE HONEST RELAY IS NOT DETECTED: it carries the standing value, so however many facts were refused it is never a contradiction',
  seam.echoedRefusals(HONEST, REFUSED_TARA).length === 0);

T('§2.3 FAIL-OPEN BY CONSTRUCTION: a hand with no refused array can never be detected — no inference fallback exists (F-06.102: structured fields, never prose)',
  seam.echoedRefusals(ECHO, undefined).length === 0
  && seam.echoedRefusals(ECHO, null).length === 0
  && seam.echoedRefusals(ECHO, []).length === 0);

T('§2.4 A HALF-FORMED FACT NEVER CONVICTS (a missing stands or said is silence, not a contradiction)',
  seam.echoedRefusals('Udaipur it is.', [{ field: 'city', stands: '', said: 'Udaipur' }]).length === 0
  && seam.echoedRefusals('Udaipur it is.', [{ field: 'city', stands: 'Jaipur', said: '' }]).length === 0);

T('§2.5 HER BYTES ARE VERBATIM-FIRST AND BYTE-EXACT: the append never edits, reorders or drops one character of hers',
  seam.appendDeedTail(ECHO, DOOR_SENTENCE).startsWith(ECHO)
  && seam.stripDeedTail(seam.appendDeedTail(ECHO, DOOR_SENTENCE)) === ECHO);

T('§2.6 THE TAIL IS THE DOOR\'S ALREADY-VETOED SENTENCE, after the founder-vetoed seam and nothing else',
  seam.appendDeedTail(ECHO, DOOR_SENTENCE) === ECHO + seam.RELAY_DEED_SEAM + DOOR_SENTENCE);

T('§2.7 THE SEAM IS THE VETOED V1 BYTES: newline, em-dash lead-in, "from the file: " — a second voice on the wire, never a continuation of hers',
  seam.RELAY_DEED_SEAM === '\n— from the file: ');

T('§2.8 IDEMPOTENT: a text already carrying the seam is returned untouched — no second pass can double a tail onto a relay',
  seam.appendDeedTail(seam.appendDeedTail(ECHO, DOOR_SENTENCE), DOOR_SENTENCE)
    === seam.appendDeedTail(ECHO, DOOR_SENTENCE));

T('§2.9 A CLEAN TURN APPENDS NOTHING: an empty door sentence returns the voiced text byte-identical (the cost fires only on a detected contradiction)',
  seam.appendDeedTail(HONEST, '') === HONEST && seam.appendDeedTail(HONEST, '   ') === HONEST);

T('§2.10 stripDeedTail IS TOTAL: a text with no seam is returned whole, so the arms\' extraction is byte-safe on every historic turn',
  seam.stripDeedTail(HONEST) === HONEST && seam.stripDeedTail('') === '');

T('§2.11 THE SEAM HAS ONE HOME AND THE COMPOSER IMPORTS IT — a second copy would silently un-blind every per-mouth arm (F-04.36\'s class)',
  (SRC.seam.match(/^export const RELAY_DEED_SEAM = /mg) || []).length === 1
  && /import \{ echoedRefusals, appendDeedTail \} from '\.\/relaySeam\.js';/.test(SRC.loop)
  && !/const RELAY_DEED_SEAM/.test(SRC.loop));

T('§2.12 THE DETECTION IS WIRED FAIL-OPEN AT THE SEAM: a hand without refused is skipped before anything is composed',
  /if \(!dc\.refused \|\| !dc\.refused\.length\) continue;/.test(SRC.loop));

// ───────────────────────────────────────────────────────────────────────────────
sec('§3 THE CARRIER, THE COVERAGE BOUNDARY, AND THE LAWS BOTH CURES SHIP INSIDE');

T('§3.1 THE STRUCTURED CARRIER IS ADDITIVE ON ToolOutcome and re-exported from ONE home (fork B-1(a); (b) refused on F-04.36)',
  /refused\?: RefusedFact\[\] \| null;/.test(SRC.types)
  && /import type \{ RefusedFact \} from '\.\/relaySeam\.js';/.test(SRC.types)
  && (SRC.seam.match(/^export type RefusedFact = /mg) || []).length === 1);

T('§3.2 THE DOOR AUTHORS refused FROM THE GUARDS IT HAS ALREADY EVALUATED — one evaluation, two renderings, no second home to drift',
  (SRC.lead.match(/refusedFacts\.push\(/g) || []).length === 4
  && (SRC.lead.match(/notWritten\.push\(/g) || []).length === 4);

T('§3.3 BOTH SINGLE-MATCH RETURNS CARRY IT, and fail-open: no refusal ⇒ no array ⇒ the relay can never be detected on that hand',
  (SRC.lead.match(/plain: plainClause, refused: refusedOut \}/g) || []).length === 2
  && /const refusedOut = refusedFacts\.length \? refusedFacts : undefined;/.test(SRC.lead));

T('§3.4 THE DATE FACT IS PRECISION-HONEST: the structured value comes from humanWeddingDate, the same renderer the sentence uses — a month-precision row can never enter the carrier as a day the estate never had',
  /refusedFacts\.push\(\{ field: 'wedding date', stands, said: given \}\);/.test(SRC.lead));

T('§3.5 B-3 — THE COVERAGE BOUNDARY IS STATED AS LAW, against `refused` and never conflated with `plain`',
  /`refused` is authored at TWO sites/.test(SRC.seam)
  && /`plain`   is authored at THREE/.test(SRC.seam)
  && /THE DAY A NEW DOOR EARNS A `refused` ARRAY IT HAS EXTENDED THIS\n\/\/ GUARD/.test(SRC.seam));

T('§3.5b AND THE BOUNDARY IS TRUE AT THIS COMMIT — derived, not asserted: refused at two sites, plain at three',
  (() => {
    const files = ['tools/donnaLead.ts', 'tools/donnaFind.ts', 'tools/donnaBench.ts', 'tools/recordPrimitives.ts',
      'tools/jotAdvice.ts', 'tools/dearDonna.ts'].map((f) => path.join(ROOT, 'src/engine/src/core', f))
      .filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    const refused = (files.match(/refused: refusedOut/g) || []).length;
    const plain = (files.match(/plain: plainClause|plain: plainArrival\(/g) || []).length;
    return refused === 2 && plain === 3;
  })());

T('§3.6 F-06.85 BOTH DIRECTIONS — the seam names the arms it conditions, and the gate names the soul sentence it conditions with the reverse pointer FILED AS OWED (W-1 shut)',
  /relayMouths/.test(SRC.seam) && /SD-REL's verdict is\s*\n?\/\/ BYTE-UNTOUCHED/.test(SRC.seam.replace(/\r/g, ''))
  && /donna_history reads\s*\n\/\/ back/.test(SRC.gate)
  && /THE POINTER IS FILED AS OWED/.test(SRC.gate));

T('§3.7 W-1 HELD SHUT: donnaSoul.ts is byte-free of both cures, and DONNA_STATIC_PREFIX is composed from DONNA_SOUL + the cabinet text untouched — the cache window is not invalidated by this delivery',
  !/historyGate|relaySeam|RELAY_DEED_SEAM|REFUSED, and this is not a failure/.test(SRC.soul)
  && /const DONNA_STATIC_PREFIX =\n    DONNA_SOUL \+/.test(SRC.donna)
  && !/RELAY_DEED_SEAM|historyRefusal/.test(
    SRC.donna.slice(SRC.donna.indexOf('const DONNA_STATIC_PREFIX ='), SRC.donna.indexOf('// Bounds Donna'))));

T('§3.8 THE DISTIL NEEDS NO READER CHANGE: the annotated text IS the persisted listen_harvey_talk result, so donnaMessages re-teaches the correction with zero reader bytes shipped',
  /result: voicedOut \}\);/.test(SRC.loop)
  && !/RELAY_DEED_SEAM|stripDeedTail/.test(fs.readFileSync(path.join(ROOT, 'src/engine/src/core/memory.ts'), 'utf8')));

T('§3.9 FORK C IS NOT DOUBLED: a receipt already carried at the seam is not repeated in the composer\'s payload',
  /const carriedAtSeam = new Set\(echoedPlain\);/.test(SRC.loop)
  && /!carriedAtSeam\.has\(t\)/.test(SRC.loop));

console.log(`\n${fail === 0 ? 'GREEN' : 'RED'} — b06_f0613_relay_bench ${pass}/${pass + fail}`);
if (fail === 0) {
  console.log('\n       The breadth sweep no longer hauls eight dossiers to answer a question about');
  console.log('       eight timestamps, and a relay that speaks over its own receipt no longer');
  console.log('       ships alone. Her words are untouched; the file speaks after them.');
  console.log('       THE LIVE VERDICT IS EVENING FIVE\'S — declared here, never claimed.');
}
process.exit(fail === 0 ? 0 : 1);
