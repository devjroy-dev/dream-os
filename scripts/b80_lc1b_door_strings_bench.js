#!/usr/bin/env node
'use strict';
// scripts/b80_lc1b_door_strings_bench.js — TDW CE-43 · LC-1b · two truthful door strings.
// Runnable from any working directory (Q-SP-5). Exit 0 green, 1 red, 2 bench error.
//
// WHAT IS CURED, AND WHAT THIS BENCH DRIVES
//   F-43.28(c) · src/lib/vendorInbound.js, the invoice confirmation line on the vendor
//     WhatsApp lane stops promising a PDF the Meta lane cannot send (founder veto V1 YES).
//     §4 runs the SHIPPED processVendorInbound (its deps are injected by its own design,
//     b06_m3 §2's technique) and reads the bytes handed to sendWhatsApp. The wire is the
//     witness.
//   F-43.29 / F-43.31 · the Updated: calendar line renders the full month on BOTH twins,
//     mutationLines in src/api/vendor-engine/chat.js and in
//     src/lib/vendor/calendarSignals.js (ruled D2 site (a), lane (y); veto V2 YES).
//     §2 drives both exported builders on the same inputs.
//   The formatter · longDateYear in src/lib/witnessLine.js, built on longDate (ruled (ii)).
//     §1.
//
// WHAT IS PINNED, NOT CURED (ruled; F-43.33 is LC-4's)
//   Cancelled: and the crew witness line stay raw ISO, byte for byte, on both twins (§3).
//   event_time rides raw on the Updated: line (ruling 7).
//   The media loop in vendorInbound.js still ATTEMPTS the PDF send (§4.3 pins that the
//   attempt still happens, so the walk card's Railway claim is derived, not assumed;
//   F-43.32 is LC-4's).
//
// NON-VACUITY (§6): every mutation edits PRODUCTION code, compiled in memory under its
// real path (b79's technique; nothing is written to disk), and turns its named cell RED.
// Derived on a clean base worktree at f277b6e4 (this file copied in): 12 passed, 19 failed.
// RED there: §1.1-§1.4, §1.7, both twins' C2a/C2b/C6, §4.1, §4.2, and §6 M1-M4 (their
// anchors are the cure's own bytes). GREEN there, so the red is not vacuous: §1.5, §1.6,
// both C2c, §2.9, all of §3, §4.3, §5.1 and §6 M5. Cured tree: 31 passed, 0 failed.
// The door modules build a Supabase client at load; a dummy lets them load (b0457/b79 precedent).
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-dummy-key';
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.resolve(__dirname, '..');
const P = (rel) => path.join(ROOT, rel);

let pass = 0, fail = 0;
const fails = [];
const sec = (s) => console.log(`\n── ${s} ──`);
function ok(cond, name) {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; fails.push(name); console.log(`  FAIL ${name}`); }
}
const tryRequire = (rel) => { try { return require(P(rel)); } catch (e) { console.log(`  (require ${rel} failed: ${e.message.split('\n')[0]})`); return null; } };

// The fixture, in the founder's own words from the LC-1 walk (card b, card d).
const UPD = (over = {}) => ({ ok: true, action: 'edit', event: { title: 'Dholakia · wedding', event_date: '2026-09-22', event_time: null, ...over } });
const CAN = (over = {}) => ({ ok: true, action: 'cancel', event: { title: 'Dholakia · wedding', event_date: '2026-09-22', event_time: null, ...over } });
const CREW = () => ({ ok: true, action: 'assign', member: { name: 'Rahul' }, event: { title: 'Dholakia · wedding', event_date: '2026-09-22', event_time: null } });

const V2 = "Updated: Dholakia · wedding — 22 September 2026. The calendar's set.";
const V2_TIME = "Updated: Dholakia · wedding — 22 September 2026 at 18:00:00. The calendar's set.";
const CAN_PIN = "Cancelled: Dholakia · wedding — 2026-09-22. It's off your calendar.";
const CREW_PIN = "Rahul's on the Dholakia · wedding — 2026-09-22.";
const V1 = 'Invoice TDW/DEV440/11 for Tandon is ready. Find it in the invoices list.';
const V1_NOCLIENT = 'Invoice TDW/DEV440/11 is ready. Find it in the invoices list.';
const ISO = /\b\d{4}-\d{2}-\d{2}\b/;

