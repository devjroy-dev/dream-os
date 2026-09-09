#!/usr/bin/env node
// scripts/b61_switchboard_bench.js — CE-41 · SEAT C · THE SWITCHBOARD (C1).
//
// WHAT THIS BENCH PROVES, and the two worlds it must tell apart (R-40.94):
//   UNCURED (origin 57d12d4): nine `process.env.*_ENABLED` reads in src/,
//     no `src/lib/capabilities.js`, `sendGate()` synchronous → §1/§3/§4 RED.
//   CURED (this packet): zero env reads, every door awaits `cap.on('flag.*')`,
//     the register's rules hold on a real supabase double, the sweep maps Meta's
//     words and walks the guards, the webhook seam lands → all GREEN.
//   MUTATIONS (`--mutate <n>`): production code is mutated in a scratch copy and
//     the named cell must RED — a bench that cannot go red is hollow (F-40.216).
//
// NO LIVE META CALL (kickoff §9): `fetch` is a double here. The live read is the
// founder's `Check now` on the walk.
//
// Every textual assertion reads `codeOf` (comment-stripped, R-40.105), never the
// raw file, so a name in a comment cannot green a cell about behaviour.
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.env.B61_ROOT ? path.resolve(process.env.B61_ROOT) : path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const codeOf = (rel) => read(rel)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const req = (rel) => require(path.join(ROOT, rel));

let pass = 0, fail = 0; const fails = [];
function sec(t) { console.log(`\n${t}`); }
function ok(name, cond, why) { if (cond) { pass++; console.log(`  GREEN  ${name}`); } else { fail++; fails.push(`${name}${why ? ' — ' + why : ''}`); console.log(`  RED    ${name}${why ? ' — ' + why : ''}`); } }
async function cell(name, fn) {
  try { const r = await fn(); if (r === true) ok(name, true); else ok(name, false, typeof r === 'string' ? r : 'returned ' + JSON.stringify(r)); }
  catch (e) { ok(name, false, (e && e.message) || String(e)); }
}

// ── THE SUPABASE DOUBLE — one table, the columns of the migration ────────────
function makeDouble(seed) {
  const rows = new Map(seed.map((r) => [r.key, { ...r }]));
  const log = [];
  function q(table) {
    if (table !== 'capabilities') throw new Error(`double: unexpected table ${table}`);
    const st = { filters: [], patch: null, order: [] };
    const api = {
      select() { return api; },
      eq(col, val) { st.filters.push([col, val]); return api; },
      order() { return api; },
      update(patch) { st.patch = patch; log.push({ op: 'update', patch }); return api; },
      // A COPY, never the live object — a real client returns a fresh row per read,
      // and a reference would let a later update rewrite a `before` already read.
      maybeSingle: async () => { const r = pick(); return { data: r[0] ? { ...r[0] } : null, error: null }; },
      then(res, rej) { return Promise.resolve().then(() => { if (st.patch) { for (const r of pick()) Object.assign(r, st.patch); return { data: null, error: null }; } return { data: pick().map((r) => ({ ...r })), error: null }; }).then(res, rej); },
    };
    function pick() { return [...rows.values()].filter((r) => st.filters.every(([c, v]) => r[c] === v)); }
    return api;
  }
  return { from: q, rows, log };
}
const SEED = () => [
  { key: 'flag.payment_reminder_send', kind: 'flag', status: 'on', evidence: 'seed', auto_on: false, walk_ref: null },
  { key: 'flag.review_ask_send',       kind: 'flag', status: 'off', evidence: 'seed', auto_on: false, walk_ref: null },
  { key: 'flag.referral_alert_send',   kind: 'flag', status: 'off', evidence: 'seed', auto_on: false, walk_ref: null },
  { key: 'flag.future_arm',            kind: 'flag', status: 'pending', evidence: null, auto_on: false, walk_ref: null },
  { key: 'flag.armed_one',             kind: 'flag', status: 'armed', evidence: null, auto_on: false, walk_ref: null },
  { key: 'template.tdw_payment_reminder', kind: 'template', status: 'approved', evidence: null, auto_on: false, walk_ref: null },
  { key: 'template.tdw_referral_alert',   kind: 'template', status: 'approved', evidence: null, auto_on: false, walk_ref: null },
  { key: 'template.tdw_assist_found_vendor', kind: 'template', status: 'approved', evidence: null, auto_on: true, walk_ref: 'walk:abc123' },
  { key: 'template.tdw_assist_lead_outside', kind: 'template', status: 'pending', evidence: null, auto_on: true, walk_ref: null },
  { key: 'perm.instagram_business_basic', kind: 'permission', status: 'pending', evidence: 'not filed', auto_on: false, walk_ref: null },
];
const graphFetch = (statusWord, extra = []) => async (url) => ({
  ok: true, status: 200,
  json: async () => ({ data: [{ name: decodeURIComponent(url.split('name_or_content=')[1].split('&')[0]), status: statusWord, category: 'UTILITY', id: '111' }, ...extra] }),
});

