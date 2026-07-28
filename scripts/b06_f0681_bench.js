// b06_f0681_bench.js — TDW_06, THE RELAY LAW SITTING (F-06.81 · F-06.79 · F-06.85).
//
// THE DISEASE. donnaSoul :50 — the third-paper paragraph — was authored at c736a7e
// (2026-07-24 09:41 UTC) and told Donna that "a reach that hands you an order is not a
// reach that hands you a clock" and that "when it arrived you tell him this reach cannot
// say." At ab011c1 (the SAME DAY, 20:28 UTC) M-1's P1 made the reach say it: today.ts's
// arrivalStamp now stamps `filed dd-mm-yy HH:MM IST` onto donnaFind's results, the event
// trail and the snapshot. The law telling her the clock was unknowable was written ten
// hours and forty-seven minutes before the clock became knowable, and stayed byte-
// unchanged for three days. She was obeying a true-when-written sentence.
//
// LD-5 AND WHAT THIS BENCH REFUSES TO DO. Benches assert BEHAVIOUR, never wording. A
// cell that greps the new sentence is a fence, and this estate has watched three fences
// fail on this exact class. So NOT ONE CELL HERE PINS A BYTE THE CURE ADDED. What is
// asserted instead:
//   · the RETIRED PROPOSITION is absent from the live compiled soul (an absence cell
//     reds if the stale idea ever returns, and constrains no future rewording);
//   · the RULED BOUNDARY held — the nine clauses the CE ruled untouchable are byte-
//     identical to the charter tip, clause 5's undated guard among them;
//   · the CONTRACT's brevity ceiling is QUALIFIED rather than absolute (property, via
//     the REAL DONNA_STATIC_PREFIX — the string the model actually reads);
//   · the EXEMPLAR SET carries a date-bearing member, tested by DATE SHAPE, never by the
//     literal that was added (CE-78's donor lesson: the context teaches what the law
//     forbids, so the worked examples had to stop teaching dateless);
//   · F-06.85's own floor — the conditioned sentence NAMES its mechanism in-comment, so
//     the next sitting on arrivalStamp is forced to re-read this paragraph. Without this
//     cell the law that this sitting minted would rot exactly the way :50 did.
//
// WHAT THIS BENCH CANNOT WITNESS, stated plainly rather than implied: whether Donna
// actually carries the dates. No desk cell can. The verdict is the next gauntlet run's
// DATES DROPPED / DATES CARRIED census (b06_gauntlet.js:1005/:1033), and it is
// outstanding at delivery.
'use strict';
const assert = require('assert');
const fs = require('fs'); const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'); const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
let pass = 0, fail = 0;
const t = (n, f) => { try { f(); console.log(`  ok   ${n}`); pass++; } catch (e) { console.log(`  FAIL ${n}\n       ${e.message}`); fail++; } };
const H = (s) => console.log(`\n${s}`);

const SOUL = 'src/engine/src/core/donnaSoul.ts';
const DONNA = 'src/engine/src/core/donna.ts';
// The charter tip. PINNED, never HEAD — a floating base lets a later commit widen the
// delta and keep the boundary cell green (arc_m4 §4.1's tuition, f0550 №3's twice-paid).
const TIP = '612edfa';

const gitShow = (ref, rel) => execSync(`git show ${ref}:${rel}`, { cwd: ROOT }).toString();

