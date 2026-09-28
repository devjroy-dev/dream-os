'use strict';
// scripts/b142_elz3_first_message_alert_bench.js  RUNG b142 · CE-46 ELZ-3 cut 1 · THE VENDOR'S ALERT ON EVERY NEW ENQUIRY (R-46.5),
// F-44.228 (the TDW-link site onto the one door), the founder's Q7 byte, the brief's channel word. Deterministic: no model, no clock.
//   §1 the turn composes a first-message notice on the thread's FIRST message when neither a capture nor a returning notice was composed,
//      on each of the three channels; NOT on a later message of the same thread (the chair's case 1); the capture and returning lines
//      byte-unchanged; the date line still joins; an empty message composes nothing; the notice is recorded on vendor_self (F-44.174).
//   §2 vendorInbound.js: four sendVendorEnquiryAlert callers (the TDW-link site joined, F-44.228), the fallback line gone, no direct
//      sendWhatsApp of a vendor notice at that site, the TDW-link site passing her words (brideMessage).
//   §3 webhookCore.GRACEFUL_TURN_LINE is the founder's Q7 byte, no em dash, exported and read by index.js.
//   §4 the shut-window brief's {{bride}} names the line when no name is on file (the founder's row 6: {phone} on TDW's WhatsApp / someone
//      on Instagram / {phone} on your own number, the phone read from the notice's head; no word "couple" anywhere, §1.12 and §4.6c),
//      the name when one is; driven through the REAL sendVendorEnquiryAlert with its transport doubled.
//   §5 mutations (--mutate) of production code, each reddening its named cell; files restored by sha256.
// Run: node scripts/b142_elz3_first_message_alert_bench.js [--mutate]
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

// ── the model double (b135's shape): answers as scripted, echoes nothing fixed (A-45.14) ──
let SCRIPT = [];
const llmPath = require.resolve(P('src/lib/llm.js'));
const realLlm = require(llmPath);
require.cache[llmPath].exports = {
  ...realLlm,
  llmCreate: async () => {
    const step = SCRIPT.shift() || { name: 'respond_to_couple', input: { message: 'ok' } };
    return { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: `t${Math.random()}`, ...step }], usage: { input_tokens: 1, output_tokens: 1 } };
  },
};
const occPath = require.resolve(P('src/lib/vendor/occupancy.js'));
const realOcc = require(occPath);
require.cache[occPath].exports = { ...realOcc, describeDate: async () => ({ verdict: 'blocked' }) };
const intentPath = require.resolve(P('src/lib/intentExtractor.js'));
const realIntent = require(intentPath);
let INTENT = null; let INTENT_CALLS = 0;
require.cache[intentPath].exports = { ...realIntent, getReturningBrideIntent: async () => { INTENT_CALLS += 1; return INTENT; } };

