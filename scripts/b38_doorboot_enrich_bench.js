#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b38_doorboot_enrich_bench.js
// M-DOORBOOT · F-16.29 (the harness) + F-16.30 / R-37.32 (enrich-on-dedupe)
//
// ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
// F-16.29: until this file, NO INSTRUMENT IN THE ESTATE EXECUTED THE ENQUIRY
// DOOR. `grep -rnE "require\([^)]*enquire" scripts/` returned zero; every one
// of the ~60 references to that path in scripts/ was read()/readRaw()/mutateSrc()
// — text. The proof of the cost is F-16.28: an unbound identifier
// (`postedBudgetMin`) survived `node --check` (which parses and does not run),
// a 35/35 bench (whose door cells grep the SOURCE for the assignment, so the
// string was always going to be present), the engine gate (a different plane),
// and a full floor. Every claim about that door's behaviour was a claim about
// a string.
//
// ── THE FOUNDING PROVENANCE (R-37.33) ───────────────────────────────────────
// This harness's decisive test was run at read-first and is quoted here as its
// founding evidence, both directions, on throwaway worktrees:
//
//   673831a (pre-cure)  RED   [enquire] createLead threw: postedBudgetMin is
//                             not defined · HTTP 200 · leads inserts: 0
//   1c7f3a5 (cured)     GREEN HTTP 200 · leads inserts: 1 ·
//                             budget_min 1000000 · budget_max null
//
// AND THE CORRECTION THAT CAME WITH IT (c-37.5, chair-owned). The P0's own
// commit message and the kickoff both state the pre-cure door "returned 500".
// IT DID NOT. The throw is caught at enquire.js's `catch (err)` around the
// createLead call; the handler proceeds and answers HTTP 200 with ok:false,
// losing the lead in silence — worse than the failure that was claimed, and
// asserted by a record no instrument had ever observed. F-16.29 describing
// itself. §1.1 below is that reproduction, permanent.
//
// ── THE BAR FOR THIS SITTING, stated so it cannot soften ────────────────────
// DOOR CELLS EXECUTE. A cell that reads source for its assertion is the disease
// this sitting cures. Where a fact is genuinely structural rather than
// behavioural (§10's disposition table), the cell reads CODE — the exported
// constants — never prose, and says so.
//
// ── HOW IT RUNS WITH NO DATABASE AND NO CREDENTIAL ──────────────────────────
// The b05_f0589 pattern, one door over: the real express router on an ephemeral
// loopback port, a RECORDING in-memory supabase fake, and `sendWa` stubbed at
// the module registry so no Meta send is attempted. The two env values below
// are PLACEHOLDER LITERALS, never a read of a real environment (secrets law) —
// `src/engine/src/core/db.ts` constructs a client at module load and throws
// without them. It needs the engine BUILT (`npm run build:engine`, already the
// delivery gate) because the door's module graph reaches engine/dist.
//
// IT RUNS ON A DIRTY TREE. It reads no floor and mutates nothing at rest, so
// the founder can satisfy the verify line at his apply moment, before commit
// (the F-05.89 seat's banked lesson).
//
// Run: node scripts/b38_doorboot_enrich_bench.js
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

process.env.SUPABASE_URL = 'http://127.0.0.1:1/bench-placeholder-not-a-credential';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'bench-placeholder-not-a-credential';

const path    = require('path');
const http    = require('http');
const assert  = require('assert');
const express = require('express');

const ROOT = path.join(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);

// ── THE TRANSPORT STUB IS SEATED BEFORE THE DOOR LOADS ──────────────────────
// The door `require`s sendWa at module load, so the stub must win the reference
// or the real module does. Recorded, because §8 reads what the vendor was told.
const SENT = [];
const sendWaPath = require.resolve(P('src/lib/sendWa.js'));
class WaWindowClosedError extends Error {}
require.cache[sendWaPath] = {
  id: sendWaPath, filename: sendWaPath, loaded: true,
  exports: {
    sendWa: async (_sb, args) => { SENT.push(args); return { sent: true, stubbed: true }; },
    WaWindowClosedError,
  },
};

const leadsLib = require(P('src/lib/vendor/leads.js'));
const { createLead, LEAD_RETURN_KEYS, ENRICH_KEYS, ENRICH_REFUSED_KEYS, NON_COLUMN_PARAMS, ENRICH_PAIRS } = leadsLib;

let pass = 0, fail = 0;
const reds = [];
async function t(id, name, fn) {
  try { await fn(); console.log(`  ok   ${id}  ${name}`); pass++; }
  catch (e) { console.log(`  RED  ${id}  ${name}\n        — ${e && e.message}`); fail++; reds.push(`${id} ${name}`); }
}

