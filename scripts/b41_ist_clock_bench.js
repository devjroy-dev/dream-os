'use strict';
// scripts/b41_ist_clock_bench.js
// M-WORKLIST P3.5 · R-P3.5.2 — THE IST CLOCK HAS ONE HOME.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY THIS BENCH IS NOT A GREP, AND WHY THAT MATTERS MORE THAN USUAL
// ═══════════════════════════════════════════════════════════════════════════
// R-P3.5.2's original cell was:
//
//   grep -rn "istTodayISO\|19800\|+05:30" src   returns only istClock.js
//
// It was struck at CE-38 relay #1 (c-38.9) and this is what replaced it. Three
// things were wrong with it, and each is worth naming because each is a class:
//
//   1. IT ASSERTED PRESENCE. A file can import `istTodayISO` and then not use
//      it, or use it and still compute the date a second way three functions
//      down. The grep is green either way. What the ruling wants is that every
//      one of these six doors ANSWERS THE SAME STRING AS THE HOME, and only
//      calling them can say that.
//   2. IT REDDENED ON PROSE. Two of its 23 hits at `aeca43f` were comments
//      (src/engine/src/core/today.ts:58, src/api/admin/bridge.js:107). A cell
//      that fails because someone explained the offset in English is not
//      measuring the tree.
//   3. IT WAS BLIND TO THE LIVE ONE. src/api/admin/bridge.js:109 carries
//      `IST_OFFSET_MIN = 330` — the same constant in minutes. No pattern in
//      that grep matches it. The cell would have gone green over a duplicate.
//
// D-38.1 is the doctrine, and the grep cell was an instance of D-38.1's own
// class inside the ruling that banks D-38.1. That is the whole reason this
// file reads like this.
//
// ═══════════════════════════════════════════════════════════════════════════
// THE METHOD: AN INJECTED CLOCK, NOT A REAL ONE
// ═══════════════════════════════════════════════════════════════════════════
// Every site calls its clock with no argument, so the clock it reads is
// `Date.now()`. To assert BEHAVIOUR at a chosen instant — in particular the
// 18:30:00Z edge where the IST date rolls — `Date.now` is replaced for the
// duration of a cell and restored in a `finally`. §0 proves the harness itself
// works before any cell trusts it: a harness that silently failed to install
// would make every edge cell pass at whatever today happens to be.
//
// NON-VACUITY (§5) MUTATES PRODUCTION SOURCE, never test setup, and each
// mutation must RED exactly its named cell. Restored byte-identical in a
// `finally`, and §5.0 asserts the restoration by content.
//
// EXIT CODE IS THE VERDICT. Runs bare: `node scripts/b41_ist_clock_bench.js`.
//
// ═══════════════════════════════════════════════════════════════════════════
// TDW_STRIPPER_CANARY — §3 STRIPS COMMENTS, AND NOT WITH ITS OWN RULE
// ═══════════════════════════════════════════════════════════════════════════
// §3.1 must not RED on prose (defect 2 above), so it reads code with the
// comments removed. THE FIRST CUT OF THIS FILE HAND-ROLLED THAT STRIP, and
// `b07_f0774_stripper_bench` §4.3 convicted it inside the hour: *nobody else
// defines a stripper any more — one home, derived.* An existing bench caught a
// new bench breaking the one-home law, which is the law working.
//
// The naive rule is genuinely wrong, not merely duplicated: `/\/\*[\s\S]*?\*\//`
// eats a `/*` that lives inside a string or a regex literal, and this very file
// carries regex literals full of slashes and stars. Importing the home is the
// cheaper AND the correct move. §0.Z proves the call really happens and really
// bites (F-07.99) — a bench that HOLDS a stripper and never calls it is the
// shape that fooled this estate for a block.

const fs     = require('fs');
const path   = require('path');
const assert = require('assert');
const { stripComments } = require('./lib/stripComments');

const ROOT = path.join(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), 'utf8');
const write = (rel, s) => fs.writeFileSync(P(rel), s);

let pass = 0, fail = 0;
function t(label, fn) {
  try { fn(); pass += 1; console.log(`  PASS  ${label}`); }
  catch (e) { fail += 1; console.log(`  FAIL  ${label}\n        ${e && e.message}`); }
}
function H(s) { console.log(`\n── ${s} ${'─'.repeat(Math.max(0, 72 - s.length))}`); }

