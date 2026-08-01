#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b07_f0774_stripper_bench.js — F-07.74 ON THE MIRROR LANE
// TDW_STRIPPER_CANARY
//
// Runnable from ANY working directory (protocol §9). Paths resolve from
// __dirname, never from cwd.
//
//   node scripts/b07_f0774_stripper_bench.js
//
// ── WHY THIS BENCH EXISTS ────────────────────────────────────────────────────
// F-07.74 was found on dreamos-pwa: `.replace(/\/\*[\s\S]*?\*\//g, '')` treats
// the `/*` inside `accept="image/*"` as a comment open and deletes to the next
// real `*/`. SIX benches of THIS repo carried the same rule. Curing one repo of
// a two-repo class is the half-cure this block has refused all season, so the
// definition is pinned on both sides and §5 below is the pin.
//
// THE DISEASE NEVER BIT HERE — and that is a fact with an expiry date. No file
// under src/ carries `image/*` at 614e962. What src/ DOES carry is the OTHER
// half of the class, live: regex literals whose tail reads `*/`, which close an
// already-open real comment EARLY and leak comment prose into "code". §1 holds
// those two sites by name so the day one lands between a `/*` and its `*/`, this
// bench reddens instead of a cell convicting on an explanation.
//
// F-07.100 rode this sitting: b05_f056_otp_meta_bench.js carried the worst
// stripper shape in either repo — `/\/\/.*$/gm` with NO `(^|[^:])` guard, which
// deleted from the `//` of every `https://` to the end of that line, inside
// string literals and all, before running the naive block rule on top.
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { stripComments, NAIVE_RETIRED } = require('./lib/stripComments');

const ROOT = path.resolve(__dirname, '..');
const raw = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const code = (rel) => stripComments(raw(rel));