// ── the store double (C-44.3): leads by the key asked; messages rows configurable (FACT 1 reads them); vendor_self thread present ──
function store({ lead = null, rows = [] } = {}) {
  const log = { reads: [], inserts: [] };
  return {
    log,
    from(table) {
      const q = { table, eqs: {} };
      const api = {
        select: () => api,
        eq: (c, v) => { q.eqs[c] = v; return api; },
        gte: () => api, order: () => api, in: () => api, is: () => api, update: () => api,
        insert: (row) => { log.inserts.push({ table, row }); return { select: () => ({ single: async () => ({ data: { id: 'lead-new' } }) }), then: (r) => r({ error: null }) }; },
        limit(n) { const p = api._limit(n); p.maybeSingle = () => api.maybeSingle(); return p; },
        // a fresh array per read, as Postgres returns one (the turn's history read reverses its copy in place)
        async _limit() { log.reads.push({ table, eqs: { ...q.eqs } }); if (table === 'messages') return { data: rows.map((x) => ({ ...x })) }; return { data: [] }; },
        async maybeSingle() {
          log.reads.push({ table, eqs: { ...q.eqs } });
          if (table === 'leads') return { data: lead };
          if (table === 'vendors') return { data: { status: 'active', discover_paused: false, date_check_enabled: true } };
          if (table === 'admin_config') return { data: null };
          if (table === 'users') return { data: { id: 'u-sarah', name: 'Sarah' } };
          if (table === 'conversations') return { data: q.eqs.kind === 'vendor_self' ? { id: 'vs-1' } : null };
          return { data: null };
        },
      };
      return api;
    },
  };
}
const DEV440 = { id: 'v-dev440', business_name: 'Dev Roy Photography', category: 'Photographer', city: 'Delhi', open_to_travel: true };
const DEVUSER = { name: 'Dev Roy', phone: '+910000000000' };
const PHONE = '919625759924';
const FP = '+91 96257 59924'; // the founder's phone form (29 September 2026)
const IGSID = 'igs-17395';
const MINE = ['src/agent/engine.js', 'src/agent/coupleSystemPrompt.js', 'src/agent/coupleThreadFacts.js', 'src/agent/studioName.js', 'src/lib/vendor/coupleDateState.js', 'src/lib/laneFlags.js'];
function purge() { for (const r of MINE) delete require.cache[require.resolve(P(r))]; }
function engine() { purge(); return require(P('src/agent/engine.js')); }
const ago = (m) => new Date(Date.UTC(2026, 8, 27, 10, 0, 0) - m * 60000).toISOString();
// the thread's rows as Postgres returns them (newest first); the message in hand is the newest inbound row, dropped once by FACT 1
const inHand = (body) => ({ direction: 'inbound', body, sent_by: 'couple', created_at: ago(0) });
const daysAgo = (d) => new Date(Date.now() - d * 86400000).toISOString(); // relative to the moment the rows are built, just before the turn
// an earlier exchange whose newest row is `d` days before the message in hand (the in-hand row at the real now)
const thread = (body, d) => [{ direction: 'inbound', body, sent_by: 'couple', created_at: new Date().toISOString() }, { direction: 'outbound', body: 'Is your wedding one day?', sent_by: 'agent', created_at: daysAgo(d) }, { direction: 'inbound', body: 'hello', sent_by: 'couple', created_at: daysAgo(d + 0.001) }];
const earlier = [{ direction: 'outbound', body: 'Is your wedding one day?', sent_by: 'agent', created_at: ago(30) }, { direction: 'inbound', body: 'hello', sent_by: 'couple', created_at: ago(31) }];

const SEEN = [];
async function turn({ counterparty, inbound = 'hi', lead = null, script = [], rows = null, intent = null }) {
  SCRIPT = script.slice(); INTENT = intent; INTENT_CALLS = 0;
  const sb = store({ lead, rows: rows || [inHand(inbound)] });
  const { runCoupleAgenticTurn } = engine();
  const out = await runCoupleAgenticTurn({ vendor: DEV440, vendorUser: DEVUSER, conversation: { id: 'conv-1' }, couplePhone: PHONE, coupleId: null, inboundMessage: inbound, supabase: sb, anthropic: null, counterparty });
  if (typeof out.vendorNotification === 'string') SEEN.push(out.vendorNotification);
  const recorded = sb.log.inserts.filter((i) => i.table === 'messages' && i.row && i.row.conversation_id === 'vs-1').map((i) => i.row.body);
  return { out, sb, recorded };
}
const CAPTURE = { name: 'capture_couple_lead', input: { occasion: 'wedding', event_city: 'Delhi', budget_min: 150000, name: 'Priya' } };
const DATE = { name: 'date_state', input: { date_as_spoken: '5 March 2028' } };
const SHARED = { channel: 'whatsapp_shared', phone: PHONE };
const IG = { channel: 'instagram', phone: null, igsid: IGSID };
const OWN = { channel: 'whatsapp_own', phone: PHONE, igsid: null, chatted_before: false };