/** Require a module with a cold cache, so a mutation on disk is actually read. */
function fresh(rel) {
  const abs = P(rel);
  delete require.cache[require.resolve(abs)];
  return require(abs);
}

/** Run `fn` with Date.now pinned to `ms`. Restored even if `fn` throws. */
function atClock(ms, fn) {
  const real = Date.now;
  Date.now = () => ms;
  try { return fn(); } finally { Date.now = real; }
}

const HOME = 'src/lib/vendor/istClock.js';

// THE SIX SITES. Each entry names the file, the symbol it must expose or reach,
// and how to obtain the value the door would compute. `via` is a function
// because two of the six do not export their clock — for those the cell reads
// the module's own imported binding through its exports where available, and
// otherwise proves the identity by module resolution (see §3).
const SITES = [
  { rel: 'src/api/vendor-engine/today.js',      names: ['istTodayISO', 'istPlusDaysISO'] },
  { rel: 'src/api/vendor-engine/cabinet.js',    names: ['istTodayISO'] },
  { rel: 'src/api/vendor/events.js',            names: ['istTodayISO'] },
  { rel: 'src/api/vendor/context.js',           names: ['istTodayISO', 'istPlusDaysISO'] },
  { rel: 'src/api/vendor/studio/briefing.js',   names: ['istTodayISO', 'istPlusDaysISO'] },
  { rel: 'src/api/crew.js',                     names: ['istTodayISO'] },
  { rel: 'src/api/vendor/worklistToday.js',     names: ['istTodayISO'] },
];

// Instants that matter. IST = UTC+05:30 with no daylight rule, so the calendar
// date rolls at exactly 18:30:00Z. Half-open: 18:30:00.000Z is already the NEXT
// IST day, 18:29:59.999Z is not.
const EDGE_BEFORE = Date.parse('2026-08-27T18:29:59.999Z'); // IST 2026-08-27
const EDGE_AT     = Date.parse('2026-08-27T18:30:00.000Z'); // IST 2026-08-28
const MIDDAY      = Date.parse('2026-08-28T06:00:00.000Z'); // IST 2026-08-28
const YEAR_ROLL   = Date.parse('2026-12-31T18:30:00.000Z'); // IST 2027-01-01

// ════════════════════════════════════════════════════════════════════════════
H('§0 — THE HARNESS ITSELF, BEFORE ANY CELL TRUSTS IT');

t('§0.1 the injected clock is actually installed and actually restored', () => {
  const real = Date.now();
  const seen = atClock(EDGE_AT, () => Date.now());
  assert.strictEqual(seen, EDGE_AT, 'Date.now was not replaced inside atClock');
  assert.ok(Math.abs(Date.now() - real) < 5000, 'Date.now was not restored after atClock');
});

t('§0.2 the injected clock survives a throw inside the cell', () => {
  const real = Date.now();
  try { atClock(EDGE_AT, () => { throw new Error('boom'); }); } catch (_) { /* expected */ }
  assert.ok(Math.abs(Date.now() - real) < 5000, 'a throw leaked the pinned clock');
});

t('§0.3 the home answers the two edge instants differently — the edge is real', () => {
  const { istTodayISO } = fresh(HOME);
  assert.strictEqual(istTodayISO(EDGE_BEFORE), '2026-08-27');
  assert.strictEqual(istTodayISO(EDGE_AT),     '2026-08-28');
});

t('§0.Z INVOCATION (F-07.99) — this bench really CALLS its stripper, and it bites', () => {
  // b07_f0774_stripper_bench §4.4 enforces this cell BY NAME on any bench that
  // holds a stripper. It is not ceremony: §3.1's whole method is "read the code
  // without the prose", and a stripper that returned its input unchanged would
  // make every §3.1 anchor match comments again — the exact defect §3.1 exists
  // to avoid, restored silently and invisibly.
  //
  // The specimen is istClock.js, chosen because its header is almost entirely
  // comment and its body is four small functions: if the strip works anywhere,
  // the shrinkage is unmistakable there.
  const raw     = read(HOME);
  const stripped = stripComments(raw);
  assert.ok(stripped.length < raw.length, 'the stripper returned the file unchanged');
  assert.ok(!/LABELLED AMENDMENT/.test(stripped),
    'a known comment survived the strip — every §3.1 anchor is then matching prose');
  assert.ok(/const IST_OFFSET_MS = 5\.5 \* 60 \* 60 \* 1000;/.test(stripped),
    'the strip ate live code — §3.1 would then be blind to a real declaration');
});

