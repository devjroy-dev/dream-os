#!/usr/bin/env node
// tools/bench/tdw15_f1510_category_vocabulary_bench.js
//
// F-15.10 · THE COUPLE PLANE'S CATEGORY VOCABULARY — ONE HOME.
// Chartered CE-35, ruled R-35.26/.27a/.27b/.28/.29.
//
// Runnable from ANY working directory (Q-SP-5):
//     node tools/bench/tdw15_f1510_category_vocabulary_bench.js
//
// ═══════════════════════════════════════════════════════════════════════════
// WHAT THIS BENCH ASSERTS, AND WHAT IT REFUSES TO ASSERT
// ═══════════════════════════════════════════════════════════════════════════
// F-15.12's doctrine: a cell that pins an ADDRESS dies the next time someone
// moves a line. Every cell below pins an INVARIANT — "no module outside the one
// home declares this vocabulary", "the door refuses a token the CHECK refuses" —
// so a future re-shuffle cannot silently retire the guard by relocating it.
//
// The retired eight are named ONCE, here, as the thing that must not reappear.
// They are witnessed at the constraint's own line, docs/db/PUBLIC_SCHEMA.md:1373
// (pre-0126), NOT recalled: a bench asserting a legacy set from memory is the
// disease wearing the cure's uniform.
//
// BOTH-WAYS. Each cell names the PRODUCTION mutation that reddens it. Not one
// mutation is a test-setup tweak. Where a cell asserts an absence it asserts it
// by a method whose failure mode differs from the one that produced the claim:
// the shadow-vocabulary cells read the SOURCE TEXT of every file under src/,
// while the behaviour cells drive the real Express handlers through a fake
// supabase. A grep agreeing with a require would be one method twice.
//
// NO NETWORK, NO DATABASE. The supabase fake RECORDS what it was handed and is
// DELIBERATELY STRICTER than Postgres on `category` and `state` — it enforces
// the post-0126 CHECK itself, so a door that lets a bad token through is caught
// here rather than in production. A fake more generous than the real plane
// catches nothing.

const path = require('path');
const fs   = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const rd   = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const { VENDOR_CATEGORIES } = require(path.join(ROOT, 'src/agent/categories'));

let pass = 0, fail = 0;
const results = [];

// AWAITS. The first cut of this harness did not, and every async cell returned
// a Promise that was `!== true` — seven cells red for a reason that had nothing
// to do with the code under test. Kept in the record because the same bug with
// the comparison inverted (`if (out !== false)`) would have printed seven GREENs
// over an unrun bench, which is the hollow green this estate fears most.
async function cell(name, fn) {
  let out;
  try { out = await fn(); } catch (e) { out = `threw: ${e && e.message}`; }
  if (out === true) { pass++; results.push(`GREEN  ${name}`); }
  else { fail++; results.push(`RED    ${name}  →  ${out}`); }
}

// ── The two vocabularies, one named from the source of truth ─────────────────
const CANONICAL = [
  'planning','designer','photography','makeup','hairstylist','jewellery',
  'decor','venue_catering','performer','content_creator','other',
];
// Witnessed at docs/db/PUBLIC_SCHEMA.md:1373 before 0126. `designer`, `decor`
// and `other` are common to both sets and are therefore NOT retired tokens —
// naming them here would make every cell below vacuously red.
const RETIRED = ['photographer','videographer','mua','venue','caterer','florist','music','planner'];

// ── The fake plane ───────────────────────────────────────────────────────────
// Enforces the post-0126 CHECK and the state CHECK exactly.
function makeSupabase(recorder) {
  const CHECK_CATEGORY = new Set(CANONICAL);
  const CHECK_STATE    = new Set(['booked', 'advance_paid', 'paid']);
  return {
    from() { return this; },
    insert(row) {
      recorder.inserted = row;
      if (!CHECK_CATEGORY.has(row.category)) {
        recorder.dbRefused = `category_check: ${row.category}`;
        return { select: () => ({ single: async () => ({ data: null, error: { message: 'new row violates check constraint "couple_bookings_category_check"' } }) }) };
      }
      if (!CHECK_STATE.has(row.state)) {
        recorder.dbRefused = `state_check: ${row.state}`;
        return { select: () => ({ single: async () => ({ data: null, error: { message: 'new row violates check constraint "couple_bookings_state_check"' } }) }) };
      }
      return { select: () => ({ single: async () => ({ data: { id: 'b-1', ...row }, error: null }) }) };
    },
    update(u) { recorder.updated = u; return this; },
    eq() { return this; },
    select() { return this; },
    single: async () => ({ data: { id: 'b-1', ...(recorder.updated || {}) }, error: null }),
  };
}