// The paragraph under cure, isolated by its own opening and the heading that follows it.
function thirdPaper(src) {
  const a = src.indexOf('And there is a third paper');
  const b = src.indexOf('YOUR POLICY TO ARCHIVE');
  assert.ok(a > 0 && b > a, 'the third-paper paragraph could not be located — re-derive before trusting this bench');
  return src.slice(a, b);
}
// THE CLOSING PARAGRAPH, anchored correctly — and the anchor is a filed defect's cure.
// The first draft of §4 sliced from `src.indexOf('HOW YOU SPEAK TO HIM')`, which lands on
// the FILE HEADER's own line 21 ("The closing \"HOW YOU SPEAK TO HIM\" paragraph is left
// as-is this pass"), not on the heading inside the soul. The cell then read every quoted
// string in the whole soul and greened under a mutation that deleted the very exemplar it
// existed to guard. F-06.55's family, in this bench's own clothes: THE HEADER DESCRIBING
// THE PARAGRAPH SATISFIED THE CELL ABOUT THE PARAGRAPH. Anchored at a line start inside
// the template literal, and asserted unique so the anchor cannot silently drift again.
function closingParagraph(src) {
  const m = [...src.matchAll(/^HOW YOU SPEAK TO HIM/gm)];
  assert.strictEqual(m.length, 1, `the closing-paragraph anchor is not unique (${m.length} matches) — re-derive before trusting §4`);
  return src.slice(m[0].index);
}
const exemplarsOf = (src) => [...closingParagraph(src).matchAll(/"([^"]+)"/g)].map((x) => x[1]);

// Clause split on sentence terminals, keeping the terminals. Clause numbering follows the
// read-first's census, adopted in full as the ruling's boundary (CE ruling §1).
const clauses = (para) => para.replace(/\s+/g, ' ').trim().split(/(?<=[.?])\s+/);

// ════════════════════════════════════════════════════════════════════════════
H('§1 — THE RETIRED PROPOSITION IS GONE FROM THE STRING THE MODEL READS');

t('§1.1 the compiled soul no longer tells her the reach cannot date a thing', () => {
  const dist = P('src/engine/dist/core/donnaSoul.js');
  assert.ok(fs.existsSync(dist), 'engine dist absent — run npm run build:engine; this cell reads what the model reads');
  delete require.cache[require.resolve(dist)];
  const { DONNA_SOUL } = require(dist);
  // The retired IDEA, in the two shapes the paragraph carried it. Not the new wording.
  assert.ok(!/not a reach that hands you a clock/i.test(DONNA_SOUL),
    'the stale premise is back: she is told again that her reach cannot hand her a clock');
  assert.ok(!/this reach cannot say/i.test(DONNA_SOUL),
    'the stale conclusion is back: she is told again to answer the arrival question with an incapacity');
});

