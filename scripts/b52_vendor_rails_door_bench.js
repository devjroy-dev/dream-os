#!/usr/bin/env node
'use strict';
// scripts/b52_vendor_rails_door_bench.js
// S2 · F-39.63 · THE DOCUMENT'S FOUR RAILS GET A DOOR · R-39.20
//
// Migration 0130 added `address`, `account_name`, `account_number` and `ifsc` to
// public.vendors, and dream-os 2fc20eb taught the invoice document to print them. The
// read-first for the pwa half then found that NOTHING BETWEEN THE BROWSER AND THE ROW
// WOULD CARRY THEM: `PATCH /api/v2/vendor/me` is whitelist-gated, and an un-listed
// field is dropped SILENTLY BEHIND A 200.
//
// That is the never-a-false-done shape, and it is worse here than usual: the vendor
// would type her account number, tap Save, read "Saved", and have written nothing —
// then mail a couple an invoice with no bank block on it and no way to know why.
//
// FOUR SITES, and a field must clear ALL FOUR or the round trip has a hole:
//   (1) GET /me response shape      — or Settings renders empty boxes over real data
//   (2) ALLOWED_FIELDS              — or the write is dropped behind a 200
//   (3) the PATCH re-read select    — or the handler cannot see what it just wrote
//   (4) the PATCH response shape    — or the client cannot verify the save
//
// ── WHY THIS BENCH EVALUATES THE ARRAYS INSTEAD OF GREPPING FOR NAMES ───────
// `me.js` contains this line, live in the tree:
//
//      // 'rate_max',
//
// — a retired allowlist entry, deliberately commented rather than deleted, with a
// paragraph above it explaining that removing the NAME is what stops new writes. A
// grep for `rate_max` finds it and reports a field as allowed that the runtime drops.
// That is the comment-blindness law with a live specimen sitting in the subject file.
//
// So §1 EXTRACTS THE TWO DECLARATIONS AND EVALUATES THEM. What this bench asserts is
// the array the process will actually build, not the text that resembles it. `rate_max`
// is asserted ABSENT as the standing proof that the extraction is real: a grep-shaped
// implementation of this bench cannot make that cell pass.
//
// ── WHAT THIS BENCH DOES NOT DO ─────────────────────────────────────────────
// It is not a live round trip. The handler sits behind `requireAuth` and
// `resolveVendor` and writes through a real Supabase client; standing those up in a
// bench would put a mock of the database between the cell and the claim, and a mock
// that agrees with me proves nothing about production. The FOUNDER'S CARD is where
// the round trip is witnessed — fill the fields, save, reload, open the PDF. This
// bench proves the four sites, which is the part a card cannot check by eye.
//
// EXIT: 0 pass · 1 fail · 2 error · 3 refused.  (S4's channel, CE-39.)

const fs   = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const ME_REL = 'src/api/vendor/me.js';
const ME = path.join(ROOT, ME_REL);
const CELLS_ONLY = process.argv.includes('--cells-only');

// 0130's four. The subject of every cell below.
const RAILS = ['address', 'account_name', 'account_number', 'ifsc'];

let pass = 0, fail = 0;
const ok = (n, c, d) => {
  if (c) { pass++; console.log('  ok   ' + n); }
  else { fail++; console.log('  FAIL ' + n + (d ? '  \u2192 ' + d : '')); }
};
const sec = (t) => console.log('\n' + t);

let src;
try { src = fs.readFileSync(ME, 'utf8'); }
catch { console.log('REFUSED \u2014 ' + ME_REL + ' is absent'); process.exit(3); }

// ── EXTRACT AND EVALUATE A TOP-LEVEL const ARRAY ────────────────────────────
// Brace/bracket-matched from the declaration so comments, line breaks and nested
// brackets inside it travel with it and are evaluated as JavaScript sees them.
function arrayConst(name) {
  const at = src.indexOf('const ' + name);
  if (at < 0) return null;
  const open = src.indexOf('[', at);
  if (open < 0) return null;
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') { depth--; if (depth === 0) {
      // eslint-disable-next-line no-new-func
      try { return new Function('return ' + src.slice(open, i + 1))(); } catch { return null; }
    } }
  }
  return null;
}

// ── SITE READERS ────────────────────────────────────────────────────────────
// (1) and (4) are object literals keyed `field: vendor.field || null` — asserted as
// the KEY, because a response that carries the value under a different name is a
// response the client cannot read.
const respondsWith = (col, subjectRe) =>
  new RegExp('^\\s*' + col + ':\\s*' + subjectRe + '\\.' + col + '\\b', 'm').test(src);

