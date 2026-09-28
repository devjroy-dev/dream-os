#!/usr/bin/env node
'use strict';
// scripts/b135_elz2_channel_turn_bench.js  RUNG b135 · CE-46 ELZ-2 cut 1 · THE CHANNEL-AWARE TURN (deterministic; reads no model, no clock).
//
// WHAT IT PROVES (the chair's rulings of 27 September 2026 on ELZ-2's read-first; the founder's Q2, Q3, Q4, Q6):
//   §1 the four WhatsApp callers (vendorInbound.js) are BYTE-IDENTICAL to the base, pinned by label on each call-site block, not on the
//      file (G6-2's F-44.207 hunk lands elsewhere in the same file); none of them passes a counterparty
//   §2 no counterparty = today's turn: keyed by phone, the Frost read made, source 'whatsapp', his notice bytes, the legacy path when
//      the flag is off
//   §3 instagram: keyed by leads.counterparty_ig_id, the Frost read skipped, phone null and source 'instagram' on the insert, V1 and V1b
//      (his yes to Q3), the persona path regardless of the flag (Q2 = 1), the WhatsApp link block only when a link is handed in, no
//      throw on a null phone (F-44.190's :732)
//   §4 whatsapp_own: keyed by phone; chatted_before drops the first-contact greeting (Q4 = 2) and is ignored on any other channel
//   §5 the header's words (Q6): "You answer messages for {studio}", no channel named, in both branches; the old byte gone from the file
//   §6 mutations of production code, each reddening its cell (A-45.14: the model double echoes nothing fixed; the store double records
//      every column it is asked for)
// Run: node scripts/b135_elz2_channel_turn_bench.js [--mutate]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const read = (r) => fs.readFileSync(P(r), 'utf8');
const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench-inert';

let pass = 0; let fail = 0; const failed = [];
function T(n, c) { if (c) { pass += 1; console.log(`  PASS  ${n}`); } else { fail += 1; failed.push(n); console.log(`  FAIL  ${n}`); } }
const sec = (t) => console.log(`\n${t}`);

// ── the model double: records what it was handed; answers as scripted ──
// LABELED AMENDMENT · CE-46 ELZ-2 cut 2 (the prompt cache, F5 (b)): the couple turn now sends its system as ONE text block carrying the cache
// breakpoint (engine.js systemBlocks); this double reads the block's text back into params.system so every cell below reads the same
// string as before, and keeps the blocks as params.systemBlocks. What the cells prove is unchanged.
function systemText(s) { return typeof s === 'string' ? s : Array.isArray(s) ? s.map((b) => (b && typeof b.text === 'string') ? b.text : '').join('\n') : String(s); }
const CAPTURED = [];
let SCRIPT = [];
const llmPath = require.resolve(P('src/lib/llm.js'));
const realLlm = require(llmPath);
require.cache[llmPath].exports = {
  ...realLlm,
  llmCreate: async (provider, params) => {
    CAPTURED.push({ provider, params: { ...JSON.parse(JSON.stringify(params)), system: systemText(params.system), systemBlocks: JSON.parse(JSON.stringify(params.system)) } });
    const step = SCRIPT.shift() || { name: 'respond_to_couple', input: { message: 'ok' } };
    return { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: `t${CAPTURED.length}`, ...step }], usage: { input_tokens: 1, output_tokens: 1 } };
  },
};
// ── the occupancy double (FACT 3's reader; its own benches prove it) ──
let DESCRIBE = { verdict: 'blocked' };
const occPath = require.resolve(P('src/lib/vendor/occupancy.js'));
const realOcc = require(occPath);
require.cache[occPath].exports = { ...realOcc, describeDate: async (ctx) => (typeof DESCRIBE === 'function' ? DESCRIBE(ctx) : DESCRIBE) };
// ── the intent extractor double (a returning client's notice calls it; a null summary keeps the verbatim fallback) ──
const intentPath = require.resolve(P('src/lib/intentExtractor.js'));
const realIntent = require(intentPath);
require.cache[intentPath].exports = { ...realIntent, getReturningBrideIntent: async () => null };

