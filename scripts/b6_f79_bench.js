#!/usr/bin/env node
// scripts/b6_f79_bench.js — TDW_04 B6, the F-04.79 mini-rider (Q-R-3, answer
// (ii): the corrections convention's SECOND and FINAL extension — the hard
// floor rides the record). Runnable from any working directory, clean clone,
// no npm install:  node scripts/b6_f79_bench.js
//
// WHAT THIS BENCH IS, disclosed:
//  §1 drives the REAL runHarvest (the b6_rider_bench rig, carried verbatim —
//     scoped Module._load shim over transport/door deps only; the model call
//     canned; the doors spies). ITS NAMED TEST IS TONIGHT'S EXACT
//     17:03:52 → 17:04:06 SEQUENCE, fixture renamed Tara → Vera at the
//     founder's word: the collision dispatch travels the CONSULT wire, the
//     door's matched-by-NAME note rides a NESTED donna_calls result, Victor's
//     outward reply is DECLARATIVE (no question mark — the exact gap the
//     prose leg missed), and the harvest model proposes the withheld phone
//     (tonight's applied=1). ASSERTED PER THE RULING'S OWN WORDS: held > 0
//     and the phone cell EMPTY AFTER.
//  §2 drives the REAL pure extractor (source-extracted from the marked cure
//     region, the established method). §3 is source assertions.
//
// Ruling trail: Q-R-3 (F-04.79 filed, cure adopted EXACTLY — the mechanical
// tool-result-keyed trigger as the PRIMARY leg; the prose question-mark
// detector DEMOTED BY NAME to the weaker second leg; scope fenced to
// harvest.js + this bench + full engine gates; nothing else rides; after this
// mini-rider 04 SEALS UNCONDITIONALLY).

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

// ═══ the rig, carried from b6_rider_bench (disclosed) ═══
const HARVEST_PATH = path.join(ROOT, 'src/agent/harvest.js');
const spies = { updateLead: [], executeAndPatch: [], logActivity: [] };
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
  '../engine/dist/core/donna': { patchNote: async () => {} },
  '../engine/dist/core/recordsView': { loadRecords: async () => recordsRows },
  '../engine/dist/core/phoneKey': { phoneKey: (v) => (v == null ? null : String(v).replace(/\D/g, '') || null) },
  '../lib/vendor/snapshot': { logActivity: async (pub, row) => { spies.logActivity.push(row); } },
  '../lib/modelRouter': { resolveModel: async () => ({ provider: 'anthropic', model: 'canned' }) },
  '../lib/llm': { llmCreate: async () => ({ content: [] }), llmStream: async () => {} },
};
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (parent && parent.filename === HARVEST_PATH && Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
  return origLoad.call(this, request, parent, isMain);
};
const { runHarvest } = require(HARVEST_PATH);
Module._load = origLoad;

function makePub(typedRows) {
  const chain = (result) => {
    const c = { then: (res) => res(result) };
    for (const m of ['select', 'eq', 'is', 'not', 'order', 'limit', 'update']) c[m] = () => c;
    return c;
  };
  return { from: (table) => chain(table === 'leads' ? { data: typedRows, error: null } : { data: [], error: null }) };
}

const VENDOR = { id: '11111111-1111-1111-1111-111111111111' };
const LEAD_VERA = () => ({ id: 'aaaaaaaa-0000-4000-8000-000000000011', name: 'Vera Door Test', phone: null, wedding_date: '2027-03-20', wedding_city: 'Jaipur', budget_max: null, state: 'new', draft_meta: { missing: ['phone', 'budget_max'] } });

// The door's TWO real display shapes, the Q-R-1 sentences verbatim (the note
// is the SIGNAL — DOOR_NAME_MATCH_NOTE's own text):
const NOTE = ` Note: matched by NAME to the lead already on file — if this is a different person with the same name, tell me and I'll file them separately. Their phone number was NOT written onto this lead — a name match alone doesn't merge identities; confirm it's the same person and I'll add it.`;
const DOOR_NOTHING_NEW = `Lead "Vera Door Test" already on file (id=aaaaaaaa-0000-4000-8000-000000000011) — nothing new to add.${NOTE}`;
const DOOR_UPDATED = `Updated existing lead "Vera Door Test" (id=aaaaaaaa-0000-4000-8000-000000000011) — state. (Typed lead — this id is not a binder; binder hands like follow-ups, money or notes don't attach to it.)${NOTE}`;