function updatedCells(ml) {
  const r = {};
  try {
    r.C2a = ml([UPD()]) === V2;
    r.C2b = ml([UPD({ event_time: '18:00:00' })]) === V2_TIME;
    r.C6 = !ISO.test(ml([UPD()])) && !ISO.test(ml([UPD({ event_time: '18:00:00' })]));
    r.C2c = ml([UPD({ event_date: null })]).startsWith('Updated: Dholakia · wedding — ');
  } catch (e) { r.err = e.message; }
  return r;
}
function pinCells(ml) {
  const r = {};
  try {
    r.C4 = ml([CAN()]) === CAN_PIN;
    r.C5 = ml([CREW()]) === CREW_PIN;
  } catch (e) { r.err = e.message; }
  return r;
}

// ── the WhatsApp door, stub estate (b06_m3 §2's shape) ──────────────────────
function stubEstate(client) {
  const rows = {
    users: { id: 'u1', phone: '+919888294440', name: 'Dev' },
    vendors: { id: 'v1', user_id: 'u1', onboarding_state: 'complete', category: 'photographer' },
    conversations: { id: 'c1', vendor_id: 'v1', kind: 'vendor_self' },
    records: { id: 'b1', client, phone: null, amount: 40000, amount_received: 0, note: null },
  };
  const chain = (table) => {
    const api = {};
    for (const m of ['select', 'eq', 'is', 'order', 'limit', 'update', 'neq', 'in', 'gte', 'lte', 'not']) api[m] = () => api;
    api.insert = () => api;
    api.single = async () => ({ data: rows[table] || {}, error: null });
    api.maybeSingle = async () => ({ data: rows[table] || null, error: null });
    api.then = (res) => res({ data: rows[table] ? [rows[table]] : [], error: null });
    return api;
  };
  return { supabase: { from: chain, schema: () => ({ from: chain }) } };
}
function doorDeps(sent, supabase) {
  return {
    sendWhatsApp: async (to, text, media) => { sent.push({ to, text, media: media || [] }); return { sid: 'SM1' }; },
    runTurn: async () => ({
      reply: 'Tandon is logged.',
      tool_calls: [{ name: 'donna', input: {}, donna_calls: [{ name: 'donna_invoice_pdf', input: { binder_id: 'b1' } }] }],
    }),
    resolveAgentForVendor: async () => ({ agentId: 'a1' }),
    fetchCalendarSnapshot: async () => '', fetchScratchpad: async () => '', fetchLeadPings: async () => '',
    applyCalendarSignals: async () => ({ suffix: '' }),
    buildLlmForTurn: async () => ({}),
    matchModeWord: () => null, applyModeFlip: async () => ({ changed: false }), MODE_FLIP_LINES: {},
    matchFreshWord: () => false, FRESH_THREAD_LINE: 'Fresh thread.', abandonActiveThread: async () => ({}),
    generateInvoiceForBinder: async () => ({ ok: true, invoice_number: 'TDW/DEV440/11', pdf_url: 'https://example.invalid/i.pdf' }),
    enquiryToBinder: async () => ({ ok: true }),
    runCoupleAgenticTurn: async () => ({ reply: '', toolCalls: [] }),
    ensureCoupleRow: async () => ({}), captureField: async () => ({}),
    buildDisambiguationQuestion: () => '', interpretDisambiguationReply: async () => ({}),
    vendorDisplayName: () => 'V', checkImageThrottle: async () => ({ allowed: true }),
    markRejectionSent: async () => ({}), extractCalendarFromImage: async () => [],
    webhookCore: require(P('src/lib/webhookCore.js')), supabase, anthropic: {},
  };
}
let sidSeq = 0;
async function wire(door, client) {
  const sent = [];
  const { supabase } = stubEstate(client);
  await door.processVendorInbound({
    phone: '+919888294440', body: 'Raise the invoice', profileName: 'Dev',
    messageSid: `wamid.b80.${++sidSeq}`, internalReplay: false, trimmedBody: 'Raise the invoice',
    numMedia: 0, hasMedia: false, mediaUrl: null, rawPayload: {},
  }, doorDeps(sent, supabase));
  return sent;
}
async function doorCells(door) {
  const r = {};
  try {
    const a = await wire(door, 'Tandon');
    const text = a.filter((s) => s.text).map((s) => s.text).join('\n');
    r.C1a = text.split('\n').includes(V1) && !/sending the PDF/.test(text);
    r.C1media = a.some((s) => s.media.length === 1 && s.media[0] === 'https://example.invalid/i.pdf');
    const b = await wire(door, null);
    const tb = b.filter((s) => s.text).map((s) => s.text).join('\n');
    r.C1b = tb.split('\n').includes(V1_NOCLIENT) && !/sending the PDF/.test(tb);
  } catch (e) { r.err = e.message; }
  return r;
}