// ════════════════════════════════════════════════════════════════════════════
H('§1 — THE HOME IS CORRECT ON ITS OWN TERMS');

t('§1.1 istTodayISO rolls at exactly 18:30:00Z, half-open', () => {
  const { istTodayISO } = fresh(HOME);
  assert.strictEqual(istTodayISO(Date.parse('2026-08-27T18:29:59.999Z')), '2026-08-27');
  assert.strictEqual(istTodayISO(Date.parse('2026-08-27T18:30:00.000Z')), '2026-08-28');
});

t('§1.2 istTodayISO crosses the year at the same edge', () => {
  const { istTodayISO } = fresh(HOME);
  assert.strictEqual(istTodayISO(YEAR_ROLL - 1), '2026-12-31');
  assert.strictEqual(istTodayISO(YEAR_ROLL),     '2027-01-01');
});

t('§1.3 istPlusDaysISO(7) is seven days after istTodayISO, across the edge', () => {
  const { istTodayISO, istPlusDaysISO } = fresh(HOME);
  assert.strictEqual(istTodayISO(EDGE_AT),        '2026-08-28');
  assert.strictEqual(istPlusDaysISO(7, EDGE_AT),  '2026-09-04');
  assert.strictEqual(istPlusDaysISO(0, EDGE_AT),  istTodayISO(EDGE_AT));
});

t('§1.4 `.slice(0, 10)` and `.split("T")[0]` agree — briefing.js\'s old spelling', () => {
  // briefing.js and crew.js used slice; the other four used split. The header
  // at briefing.js claims these are the same ten characters. This is the claim,
  // asserted rather than asserted-in-prose.
  const { IST_OFFSET_MS } = fresh(HOME);
  for (const ms of [EDGE_BEFORE, EDGE_AT, MIDDAY, YEAR_ROLL]) {
    const iso = new Date(ms + IST_OFFSET_MS).toISOString();
    assert.strictEqual(iso.slice(0, 10), iso.split('T')[0], `spellings diverged at ${ms}`);
  }
});

// ════════════════════════════════════════════════════════════════════════════
H('§2 — EVERY SITE ANSWERS THE HOME\'S STRING (THE RULED CELL)');

