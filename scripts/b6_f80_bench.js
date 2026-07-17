#!/usr/bin/env node
// scripts/b6_f80_bench.js — THE 04 TAIL RIDER (ruled D-8): F-04.80's cure, the
// ENTITY ANCHOR. Runnable from any working directory:
//   node scripts/b6_f80_bench.js
//
// WHAT THIS BENCH IS, disclosed:
//  §1 drives the REAL runHarvest end to end (the rig carried from b6_f79_bench,
//     disclosed — scoped Module._load shim over transport/door deps ONLY; the
//     function under test is the estate's own bytes). §1's first scenario is
//     THE CE'S NAMED TEST — the Vera/Neha sequence from the tail filing:
//     NON-colliding names, the vendor's message stating VERA's date and city,
//     NEHA's fixture-era draft missing both, the model attributing across the
//     names (row bdcec6b4's exact disease) — asserting the WRONG-ROW WRITE
//     ABSENT (updateLead never called for Neha), the anchor COUNTED
//     (`anchored=2`) and LEDGERED (`action:'harvest_anchor'`, F-04.80 named),
//     and no harvest_patch row riding the run. Then: the lawful control (the
//     message names Neha -> her patches file — attribution held to its
//     ANCHORING entity) · complementarity both directions (the hold fires
//     where the anchor passes; hold precedence on collision) · the unnamed-row
//     interpretation (no nameKey -> nothing to anchor, passes — disclosed in
//     the cure region, ratify-or-revert) · the records plane · the key
//     discipline (word-bounded ascii; substring non-ascii — the hold's own,
//     ONE aesthetic).
//  §2 drives the REAL pure anchor function (source-extracted from the marked
//     F-04.80 cure region, b6_rider_bench's §2 method) so a clean clone still
//     reads the cure's own letters.
//  §3 source-asserts the anchor's SITING: after the hold on both planes
//     (complement, never replacement), the widened log line, the ledger twin.
//
// Ruling trail: D-8 (the entity-anchor cure AS RECORDED in the tail ledger —
// "a patch applies only if the turn's message text names the target row's own
// entity (its nameKey); a message that never says 'Neha' cannot patch Neha";
// the Vera/Neha sequence the named bench test; §0.2 if inexecutable — it was
// not) · F-04.80's filing · Q-R-3's mechanical-signal aesthetic.
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

// ═══ the rig, carried from b6_f79_bench (disclosed) ═══
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

// The tail filing's own shapes: Neha is the fixture-era lead (created 14:11 same
// day, test-shaped phone), missing exactly the two cells the harvest wrote; no
// Vera row exists ANYWHERE — the no-write class meant nothing landed, which is
// the specimen's own truth.
const LEAD_NEHA = () => ({ id: 'bdcecb64-0000-4000-8000-000000000080', name: 'Neha', phone: '9811000000', wedding_date: null, wedding_city: null, budget_max: null, state: 'new', draft_meta: { missing: ['wedding_date', 'wedding_city'] } });
const MSG_VERA = "Log her as 'Vera Seal Test 2' — wedding 5 December 2027, Udaipur.";
const NEHA_PATCHES = [
  { plane: 'typed', table: 'leads', id: 'bdcecb64-0000-4000-8000-000000000080', field: 'wedding_date', value: '2027-12-05' },
  { plane: 'typed', table: 'leads', id: 'bdcecb64-0000-4000-8000-000000000080', field: 'wedding_city', value: 'Udaipur' },
];

async function run(opts) {
  spies.updateLead = []; spies.executeAndPatch = []; spies.logActivity = [];
  cannedPatches = opts.patches; recordsRows = opts.records || [];
  const logs = [];
  const orig = console.log; console.log = (...a) => logs.push(a.join(' '));
  try {
    await runHarvest({ supabase: makePub(opts.typed || []), vendor: VENDOR, agentId: 'agent-f80', message: opts.message, toolCalls: opts.toolCalls || [], replyText: opts.replyText });
  } finally { console.log = orig; }
  return logs;
}

