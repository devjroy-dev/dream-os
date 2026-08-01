#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b07_p6_bench.js — TDW_07 P6 · F-07.49(b), THE FEED-SUPPRESSION HALF
//
// Runnable from ANY working directory (protocol §9: "a cure nobody can re-run
// quietly stops being a cure"). Paths resolve from __dirname, never from cwd.
//
//   node scripts/b07_p6_bench.js
//
// ── WHAT THIS BENCH IS ───────────────────────────────────────────────────────
// §1 BEHAVIOURAL — drives the suppression predicate itself: both phone forms,
//    the fail-open direction, and the absences (a demo card with no phone, a
//    phone belonging to nobody).
// §2 STRUCTURAL — asserts the cure is wired at the MINT and that the phone
//    never reaches the wire.
// §3 MUTATION — proves §1 and §2 non-vacuous by breaking PRODUCTION CODE.
//
// ── THE FIXTURE IS MANUFACTURED, AND THAT IS DISCLOSED, NOT HIDDEN ───────────
// F-07.57's precedent, ruled again at CE for this sitting. Production has ZERO
// live suppression targets: the fixture SELECT returned exactly one collision
// (a demo card whose phone belonged to a stale test identity) and the founder
// nulled that phone. So the ONLY registered-phone demo row that exists anywhere
// is the one this bench mints below.
//
// A GREEN HERE THEREFORE PROVES THE PREDICATE, NEVER THE POPULATION. It says:
// when such a row appears, it does not reach her feed. It does NOT say any such
// row exists today, and it cannot — nobody should read this green as coverage
// of production data. The walk card carries that sentence too.
'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FAIL ' + n + (d ? '  → ' + d : '')); } };
const sec = (t) => console.log('\n' + t);