// Tonight's shapes, renamed at the founder's word (Tara → Vera):
const MSG = 'Another Vera Door Test enquiry — different person, same name. Phone 9811003344, wedding 5 December 2027 in Udaipur. Log her.';
const DECLARATIVE_REPLY = "Log her as \"Vera Door Test 2\" — keeps them separate while clearly related. Same details: wedding 5 December 2027, Udaipur, phone 9811003344, nothing paid, stage new.";
const CONSULT_TOOLCALLS = [
  { name: 'dear_donna_talk', input: { message: 'Log a new lead: Vera Door Test, phone 9811003344, wedding 5 December 2027, Udaipur. Different person, same name.' }, result: '(handed to Donna)',
    donna_calls: [{ name: 'donna_lead', input: { name: 'Vera Door Test', contact: '9811003344' }, result: DOOR_NOTHING_NEW }] },
  { name: 'listen_harvey_talk', input: { message: 'It keeps matching to the existing lead by name…' }, result: 'It keeps matching to the existing lead by name. Do you want me to name this one differently?' },
];
const PHONE_PATCH = { plane: 'typed', table: 'leads', id: 'aaaaaaaa-0000-4000-8000-000000000011', field: 'phone', value: '9811003344' };

async function run(opts) {
  spies.updateLead = []; spies.executeAndPatch = []; spies.logActivity = [];
  cannedPatches = opts.patches; recordsRows = opts.records || [];
  const logs = [];
  const orig = console.log; console.log = (...a) => logs.push(a.join(' '));
  try {
    await runHarvest({ supabase: makePub(opts.typed || []), vendor: VENDOR, agentId: 'agent-f79', message: opts.message || MSG, toolCalls: opts.toolCalls || [], replyText: opts.replyText });
  } finally { console.log = orig; }
  return logs;
}

