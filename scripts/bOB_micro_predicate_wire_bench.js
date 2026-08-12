#!/usr/bin/env node
// scripts/bOB_micro_predicate_wire_bench.js
// ARC OB · CE-32 · THE PREDICATE-WIRE MICRO — the bench for all four items.
//
// ═══ WHAT THIS PROVES ═══════════════════════════════════════════════════════
//   ① couple/onboarding.js validates through brideComplete — 400 INCOMPLETE +
//     missing[], 'complete' written only when true, refusal ATOMIC
//   ② the vendor 400 INCOMPLETE carries allowed[] beside missing[]
//   ③ both lanes' profile GETs carry onboarding { complete, missing[] },
//     computed server-side, and the VERDICT DISAGREES WITH THE MARKER on
//     exactly the rows the arc exists to repair
//   ④ the vendor profile GET carries `category` (OB-P's prefill) — PINNED, not
//     built: it was already true at the base tip, and a cure with no disease is
//     a byte that misleads the next reader. See §4.
//
// NO DATABASE. Every cell drives THE SHIPPED HANDLER, pulled off express's own
// router stack, against a fake supabase — not a copy of the logic. The one
// exception is §5, which reads source text, and reads it COMMENT-STRIPPED
// (comment-blindness law: an assertion that a string is absent from a file is
// false the moment the string appears in a comment explaining its absence).
'use strict';

const path = require('path');
const fs   = require('fs');
const ROOT = path.join(__dirname, '..');

let pass = 0, fail = 0;
const failures = [];

function record(id, label, verdict) {
  if (verdict === true) { pass++; console.log(`  ok   ${id} ${label}`); return; }
  fail++;
  const why = typeof verdict === 'string' ? verdict : 'returned a falsy value';
  failures.push(`${id} ${label} — ${why}`);
  console.log(`  FAIL ${id} ${label}\n         ${why}`);
}
function cell(id, label, fn) {
  let v; try { v = fn(); } catch (e) { v = `threw: ${e && e.message}`; }
  record(id, label, v);
}
async function acell(id, label, fn) {
  let v; try { v = await fn(); } catch (e) { v = `threw: ${e && e.message}`; }
  record(id, label, v);
}

// Source read, comments stripped, STRING LITERALS PRESERVED.
//
// ⚠ BENCH DEFECT B-1, SELF-CAUGHT AT FIRST RUN, ON THE RECORD. The first draft
// of this function BLANKED string literals to stop a `//` inside a sentence
// being read as a comment opener. That made it useless for the only two cells
// that needed it: 4.2 asks whether `'category'` appears in LOCKED_FIELDS, and a
// stripper that erases every quoted string answers "no" about correct code. A
// cell that reddens on the right answer is broken, not strict (B-1's own
// lesson, restated at a new site). This walks the source instead, so a comment
// is removed and a string survives whole.
function stripComments(raw) {
  let out = '';
  let i = 0;
  const n = raw.length;
  while (i < n) {
    const c = raw[i], d = raw[i + 1];
    if (c === '/' && d === '/') { while (i < n && raw[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(raw[i] === '*' && raw[i + 1] === '/')) i++; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; out += raw[i++];
      while (i < n) {
        if (raw[i] === '\\') { out += raw[i] + (raw[i + 1] || ''); i += 2; continue; }
        out += raw[i];
        if (raw[i] === q) { i++; break; }
        i++;
      }
      continue;
    }
    out += raw[i++];
  }
  return out;
}
function readStripped(rel) { return stripComments(fs.readFileSync(path.join(ROOT, rel), 'utf8')); }
function readRaw(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

// ── Handler extraction, the D-2 bench's own shape ──────────────────────────
function finalHandler(routerModule, method, routePath) {
  const layer = routerModule.stack.find(
    (l) => l.route && l.route.path === routePath && l.route.methods[method]
  );
  return layer && layer.route.stack[layer.route.stack.length - 1].handle;
}

// A response double that resolves a deferred, because asyncHandler does not
// return its promise. A handler that never answers fails on the timeout rather
// than hanging the run.
async function drive(handler, req) {
  let resolve;
  const answered = new Promise((r) => { resolve = r; });
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this; },
    json(payload) { resolve({ status: this.statusCode, body: payload }); return this; },
  };
  handler(req, res, (e) => resolve({ status: 500, body: { ok: false, error: String(e && e.message) } }));
  return Promise.race([
    answered,
    new Promise((r) => setTimeout(() => r({ status: 0, body: { ok: false, error: 'the handler never answered' } }), 4000)),
  ]);
}