// Drives the REAL router. No handler is re-implemented here — a bench that
// restates the door it is testing agrees with itself.
function drive(method, urlPath, body, recorder) {
  const router = require(path.join(ROOT, 'src/api/couple/bookings.js'));
  const layer = router.stack.find(l =>
    l.route && l.route.methods[method] && l.route.path === urlPath);
  if (!layer) throw new Error(`no ${method.toUpperCase()} ${urlPath} on the router`);

  const captured = {};
  const req = {
    method: method.toUpperCase(),
    params: urlPath === '/:coupleId'
      ? { coupleId: 'c-1' }
      : { bookingId: '11111111-2222-3333-4444-555555555555' },
    query: {}, body,
    coupleUser: { couple_id: 'c-1' },
    app: { locals: { supabase: makeSupabase(recorder) } },
  };
  const res = {
    status(c) { captured.status = c; return this; },
    json(p)   { captured.body = p; return this; },
  };
  const handlers = layer.route.stack.map(s => s.handle);
  return (async () => {
    for (const h of handlers) await h(req, res, () => {});
    return captured;
  })();
}

(async () => {

  // ══ THE ONE-HOME INVARIANT ════════════════════════════════════════════════
  // MUTATION: paste any retired token back into bookings.js, brideEngine.js or
  // brideTools.js as a literal. RED.
  await cell('no module under src/ re-declares the booking vocabulary as a literal', () => {
    const walk = (d, acc = []) => {
      for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
        const p = `${d}/${e.name}`;
        if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== 'dist') walk(p, acc); }
        else if (e.name.endsWith('.js')) acc.push(p);
      }
      return acc;
    };
    const offenders = [];
    for (const f of walk('src')) {
      if (f === 'src/agent/categories.js') continue;      // the one home
      const text = rd(f);
      for (const line of text.split('\n')) {
        if (line.trimStart().startsWith('//') || line.trimStart().startsWith('*')) continue;
        // A LITERAL COLLECTION of retired tokens — three or more quoted retired
        // tokens on one line is a vocabulary, not a mention. Two would catch the
        // alias table at categoryFraming.js:113, which is a MAP not a taxonomy.
        const hits = RETIRED.filter(t => line.includes(`'${t}'`) || line.includes(`"${t}"`));
        if (hits.length >= 3) offenders.push(`${f}: ${hits.join(',')}`);
      }
    }
    return offenders.length === 0 ? true : `shadow vocabulary at ${offenders.join(' | ')}`;
  });

  // MUTATION: change `require('./categories')` in brideTools.js to an inline
  // array. RED — the enums stop tracking the one home.
  await cell('all three bride tool enums ARE the one home (identity, not equality)', () => {
    const { BRIDE_TOOLS } = require(path.join(ROOT, 'src/agent/brideTools'));
    const names = ['add_booking', 'list_bookings', 'update_booking'];
    for (const n of names) {
      const t = BRIDE_TOOLS.find(x => x.name === n);
      if (!t) return `${n} missing from BRIDE_TOOLS`;
      const e = t.input_schema.properties.category.enum;
      // IDENTITY. A copy that happens to be equal today drifts tomorrow; this
      // asserts the enum is the very array the home exports.
      if (e !== VENDOR_CATEGORIES) return `${n}.enum is a copy, not the one home`;
    }
    return true;
  });

  // MUTATION: edit any token in categories.js. RED — and correctly so: this
  // cell is the tripwire that forces the next taxonomy edit to meet 0126.
  await cell('the one home carries exactly the eleven the 0126 CHECK carries', () => {
    if (VENDOR_CATEGORIES.length !== 11) return `home has ${VENDOR_CATEGORIES.length} tokens`;
    const a = [...VENDOR_CATEGORIES].sort().join(',');
    const b = [...CANONICAL].sort().join(',');
    return a === b ? true : `home diverged from the CHECK: ${a}`;
  });

  // MUTATION: drop a retired token from 0126's backfill. RED.
  await cell('0126 maps every retired token forward and recreates the named constraint', () => {
    const m = rd('db/migrations/0126_couple_booking_taxonomy_eleven.sql');
    for (const t of RETIRED) {
      if (!new RegExp(`category\\s*(=|IN\\s*\\()\\s*'${t}'|'${t}'\\s*[,)]`).test(m)) {
        return `0126 never maps '${t}' forward — ADD CONSTRAINT would fail on such a row`;
      }
    }
    if (!/ADD CONSTRAINT couple_bookings_category_check/.test(m)) {
      return '0126 does not recreate couple_bookings_category_check by name';
    }
    for (const t of CANONICAL) {
      if (!m.includes(`'${t}'::text`)) return `0126's new CHECK omits '${t}'`;
    }
    return true;
  });

  // ══ THE DOORS ═════════════════════════════════════════════════════════════

  // MUTATION (R-35.27a): delete the category guard from the POST door. RED —
  // and note the cell asserts a 400 from THE DOOR, not merely a refusal: with
  // the guard gone the fake DB still refuses, but as a 500. That distinction is
  // the whole finding, so the cell tests for it.
  await cell('POST refuses a twelfth token at the DOOR with 400, not at the DB with 500', async () => {
    const rec = {};
    const r = await drive('post', '/:coupleId',
      { vendor_name: 'Aanya Studio', category: 'astrologer' }, rec);
    if (r.status === 500) return 'POST let an unknown token reach the DB — 500, not a door refusal';
    if (r.status !== 400) return `expected 400, got ${r.status}`;
    if (rec.inserted) return 'POST attempted the insert before validating';
    return true;
  });

  // MUTATION: revert the POST guard to the pre-0126 list. RED on all eight.
  await cell('POST accepts all eleven canonical tokens', async () => {
    for (const t of CANONICAL) {
      const rec = {};
      const r = await drive('post', '/:coupleId', { vendor_name: 'V', category: t }, rec);
      if (r.status === 400) return `POST refused canonical token '${t}'`;
      if (rec.dbRefused) return `CHECK refused canonical token '${t}': ${rec.dbRefused}`;
      if (!rec.inserted || rec.inserted.category !== t) return `'${t}' did not reach the insert`;
    }
    return true;
  });

  // MUTATION: revert the POST guard. RED — this is the bride's actual complaint.
  await cell('POST accepts jewellery, hairstylist and content_creator (the walk tokens)', async () => {
    for (const t of ['jewellery', 'hairstylist', 'content_creator']) {
      const rec = {};
      const r = await drive('post', '/:coupleId', { vendor_name: 'Sabya', category: t }, rec);
      if (r.status === 400 || rec.dbRefused) return `'${t}' still refused`;
    }
    return true;
  });

  // MUTATION: delete the PATCH category guard, or repoint it at a literal. RED.
  await cell('PATCH refuses a twelfth token and accepts all eleven', async () => {
    const bad = await drive('patch', '/:bookingId', { category: 'astrologer' }, {});
    if (bad.status !== 400) return `PATCH accepted an unknown token (status ${bad.status})`;
    for (const t of CANONICAL) {
      const r = await drive('patch', '/:bookingId', { category: t }, {});
      if (r.status === 400) return `PATCH refused canonical token '${t}'`;
    }
    return true;
  });

  // MUTATION (R-35.27b): put 'considering' back into POST's state list. RED —
  // it would reach the fake, which enforces the real state CHECK, and 500.
  await cell('POST refuses a state the state CHECK refuses, and never coerces it silently', async () => {
    for (const s of ['considering', 'shortlisted', 'in_discussion']) {
      const rec = {};
      const r = await drive('post', '/:coupleId', { vendor_name: 'V', category: 'other', state: s }, rec);
      if (rec.dbRefused) return `'${s}' reached the DB — ${rec.dbRefused}`;
      if (r.status !== 400) return `'${s}' was silently coerced to '${rec.inserted && rec.inserted.state}' instead of refused`;
    }
    return true;
  });

  // MUTATION: change the absent-state default. RED — the pwa's create body
  // sends no state at all, so this is the path the walk actually takes.
  await cell('an ABSENT state still defaults to booked (the pwa create path)', async () => {
    const rec = {};
    const r = await drive('post', '/:coupleId', { vendor_name: 'Aanya Studio', category: 'jewellery' }, rec);
    if (r.status === 400) return `the pwa's own create body was refused (status 400)`;
    if (!rec.inserted || rec.inserted.state !== 'booked') {
      return `absent state resolved to '${rec.inserted && rec.inserted.state}', not 'booked'`;
    }
    return true;
  });

  // MUTATION: remove the `category !== undefined` clause from the POST guard.
  // RED — an omitted category must still mean `other`, not a 400.
  await cell('an OMITTED category still means other, and other survives 0126', async () => {
    const rec = {};
    const r = await drive('post', '/:coupleId', { vendor_name: 'Aanya Studio' }, rec);
    if (r.status === 400) return 'POST now refuses a booking with no category — a regression';
    if (!rec.inserted || rec.inserted.category !== 'other') {
      return `omitted category resolved to '${rec.inserted && rec.inserted.category}'`;
    }
    if (!VENDOR_CATEGORIES.includes('other')) return "'other' is not in the one home";
    return true;
  });

  // ── REPORT ────────────────────────────────────────────────────────────────
  console.log('\nF-15.10 · COUPLE CATEGORY VOCABULARY BENCH\n' + '─'.repeat(72));
  console.log(`  one home: src/agent/categories.js — ${VENDOR_CATEGORIES.length} tokens`);
  console.log(`  retired set under test: ${RETIRED.length} tokens, witnessed at PUBLIC_SCHEMA.md:1373`);
  console.log('─'.repeat(72));
  for (const r of results) console.log('  ' + r);
  console.log('─'.repeat(72));
  console.log(`  ${pass}/${pass + fail} cells green\n`);
  process.exit(fail === 0 ? 0 : 1);
})();