(async () => {
  sec("§1 — THE NAMED TEST: tonight's 17:03:52→17:04:06 sequence (Vera), the REAL runHarvest.");
  {
    const row = LEAD_VERA();
    const logs = await run({ typed: [row], toolCalls: CONSULT_TOOLCALLS, replyText: DECLARATIVE_REPLY, patches: [PHONE_PATCH] });
    T('held > 0 — the ruling\'s first assertion (the mechanical leg fired off the NESTED consult result)', logs.some((l) => /held=1/.test(l)));
    T('the phone cell EMPTY AFTER — the ruling\'s second assertion (updateLead never called; the row untouched)', spies.updateLead.length === 0 && row.phone === null);
    T('the hold LEDGERED (harvest_hold, the finding named)', spies.logActivity.some((r) => r.action === 'harvest_hold' && /F-04\.72/.test(r.summary)));
    T('the prose leg alone would have MISSED it (declarative reply carries no "?") — the gap, proven inside the fix', !DECLARATIVE_REPLY.includes('?'));
  }
  {
    // Control twin: same turn, tool results WITHOUT the note (a clean insert display) -> the patch applies.
    const row = LEAD_VERA();
    const logs = await run({ typed: [row], replyText: DECLARATIVE_REPLY, patches: [PHONE_PATCH],
      toolCalls: [{ name: 'donna_lead', input: {}, result: 'Lead logged: Vera Door Test (id=aaaaaaaa-0000-4000-8000-000000000011).' }] });
    T('control (no note anywhere): the patch FILES — behaviour identical off the signal', spies.updateLead.length === 1 && logs.some((l) => /held=0/.test(l)));
  }
  {
    // The note at TOP LEVEL (non-consult path) triggers the same hold.
    const row = LEAD_VERA();
    const logs = await run({ typed: [row], replyText: DECLARATIVE_REPLY, patches: [PHONE_PATCH],
      toolCalls: [{ name: 'donna_lead', input: {}, result: DOOR_UPDATED }] });
    T('top-level tool result with the note: held (both display shapes, both wire depths)', logs.some((l) => /held=1/.test(l)) && spies.updateLead.length === 0);
  }
  {
    // The DEMOTED second leg still lives: question reply, no tool note.
    const row = LEAD_VERA();
    const logs = await run({ typed: [row], toolCalls: [], replyText: 'Is this a new person, or the same Vera Door Test already on file?', patches: [PHONE_PATCH] });
    T('the prose leg (demoted, second) still holds on an open question', logs.some((l) => /held=1/.test(l)) && spies.updateLead.length === 0);
  }
  {
    // Both legs firing on the same entity: ONE key, ONE ledger row.
    const row = LEAD_VERA();
    await run({ typed: [row], toolCalls: CONSULT_TOOLCALLS, replyText: 'Same Vera Door Test, or a different person?', patches: [PHONE_PATCH] });
    T('both legs, one entity: one hold key, one ledger row (union, not double-count)', spies.logActivity.filter((r) => r.action === 'harvest_hold').length === 1);
  }
  {
    // Cross-plane reach: the tool-borne key holds a records-plane patch too.
    const row = LEAD_VERA();
    await run({ typed: [row], records: [{ id: 'bbbbbbbb-0000-4000-8000-000000000011', client: 'Vera', missing: ['date'], direction: null }],
      toolCalls: CONSULT_TOOLCALLS, replyText: DECLARATIVE_REPLY,
      patches: [PHONE_PATCH, { plane: 'records', id: 'bbbbbbbb-0000-4000-8000-000000000011', cell: 'date', value: '2027-12-05' }] });
    T('the mechanical key holds BOTH planes (the F-04.72 shape, now wire-triggered)', spies.updateLead.length === 0 && spies.executeAndPatch.length === 0);
  }

  sec('§2 — the REAL extractor, source-extracted from the marked cure region.');
  {
    const src = read('src/agent/harvest.js');
    const start = src.indexOf("// ── F-04.72's CURE");
    const end = src.indexOf('// ── end F-04.72 cure region');
    T('the marked cure region exists and now carries the F-04.79 primary leg', start > -1 && end > start && src.slice(start, end).includes('toolResultHoldKeys'));
    let toolResultHoldKeys = () => new Set([null]), flattenToolResults = () => [null];
    if (start > -1 && end > start) {
      try {
        const ctx = {}; vm.createContext(ctx);
        vm.runInContext(src.slice(start, end) + '\nthis.__x = { toolResultHoldKeys, flattenToolResults };', ctx);
        ({ toolResultHoldKeys, flattenToolResults } = ctx.__x);
      } catch (_e) { /* uncured region: the stubs above fail every §2 assertion — fails, never a crash */ }
    }
    T('extracts the key from the "nothing new to add" display shape', toolResultHoldKeys([{ result: DOOR_NOTHING_NEW }]).has('vera'));
    T('extracts the key from the "Updated existing lead" display shape', toolResultHoldKeys([{ result: DOOR_UPDATED }]).has('vera'));
    T('reaches NESTED donna_calls (the consult wire — tonight\'s path)', toolResultHoldKeys(CONSULT_TOOLCALLS).has('vera'));
    T('a result WITHOUT the note yields nothing', toolResultHoldKeys([{ result: 'Lead logged: Vera (id=x).' }]).size === 0);
    T('non-string / malformed results are safe', toolResultHoldKeys([{ result: 42 }, {}, null, { donna_calls: [{ result: null }] }]).size === 0 && flattenToolResults(null).length === 0);
  }

  sec('§3 — source assertions: the demotion by name, the union, the fence.');
  {
    const hv = read('src/agent/harvest.js');
    T('the primary/secondary order is written where it executes (Q-R-3 named in the region)', /Q-R-3/.test(hv) && /PRIMARY leg/.test(hv) && /DEMOTED BY NAME/.test(hv));
    T('the hold set is the UNION of both legs (mechanical first)', /const holds = toolResultHoldKeys\(toolCalls\);/.test(hv) && /holds\.add\(k\)/.test(hv));
    T('the signal constant is the door\'s own sentence', /DOOR_NAME_MATCH_NOTE = 'matched by NAME to the lead already on file'/.test(hv));
    const chat = read('src/api/vendor-engine/chat.js');
    T('the fire site is UNTOUCHED this rider — the signal already travelled (fence honoured, zero-argument disclosure)', /runHarvest\(\{ supabase, vendor, agentId, message, toolCalls, replyText: \(result && result\.reply\) \|\| '' \}\)/.test(chat));
  }

  console.log(`\n   ══ ${pass}/${pass + fail} ${fail ? 'FAIL' : 'PASS'} ══`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH CRASH:', e); process.exit(1); });