t('§1.2 the paragraph still refuses the tidy silence — the conclusion the cure was NARROWER than', () => {
  const para = thirdPaper(read(SOUL));
  // These survive by ruling. If a future rewrite takes them, the cure has eaten the
  // writing it existed to preserve. Asserted as PROPOSITIONS present at the charter tip,
  // compared against the charter tip itself — never as bytes this sitting chose.
  const base = thirdPaper(gitShow(TIP, SOUL));
  for (const keep of ['not a finding, it is a silence', 'never learns he decided', 'A gap you fill is a gap he will never know was there']) {
    assert.ok(base.includes(keep), `stale anchor — ${keep} is not at ${TIP}; re-derive this cell`);
    assert.ok(para.includes(keep), `the cure ate the paragraph's surviving reasoning: ${keep}`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
H('§2 — THE RULED BOUNDARY: CLAUSES 4 AND 6b MOVED, AND NOTHING ELSE DID');

t('§2.1 the paragraph has the same clause COUNT as the charter tip — nothing added, nothing merged', () => {
  assert.strictEqual(clauses(thirdPaper(read(SOUL))).length, clauses(thirdPaper(gitShow(TIP, SOUL))).length,
    'the clause count moved — the cure was ruled as two in-place replacements, not a re-author');
});

t('§2.2 EVERY clause except 4 and 6b is byte-identical to the charter tip (the CE ruling\'s boundary, mechanically)', () => {
  const now = clauses(thirdPaper(read(SOUL)));
  const was = clauses(thirdPaper(gitShow(TIP, SOUL)));
  // INDEX MAPPING, DERIVED AND DISCLOSED — the read-first's PROSE clause census and this
  // mechanical sentence split are NOT the same numbering, and the executor's first draft
  // of this cell conflated them (caught by its own RED, corrected here rather than by
  // loosening the cell). The paragraph splits into 14 sentences; the ruled boundary sits
  // at sentence 6 (the ask examples and the arrival clause share a sentence — clause 4)
  // and sentence 8 (clause 6a+6b share a sentence). Clause 5's guard is sentence 7.
  const MOVED = new Set([6, 8]); // 1-indexed SENTENCE positions, not prose-census clause numbers
  const drift = [];
  for (let i = 0; i < was.length; i++) {
    if (MOVED.has(i + 1)) continue;
    if (now[i] !== was[i]) drift.push(`#${i + 1}: ${JSON.stringify(was[i].slice(0, 60))} -> ${JSON.stringify((now[i] || '').slice(0, 60))}`);
  }
  assert.deepStrictEqual(drift, [], `clauses outside the ruled boundary moved:\n       ${drift.join('\n       ')}`);
});

t('§2.3 clause 5 — the undated guard — is byte-untouched BY RULING, and still follows the arrival clause', () => {
  const para = thirdPaper(read(SOUL));
  const guard = 'Where the paper carries no date, you do not supply one from the shape of the list.';
  assert.ok(thirdPaper(gitShow(TIP, SOUL)).includes(guard), `stale anchor — clause 5 is not at ${TIP}`);
  assert.ok(para.includes(guard), 'clause 5 was touched — the undated world is still real and its guard was ruled untouchable');
  // It is the NEXT sentence after the arrival clause, not orphaned somewhere else: the
  // property the founder's re-draft was required to preserve (the two read as one motion).
  const cs = clauses(para);
  const gi = cs.findIndex((c) => c.startsWith('Where the paper carries no date'));
  const ai = cs.findIndex((c) => /you read the hour a thing arrived/.test(c));
  assert.ok(ai >= 0, 'the arrival clause is gone from the paragraph');
  assert.strictEqual(gi, ai + 1,
    `clause 5's guard no longer immediately follows the arrival clause (arrival at sentence ${ai + 1}, guard at ${gi + 1}) — the founder's re-draft property was that the two read as ONE motion, the second being the first's honest limit`);
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — THE CONTRACT: BREVITY KEPT, THE STAMP EXEMPTED (Fork 2B)');

t('§3.1 the brevity ceiling still stands in the REAL static prefix — 2A was refused, brevity is load-bearing honesty', () => {
  const dist = P('src/engine/dist/core/donna.js');
  assert.ok(fs.existsSync(dist), 'engine dist absent — run npm run build:engine');
  const js = fs.readFileSync(dist, 'utf8');
  assert.ok(/one or two plain lines/.test(js), 'the ceiling was lifted — Fork 2A was REFUSED; :64\'s own reason (a long answer is where a person buries what they are unsure of) is spent');
});

t('§3.2 the ceiling is QUALIFIED, not absolute — its sentence does not end at the line count', () => {
  const src = read(DONNA);
  const m = src.match(/one or two plain lines([^"]*)/);
  assert.ok(m, 'the ceiling sentence could not be located — re-derive');
  // PROPERTY, not wording: at the charter tip the ceiling terminated immediately ("plain
  // lines."). It must no longer. What the qualification SAYS is the founder's, not this
  // bench's business.
  assert.ok(/one or two plain lines\./.test(gitShow(TIP, DONNA)), `stale anchor — the ceiling was not terminal at ${TIP}`);
  assert.ok(!/one or two plain lines\./.test(src),
    'the ceiling is absolute again — a faithful dated relay is forbidden by the contract while the soul commands it (the two-sentences-that-cannot-both-hold defect, restored)');
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — THE DONOR: THE WORKED EXAMPLES STOPPED TEACHING DATELESS (F-06.79 / CE-78)');

t('§4.1 the closing paragraph\'s exemplar set carries a DATE-BEARING member (shape, never the literal)', () => {
  const exemplars = exemplarsOf(read(SOUL));
  assert.ok(exemplars.length >= 4, `the exemplar set lost a member: ${JSON.stringify(exemplars)}`);
  // A date SHAPE — a weekday, a relative day, or a stamp-like token. Any of them proves
  // the set no longer teaches that a true line is a dateless line.
  const DATE_SHAPE = /\b(yesterday|today|this morning|last night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b|\b\d{2}-\d{2}-\d{2}\b/i;
  assert.ok(exemplars.some((e) => DATE_SHAPE.test(e)),
    `no exemplar carries an arrival — three dateless worked examples outrank a carry-law in a cached prefix (CE-78's donor lesson): ${JSON.stringify(exemplars)}`);
});

t('§4.2 the three standing exemplars survive — F-06.79 was an EXTENSION, and the :21-:22 sweep stays declined as scope creep', () => {
  const src = read(SOUL);
  for (const keep of ['rent logged', 'invoice noted, not yet paid', "two clients named Rhea, can't tell which."]) {
    assert.ok(src.includes(keep), `a standing exemplar was rewritten — this sitting was chartered to EXTEND the set, never to sweep it: ${keep}`);
  }
});

t('§4.3 no exemplar sits one word from the phrase clause 7 forbids (the withdrawn draft, benched so it cannot return)', () => {
  const exemplars = exemplarsOf(read(SOUL));
  assert.ok(!exemplars.some((e) => /\bnothing (new|since)\b/i.test(e)),
    'an exemplar teaches the tidy silence the paragraph exists to forbid — AN EXEMPLAR IS A DONOR');
});

// ════════════════════════════════════════════════════════════════════════════
H('§5 — F-06.85\'s OWN FLOOR: THE CONDITIONED SENTENCE NAMES ITS MECHANISM');

t('§5.1 donnaSoul names arrivalStamp in-comment — without this, the law minted here rots the way :50 did', () => {
  const src = read(SOUL);
  const head = src.slice(0, src.indexOf('export const DONNA_SOUL'));
  assert.ok(/arrivalStamp/.test(head),
    'F-06.85 BREACH: the paragraph is conditioned on a mechanism the file does not name, so the mechanism\'s next sitting has nothing pointing here — the exact silence that produced F-06.81');
  assert.ok(/today\.ts/.test(head), 'the mechanism is named without its home — a reader cannot find it');
});

t('§5.2 the named mechanism is REAL and still stamps — a comment naming a dead function is worse than none', () => {
  const today = read('src/engine/src/core/today.ts');
  assert.ok(/export function arrivalStamp\(/.test(today),
    'arrivalStamp is gone or renamed — F-06.85 fires: RE-READ clauses 4 and 6b of the third-paper paragraph, and clause 5 with them, BEFORE shipping');
});

// ════════════════════════════════════════════════════════════════════════════
// LABELED FLOOR AMENDMENT · F-06.98 DISCHARGED + F-06.85 EXTENDED (CE R-3,
// 2026-07-28; founder-ruled 「 fold it 」). Counts DISCLOSED, not preserved:
// §5.3–§5.5 are new. The fold is TWO comment blocks in donnaSoul's header — the
// reverse pointer owed to the temperature-of-the-week law, and the F-06.85
// block extended with the re-pointed site cites plus F-06.84's cross-reference.
// W-1's letter is honored by THIS CELL; its spirit by the zero bytes.
H('§5b — THE FOLD COST ZERO MODEL-VISIBLE BYTES (F-06.98 · W-1)');

// The soul is a single template literal with NO interpolation, so the string the
// model reads is the literal's body verbatim. That makes byte-identity provable
// on both sides at once: source against the fold's base, and source against the
// compiled artefact the loop actually hands to the model.
const FOLD_BASE = '76f4376';
const soulLiteral = (src) => {
  const open = src.indexOf('export const DONNA_SOUL = `');
  assert.ok(open > 0, 'the soul literal could not be located — re-derive before trusting §5b');
  const start = open + 'export const DONNA_SOUL = `'.length;
  const end = src.indexOf('`;', start);
  assert.ok(end > start, 'the soul literal is unterminated — re-derive before trusting §5b');
  return src.slice(start, end);
};

t('§5.3 THE STRING IS BYTE-IDENTICAL TO THE FOLD BASE — the comments moved, the soul did not', () => {
  const now = soulLiteral(read(SOUL));
  const base = soulLiteral(gitShow(FOLD_BASE, SOUL));
  assert.strictEqual(now.length, base.length, `the soul changed length by ${now.length - base.length} bytes — a comment-only fold cannot do that`);
  assert.strictEqual(now, base, 'W-1 BREACH: the fold reached model-visible bytes');
});

t('§5.4 AND THE COMPILED ARTEFACT AGREES — what the model reads equals what the source holds', () => {
  const dist = P('src/engine/dist/core/donnaSoul.js');
  assert.ok(fs.existsSync(dist), 'engine dist absent — run npm run build; this cell reads what the model reads');
  delete require.cache[require.resolve(dist)];
  const { DONNA_SOUL } = require(dist);
  // The raw literal carries backslash escapes (\" inside the template), so it must be
  // EVALUATED before comparison — comparing raw source to a compiled string compares two
  // different things and would red on escapes alone. Safe to evaluate because the literal
  // has no interpolation, and that is ASSERTED rather than assumed: with any `${}` present
  // this cell would be executing the soul's own expressions instead of reading it.
  const raw = soulLiteral(read(SOUL));
  assert.ok(!raw.includes('${'),
    'the soul gained an interpolation — §5.4 no longer compares like for like; re-derive');
  // eslint-disable-next-line no-new-func
  const evaluated = new Function('return `' + raw + '`;')();
  assert.strictEqual(DONNA_SOUL, evaluated,
    'the compiled soul and the source literal have diverged — the build is stale or the fold reached the string');
});

t('§5.5 THE FOLD IS PRESENT AND POINTS AT LIVE MECHANISM — a pointer to a dead name is worse than none', () => {
  const head = read(SOUL).slice(0, read(SOUL).indexOf('export const DONNA_SOUL'));
  // F-06.98's half: the reverse pointer names the MOVEMENT clock, not merely arrival.
  assert.ok(/touchedStamp/.test(head), 'F-06.98 UNDISCHARGED: the temperature-of-the-week law names no movement mechanism');
  assert.ok(/updated_at/.test(head), 'the movement column is unnamed — a reader cannot find what the law depends on');
  const find = read('src/engine/src/core/tools/donnaFind.ts');
  assert.ok(/const touchedStamp = /.test(find),
    'touchedStamp is gone or renamed — F-06.98 fires: RE-READ the temperature-of-the-week law BEFORE shipping');
  assert.ok(/updated_at/.test(find) && /FIND_SELECT/.test(find),
    'the movement column left the select — the law promises recognition can answer "who is moving"; re-read it');
  // F-06.84's half: the clause-5 cross-reference, and the constant it points at.
  assert.ok(/F-06\.84/.test(head), 'the clause-5 cross-reference is gone — the arm and the clause can drift apart again');
  assert.ok(/HONEST_GAP_A_RE|Class-A/.test(head), 'the cross-reference names no constant — it points nowhere');
  assert.ok(/const HONEST_GAP_A_RE = /.test(read('scripts/b06_gauntlet.js')),
    'the Class-A constant is gone or renamed — F-06.84 fires: RE-READ clause 5 of the third-paper paragraph BEFORE shipping');
});

// ════════════════════════════════════════════════════════════════════════════
console.log(`\n${fail ? 'RED' : 'GREEN'} — b06_f0681_bench ${pass}/${pass + fail}`);
if (!fail) {
  console.log('       The paragraph says one thing again. What it says is the founder\'s;');
  console.log('       that it stops contradicting itself is this bench\'s.');
  console.log('       THE LIVE VERDICT IS OUTSTANDING: the next gauntlet run\'s');
  console.log('       DATES DROPPED / DATES CARRIED census is the only one this cure gets.');
}
process.exit(fail ? 1 : 0);