// ── the store double (C-44.3): records every table and eq column asked, every insert; leads answers by the key it was asked ──
function store({ lead = null, vendorRow = null, flag = null } = {}) {
  const log = { reads: [], inserts: [] };
  const sb = {
    log,
    from(table) {
      const q = { table, eqs: {} };
      const api = {
        select: () => api,
        eq: (c, v) => { q.eqs[c] = v; return api; },
        gte: () => api, order: () => api, in: () => api, is: () => api, update: () => api,
        insert: (row) => { log.inserts.push({ table, row }); return { select: () => ({ single: async () => ({ data: { id: 'lead-new' } }) }), then: (r) => r({ error: null }) }; },
        limit(n) { const p = api._limit(n); p.maybeSingle = () => api.maybeSingle(); return p; },
        async _limit() { log.reads.push({ table, eqs: { ...q.eqs } }); return { data: [] }; },
        async maybeSingle() {
          log.reads.push({ table, eqs: { ...q.eqs } });
          if (table === 'leads') return { data: lead };
          if (table === 'vendors') return { data: vendorRow || { status: 'active', discover_paused: false, date_check_enabled: true } };
          if (table === 'admin_config') return { data: flag === null ? null : { value: JSON.stringify(flag) } };
          if (table === 'users') return { data: { id: 'u-sarah', name: 'Sarah' } };
          if (table === 'couples') return { data: null };
          if (table === 'conversations') return { data: null };
          return { data: null };
        },
      };
      return api;
    },
  };
  return sb;
}

const DEV440 = { id: 'v-dev440', business_name: 'Dev Roy Photography', category: 'Photographer', city: 'Delhi', open_to_travel: true };
const DEVUSER = { name: 'Dev Roy', phone: '+910000000000' };
const PHONE = '919625759924';
const IGSID = 'igs-17395';
// laneFlags is purged too: it caches a flag's value in the module for a minute, and §2 reads the flag both ways.
const MINE = ['src/agent/engine.js', 'src/agent/coupleSystemPrompt.js', 'src/agent/coupleThreadFacts.js', 'src/agent/studioName.js', 'src/lib/vendor/coupleDateState.js', 'src/lib/laneFlags.js'];
function purge() { for (const r of MINE) delete require.cache[require.resolve(P(r))]; }
function engine() { purge(); return require(P('src/agent/engine.js')); }
function shell() { purge(); return require(P('src/agent/coupleSystemPrompt.js')); }

async function turn({ counterparty, inbound = 'hi', lead = null, script = [], flag = null, couplePhone = PHONE, withCp = true }) {
  CAPTURED.length = 0; SCRIPT = script.slice();
  const sb = store({ lead, flag });
  const { runCoupleAgenticTurn } = engine();
  const args = { vendor: DEV440, vendorUser: DEVUSER, conversation: { id: 'conv-1' }, couplePhone, coupleId: null, inboundMessage: inbound, supabase: sb, anthropic: null };
  if (withCp) args.counterparty = counterparty;
  const out = await runCoupleAgenticTurn(args);
  return { out, sb, calls: CAPTURED.slice(), system: CAPTURED[0] ? String(CAPTURED[0].params.system) : '' };
}
const CAPTURE = { name: 'capture_couple_lead', input: { occasion: 'wedding', event_city: 'Delhi', budget_min: 150000, name: 'Priya' } };
const DATE = { name: 'date_state', input: { date_as_spoken: '5 March 2028' } };
const leadReads = (sb) => sb.log.reads.filter((r) => r.table === 'leads');
const userReads = (sb) => sb.log.reads.filter((r) => r.table === 'users');
const leadInsert = (sb) => (sb.log.inserts.find((i) => i.table === 'leads') || {}).row;

// ══ §1 · THE FOUR CALLERS, PINNED BY LABEL ══════════════════════════════════════════════════════════════════════════════════════
// Derived by command at 9dff862 (CE-46 ELZ-2 cut 1): each `const result = await runCoupleAgenticTurn({ ... });` block in vendorInbound.js,
// sha256 of its bytes, first 16. The pin is on the BLOCK, so G6-2's F-44.207 hunk (a guard elsewhere in the file) does not move it;
// a fifth caller, or a caller passing a counterparty, is a change this rung must see.
const CALLER_PINS = ['e1eb78bac9446583', '9614c172a578681e', '13896137d6440b36', '75e76449abeda924'];
function callerBlocks() {
  const s = read('src/lib/vendorInbound.js');
  const re = /const result = await runCoupleAgenticTurn\(\{[\s\S]*?\n\s*\}\);/g; const out = []; let m;
  while ((m = re.exec(s))) out.push(m[0]);
  return out;
}