(async () => {
  sec("§1 — THE CE'S NAMED TEST: the Vera/Neha sequence (non-colliding names), the REAL runHarvest.");
  {
    // A — the disease, re-run against the cured code: the message states VERA's
    // facts; the model proposes them onto NEHA; no name collision -> no hold —
    // and the ANCHOR fires: a message that never says "Neha" cannot patch Neha.
    const logs = await run({ typed: [LEAD_NEHA()], message: MSG_VERA, replyText: 'Done — noted.', patches: NEHA_PATCHES });
    T('THE WRONG-ROW WRITE IS ABSENT — updateLead never called for Neha (row bdcec6b4, reversed)', spies.updateLead.length === 0);
    T('the attribution is held to its ANCHORING entity: zero patches land anywhere', spies.executeAndPatch.length === 0);
    T('the anchor is COUNTED on the harvest log line (anchored=2)', logs.some((l) => /anchored=2/.test(l)));
    T('no hold fired — the holds stay acquitted by design (non-colliding names)', logs.some((l) => /held=0/.test(l)));
    const anchorRows = spies.logActivity.filter((r) => r.action === 'harvest_anchor');
    T('the anchor is LEDGERED (action=harvest_anchor, one row per entity, F-04.80 named)', anchorRows.length === 1 && /F-04\.80/.test(anchorRows[0].summary));
    T('no harvest_patch row rode the anchored run', !spies.logActivity.some((r) => r.action === 'harvest_patch'));
  }
  {
    // B — the lawful control: the SAME facts spoken WITH Neha's name -> they file.
    const logs = await run({ typed: [LEAD_NEHA()], message: "Neha's wedding is 5 December 2027 in Udaipur.", replyText: 'Noted.', patches: NEHA_PATCHES });
    T('the control: the message names Neha and BOTH patches file through the real door', spies.updateLead.length === 2 && spies.updateLead.every((u) => u.id === LEAD_NEHA().id));
    T('the control: anchored=0, zero harvest_anchor rows', logs.some((l) => /anchored=0/.test(l)) && !spies.logActivity.some((r) => r.action === 'harvest_anchor'));
  }
  {
    // C — complementarity, direction 1: the HOLD fires where the anchor passes.
    // The message names Neha (anchor would pass) but the reply leaves which-Neha
    // open -> the hold takes it FIRST; anchored=0.
    const logs = await run({ typed: [LEAD_NEHA()], message: 'Neha called — wedding 5 December 2027.', replyText: 'Is this the same Neha already on file, or a new one?', patches: [NEHA_PATCHES[0]] });
    T('complement (1): collision -> the HOLD fires first; the anchor never runs on a held patch', spies.updateLead.length === 0 && logs.some((l) => /held=1/.test(l)) && logs.some((l) => /anchored=0/.test(l)));
  }
  {
    // D — the unnamed-row interpretation (disclosed, ratify-or-revert): a draft
    // with NO name has no entity to anchor; enrichment stays lawful.
    const unnamed = { ...LEAD_NEHA(), id: 'cccccccc-0000-4000-8000-000000000080', name: null };
    await run({ typed: [unnamed], message: MSG_VERA, replyText: '', patches: [{ plane: 'typed', table: 'leads', id: unnamed.id, field: 'wedding_date', value: '2027-12-05' }] });
    T('an UNNAMED draft passes the anchor (no nameKey -> nothing to anchor; the disclosed interpretation)', spies.updateLead.length === 1 && spies.updateLead[0].id === unnamed.id);
  }
  {
    // E — the records plane: same anchor, other plane. A binder named "Neha"
    // cannot be patched by a Vera message; a Neha message patches it.
    const binder = { id: 'dddddddd-0000-4000-8000-000000000080', client: 'Neha', missing: ['date'], direction: null };
    await run({ records: [binder], message: MSG_VERA, replyText: '', patches: [{ plane: 'records', id: binder.id, cell: 'date', value: '2027-12-05' }] });
    T('records plane, anchored out: the binder door is never called on a Vera message', spies.executeAndPatch.length === 0 && spies.logActivity.some((r) => r.action === 'harvest_anchor'));
    await run({ records: [binder], message: 'Neha confirmed the date — 5 December 2027.', replyText: '', patches: [{ plane: 'records', id: binder.id, cell: 'date', value: '2027-12-05' }] });
    T('records plane, anchored in: the Neha message files through the real door (donna_date)', spies.executeAndPatch.length === 1 && spies.executeAndPatch[0].tool === 'donna_date');
  }

  sec('§2 — the pure anchor function, REAL body (source-extracted from the marked F-04.80 cure region).');
  {
    const src = read('src/agent/harvest.js');
    const start = src.indexOf("// ── F-04.80's CURE");
    const end = src.indexOf('// ── end F-04.80 cure region');
    T('the marked F-04.80 cure region exists in harvest.js', start > -1 && end > start);
    let messageNamesKey = () => '<uncured>';
    if (start > -1 && end > start) {
      const ctx = { escapeRe: (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') };
      vm.createContext(ctx);
      vm.runInContext(src.slice(start, end) + '\nthis.__x = { messageNamesKey };', ctx);
      ({ messageNamesKey } = ctx.__x);
    } // else: the sentinel above fails every assertion — an uncured tree reads as fails, never a crash
    T('a message that never says "neha" cannot anchor neha', messageNamesKey(MSG_VERA, 'neha') === false);
    T('a message naming neha anchors neha (case-insensitive)', messageNamesKey("NEHA's wedding is set.", 'neha') === true);
    T('word-bounded for ascii keys: "nehaville" does not anchor "neha" (the hold\'s own discipline)', messageNamesKey('the venue is nehaville', 'neha') === false);
    T('a null key anchors nothing and blocks nothing (the unnamed-row interpretation)', messageNamesKey(MSG_VERA, null) === true);
    T('an empty message anchors no named entity (the rule leans toward blocking)', messageNamesKey('', 'neha') === false);
    T('non-ascii keys anchor by substring (the hold\'s stated non-ascii discipline)', messageNamesKey('\u0928\u0947\u0939\u093e \u0915\u0940 \u0936\u093e\u0926\u0940 \u0926\u093f\u0938\u0902\u092c\u0930 \u092e\u0947\u0902', '\u0928\u0947\u0939\u093e') === true);
  }

  sec("§3 — the anchor's SITING, source-asserted (complement, never replacement).");
  {
    const hv = read('src/agent/harvest.js');
    T('typed plane: the anchor runs AFTER the hold (hold precedence on collision)', /holds\.has\(tk\)\) \{ held\+\+;[\s\S]{0,240}messageNamesKey\(message, tk\)\) \{ anchored\+\+/.test(hv));
    T('records plane: same order, same complement', /holds\.has\(rk\)\) \{ held\+\+;[\s\S]{0,240}messageNamesKey\(message, rk\)\) \{ anchored\+\+/.test(hv));
    T('the harvest log line is widened with anchored= (witnessability, the hold\'s convention)', /applied=\$\{applied\} dropped=\$\{dropped\} held=\$\{held\} anchored=\$\{anchored\} cross_scope=\$\{crossScope\}/.test(hv));
    T('the ledger twin exists (action harvest_anchor, F-04.80 named in the row)', /action: 'harvest_anchor'[\s\S]{0,220}F-04\.80/.test(hv));
    T('the field rules 1–4 stand untouched beneath the anchor (rule 1\'s missing check follows)', /anchored\+\+; await anchorPatch\(tk, row\.name\); continue; \}[\s\S]{0,220}missing\.includes\(p\.field\)/.test(hv));
  }

  console.log(`\n   ${fail === 0 ? '\u2550\u2550 ' + pass + '/' + (pass + fail) + ' PASS \u2550\u2550' : 'FAILURES: ' + fail + ' (' + pass + '/' + (pass + fail) + ' passed)'}`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BENCH CRASH:', e && e.stack || e); process.exit(1); });