const P = require(path.join(ROOT, 'src/lib/onboardingPredicate'));

console.log('\n══════════════════════════════════════════════════════════════');
console.log('bOB_micro_predicate_wire_bench — ARC OB · CE-32 · the four items');
console.log('══════════════════════════════════════════════════════════════');

(async function run() {

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n=== §1 · ITEM ① — THE BRIDE ENDPOINT, CURED (F-OB.10) ===');
  // ═══════════════════════════════════════════════════════════════════════

  const brideRouter  = require(path.join(ROOT, 'src/api/couple/onboarding'));
  const brideHandler = finalHandler(brideRouter, 'post', '/');

  function brideDb({ user, coupleRow, failNameWrite = false, failCoupleWrite = false }) {
    const writes = { users: [], couples: [], notes: [] };
    const db = {
      from(table) {
        return {
          select() {
            return { eq() { return { maybeSingle: async () => {
              if (table === 'users')   return { data: user };
              if (table === 'couples') return { data: coupleRow };
              return { data: null };
            } }; } };
          },
          update(payload) {
            return { eq: async () => {
              if (table === 'users'   && failNameWrite)   return { error: { message: 'boom' } };
              if (table === 'couples' && failCoupleWrite) return { error: { message: 'boom' } };
              writes[table].push(payload);
              return { error: null };
            } };
          },
          insert: async (payload) => { writes.notes.push(...[].concat(payload)); return { error: null }; },
        };
      },
    };
    return { db, writes };
  }

  async function callBride({ body, user = null, coupleRow = null, ...rest }) {
    const { db, writes } = brideDb({ user, coupleRow, ...rest });
    const req = {
      body,
      coupleUser: { couple_id: 'c-1', user_id: 'u-1' },
      app: { locals: { supabase: db } },
    };
    const answer = await drive(brideHandler, req);
    return { ...answer, writes };
  }

  const VIRGIN_COUPLE = { budget_total: null };

  await acell('1.1', 'the route handler is REACHABLE — these cells drive shipped code', async () =>
    typeof brideHandler === 'function' || 'the real handler was not found on the router stack');

  await acell('1.2', 'F-OB.10 REPRODUCED AND REFUSED: an EMPTY body no longer completes anything', async () => {
    // THE UNCURED SHAPE. At the base tip this returned 200 and wrote
    // onboarding_state='complete' over a couple holding nothing at all —
    // `const updates = { onboarding_state: 'complete' }` was the first key of
    // the object. That is the finding, and this is its cell.
    const r = await callBride({ body: {}, user: { name: null }, coupleRow: VIRGIN_COUPLE });
    return (r.status === 400 && r.body.code === 'INCOMPLETE' && r.body.ok === false)
      || `an empty body got ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('1.3', 'the refusal is ATOMIC — an incomplete submission writes NOTHING, not even a note', async () => {
    const r = await callBride({
      body: { wedding_city: 'Delhi', partner_name: 'Arjun', wedding_date: '2027-02-14' },
      user: { name: null }, coupleRow: VIRGIN_COUPLE,
    });
    const total = r.writes.users.length + r.writes.couples.length + r.writes.notes.length;
    return (r.status === 400 && total === 0)
      || `status=${r.status} writes=${JSON.stringify(r.writes)}`;
  });

  await acell('1.4', 'missing[] is HONEST and in BRIDE_FIELDS order', async () => {
    const r = await callBride({ body: {}, user: { name: null }, coupleRow: VIRGIN_COUPLE });
    return (r.body.missing.join(',') === P.BRIDE_FIELDS.join(','))
      || `vocabulary=${P.BRIDE_FIELDS.join(',')} got=${JSON.stringify(r.body.missing)}`;
  });

  await acell('1.5', 'a name with no budget is INCOMPLETE — and says which one', async () => {
    const r = await callBride({ body: { name: 'Priya' }, user: { name: null }, coupleRow: VIRGIN_COUPLE });
    return (r.status === 400 && r.body.missing.join(',') === 'budget')
      || `got ${r.status} ${JSON.stringify(r.body.missing)}`;
  });

  await acell('1.6', 'a budget with no name is INCOMPLETE — the nameless-bride disease at its door', async () => {
    const r = await callBride({ body: { budget_total: 1500000 }, user: { name: null }, coupleRow: VIRGIN_COUPLE });
    return (r.status === 400 && r.body.missing.join(',') === 'name')
      || `got ${r.status} ${JSON.stringify(r.body.missing)}`;
  });

  await acell('1.7', "COMPLETE writes 'complete' — and only the predicate can say so", async () => {
    const r = await callBride({
      body: { name: 'Priya', budget_total: 1500000 },
      user: { name: null }, coupleRow: VIRGIN_COUPLE,
    });
    const w = r.writes.couples[0] || {};
    return (r.status === 200 && r.body.ok === true
            && w.onboarding_state === 'complete' && w.budget_total === 1500000
            && r.writes.users[0] && r.writes.users[0].name === 'Priya')
      || `status=${r.status} couples=${JSON.stringify(w)} users=${JSON.stringify(r.writes.users)}`;
  });

  await acell('1.8', "the ENDPOINT'S COERCION refuses a zero from the body — a blank numeric input is not an answer", async () => {
    // ⚠ HONEST LABEL, AFTER THE MUTATION RUN. This cell was first written as
    // "ZERO is refused as a budget" and claimed to prove the PREDICATE's money
    // arm. It does not: coerceBudget resolves 0 to undefined before the
    // predicate is ever consulted, so loosening `moneyPresent` to `v >= 0` left
    // this cell GREEN. That is defence in depth in the code and a false claim in
    // the bench. The cell keeps its subject — the endpoint's coercion — under a
    // label that says so, and 1.15 below reaches the predicate arm it used to
    // claim. Found by running, not by reading.
    const r = await callBride({ body: { name: 'Priya', budget_total: 0 }, user: { name: null }, coupleRow: VIRGIN_COUPLE });
    return (r.status === 400 && r.body.missing.includes('budget'))
      || `zero passed: ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('1.15', "THE PREDICATE'S money arm is REACHED — a zero already ON FILE is still not a budget", async () => {
    // The route to moneyPresent that coerceBudget cannot intercept: the body
    // sends no budget at all, so the candidate comes from the ROW, and a row
    // holding 0 goes to the predicate unmodified. This is the cell that reddens
    // when `v > 0` is loosened to `v >= 0`.
    const r = await callBride({ body: { name: 'Priya' }, user: { name: null }, coupleRow: { budget_total: 0 } });
    return (r.status === 400 && r.body.missing.join(',') === 'budget')
      || `a stored zero read as a budget: ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('1.9', 'a WHITESPACE name is refused — a bride whose name is a space has not told us it', async () => {
    const r = await callBride({ body: { name: '   ', budget_total: 900000 }, user: { name: null }, coupleRow: VIRGIN_COUPLE });
    return (r.status === 400 && r.body.missing.includes('name'))
      || `whitespace passed: ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('1.16', "THE PREDICATE'S text arm is REACHED — a whitespace name ALREADY ON FILE is not a name", async () => {
    // Same shape as 1.15, same reason. `trimmedOr` refuses whitespace arriving
    // in the BODY, so the body route can never reach `textPresent` — the first
    // mutation run proved that by staying green when textPresent was loosened.
    // The row route can: trimmedOr returns its fallback UNMODIFIED, so a stored
    // '   ' travels intact to the predicate, which is the only thing standing
    // between it and a bride recorded as complete with a blank name.
    const r = await callBride({ body: { budget_total: 900000 }, user: { name: '   ' }, coupleRow: VIRGIN_COUPLE });
    return (r.status === 400 && r.body.missing.join(',') === 'name')
      || `a stored whitespace name read as a name: ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('1.10', 'BODY OVER ROW — a returning bride is not re-asked for what is already on file', async () => {
    // She set her budget last week and sends only her name today. Validating the
    // body alone would refuse her for a fact the estate already holds.
    const r = await callBride({
      body: { name: 'Priya' }, user: { name: null }, coupleRow: { budget_total: 800000 },
    });
    return (r.status === 200 && r.body.ok === true)
      || `a returning bride was refused: ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('1.11', 'the OPTIONAL fields still do not gate (R-OB.6 — an optional field that blocks the door is mandatory)', async () => {
    const r = await callBride({
      body: { name: 'Priya', budget_total: 500000 },
      user: { name: null }, coupleRow: VIRGIN_COUPLE,
    });
    const w = r.writes.couples[0] || {};
    return (r.status === 200 && !('wedding_date' in w) && !('wedding_city' in w) && !('partner_name' in w))
      || `status=${r.status} write=${JSON.stringify(w)}`;
  });

  await acell('1.12', 'the NAME write is FATAL and lands BEFORE couples — no false 「 Profile complete. 」', async () => {
    // The old shape wrote users LAST and swallowed its error, because `couples`
    // was already committed. Under the atomic rule nothing is committed yet, so
    // a failed name write must be said out loud — and must not leave a
    // 'complete' marker over a bride whose name never saved.
    const r = await callBride({
      body: { name: 'Priya', budget_total: 500000 },
      user: { name: null }, coupleRow: VIRGIN_COUPLE, failNameWrite: true,
    });
    return (r.status === 500 && r.writes.couples.length === 0)
      || `status=${r.status} couples written=${r.writes.couples.length}`;
  });

  await acell('1.13', 'the note fires on a CHANGE, not on every resubmission', async () => {
    const r = await callBride({
      body: { name: 'Priya', budget_total: 800000 },
      user: { name: 'Priya' }, coupleRow: { budget_total: 800000 },
    });
    return (r.status === 200 && r.writes.notes.length === 0)
      || `a resubmission of unchanged facts minted ${r.writes.notes.length} note(s)`;
  });

  cell('1.14', 'the bride endpoint REQUIRES the one home and holds no local predicate', () => {
    const code = readStripped('src/api/couple/onboarding.js');
    const requiresHome = /require\(['"][^'"]*onboardingPredicate['"]\)/.test(code)
                      && /brideComplete\(/.test(code);
    const reDerives = /function\s+brideComplete/.test(code);
    return (requiresHome && !reDerives)
      || `requiresHome=${requiresHome} reDerives=${reDerives}`;
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n=== §2 · ITEM ② — allowed[] ON THE VENDOR 400 INCOMPLETE ===');
  // ═══════════════════════════════════════════════════════════════════════

  const vendorRouter  = require(path.join(ROOT, 'src/api/vendor/onboarding'));
  const vendorHandler = finalHandler(vendorRouter, 'post', '/');

  function vendorDb({ user, vendorRow }) {
    const writes = { users: [], vendors: [], vendor_state: [] };
    const db = {
      from(table) {
        return {
          select() {
            return { eq(col) { return { maybeSingle: async () => {
              if (table === 'users') return { data: user };
              if (table === 'vendors' && col === 'routing_handle') return { data: null };
              if (table === 'vendors') return { data: vendorRow };
              return { data: null };
            } }; } };
          },
          update(payload) { return { eq: async () => { writes[table].push(payload); return { error: null }; } }; },
          upsert: async (payload) => { writes[table].push(payload); return { error: null }; },
        };
      },
    };
    return { db, writes };
  }

  async function callVendor({ body, user, vendorRow }) {
    const { db, writes } = vendorDb({ user, vendorRow });
    const req = { body, vendor: vendorRow, app: { locals: { supabase: db } } };
    const answer = await drive(vendorHandler, req);
    return { ...answer, writes };
  }

  const VENDOR_USER = { name: 'Swati', phone: '+919888294440' };
  const VIRGIN_VENDOR = { id: 'v-1', user_id: 'u-1', business_name: null, category: null, city: null,
                          rate_min: null, service_area: null, service_cities: null,
                          routing_handle: null, instagram_handle: null };

  await acell('2.1', 'the 400 INCOMPLETE now carries allowed[] BESIDE missing[]', async () => {
    const r = await callVendor({ body: { city: 'Delhi' }, user: { name: null }, vendorRow: VIRGIN_VENDOR });
    return (r.status === 400 && r.body.code === 'INCOMPLETE'
            && Array.isArray(r.body.missing) && Array.isArray(r.body.allowed))
      || `got ${r.status} ${JSON.stringify(r.body)}`;
  });

  await acell('2.2', 'allowed[] IS the estate taxonomy — the cell enumerates it itself (R-31.1)', async () => {
    // The cell does not repeat a list the author typed: it reads the canonical
    // array and compares. A second, narrower list inside the endpoint would
    // redden here — which is the drift a mirrored map produces (F-04.36).
    const { VENDOR_CATEGORIES } = require(path.join(ROOT, 'src/agent/categories'));
    const r = await callVendor({ body: { city: 'Delhi' }, user: { name: null }, vendorRow: VIRGIN_VENDOR });
    return (r.body.allowed.join(',') === VENDOR_CATEGORIES.join(','))
      || `taxonomy=${VENDOR_CATEGORIES.join(',')} allowed=${(r.body.allowed || []).join(',')}`;
  });

  await acell('2.3', 'THE DRIFT-PROOF CELL — a token added server-side reaches the picker with NO pwa edit', async () => {
    // The acceptance names this one. The taxonomy module is mutated IN MEMORY,
    // its require cache busted, and the endpoint re-required — proving the
    // endpoint READS the list rather than holding a copy. If allowed[] were a
    // literal in the endpoint, the new token would not appear.
    const catPath = require.resolve(path.join(ROOT, 'src/agent/categories'));
    const original = require(catPath).VENDOR_CATEGORIES.slice();
    require(catPath).VENDOR_CATEGORIES.push('drone_pilot');
    delete require.cache[require.resolve(path.join(ROOT, 'src/api/vendor/onboarding'))];
    const freshRouter  = require(path.join(ROOT, 'src/api/vendor/onboarding'));
    const freshHandler = finalHandler(freshRouter, 'post', '/');
    const { db } = vendorDb({ user: { name: null }, vendorRow: VIRGIN_VENDOR });
    const r = await drive(freshHandler, { body: { city: 'Delhi' }, vendor: VIRGIN_VENDOR, app: { locals: { supabase: db } } });

    // ⚠ SNAPSHOT BEFORE RESTORING. BENCH DEFECT B-2, SELF-CAUGHT AT FIRST RUN:
    // the endpoint sends the canonical array BY REFERENCE (harmless in
    // production — res.json serialises immediately — but not here), so
    // restoring the taxonomy also rewrote `r.body.allowed` and the cell read
    // eleven tokens on correct code. The first draft therefore reddened on the
    // right answer. Copy first, restore second, assert third.
    const observed = Array.isArray(r.body.allowed) ? r.body.allowed.slice() : null;

    // restore before asserting, so a failure cannot poison later cells
    const arr = require(catPath).VENDOR_CATEGORIES;
    arr.length = 0; arr.push(...original);
    delete require.cache[require.resolve(path.join(ROOT, 'src/api/vendor/onboarding'))];
    return (observed && observed.includes('drone_pilot'))
      || `a token added to the taxonomy did NOT reach allowed[]: ${JSON.stringify(observed)}`;
  });

  await acell('2.4', 'allowed[] rides UNCONDITIONALLY — present even when category is NOT the missing field', async () => {
    // A picker that has options on some refusals and not others is a picker
    // whose author will cache the list locally to cover the gap.
    const r = await callVendor({
      body: { name: 'Swati', business_name: 'Studio', category: 'photography', city: 'Delhi', rate_min: 80000 },
      user: VENDOR_USER, vendorRow: VIRGIN_VENDOR,
    });
    return (r.status === 400 && r.body.missing.join(',') === 'service_area'
            && Array.isArray(r.body.allowed) && r.body.allowed.length === 11)
      || `missing=${JSON.stringify(r.body.missing)} allowed=${JSON.stringify(r.body.allowed)}`;
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n=== §3 · ITEM ③ — THE VERDICT ON THE WIRE, BOTH LANES ===');
  // ═══════════════════════════════════════════════════════════════════════

  const vendorMe    = require(path.join(ROOT, 'src/api/vendor/me'));
  const vendorMeGet = finalHandler(vendorMe, 'get', '/');
  const coupleMe    = require(path.join(ROOT, 'src/api/couple/me'));
  const coupleMeGet = finalHandler(coupleMe, 'get', '/');
  const coupleMeById = finalHandler(coupleMe, 'get', '/:coupleId');

  function meDb({ user, coupleRow }) {
    return {
      from(table) {
        return {
          select() {
            return { eq() { return { maybeSingle: async () => {
              if (table === 'admin_config') return { data: null };
              if (table === 'users')        return { data: user };
              if (table === 'couples')      return { data: coupleRow };
              return { data: null };
            } }; } };
          },
        };
      },
    };
  }

  // A vendor row whose MARKER LIES: onboarding_state says complete, the facts
  // say otherwise. These are the four live rows the arc exists to repair.
  const LYING_VENDOR = { id: 'v-9', user_id: 'u-9', business_name: null, category: 'photography',
                         city: 'Delhi', rate_min: null, service_area: null, service_cities: null,
                         onboarding_state: 'complete' };
  const HONEST_VENDOR = { ...LYING_VENDOR, business_name: 'Swati Roy Studio', rate_min: 80000,
                          service_area: 'pan_india' };

  await acell('3.1', 'the vendor GET carries onboarding { complete, missing[] }', async () => {
    const req = { vendor: HONEST_VENDOR, app: { locals: { supabase: meDb({ user: { name: 'Swati' } }) } } };
    const r = await drive(vendorMeGet, req);
    const o = r.body.vendor && r.body.vendor.onboarding;
    return (o && o.complete === true && Array.isArray(o.missing) && o.missing.length === 0)
      || `got ${JSON.stringify(o)}`;
  });

  await acell('3.2', 'THE LYING MARKER IS OVERRULED — marker says complete, the verdict says otherwise', async () => {
    // The cell the whole of item ③ exists for. A guard trusting the marker as a
    // cheap negative filter waves exactly this row through forever, and it is
    // precisely the row the backfill-on-login promise is owed to.
    const req = { vendor: LYING_VENDOR, app: { locals: { supabase: meDb({ user: { name: 'Swati' } }) } } };
    const r = await drive(vendorMeGet, req);
    const v = r.body.vendor;
    return (v.onboarding_state === 'complete' && v.onboarding.complete === false
            && v.onboarding.missing.join(',') === 'business_name,starting_price,service_area')
      || `marker=${v.onboarding_state} verdict=${JSON.stringify(v.onboarding)}`;
  });

  await acell('3.3', 'the vendor GET verdict reads users.name, not the vendor row', async () => {
    const req = { vendor: HONEST_VENDOR, app: { locals: { supabase: meDb({ user: { name: null } }) } } };
    const r = await drive(vendorMeGet, req);
    return (r.body.vendor.onboarding.missing.includes('name'))
      || `a nameless vendor read complete: ${JSON.stringify(r.body.vendor.onboarding)}`;
  });

  const LYING_COUPLE = { id: 'c-9', onboarding_state: 'complete', planning_state: null,
                         wedding_date: null, wedding_city: null, partner_name: null,
                         budget_total: null, users: { name: null } };

  await acell('3.4', 'the bare couple GET carries the verdict, and overrules its lying marker too', async () => {
    const req = { coupleUser: { couple_id: 'c-9' }, app: { locals: { supabase: meDb({ coupleRow: LYING_COUPLE }) } } };
    const r = await drive(coupleMeGet, req);
    const c = r.body.couple;
    return (c.onboarding_state === 'complete' && c.onboarding.complete === false
            && c.onboarding.missing.join(',') === 'name,budget')
      || `marker=${c.onboarding_state} verdict=${JSON.stringify(c.onboarding)}`;
  });

  await acell('3.5', 'the bare couple GET STRIPS the users join — one key gained, no nested relation leaked', async () => {
    const req = { coupleUser: { couple_id: 'c-9' }, app: { locals: { supabase: meDb({ coupleRow: LYING_COUPLE }) } } };
    const r = await drive(coupleMeGet, req);
    return (!('users' in r.body.couple) && 'onboarding' in r.body.couple)
      || `response shape: ${Object.keys(r.body.couple).join(',')}`;
  });

  await acell('3.6', 'the /:coupleId GET carries the SAME verdict — one lane, one answer', async () => {
    const complete = { ...LYING_COUPLE, budget_total: 1200000, users: { name: 'Priya' } };
    const reqA = { params: { coupleId: 'c-9' }, coupleUser: { couple_id: 'c-9' },
                   app: { locals: { supabase: meDb({ coupleRow: complete }) } } };
    const reqB = { coupleUser: { couple_id: 'c-9' },
                   app: { locals: { supabase: meDb({ coupleRow: complete }) } } };
    const a = await drive(coupleMeById, reqA);
    const b = await drive(coupleMeGet, reqB);
    return (JSON.stringify(a.body.couple.onboarding) === JSON.stringify(b.body.couple.onboarding)
            && a.body.couple.onboarding.complete === true)
      || `byId=${JSON.stringify(a.body.couple.onboarding)} bare=${JSON.stringify(b.body.couple.onboarding)}`;
  });

  cell('3.7', 'neither me.js re-derives completeness — both require the one home', () => {
    const offenders = [];
    for (const f of ['src/api/vendor/me.js', 'src/api/couple/me.js']) {
      const code = readStripped(f);
      const requires = /onboardingPredicate/.test(readRaw(f));
      const usesHome = /vendorComplete\(|brideComplete\(/.test(code);
      if (!requires || !usesHome) offenders.push(`${f} requires=${requires} usesHome=${usesHome}`);
    }
    return offenders.length === 0 || offenders.join(' · ');
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n=== §4 · ITEM ④ — category ON THE VENDOR GET (PINNED, NOT BUILT) ===');
  // ═══════════════════════════════════════════════════════════════════════
  // §0.2 REPORT, ON THE RECORD IN THE BENCH THAT WOULD HAVE PROVED THE CURE:
  // item ④ asked for `category` to join the vendor profile GET's select. IT WAS
  // ALREADY THERE at the base tip — resolveVendor() selects '*', and the GET has
  // reported `category` since before this arc opened. The read-first's F-3 named
  // the PATCH echo's select, which is a DIFFERENT statement and correctly omits
  // category, because category is in LOCKED_FIELDS and the PATCH can never write
  // it — echoing it there would echo a field the endpoint refuses.
  //
  // So no byte was authored for ④. What ships instead is this pin, because the
  // prefill OB-P depends on is now load-bearing and must not vanish quietly.

  await acell('4.1', 'the vendor GET reports `category` — OB-P\'s picker prefill, pinned', async () => {
    const req = { vendor: HONEST_VENDOR, app: { locals: { supabase: meDb({ user: { name: 'Swati' } }) } } };
    const r = await drive(vendorMeGet, req);
    return ('category' in r.body.vendor && r.body.vendor.category === 'photography')
      || `category absent or wrong: ${JSON.stringify(r.body.vendor.category)}`;
  });

  cell('4.2', 'category stays LOCKED against PATCH — set-once-here (F-5 ratified)', () => {
    const code = readStripped('src/api/vendor/me.js');
    const m = code.match(/LOCKED_FIELDS\s*=\s*\[([^\]]*)\]/);
    return (m && m[1].includes('category'))
      || 'category is no longer in LOCKED_FIELDS — the settings screen could now offer it';
  });

  // ═══════════════════════════════════════════════════════════════════════
  console.log('\n=== §5 · THE REFUSAL BYTE — ONE HOME, BOTH LANES ===');
  // ═══════════════════════════════════════════════════════════════════════

  cell('5.1', 'INCOMPLETE_REFUSAL is frozen at the byte, at its one home', () =>
    P.INCOMPLETE_REFUSAL === 'A few details are still needed before your profile is live.'
    || `the vetoed byte moved: ${JSON.stringify(P.INCOMPLETE_REFUSAL)}`);

  cell('5.2', 'NEITHER endpoint declares a local copy of it (comment-blind)', () => {
    const offenders = [];
    for (const f of ['src/api/vendor/onboarding.js', 'src/api/couple/onboarding.js']) {
      const code = readStripped(f);
      if (/INCOMPLETE_REFUSAL\s*=\s*['"]/.test(code)) offenders.push(f);
    }
    return offenders.length === 0
      || `a second copy of the vetoed sentence is declared in: ${offenders.join(', ')}`;
  });

  await acell('5.3', 'both lanes REFUSE IN THE SAME WORDS — proved through both handlers', async () => {
    const bride  = await callBride({ body: {}, user: { name: null }, coupleRow: VIRGIN_COUPLE });
    const vendor = await callVendor({ body: {}, user: { name: null }, vendorRow: VIRGIN_VENDOR });
    return (bride.body.error === vendor.body.error && bride.body.error === P.INCOMPLETE_REFUSAL)
      || `bride=${JSON.stringify(bride.body.error)} vendor=${JSON.stringify(vendor.body.error)}`;
  });

  // ── VERDICT ──────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`bOB_micro_predicate_wire_bench: ${pass} passed, ${fail} failed`);
  if (fail > 0) { console.log('\nFAILURES:'); failures.forEach((f) => console.log(`  · ${f}`)); }
  console.log(`VERDICT: ${fail === 0 ? 'GREEN' : 'RED'}`);
  console.log('══════════════════════════════════════════════════════════════\n');
  process.exit(fail === 0 ? 0 : 1);
})();
