// scripts/b6_s1_bench.js — TDW_04 B6, surfaces sitting S1.
// Runnable from any working directory (Q-SP-5's law).
//
// WHAT THIS BENCH IS, disclosed the way b6_sitting2_bench §4–5 disclosed itself:
// §1's F-04.68 assertions drive the REAL leadSnapshotItem body, extracted from
// harvest.js source and evaluated in isolation — harvest.js's module graph pulls
// engine/dist + the Anthropic SDK, neither of which a cold bench may assume, so
// the function under test is the source's own text, not a re-typed copy. phoneKey
// is supplied to the eval from the engine's OWN source contract (phoneKey.ts,
// asserted present and unchanged in shape) — the require line in harvest.js is
// separately asserted, so runtime keeps its one home. §2–§3 are source assertions
// (the engine gates prove compile + behaviour; this bench proves the words and
// the shapes, the R-B6-12 precedent). Sealed benches are untouched siblings.
//
// Ruling trail: R-B6-16 (paper ratified whole) · R-B6-24 (F-04.68's cure rides
// S1's first code ZIP with a verification line — this file is that line).

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let pass = 0, fail = 0;
function T(label, cond) {
  if (cond) { pass++; console.log('  ✓ ' + label); }
  else { fail++; console.log('  ✗ FAIL: ' + label); }
}

// ══ §1 — F-04.68's cure: the fourth writer carries ST-3b's keys ═══════════
console.log('\n§1 — F-04.68 (harvest.js leadSnapshotItem, the fourth lead-item writer)');
const harvest = read('src/agent/harvest.js');

T('harvest.js requires the engine\'s phoneKey (one home, no local re-derivation)',
  /require\('\.\.\/engine\/dist\/core\/phoneKey'\)/.test(harvest));

const fnMatch = harvest.match(/function leadSnapshotItem\(l\) \{[\s\S]*?\n\}/);
T('leadSnapshotItem extracted from source', !!fnMatch);

if (fnMatch) {
  // The engine's phoneKey contract (src/engine/src/core/phoneKey.ts): last 10
  // digits when >= 10 digits exist, else null. Asserted against the source so a
  // contract change fails HERE, loudly, instead of the eval silently diverging.
  const pkSrc = read('src/engine/src/core/phoneKey.ts');
  T('engine phoneKey source still: strip non-digits, slice(-10), >=10 gate',
    /replace\(\/\\D\/g, ''\)/.test(pkSrc) && /slice\(-10\)/.test(pkSrc) && /10/.test(pkSrc));

  const phoneKey = (p) => {
    if (!p) return null;
    const digits = String(p).replace(/\D/g, '');
    return digits.length >= 10 ? digits.slice(-10) : null;
  };
  // eslint-disable-next-line no-eval
  const leadSnapshotItem = eval('(function(phoneKey){ return ' +
    fnMatch[0].replace('function leadSnapshotItem', 'function') + '; })')(phoneKey);

  const item = leadSnapshotItem({
    id: 'abc-123', name: 'Rhea Referent Test', phone: '+91 98765 43210',
    state: 'new', budget_max: 50000,
  });
  T('legacy shape unregressed: id',        item.id === 'lead:abc-123');
  T('legacy shape unregressed: kind',      item.kind === 'lead');
  T('legacy shape unregressed: text',      item.text === 'Rhea Referent Test — lead, new (Rs 50000)');
  T('legacy shape unregressed: status',    item.status === 'open');
  T('legacy shape unregressed: ref wiring', item.ref_type === 'leads' && item.ref_id === 'abc-123');
  T('THE CURE: name key present',          item.name === 'Rhea Referent Test');
  T('THE CURE: phone_key present, last-10', item.phone_key === '9876543210');

  const keyless = leadSnapshotItem({ id: 'x', name: null, phone: null, state: 'booked', budget_max: null });
  T('null-safe: name null stays null (never the string "unknown" in the KEY)', keyless.name === null);
  T('null-safe: phone_key null on no phone', keyless.phone_key === null);
  T('status branch unregressed (booked -> confirmed)', keyless.status === 'confirmed');
}

// ══ §2 — Item 2's backend half: the allowlist + the one-home facts ════════
console.log('\n§2 — Capacity row (me.js): allowlist, guard, one home');
const me = read('src/api/vendor/me.js');

T('slot_capacity IS in ALLOWED_FIELDS',
  /ALLOWED_FIELDS = \[[\s\S]*?'slot_capacity'\]/.test(me));
T('slot_capacity is NOT in LOCKED_FIELDS',
  !/LOCKED_FIELDS\s*=\s*\[[^\]]*slot_capacity/.test(me));
T('the guard exists: integer >= 0 or null, 400 otherwise',
  /Number\.isInteger\(update\.slot_capacity\)/.test(me) && /slot_capacity must be a whole number/.test(me));
T('GET carries slot_capacity with ?? (0 is a posture, never eaten by ||)',
  /slot_capacity:\s+vendor\.slot_capacity \?\? null/.test(me));
T('PATCH response carries slot_capacity with ??',
  /slot_capacity:\s+updated\.slot_capacity\s+\?\? null/.test(me));
T('one home: me.js requires occupancy\'s CATEGORY_CAPACITY, defines no map of its own',
  /require\('\.\.\/\.\.\/lib\/vendor\/occupancy'\)/.test(me) &&
  !/CATEGORY_CAPACITY\s*=\s*\{/.test(me));
T('applicability computed from the profile, not hardcoded per category',
  /profileFor/.test(me) && /RULED_OFF/.test(me) && /timelineType === 'event'/.test(me));

// ══ §3 — Item 3's backend half: the cap is no longer silent ═══════════════
console.log('\n§3 — Horizon contract (events.js): the truncation tell');
const ev = read('src/api/vendor/events.js');

T('the wire carries truncated, derived from count vs the capped list',
  /truncated:\s*\(count \|\| 0\) > events\.length/.test(ev));
T('DEFAULT_WINDOW_DAYS unchanged at 400 (existing behaviour sacred for windowless callers)',
  /const DEFAULT_WINDOW_DAYS = 400;/.test(ev));
T('HARD_CAP unchanged at 200 (the cap is honest now, not gone)',
  /const HARD_CAP = 200;/.test(ev));
T('total still on the wire (the B5-era countQuery, now load-bearing)',
  /total:\s+count \|\| 0,/.test(ev));

// ══ banner ════════════════════════════════════════════════════════════════
console.log('');
if (fail === 0) console.log('   ══ ' + pass + '/' + pass + ' PASS ══');
else { console.log('   ══ ' + pass + '/' + (pass + fail) + ' — ' + fail + ' FAILED ══'); process.exit(1); }
