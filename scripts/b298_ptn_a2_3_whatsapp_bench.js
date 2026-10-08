'use strict';
// scripts/b298_ptn_a2_3_whatsapp_bench.js · CE-47 · PTN-A2-3 · rung b298 · CALLS TO PARTNERS ON WHATSAPP, FROM THE MARKETING LINE.
// §1 the registry: the three filed templates, bodies byte for byte as filed, Utility, the marketing line; the call's button
//    takes the token as its suffix, never the full address.
// §2 the partner's yes (Settings door): no number, no yes; the yes is kept with its time and the founder's words.
// §3 one lane per call: WhatsApp for a partner that said yes, email otherwise, none without either; never both.
// §4 the drain on WhatsApp: the template from the marketing line with the right values; 9 am to 8 pm and the cap still
//    bind; a lane that is not open moves the row to email with its own log line; no email and no lane closes it; a
//    number opted out everywhere closes it; a refusal is tried three times, then reads in plain words.
// §5 THE 72-HOUR CHECK: a row made more than 72 hours before it could first be sent is closed, never sent, in the
//    approved words; a young row goes; a row an admin tried again is not closed by age; a row waiting for the email key
//    is not closed while it waits.
// §6 A PARTNER'S REPLY on the marketing lane (the real handleMarketingInbound): STOP CALLS, a bare STOP, PAUSE CALLS,
//    START CALLS and anything else; A PARTNER'S STOP MUST NOT OPT THE NUMBER OUT; no prospect, no consent, no sales turn.
// §7 THE DIFFERENTIAL over the lane's real bytes (the chair's condition): for every number that is not a partner that
//    said yes, prospects.js at dae04b0 and in this tree return the same verdict, write the same rows and send the same
//    messages; the arm costs ONE bounded read; an arm that throws leaves today's behaviour.
// §8 the approved words for the late row.
// --mutate: four production mutations through scripts/lib/mutation_guard.js; each must redden its cell. Refuses (exit 3)
// under 512 MB free (F-44.419). Fixed dates, no network. THE EXIT IS THE VERDICT: 0 green, 1 red, 2 error, 3 refused.
const fs = require('fs'); const path = require('path'); const crypto = require('crypto'); const cp = require('child_process'); const Module = require('module');
const ROOT = path.join(__dirname, '..'); const R = (p) => path.join(ROOT, p);
const guard = require('./lib/mutation_guard');
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:9';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'bench';
process.env.PARTNER_SESSION_SECRET = 'p'.repeat(48);
let pass = 0; let fail = 0;
const ok = (c, name, info) => { if (c) { pass++; console.log(`  PASS  ${name}`); } else { fail++; console.log(`  FAIL  ${name}${info === undefined ? '' : '  [' + String(info).slice(0, 300) + ']'}`); } };
const sec = (t) => console.log(`\n§${t}`);

