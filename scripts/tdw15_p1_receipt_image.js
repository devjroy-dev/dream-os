#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/tdw15_p1_receipt_image.js
// TDW_15 · P1 · β1 (R-34.7) — THE BRIDE FILES A RECEIPT PHOTO FROM HER APP.
//
// Runnable from ANY working directory (§9). Paths resolve from __dirname.
//
//   node scripts/tdw15_p1_receipt_image.js
//
// ── WHAT THIS DELIVERY IS, AND THEREFORE WHAT THIS BENCH MAY CLAIM ─────────
// The load-bearing claims are NOT "a route exists". They are:
//
//   · the door writes `image_url`, which NO http path could do before it;
//   · it does NOT reach the muse pipeline, because R-34.7 refused OCR and
//     refused paying two model calls to tag a caterer's invoice;
//   · the upload lands BEFORE the row, so a failure leaves nothing behind;
//   · the authenticated `couple_id` cannot be overridden by the body;
//   · the typed fields have ONE home, and extracting them changed no behaviour.
//
// Every cell is written to one of those. Cells that could pass over a door
// nobody can reach are marked and paired with a mutation.
//
// ── THE MUTATIONS BREAK PRODUCTION CODE, NEVER BENCH SETUP (R-33.4) ────────
// Every anchor below is verified UNIQUE in the final tree before it is used,
// and every restore is sha256-verified. A bench that mutates its own fixture
// proves nothing; a bench that cannot restore what it broke is worse than none.
'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC  = (p) => path.join(ROOT, p);
const read = (p) => fs.readFileSync(SRC(p), 'utf8');
const sha  = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Comments stripped before EVERY source assertion (the comment-blindness law).
// A cell that reads a comment is not a cell — and this file's subjects carry
// long comment blocks that name the very identifiers the cells look for.
const code = (p) => read(p)
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');

const RECEIPTS = 'src/api/couple/receipts.js';
const PIPELINE = 'src/lib/imagePipeline.js';
const EXPENSES = 'src/api/couple/expenses.js';
const CORE     = 'src/api/couple/core.js';

let pass = 0, fail = 0;
const fails = [];
function t(name, fn) {
  try { fn(); pass++; console.log(`  ok   ${name}`); }
  catch (e) { fail++; fails.push(name); console.log(`  FAIL ${name}\n         ${e.message}`); }
}
function H(h) { console.log(`\n${h}`); }