// (3) the two `.select('…')` column lists. Both must name the column: the first is the
// re-read after the update, the second the fallback path.
function selectLists() {
  return [...src.matchAll(/\.select\('([^']*id,[^']*business_name[^']*)'\)/g)].map(m => m[1]);
}

const ALLOWED = arrayConst('ALLOWED_FIELDS');
const LOCKED  = arrayConst('LOCKED_FIELDS');

// ═══ §1 · THE ARRAYS ARE REAL, NOT TEXT ═════════════════════════════════════
sec('\u00a71 \u00b7 the allowlist as the runtime builds it');
if (!ALLOWED || !LOCKED) {
  console.log('REFUSED \u2014 could not evaluate ALLOWED_FIELDS / LOCKED_FIELDS. Every cell ' +
    'below would assert against null.');
  process.exit(3);
}
ok('ALLOWED_FIELDS evaluates to an array', Array.isArray(ALLOWED) && ALLOWED.length > 5,
  JSON.stringify(ALLOWED));
// THE EXTRACTION'S OWN PROOF. `// 'rate_max',` is commented out in the tree; a
// grep-shaped bench reports it present. If this cell ever passes for the wrong reason,
// it is because someone re-armed the entry knowingly, which is what its comment asks.
ok('the commented-out rate_max is NOT in the evaluated list', !ALLOWED.includes('rate_max'),
  'the extraction is reading text, not the array');
ok('gstin is allowed \u2014 the path the rails follow', ALLOWED.includes('gstin'));

// ═══ §2 · SITE (2) · THE FOUR ARE WRITABLE ══════════════════════════════════
sec('\u00a72 \u00b7 site (2) \u2014 ALLOWED_FIELDS');
for (const c of RAILS) {
  ok('ALLOWED_FIELDS carries ' + c, ALLOWED.includes(c),
    'a PATCH carrying it would be dropped silently behind a 200');
}
// R-39.20's negative half, and it is not decoration: if a later sitting decides the
// bank rails are TDW's business after all, this cell is where that argument has to be
// had out loud rather than by moving a string.
for (const c of RAILS) {
  ok(c + ' is NOT locked', !LOCKED.includes(c), 'R-39.20 says the vendor\u2019s rails are hers');
}
ok('billing_status is still locked', LOCKED.includes('billing_status'),
  'the locked list must keep protecting TDW\u2019s state about her');

// ═══ §3 · SITE (1) · GET RETURNS THEM ═══════════════════════════════════════
sec('\u00a73 \u00b7 site (1) \u2014 the GET /me response shape');
for (const c of RAILS) {
  ok('GET /me answers with ' + c, respondsWith(c, 'vendor'),
    'Settings would render an empty box over a filled column');
}

// ═══ §4 · SITE (3) · THE HANDLER CAN SEE WHAT IT WROTE ══════════════════════
sec('\u00a74 \u00b7 site (3) \u2014 the PATCH selects');
const lists = selectLists();
ok('both vendor column lists were found', lists.length === 2, lists.length + ' found');
for (const c of RAILS) {
  ok('every vendor select names ' + c, lists.length === 2 && lists.every(l => l.split(/,\s*/).includes(c)),
    'the re-read cannot see the column it just wrote');
}

// ═══ §5 · SITE (4) · THE CLIENT CAN VERIFY THE SAVE ═════════════════════════
sec('\u00a75 \u00b7 site (4) \u2014 the PATCH response shape');
for (const c of RAILS) {
  ok('PATCH answers with ' + c, respondsWith(c, 'updated'),
    'a save the client is told about but cannot read back');
}

// ═══ §6 · MUTATION · THE CHAIR'S OWN ════════════════════════════════════════
// "drop `ifsc` from the allowlist → the cell reds on a silent drop behind a 200".
// A second mutation removes it from the GET shape, because a field that is writable
// and unreadable is the same hole from the other side.
if (!CELLS_ONLY) {
  sec('\u00a76 \u00b7 mutations');
  const before = fs.readFileSync(ME);
  const txt = before.toString('utf8');
  const MUT = [
    ['ifsc leaves the allowlist \u2014 the write is dropped behind a 200',
     "'address', 'account_name', 'account_number', 'ifsc',",
     "'address', 'account_name', 'account_number',"],
    ['ifsc leaves the GET shape \u2014 writable but unreadable',
     "      ifsc:              vendor.ifsc           || null,",
     "      // ifsc removed"],
  ];
  for (const [name, from, to] of MUT) {
    if (!txt.includes(from)) { ok(name, false, 'mutation site absent \u2014 the code moved'); continue; }
    fs.writeFileSync(ME, txt.replace(from, to));
    const r = spawnSync(process.execPath, [__filename, '--cells-only'], { encoding: 'utf8' });
    fs.writeFileSync(ME, before);
    ok(name + ' \u2192 RED', r.status !== 0, 'exit ' + r.status);
    ok(name + ' \u2192 restored byte-for-byte', Buffer.compare(before, fs.readFileSync(ME)) === 0);
  }
}

console.log('\n' + (fail === 0 ? 'GREEN' : 'RED') + ' \u2014 b52 vendor rails door ' +
  pass + '/' + (pass + fail));
process.exit(fail === 0 ? 0 : 1);