const loadMutated = (rel, from, to) => {
  const file = P(rel);
  const srcText = fs.readFileSync(file, 'utf8');
  if (!srcText.includes(from)) return { missing: true };
  try {
    const m = new Module(file, module);
    m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
    m._compile(srcText.replace(from, to), file);
    return { mod: m.exports };
  } catch (e) { console.log(`  (mutated ${rel} did not load: ${e.message.split('\n')[0]})`); return { failed: true }; }
};

async function main() {
  const wl = tryRequire('src/lib/witnessLine.js');
  const chat = tryRequire('src/api/vendor-engine/chat.js');
  const cal = tryRequire('src/lib/vendor/calendarSignals.js');
  const door = tryRequire('src/lib/vendorInbound.js');

  sec('§1 — longDateYear, one home beside longDate (ruled (ii))');
  const ldy = wl && wl.longDateYear;
  ok(typeof ldy === 'function', '§1.1 witnessLine exports longDateYear');
  ok(!!ldy && ldy('2026-09-22') === '22 September 2026', '§1.2 2026-09-22 → 22 September 2026');
  ok(!!ldy && ldy('2026-11-01') === '1 November 2026', '§1.3 2026-11-01 → 1 November 2026 (no leading zero)');
  ok(!!ldy && ldy(null) === null && ldy(undefined) === undefined && ldy('soon') === 'soon' && ldy('2026-13-01') === '2026-13-01',
    '§1.4 anything not a plain ISO date comes back unchanged (raw fallback)');
  ok(!!wl && wl.longDate('2026-09-01') === '1 September', '§1.5 longDate itself is unchanged (the wire guard reads it)');
  {
    const src = fs.readFileSync(P('src/lib/witnessLine.js'), 'utf8').replace(/\/\/.*$/gm, '');
    ok((src.match(/'September'/g) || []).length === 1, '§1.6 witnessLine holds ONE month list (no second vocabulary)');
    const body = (src.match(/function longDateYear\([^)]*\)\s*\{[\s\S]*?\n\}/) || [''])[0];
    ok(/longDate\(/.test(body), '§1.7 longDateYear is built on longDate');
  }

  sec('§2 — the Updated: line renders the full month on both twins (V2)');
  for (const [name, mod] of [['chat.js', chat], ['calendarSignals.js', cal]]) {
    const c = mod && mod.mutationLines ? updatedCells(mod.mutationLines) : { err: 'no mutationLines' };
    if (c.err) console.log(`  (${name}: ${c.err})`);
    ok(c.C2a === true, `§2 ${name} C2a: "${V2}"`);
    ok(c.C2b === true, `§2 ${name} C2b: with a time, event_time rides raw after the full date`);
    ok(c.C6 === true, `§2 ${name} C6: no ISO date on the Updated: line`);
    ok(c.C2c === true, `§2 ${name} C2c: a missing date keeps the line's old shape (no throw)`);
  }
  if (chat && cal && chat.mutationLines && cal.mutationLines) {
    const set = [[UPD()], [UPD({ event_time: '09:30:00' })], [CAN()], [CREW()], [UPD(), CAN()]];
    ok(set.every((d) => chat.mutationLines(d) === cal.mutationLines(d)), '§2.9 the twins stay byte-identical (F-04.98, C-43.1)');
  } else ok(false, '§2.9 twins not loadable');

  sec('§3 — Cancelled: and the crew line stay byte-pinned (ruled; F-43.33 is LC-4\'s)');
  for (const [name, mod] of [['chat.js', chat], ['calendarSignals.js', cal]]) {
    const c = mod && mod.mutationLines ? pinCells(mod.mutationLines) : { err: 'no mutationLines' };
    ok(c.C4 === true, `§3 ${name} C4: "${CAN_PIN}"`);
    ok(c.C5 === true, `§3 ${name} C5: "${CREW_PIN}"`);
  }

  sec('§4 — the WhatsApp wire (V1), the shipped processVendorInbound');
  const d = door && door.processVendorInbound ? await doorCells(door) : { err: 'no processVendorInbound' };
  if (d.err) console.log(`  (door: ${d.err})`);
  ok(d.C1a === true, `§4.1 C1a: the wire carries "${V1}" and never "sending the PDF"`);
  ok(d.C1b === true, `§4.2 C1b: no client → "${V1_NOCLIENT}"`);
  ok(d.C1media === true, '§4.3 the media loop still attempts the PDF send (untouched; F-43.32 → LC-4)');

  sec('§5 — columns this bench doubles exist in the witnessed docs (R-40.80)');
  {
    const eng = fs.readFileSync(P('docs/db/ENGINE_SCHEMA.md'), 'utf8');
    const i = eng.indexOf('## engine.records ');
    const j = i < 0 ? -1 : eng.indexOf('\n## ', i + 5);
    const rec = i < 0 ? '' : eng.slice(i, j < 0 ? undefined : j);
    const has = (col) => new RegExp(`^\\d+\\. ${col} `, 'm').test(rec);
    ok(['id', 'agent_id', 'client', 'phone', 'amount', 'amount_received', 'note'].every(has),
      '§5.1 engine.records: the door\'s invoice select (id, client, phone, amount, amount_received, note, agent_id) is witnessed');
  }

  sec('§6 — mutations of production code (in memory, real paths)');
  {
    const r = loadMutated('src/lib/witnessLine.js', 'return `${l} ${String(iso).trim().slice(0, 4)}`;', 'return l;');
    ok(!!r.mod && r.mod.longDateYear('2026-09-22') !== '22 September 2026', '§6 M1 year dropped from longDateYear → §1.2 RED');
  }
  for (const [rel, name] of [['src/api/vendor-engine/chat.js', 'chat.js'], ['src/lib/vendor/calendarSignals.js', 'calendarSignals.js']]) {
    const m2 = loadMutated(rel, "`Updated: ${e.title} — ${updWhen}.", "`Updated: ${e.title} — ${when}.");
    const c2 = m2.mod && m2.mod.mutationLines ? updatedCells(m2.mod.mutationLines) : {};
    ok(c2.C2a === false && c2.C6 === false, `§6 M2 ${name} Updated: back to raw ISO → C2a and C6 RED`);
    const m3 = loadMutated(rel, "`Cancelled: ${e.title}${e.event_date ? ` — ${when}`", "`Cancelled: ${e.title}${e.event_date ? ` — ${updWhen}`");
    const c3 = m3.mod && m3.mod.mutationLines ? pinCells(m3.mod.mutationLines) : {};
    ok(c3.C4 === false, `§6 M3 ${name} full month creeps onto Cancelled: → C4 RED`);
  }
  {
    const m4 = loadMutated('src/lib/vendorInbound.js',
      "is ready. Find it in the invoices list.`", "— sending the PDF now.`");
    const c4 = m4.mod && m4.mod.processVendorInbound ? await doorCells(m4.mod) : {};
    ok(c4.C1a === false && c4.C1b === false, '§6 M4 vendorInbound PDF promise restored → C1a and C1b RED');
    const m5 = loadMutated('src/lib/vendorInbound.js',
      "const mediaMsg = await sendWhatsApp(phone, '', [d.pdf_url]);", "const mediaMsg = null;");
    const c5 = m5.mod && m5.mod.processVendorInbound ? await doorCells(m5.mod) : {};
    ok(c5.C1media === false, '§6 M5 media attempt removed → §4.3 RED (the pin is not vacuous)');
  }

  console.log(`\n════════  ${pass} passed, ${fail} failed  ════════\n`);
  if (fail) { console.log('RED. Failing checks:'); fails.forEach((f) => console.log('   ·', f)); process.exit(1); }
  process.exit(0);
}

main().catch((e) => { console.error('BENCH ERROR', e); process.exit(2); });