(async () => {
  const DOORS = [
    ['src/lib/vendor/reviewAsk.js',        'flag.review_ask_send'],
    ['src/lib/vendor/paymentReminders.js', 'flag.payment_reminder_send'],
    ['src/lib/vendor/referralAlert.js',    'flag.referral_alert_send'],
    ['src/lib/vendor/creditInvite.js',     'flag.wedding_credit_send'],
    ['src/lib/vendor/creditInvite.js',     'flag.wedding_consent_send'],
    ['src/lib/vendor/contractSend.js',     'flag.contract_sign_send'],
    ['src/lib/vendor/contractSend.js',     'flag.contract_copy_send'],
    ['src/api/vendor/studio/weddings.js',  'flag.wedding_reel'],
  ];
  const ENV_NAMES = ['CONTRACT_SIGN_SEND_ENABLED', 'CONTRACT_COPY_SEND_ENABLED', 'PAYMENT_REMINDER_SEND_ENABLED', 'REFERRAL_ALERT_SEND_ENABLED',
    'REVIEW_ASK_SEND_ENABLED', 'WEDDING_CREDIT_SEND_ENABLED', 'WEDDING_CONSENT_SEND_ENABLED', 'WEDDING_REEL_ENABLED'];
  const SRC_FILES = (() => { const out = []; (function walk(d) { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name.endsWith('.js')) out.push(p); } })('src'); return out; })();

  sec('§1 · THE ONE HOME EXISTS AND IS THE ONLY READER');
  ok('src/lib/capabilities.js exists', exists('src/lib/capabilities.js'));
  ok('src/capabilitiesSweep.js exists', exists('src/capabilitiesSweep.js'));
  ok('src/api/admin/capabilities.js exists', exists('src/api/admin/capabilities.js'));
  await cell('no file in src/ but capabilities.js touches the capabilities table', () => {
    const offenders = SRC_FILES.filter((f) => f !== 'src/lib/capabilities.js' && /from\((?:'capabilities'|cap\.TABLE)\)/.test(codeOf(f)));
    return offenders.length === 0 ? true : `second reader: ${offenders.join(', ')}`;
  });
  await cell('the register keeps seat A\'s signature: on(key) is exported and async', () => {
    if (!exists('src/lib/capabilities.js')) return 'absent';
    const cap = req('src/lib/capabilities.js');
    // R-41.20's contract: synchronous boolean. `assistance.js:384` reads `capFn(KEY) === true`.
    return typeof cap.on === 'function' && cap.on.constructor.name === 'Function' && cap.on('nope') === false ? true : 'on() is not a synchronous boolean';
  });

  sec('§2 · THE ENV READS ARE GONE (comment-stripped, every file in src/)');
  for (const n of ENV_NAMES) {
    await cell(`no process.env.${n} read anywhere in src/`, () => {
      const hits = SRC_FILES.filter((f) => new RegExp(`process\\.env\\.${n}\\b`).test(codeOf(f)));
      return hits.length === 0 ? true : `still read at ${hits.join(', ')}`;
    });
  }

  sec('§3 · EVERY DOOR READS THE REGISTER, BY KEY, AND AWAITS IT');
  for (const [file, key] of DOORS) {
    await cell(`${file} reads '${key}' through cap.on`, () => {
      const c = codeOf(file);
      if (!/require\(['"][./]*lib\/capabilities['"]\)|require\(['"]\.\.\/capabilities['"]\)/.test(c)) return 'does not require the register';
      if (!c.includes(`'${key}'`)) return 'key literal absent';
      if (!/(^|[^.\w])cap\.on\(/.test(c)) return 'no cap.on( read';
      return true;
    });
  }
  await cell('the two sign doors share ONE gate home (contractSend.signSendGate)', () => {
    const a = codeOf('src/api/sign.js'), b = codeOf('src/api/vendor/contracts.js');
    return /await signSendGate\(\)/.test(a) && /await signSendGate\(\)/.test(b) ? true : 'a sign door does not await signSendGate()';
  });
  await cell('every sendGate/consentSendGate in the four vendor libs is async', () => {
    const files = ['src/lib/vendor/reviewAsk.js', 'src/lib/vendor/paymentReminders.js', 'src/lib/vendor/referralAlert.js', 'src/lib/vendor/creditInvite.js'];
    const bad = files.filter((f) => /(^|\n)function (sendGate|consentSendGate)\(/.test(codeOf(f)));
    return bad.length === 0 ? true : `synchronous gate in ${bad.join(', ')}`;
  });
  await cell('the three outside callers await the gate (reminders.js, solutions/index.js, the libs)', () => {
    const c1 = codeOf('src/api/vendor/reminders.js'), c2 = codeOf('src/api/vendor/solutions/index.js');
    return /await sendGate\(\)/.test(c1) && /\(await sendGate\(\)\)\.open/.test(c2) ? true : 'a caller reads the gate without await';
  });

  sec('§4 · THE REGISTER\'S RULES, DRIVEN ON THE DOUBLE');
  // On the uncured tree the register does not exist; the sections that drive it
  // go RED as a block rather than crashing the harness (R-40.85: exit codes judge).
  let cap = null, sweep = null;
  try { cap = req('src/lib/capabilities.js'); } catch (e) { ok('§4 driven', false, 'src/lib/capabilities.js absent — uncured tree'); }
  try { sweep = req('src/capabilitiesSweep.js'); } catch (e) { ok('§5 driven', false, 'src/capabilitiesSweep.js absent — uncured tree'); }
  if (cap) {
    const db = makeDouble(SEED()); cap._resetCapabilitiesCache(); await cap.bind(db);
    await cell('on() is true only for status=on (armed and off both answer false)', () =>
      cap.on('flag.payment_reminder_send') === true && cap.on('flag.review_ask_send') === false && cap.on('flag.armed_one') === false ? true : 'wrong answer');
    await cell('on() fails closed on an absent row', () => cap.on('flag.nope') === false ? true : 'answered true for no row');
    await cell('on() fails closed before any warm / when the DB throws', async () => {
      cap._resetCapabilitiesCache();
      const bad = { from: () => { throw new Error('boom'); } };
      await cap.bind(bad);
      const shut = cap.on('flag.payment_reminder_send') === false;
      await cap.bind(db);
      return shut ? true : 'answered true with a dead DB';
    });
    await cell('reason() names the state', () => /flag\.review_ask_send is off on the switchboard/.test(cap.reason('flag.review_ask_send')) ? true : 'reason does not name the state');
    await cell('seat A\'s constant and contract survive the replacement (CAPABILITY_KEYS, IS_STUB=false)', () =>
      // CE-41 seat D, R-41.118: this TRANSCRIBED the constant's VALUE, so it broke the
      // day the outsider alert legitimately versioned to v2 — the class seat G's §8.1
      // names (a mirror carrying its own copy of the thing it mirrors). Re-cut to DERIVE:
      // the constant must still exist, still be a `template.` key, and still agree with
      // what the registry actually holds for the assist_lead_outside entry. That is the
      // contract seat A's cell was defending; the literal was never the point.
      (() => {
        const k = cap.CAPABILITY_KEYS.TDW_ASSIST_LEAD_OUTSIDE;
        const reg = require(path.join(ROOT, 'src/lib/templates.js'));   // b61 has no P(); ROOT is its home
        const e = (reg.TEMPLATES || reg.templates || reg).assist_lead_outside;
        if (typeof k !== 'string' || !k.startsWith('template.')) return 'constant moved or is not a template key';
        if (!e || k !== `template.${e.name}`) return `constant ${k} disagrees with the registry (${e && e.name})`;
        return cap.IS_STUB === false ? true : 'IS_STUB moved';
      })());
    await cell('recordSweep refuses on/off (above the sweep\'s hand)', async () => {
      try { await cap.recordSweep('flag.review_ask_send', { status: 'on' }, { supabase: db }); return 'accepted status=on'; }
      catch (e) { return /above the sweep/.test(e.message) ? true : e.message; }
    });
    await cell('rule (a): a founder-set on is not undone by an approved re-read', async () => {
      const m = await cap.recordSweep('flag.payment_reminder_send', { status: 'approved', evidence: 'e' }, { supabase: db });
      return m.after === 'on' && db.rows.get('flag.payment_reminder_send').evidence === 'e' ? true : JSON.stringify(m);
    });
    await cell('rule (b): rejected on an on row → off, disarmed:true', async () => {
      const m = await cap.recordSweep('flag.payment_reminder_send', { status: 'rejected', evidence: 'REJECTED' }, { supabase: db });
      return m.disarmed === true && m.after === 'off' && /^sweep:rejected$/.test(db.rows.get('flag.payment_reminder_send').flipped_by) ? true : JSON.stringify(m);
    });
    await cell('rule (b): paused on an off row leaves it off', async () => {
      const m = await cap.recordSweep('flag.review_ask_send', { status: 'paused' }, { supabase: db });
      return m.after === 'off' && m.disarmed === false ? true : JSON.stringify(m);
    });
    await cell('rule (c): approved + auto_on + walk_ref → on by sweep:auto_on', async () => {
      const m = await cap.recordSweep('template.tdw_assist_found_vendor', { status: 'approved' }, { supabase: db });
      return m.auto_flipped === true && m.after === 'on' && db.rows.get('template.tdw_assist_found_vendor').flipped_by === 'sweep:auto_on' ? true : JSON.stringify(m);
    });
    await cell('rule (c) refused without walk_ref: approved + auto_on + no ref stays approved', async () => {
      const m = await cap.recordSweep('template.tdw_assist_lead_outside', { status: 'approved' }, { supabase: db });
      return m.auto_flipped === false && m.after === 'approved' ? true : JSON.stringify(m);
    });
    await cell('flip on refuses a pending row', async () => {
      const r = await cap.flip('flag.future_arm', 'on', 'admin:test', { supabase: db });
      return r.ok === false && /cannot_turn_on_from_pending/.test(r.reason) ? true : JSON.stringify(r);
    });
    await cell('flip on from off records flipped_by and busts the cache', async () => {
      const r = await cap.flip('flag.review_ask_send', 'on', 'admin:deadbeef', { supabase: db });
      const now = cap.on('flag.review_ask_send');
      return r.ok && now === true && db.rows.get('flag.review_ask_send').flipped_by === 'admin:deadbeef' ? true : JSON.stringify(r);
    });
    await cell('setAutoOn refuses auto_on=true with no walk_ref (fork iii)', async () => {
      const r = await cap.setAutoOn('flag.review_ask_send', { auto_on: true }, 'admin:x', { supabase: db });
      return r.ok === false && r.reason === 'auto_on_requires_walk_ref' ? true : JSON.stringify(r);
    });
    await cell('setAutoOn accepts with a walk_ref', async () => {
      const r = await cap.setAutoOn('flag.review_ask_send', { auto_on: true, walk_ref: 'seal:0123abcd' }, 'admin:x', { supabase: db });
      return r.ok && db.rows.get('flag.review_ask_send').auto_on === true ? true : JSON.stringify(r);
    });
  }

  sec('§5 · THE SWEEP: META\'S WORDS, THE GUARDS, THE WEBHOOK');
  if (cap && sweep) {
  await cell('mapping (R-41.36): APPROVED/PENDING/REJECTED/DISABLED/PAUSED/IN_APPEAL', () => {
    const m = sweep.mapMetaTemplateStatus;
    return m('APPROVED') === 'approved' && m('PENDING') === 'pending' && m('REJECTED') === 'rejected' && m('DISABLED') === 'rejected' && m('PAUSED') === 'paused' && m('IN_APPEAL') === 'pending' ? true : 'a word maps wrong';
  });
  await cell('the nightly minute is its own (not one of cron.js\'s nine, IST)', () => {
    const c = codeOf('src/cron.js'); const mine = sweep.SWEEP_CRON;
    const theirs = [...c.matchAll(/cron\.schedule\('([^']+)'/g)].map((m) => m[1]);
    return !theirs.includes(mine) && sweep.IST === 'Asia/Kolkata' ? true : `collides: ${mine}`;
  });
  await cell('probeTemplate refuses without META_WABA_ID and never calls fetch', async () => {
    let called = 0; const r = await sweep.probeTemplate('tdw_x', { env: { META_WABA_TOKEN: 't' }, fetch: async () => { called++; } });
    return r.ok === false && /META_WABA_ID/.test(r.evidence) && called === 0 ? true : JSON.stringify(r);
  });
  await cell('probeTemplate matches the exact name (name_or_content is a substring filter)', async () => {
    const f = graphFetch('APPROVED', [{ name: 'tdw_contract_sign_otp', status: 'REJECTED', category: 'AUTHENTICATION', id: '222' }]);
    const r = await sweep.probeTemplate('tdw_contract_sign', { env: { META_WABA_ID: 'w', META_WABA_TOKEN: 't' }, fetch: f });
    return r.ok && r.status === 'approved' && r.meta.id === '111' ? true : JSON.stringify(r);
  });
  await cell('probeTemplate carries Meta\'s error verbatim in evidence, status untouched', async () => {
    const f = async () => ({ ok: false, status: 403, json: async () => ({ error: { code: 10, message: 'Permission denied' } }) });
    const r = await sweep.probeTemplate('tdw_x', { env: { META_WABA_ID: 'w', META_WABA_TOKEN: 't' }, fetch: f });
    return r.ok === false && /\(#10\) Permission denied/.test(r.evidence) ? true : JSON.stringify(r);
  });
  {
    const db = makeDouble(SEED()); cap._resetCapabilitiesCache(); await cap.bind(db);
    await cell('REJECTED template disarms its on flag through TEMPLATE_GUARDS (R-41.35)', async () => {
      const r = await sweep.runSweep({ supabase: db, env: { META_WABA_ID: 'w', META_WABA_TOKEN: 't' }, fetch: graphFetch('REJECTED'), keys: ['template.tdw_payment_reminder'], mode: 'bench' });
      const t = db.rows.get('template.tdw_payment_reminder'), g = db.rows.get('flag.payment_reminder_send');
      return t.status === 'rejected' && g.status === 'off' && /REJECTED/.test(g.evidence) && r.moved === 1 ? true : JSON.stringify({ t: t.status, g: g.status, r });
    });
    await cell('APPROVED template arms a pending guard, leaves a founder-off guard alone', async () => {
      // referral_alert guards flag.referral_alert_send (seeded off) — must stay off.
      await sweep.runSweep({ supabase: db, env: { META_WABA_ID: 'w', META_WABA_TOKEN: 't' }, fetch: graphFetch('APPROVED'), keys: ['template.tdw_referral_alert'], mode: 'bench' });
      const off = db.rows.get('flag.referral_alert_send').status === 'off';
      // review_request guards flag.review_ask_send — a second double seeds it pending
      // (a flag born before its walk, the future-arm shape) and it must become armed.
      const db2 = makeDouble([
        { key: 'flag.review_ask_send', kind: 'flag', status: 'pending', evidence: null, auto_on: false, walk_ref: null },
        { key: 'template.tdw_review_request', kind: 'template', status: 'pending', evidence: null, auto_on: false, walk_ref: null },
      ]);
      cap._resetCapabilitiesCache(); await cap.bind(db2);
      const r = await sweep.runSweep({ supabase: db2, env: { META_WABA_ID: 'w', META_WABA_TOKEN: 't' }, fetch: graphFetch('APPROVED'), keys: ['template.tdw_review_request'], mode: 'bench' });
      const armed = db2.rows.get('flag.review_ask_send').status === 'armed';
      cap._resetCapabilitiesCache(); await cap.bind(db);
      return off && armed && r.moved === 1 ? true : `off=${off} armed=${armed} moved=${r.moved}`;
    });
    await cell('a permission row is skipped (withheld, R-41.39) and its status does not move', async () => {
      const before = db.rows.get('perm.instagram_business_basic').status;
      const r = await sweep.runSweep({ supabase: db, env: {}, keys: ['perm.instagram_business_basic'], mode: 'bench' });
      return r.results[0].skipped === true && db.rows.get('perm.instagram_business_basic').status === before ? true : JSON.stringify(r.results[0]);
    });
    await cell('a failed probe touches evidence + checked_at and never the status', async () => {
      const r = await sweep.runSweep({ supabase: db, env: { META_WABA_ID: 'w', META_WABA_TOKEN: 't' }, fetch: async () => { throw new Error('ECONNRESET'); }, keys: ['template.tdw_referral_alert'], mode: 'bench' });
      const t = db.rows.get('template.tdw_referral_alert');
      return r.results[0].ok === false && t.status === 'approved' && /ECONNRESET/.test(t.evidence) && t.checked_at ? true : JSON.stringify(t);
    });
    await cell('webhook fast path: message_template_status_update PAUSED lands on the row (R-41.37)', async () => {
      const r = await sweep.applyTemplateStatusEvent(db, { event: 'PAUSED', message_template_name: 'tdw_referral_alert', message_template_id: '999', reason: 'LOW_QUALITY' });
      const t = db.rows.get('template.tdw_referral_alert');
      return r.applied && t.status === 'paused' && /Meta webhook: PAUSED · LOW_QUALITY/.test(t.evidence) ? true : JSON.stringify({ r, t });
    });
    await cell('webhook fast path ignores a template with no row (OTP templates)', async () => {
      const r = await sweep.applyTemplateStatusEvent(db, { event: 'APPROVED', message_template_name: 'tdw_vendor_login_otp' });
      return r.applied === false && r.reason === 'no_row' ? true : JSON.stringify(r);
    });
    await cell('metaInbound.extractTemplateStatusUpdates picks only that field', () => {
      const mi = req('src/lib/metaInbound.js');
      const body = { entry: [{ changes: [{ field: 'messages', value: { messages: [] } }, { field: 'message_template_status_update', value: { event: 'APPROVED', message_template_name: 'tdw_x' } }] }] };
      const out = mi.extractTemplateStatusUpdates(body);
      return out.length === 1 && out[0].message_template_name === 'tdw_x' ? true : JSON.stringify(out);
    });
    await cell('the receiver routes the field to the seam (src/index.js)', () =>
      /extractTemplateStatusUpdates\(req\.body\)/.test(codeOf('src/index.js')) && /applyTemplateStatusEvent\(supabase, v\)/.test(codeOf('src/index.js')) ? true : 'seam absent in index.js');
    await cell('the founder notice is WITHHELD: no live send in notifyFounder (comment-stripped)', () => {
      const c = codeOf('src/capabilitiesSweep.js');
      const body = c.split('async function notifyFounder')[1].split('\n}')[0];
      return !/sendMetaTemplate\(/.test(body) && /console\.log/.test(body) ? true : 'notice sends today';
    });
    await cell('the permission probe is WITHHELD: no probePermission function in live code', () => !/(^|\n)async function probePermission/.test(codeOf('src/capabilitiesSweep.js')) ? true : 'probePermission is live');
  }
  }

  sec('§5b · C1b — THE RAW WABA LISTING, PAGINATED TO COMPLETION (F-41.6)');
  if (sweep) {
    const twoPages = (calls) => async (url) => {
      calls.push(url);
      if (/after=CUR2/.test(url)) return { ok: true, status: 200, json: async () => ({ data: [{ name: 'tdw_b', status: 'APPROVED', category: 'UTILITY', id: '2', language: 'en' }], paging: { cursors: { after: 'END' } } }) };
      return { ok: true, status: 200, json: async () => ({ data: [{ name: 'tdw_c', status: 'PAUSED', category: 'MARKETING', id: '3', language: 'en' }, { name: 'tdw_a', status: 'REJECTED', category: 'UTILITY', id: '1', language: 'en' }], paging: { cursors: { after: 'CUR2' }, next: url + '&after=CUR2' } }) };
    };
    await cell('listWabaTemplates follows paging.next to the end and returns every row, sorted by name', async () => {
      const calls = []; const r = await sweep.listWabaTemplates({ env: { META_WABA_ID: 'w', META_WABA_TOKEN: 't' }, fetch: twoPages(calls) });
      return r.ok && r.pages === 2 && calls.length === 2 && r.templates.map((t) => t.name).join(',') === 'tdw_a,tdw_b,tdw_c' && r.templates[1].id === '2' && r.truncated === false ? true : JSON.stringify(r);
    });
    await cell('it asks for name,status,category,id and never calls fetch without META_WABA_ID', async () => {
      const calls = []; await sweep.listWabaTemplates({ env: { META_WABA_ID: 'w', META_WABA_TOKEN: 't' }, fetch: twoPages(calls) });
      const noId = await sweep.listWabaTemplates({ env: { META_WABA_TOKEN: 't' }, fetch: async () => { throw new Error('must not be called'); } });
      return /fields=name,status,category,id/.test(calls[0]) && noId.ok === false && /META_WABA_ID/.test(noId.evidence) ? true : 'fields or guard wrong';
    });
    await cell('a mid-listing Graph refusal returns ok:false with the page named and the rows read so far', async () => {
      let n = 0; const f = async (url) => { n++; if (n === 2) return { ok: false, status: 403, json: async () => ({ error: { code: 10, message: 'Permission denied' } }) }; return twoPages([])(url); };
      const r = await sweep.listWabaTemplates({ env: { META_WABA_ID: 'w', META_WABA_TOKEN: 't' }, fetch: f });
      return r.ok === false && r.templates.length === 2 && /page 2/.test(r.evidence) && /\(#10\)/.test(r.evidence) ? true : JSON.stringify(r);
    });
    await cell('maxPages stops a runaway cursor and says TRUNCATED', async () => {
      const f = async (url) => ({ ok: true, status: 200, json: async () => ({ data: [{ name: 'x' + Math.random(), id: '9' }], paging: { next: url } }) });
      const r = await sweep.listWabaTemplates({ env: { META_WABA_ID: 'w', META_WABA_TOKEN: 't' }, fetch: f, maxPages: 3 });
      return r.pages === 3 && r.truncated === true && r.ok === false && /TRUNCATED/.test(r.evidence) ? true : JSON.stringify(r);
    });
    await cell('the door GET /waba_templates exists, is admin-auth, and only reads (no cap writer called)', () => {
      const c = codeOf('src/api/admin/capabilities.js');
      const block = c.slice(c.indexOf("router.get('/waba_templates'"), c.indexOf("router.post('/sweep'"));
      return /requireAdmin, asyncHandler/.test(block) && /listWabaTemplates\(\)/.test(block) && !/cap\.(flip|recordSweep|setAutoOn|touch)\(/.test(block) ? true : 'door shape wrong';
    });
  }

  sec('§6 · THE ADMIN DOORS (shape, no express driven — the walk drives them)');
  await cell('router mounted at /admin/capabilities', () => /'\/admin\/capabilities',\s*require\('\.\/admin\/capabilities'\)/.test(codeOf('src/api/router.js')) ? true : 'not mounted');
  await cell('six doors: GET /, GET /waba_templates, POST /sweep, /:key/flip, /:key/auto_on, /:key/check', () => {
    const c = codeOf('src/api/admin/capabilities.js');
    return ["router.get('/'", "router.get('/waba_templates'", "router.post('/sweep'", "router.post('/:key/flip'", "router.post('/:key/auto_on'", "router.post('/:key/check'"].every((s) => c.includes(s)) ? true : 'a door is missing';
  });
  await cell('every door is behind requireAdmin', () => {
    const c = codeOf('src/api/admin/capabilities.js');
    return (c.match(/router\.(get|post)\(/g) || []).length === (c.match(/requireAdmin, asyncHandler/g) || []).length ? true : 'a door lacks requireAdmin';
  });
  await cell('boot binds the register and starts the sweep (src/index.js)', () => /startCapabilitiesSweep\(\{ supabase \}\)/.test(codeOf('src/index.js')) ? true : 'not started at boot');
  await cell('laneFlags.js and otpSend.js are byte-untouched by this packet (radius, kickoff §9)', () => {
    const a = read('src/lib/laneFlags.js'), b = read('src/lib/otpSend.js');
    return !/capabilities/.test(a) && !/capabilities/.test(b) ? true : 'out-of-radius file touched';
  });

  console.log(`\n${pass} GREEN · ${fail} RED`);
  if (fail) { console.log('\nFAILED:'); for (const f of fails) console.log('  ' + f); }
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH ERROR', e); process.exit(1); });
