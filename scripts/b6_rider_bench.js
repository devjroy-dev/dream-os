#!/usr/bin/env node
// scripts/b6_rider_bench.js — TDW_04 B6, the F-04.72 disambiguation-hold rider
// (R-B6-29) + F-04.77's sentence half (Q-S2-1). Runnable from any working
// directory, clean clone, no npm install (Q-SP-5's law):
//   node scripts/b6_rider_bench.js
//
// WHAT THIS BENCH IS, disclosed:
//  §1 drives the REAL runHarvest END TO END — harvest.js loads for real; ONLY
//     its transport/door dependencies are intercepted via a scoped Module._load
//     hook (active solely for requires issued BY harvest.js — never the
//     functions under test; the B4 shim law). The model call is a canned
//     proposer; the doors are spies. §1's first scenario is R-B6-29's NAMED
//     FIRST TEST CASE: shape (b)'s cross-plane collision — a lead-plane
//     "Kavya Smoke Test" and a records-plane "Kavya" colliding under the same
//     open which-Kavya question, both planes' patches HELD, that turn only.
//     Its control twin proves behaviour-identical when no clarify is open, and
//     the absent-replyText run proves older callers get pre-rider bytes.
//  §2 drives the REAL pure hold functions (nameKey / questionSegments /
//     computeDisambiguationHolds), source-extracted from harvest.js's marked
//     cure region — the b6_s1_bench method, module graph reasons stated there.
//  §3 is source assertions (the R-B6-12 precedent): the fire site passes the
//     model reply; the signature carries it; the hold ledgers and counts.
//  §4 drives the REAL writeEvent for F-04.77's tightened exclusivity sentence
//     (the b6_s2_bench rig, carried verbatim) — the founder-approved two-block
//     specimen asserted BYTE-EXACT.
//
// Ruling trail: R-B6-29 (shape (a), the hold; shape (b) as first test case;
// engine-gated rider, handover after) · Q-S2-1 (F-04.77 adopted; sentence
// subject to the founder's veto — answered "fine as is", recorded in the log)
// · Q-S2-6 (the S2 smoke record rides this rider's ZIP).

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let pass = 0, fail = 0;
const T = (label, cond) => { if (cond) { pass++; console.log('  ✓ ' + label); } else { fail++; console.log('  ✗ FAIL: ' + label); } };
const sec = (t) => console.log('\n── ' + t + ' ──');

// ═════════════════════════════════════════════════════════════════════════
// §1 — the REAL runHarvest, doors spied, model canned. Scoped shim: the hook
// answers ONLY requires issued by src/agent/harvest.js itself.
// ═════════════════════════════════════════════════════════════════════════
const HARVEST_PATH = path.join(ROOT, 'src/agent/harvest.js');

const spies = { updateLead: [], executeAndPatch: [], logActivity: [], patchNote: [] };
let cannedPatches = [];
let recordsRows = [];

const stubs = {
  '@anthropic-ai/sdk': class Anthropic {
    constructor() { this.messages = { create: async () => ({ content: [{ type: 'text', text: JSON.stringify({ patches: cannedPatches }) }] }) }; }
  },
  '../lib/vendor/leads': { updateLead: async (pub, vendorId, id, norm) => { spies.updateLead.push({ id, norm }); return { ok: true, lead: { draft_meta: { missing: [], harvested: [] } } }; } },
  '../lib/draftContracts': { leadMissing: () => [] },
  '../lib/recordCompleteness': { missingCells: (r) => (r && r.missing) || [] },
  '../lib/executeAndPatch': { executeAndPatch: async (agentId, tool, input) => { spies.executeAndPatch.push({ tool, input }); return { display: 'ok' }; } },
  '../engine/dist/core/donna': { patchNote: async (...a) => { spies.patchNote.push(a); } },
  '../engine/dist/core/recordsView': { loadRecords: async () => recordsRows },
  '../engine/dist/core/phoneKey': { phoneKey: (v) => (v == null ? null : String(v).replace(/\D/g, '') || null) },
  '../lib/vendor/snapshot': { logActivity: async (pub, row) => { spies.logActivity.push(row); } },
  '../lib/modelRouter': { resolveModel: async () => ({ provider: 'anthropic', model: 'canned' }) },
  '../lib/llm': { llmCreate: async () => ({ content: [] }), llmStream: async () => {} },
};

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (parent && parent.filename === HARVEST_PATH && Object.prototype.hasOwnProperty.call(stubs, request)) {
    return stubs[request];
  }
  return origLoad.call(this, request, parent, isMain);
};
const { runHarvest } = require(HARVEST_PATH); // the REAL module, deps scoped-stubbed
Module._load = origLoad; // hook off the moment the graph is loaded