async function cells() {
  sec('§1 the notices per enquiry (R-46.5 with F-44.227)');
  const Q = 'Are you free on 5 March 2028?';
  let r = await turn({ counterparty: SHARED, inbound: Q });
  T('1.1 shared line, first message, no capture: his row 1', r.out.vendorNotification === `New enquiry on TDW's WhatsApp from ${FP}: "${Q}"`);
  T('1.1b recorded on vendor_self from the same bytes (F-44.174)', r.recorded.length === 1 && r.recorded[0] === r.out.vendorNotification);
  r = await turn({ counterparty: IG, inbound: Q });
  T('1.2 Instagram, first message: his row 2, no number', r.out.vendorNotification === `New enquiry on Instagram: "${Q}"`);
  r = await turn({ counterparty: OWN, inbound: 'hi' });
  T('1.3 own number, first message: his row 3 (OWN_NUMBER_FIRST_ALERT true, his row 7)', r.out.vendorNotification === `New enquiry on your own number from ${FP}: "hi"`);
  r = await turn({ counterparty: SHARED, inbound: 'Delhi, in March', rows: thread('Delhi, in March', 0.02) });
  T('1.4 a later message inside the enquiry, no lead, no capture: NO notice (F-44.227 (1))', r.out.vendorNotification === null && r.recorded.length === 0);
  r = await turn({ counterparty: SHARED, inbound: 'hi', script: [CAPTURE] });
  T('1.5 a capture on the first message: ONE notice, his row 5 head', /^New enquiry on TDW's WhatsApp from \+91 96257 59924\. Name: Priya.*Lead saved\./s.test(r.out.vendorNotification || '') && !/: "hi"/.test(r.out.vendorNotification));
  r = await turn({ counterparty: IG, inbound: 'hi', script: [CAPTURE] });
  T('1.5b a capture on Instagram: his row 5 head', /^New enquiry on Instagram\. Name: Priya/.test(r.out.vendorNotification || ''));
  const SARAH = { id: 'l1', name: 'Sarah', phone: PHONE };
  r = await turn({ counterparty: SHARED, inbound: 'hi', lead: SARAH });
  T('1.6 a named client opening an enquiry (first message on the thread): the named line', r.out.vendorNotification === `New enquiry from Sarah on TDW's WhatsApp: "hi"`);
  r = await turn({ counterparty: SHARED, inbound: 'hi', lead: SARAH, rows: thread('hi', 2) });
  T('1.6b a named client two days into the enquiry: NO notice, and no intent read (F-44.227 (1))', r.out.vendorNotification === null && r.recorded.length === 0 && INTENT_CALLS === 0);
  r = await turn({ counterparty: SHARED, inbound: 'hi', lead: SARAH, rows: thread('hi', 8) });
  T('1.6c a named client after 8 days of silence opens a new enquiry: the named line (F-44.227 (2))', r.out.vendorNotification === `New enquiry from Sarah on TDW's WhatsApp: "hi"`);
  r = await turn({ counterparty: SHARED, inbound: 'hello again', rows: thread('hello again', 8) });
  T('1.6d an unnamed sender after 8 days: the first-message line again', r.out.vendorNotification === `New enquiry on TDW's WhatsApp from ${FP}: "hello again"`);
  r = await turn({ counterparty: SHARED, inbound: 'hi', lead: SARAH, intent: 'Sarah is asking if you\'re available on 5 March 2029.' });
  T('1.6e with an intent summary: his row 4, "Message:"', r.out.vendorNotification === `New enquiry from Sarah on TDW's WhatsApp. Sarah is asking if you're available on 5 March 2029.\n\nMessage: "hi"` && INTENT_CALLS === 1);
  r = await turn({ counterparty: IG, inbound: 'hi', lead: { id: 'l2', name: 'Riya', counterparty_ig_id: IGSID } });
  T('1.6f a named Instagram client opening an enquiry: the named line on Instagram', r.out.vendorNotification === `New enquiry from Riya on Instagram: "hi"`);
  r = await turn({ counterparty: SHARED, inbound: 'hi', lead: SARAH, rows: thread('hi', 7 - 1 / 1440) });
  T('1.10 seven days less a minute is the same enquiry: no notice (no more than 7 days apart)', r.out.vendorNotification === null);
  r = await turn({ counterparty: IG, inbound: Q, script: [DATE] });
  T('1.7 the date line joins the first-message line', typeof r.out.vendorNotification === 'string' && r.out.vendorNotification.startsWith(`New enquiry on Instagram: "${Q}"\n\n`) && /An Instagram client asked/.test(r.out.vendorNotification));
  r = await turn({ counterparty: IG, inbound: Q, script: [DATE], rows: thread(Q, 0.02) });
  T('1.7b a date question inside the enquiry: the date line alone still reaches him', typeof r.out.vendorNotification === 'string' && r.out.vendorNotification.startsWith('An Instagram client asked'));
  r = await turn({ counterparty: SHARED, inbound: '   ', rows: [inHand('   ')] });
  T('1.8 an empty message composes nothing', r.out.vendorNotification === null);
  T('1.12 no notice composed in §1 uses the word "couple" (the founder, 29 September)', !SEEN.some((t) => /couple/i.test(t)));
  T('1.9 the return keeps its shape (reply, toolCalls, iterations, vendorNotification, leadName)', ['reply', 'toolCalls', 'iterations', 'vendorNotification', 'leadName'].every((k) => k in r.out));
  const TF = require(P('src/agent/coupleThreadFacts.js'));
  const failed = await TF.threadFacts({ supabase: { from: () => ({ select: () => ({ eq: () => ({ order: () => ({ limit: async () => ({ data: null, error: { message: 'x' } }) }) }) }) }) }, conversationId: 'c', inboundBodyAsStored: 'x', historyLength: 3 });
  const th3 = thread('x', 3);
  T('1.11 FACT 1 carries the newest earlier row\'s time; a failed read carries none (so it opens nothing)', TF.factsFromRows(th3, 'x').lastPriorAt === th3[1].created_at && failed.inConversation === true && failed.lastPriorAt === null);

  sec('§2 vendorInbound.js: the four callers of the one door (F-44.228)');
  const inb = read('src/lib/vendorInbound.js');
  const code = inb.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  T('2.1 exactly four sendVendorEnquiryAlert( calls', (code.match(/sendVendorEnquiryAlert\(/g) || []).length === 4);
  T('2.2 the TDW-link fallback line is gone', !inb.includes("New enquiry via your TDW link from") && !inb.includes("I'm collecting their details now"));
  T('2.3 no direct sendWhatsApp(vendorPhone, …) remains', !/sendWhatsApp\(vendorPhone/.test(code));
  T('2.4 four sites pass her words as brideMessage', (code.match(/brideMessage:/g) || []).length === 4);
  T('2.5 the TDW-link site passes the stripped message as the quote and the brief\'s {{3}}', /scrubModelFrame\(result\.vendorNotification, stripRoutingToken\(body\) \|\| 'hi',[\s\S]{0,700}brideMessage: stripRoutingToken\(body\) \|\| 'hi',/.test(code));
  T('2.6 the TDW-link site keeps its ctx label', /ctx: 'vendorInbound:notification\(tdw-link\)'/.test(code));

  sec('§3 the founder\'s Q7 byte in its one home');
  delete require.cache[require.resolve(P('src/lib/webhookCore.js'))];
  const wc = require(P('src/lib/webhookCore.js'));
  T('3.1 GRACEFUL_TURN_LINE is his line exactly', wc.GRACEFUL_TURN_LINE === 'Something went wrong on our side. Please send that again in a minute.');
  T('3.2 no em dash in it (R-45.30)', !/\u2014/.test(wc.GRACEFUL_TURN_LINE));
  T('3.3 one home: the literal appears once in src', (() => { let n = 0; const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js') && fs.readFileSync(p, 'utf8').includes('Something went wrong on our side. Please send that again')) n += 1; } }; walk(P('src')); return n === 1; })());
  T('3.4 index.js hands the export to the Instagram lane; vendorInbound reads the export', /gracefulLine: webhookCore\.GRACEFUL_TURN_LINE/.test(read('src/index.js')) && /sendWhatsApp\(phone, webhookCore\.GRACEFUL_TURN_LINE\)/.test(inb));

  sec('§4 the shut-window brief names the channel when no name is on file');
  const EA = P('src/lib/vendor/enquiryAlert.js');
  delete require.cache[require.resolve(EA)];
  const ea0 = require(EA);
  const ea = { ...ea0, briefBrideWord: typeof ea0.briefBrideWord === 'function' ? ea0.briefBrideWord : () => undefined }; // at an uncured tree the export is absent: red cells, not a throw
  T('4.1 briefBrideWord: a name wins', ea.briefBrideWord('Sarah', null, 'igReply:notification') === 'Sarah');
  const HEAD_SHARED = `New enquiry on TDW's WhatsApp from ${FP}: "hi"`;
  const HEAD_OWN = `New enquiry on your own number from ${FP}: "hi"`;
  T('4.2 briefBrideWord: Instagram by ctx, his row 6', ea.briefBrideWord(null, null, 'igReply:notification', 'New enquiry on Instagram: "hi"') === 'someone on Instagram');
  T('4.3 briefBrideWord: own number by ctx, the phone from the head', ea.briefBrideWord('', null, 'ownNumber:notification', HEAD_OWN) === `${FP} on your own number`);
  T('4.4 briefBrideWord: the shared line by ctx, the phone from the head', ea.briefBrideWord(null, null, 'vendorInbound:notification(tdw-link)', HEAD_SHARED) === `${FP} on TDW's WhatsApp`);
  T('4.5 an explicit channel wins over ctx', ea.briefBrideWord(null, 'instagram', 'vendorInbound:notification(sticky)', HEAD_SHARED) === 'someone on Instagram');
  T('4.6 an unknown ctx reads the shared line', ea.briefBrideWord(null, null, undefined, HEAD_SHARED) === `${FP} on TDW's WhatsApp`);
  T('4.6b a notice with no head (the date line alone) carries no phone: "someone on {line}" (put to the chair)', ea.briefBrideWord(null, null, 'vendorInbound:notification(sticky)', "...9924 asked if you're free on 5 March 2028.") === "someone on TDW's WhatsApp");
  T('4.6c no brief word uses "couple"', ['igReply:x', 'ownNumber:x', 'vendorInbound:x'].every((c) => !/couple/i.test(String(ea.briefBrideWord(null, null, c, HEAD_SHARED)) + String(ea.briefBrideWord(null, null, c, '')))));
  const sentVars = [];
  const deps = { sendWhatsApp: async () => { throw new Error('in-window path must not run'); }, sendWa: async (a) => { sentVars.push(a.vars); return { sent: true, result: { wamid: 'w1' } }; }, readLaneFlag: async () => true, vendorWindowOpen: async () => ({ open: false, reason: 'window_closed' }) };
  const out = await ea.sendVendorEnquiryAlert({ toPhone: '+910000000000', text: HEAD_SHARED, vendorName: 'Dev', brideName: null, brideMessage: 'Are you free on 5 March 2028?', link: 'https://x', supabase: null, vendorId: 'v', ctx: 'vendorInbound:notification(sticky)' }, deps);
  T('4.7 through the real door, shut window, shared line, no name: {{2}} is his row 6 with the phone from the head', out && out.path === 'template' && sentVars.length === 1 && sentVars[0].bride === `${FP} on TDW's WhatsApp` && sentVars[0].name === 'Dev');
  const out2 = await ea.sendVendorEnquiryAlert({ toPhone: '+910000000000', text: 'x', vendorName: 'Dev', brideName: 'Sarah', brideMessage: 'hi', link: 'https://x', supabase: null, vendorId: 'v', ctx: 'igReply:notification' }, deps);
  T('4.8 through the real door with a name: the name, the channel word unused', out2 && out2.path === 'template' && sentVars[1].bride === 'Sarah');
}

const MUTATIONS = [
  { n: 'M1 the first-message composer dropped at the hunk', f: 'src/agent/engine.js', from: '(returningBrideNotif || firstMessageNotice(cp, inboundMessage, leadName))', to: 'returningBrideNotif', reds: ['1.1', '1.2', '1.3', '1.6d'] },
  { n: 'M2 F-44.227 (1) removed: every message of a named client alerts', f: 'src/agent/engine.js', from: 'if (isReturningBride && opensThisEnquiry && noticeAllowed(cp)) {', to: 'if (isReturningBride) {', reds: ['1.6b'] },
  { n: 'M3 F-44.227 (1) removed at the composition: inside an enquiry alerts', f: 'src/agent/engine.js', from: 'const baseNotif = firstContactNotif || (opensThisEnquiry ? (returningBrideNotif || firstMessageNotice(cp, inboundMessage, leadName)) : null);', to: 'const baseNotif = firstContactNotif || returningBrideNotif || firstMessageNotice(cp, inboundMessage, leadName);', reds: ['1.4', '1.10'] },
  { n: 'M4 F-44.227 (2) removed: a new enquiry after 7 days never opens', f: 'src/agent/engine.js', from: 'return Number.isFinite(t) && nowMs - t > ENQUIRY_GAP_MS;', to: 'return false;', reds: ['1.6c', '1.6d'] },
  { n: 'M5 the 7-day boundary taken as a new enquiry (>=)', f: 'src/agent/engine.js', from: 'nowMs - t > ENQUIRY_GAP_MS', to: 'nowMs - t >= ENQUIRY_GAP_MS - 120000', reds: ['1.10'] },
  { n: 'M6 F-44.227 (3) removed: the line word dropped', f: 'src/agent/engine.js', from: "instagram: 'Instagram', whatsapp_own", to: "instagram: 'WhatsApp', whatsapp_own", reds: ['1.2', '1.5b', '1.6f'] },
  { n: 'M6b the phone ungrouped (the founder\'s +91 5-5 form dropped)', f: 'src/agent/engine.js', from: "if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;", to: '', reds: ['1.1', '1.3', '1.5'] },
  { n: 'M7 the capture notice back to its old head', f: 'src/agent/engine.js', from: 'const notifHead = `${enquiryHead(null, cp)}.`;', to: "const notifHead = cp.channel === 'instagram' ? 'New enquiry on Instagram.' : `New enquiry from ${cp.phone}.`;", reds: ['1.5'] },
  { n: 'M8 OWN_NUMBER_FIRST_ALERT false (the founder\'s Q8 = no)', f: 'src/agent/engine.js', from: 'const OWN_NUMBER_FIRST_ALERT = true;', to: 'const OWN_NUMBER_FIRST_ALERT = false;', reds: ['1.3'] },
  { n: 'M9 the first-message line winning over a capture', f: 'src/agent/engine.js', from: 'const baseNotif = firstContactNotif || (opensThisEnquiry ? (returningBrideNotif || firstMessageNotice(cp, inboundMessage, leadName)) : null);', to: 'const baseNotif = (opensThisEnquiry ? (returningBrideNotif || firstMessageNotice(cp, inboundMessage, leadName)) : null) || firstContactNotif;', reds: ['1.5'] },
  { n: 'M10 the thread facts lose the newest row\'s time', f: 'src/agent/coupleThreadFacts.js', from: 'lastPriorAt: prior.length && prior[0].created_at ? prior[0].created_at : null,', to: 'lastPriorAt: null,', reds: ['1.6c', '1.6d', '1.11'] },
  { n: 'M11 the TDW-link site back on sendWhatsApp', f: 'src/lib/vendorInbound.js', from: "          await sendVendorEnquiryAlert({\n            toPhone: vendorUser.phone,\n            text: scrubModelFrame(result.vendorNotification, stripRoutingToken(body) || 'hi',", to: "          const vendorPhone = vendorUser.phone; await sendWhatsApp(vendorPhone, 'x'); await (async () => ({\n            toPhone: vendorUser.phone,\n            text: scrubModelFrame(result.vendorNotification, stripRoutingToken(body) || 'hi',", reds: ['2.1', '2.3'] },
  { n: 'M12 the Q7 byte reverted to the dashed line', f: 'src/lib/webhookCore.js', from: "const GRACEFUL_TURN_LINE = 'Something went wrong on our side. Please send that again in a minute.';", to: "const GRACEFUL_TURN_LINE = 'Something hiccuped \u2014 say that again in a minute.';", reds: ['3.1', '3.2'] },
  { n: 'M13 the brief back to the bare "a couple"', f: 'src/lib/vendor/enquiryAlert.js', from: 'brideName:  scrubText(briefBrideWord(brideName, channel, ctx, text)),', to: "brideName:  scrubText(brideName  || 'a couple'),", reds: ['4.7'] },
  { n: 'M14 the brief\'s phone not read from the head', f: 'src/lib/vendor/enquiryAlert.js', from: 'const m = typeof text === \'string\' ? text.match(HEAD_PHONE) : null;', to: 'const m = null;', reds: ['4.3', '4.4', '4.7'] },
  { n: 'M14b "couple" back in the Instagram brief word', f: 'src/lib/vendor/enquiryAlert.js', from: "instagram: () => 'someone on Instagram',", to: "instagram: () => 'a couple on Instagram',", reds: ['4.2', '4.6c'] },
  { n: 'M15 the ctx read dropped from channelOf', f: 'src/lib/vendor/enquiryAlert.js', from: "  if (c.startsWith('igReply')) return 'instagram';", to: '', reds: ['4.2'] },
];

async function runCells() { pass = 0; fail = 0; failed.length = 0; await cells(); return { pass, fail, failed: failed.slice() }; }

async function main() {
  const MUTATE = process.argv.includes('--mutate');
  const base = await runCells();
  console.log(`\nb142: ${base.pass} pass, ${base.fail} fail${base.fail ? ` (${base.failed.join('; ')})` : ''}`);
  if (base.fail) process.exit(1);
  if (!MUTATE) { console.log('\n§5 mutations: run with --mutate (production files are edited and restored by sha256)'); return; }
  sec('§5 mutations (each must redden its named cells; files restored by sha256)');
  let mFail = 0;
  for (const m of MUTATIONS) {
    const src = read(m.f); const before = sha(src);
    if (!src.includes(m.from)) { console.log(`  FAIL  ${m.n}: anchor not found`); mFail += 1; continue; }
    fs.writeFileSync(P(m.f), src.replace(m.from, m.to));
    let r;
    try { const orig = console.log; console.log = () => {}; try { r = await runCells(); } finally { console.log = orig; } }
    catch (e) { r = { fail: 1, failed: [`threw: ${e && e.message}`] }; }
    fs.writeFileSync(P(m.f), src);
    const restored = sha(read(m.f)) === before;
    const hit = m.reds.every((c) => r.failed.some((x) => x.startsWith(`${c} `) || x.startsWith(`${c}b `)));
    const ok = hit && restored;
    if (!ok) mFail += 1;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${m.n} → red ${JSON.stringify(m.reds)} ${hit ? 'hit' : `MISSED (red: ${r.failed.join('; ') || 'none'})`}; ${restored ? 'restored by sha' : 'NOT RESTORED'}`);
  }
  console.log(`\nb142 --mutate: ${MUTATIONS.length - mFail}/${MUTATIONS.length} mutations reddened their cells`);
  if (mFail) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(2); });