// The slice of receipts.js that is the image handler alone. Bounded, because an
// unbounded assertion over the whole file passes on any sibling's bytes — the
// D-4c §5 error, paid for once already and not repeated here.
function imageHandler() {
  const c = code(RECEIPTS);
  const start = c.indexOf("router.post('/:coupleId/image'");
  assert.ok(start > -1, 'the image door is absent from the tree');
  const rest = c.slice(start + 10);
  const nextRoute = rest.search(/router\.(get|post|patch|delete)\(/);
  return nextRoute === -1 ? c.slice(start) : c.slice(start, start + 10 + nextRoute);
}

// THE ARGUMENT TEXT OF A CALL, PAREN-BALANCED. Written after a regex of the
// shape /fn\(\s*\{([^}]*)\}/ silently truncated at the `{}` inside
// `...(req.body || {})` and reported the security cell RED on correct code.
// A brace-naive matcher cannot read an argument list containing braces.
function argsOf(hay, callee) {
  const at = hay.indexOf(callee);
  if (at === -1) return null;
  let i = at + callee.length - 1, depth = 0;
  for (; i < hay.length; i++) {
    if (hay[i] === '(') depth++;
    else if (hay[i] === ')') { depth--; if (depth === 0) break; }
  }
  return hay.slice(at + callee.length, i);
}

function typedHandler() {
  const c = code(RECEIPTS);
  const start = c.indexOf("router.post('/:coupleId'");
  assert.ok(start > -1, 'the typed POST is absent from the tree');
  const rest = c.slice(start + 10);
  const nextRoute = rest.search(/router\.(get|post|patch|delete)\(/);
  return nextRoute === -1 ? c.slice(start) : c.slice(start, start + 10 + nextRoute);
}

// ═══════════════════════════════════════════════════════════════════════════
H('══ §1 · THE EXPORT — R-34.7\'s one granted line ══');

t('1.1 uploadBufferToCloudinary is exported from imagePipeline',
  () => assert.ok(/module\.exports\s*=\s*\{[\s\S]*\buploadBufferToCloudinary\b[\s\S]*\}/.test(code(PIPELINE))));

t('1.2 it is REACHABLE, not merely named — require() resolves it to a function',
  () => {
    const mod = require(SRC(PIPELINE));
    assert.strictEqual(typeof mod.uploadBufferToCloudinary, 'function',
      'exported by name but not resolvable — the export list and the binding disagree');
  });

t('1.3 processImageForMuse still exports — the additive claim is additive',
  () => {
    const mod = require(SRC(PIPELINE));
    assert.strictEqual(typeof mod.processImageForMuse, 'function');
  });

// ═══════════════════════════════════════════════════════════════════════════
H('══ §2 · THE DOOR — the gap G-3 named, closed ══');

t('2.1 the image door exists at POST /:coupleId/image',
  () => assert.ok(/router\.post\(\s*'\/:coupleId\/image'/.test(code(RECEIPTS))));

t('2.2 it WRITES image_url — the column no http path could write before it',
  () => assert.ok(/\brow\.image_url\s*=\s*uploaded\.secure_url\b/.test(imageHandler())));

t('2.3 …into couple_receipts, the settled expense vault',
  () => assert.ok(/\.from\('couple_receipts'\)[\s\S]{0,200}\.insert\(row\)/.test(imageHandler())));

t('2.4 the response is shape-identical to its two siblings (one column literal)',
  () => {
    const c = code(RECEIPTS);
    assert.ok(/const RECEIPT_COLUMNS\s*=/.test(c), 'the shared column literal is gone');
    assert.ok(/\.select\(RECEIPT_COLUMNS\)/.test(imageHandler()),
      'the image door hand-lists its columns instead of using the one home');
  });

// THE ABSENCE THIS DELIVERY EXISTS TO END. Bounded to the two http files: the
// radius is the couple HTTP plane, NEVER the estate — brideEngine legitimately
// writes this column and convicting it would be R-33.3's violation.
// The claim is about the WRITE, not the read: the typed POST legitimately
// SELECTS image_url back (a receipt filed by WhatsApp has one). What it must
// never do is assign one — that is the door this delivery added.
t('2.5 control — the typed POST assigns no image_url, and neither does the builder',
  () => {
    assert.ok(!/image_url\s*[:=][^=]/.test(typedHandler()),
      'the typed POST gained an image_url write');
    const b = argsOf(code(RECEIPTS), 'function buildReceiptRow(');
    assert.ok(b !== null && !/image_url/.test(
      code(RECEIPTS).slice(code(RECEIPTS).indexOf('function buildReceiptRow('),
                           code(RECEIPTS).indexOf('router.get('))),
      'the shared builder writes image_url — then EVERY door would');
  });

t('2.6 control — couple/expenses.js still nulls it explicitly',
  () => assert.ok(/image_url:\s*null/.test(code(EXPENSES))));

// ═══════════════════════════════════════════════════════════════════════════
H('══ §3 · SECURITY — the authenticated couple, and the spread that could lose it ══');

t('3.1 the door refuses a coupleId that is not the caller\'s',
  () => assert.ok(/req\.params\.coupleId\s*!==\s*couple_id[\s\S]{0,80}403/.test(imageHandler())));

t('3.2 couple_id is spread LAST in the image door — a body cannot overwrite it',
  () => {
    const inner = argsOf(imageHandler(), 'buildReceiptRow(');
    assert.ok(inner !== null, 'the image door no longer builds its row through the one home');
    const bodyAt   = inner.indexOf('req.body');
    const coupleAt = inner.lastIndexOf('couple_id');
    assert.ok(bodyAt > -1 && coupleAt > bodyAt,
      'couple_id is spread BEFORE the body — a client sending its own couple_id ' +
      'would write into a stranger\'s vault');
  });

t('3.3 …and the same ordering holds in the typed POST it was extracted from',
  () => {
    const inner = argsOf(typedHandler(), 'buildReceiptRow(');
    assert.ok(inner !== null, 'the typed POST no longer builds its row through the one home');
    assert.ok(inner.indexOf('req.body') > -1 &&
              inner.lastIndexOf('couple_id') > inner.indexOf('req.body'));
  });

// ═══════════════════════════════════════════════════════════════════════════
H('══ §4 · ORDERING — upload first, row second ══');

t('4.1 the upload call precedes the insert in the handler body',
  () => {
    const h = imageHandler();
    const up = h.indexOf('uploadBufferToCloudinary(buffer');
    const ins = h.indexOf(".from('couple_receipts')");
    assert.ok(up > -1 && ins > -1 && up < ins,
      'the row is written before the upload — a failed upload would leave a ' +
      'receipt whose image is a broken frame she cannot explain');
  });

t('4.2 an upload failure returns BEFORE any insert — no debris row',
  () => {
    const h = imageHandler();
    const cat = h.indexOf('catch');
    const ins = h.indexOf(".from('couple_receipts')");
    assert.ok(cat > -1 && cat < ins, 'the upload has no failure arm ahead of the write');
    assert.ok(/Could not upload that photo/.test(h.slice(cat, ins)),
      'the upload failure arm does not return — it falls through to the insert');
  });

t('4.3 a falsy secure_url is refused, not written as null',
  () => assert.ok(/!uploaded\.secure_url[\s\S]{0,120}return errRes/.test(imageHandler())));

// ═══════════════════════════════════════════════════════════════════════════
H('══ §5 · R-34.7\'s REFUSALS, asserted as absences with a bounded radius ══');

t('5.1 the receipts router does NOT call processImageForMuse',
  () => assert.ok(!/processImageForMuse/.test(code(RECEIPTS)),
    'the receipt lane runs Vision + a metered Haiku call to tag an invoice'));

t('5.2 the receipts router does NOT reach the inbound-media OCR router',
  () => assert.ok(!/imageOCRRouter|classifyImage/.test(code(RECEIPTS))));

t('5.3 control — the radius is bounded: muse still uses the full pipeline',
  () => assert.ok(/processImageForMuse/.test(code('src/api/couple/muse.js')),
    'this absence claim would be vacuous if nothing used the pipeline at all'));

// ═══════════════════════════════════════════════════════════════════════════
H('══ §6 · ONE HOME — the extraction, and that it moved no behaviour ══');

t('6.1 buildReceiptRow exists and both POSTs go through it',
  () => {
    const c = code(RECEIPTS);
    assert.ok(/function buildReceiptRow\(/.test(c));
    assert.strictEqual((c.match(/buildReceiptRow\(/g) || []).length, 3,
      'expected one declaration and exactly two callers');
  });

t('6.2 the typed POST carries NO second copy of the coercions',
  () => {
    const h = typedHandler();
    assert.ok(!/String\(vendor_name\)/.test(h), 'the typed POST kept its own copy — two homes');
    assert.ok(!/parseInt\(amount/.test(h));
  });

// THE EXTRACTION IS BEHAVIOUR-PRESERVING, AND THAT IS PROVEN BY EXECUTION
// rather than by reading. The function is pure and dependency-free, so it can
// be reached directly — the strongest form available without a database.
t('6.3 the extraction preserves the shipped coercions, executed not read',
  () => {
    const mod = requireFresh(RECEIPTS);
    assert.ok(typeof mod.__buildReceiptRow === 'function',
      'the builder is not reachable for execution — see the test hook note in-file');
    const b = mod.__buildReceiptRow;
    assert.deepStrictEqual(
      b({ couple_id: 'C', vendor_name: '  Taj  ', amount: '5000', description: null,
          receipt_date: '', tags: 'nope', notes: 'a note' }),
      { couple_id: 'C', vendor_name: 'Taj', amount: 5000, description: null,
        receipt_date: null, tags: ['a note'] },
      'a coercion moved during extraction');
  });

// ── AMENDED, F-15.6, 2026-08-15 — THIS CELL PINNED A DEFECT ────────────────
// It asserted `tags === null` for a bare row and called that a shipped
// persistence rule this delivery must not move. It was not a rule. The column
// is `text[] NOT NULL` and an explicit null cannot be written at all, so the
// assertion was pinning a value the database has never once accepted.
//
// The cell was not wrong to exist — it was wrong about which fact it had. It
// now pins the value the column can actually take, and 6.5 pins the REASON so
// the next hand that finds `[]` "inconsistent" with the sibling doors meets the
// constraint before it meets its own taste.
t('6.4 a bare row carries an EMPTY ARRAY, which is what the column accepts',
  () => {
    const b = requireFresh(RECEIPTS).__buildReceiptRow;
    assert.deepStrictEqual(b({ couple_id: 'C', notes: 'x' }).tags, ['x'],
      'the notes-becomes-a-one-element-array behaviour changed');
    assert.deepStrictEqual(b({ couple_id: 'C' }).tags, [],
      'a null here is a NOT NULL violation and every untagged receipt 500s');
  });

t('6.5 the builder can NEVER emit null for tags, whatever the caller sends',
  () => {
    const b = requireFresh(RECEIPTS).__buildReceiptRow;
    for (const input of [
      { couple_id: 'C' },
      { couple_id: 'C', tags: null },
      { couple_id: 'C', tags: 'not-an-array' },
      { couple_id: 'C', notes: '' },
      { couple_id: 'C', notes: null, tags: undefined },
    ]) assert.ok(Array.isArray(b(input).tags),
      `tags came back non-array for ${JSON.stringify(input)}`);
  });

// THE CONSTRAINT IS READ FROM THE WITNESS, not remembered. If a later regen
// shows the column nullable, this cell reds and the comments above it become
// history rather than law — which is the right way round.
t('6.6 the schema witness still says the column refuses a null',
  () => {
    const doc = read('docs/db/PUBLIC_SCHEMA.md');
    const at  = doc.indexOf('## public.couple_receipts');
    assert.ok(at > -1, 'the witness has no couple_receipts section');
    const body = doc.slice(at, at + 600);
    assert.ok(/tags text\[\] NOT NULL/.test(body),
      'the column no longer reads NOT NULL — re-read 6.4 before trusting it');
  });

function requireFresh(p) { delete require.cache[SRC(p)]; return require(SRC(p)); }

// ═══════════════════════════════════════════════════════════════════════════
H('══ §7 · THE BODY LIMIT — route-scoped, on the pages.js precedent ══');

t('7.1 the image route carries its own 12mb json limit',
  () => assert.ok(/router\.post\(\s*'\/:coupleId\/image'\s*,\s*express\.json\(\s*\{\s*limit:\s*'12mb'\s*\}\s*\)/
    .test(code(RECEIPTS))));

t('7.2 …and the mount was NOT widened — GET and DELETE keep the app default',
  () => assert.ok(/router\.use\('\/receipts', require\('\.\/receipts'\)\)/.test(code(CORE)),
    'core.js:28 gained a router-wide limit; the route-scoped form was the ruling'));

// ═══════════════════════════════════════════════════════════════════════════
H('══ §8 · MUTATIONS — production code broken, sha256-restored ══');

// PROBES MIRROR THEIR CELLS, one for one. D-4c's error 1 is the tuition: a
// probe that re-derives a DIFFERENT slice than the cell it is named for reports
// a live cell decorative, or worse, reports a decorative cell live.
const PROBES = {
  '1.1': () => assert.ok(/module\.exports\s*=\s*\{[\s\S]*\buploadBufferToCloudinary\b[\s\S]*\}/.test(code(PIPELINE))),
  '1.2': () => {
    delete require.cache[SRC(PIPELINE)];
    assert.strictEqual(typeof require(SRC(PIPELINE)).uploadBufferToCloudinary, 'function');
  },
  '2.2': () => assert.ok(/\brow\.image_url\s*=\s*uploaded\.secure_url\b/.test(imageHandler())),
  '2.4': () => {
    assert.ok(/const RECEIPT_COLUMNS\s*=/.test(code(RECEIPTS)));
    assert.ok(/\.select\(RECEIPT_COLUMNS\)/.test(imageHandler()));
  },
  '3.2': () => {
    const i = argsOf(imageHandler(), 'buildReceiptRow(');
    assert.ok(i !== null);
    assert.ok(i.indexOf('req.body') > -1 && i.lastIndexOf('couple_id') > i.indexOf('req.body'));
  },
  '3.3': () => {
    const i = argsOf(typedHandler(), 'buildReceiptRow(');
    assert.ok(i !== null);
    assert.ok(i.indexOf('req.body') > -1 && i.lastIndexOf('couple_id') > i.indexOf('req.body'));
  },
  '6.4': () => {
    delete require.cache[SRC(RECEIPTS)];
    const b = require(SRC(RECEIPTS)).__buildReceiptRow;
    assert.deepStrictEqual(b({ couple_id: 'C' }).tags, []);
  },
  '6.5': () => {
    delete require.cache[SRC(RECEIPTS)];
    const b = require(SRC(RECEIPTS)).__buildReceiptRow;
    assert.ok(Array.isArray(b({ couple_id: 'C' }).tags));
  },
  '2.5': () => {
    assert.ok(!/image_url\s*[:=][^=]/.test(typedHandler()));
  },
};

const MUTATIONS = [
  // TWO MUTATIONS, NOT ONE. The first draft used the bare call text as its
  // anchor and it appeared TWICE — R-33.4's uniqueness rule caught it in this
  // bench's own first run. Each door now carries its own unique anchor.
  { id: 'M1a', file: RECEIPTS,
    from: `const row = buildReceiptRow({ ...(req.body || {}), couple_id });`,
    to:   `const row = buildReceiptRow({ couple_id, ...(req.body || {}) });`,
    reds: ['3.2'],
    why:  'image door: spread order reversed — a body couple_id wins' },

  { id: 'M1b', file: RECEIPTS,
    from: `.insert(buildReceiptRow({ ...(req.body || {}), couple_id }))`,
    to:   `.insert(buildReceiptRow({ couple_id, ...(req.body || {}) }))`,
    reds: ['3.3'],
    why:  'typed door: the same reversal on the extraction it came from' },

  // AMENDED WITH ITS CELL (F-15.6). This mutation used to break the cell by
  // REMOVING the notes-to-tags fallback; it now breaks it by reintroducing the
  // null, which is the failure that actually reached a user.
  { id: 'M5', file: RECEIPTS,
    from: `    tags:         Array.isArray(tags) ? tags : (notes ? [notes] : []),`,
    to:   `    tags:         Array.isArray(tags) ? tags : (notes ? [notes] : null),`,
    reds: ['6.4', '6.5'],
    why:  'the null returns — every untagged receipt 500s on a NOT NULL column' },

  { id: 'M2', file: RECEIPTS,
    from: `row.image_url = uploaded.secure_url;`,
    to:   `row.image_url = null;`,
    reds: ['2.2'],
    why:  'the door stops writing the column it exists to write' },

  { id: 'M3', file: PIPELINE,
    from: `  uploadBufferToCloudinary,\n\n  // Exposed for unit-test reach-in only;`,
    to:   `  // Exposed for unit-test reach-in only;`,
    reds: ['1.1', '1.2'],
    why:  'the granted export withdrawn — the door imports a non-function' },

  { id: 'M4', file: RECEIPTS,
    from: `    .select(RECEIPT_COLUMNS)`,
    to:   `    .select('id, image_url')`,
    reds: ['2.4'],
    why:  'the image door hand-lists columns; two doors, two shapes' },
];

let mutOk = 0, mutBad = 0;
for (const m of MUTATIONS) {
  const before = read(m.file);
  const before_sha = sha(before);
  const hits = before.split(m.from).length - 1;
  if (hits !== 1) {
    mutBad++;
    console.log(`  FAIL ${m.id} anchor is not unique in the FINAL tree (${hits} hits) — R-33.4`);
    continue;
  }
  fs.writeFileSync(SRC(m.file), before.replace(m.from, m.to));
  let stillGreen = [];
  try {
    for (const cellId of m.reds) {
      const probe = PROBES[cellId];
      if (!probe) { stillGreen.push(`${cellId}(no probe)`); continue; }
      let threw = false;
      try { probe(); } catch (e) { threw = true; }
      if (!threw) stillGreen.push(cellId);
    }
  } finally {
    fs.writeFileSync(SRC(m.file), before);
    const after_sha = sha(read(m.file));
    if (after_sha !== before_sha) {
      console.log(`  FAIL ${m.id} RESTORE FAILED — ${m.file} left mutated. STOP.`);
      process.exit(1);
    }
  }
  if (stillGreen.length === 0) { mutOk++; console.log(`  ok   ${m.id} — ${m.why} ⇒ ${m.reds.join(' ')} RED`); }
  else { mutBad++; console.log(`  FAIL ${m.id} — decorative: ${stillGreen.join(', ')} stayed GREEN`); }
}

console.log('');
console.log(`  mutations: ${mutOk} bit, ${mutBad} did not`);
if (mutBad > 0) fail += mutBad;

console.log('\n────────────────────────────────────────────────────────────');
console.log(`tdw15_p1_receipt_image: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
console.log('────────────────────────────────────────────────────────────');
if (fails.length) console.log('  failed: ' + fails.join(', '));
process.exit(fail === 0 ? 0 : 1);