// The typed-plane supabase double: enough chain for the drafts read + the
// trail update (shape carried from checker_bench's Q, trimmed to this file's
// two queries — nothing under test lives in it).
function makePub(typedRows) {
  const chain = (result) => {
    const c = { then: (res) => res(result) };
    for (const m of ['select', 'eq', 'is', 'not', 'order', 'limit', 'update']) c[m] = () => c;
    return c;
  };
  return { from: (table) => chain(table === 'leads' ? { data: typedRows, error: null } : { data: [], error: null }) };
}

const VENDOR = { id: '11111111-1111-1111-1111-111111111111' };
const LEAD_KAVYA = { id: 'aaaaaaaa-0000-4000-8000-000000000001', name: 'Kavya Smoke Test', phone: null, wedding_date: null, wedding_city: null, budget_max: null, state: 'new', draft_meta: { missing: ['phone', 'wedding_city'] } };
const LEAD_RITU = { id: 'aaaaaaaa-0000-4000-8000-000000000002', name: 'Ritu Malhotra', phone: '9800000001', wedding_date: null, wedding_city: null, budget_max: null, state: 'new', draft_meta: { missing: ['wedding_city'] } };
const BINDER_KAVYA = { id: 'bbbbbbbb-0000-4000-8000-000000000001', client: 'Kavya', missing: ['date'], direction: null };

const CLARIFY_REPLY = 'Good to have her details. Quick check before I file anything — is this a new person, or the same Kavya already on file? The Kavya I have shows Rs 15,000 received on 14 Jul for Udaipur.';
const PLAIN_REPLY = 'Noted — Kavya Smoke Test is on the list, and I have logged what you gave me.';

async function run(replyText, opts = {}) {
  spies.updateLead = []; spies.executeAndPatch = []; spies.logActivity = []; spies.patchNote = [];
  cannedPatches = opts.patches;
  recordsRows = opts.records || [];
  const logs = [];
  const origlog = console.log; console.log = (...a) => logs.push(a.join(' '));
  try {
    const args = { supabase: makePub(opts.typed || []), vendor: VENDOR, agentId: 'agent-1', message: opts.message || 'msg', toolCalls: [] };
    if (replyText !== undefined) args.replyText = replyText;
    await runHarvest(args);
  } finally { console.log = origlog; }
  return logs;
}