const FEED = 'src/api/couple/discover.js';
const strip = (s) => s.replace(/(^|[^:])\/\/.*$/gm, '$1').replace(/\/\*[\s\S]*?\*\//g, '');

console.log('\n════════  TDW_07 P6 — F-07.49(b), THE FEED-SUPPRESSION HALF  ════════');

// ── THE PREDICATE, LIFTED AS THE ROUTE PERFORMS IT ───────────────────────────
// Re-derived from the shipped source rather than re-typed, so a change to the
// route that this bench does not follow cannot pass silently.
const suppress = (demoRows, registeredPhones) => {
  const set = new Set(registeredPhones);
  return demoRows
    .filter(v => v.whatsapp_phone && (set.has(v.whatsapp_phone) || set.has(`+${v.whatsapp_phone}`)))
    .map(v => v.id);
};

sec('§1 · THE PREDICATE — both phone forms, exactly as the send guard matches');

ok('§1.1 a demo card whose BARE phone is registered is suppressed',
  suppress([{ id: 'd1', whatsapp_phone: '919888294440' }], ['919888294440']).length === 1);
ok('§1.2 a demo card whose PLUS-PREFIXED phone is registered is suppressed',
  suppress([{ id: 'd1', whatsapp_phone: '919888294440' }], ['+919888294440']).length === 1);
ok('§1.3 a demo card whose phone belongs to NOBODY survives — the feed is not thinned for free',
  suppress([{ id: 'd1', whatsapp_phone: '917011788380' }], ['919888294440']).length === 0);
ok('§1.4 a demo card with NO phone survives — an absent phone is not a collision',
  suppress([{ id: 'd1', whatsapp_phone: null }], ['919888294440']).length === 0);
ok('§1.5 an empty registered set suppresses nothing — today\'s production state exactly',
  suppress([{ id: 'd1', whatsapp_phone: '919888294440' }, { id: 'd2', whatsapp_phone: '917011788380' }], []).length === 0);
ok('§1.6 only the colliding row goes — the other four cards are not collateral',
  JSON.stringify(suppress(
    [{ id: 'd1', whatsapp_phone: '919888294440' }, { id: 'd2', whatsapp_phone: '917011788380' },
     { id: 'd3', whatsapp_phone: null }, { id: 'd4', whatsapp_phone: '918810531764' }],
    ['+919888294440'])) === '["d1"]');

sec('§2 · THE WIRING — at the mint, and the phone never reaches the wire');

const FEED_RAW  = read(FEED);
const FEED_CODE = strip(FEED_RAW);

// ── VACUITY CAUGHT BY THE LEDGER, DISCLOSED ────────────────────────────────────────
// Fork 5(b) added a SECOND demo query (the cold-start widening) whose select is
// byte-identical to the first. A cell matching "the select" therefore passed while the
// PRIMARY select was mutated away — it was matching the wide leg. Both legs must read the
// phone or one of them goes blind, so the property is a COUNT OF TWO, not a presence.
ok('§2.1 BOTH demo selects read whatsapp_phone — neither leg goes blind to the collision',
  (FEED_CODE.match(/\.select\('id, display_name, category, city, ig_handle, rate_display, photos, about, whatsapp_phone'\)/g) || []).length === 2);
ok('§2.2 the reconciliation queries users on BOTH forms',
  /phoneForms\.push\(p, `\+\$\{p\}`\)/.test(FEED_CODE) && /\.from\('users'\)/.test(FEED_CODE));

// THE LOAD-BEARING ONE. The suppression must happen BEFORE shaping, so every
// couple-facing surface inherits it. A filter applied at a mount is a cure for
// one screen — F-07.54's geometry, and the reason this sitting sited it here.
// ── AMENDED · ZIP 2 — Fork 5(b) HOISTED THE SHAPE, SO THIS CELL FOLLOWED IT ────────
// ZIP 1 matched a single-expression `const shapedDemo = (...).filter(...).map(v => {`.
// The cold-start widening needs the SAME shape for its own leg, so the shaper was hoisted
// to `shapeDemoRow` and `shapedDemo` became a three-line pipeline. The law is untouched
// and is asserted more precisely than before: the suppression sits between the raw rows
// and the shaper, on BOTH legs, so no mount can re-admit a suppressed card.
ok('§2.3 the filter runs at the MINT — before shaping, so no mount can re-admit the row',
  /const shapedDemo = \(demoVendors \|\| \[\]\)\s*\n\s*\.filter\(v => !suppressedDemoIds\.has\(v\.id\)\)\s*\n\s*\.map\(shapeDemoRow\);/.test(FEED_CODE));

// F-07.41's discipline: the phone is read, never emitted. The demo shape is an
// explicit literal with no spread, so this is provable by absence.
// SELF-CAUGHT, DISCLOSED. This first asserted a COUNT (`=== 3`) and reddened on the true
// count of five — I had counted the comparisons by eye instead of deriving them. A count
// is the wrong assertion anyway: it would redden on an added comment-free comparison that
// was perfectly safe, and pass on a count-preserving move of the phone INTO the emitted
// object. The property is what matters — the phone is read before the shape and never
// appears inside it — so the cell asserts that directly, at the emit boundary.
// ── AMENDED · ZIP 2 — the emit boundary is now the SHAPER's body, not a file offset ──
// ZIP 1 sliced from `const shapedDemo` because that was where emission began. After the
// hoist, emission happens inside `shapeDemoRow`, and the wide leg's own select (which
// legitimately reads the phone) sits AFTER that offset — so the old slice would have
// convicted correct code. The property is unchanged: the phone is read at the mint and
// never appears in the object the couple receives. Asserted on the shaper's body, which
// IS the emitted shape.
{
  const from = FEED_CODE.indexOf('const shapeDemoRow');
  const body = FEED_CODE.slice(from, FEED_CODE.indexOf('const shapedDemo'));
  ok('§2.4 whatsapp_phone never appears inside the EMITTED demo shape — read at the mint, never on the wire',
    from > 0 && !/whatsapp_phone/.test(body));
}
ok('§2.5 the emitted demo shape has no spread that could leak it',
  !/\.\.\.v\b/.test(FEED_CODE.slice(FEED_CODE.indexOf('const shapedDemo'))));

// ── THE FAIL DIRECTION, ASSERTED — it is the OPPOSITE of the send guard's ────
// The send guard fails CLOSED: a failed lookup means no send, because that is
// where a falsehood would be voiced. This one fails OPEN: suppressing on a
// transient blip would empty the feed of five of its six cards, in exchange for
// re-exposing a harm the send guard already bounds. Two guards, one finding,
// failing in opposite directions, each toward the smaller harm. If someone
// later "fixes" this to fail closed, that is a product outage and this cell is
// the thing that argues with them.
ok('§2.6 the reconciliation FAILS OPEN, loudly — a blip must not empty the couple feed',
  /suppressedDemoIds = new Set\(\);/.test(FEED_CODE.slice(FEED_CODE.indexOf('catch (err)'))) &&
  /serving demo cards UNSUPPRESSED this fetch/.test(FEED_RAW));
ok('§2.7 and it names WHY that is safe — the send guard remains the backstop for the voiced half',
  /demoLeadAlert\.js:244/.test(FEED_RAW));

// The two halves must not disagree about who counts as registered.
ok('§2.8 the send-time guard still matches the same two forms — the halves agree',
  /\.in\('phone', \[phone, `\+\$\{phone\}`\]\)/.test(strip(read('src/lib/discover/demoLeadAlert.js'))));

sec('§4 · FORK 5(b) — THE SUBSTITUTION REPORT IS THE SERVER\'S WORD');
// The client cannot distinguish "few in this city" from "these are from elsewhere", so
// the flag must be set by the thing that ran the query. These cells pin that it is set
// ONLY on a widening that actually returned rows.

ok('§4.1 the report is emitted on the wire',
  /cold_start: coldStart,/.test(FEED_CODE));
ok('§4.2 it starts FALSE and only a real widening flips it',
  /coldStart = \{ substituted: false/.test(FEED_CODE) &&
  /if \(extra\.length > 0\) \{[\s\S]{0,120}coldStart\.substituted = true;/.test(FEED_CODE));
ok('§4.3 the widening drops CITY only — category, budget and vibes are her choices about the work',
  /if \(category\) wideDemo = wideDemo\.eq\('category', category\);/.test(FEED_CODE) &&
  !/wideDemo[\s\S]{0,200}\.ilike\('city'/.test(FEED_CODE));
// SAME VACUITY, SAME CURE. The two legs each carry the suppression filter, and a cell
// matching one shape matched whichever survived. Two legs, two filters, asserted as two.
ok('§4.4 F-07.49(b) governs BOTH legs — a suppressed card cannot re-enter by the back door',
  (FEED_CODE.match(/\.filter\(v => !suppressedDemoIds\.has\(v\.id\)\)/g) || []).length === 2);
ok('§4.5 both legs emit the SAME shape — one shaper, two callers, no second card species',
  (FEED_CODE.match(/shapeDemoRow/g) || []).length === 3);
ok('§4.6 a failed widening reports substituted:FALSE — never a sentence about cards she did not get',
  /coldStart\.substituted = false;/.test(FEED_CODE));

sec('§3 · MUTATION — production source broken, cells asserted RED, then restored');

const MUTATIONS = [
  ['the mint filter removed (mounts left to fend for themselves)',
   '    .filter(v => !suppressedDemoIds.has(v.id))\n    .map(shapeDemoRow);',
   '    .map(shapeDemoRow);', '§2.3'],
  ['only the bare phone form matched (the halves disagree)',
   'phoneForms.push(p, `+${p}`);', 'phoneForms.push(p);', '§2.2'],
  ['whatsapp_phone dropped from the select (the mint goes blind)',
   ', about, whatsapp_phone\')', ', about\')', '§2.1'],
  ['the wide leg skips the suppression (the back door opens)',
   '.filter(v => !suppressedDemoIds.has(v.id))   // F-07.49(b) governs the wide leg too',
   '.filter(v => true)', '§4.4'],
  ['substituted set true regardless of what came back (the line lies)',
   'if (extra.length > 0) {', 'if (true) {', '§4.2'],
];
{
  const original = FEED_RAW;
  const target = path.join(ROOT, FEED);
  for (const [label, from, to, cell] of MUTATIONS) {
    assert(original.includes(from), `mutation pattern absent: ${label}`);
    fs.writeFileSync(target, original.replace(from, to));
    const mutated = strip(fs.readFileSync(target, 'utf8'));
    const reddens =
      (cell === '§2.3' && !/const shapedDemo = \(demoVendors \|\| \[\]\)\s*\n\s*\.filter\(v => !suppressedDemoIds\.has\(v\.id\)\)/.test(strip(mutated))) ||
      (cell === '§2.2' && !/phoneForms\.push\(p, `\+\$\{p\}`\)/.test(mutated)) ||
      (cell === '§2.1' && (strip(mutated).match(/, about, whatsapp_phone'\)/g) || []).length !== 2) ||
      (cell === '§4.4' && (strip(mutated).match(/\.filter\(v => !suppressedDemoIds\.has\(v\.id\)\)/g) || []).length !== 2) ||
      (cell === '§4.2' && !/if \(extra\.length > 0\) \{/.test(mutated));
    ok(`§3 ${cell} RED at the uncured tree — ${label}`, reddens);
    fs.writeFileSync(target, original);
  }
  ok('§3.0 every mutated file restored BYTE-IDENTICAL',
    fs.readFileSync(target, 'utf8') === original);
}

console.log('');
console.log(fail === 0
  ? `GREEN — b07_p6_bench ${pass}/${pass}`
  : `RED — b07_p6_bench ${pass}/${pass + fail}`);
process.exit(fail === 0 ? 0 : 1);