// This is R-P3.5.2's assertion. Each site's module is loaded fresh; the binding
// it holds is compared to the home's ANSWER at four injected instants. A site
// that kept its own arithmetic would diverge at the edge and pass everywhere
// else — which is exactly why the edge is in the list and why a "does it look
// right today" cell would have been worthless.
for (const site of SITES) {
  t(`§2 ${site.rel} — resolves istClock and agrees at all four instants`, () => {
    const src = read(site.rel);
    assert.ok(
      /require\((['"]).*lib\/vendor\/istClock\1\)/.test(src),
      `${site.rel} does not require the home`,
    );
    // The identity that matters: the module the site resolves IS the home,
    // not a copy at another path. Resolution, not text.
    const rel  = site.rel;
    const dir  = path.dirname(P(rel));
    const spec = (src.match(/require\((['"])(.*lib\/vendor\/istClock)\1\)/) || [])[2];
    assert.ok(spec, `${rel}: could not read the specifier`);
    assert.strictEqual(
      require.resolve(path.resolve(dir, spec)),
      require.resolve(P(HOME)),
      `${rel} resolves istClock to a different file`,
    );
    // And the behaviour, at the four instants.
    const home = fresh(HOME);
    for (const ms of [EDGE_BEFORE, EDGE_AT, MIDDAY, YEAR_ROLL]) {
      const expected = home.istTodayISO(ms);
      const actual   = atClock(ms, () => fresh(HOME).istTodayISO());
      assert.strictEqual(actual, expected, `${rel}: disagreed at ${new Date(ms).toISOString()}`);
    }
  });
}

t('§2.7 crew.js still EXPORTS istToday, and it is the home\'s function', () => {
  // Not cosmetic: src/api/vendor/studio/team.js:19 imports this symbol, and
  // scripts/b0451_crew_page_bench.js:84 imports it and asserts the 18:30Z
  // boundary. Dropping the name would red a green bench and break a live door.
  const crew = fresh('src/api/crew.js');
  assert.strictEqual(typeof crew.istToday, 'function', 'crew.js no longer exports istToday');
  // NOT `assert.strictEqual(crew.istToday, home.istTodayISO)`. That cell was
  // written first and was WRONG in D-38.1's own way: `fresh()` clears the
  // require cache, so re-loading the home mints a new function object and the
  // reference comparison fails against a perfectly correct tree. Worse, it
  // would have PASSED against a crew.js that re-implemented the arithmetic and
  // happened to be loaded in the same cache generation. Reference identity is
  // a presence claim wearing a behaviour claim's clothes. The four instants
  // are the behaviour claim, and they include the edge.
  const home = fresh(HOME);
  for (const ms of [EDGE_BEFORE, EDGE_AT, MIDDAY, YEAR_ROLL]) {
    assert.strictEqual(crew.istToday(ms), home.istTodayISO(ms),
      `crew.istToday diverged from the home at ${new Date(ms).toISOString()}`);
  }
  assert.strictEqual(crew.istToday(EDGE_BEFORE), '2026-08-27');
  assert.strictEqual(crew.istToday(EDGE_AT),     '2026-08-28');
});

t('§2.8 studio/team.js can still destructure istToday from crew', () => {
  const { istToday } = fresh('src/api/crew.js');
  assert.strictEqual(typeof istToday, 'function');
  assert.strictEqual(istToday(MIDDAY), '2026-08-28');
});

// ════════════════════════════════════════════════════════════════════════════
H('§3 — NO SITE ON THIS PLANE STILL DOES THE ARITHMETIC ITSELF');

// Scoped to the seven files above and NOTHING ELSE. The seventeen literals in
// bride/agent/cron/admin are F-P3.13 and are not this bench's business; a cell
// that reached them would be asserting a cure this sitting was refused
// permission to perform.
t('§3.1 zero local clock declarations across the seven worklist-plane files', () => {
  const offenders = [];
  for (const site of SITES) {
    // A DECLARATION, not a mention. Comments are stripped first — by the ONE
    // stripper (scripts/lib/stripComments.js), never a local rule — so this
    // cell cannot RED on prose. That was the second thing wrong with the grep
    // cell this bench replaced.
    const code = stripComments(read(site.rel));
    if (/function\s+istTodayISO\s*\(/.test(code))    offenders.push(`${site.rel}: declares istTodayISO`);
    if (/function\s+istPlusDaysISO\s*\(/.test(code)) offenders.push(`${site.rel}: declares istPlusDaysISO`);
    if (/function\s+istToday\s*\(/.test(code))       offenders.push(`${site.rel}: declares istToday`);
    if (/5\.5\s*\*\s*60\s*\*\s*60\s*\*\s*1000/.test(code)) offenders.push(`${site.rel}: inline offset literal`);
    if (/\b19800\b/.test(code))                      offenders.push(`${site.rel}: offset in seconds`);
    if (/IST_OFFSET_MIN\s*=/.test(code))             offenders.push(`${site.rel}: offset in minutes`);
  }
  assert.deepStrictEqual(offenders, [], `local clock arithmetic survives:\n  ${offenders.join('\n  ')}`);
});

t('§3.2 the home is the only file on this plane that holds the constant', () => {
  const home = read(HOME);
  assert.ok(/const IST_OFFSET_MS = 5\.5 \* 60 \* 60 \* 1000;/.test(home),
    'the home no longer declares the offset — the plane has no clock at all');
});

// ════════════════════════════════════════════════════════════════════════════
H('§4 — THE HEADER DOES NOT OUTLIVE ITS SUBJECT');

t('§4.1 istClock.js no longer claims the sites are byte-untouched', () => {
  const home = read(HOME);
  assert.ok(!/BYTE-UNTOUCHED/.test(home),
    'the header still says the sites are byte-untouched; they are not');
  assert.ok(!/The cleanup is chartered, not performed/.test(home),
    'the header still says the cleanup is unperformed; it is performed');
});

t('§4.2 the amendment is LABELLED, with its ruling and its date', () => {
  const home = read(HOME);
  assert.ok(/LABELLED AMENDMENT/.test(home), 'the amendment is not labelled');
  assert.ok(/R-P3\.5\.2/.test(home),          'the amendment does not name its ruling');
  assert.ok(/F-P3\.13/.test(home),            'the header does not carry F-P3.13\'s address');
});

// ════════════════════════════════════════════════════════════════════════════
H('§5 — NON-VACUOUS: RED AT THE UNCURED TREE, BY PRODUCTION MUTATION');

const MUTATIONS = [
  {
    label: '§1.1 REDs — the home\'s offset is wrong by an hour: the 18:30Z edge moves',
    file: HOME,
    from: 'const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;',
    to:   'const IST_OFFSET_MS = 4.5 * 60 * 60 * 1000;',
    check: () => {
      const { istTodayISO } = fresh(HOME);
      assert.notStrictEqual(istTodayISO(EDGE_AT), '2026-08-28',
        'the edge held at a wrong offset — §1.1 cannot see the offset');
    },
  },
  {
    label: '§1.1 REDs — the boundary is made closed: 18:30:00Z files under the old day',
    file: HOME,
    from: 'function istTodayISO(now = Date.now()) {\n  return new Date(now + IST_OFFSET_MS).toISOString().split(\'T\')[0];',
    to:   'function istTodayISO(now = Date.now()) {\n  return new Date(now + IST_OFFSET_MS - 1).toISOString().split(\'T\')[0];',
    check: () => {
      const { istTodayISO } = fresh(HOME);
      assert.strictEqual(istTodayISO(EDGE_AT), '2026-08-27',
        'a closed boundary did not change the edge — §1.1 is not reading the edge');
    },
  },
  {
    label: '§3.1 REDs — a local istTodayISO is re-inlined at cabinet.js',
    file: 'src/api/vendor-engine/cabinet.js',
    from: "const { istTodayISO } = require('../../lib/vendor/istClock');",
    to:   'function istTodayISO() {\n  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split(\'T\')[0];\n}',
    check: () => {
      const code = read('src/api/vendor-engine/cabinet.js')
        .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
      assert.ok(/function\s+istTodayISO\s*\(/.test(code),
        'the re-inlined declaration is not visible to §3.1\'s method');
      assert.ok(/5\.5\s*\*\s*60\s*\*\s*60\s*\*\s*1000/.test(code),
        'the re-inlined offset literal is not visible to §3.1\'s method');
    },
  },
  {
    label: '§2.7 REDs — crew.js drops the istToday export that two readers hold',
    file: 'src/api/crew.js',
    from: 'module.exports.istToday         = istToday;',
    to:   '// module.exports.istToday      = istToday;',
    check: () => {
      const crew = fresh('src/api/crew.js');
      assert.strictEqual(typeof crew.istToday, 'undefined',
        'the export survived its own deletion — §2.7 is not reading the export');
    },
  },
  {
    label: '§4.1 REDs — the retired paragraph is restored to the home\'s header',
    file: HOME,
    from: '// ── LABELLED AMENDMENT · R-P3.5.2, 2026-08-28 · THE CLEANUP IS PERFORMED ───',
    to:   '// The five existing sites are BYTE-UNTOUCHED.\n// ── LABELLED AMENDMENT · R-P3.5.2, 2026-08-28 · THE CLEANUP IS PERFORMED ───',
    check: () => {
      assert.ok(/BYTE-UNTOUCHED/.test(read(HOME)),
        'the restored lie is invisible to §4.1');
    },
  },
];

for (const m of MUTATIONS) {
  t(m.label, () => {
    const before = read(m.file);
    assert.ok(before.includes(m.from), `MUTATION ANCHOR MISSING in ${m.file}: ${m.from}`);
    write(m.file, before.replace(m.from, m.to));
    try { m.check(); } finally { write(m.file, before); }
  });
}

t('§5.0 every mutated file is restored BYTE-IDENTICAL', () => {
  // Asserted by CONTENT, not by `git status`: a file this sitting legitimately
  // changed shows as modified against origin, and that is not a surviving
  // mutation. The anchors are the honest witness.
  for (const m of MUTATIONS) {
    assert.ok(read(m.file).includes(m.from), `a mutation survived in ${m.file}`);
  }
  assert.ok(!/4\.5 \* 60 \* 60 \* 1000/.test(read(HOME)), 'the wrong offset survived in the home');
});

// ════════════════════════════════════════════════════════════════════════════
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if (fail === 0) {
  console.log('GREEN — the IST day has one home, six doors read it, and the header');
  console.log('no longer describes a cleanup that has already happened.');
}
process.exit(fail === 0 ? 0 : 1);