async function main() {
  const MUTATE = process.argv.includes('--mutate');

  sec('§1 the four WhatsApp callers, byte-identical by label');
  const blocks = callerBlocks();
  T('1.1 exactly four call-site blocks in vendorInbound.js', blocks.length === 4);
  T('1.2 each block matches its pin (e1eb78ba, 9614c172, 13896137, 75e76449)', blocks.map((b) => sha(b).slice(0, 16)).join(',') === CALLER_PINS.join(','));
  T('1.3 no caller passes a counterparty (the default path is the live path today)', blocks.every((b) => !/counterparty/.test(b)));
  T('1.4 every caller passes couplePhone: phone', blocks.every((b) => /couplePhone: phone,/.test(b)));

  sec('§2 no counterparty: today\'s turn, byte for byte in behaviour');
  {
    const r = await turn({ withCp: false, lead: null, script: [CAPTURE, DATE] });
    T('2.1 the returning-client read is keyed by phone', leadReads(r.sb)[0] && leadReads(r.sb)[0].eqs.phone === PHONE && !('counterparty_ig_id' in leadReads(r.sb)[0].eqs));
    T('2.2 the Frost read (users by phone) is made', userReads(r.sb).length === 1 && userReads(r.sb)[0].eqs.phone === PHONE);
    const ins = leadInsert(r.sb);
    T('2.3 the insert carries phone and source whatsapp as before, and the new column counterparty_ig_id null (a cure cell: red at the base)', ins && ins.phone === PHONE && ins.source === 'whatsapp' && ins.counterparty_ig_id === null);
    // LABELED AMENDMENT · CE-46 ELZ-3 cut 1 (F-44.227, stated by the chair 28 September 2026: every notice names its line; a named
    // client's notice only when the message opens an enquiry). The old bytes grepped across scripts/ first; b142 §1 pins the rule.
    // (2) the founder's row 5, 29 September 2026: no "couple"; the phone as +91 and 5-5.
    T('2.4 his capture notice, his row 5: "New enquiry on TDW\'s WhatsApp from +91 NNNNN NNNNN. ..."', typeof r.out.vendorNotification === 'string' && /^New enquiry on TDW's WhatsApp from \+91 \d{5} \d{5}\. /.test(r.out.vendorNotification) && /Lead saved\./.test(r.out.vendorNotification));
    T('2.5 the date line names the last four digits when no name is on file', /\.\.\.9924 asked if you're free on 5 March 2028\./.test(r.out.vendorNotification) === false && /Priya asked if you're free on 5 March 2028\./.test(r.out.vendorNotification));
    // A returning client is one with a NAME on file (engine.js: isReturningBride = !!existingLeadForCouple?.name), so the "...NNNN just
    // messaged" fallback at the old :732 is unreachable at the tree (named in the handover, not changed); the reachable fallback word is
    // the date line's (2.5, 3.11).
    const r2 = await turn({ withCp: false, lead: { id: 'l1', name: 'Sarah', intent_summary: null }, inbound: 'any update?' });
    // LABELED AMENDMENT · CE-46 ELZ-3 cut 1 (F-44.227, stated by the chair 28 September 2026: every notice names its line; a named
    // client's notice only when the message opens an enquiry). The old bytes grepped across scripts/ first; b142 §1 pins the rule.
    T('2.6 a returning client opening an enquiry: "New enquiry from Sarah on TDW\'s WhatsApp: ..."', r2.out.vendorNotification === `New enquiry from Sarah on TDW's WhatsApp: "any update?"`);
    T('2.7 the flag off: the legacy header (no persona) on the shared line', /^You answer messages for Dev Roy Photography, /.test(r.system) && !/Your name, if anyone asks/.test(r.system));
    const r3 = await turn({ withCp: false, flag: true });
    T('2.8 the flag on: the persona header on the shared line', /Your name, if anyone asks, is Eliza\./.test(r3.system));
    T('2.9 a counterparty of an unknown channel falls to the shared line (keyed by phone)', leadReads((await turn({ counterparty: { channel: 'sms', igsid: 'x' } })).sb)[0].eqs.phone === PHONE);
  }

  sec('§3 instagram');
  {
    const cp = { channel: 'instagram', phone: null, igsid: IGSID };
    const r = await turn({ counterparty: cp, couplePhone: null, lead: null, script: [CAPTURE, DATE] });
    T('3.1 the returning-client read is keyed by counterparty_ig_id, never phone', leadReads(r.sb)[0].eqs.counterparty_ig_id === IGSID && !('phone' in leadReads(r.sb)[0].eqs));
    T('3.2 the Frost read is skipped (no phone to key it)', userReads(r.sb).length === 0);
    const ins = leadInsert(r.sb);
    T('3.3 the insert: phone null, counterparty_ig_id the igsid, source instagram', ins && ins.phone === null && ins.counterparty_ig_id === IGSID && ins.source === 'instagram');
    T('3.4 the capture read (existing lead) is keyed the same way', leadReads(r.sb).every((x) => !('phone' in x.eqs)));
    // LABELED AMENDMENT · CE-46 ELZ-3 cut 1 (F-44.227, stated by the chair 28 September 2026: every notice names its line; a named
    // client's notice only when the message opens an enquiry). The old bytes grepped across scripts/ first; b142 §1 pins the rule.
    T('3.5 V1, his row 5: "New enquiry on Instagram. {summary}. Lead saved."', r.out.vendorNotification.startsWith('New enquiry on Instagram. Name: Priya, ') && /Lead saved\./.test(r.out.vendorNotification));
    T('3.6 the persona path with the flag OFF (Q2 = 1): the flag is not consulted on Instagram', /Your name, if anyone asks, is Eliza\./.test(r.system) && !r.sb.log.reads.some((x) => x.table === 'admin_config'));
    T('3.7 no link handed in: no WhatsApp link block', !/IF THEY WOULD RATHER TALK ON WHATSAPP/.test(r.system));
    const rl = await turn({ counterparty: { ...cp, enquireLink: 'https://wa.me/919888294440' }, couplePhone: null });
    T('3.8 a link handed in: the block names it, offered only when asked', /IF THEY WOULD RATHER TALK ON WHATSAPP\nDev Roy Photography also takes enquiries on WhatsApp at https:\/\/wa\.me\/919888294440\./.test(rl.system) && /Do not offer it unasked\./.test(rl.system));
    const rs = await turn({ counterparty: { channel: 'whatsapp_shared', phone: PHONE, enquireLink: 'https://wa.me/919888294440' } });
    T('3.9 the same link on the shared line is never read (no block)', !/IF THEY WOULD RATHER TALK ON WHATSAPP/.test(rs.system));
    const ru = await turn({ counterparty: cp, couplePhone: null, lead: null, inbound: 'are you free on 5 March 2028?', script: [DATE] });
    // LABELED AMENDMENT · CE-46 ELZ-3 cut 1 (R-46.5): on the thread's FIRST message the turn now composes the first-message line
    // ("New enquiry on Instagram: …") ahead of the date line (b142 §1 pins the line and case 1); the date line's bytes are unchanged
    // and still follow after one blank line. Re-pinned by label: 3.10 reads the tail, 3.11 the date line as the notice's last paragraph.
    const ruTail = typeof ru.out.vendorNotification === 'string' ? ru.out.vendorNotification.split('\n\n').pop() : '';
    T('3.10 an unnamed client on Instagram, a booked date: no throw on a null phone (F-44.190), the notice ends with the date line', typeof ru.out.vendorNotification === 'string' && ruTail.startsWith('An Instagram client asked if you'));
    T('3.11 the date line\'s {client} on Instagram is the founder\'s word, his line otherwise byte for byte', ruTail === `An Instagram client asked if you're free on 5 March 2028. I told them you'd check and get back to them. To answer, send "Tell An Instagram client" and your message.`);
    const rn = await turn({ counterparty: cp, couplePhone: null, lead: { id: 'l1', name: 'Sarah', intent_summary: null }, inbound: 'any update?' });
    // LABELED AMENDMENT · CE-46 ELZ-3 cut 1 (F-44.227, stated by the chair 28 September 2026: every notice names its line; a named
    // client's notice only when the message opens an enquiry). The old bytes grepped across scripts/ first; b142 §1 pins the rule.
    T('3.12 V1b named, opening an enquiry: "New enquiry from Sarah on Instagram: ..."', rn.out.vendorNotification === `New enquiry from Sarah on Instagram: "any update?"`);
    T('3.13 the returning path on Instagram makes no users read either', userReads(rn.sb).length === 0);
  }

  sec('§4 whatsapp_own');
  {
    const r = await turn({ counterparty: { channel: 'whatsapp_own', phone: PHONE, chatted_before: true } });
    T('4.1 keyed by phone, the Frost read made, the WhatsApp notice bytes', leadReads(r.sb)[0].eqs.phone === PHONE && userReads(r.sb).length === 1);
    T('4.2 chatted_before: the no-greeting block for this number', /THIS CLIENT HAS WRITTEN TO DEV ROY PHOTOGRAPHY ON THIS NUMBER BEFORE\nDo not introduce yourself or the studio and do not open with a greeting\./.test(r.system));
    const r0 = await turn({ counterparty: { channel: 'whatsapp_own', phone: PHONE } });
    T('4.3 without it: no such block (the first-contact greeting stands)', !/ON THIS NUMBER BEFORE/.test(r0.system) && /THIS IS THE CLIENT'S FIRST MESSAGE TO/.test(r0.system));
    const rx = await turn({ counterparty: { channel: 'whatsapp_shared', phone: PHONE, chatted_before: true } });
    T('4.4 chatted_before on the shared line is ignored', !/ON THIS NUMBER BEFORE/.test(rx.system));
    const ri = await turn({ counterparty: { channel: 'instagram', igsid: IGSID, chatted_before: true }, couplePhone: null });
    T('4.5 chatted_before on Instagram is ignored', !/ON THIS NUMBER BEFORE/.test(ri.system));
    const rp = await turn({ counterparty: { channel: 'whatsapp_own', phone: '918757788550' }, couplePhone: PHONE });
    T('4.6 the counterparty\'s phone wins over couplePhone when both are given', leadReads(rp.sb)[0].eqs.phone === '918757788550');
  }

  sec('§5 the header (Q6)');
  {
    const { buildCoupleSystemPrompt } = shell();
    const a = buildCoupleSystemPrompt({ vendor: DEV440, vendorUser: DEVUSER, useEliza: true, conversation: { inConversation: false } });
    const b = buildCoupleSystemPrompt({ vendor: DEV440, vendorUser: DEVUSER, useEliza: false, conversation: { inConversation: false } });
    const c = buildCoupleSystemPrompt({ vendor: DEV440, vendorUser: DEVUSER, isReturningBride: true, leadName: 'Sarah', useEliza: true, conversation: { inConversation: true, priorCount: 2 } });
    T('5.1 his line opens the persona header', a.startsWith('You answer messages for Dev Roy Photography, a Photographer based in Delhi. They are open to travelling. Your name, if anyone asks, is Eliza.'));
    T('5.2 his line opens the legacy header', b.startsWith('You answer messages for Dev Roy Photography, a Photographer based in Delhi. They are open to travelling.'));
    T('5.3 the returning branch too', c.startsWith('You answer messages for Dev Roy Photography, '));
    T('5.4 "WhatsApp messages" is gone from the shell', !/WhatsApp messages/.test(read('src/agent/coupleSystemPrompt.js')));
    T('5.5 no channel block leaks into a plain shared-line prompt', !/IF THEY WOULD RATHER TALK ON WHATSAPP|ON THIS NUMBER BEFORE/.test(a + b + c));
    T('5.6 no em dash in either channel block', !/[\u2013\u2014]/.test(a.slice(0, 400)) && !/IF THEY WOULD RATHER[^]*?[\u2013\u2014]/.test(read('src/agent/coupleSystemPrompt.js').split('const chattedBlock')[0].split('const linkBlock')[1] || ''));
  }

  if (MUTATE) {
    sec('§6 mutations (each must redden its cell; files restored by sha)');
    const E = 'src/agent/engine.js'; const S = 'src/agent/coupleSystemPrompt.js';
    const orig = { [E]: read(E), [S]: read(S) };
    const muts = [
      { n: 'M1 the key is always phone (3.1 red)', f: E, from: "const leadKeyColumn = cp.channel === 'instagram' ? 'counterparty_ig_id' : 'phone';", to: "const leadKeyColumn = 'phone';",
        check: async () => { const r = await turn({ counterparty: { channel: 'instagram', igsid: IGSID }, couplePhone: null }); return leadReads(r.sb)[0].eqs.counterparty_ig_id === IGSID; } },
      { n: 'M2 source always whatsapp (3.3 red)', f: E, from: "source:       cp.channel === 'instagram' ? 'instagram' : 'whatsapp',", to: "source:       'whatsapp',",
        check: async () => { const r = await turn({ counterparty: { channel: 'instagram', igsid: IGSID }, couplePhone: null, script: [CAPTURE] }); return leadInsert(r.sb).source === 'instagram'; } },
      // LABELED AMENDMENT · CE-46 ELZ-3 cut 1 (F-44.227 (3)): the capture head now reads whoWord(null, cp); M3 re-aimed at the same defect
      // (the WhatsApp head on an Instagram capture) on the new bytes, its check reading the new Instagram head.
      { n: 'M3 the WhatsApp notice head on Instagram (3.5 red)', f: E, from: "const notifHead = `${enquiryHead(null, cp)}.`;", to: "const notifHead = `New enquiry from ${cp.phone}.`;",
        check: async () => { const r = await turn({ counterparty: { channel: 'instagram', igsid: IGSID }, couplePhone: null, script: [CAPTURE] }); return r.out.vendorNotification.startsWith('New enquiry on Instagram.'); } },
      { n: 'M4 the flag consulted on Instagram (3.6 red)', f: E, from: "const useEliza = cp.channel === 'instagram' ? true : await readLaneFlag(supabase, 'couple.eliza_enabled');", to: "const useEliza = await readLaneFlag(supabase, 'couple.eliza_enabled');",
        check: async () => { const r = await turn({ counterparty: { channel: 'instagram', igsid: IGSID }, couplePhone: null }); return /Your name, if anyone asks/.test(r.system); } },
      { n: 'M5 the link block dropped (3.8 red)', f: S, from: "  const linkBlock = link\n", to: "  const linkBlock = false\n",
        check: async () => { const r = await turn({ counterparty: { channel: 'instagram', igsid: IGSID, enquireLink: 'https://wa.me/919888294440' }, couplePhone: null }); return /IF THEY WOULD RATHER TALK ON WHATSAPP/.test(r.system); } },
      { n: 'M6 chatted_before ignored on own number (4.2 red)', f: E, from: "const chattedBefore = channel === 'whatsapp_own' && c.chatted_before === true;", to: "const chattedBefore = false;",
        check: async () => { const r = await turn({ counterparty: { channel: 'whatsapp_own', phone: PHONE, chatted_before: true } }); return /ON THIS NUMBER BEFORE/.test(r.system); } },
      { n: 'M7 the Frost read made on Instagram (3.2 red)', f: E, from: "const { data: coupleUser } = cp.phone\n      ? await supabase", to: "const { data: coupleUser } = true\n      ? await supabase",
        check: async () => { const r = await turn({ counterparty: { channel: 'instagram', igsid: IGSID }, couplePhone: null }); return userReads(r.sb).length === 0; } },
    ];
    for (const m of muts) {
      const src = orig[m.f];
      if (!src.includes(m.from)) { T(`${m.n}: anchor present`, false); continue; }
      fs.writeFileSync(P(m.f), src.replace(m.from, m.to));
      let stillGreen = true;
      try { stillGreen = await m.check(); } catch (_e) { stillGreen = false; }
      fs.writeFileSync(P(m.f), src);
      T(`${m.n} reddens`, stillGreen === false);
      T(`${m.n} restored by sha`, sha(read(m.f)) === sha(src));
    }
  } else {
    console.log('\n§6 mutations: run with --mutate (production files are edited and restored by sha)');
  }

  console.log(`\nb135: ${pass} pass, ${fail} fail${fail ? `  FAILED: ${failed.join(' | ')}` : ''}`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('b135 CRASHED:', e && e.stack); process.exit(1); });