// ── RECORDING SUPABASE FAKE ─────────────────────────────────────────────────
// Faithful enough to reach the real branches, and it REMEMBERS every write.
//
// [VACUITY HOLE INHERITED AND CLOSED BEFORE IT COULD BITE] The F-05.89 seat
// found its recorder destroying its own evidence: `JSON.stringify` DROPS keys
// whose value is `undefined`, so a seam writing `{name: undefined}` recorded as
// no name write at all, and a cell stayed green over the exact defect it
// existed to catch. That lesson is imported here rather than re-paid for:
// `keys` is captured off the LIVE object before any copy is taken.
// ── THE FAKE HONOURS `.select()` PROJECTION, AND THE REASON IS A RED IT CAUSED ──
// FOUND BY RUNNING, NOT BY READING. The first draft of this fake returned the
// whole stored row from every insert/update/select, ignoring the projection the
// real PostgREST client applies. Cell 7.1 — which compares the dedupe return's
// key set against the create return's — went RED against CORRECT production
// code, because the create side came back carrying `vendor_id`, `notes` and
// `raw_message` that no real caller would ever have received.
//
// A false red is the lucky direction. The same infidelity would have made any
// cell asserting a column's ABSENCE from a wire green over a genuine leak, and
// this bench's whole subject is which columns reach which caller. Recorded
// rather than quietly repaired: an unfaithful fake is a vacuity engine, and the
// F-05.89 seat paid for the same lesson one recorder over.
function project(row, cols) {
  if (!cols) return Object.assign({}, row);
  const out = {};
  for (const c of String(cols).split(',').map((x) => x.trim()).filter(Boolean)) {
    out[c] = row[c] === undefined ? null : row[c];
  }
  return out;
}

function makeSupabase(seed, writes) {
  const store = JSON.parse(JSON.stringify(seed));
  function builder(table) {
    const filters = [];
    let selCols = null;
    const match = () => (store[table] || []).filter(
      (r) => filters.every(([c, v]) => (r[c] ?? null) === (v ?? null)));
    const b = {
      select(c) { selCols = c || null; return b; },
      eq(c, v) { filters.push([c, v]); return b; },
      is(c, v) { filters.push([c, v]); return b; },
      not() { return b; }, neq() { return b; }, order() { return b; },
      limit() { return b; }, range() { return b; }, in() { return b; },
      gte() { return b; }, lte() { return b; },
      maybeSingle() { const m = match(); return Promise.resolve({ data: m[0] ? project(m[0], selCols) : null, error: null }); },
      single() {
        const m = match();
        return Promise.resolve(m.length === 1
          ? { data: project(m[0], selCols), error: null } : { data: null, error: { message: 'not one row' } });
      },
      then(res) { return Promise.resolve({ data: match().map((x) => project(x, selCols)), error: null }).then(res); },
      insert(payload) {
        writes.push({ op: 'insert', table, payload: Object.assign({}, payload), keys: Object.keys(payload) });
        const row = Object.assign({ id: `${table}-${((store[table] || []).length) + 1}` }, payload);
        store[table] = (store[table] || []).concat([row]);
        let cols = null;
        const ret = {
          select(c) { cols = c || null; return ret; },
          single:      () => Promise.resolve({ data: project(row, cols), error: null }),
          maybeSingle: () => Promise.resolve({ data: project(row, cols), error: null }),
          then(r) { return Promise.resolve({ data: [project(row, cols)], error: null }).then(r); },
        };
        return ret;
      },
      update(payload) {
        const apply = () => {
          const hit = match();
          writes.push({
            op: 'update', table, matched: hit.length,
            payload: Object.assign({}, payload),
            keys: Object.keys(payload),   // LIVE object — see the note above
          });
          hit.forEach((r) => Object.assign(r, payload));
          return hit;
        };
        let cols = null;
        const u = {
          eq(c, v) { filters.push([c, v]); return u; },
          is(c, v) { filters.push([c, v]); return u; },
          select(c) { cols = c || null; return u; },
          maybeSingle() { const h = apply(); return Promise.resolve({ data: h[0] ? project(h[0], cols) : null, error: null }); },
          single()      { return u.maybeSingle(); },
          then(r)       { const h = apply(); return Promise.resolve({ data: h.map((x) => project(x, cols)), error: null }).then(r); },
        };
        return u;
      },
      upsert(p) { writes.push({ op: 'upsert', table, payload: p }); return Promise.resolve({ data: null, error: null }); },
      delete() { return { eq: () => Promise.resolve({ data: null, error: null }) }; },
    };
    return b;
  }
  return { from: builder, _store: store };
}

const VENDOR_ID = '23165e38-6510-4639-ab6a-9f35bab93742';
const SARAH     = '+919625759924';

// The standing fixture's SHAPE, mirrored from the founder's own row: a live
// lead on Sarah's phone with a floor recorded and NO ceiling. §3.1 fills that
// ceiling; §4 proves nothing else moves.
const seed = (leads) => ({
  vendors: [{
    id: VENDOR_ID, business_name: 'Dev Roy Photography', user_id: 'u-1',
    category: 'photographer', city: 'Mumbai', tier: 'basic',
    discover_eligible: true, discover_paused: false, routing_handle: 'devroy',
    base_fee_min: null, base_fee_max: null,
  }],
  users: [{ id: 'u-1', phone: '+919888294440', name: 'Dev' }],
  leads: leads || [],
  clients: [], couples: [], couple_enquiries: [], enquiry_taps: [],
  conversations: [], messages: [], invoices: [], events: [], notes: [],
  engagements: [],
});

const liveLead = (over) => Object.assign({
  id: 'lead-sarah', vendor_id: VENDOR_ID, phone: SARAH, name: 'Sarah',
  state: 'new', source: 'discover', email: null,
  wedding_date: null, wedding_date_precision: null, wedding_city: null,
  budget_min: 1000000, budget_max: null, event_types: null,
  raw_message: 'x', notes: 'y', referrer_name: null,
  client_id: null, draft_meta: null, created_at: '2026-08-26T04:00:00Z',
  deleted_at: null,
}, over || {});