if (!process.env.B298_MUT_CHILD) guard.recoverOrRefuse(ROOT, 'b298');
{
  let free = Infinity; try { const s = fs.statfsSync(ROOT); free = s.bavail * s.bsize; } catch (_e) { /* no statfs */ }
  if (free < 512 * 1024 * 1024) { console.log(`b298: REFUSED. ${Math.round(free / 1048576)} MB free; a mutation series needs 512 MB (F-44.419).`); process.exit(3); }
}
const MUTS = [
  { rel: 'src/lib/prospects.js', from: '      const pRow = await ptn.matchInboundPartner(supabase, phone);\n', to: '      const pRow = null;\n', reddens: /FAIL  6\.1/ },
  { rel: 'src/lib/partners/sends.js', from: "    if (canSend && !(r.attempts > 0) && r.created_at && now.getTime() - new Date(r.created_at).getTime() > LATE_MS && !(await everRetried(sb, r.id))) {", to: '    if (false) {', reddens: /FAIL  5\.1/ },
  { rel: 'src/lib/partners/sends.js', from: '      if (!(ready && wa.saidYes(org))) {', to: '      if (false) {', reddens: /FAIL  4\.3/ },
  { rel: 'src/lib/partners/sends.js', from: '    const lane = wa.laneFor(o);', to: "    const lane = o.calls_email ? 'email' : wa.laneFor(o);", reddens: /FAIL  3\.1/ },
];
if (!process.env.B298_MUT_CHILD) for (const m of MUTS) if (!fs.readFileSync(R(m.rel), 'utf8').includes(m.from)) { console.log(`STOP — a mutation anchor is missing from ${m.rel}; restore it with git checkout before running b298.`); process.exit(1); }
if (process.argv.includes('--mutate')) {
  for (const [i, m] of MUTS.entries()) {
    const before = guard.sha(fs.readFileSync(R(m.rel), 'utf8')); let red = false; let out = '';
    const h = guard.apply(ROOT, m.rel, m.from, m.to, 'b298');
    try { const r = cp.spawnSync(process.execPath, [__filename], { encoding: 'utf8', env: { ...process.env, B298_MUT_CHILD: '1' }, timeout: 300000 }); out = r.stdout || ''; red = r.status !== 0 && m.reddens.test(out); }
    finally { h.restore(); }
    ok(red, `M${i + 1} ${m.rel} mutated reddens ${m.reddens.source.replace('FAIL  ', '§')}`, red ? undefined : (out.match(/FAIL .*/g) || ['no red']).join(' | '));
    ok(guard.sha(fs.readFileSync(R(m.rel), 'utf8')) === before && !fs.existsSync(guard.pendingDir(ROOT)), `M${i + 1} restored byte for byte, no marker left`);
  }
  console.log(`\nb298 --mutate: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
}

const { fakeDb, callRoute } = require('./lib/ptn_fakedb');
const NOW = new Date('2026-10-12T06:30:00Z');    // 12:00 IST, a Monday
const LATE = new Date('2026-10-12T16:30:00Z');   // 22:00 IST
const O1 = crypto.randomUUID(); const O2 = crypto.randomUUID(); const O3 = crypto.randomUUID(); const V1 = crypto.randomUUID(); const POST = crypto.randomUUID();
const PH = '+919811100021';
const org = (x = {}) => ({ id: O1, name: 'Model Connect', kind: 'model_agency', calls_email: 'bookings@modelconnect.in', whatsapp_opt: true, whatsapp_phone: PH, whatsapp_opt_at: '2026-10-09T05:00:00.000Z',
  daily_cap: 10, send_state: 'active', paused_until: null, check_state: 'unchecked', cities: ['Delhi NCR'], roles: ['model'], wants: ['calls'], pay_rule: 'paid_and_credit', ...x });
const post = (x = {}) => ({ id: POST, vendor_id: V1, requirement_type: 'model', event_date: '2026-10-18', city: 'Delhi NCR', pay_kind: 'paid', budget_from: 3000, budget_to: 5000, details: null, state: 'open', first_look_until: null, ...x });
const vendor = { id: V1, business_name: 'Aanya Makeup Studio', category: 'makeup', instagram_handle: 'aanya.mua' };
const send = (x = {}) => ({ id: crypto.randomUUID(), partner_id: O1, post_id: POST, channel: 'whatsapp', state: 'queued', why: null, attempts: 0, not_before: '2026-10-12T00:00:00.000Z',
  sent_at: null, created_at: '2026-10-12T01:00:00.000Z', token_hash: crypto.randomBytes(32).toString('hex'), ...x });
const world = (sends, o = {}, extra = {}) => fakeDb({ partner_orgs: [org(o)], collab_posts: [post()], collab_post_items: [{ post_id: POST, requirement_type: 'model', needed: 2 }], vendors: [vendor],
  partner_sends: sends, partner_answers: [], partner_reports: [], partner_connections: [], partner_send_log: [], ...extra });
const KEY = { RESEND_API_KEY: 're_test', PARTNER_SESSION_SECRET: process.env.PARTNER_SESSION_SECRET };
const fetchOk = async () => ({ ok: true, status: 200, json: async () => ({ id: 'em_1' }) });
const waCalls = []; const okWa = async (o) => { waCalls.push(o); return { sent: true, result: { messages: [{ id: 'wamid.X' }] } }; };
const ready = async () => true; const notReady = async () => false;
const typed = (code) => { const e = new Error(`refused ${code} for +91 98111 00021`); e.code = code; return e; };

(async () => {
  const T = require(R('src/lib/templates'));
  const wa = require(R('src/lib/partners/wa'));
  const sends = require(R('src/lib/partners/sends'));
  const words = require(R('src/lib/partners/words'));
  const waIn = require(R('src/lib/partners/waInbound'));

  sec('1  the registry');
  const FILED = {
    partner_call: 'Hi {{1}}. {{2}} has raised a request for {{3}} for a shoot on {{4}} in {{5}}. Tap View details to respond. Reply STOP CALLS to stop these messages, or PAUSE CALLS to pause them for a week.',
    partner_picked: 'Update on your suggestion: {{1}} wants to talk about {{2}} for the shoot on {{3}}. They will contact you directly. TDW takes no fee and has no part in any fee.',
    collab_request_sent: 'Your request for {{1}} in {{2}} on {{3}} has gone to {{4}} partners. When someone is suggested, you will see it on your call in The Dream Wedding.',
  };
  const NAMES = { partner_call: 'tdw_partner_call', partner_picked: 'tdw_partner_picked', collab_request_sent: 'tdw_collab_request_sent' };
  ok(Object.keys(FILED).every((k) => T.TEMPLATES[k] && T.TEMPLATES[k].body === FILED[k] && T.TEMPLATES[k].name === NAMES[k] && T.TEMPLATES[k].line === 'marketing' && T.TEMPLATES[k].category === 'UTILITY' && T.isApproved(k)),
    '1.1 the three filed templates: names, bodies byte for byte as filed, Utility, the marketing line, approved');
  const pl = T.buildTemplatePayload('partner_call', { partner: 'Studio Noor', vendor: 'Aanya Makeup Studio', needs: '2 models', date: '18 October 2026', city: 'Delhi NCR', code: 'TOKEN32' });
  const btn = pl.components.find((c) => c.type === 'button');
  ok(btn && btn.sub_type === 'url' && btn.parameters[0].text === 'TOKEN32' && T.TEMPLATES.partner_call.button.base === 'https://thedreamwedding.in/partner/call/', '1.2 the button takes the token as its suffix, never the full address', JSON.stringify(btn));

  sec('2  the partner\'s yes');
  const p0 = wa.optInPatch({ whatsapp_opt: true }, {}, NOW);
  const p1 = wa.optInPatch({ whatsapp_opt: true, whatsapp_phone: '98111' }, {}, NOW);
  const p2 = wa.optInPatch({ whatsapp_opt: true, whatsapp_phone: '+91 98111 00021' }, {}, NOW);
  const p3 = wa.optInPatch({ whatsapp_opt: false }, org(), NOW);
  ok(!p0.ok && !p1.ok && p0.error === wa.WORDS.needNumber, '2.1 no number, or a number that is not whole: no yes, in plain words', JSON.stringify([p0, p1]));
  ok(p2.ok && p2.row.whatsapp_opt === true && p2.row.whatsapp_phone === PH && p2.row.whatsapp_opt_at === NOW.toISOString() && p2.row.whatsapp_opt_words === 'Send me collab calls from The Dream Wedding on WhatsApp, at this number',
    '2.2 the yes is kept with its time and the founder\'s words, word for word', JSON.stringify(p2));
  ok(p3.ok && p3.row.whatsapp_opt === false && p3.row.whatsapp_opt_at === null && p3.row.whatsapp_opt_words === null, '2.3 a no clears the yes');
  const prt = require(R('src/api/partner'));
  const d2 = world([]);
  const r2 = await callRoute(prt, 'patch', '/org', { body: { whatsapp_opt: true, whatsapp_phone: '+919811100099' }, partner: { id: O1, role: 'owner', org: org({ whatsapp_opt: false, whatsapp_opt_at: null, whatsapp_phone: null }) }, app: { locals: { supabase: d2 } } });
  const saved = d2.tables.partner_orgs[0];
  ok(r2.code === 200 && saved.whatsapp_opt === true && saved.whatsapp_phone === '+919811100099' && !!saved.whatsapp_opt_at && saved.whatsapp_opt_words === wa.OPT_IN_WORDS, '2.4 the Settings door saves the yes', JSON.stringify({ code: r2.code, body: r2.body }).slice(0, 200));

  sec('3  one lane per call');
  ok(wa.laneFor(org()) === 'whatsapp' && wa.laneFor(org({ whatsapp_opt_at: null })) === 'email' && wa.laneFor(org({ whatsapp_opt: false, calls_email: null })) === null, '3.0 laneFor: a yes is WhatsApp, else email, else none');
  const gate = require(R('src/lib/hub/gate')); gate._reset();
  {
    const d3 = world([], {}, { admin_config: [{ key: 'clb.hub', value: 'on' }], partner_orgs: [org(), org({ id: O2, name: 'Studio Noor', whatsapp_opt: false, whatsapp_opt_at: null, whatsapp_phone: null }), org({ id: O3, name: 'No Lane', calls_email: null, whatsapp_opt: false, whatsapp_opt_at: null, whatsapp_phone: null })] });
    const made = await sends.enqueue(d3, { post_id: POST, vendor_id: V1, city: 'Delhi NCR', roles: [{ role: 'model' }], pay_kind: 'paid' }, { env: KEY, now: () => NOW });
    const by = Object.fromEntries(d3.tables.partner_sends.map((r) => [r.partner_id, r.channel]));
    ok(made.made === 2 && by[O1] === 'whatsapp' && by[O2] === 'email' && !(O3 in by) && d3.tables.partner_sends.length === 2, '3.1 the yes partner gets a WhatsApp row, the email partner an email row, the partner with neither none; one row each', JSON.stringify({ made, by }));
  }

  sec('4  the drain on WhatsApp');
  let d = world([send()]); waCalls.length = 0;
  await sends.drain(d, { now: () => NOW, env: KEY, waReady: ready, sendWa: okWa, fetchImpl: fetchOk });
  const c0 = waCalls[0] || {}; const row0 = d.tables.partner_sends[0];
  ok(waCalls.length === 1 && c0.line === 'marketing' && c0.templateKey === 'partner_call' && c0.to === PH && c0.vars.partner === 'Model Connect' && c0.vars.vendor === 'Aanya Makeup Studio' && c0.vars.needs === '2 models'
    && c0.vars.date === '18 October 2026' && c0.vars.city === 'Delhi NCR' && /^[A-Za-z0-9_-]{32}$/.test(c0.vars.code) && row0.state === 'sent' && row0.provider_ref === 'wamid.X',
    '4.1 the call goes as tdw_partner_call from the marketing line, with the partner, vendor, needs, date, city and the token', JSON.stringify(c0).slice(0, 300));
  d = world([send()]); waCalls.length = 0;
  await sends.drain(d, { now: () => LATE, env: KEY, waReady: ready, sendWa: okWa });
  ok(waCalls.length === 0 && d.tables.partner_sends[0].state === 'held_window', '4.2 at 10 pm the WhatsApp row waits for 9 am, like email');
  d = world([send()]); waCalls.length = 0;
  await sends.drain(d, { now: () => NOW, env: KEY, waReady: notReady, sendWa: okWa, fetchImpl: fetchOk });
  const r43 = d.tables.partner_sends[0]; const l43 = d.tables.partner_send_log.find((l) => l.kind === 'lane_changed');
  ok(waCalls.length === 0 && r43.channel === 'email' && r43.state === 'sent' && l43 && l43.why === 'TDW sent this call by email, because WhatsApp is not open for this partner.', '4.3 a lane that is not open: the row moves to email with its own log line, and goes by email', JSON.stringify({ r43, l43 }));
  d = world([send()], { calls_email: null }); waCalls.length = 0;
  await sends.drain(d, { now: () => NOW, env: KEY, waReady: notReady, sendWa: okWa });
  ok(d.tables.partner_sends[0].state === 'closed' && d.tables.partner_sends[0].why === words.W.noLane, '4.4 no open lane and no email: closed, in plain words');
  d = world([send()]);
  await sends.drain(d, { now: () => NOW, env: KEY, waReady: ready, sendWa: async () => { throw typed('opted_out'); } });
  ok(d.tables.partner_sends[0].state === 'closed' && d.tables.partner_sends[0].why === words.W.waStopped, '4.5 a number opted out everywhere: closed, never retried');
  d = world([send()]); const r46 = d.tables.partner_sends[0]; const t = (m) => new Date(NOW.getTime() + m * 60e3);
  for (let k = 0; k < 3; k++) await sends.drain(d, { now: () => t(k * 16), env: KEY, waReady: ready, sendWa: async () => { throw typed('line_not_configured'); } });
  ok(r46.state === 'failed' && r46.attempts === 3 && !/\d{10}/.test(r46.why.replace(/\D/g, ' ')) && words.failureWords(r46.why) === 'The marketing number is not set up in Railway.', '4.6 a refusal is tried three times, then reads in plain words; no number kept', JSON.stringify(r46));

  sec('5  the 72-hour check');
  const old = '2026-10-08T05:00:00.000Z';   // 4 days before NOW
  d = world([send({ channel: 'email', created_at: old })]); let mailed = 0;
  await sends.drain(d, { now: () => NOW, env: KEY, fetchImpl: async () => { mailed++; return fetchOk(); } });
  const r51 = d.tables.partner_sends[0];
  ok(r51.state === 'closed' && r51.why === 'This call was not sent. It waited more than 3 days before TDW could send it.' && mailed === 0 && words.stateWords(r51.state, r51.why) === 'This call was not sent, because it waited too long.',
    '5.1 a row made 4 days before it could first be sent: closed, never sent, in the approved words', JSON.stringify(r51));
  d = world([send({ channel: 'email', created_at: '2026-10-11T05:00:00.000Z' })]);
  await sends.drain(d, { now: () => NOW, env: KEY, fetchImpl: fetchOk });
  ok(d.tables.partner_sends[0].state === 'sent', '5.2 control: a row made a day before goes');
  d = world([send({ channel: 'email', created_at: old })]);
  d.tables.partner_send_log.push({ id: crypto.randomUUID(), send_id: d.tables.partner_sends[0].id, kind: 'retried', state: 'queued', channel: 'email', attempts: 0, at: NOW.toISOString() });
  await sends.drain(d, { now: () => NOW, env: KEY, fetchImpl: fetchOk });
  ok(d.tables.partner_sends[0].state === 'sent', '5.3 a row an admin tried again is not closed by its age');
  d = world([send({ channel: 'email', created_at: old })]);
  await sends.drain(d, { now: () => NOW, env: {}, fetchImpl: fetchOk });
  ok(d.tables.partner_sends[0].state === 'held_no_key', '5.4 a row waiting for the email key keeps waiting; it is closed only when sending becomes possible');

  sec('6  a partner\'s reply on the marketing lane');
  const prospects = require(R('src/lib/prospects'));
  const lane = async (db, text, from = '919811100021') => { const sent = []; const turns = [];
    const v = await prospects.handleMarketingInbound({ supabase: db, from, text, messageId: crypto.randomUUID(), sendWa: async (o) => { sent.push(o); return { sent: true }; }, sendWaDeps: {}, copy: (k) => `copy:${k}`, closerTurn: async () => { turns.push(1); return { text: 'pitch', source: 'stub' }; } });
    return { v, sent, turns }; };
  d = world([]); let o6 = await lane(d, 'STOP');
  ok(o6.v.action === 'partner_stop' && d.tables.partner_orgs[0].send_state === 'stopped' && !(d.tables.prospects || []).length && o6.sent.length === 1 && o6.sent[0].text === waIn.REPLY.stopped && o6.sent[0].line === 'marketing',
    '6.1 A PARTNER\'S STOP MUST NOT OPT THE NUMBER OUT: calls stop, no prospect row, the fixed reply', JSON.stringify({ v: o6.v, prospects: d.tables.prospects, sent: o6.sent }).slice(0, 300));
  d = world([]); o6 = await lane(d, 'Stop calls.');
  ok(o6.v.action === 'partner_stop' && d.tables.partner_orgs[0].send_state === 'stopped' && !(d.tables.prospects || []).length, '6.2 STOP CALLS, any case and punctuation');
  d = world([]); o6 = await lane(d, 'PAUSE CALLS');
  ok(o6.v.action === 'partner_pause' && !!d.tables.partner_orgs[0].paused_until && o6.sent[0].text === waIn.REPLY.paused, '6.3 PAUSE CALLS pauses for a week');
  d = world([], { send_state: 'stopped' }); o6 = await lane(d, 'START CALLS');
  ok(o6.v.action === 'partner_start' && d.tables.partner_orgs[0].send_state === 'active' && o6.sent[0].text === waIn.REPLY.started, '6.4 START CALLS turns calls back on');
  d = world([]); o6 = await lane(d, 'Is the shoot paid?');
  ok(o6.v.action === 'partner_other' && o6.turns.length === 0 && !(d.tables.prospects || []).length && !(d.tables.conversations || []).length && o6.sent[0].text === waIn.REPLY.help,
    '6.5 anything else: the help reply; no prospect, no consent kept, no sales turn, no conversation', JSON.stringify(o6.v));

  sec('7  THE DIFFERENTIAL over the lane\'s real bytes');
  const baseSrc = cp.execFileSync('git', ['show', 'dae04b0:src/lib/prospects.js'], { cwd: ROOT, encoding: 'utf8' });
  const baseMod = new Module(R('src/lib/prospects.js'), module); baseMod.filename = R('src/lib/prospects.js'); baseMod.paths = Module._nodeModulePaths(R('src/lib'));
  baseMod._compile(baseSrc, R('src/lib/prospects.js'));
  const norm = (x) => JSON.parse(JSON.stringify(x === undefined ? null : x, (k, v) => (['id', 'created_at', 'updated_at', 'consent_at', 'session_opened_at', 'messageId', 'conversation_id', 'prospect_id', 'prospectId', 'conversationId'].includes(k) ? '*' : (typeof v === 'string' && (/^[0-9a-f-]{36}$/.test(v) || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) ? '*' : v))));
  const run = async (mod, seed, text, from, opts = {}) => {
    const db = seed(); let ptnReads = 0; const f = db.from;
    db.from = (n) => { if (n === 'partner_orgs') { ptnReads++; if (opts.throwPtn) throw new Error('partner_orgs down'); } return f(n); };
    const sent = []; const turns = [];
    let v; try { v = await mod.handleMarketingInbound({ supabase: db, from, text, messageId: 'm1', sendWa: async (o) => { sent.push(o); return { sent: true }; }, sendWaDeps: {}, copy: (k) => `copy:${k}`, closerTurn: async () => { turns.push(1); return { text: 'pitch', source: 'stub' }; } }); }
    catch (e) { v = { threw: e.message }; }
    const { confirmError, replyError, ...vv } = v || {};
    return { v: norm(vv), w: norm(db.writes), s: norm(sent.map(({ supabase, ...o }) => o)), turns: turns.length, ptnReads };
  };
  const NP = '919811100055';
  const CASES = [
    ['a stranger says STOP', () => world([]), 'STOP', NP],
    ['a stranger says hello', () => world([]), 'Hi, tell me more', NP],
    ['an opted-out prospect says START', () => world([], {}, { prospects: [{ id: crypto.randomUUID(), phone: NP, state: 'opted_out', name: null, source: 'other' }] }), 'START', NP],
    ['a prospect in session writes', () => world([], {}, { prospects: [{ id: crypto.randomUUID(), phone: NP, state: 'in_session', name: 'Riya', source: 'other', consent_text: 'yes' }] }), 'what does it cost', NP],
    ['a broadcast recipient says STOP', () => world([], {}, { broadcast_recipients: [{ id: crypto.randomUUID(), broadcast_id: crypto.randomUUID(), vendor_id: V1, phone: NP, status: 'sent', created_at: '2026-10-10T00:00:00Z' }] }), 'STOP', NP],
    ['a partner\'s number with NO yes (no whatsapp_opt_at)', () => world([], { whatsapp_opt_at: null }), 'STOP', '919811100021'],
    ['a blocked partner\'s number', () => world([], { check_state: 'blocked' }), 'STOP', '919811100021'],
  ];
  let allSame = true; const diffs = []; let reads = [];
  for (const [label, seed, text, from] of CASES) {
    const a = await run(baseMod.exports, seed, text, from); const b = await run(prospects, seed, text, from);
    const same = JSON.stringify([a.v, a.w, a.s, a.turns]) === JSON.stringify([b.v, b.w, b.s, b.turns]);
    if (!same) { allSame = false; diffs.push({ label, a: [a.v, a.w.length, a.s.length], b: [b.v, b.w.length, b.s.length] }); }
    reads.push([label, a.ptnReads, b.ptnReads]);
  }
  ok(allSame, `7.1 ${CASES.length} cases, every number that is not a partner that said yes: the same verdict, the same rows written, the same messages sent, at dae04b0 and in this tree`, JSON.stringify(diffs).slice(0, 300));
  ok(reads.every(([label, a, b]) => a === 0 && b === (/broadcast recipient/.test(label) ? 0 : 1)), '7.2 the arm costs ONE bounded read of partner_orgs, and none when an earlier arm (a broadcast) answered first', JSON.stringify(reads));
  {
    const a = await run(baseMod.exports, () => world([]), 'STOP', '919811100021'); const b = await run(prospects, () => world([]), 'STOP', '919811100021', { throwPtn: true });
    ok(JSON.stringify([a.v, a.w, a.s]) === JSON.stringify([b.v, b.w, b.s]), '7.3 an arm that throws: today\'s behaviour, exactly', JSON.stringify([a.v, b.v]).slice(0, 200));
  }

  sec('8  the approved words');
  ok(words.W.late === 'This call was not sent. It waited more than 3 days before TDW could send it.' && words.LATE_STATE === 'This call was not sent, because it waited too long.', '8.1 the late row\'s reason and its state line, word for word as approved');

  console.log(`\nb298: ${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})().catch((e) => { console.log('BENCH THREW', e && e.stack); process.exit(1); });