let pass = 0, fail = 0, skip = 0;
const t = (name, fn) => {
  try { fn(); pass++; console.log(`  PASS  ${name}`); }
  catch (e) { fail++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
};
const named_skip = (name, why) => { skip++; console.log(`  SKIP  ${name}\n        ${why}`); };
const section = (s) => console.log(`\n${s}`);

console.log('\n════════  F-07.74 — THE STRIPPER, MIRROR LANE  ════════');

// ═════════════════════════════════════════════════════════════════════════════
section('§0 · THE MECHANISM — the stripper driven directly, not through a source');
// ═════════════════════════════════════════════════════════════════════════════
const SPEC = 'const a = 1;\nconst input = { accept: "image/*" };\nconst KEEP_ME = 2;\n/* real */\nconst ALSO_KEEP = 3;\n';

t('§0.1 a mid-token /* opens nothing — live code after an accept="image/*" survives', () => {
  assert.ok(stripComments(SPEC).includes('KEEP_ME') && stripComments(SPEC).includes('ALSO_KEEP'),
    'the stripper swallowed live code from an accept="image/*" — F-07.74 reproduced');
});
t('§0.2 a real block comment is still removed', () => {
  assert.ok(!stripComments(SPEC).includes('real'));
});
t('§0.3 VACUITY TWIN — the RETIRED naive rule WOULD swallow that specimen', () => {
  assert.ok(!NAIVE_RETIRED(SPEC).includes('KEEP_ME'),
    'the naive rule no longer swallows — §0.1 would be vacuous and this bench would be lying');
});
t('§0.4 template-literal substitutions cannot open a block either', () => {
  assert.ok(stripComments('const x = `${y}/*z*/`;\nconst KEEP = 1;\n').includes('KEEP'));
});
t('§0.5 a `*/` inside a string cannot CLOSE a real comment early', () => {
  assert.ok(!stripComments('/* one\nconst LEAK = 1;\n*/\nconst KEEP = 2;\n').includes('LEAK'));
});
t('§0.6 line structure is preserved — stripped output stays line-stable', () => {
  assert.strictEqual(stripComments('/* a\nb\nc */\nX').split('\n').length, 4);
});
t('§0.7 F-07.100 — an unguarded line pass would have eaten this; the module does not', () => {
  const s = "const u = 'https://api.example.com/v2/thing';\nconst KEEP = 1;\n";
  assert.ok(stripComments(s).includes('api.example.com') && stripComments(s).includes('KEEP'),
    'the URL lost its tail — the guardless line pass has grown back');
});
t('§0.Z INVOCATION (F-07.99) — this bench really CALLS its stripper', () => {
  const self = stripComments(fs.readFileSync(__filename, 'utf8'));
  assert.ok((self.match(/\bcode\s*\(/g) || []).length >= 2);
});

// ═════════════════════════════════════════════════════════════════════════════
section('§1 · THE CLASS ON THIS REPO — the false-CLOSE half, held by name');
// ═════════════════════════════════════════════════════════════════════════════
// A regex literal ending `*/` closes an already-open real comment early. Two
// live sites at 614e962, both derived by the TS-lexer census, neither armed
// today (no real `/*` opens above them). Cells hold that boundary.
const FALSE_CLOSE = [
  ['src/engine/src/core/distill.ts', '```'],
  ['src/lib/imagePipeline.js', '```'],
];
for (const [rel, token] of FALSE_CLOSE) {
  t(`§1 ${rel.split('/').pop()} — the false-close fixture is still present (non-vacuity)`, () => {
    assert.ok(raw(rel).includes(token), 'the named fixture moved — re-derive the census before trusting §1');
  });
  t(`§1 ${rel.split('/').pop()} — and its live code survives stripping: the shape is NOT armed`, () => {
    const c = code(rel);
    assert.ok(/(module\.exports|export (async )?(function|const))/.test(c),
      'a regex tail closed a comment early and the file lost live code — the class landed here');
  });
}
t('§1.census no file under src/ carries an image/* — the pwa specimen has no twin here', () => {
  const walk = (d, out = []) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (!['node_modules', '.git', 'dist'].includes(e.name)) walk(p, out); }
      else if (/\.(js|mjs|cjs|ts|tsx)$/.test(e.name)) out.push(p);
    }
    return out;
  };
  const hits = walk(path.join(ROOT, 'src'))
    .filter(f => stripComments(fs.readFileSync(f, 'utf8')).includes('image/*'));
  assert.strictEqual(hits.length, 0,
    `an image/* landed in src/: ${hits.map(h => path.relative(ROOT, h)).join(', ')} — re-anchor this bench`);
});

// ═════════════════════════════════════════════════════════════════════════════
section('§2 · β — REAL COMMENTS ARE STILL REMOVED, with non-vacuity beside');
// ═════════════════════════════════════════════════════════════════════════════
const BETA = [['src/lib/whatsapp.js', 'sendWhatsApp']];
for (const [rel] of BETA) {
  t(`§2 ${rel.split('/').pop()} — stripping removes comment prose but not the code`, () => {
    const r = raw(rel), c = code(rel);
    assert.ok(c.length < r.length, 'the stripper is a no-op on this file');
    assert.ok(c.includes('module.exports'), 'the stripper ate the file\'s tail');
  });
}