// ── DRIVE THE REAL DOOR OVER REAL HTTP ──────────────────────────────────────
async function callDoor(body, leads) {
  const writes = [];
  const app = express();
  app.use(express.json());
  app.locals.supabase = makeSupabase(seed(leads), writes);
  delete require.cache[require.resolve(P('src/api/couple/enquire.js'))];
  app.use('/enquire', require(P('src/api/couple/enquire.js')));
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    const r = await fetch(`http://127.0.0.1:${port}/enquire`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: r.status, json: await r.json().catch(() => ({})), writes,
             store: app.locals.supabase._store };
  } finally { await new Promise((r) => server.close(r)); }
}

// ── DRIVE createLead DIRECTLY (R-37.33 Arm C's unit half) ───────────────────
async function callCreate(params, leads) {
  const writes = [];
  const sb = makeSupabase(seed(leads), writes);
  const out = await createLead(sb, VENDOR_ID, params);
  return { out, writes, store: sb._store };
}

const ENQUIRY = (over) => Object.assign({
  vendor_id: VENDOR_ID, bride_name: 'Sarah', bride_phone: SARAH,
  wedding_date: '2027-02-14', city: 'Delhi',
  budget_band: '1500000', budget_floor: '1000000',
  functions: ['wedding'],
}, over || {});

const leadInserts = (w) => w.filter((x) => x.op === 'insert' && x.table === 'leads');
const leadUpdates = (w) => w.filter((x) => x.op === 'update' && x.table === 'leads');
const rowOf = (s) => s.leads[0];