sec('§1 — R-B6-29 shape (a), the REAL runHarvest. First: THE NAMED FIRST TEST CASE (shape (b), cross-plane collision).');
(async () => {
  // A — the named first test case: open which-Kavya clarify; patches proposed
  // on BOTH planes with colliding keys -> BOTH HELD; ledgered; nothing files.
  {
    const logs = await runA(CLARIFY_REPLY);
    T('cross-plane collision: the typed door was NOT called (lead patch held)', spies.updateLead.length === 0);
    T('cross-plane collision: the records door was NOT called (binder patch held)', spies.executeAndPatch.length === 0);
    const holdRows = spies.logActivity.filter((r) => r.action === 'harvest_hold');
    T('the hold is LEDGERED (action=harvest_hold, one row for the colliding key)', holdRows.length === 1 && /F-04\.72/.test(holdRows[0].summary));
    T('the final line counts held=2 (both planes, one key)', logs.some((l) => /held=2/.test(l)));
    T('no harvest_patch row rode a held turn', !spies.logActivity.some((r) => r.action === 'harvest_patch'));
  }
  // B — the control twin: SAME inputs, no open clarify -> both doors fire.
  {
    const logs = await runA(PLAIN_REPLY);
    T('control (no question): the lead patch FILES through updateLead', spies.updateLead.length === 1 && spies.updateLead[0].norm.phone === '9811001122');
    T('control (no question): the binder patch FILES through executeAndPatch (donna_date)', spies.executeAndPatch.length === 1 && spies.executeAndPatch[0].tool === 'donna_date');
    T('control: zero harvest_hold rows', !spies.logActivity.some((r) => r.action === 'harvest_hold'));
    T('control: the final line counts held=0', logs.some((l) => /held=0/.test(l)));
  }
  // C — selective hold: the question names Kavya only; Ritu\'s patch still lands.
  {
    await run(CLARIFY_REPLY, {
      typed: [LEAD_KAVYA, LEAD_RITU],
      records: [BINDER_KAVYA],
      patches: [
        { plane: 'typed', table: 'leads', id: LEAD_KAVYA.id, field: 'phone', value: '9811001122' },
        { plane: 'typed', table: 'leads', id: LEAD_RITU.id, field: 'wedding_city', value: 'Jaipur' },
        { plane: 'records', id: BINDER_KAVYA.id, cell: 'date', value: '2027-02-14' },
      ],
    });
    T('selective: Kavya held, Ritu FILED — the hold is per-key, not per-turn-total', spies.updateLead.length === 1 && spies.updateLead[0].id === LEAD_RITU.id && spies.executeAndPatch.length === 0);
  }
  // D — absent replyText (an older caller): nothing holds; pre-rider behaviour.
  {
    await run(undefined, {
      typed: [LEAD_KAVYA], records: [BINDER_KAVYA],
      patches: [
        { plane: 'typed', table: 'leads', id: LEAD_KAVYA.id, field: 'phone', value: '9811001122' },
        { plane: 'records', id: BINDER_KAVYA.id, cell: 'date', value: '2027-02-14' },
      ],
    });
    T('absent replyText: both patches file — older callers keep pre-rider bytes', spies.updateLead.length === 1 && spies.executeAndPatch.length === 1 && !spies.logActivity.some((r) => r.action === 'harvest_hold'));
  }

  // ═══════════════════════════════════════════════════════════════════════
  sec('§2 — the pure hold functions, REAL bodies (source-extracted from the marked cure region).');
  {
    const src = read('src/agent/harvest.js');
    const start = src.indexOf("// ── F-04.72's CURE");
    const end = src.indexOf('// ── end F-04.72 cure region');
    T('the marked cure region exists in harvest.js', start > -1 && end > start);
    let nameKey = () => null, questionSegments = () => [], computeDisambiguationHolds = () => new Set([null]);
    if (start > -1 && end > start) {
      const ctx = {};
      vm.createContext(ctx);
      vm.runInContext(src.slice(start, end) + '\nthis.__x = { nameKey, questionSegments, computeDisambiguationHolds };', ctx);
      ({ nameKey, questionSegments, computeDisambiguationHolds } = ctx.__x);
    } // else: the stubs above fail every §2 assertion — an uncured tree reads as fails, never a crash

    T('nameKey: first name token, lowercased ("Kavya Smoke Test" -> "kavya")', nameKey('Kavya Smoke Test') === 'kavya');
    T('nameKey: null/empty/one-letter labels never key', nameKey(null) === null && nameKey('') === null && nameKey('A') === null);
    T('questionSegments: only segments carrying "?" qualify', questionSegments('Done. Is this the same Kavya? Great.').length === 1);
    const h1 = computeDisambiguationHolds(CLARIFY_REPLY, ['Kavya', 'Kavya Smoke Test', 'Ritu Malhotra']);
    T('the specimen reply holds exactly the colliding key ("kavya"), not Ritu', h1.size === 1 && h1.has('kavya'));
    T('a statement naming Kavya beside an UNRELATED question holds nothing', computeDisambiguationHolds('Kavya is filed. Anything else today?', ['Kavya']).size === 0);
    T('case-insensitive ("kavya?" vs label "KAVYA")', computeDisambiguationHolds('same kavya?', ['KAVYA']).has('kavya'));
    T('no question -> empty set', computeDisambiguationHolds(PLAIN_REPLY, ['Kavya']).size === 0);
    T('empty/absent reply -> empty set (the older-caller floor)', computeDisambiguationHolds('', ['Kavya']).size === 0 && computeDisambiguationHolds(undefined, ['Kavya']).size === 0);
    T('two entities under question -> both keys held', (() => { const h = computeDisambiguationHolds('The same Kavya? And which Ritu do you mean?', ['Kavya', 'Ritu Malhotra']); return h.has('kavya') && h.has('ritu'); })());
    T('word bound: "kavyanagar" does not hold "kavya"', computeDisambiguationHolds('is kavyanagar the venue?', ['Kavya']).size === 0);
  }

  // ═══════════════════════════════════════════════════════════════════════
  sec('§3 — source assertions (the R-B6-12 precedent): the plumbing and the ledger.');
  {
    const chat = read('src/api/vendor-engine/chat.js');
    T('chat.js fire site passes the MODEL reply (result.reply) into runHarvest', /runHarvest\(\{ supabase, vendor, agentId, message, toolCalls, replyText: \(result && result\.reply\) \|\| '' \}\)/.test(chat));
    const hv = read('src/agent/harvest.js');
    T('runHarvest signature carries replyText', /async function runHarvest\(\{ supabase, vendor, agentId, message, toolCalls, replyText \}\)/.test(hv));
    T('BOTH plane branches consult the hold ABOVE the field rules', /const tk = nameKey\(row\.name\);[\s\S]{0,200}holds\.has\(tk\)/.test(hv) && /const rk = nameKey\(row\.client\);[\s\S]{0,200}holds\.has\(rk\)/.test(hv));
    T('the hold ledgers as harvest_hold and the finding is named in the row', /action: 'harvest_hold'/.test(hv) && /F-04\.72/.test(hv));
    T('the final log line counts held', /held=\$\{held\}/.test(hv));
  }

  // ═══════════════════════════════════════════════════════════════════════
  sec('§4 — F-04.77\'s sentence half: the REAL writeEvent (the b6_s2 rig, carried).');
  await sentenceHalf();

  console.log(`\n   ══ ${pass}/${pass + fail} ${fail ? 'FAIL' : 'PASS'} ══`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH CRASH:', e); process.exit(1); });

// §1's shared runner (A/B scenarios share inputs; C/D pass their own).
async function runA(replyText) {
  return run(replyText, {
    typed: [LEAD_KAVYA],
    records: [BINDER_KAVYA],
    message: 'New lead: Kavya Smoke Test, phone 9811001122, wedding 14 Feb 2027 in Jaipur',
    patches: [
      { plane: 'typed', table: 'leads', id: LEAD_KAVYA.id, field: 'phone', value: '9811001122' },
      { plane: 'records', id: BINDER_KAVYA.id, cell: 'date', value: '2027-02-14' },
    ],
  });
}

// ── §4 rig: checker_bench's in-memory supabase, the b6_s2 subset ──────────
async function sentenceHalf() {
  const snapPath = path.join(ROOT, 'src/lib/vendor/snapshot.js');
  require.cache[snapPath] = { id: snapPath, filename: snapPath, loaded: true,
    exports: { logActivity: async () => {}, fetchRecentActivity: async () => [], formatActivityBlock: () => '' } };
  const { writeEvent } = require(path.join(ROOT, 'src/lib/vendor/eventWrite.js'));

  let SEQ = 0;
  const uuid = () => `00000000-0000-4000-8000-${String(++SEQ).padStart(12, '0')}`;
  const V = '11111111-1111-1111-1111-111111111111';
  class Q {
    constructor(db, table) { this.db = db; this.table = table; this.f = []; this.n = null; this.mode = 'select'; }
    select() { return this; }
    eq(c, v) { this.f.push((r) => r[c] === v); return this; }
    neq(c, v) { this.f.push((r) => r[c] !== v); return this; }
    is(c, v) { this.f.push((r) => (r[c] === undefined ? null : r[c]) === v); return this; }
    in(c, vs) { this.f.push((r) => vs.includes(r[c])); return this; }
    limit(n) { this.n = n; return this; }
    order() { return this; }
    update(p) { this.mode = 'update'; this.patch = p; return this; }
    insert(r) { this.mode = 'insert'; this.row = r; return this; }
    rows() { let rs = this.db.t[this.table] || []; for (const fn of this.f) rs = rs.filter(fn); return this.n ? rs.slice(0, this.n) : rs; }
    run() {
      if (this.mode === 'update') { const rs = this.rows(); rs.forEach((r) => Object.assign(r, this.patch)); return { data: rs, error: null }; }
      if (this.mode === 'insert') { const r = { id: uuid(), state: 'upcoming', deleted_at: null, ...this.row }; (this.db.t[this.table] = this.db.t[this.table] || []).push(r); return { data: [r], error: null }; }
      return { data: this.rows(), error: null };
    }
    async maybeSingle() { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: null }; }
    async single() { const { data, error } = this.run(); return error ? { data: null, error } : { data: data[0] || null, error: data[0] ? null : { code: 'PGRST116' } }; }
    then(res, rej) { try { res(this.run()); } catch (e) { rej(e); } }
  }
  const makeDb = () => { const db = { t: { events: [], vendors: [{ id: V, category: 'photographer', slot_capacity: null }] } }; const api = { from: (t) => new Q(db, t), schema: () => api }; return { api, db }; };
  const block = (api, date, slot, title) => writeEvent(api, { vendorId: V, surface: 'pwa', source: 'crud', kind: 'blocked', title: title || 'Blocked', event_date: date, slot, state: 'upcoming' });

  // The founder-approved two-default-block specimen — BYTE-EXACT.
  {
    const { api } = makeDb();
    await block(api, '2026-11-22', 'morning');
    await block(api, '2026-11-22', 'evening');
    const fd = await block(api, '2026-11-22', 'full_day');
    T('two default-titled blocks -> the founder-approved sentence, byte-exact', !fd.ok && fd.error === "Already blocked — the morning and the evening are held. A full-day block can't sit over them; unblock them first.");
  }
  // Singular agreement.
  {
    const { api } = makeDb();
    await block(api, '2026-11-22', 'morning');
    const fd = await block(api, '2026-11-22', 'full_day');
    T('one default-titled block -> singular agreement (is held / over it / unblock it)', !fd.ok && fd.error === "Already blocked — the morning is held. A full-day block can't sit over it; unblock it first.");
  }
  // A REAL title stays named (R-B6-17: the refusal names the existing block).
  {
    const { api } = makeDb();
    await block(api, '2026-11-22', 'morning', 'Out of town');
    const fd = await block(api, '2026-11-22', 'full_day');
    T('a real title stays in the sentence ("Out of town — the morning is held")', !fd.ok && /^Already blocked — Out of town — the morning is held\./.test(fd.error));
  }
  // The untouched wires, co-witnessed: same-slot + slot-over-full_day.
  {
    const { api } = makeDb();
    await block(api, '2026-11-22', 'morning');
    const m2 = await block(api, '2026-11-22', 'morning');
    T('same-slot wire byte-identical (Already blocked. / ALREADY_BLOCKED)', !m2.ok && m2.error === 'Already blocked.' && m2.code === 'ALREADY_BLOCKED');
  }
  {
    const { api } = makeDb();
    await block(api, '2026-11-22', 'full_day', 'Out of town');
    const s = await block(api, '2026-11-22', 'evening');
    T('slot-over-full_day sentence untouched (whole day is held (Out of town))', !s.ok && /whole day is held \(Out of town\)/.test(s.error));
  }
}