// ═════════════════════════════════════════════════════════════════════════════
section('§3 · ONE DEFINITION, TWO REPOS — the cross-repo identity cell');
// ═════════════════════════════════════════════════════════════════════════════
// F-07.52 tried one-home-by-verbatim-port INSIDE one repo and the port was never
// wired (F-07.99). This class lives on both repos, so the definition is pinned on
// both. Sibling clone absent ⇒ LOUD NAMED SKIP, never a silent pass.
{
  const CANDIDATES = [
    '../dreamos-pwa/scripts/lib/stripComments.mjs',
    '../../dreamos-pwa/scripts/lib/stripComments.mjs',
  ];
  const found = CANDIDATES.map(p => path.resolve(ROOT, p)).find(p => fs.existsSync(p));
  if (!found) {
    named_skip('§3.1 cross-repo identity — dreamos-pwa sibling clone not present',
      'the twin definition could not be read from this checkout. The identity is UNPROVEN here; ' +
      'clone dreamos-pwa beside dream-os and re-run to prove it. A skip, counted and named — never a pass.');
  } else {
    const norm = (s) => (s.match(/while \(i < src\.length\)[\s\S]*?\n  return out;/) || [''])[0]
      .replace(/\s+/g, ' ').trim();
    t('§3.1 the two repos carry ONE definition, identical in mechanism', () => {
      const mine = norm(raw('scripts/lib/stripComments.js'));
      const theirs = norm(fs.readFileSync(found, 'utf8'));
      assert.ok(mine.length > 200, 'this repo\'s definition did not match the expected shape');
      assert.strictEqual(mine, theirs,
        'the estate has drifted into two definitions of "code" again — F-07.52\'s exact failure, one repo over');
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
section('§4 · COVERAGE IS DERIVED, NEVER LISTED (F-07.98)');
// ═════════════════════════════════════════════════════════════════════════════
// NOTE_16 §3 asserted "§0 canaries stand in every stripper-dependent proof". On
// the pwa side they stood in three, and BOTH benches actually exposed had none.
// A sentence in a note is not a coverage map. These lists are read off the
// directory and must match.
{
  const SCRIPTS = path.join(ROOT, 'scripts');
  const files = fs.readdirSync(SCRIPTS).filter(f => /_bench\.js$/.test(f));
  const readS = (f) => fs.readFileSync(path.join(SCRIPTS, f), 'utf8');
  // ROGUE CHECKS READ STRIPPED SOURCE. A bench that DESCRIBES the retired rule in
  // a comment is documenting it, not carrying it — F-06.85 requires the mechanism
  // be named in-comment, and a cell that convicts on that comment convicts the
  // documentation of the cure (F-07.89's exact lesson, one repo over).
  const codeS = (f) => stripComments(readS(f));
  const strippers = files.filter(f => /require\('\.\/lib\/stripComments'\)/.test(readS(f)));
  const canaried = files.filter(f => readS(f).includes('TDW_STRIPPER_CANARY'));
  const missing = strippers.filter(f => !canaried.includes(f));
  const orphan = canaried.filter(f => !strippers.includes(f));

  t(`§4.1 every bench importing the stripper carries a canary (${strippers.length} strippers, ${canaried.length} canaried)`, () => {
    assert.strictEqual(missing.length, 0, `uncanaried stripper-dependent benches: ${missing.join(', ')}`);
  });
  t('§4.2 and no bench claims a canary without importing the stripper', () => {
    assert.strictEqual(orphan.length, 0, `canary marker without a stripper: ${orphan.join(', ')}`);
  });
  t('§4.3 NOBODY else defines a stripper any more — one home, derived', () => {
    const rogue = files.filter(f => /replace\(\/\\\/\\\*\[\\s\\S\]\*\?\\\*\\\//.test(codeS(f)));
    assert.strictEqual(rogue.length, 0, `a copy of the naive rule has grown back in: ${rogue.join(', ')}`);
  });
  t('§4.4 every stripper-dependent bench proves its own CALL-SITE (F-07.99)', () => {
    const silent = strippers.filter(f => !/§0\.Z/.test(readS(f)));
    assert.strictEqual(silent.length, 0,
      `holds a stripper without proving it calls one: ${silent.join(', ')} — the shape that fooled this estate for a block`);
  });
  t('§4.5 the guardless line pass (F-07.100) is dead estate-wide in scripts/', () => {
    const rogue = files.filter(f => /replace\(\/\\\/\\\/\.\*\$\/gm/.test(codeS(f)));
    assert.strictEqual(rogue.length, 0, `unguarded line strip survives in: ${rogue.join(', ')}`);
  });
}

console.log(`\n${fail ? 'RED' : 'GREEN'} — b07_f0774_stripper_bench ${pass}/${pass + fail}${skip ? ` (${skip} NAMED SKIP)` : ''}`);
process.exit(fail ? 1 : 0);