(async () => {
console.log('\nb38_doorboot_enrich_bench — F-16.29 · F-16.30 · R-37.32→.37\n');

// ══════════════════════════════════════════════════════════════════════════
console.log('§1 · THE DOOR EXECUTES — F-16.29\'s CURE, F-16.28\'s REPRODUCTION');
// These are the cells that would have caught the P0. At 673831a they RED by
// the door's own throw; no grep of any source could have distinguished the
// two trees, because the string `postedBudgetMin` is present in both.

await t('1.1', 'the door BOOTS and files a top-band enquiry end-to-end [the F-16.28 red at 673831a]', async () => {
  const r = await callDoor(ENQUIRY({ budget_band: '', budget_floor: '1000000' }));
  assert.strictEqual(r.status, 200, `HTTP ${r.status}`);
  const ins = leadInserts(r.writes);
  assert.strictEqual(ins.length, 1, `expected 1 leads insert, got ${ins.length} — the door threw and swallowed it`);
  assert.strictEqual(ins[0].payload.budget_min, 1000000,
    `the floor did not reach the row: ${JSON.stringify(ins[0].payload.budget_min)}`);
  assert.strictEqual(ins[0].payload.budget_max, null, 'the top band acquired a ceiling');
});

await t('1.2', 'c-37.5 PINNED: a door failure answers 200 with ok:false — it does NOT 500', async () => {
  // The permanent record of the correction. An unknown vendor is the one
  // refusal shape that IS a status code, which is what makes the contrast
  // meaningful: this door has exactly one 4xx path and the P0 was not on it.
  const r = await callDoor(ENQUIRY({ vendor_id: '00000000-0000-4000-8000-000000000000' }));
  assert.strictEqual(r.status, 404, `expected the ONE refusal status, got ${r.status}`);
  const ok = await callDoor(ENQUIRY());
  assert.strictEqual(ok.status, 200, 'the success path is not 200');
  assert.notStrictEqual(ok.status, 500, 'the door 500s — c-37.5 would need re-reading');
});

await t('1.3', 'no live credential and no network are required to reach the door', async () => {
  assert.ok(/placeholder/.test(process.env.SUPABASE_SERVICE_ROLE_KEY),
    'the bench is reading a real environment — secrets law');
  const r = await callDoor(ENQUIRY());
  assert.strictEqual(r.status, 200);
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§2 · THE CREATE PATH IS UNMOVED (existing behaviour is sacred, §8)');

await t('2.1', 'a FRESH phone still INSERTS, and does not update', async () => {
  const r = await callDoor(ENQUIRY({ bride_phone: '+919000000001' }), [liveLead()]);
  assert.strictEqual(leadInserts(r.writes).length, 1, 'the fresh bride lost her insert');
  assert.strictEqual(leadUpdates(r.writes).length, 0, 'a fresh enquiry touched an existing row');
});

await t('2.2', 'the create path still coalesces — vendor.city and the stock name reach the INSERT', async () => {
  // Deliberately asserted UNCHANGED. R-37.37 governs the ENRICH set only; the
  // create path's fallbacks are old, ruled, and out of this sitting's radius.
  const r = await callDoor(ENQUIRY({ bride_phone: '+919000000002', city: undefined, bride_name: undefined }));
  const p = leadInserts(r.writes)[0].payload;
  assert.strictEqual(p.wedding_city, 'Mumbai', 'the vendor.city fallback left the create path');
  assert.strictEqual(p.name, 'Dream Wedding enquiry', 'the stock name fallback left the create path');
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§3 · ENRICH FILLS WHAT THE LEAD LACKS — R-37.32, per dispositioned field');

// [AMENDED BY ZIP 3 · R-37.40 — RETIRE-WITH-THE-READER] This cell READ:
//   "THE FIXTURE: a null ceiling is filled by her chosen band", driven against
//   a row holding budget_min 1000000 with a null ceiling, asserting the ceiling
//   filled to 1500000. It went GREEN at the ZIP 1 tree and it was ASSERTING
//   F-16.31 — the row it green-lit came to rest at 1000000/1500000, a band the
//   bride never chose. The cell was not wrong about the code; it was wrong
//   about what the code should do, which is the more expensive kind.
//   Its subject moved to §11, where the one-held-one-null case now asserts that
//   NOTHING moves. Re-founded here on a both-null row, which is what this cell
//   was always trying to say: her band lands.
await t('3.1', 'THE FIXTURE: a both-null band is filled WHOLE by her chosen band', async () => {
  const r = await callDoor(ENQUIRY({ budget_floor: '500000', budget_band: '1500000' }),
                           [liveLead({ budget_min: null, budget_max: null })]);
  assert.strictEqual(leadInserts(r.writes).length, 0, 'the dedupe stopped deduping');
  assert.strictEqual(rowOf(r.store).budget_min, 500000, 'the floor did not land');
  assert.strictEqual(rowOf(r.store).budget_max, 1500000,
    `the ceiling stayed ${JSON.stringify(rowOf(r.store).budget_max)} — F-16.30 has returned`);
});

for (const [id, field, posted, expect] of [
  ['3.2', 'wedding_date', { wedding_date: '2027-02-14' }, '2027-02-14'],
  ['3.3', 'wedding_city', { city: 'Delhi' },              'Delhi'],
  ['3.4', 'budget_min',   { budget_floor: '300000' },     300000],
]) {
  await t(id, `a null ${field} is filled from her word`, async () => {
    const r = await callDoor(ENQUIRY(Object.assign({ budget_floor: '', budget_band: '' }, posted)),
                             [liveLead({ [field]: null, budget_min: null })]);
    assert.deepStrictEqual(rowOf(r.store)[field], expect,
      `${field} is ${JSON.stringify(rowOf(r.store)[field])}`);
  });
}

await t('3.5', 'a null event_types is filled, and an EMPTY ARRAY counts as absent [R-37.36 F5.3]', async () => {
  const a = await callDoor(ENQUIRY({ functions: ['sangeet'] }), [liveLead({ event_types: null })]);
  assert.deepStrictEqual(rowOf(a.store).event_types, ['sangeet'], 'a null array was not filled');
  const b = await callDoor(ENQUIRY({ functions: ['haldi'] }), [liveLead({ event_types: [] })]);
  assert.deepStrictEqual(rowOf(b.store).event_types, ['haldi'], 'an empty array was treated as held');
});

await t('3.6', 'the response names WHICH fields were filled', async () => {
  // [AMENDED BY ZIP 3 · R-37.40] Was driven with `budget_max` against a row
  // holding budget_min — a fill the unit rule now refuses. The cell's SUBJECT
  // is the naming of filled fields, not the band, so it moves to a both-null
  // row and keeps both bounds to prove a PAIR reports as two named fields.
  const { out } = await callCreate({
    phone: SARAH, name: 'x',
    enrich: { wedding_city: 'Delhi', budget_min: 500000, budget_max: 1500000 },
  }, [liveLead({ budget_min: null, budget_max: null })]);
  assert.strictEqual(out.enriched, true);
  assert.deepStrictEqual(out.enriched_fields.sort(), ['budget_max', 'budget_min', 'wedding_city']);
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§4 · AND NEVER MOVES WHAT IT HOLDS — the other direction, per field');

for (const [id, field, held, posted] of [
  ['4.1', 'wedding_date', '2026-12-01',        { wedding_date: '2027-02-14' }],
  ['4.2', 'wedding_city', 'Jaipur',            { city: 'Delhi' }],
  ['4.3', 'budget_max',   900000,              { budget_band: '1500000' }],
  ['4.4', 'budget_min',   1000000,             { budget_floor: '300000' }],
  ['4.5', 'name',         'Sarah Chatterjee',  { bride_name: 'Someone Else' }],
  ['4.6', 'event_types',  ['wedding'],         { functions: ['sangeet', 'haldi'] }],
]) {
  await t(id, `a HELD ${field} survives a contradicting enquiry`, async () => {
    const r = await callDoor(ENQUIRY(posted), [liveLead({ [field]: held })]);
    assert.deepStrictEqual(rowOf(r.store)[field], held,
      `${field} MOVED to ${JSON.stringify(rowOf(r.store)[field])} — "never move what it holds" is broken`);
  });
}

await t('4.7', 'when a row holds everything, NO write is issued at all', async () => {
  const full = liveLead({ wedding_date: '2026-12-01', wedding_city: 'Jaipur',
                          budget_max: 900000, budget_min: 1000000, event_types: ['wedding'] });
  const r = await callDoor(ENQUIRY(), [full]);
  assert.strictEqual(leadUpdates(r.writes).length, 0,
    'a no-op enrichment still wrote — updated_at bumps for nothing');
  assert.strictEqual(r.json.lead_enriched, false, 'a no-op enrichment claimed to enrich');
});

await t('4.8', 'the phone is never in play — it MATCHED, so it is equal by construction', async () => {
  const r = await callDoor(ENQUIRY(), [liveLead()]);
  const u = leadUpdates(r.writes);
  for (const w of u) assert.ok(!w.keys.includes('phone'), 'the dedupe key was written');
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§5 · ENRICH ONLY FROM HER WORD, NEVER FROM A FALLBACK — R-37.37');
// This is the section that would have shipped R-37.27's `Unknown` class in a
// new coat. Both cells drive the REAL door, so they prove the door hands the
// UNCOALESCED values — which is the only place that law can be enforced.

await t('5.1', 'a silent city does NOT fill a null with the VENDOR\'s city', async () => {
  const r = await callDoor(ENQUIRY({ city: undefined }), [liveLead({ wedding_city: null })]);
  assert.strictEqual(rowOf(r.store).wedding_city, null,
    `the vendor's own city was written into her row as her answer: ${rowOf(r.store).wedding_city}`);
});

await t('5.2', 'a nameless bride does NOT fill a null name with the stock literal', async () => {
  const r = await callDoor(ENQUIRY({ bride_name: undefined }), [liveLead({ name: null })]);
  assert.strictEqual(rowOf(r.store).name, null,
    `a placeholder was written as her name: ${rowOf(r.store).name}`);
});

await t('5.3', 'and a REAL posted name still fills a genuinely nameless lead', async () => {
  // The other half: 5.2 must not be green because enrichment is dead.
  const r = await callDoor(ENQUIRY({ bride_name: 'Sarah Chatterjee' }), [liveLead({ name: null })]);
  assert.strictEqual(rowOf(r.store).name, 'Sarah Chatterjee', 'her real name did not land');
});

await t('5.4', 'an empty-string answer is not an answer — it never fills a null', async () => {
  const { out, store } = await callCreate({
    phone: SARAH, name: 'x', enrich: { wedding_city: '' },
  }, [liveLead({ wedding_city: null })]);
  assert.strictEqual(store.leads[0].wedding_city, null, 'emptiness was written as an answer');
  assert.strictEqual(out.enriched, false);
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§6 · THE REFUSED KEYS STAY REFUSED — the retired signals stay retired');

// ── 6.1 IS THE SYNTHESIS CELL, AND THE MUTATION HARNESS IS WHAT PROVED IT ───
// This cell looks like a duplicate of 6.3 and it is not. Two SEPARATE things
// keep `source` off a returning bride's row: the disposition table refuses it,
// AND the door never hands it over. Mutating either one alone leaves 6.1 GREEN
// — putting `source` in ENRICH_KEYS bites only 6.3 (the door still passes no
// source, so there is nothing to fill), and making the door pass `source` bites
// nothing at all (the table still refuses it). Only the two together resurrect
// the retired signal, and only this cell sees it.
//
// That is §9's BOTH-SIDES / synthesis law in miniature — F-04.43's specimen was
// "each half worked; together they destroyed a booking." I did not reason my
// way to this; I found it by running the mutations and being unable to make
// 6.1 red, then building the combined mutation to see whether the cell was
// vacuous or load-bearing. It is load-bearing, and it is the only cell in this
// file whose defect requires two hands.
await t('6.1', 'source is NEVER enriched — R-35.35\'s badge routing is not resurrected', async () => {
  const r = await callDoor(ENQUIRY(), [liveLead({ source: null })]);
  assert.strictEqual(rowOf(r.store).source, null,
    'the dedupe now sets source — the badge signal the estate retired is back');
  for (const w of leadUpdates(r.writes)) assert.ok(!w.keys.includes('source'));
});

await t('6.2', 'raw_message and notes are never enriched — a stock sentence is not information', async () => {
  const r = await callDoor(ENQUIRY(), [liveLead({ raw_message: null, notes: null })]);
  assert.strictEqual(rowOf(r.store).raw_message, null, 'boilerplate filled raw_message');
  assert.strictEqual(rowOf(r.store).notes, null, 'boilerplate filled notes');
});

await t('6.3', 'a refused key handed to the option is still refused — the table governs, not the caller', async () => {
  const { store } = await callCreate({
    phone: SARAH, name: 'x',
    enrich: { source: 'discover', notes: 'anything', email: 'a@b.c', referrer_name: 'z' },
  }, [liveLead({ source: null, notes: null, email: null, referrer_name: null })]);
  const row = store.leads[0];
  for (const k of ['source', 'notes', 'email', 'referrer_name']) {
    assert.strictEqual(row[k], null, `${k} was enriched despite its refusal`);
  }
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§7 · THE FULL ROW POST-WRITE — R-37.35, and the snapshot money it cures');

await t('7.1', 'a dedupe hit returns the create path\'s OWN key set, exactly', async () => {
  const fresh  = await callCreate({ phone: '+919000000009', name: 'Fresh' });
  const deduped = await callCreate({ phone: SARAH, name: 'x' }, [liveLead()]);
  assert.deepStrictEqual(
    Object.keys(deduped.out.lead).sort(),
    LEAD_RETURN_KEYS.slice().sort(),
    'the dedupe return drifted from the declared shape');
  assert.deepStrictEqual(
    Object.keys(deduped.out.lead).sort(),
    Object.keys(fresh.out.lead).sort(),
    'the two return shapes disagree — a caller cannot treat them alike');
});

await t('7.2', 'an ENRICHED dedupe hit returns the same shape, post-write', async () => {
  // [AMENDED BY ZIP 3 · R-37.40] Both-null row: the ceiling alone can no longer
  // fill against a held floor. Subject (post-write return shape) is unchanged.
  const { out } = await callCreate({
    phone: SARAH, name: 'x', enrich: { budget_min: 500000, budget_max: 1500000 },
  }, [liveLead({ budget_min: null, budget_max: null })]);
  assert.strictEqual(out.enriched, true);
  assert.deepStrictEqual(Object.keys(out.lead).sort(), LEAD_RETURN_KEYS.slice().sort());
  assert.strictEqual(out.lead.budget_max, 1500000,
    'the returned row is the PRE-write one — F-OB.14\'s witness pattern is not honoured');
});

await t('7.3', 'the SNAPSHOT MONEY reaches Donna — the three-column read\'s live defect, cured', async () => {
  // CONSUMER NAMED: src/api/vendor/leads.js hands `result.lead` to
  // patchLeadSnapshot, which reads `lead.budget_max` for the snapshot line.
  // Against the retired 'id, name, state' select that was `undefined` on
  // EVERY dedupe hit, so the vendor's snapshot silently lost the money.
  const { out } = await callCreate({ phone: SARAH, name: 'x' }, [liveLead({ budget_max: 750000 })]);
  assert.strictEqual(out.deduped, true);
  assert.notStrictEqual(out.lead.budget_max, undefined,
    'budget_max is undefined on a dedupe hit — the snapshot money-loss has returned');
  assert.strictEqual(out.lead.budget_max, 750000);
  assert.strictEqual(out.lead.name, 'Sarah', 'the snapshot line lost the name too');
});

await t('7.4', 'draft_meta is recomputed by the machinery that owns it, never hand-written', async () => {
  // A row missing four of the five expected cells; filling three must move
  // draft_meta.missing rather than leave it asserting what is no longer true.
  const stale = liveLead({
    name: null, wedding_date: null, wedding_city: null, budget_max: null,
    draft_meta: { missing: ['name', 'wedding_date', 'wedding_city', 'budget_max'], source: 'owner' },
  });
  const { out } = await callCreate({
    phone: SARAH, name: 'x',
    enrich: { name: 'Sarah', wedding_date: '2027-02-14', wedding_city: 'Delhi' },
  }, [stale]);
  assert.deepStrictEqual(out.lead.draft_meta.missing, ['budget_max'],
    `draft_meta went stale: ${JSON.stringify(out.lead.draft_meta)}`);
  assert.strictEqual(out.lead.draft_meta.source, 'owner', 'the prior source was erased');
});

await t('7.5', 'filling the LAST missing cell PROMOTES the draft (draft_meta -> null)', async () => {
  // [AMENDED BY ZIP 3 · R-37.40] The row must be both-null for the band to be
  // reachable at all. Subject (last-cell promotion) unchanged; draft_meta's
  // five-field contract carries budget_max and not budget_min, so filling the
  // pair still leaves exactly one cell to promote on.
  const stale = liveLead({
    budget_min: null, budget_max: null, wedding_date: '2027-02-14', wedding_city: 'Delhi',
    draft_meta: { missing: ['budget_max'], source: 'owner' },
  });
  const { out } = await callCreate({
    phone: SARAH, name: 'x', enrich: { budget_min: 500000, budget_max: 1500000 },
  }, [stale]);
  assert.strictEqual(out.lead.draft_meta, null, 'a complete row is still marked a draft');
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§8 · THE WIRE TELLS THE TRUTH — R-37.36, and `ok` held byte-stable');

await t('8.1', 'a CREATE reports created:true enriched:false', async () => {
  const r = await callDoor(ENQUIRY({ bride_phone: '+919000000003' }));
  assert.strictEqual(r.json.lead_created, true);
  assert.strictEqual(r.json.lead_enriched, false);
});

await t('8.2', 'a DEDUPE-WITH-FILL reports created:FALSE enriched:true', async () => {
  const r = await callDoor(ENQUIRY({ budget_band: '1500000' }), [liveLead()]);
  assert.strictEqual(r.json.lead_created, false,
    'the door still claims to have created a row it did not create');
  assert.strictEqual(r.json.lead_enriched, true);
});

await t('8.3', 'a DEDUPE-NO-FILL reports both false', async () => {
  const full = liveLead({ wedding_date: '2026-12-01', wedding_city: 'Jaipur',
                          budget_max: 900000, event_types: ['wedding'] });
  const r = await callDoor(ENQUIRY(), [full]);
  assert.strictEqual(r.json.lead_created, false);
  assert.strictEqual(r.json.lead_enriched, false);
});

await t('8.4', '`ok` IS BYTE-STABLE against the pre-arc truth table, all states', async () => {
  // The declared derivation, pinned. `ok` means what enquire.js's header has
  // always said it means: the row EXISTS where the vendor will find it. If a
  // future tidy-up re-fuses it to `lead_created`, a returning bride is told
  // her enquiry failed — and this cell reds first.
  const created = await callDoor(ENQUIRY({ bride_phone: '+919000000004' }));
  assert.strictEqual(created.json.ok, true, 'a created lead reports not-ok');
  const enriched = await callDoor(ENQUIRY({ budget_band: '1500000' }), [liveLead()]);
  assert.strictEqual(enriched.json.ok, true,
    'a returning bride whose enquiry landed perfectly is told it failed — ok was re-fused to lead_created');
  const full = liveLead({ wedding_date: '2026-12-01', wedding_city: 'Jaipur',
                          budget_max: 900000, event_types: ['wedding'] });
  const noFill = await callDoor(ENQUIRY(), [full]);
  assert.strictEqual(noFill.json.ok, true, 'a no-fill dedupe reports not-ok');
});

await t('8.5', 'the vendor is still alerted on a returning bride\'s enquiry', async () => {
  SENT.length = 0;
  await callDoor(ENQUIRY({ budget_band: '1500000' }), [liveLead()]);
  assert.ok(SENT.length >= 1, 'the enrichment path swallowed the vendor\'s ping');
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§9 · THE VENDOR-POST CALLER IS CARVED OUT — R-37.34 fork F3');

await t('9.1', 'no enrich option => a dedupe hit changes NOTHING', async () => {
  const { out, writes, store } = await callCreate({
    phone: SARAH, name: 'Vendor Typed', wedding_city: 'Delhi',
    wedding_date: '2027-02-14', budget_max: 1500000,
  }, [liveLead()]);
  assert.strictEqual(out.deduped, true);
  assert.strictEqual(out.enriched, false, 'the vendor POST caller enriched — the carve-out is broken');
  assert.strictEqual(leadUpdates(writes).length, 0, 'a write was issued on the carved-out path');
  assert.strictEqual(store.leads[0].wedding_city, null);
  assert.strictEqual(store.leads[0].budget_max, null);
});

await t('9.2', 'and it still receives the FULL ROW — R-37.35 binds both callers', async () => {
  // The snapshot money-loss lives on THIS caller, so the shape cure must reach
  // it even though the enrichment does not.
  const { out } = await callCreate({ phone: SARAH, name: 'V' }, [liveLead({ budget_max: 750000 })]);
  assert.deepStrictEqual(Object.keys(out.lead).sort(), LEAD_RETURN_KEYS.slice().sort());
  assert.strictEqual(out.lead.budget_max, 750000);
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§10 · THE DISPOSITION GUARD — nothing joins the enrich set silently');
// The one STRUCTURAL section, and it reads CODE (the exported constants and
// the destructure itself), never prose. It REFUSES rather than returning an
// empty set when its anchor is absent: a check whose failure mode is a silent
// zero is not a check.

const destructuredParams = (() => {
  const src = require('fs').readFileSync(P('src/lib/vendor/leads.js'), 'utf8');
  const m = src.match(/async function createLead\([^)]*\)\s*\{\s*const \{([\s\S]*?)\}\s*=\s*params;/);
  if (!m) throw new Error('REFUSED — could not find createLead\'s destructure');
  return m[1]
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
    .split(',').map((x) => x.trim()).filter(Boolean)
    .map((x) => x.split(':')[0].trim());
})();

await t('10.1', 'EVERY destructured param is dispositioned — enrich, refused, or named non-column', async () => {
  const known = new Set([...ENRICH_KEYS, ...ENRICH_REFUSED_KEYS, ...NON_COLUMN_PARAMS]);
  const orphans = destructuredParams.filter((k) => !known.has(k));
  assert.deepStrictEqual(orphans, [],
    `undispositioned parameter(s) reaching a money row: ${orphans.join(', ')} — rule them before they ship`);
});

await t('10.2', 'the column-bearing bound is TWELVE, re-derived not remembered [c-D.2]', async () => {
  // BOTH the read-first and the chair's verification of it said THIRTEEN. The
  // count is mechanical and it is twelve; the miscount is owned as c-D.2 and
  // pinned here so no future reader inherits it. `enrich` is the thirteenth
  // param and it is an OPTION, not a column — which is probably how the
  // number went wrong in the first place.
  const columns = destructuredParams.filter((k) => !NON_COLUMN_PARAMS.includes(k));
  assert.strictEqual(columns.length, 12, `the bound is ${columns.length}, not 12`);
  assert.strictEqual(destructuredParams.length, 13, 'the option is missing from the destructure');
});

await t('10.3', 'the two dispositions are DISJOINT and cover the bound exactly', async () => {
  const both = ENRICH_KEYS.filter((k) => ENRICH_REFUSED_KEYS.includes(k));
  assert.deepStrictEqual(both, [], `a key is both enriched and refused: ${both.join(', ')}`);
  assert.strictEqual(ENRICH_KEYS.length + ENRICH_REFUSED_KEYS.length, 12,
    'the disposition table no longer covers the bound');
});

await t('10.4', 'the two return-shape literals still agree — drift is visible, not silent', async () => {
  const src = require('fs').readFileSync(P('src/lib/vendor/leads.js'), 'utf8');
  const m = src.match(/\.update\(update\)[\s\S]*?\.select\('([^']+)'\)/);
  if (!m) throw new Error('REFUSED — could not find updateLead\'s return select');
  assert.deepStrictEqual(
    m[1].split(',').map((s) => s.trim()).sort(),
    LEAD_RETURN_KEYS.slice().sort(),
    'updateLead\'s select drifted from LEAD_RETURN_SELECT — the delegated write returns a different shape');
});

await t('10.5', 'the dedupe read carries the two columns the return shape does not', async () => {
  // budget_min and event_types are ENRICH_KEYS but not LEAD_RETURN_KEYS, so a
  // reader that forgets them cannot decide whether to fill them.
  const needed = ENRICH_KEYS.filter((k) => !LEAD_RETURN_KEYS.includes(k));
  assert.deepStrictEqual(needed.sort(), ['budget_min', 'event_types']);
  const { out } = await callCreate({
    phone: SARAH, name: 'x', enrich: { budget_min: 300000, event_types: ['sangeet'] },
  }, [liveLead({ budget_min: null, event_types: null })]);
  assert.deepStrictEqual(out.enriched_fields.sort(), ['budget_min', 'event_types'],
    'a column outside the return shape was not readable for the fill decision');
});


// ══════════════════════════════════════════════════════════════════════════
console.log('\n§11 · THE BAND SETTLES AS A UNIT — R-37.40 · F-16.31');
// THE DISCRIMINATING SECTION. Every cell here starts from ONE-HELD-ONE-NULL,
// because that is the only state in which per-column and unit-band semantics
// disagree. From a both-null row they produce the identical result, which is
// why walk two's leg A could not test this and why reading it as proof was an
// error (c-D.4). These cells RED at the ZIP 1 tree; §3.1's both-null cell does
// not, and the contrast is the point.

await t('11.1', 'FOUNDER-WITNESSED CASE: a held floor + her bounded band moves NOTHING', async () => {
  // The Sarah row, exactly: budget_min 1000000 (the open top-band answer),
  // budget_max null. She returns and picks Rs 5,00,000 - 10,00,000.
  // ZIP 1: floor holds, ceiling fills -> 1000000/1000000, a band never chosen.
  // R-37.40: the band is ANSWERED, so it is left whole.
  const r = await callDoor(ENQUIRY({ budget_floor: '500000', budget_band: '1000000' }),
                           [liveLead({ budget_min: 1000000, budget_max: null })]);
  const row = rowOf(r.store);
  assert.strictEqual(row.budget_min, 1000000, `the floor MOVED to ${row.budget_min}`);
  assert.strictEqual(row.budget_max, null,
    `the ceiling filled to ${row.budget_max} against a held floor — F-16.31 has returned, and the row now carries a band she never chose`);
});

await t('11.2', 'and the mirror: a held CEILING + her band moves nothing either', async () => {
  const r = await callDoor(ENQUIRY({ budget_floor: '500000', budget_band: '1500000' }),
                           [liveLead({ budget_min: null, budget_max: 900000 })]);
  const row = rowOf(r.store);
  assert.strictEqual(row.budget_min, null, `the floor filled to ${row.budget_min} against a held ceiling`);
  assert.strictEqual(row.budget_max, 900000, `the ceiling MOVED to ${row.budget_max}`);
});

await t('11.3', 'a held band reports enriched:FALSE when it is the only thing on offer', async () => {
  const full = liveLead({ budget_min: 1000000, budget_max: null,
                          wedding_date: '2026-12-01', wedding_city: 'Jaipur', event_types: ['wedding'] });
  const r = await callDoor(ENQUIRY({ budget_floor: '500000', budget_band: '1000000' }), [full]);
  assert.strictEqual(r.json.lead_enriched, false, 'a refused band was reported as an enrichment');
  assert.strictEqual(leadUpdates(r.writes).length, 0, 'a write was issued for a band that never landed');
});

await t('11.4', 'THE SETTLE INVARIANT: the pair rests as HER band or as its OWN — never a mixture', async () => {
  // The general statement of the cure, swept rather than sampled. For every
  // starting state and every posted band, the pair must equal one or the other
  // in FULL. A degenerate mixture is what F-16.31 was.
  const posted = { min: 500000, max: 1500000 };
  const starts = [
    [null, null], [1000000, null], [null, 900000], [1000000, 900000],
  ];
  for (const [lo, hi] of starts) {
    const { store } = await callCreate({
      phone: SARAH, name: 'x',
      enrich: { budget_min: posted.min, budget_max: posted.max },
    }, [liveLead({ budget_min: lo, budget_max: hi })]);
    const row = store.leads[0];
    const isHers = row.budget_min === posted.min && row.budget_max === posted.max;
    const isOwn  = row.budget_min === lo && row.budget_max === hi;
    assert.ok(isHers || isOwn,
      `from [${lo}, ${hi}] the pair settled at [${row.budget_min}, ${row.budget_max}] — neither her band nor its own`);
  }
});

await t('11.5', 'the TOP band lands WHOLE on a both-null row — an absent ceiling is an answer', async () => {
  // "Rs 10,00,000+" posts a floor and a genuinely absent ceiling. That is the
  // band arriving complete, not half-arriving, so it must not be refused.
  const r = await callDoor(ENQUIRY({ budget_floor: '1000000', budget_band: '' }),
                           [liveLead({ budget_min: null, budget_max: null })]);
  const row = rowOf(r.store);
  assert.strictEqual(row.budget_min, 1000000, 'the open band\'s floor did not land');
  assert.strictEqual(row.budget_max, null, 'the open band acquired a ceiling');
  assert.strictEqual(r.json.lead_enriched, true, 'the open band was reported as no enrichment');
});

await t('11.6', 'no null is ever WRITTEN — an absent bound is skipped, not stamped', async () => {
  const { out, writes } = await callCreate({
    phone: SARAH, name: 'x', enrich: { budget_min: 1000000, budget_max: null },
  }, [liveLead({ budget_min: null, budget_max: null })]);
  for (const w of leadUpdates(writes)) {
    assert.ok(!w.keys.includes('budget_max'),
      'budget_max was written as null — an empty key in the patch and in enriched_fields');
  }
  assert.deepStrictEqual(out.enriched_fields, ['budget_min']);
});

await t('11.7', 'the pair table is CODE and its members are dispositioned enrich keys', async () => {
  assert.ok(Array.isArray(ENRICH_PAIRS) && ENRICH_PAIRS.length >= 1, 'the pair table is empty');
  for (const pair of ENRICH_PAIRS) {
    assert.strictEqual(pair.length, 2, `a pair is not a pair: ${JSON.stringify(pair)}`);
    for (const k of pair) {
      assert.ok(ENRICH_KEYS.includes(k), `${k} is paired but not an enrich key`);
      assert.ok(!ENRICH_REFUSED_KEYS.includes(k), `${k} is paired AND refused`);
    }
  }
});

console.log(`\n${'═'.repeat(66)}`);
console.log(`b38_doorboot_enrich_bench: ${pass}/${pass + fail}`);
if (fail) { console.log('REDS:'); reds.forEach((r) => console.log('  - ' + r)); }
console.log('═'.repeat(66));
process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH THREW:', e); process.exit(1); });
