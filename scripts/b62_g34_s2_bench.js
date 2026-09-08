#!/usr/bin/env node
// scripts/b62_g34_s2_bench.js — CE-41 · SEAT C · G3.4 s2 (`0152`).
//
// F-41.14 gate before claim · F-41.15 sent_at vs reminded_at · F-41.16 every
// outcome logs · F-41.17 plain words on the glass, the key in the log ·
// F-41.21/R-41.90 one log home · F-40.229 the sixth receipt arm · R-41.59 the
// failed row keeps its place and frees the milestone · the zero-variable notice.
//
// BOTH WAYS: at origin's tree §2–§6 RED (the claim precedes the gate, no status
// column is written, no arm exists); cured, all GREEN. `--mutate` edits PRODUCTION
// code in a scratch copy; each mutation must RED its named cell (F-40.216).
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = process.env.B62_ROOT ? path.resolve(process.env.B62_ROOT) : path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const codeOf = (rel) => read(rel).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const req = (rel) => require(path.join(ROOT, rel));
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

let pass = 0, fail = 0; const fails = [];
const sec = (t) => console.log(`\n${t}`);
function ok(name, cond, why) { if (cond) { pass++; console.log(`  ok   ${name}`); } else { fail++; fails.push(name); console.log(`  FAIL ${name}${why ? ' — ' + why : ''}`); } }
async function cell(name, fn) { try { const r = await fn(); r === true ? ok(name, true) : ok(name, false, typeof r === 'string' ? r : JSON.stringify(r)); } catch (e) { ok(name, false, (e && e.message) || String(e)); } }

// ── THE DOUBLE — payment_reminders + the tables the door reads ───────────────
function makeDb(seed = {}) {
  const t = { payment_reminders: [], payment_reminder_settings: [], ...seed };
  const log = [];
  let id = 0;
  function from(table) {
    if (!t[table]) t[table] = [];
    const st = { f: [], patch: null, ins: null };
    const rows = () => t[table].filter(r => st.f.every(([c, v]) => r[c] === v));
    const api = {
      select() { return api; }, order() { return api; }, limit() { return api; }, is() { return api; }, in() { return api; }, not() { return api; },
      eq(c, v) { st.f.push([c, v]); return api; },
      insert(row) { st.ins = row; return api; },
      update(p) { st.patch = p; return api; },
      maybeSingle: async () => {
        if (st.ins) {
          const dup = t[table].some(r => r.milestone_id === st.ins.milestone_id && r.kind === st.ins.kind && r.status !== 'failed');
          if (table === 'payment_reminders' && dup) return { data: null, error: { code: '23505', message: 'duplicate key' } };
          const row = { id: `pr_${++id}`, status: 'queued', wamid: null, ...st.ins };
          t[table].push(row); log.push({ op: 'insert', table, row });
          return { data: { id: row.id }, error: null };
        }
        const r = rows(); return { data: r[0] ? { ...r[0] } : null, error: null };
      },
      single: async () => api.maybeSingle(),
      then(res, rej) {
        return Promise.resolve().then(() => {
          if (st.patch) { const hit = rows(); for (const r of hit) Object.assign(r, st.patch); log.push({ op: 'update', table, patch: st.patch, n: hit.length }); return { data: hit.map(r => ({ ...r })), error: null }; }
          return { data: rows().map(r => ({ ...r })), error: null };
        }).then(res, rej);
      },
    };
    return api;
  }
  return { from, t, log };
}
function capture() {
  const lines = []; const l = console.log, w = console.warn, e = console.error;
  console.log = (...a) => lines.push(a.join(' ')); console.warn = (...a) => lines.push(a.join(' ')); console.error = (...a) => lines.push(a.join(' '));
  return { lines, done() { console.log = l; console.warn = w; console.error = e; return lines; } };
}
const MILESTONE = { id: 'ms1', invoice_id: 'inv1', milestone_label: 'Shoot day', amount_due: 24000, due_date: '2026-09-16' };
const INVOICE = { id: 'inv1', client_name: 'Priya Nair', client_phone: '9625759924', client_id: null };

(async () => {
  const PR = 'src/lib/vendor/paymentReminders.js';
  const SW = 'src/lib/sendWa.js';
  const RS = 'src/lib/vendor/relayStatus.js';
  const SCH = 'src/api/vendor/invoiceSchedule.js';
  const DOOR = 'src/api/vendor/reminders.js';
  const MIG = 'db/migrations/0152_payment_reminders_receipts.sql';

  sec('§1 · 0152 — the plane (F-40.229 on the 0142 shape, R-41.59)');
  // c-41.36 (CE-41 seat F): this cell asserted 0152 was THE LADDER TAIL. A tail
  // assertion cannot survive the next migration — 0153 landed and this went red
  // against a tree where nothing was wrong, which is a finding against the
  // instrument and not the tree (R-39.15's shape one floor over). The cell's real
  // subject is that 0152 EXISTS and that nothing renumbered it, and that is what it
  // now says. LD-8's append-only guarantee is unaffected: a re-used number would
  // show as two files sharing the prefix, which is the check below.
  ok('0152 exists and nothing renumbered it', exists(MIG) && fs.readdirSync(path.join(ROOT, 'db/migrations')).filter(f => /^0152/.test(f)).length === 1);
  const mig = exists(MIG) ? read(MIG) : '';
  const migCode = mig.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  ok('the four receipt columns', ['status', 'error_code', 'error_title', 'updated_at'].every(c => new RegExp(`add column if not exists\\s+${c}\\b`).test(migCode)));
  ok('the status vocabulary is 0142\'s own', /queued/.test(migCode) && /delivered/.test(migCode) && /read/.test(migCode) && /failed/.test(migCode) && /payment_reminders_status_check/.test(migCode));
  ok('a PARTIAL index on wamid (the router\'s lookup path)', /create index if not exists idx_payment_reminders_wamid[\s\S]{0,120}where wamid is not null/i.test(migCode));
  ok('a PARTIAL UNIQUE on wamid (so matched===1 can be promised)', /create unique index if not exists uq_payment_reminders_wamid[\s\S]{0,120}where wamid is not null/i.test(migCode));
  ok('R-41.59: the once-per-milestone key is relaxed WHERE status <> failed', /uq_payment_reminders_milestone_kind_live[\s\S]{0,160}\(milestone_id, kind\)[\s\S]{0,80}where status <> 'failed'/i.test(migCode));
  ok('and the old table constraint is dropped AFTER the index exists', migCode.indexOf('uq_payment_reminders_milestone_kind_live') < migCode.indexOf('drop constraint if exists payment_reminders_milestone_kind_key'));
  ok('the backfill invents nothing: only wamid-bearing rows become sent', /update public\.payment_reminders set status = 'sent' where wamid is not null/i.test(migCode) && !/'delivered'|'read'/.test(migCode.split('update public.payment_reminders')[1] || ''));

  sec('§2 · F-41.14 — the gate comes before the claim');
  await cell('a shut gate writes NO row and spends no milestone', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache(); cap._prime([]);
    const pr = req(PR); const db = makeDb(); const c = capture();
    const out = await pr.sendOneReminder(db, { vendorId: 'v1', milestone: MILESTONE, invoice: INVOICE, vendorName: 'Dev Roy Photography', source: 'vendor_tap' },
      { sendWa: async () => { throw new Error('must not reach the transport'); } });
    c.done();
    if (db.t.payment_reminders.length !== 0) return `wrote ${db.t.payment_reminders.length} row(s)`;
    return out.skipped === true && out.id === null ? true : JSON.stringify(out);
  });
  await cell('and the same milestone is still sendable once the gate opens', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache();
    cap._prime([{ key: 'flag.payment_reminder_send', kind: 'flag', status: 'on' }]);
    const pr = req(PR); const db = makeDb(); const c = capture();
    const out = await pr.sendOneReminder(db, { vendorId: 'v1', milestone: MILESTONE, invoice: INVOICE, vendorName: 'Dev Roy Photography', source: 'vendor_tap' },
      { sendWa: async () => ({ sent: true, result: { wamid: 'wamid.OK' } }) });
    c.done();
    return out.sent === true && db.t.payment_reminders.length === 1 && db.t.payment_reminders[0].wamid === 'wamid.OK' && db.t.payment_reminders[0].status === 'sent' ? true : JSON.stringify(out);
  });
  await cell('every other pre-send refusal also writes no row', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache();
    cap._prime([{ key: 'flag.payment_reminder_send', kind: 'flag', status: 'on' }]);
    const pr = req(PR); const c = capture();
    const cases = [
      [{ ...INVOICE, client_phone: null, client_id: null }, MILESTONE, 'Dev Roy', /phone number/],
      [{ ...INVOICE, client_name: null }, MILESTONE, 'Dev Roy', /client name/],
      [INVOICE, { ...MILESTONE, due_date: null }, 'Dev Roy', /due date/],
      [INVOICE, MILESTONE, null, /business name/],
    ];
    for (const [inv, ms, vn, re] of cases) {
      const db = makeDb();
      const out = await pr.sendOneReminder(db, { vendorId: 'v1', milestone: ms, invoice: inv, vendorName: vn, source: 'vendor_tap' },
        { sendWa: async () => ({ sent: true, result: { wamid: 'x' } }) });
      if (db.t.payment_reminders.length !== 0) { c.done(); return `a refusal wrote a row: ${out.reason}`; }
      if (!re.test(out.reason || '')) { c.done(); return `wrong reason: ${out.reason}`; }
    }
    c.done(); return true;
  });
  await cell('R-41.60: a refused tap is not consent — no vendor_tap row exists to tell the sweep otherwise', () => {
    const c = codeOf(PR);
    const body = c.slice(c.indexOf('async function sendOneReminder'), c.indexOf('async function runReminderSweep'));
    return body.indexOf('if (!gate.open)') < body.indexOf(".from('payment_reminders')") ? true : 'the claim still precedes the gate';
  });

  sec('§3 · R-41.59 — a failed attempt keeps its place and frees the milestone');
  await cell('a transport refusal marks the row failed, never a false done', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache();
    cap._prime([{ key: 'flag.payment_reminder_send', kind: 'flag', status: 'on' }]);
    const pr = req(PR); const db = makeDb(); const c = capture();
    const err = new Error('recipient has opted out'); err.code = 'wa_opted_out';
    const out = await pr.sendOneReminder(db, { vendorId: 'v1', milestone: MILESTONE, invoice: INVOICE, vendorName: 'Dev Roy', source: 'vendor_tap' },
      { sendWa: async () => { throw err; } });
    c.done();
    const row = db.t.payment_reminders[0];
    return out.sent === false && out.failed === true && row && row.status === 'failed' && row.error_code === 'wa_opted_out' && row.wamid === null ? true : JSON.stringify({ out, row });
  });
  await cell('and the milestone can be tried again — the failed row does not hold it', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache();
    cap._prime([{ key: 'flag.payment_reminder_send', kind: 'flag', status: 'on' }]);
    const pr = req(PR); const db = makeDb(); const c = capture();
    const err = new Error('opted out'); err.code = 'wa_opted_out';
    await pr.sendOneReminder(db, { vendorId: 'v1', milestone: MILESTONE, invoice: INVOICE, vendorName: 'D', source: 'vendor_tap' }, { sendWa: async () => { throw err; } });
    const again = await pr.sendOneReminder(db, { vendorId: 'v1', milestone: MILESTONE, invoice: INVOICE, vendorName: 'D', source: 'vendor_tap' }, { sendWa: async () => ({ sent: true, result: { wamid: 'wamid.SECOND' } }) });
    c.done();
    return again.sent === true && db.t.payment_reminders.length === 2 && db.t.payment_reminders.filter(r => r.status === 'failed').length === 1 ? true : JSON.stringify(again);
  });
  await cell('a SUCCESSFUL row still holds the milestone (the guarantee survives)', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache();
    cap._prime([{ key: 'flag.payment_reminder_send', kind: 'flag', status: 'on' }]);
    const pr = req(PR); const db = makeDb(); const c = capture();
    await pr.sendOneReminder(db, { vendorId: 'v1', milestone: MILESTONE, invoice: INVOICE, vendorName: 'D', source: 'vendor_tap' }, { sendWa: async () => ({ sent: true, result: { wamid: 'w1' } }) });
    const again = await pr.sendOneReminder(db, { vendorId: 'v1', milestone: MILESTONE, invoice: INVOICE, vendorName: 'D', source: 'vendor_tap' }, { sendWa: async () => ({ sent: true, result: { wamid: 'w2' } }) });
    c.done();
    return again.already === true && db.t.payment_reminders.length === 1 ? true : JSON.stringify(again);
  });

  sec('§4 · F-41.16 / F-41.21 / R-41.90 — one log home, every outcome');
  await cell('a refusal logs a REFUSED line naming the site and the milestone', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache(); cap._prime([]);
    const pr = req(PR); const db = makeDb(); const c = capture();
    await pr.sendOneReminder(db, { vendorId: 'v1', milestone: MILESTONE, invoice: INVOICE, vendorName: 'D', source: 'vendor_tap' }, { sendWa: async () => ({ sent: true }) });
    const lines = c.done();
    return lines.some(l => /\[wa:bride\] REFUSED/.test(l) && /site=reminders:vendor_tap/.test(l) && /milestone=ms1/.test(l)) ? true : lines.join(' | ') || 'no line';
  });
  await cell('sendWa logs its success through logWaSend, masked, once', () => {
    const c = codeOf(SW);
    if (/console\.log\(`\[sendWa:template\]/.test(c)) return 'the second grammar is still there';
    if (!/logWaSend\(line, \{ site: site \|\| 'sendWa:template'/.test(c)) return 'the dispatch seam does not route through logWaSend';
    return (c.match(/logWaSend\(/g) || []).length === 1 ? true : 'more than one log call in sendWa';
  });
  await cell('the reminder door names its site so the line says which door sent', () => /site: `reminders:\$\{source\}`/.test(codeOf(PR)));
  await cell('c-41.25: the four callers dropped their success-branch template line, and KEPT their refusals', () => {
    const files = ['src/cron.js', 'src/api/admin/mint.js', 'src/api/couple/enquire.js', 'src/lib/vendor/enquiryAlert.js'];
    for (const f of files) {
      const c = codeOf(f);
      const calls = c.match(/logWaSend\([\s\S]{0,320}?\)\s*;/g) || [];
      const badSuccess = calls.filter(x => /mode: 'template'/.test(x) && /\bout\b/.test(x) && !/\berr\b/.test(x));
      if (badSuccess.length) return `${f} still logs a template success itself`;
      if (!calls.some(x => /\berr\b/.test(x))) return `${f} lost its REFUSED line — sendWa's routed log never runs on a throw`;
    }
    return true;
  });
  await cell('free-form sends keep their own logging (sendWa\'s routed line is template-only)', () => {
    const c = codeOf('src/cron.js');
    return /logWaSend\('vendor', \{ site: 'cron:morning', mode: 'text'/.test(c) ? true : 'the free-form line went with it';
  });

  sec('§5 · F-41.17 — the key for the log, the sentence for the glass');
  await cell('the shut gate hands both, and the sentence has no register grammar', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache(); cap._prime([]);
    const pr = req(PR); const g = await pr.sendGate();
    if (!/flag\.payment_reminder_send/.test(g.reason || '')) return `reason lost the key: ${g.reason}`;
    if (g.reason_text !== 'Reminders are switched off for now.') return `reason_text: ${g.reason_text}`;
    // The full stop is not register grammar — the first cut of this cell matched it.
    return !/_|(flag|template|perm|scope)\./.test(g.reason_text) ? true : 'the sentence carries register grammar';
  });
  await cell('the door hands reason_text to the room', () => {
    const c = codeOf(DOOR);
    return /reason_text: out\.reason_text/.test(c) && /reason_text: gate\.reason_text/.test(c) ? true : 'a door still hands only the key';
  });
  await cell('the four plain refusals are unchanged and pass through', () => {
    const pr = req(PR);
    return pr.plainWords('this client has no phone number on the invoice') === 'this client has no phone number on the invoice';
  });

  sec('§6 · F-40.229 — the sixth receipt arm');
  await cell('the arm exists, is APPENDED after assistance_request_notify, and updates by wamid', () => {
    const c = codeOf(RS);
    if (!/home=payment_reminder/.test(c)) return 'no sixth arm';
    if (c.indexOf("'home=assistance_request_notify'") > c.indexOf("'home=payment_reminder'")) return 'it was inserted above an existing home, not appended';
    const block = c.slice(c.indexOf("from('payment_reminders')"), c.indexOf("'home=payment_reminder'"));
    return /\.eq\('wamid', wamid\)/.test(block) && /\.select\(/.test(block) ? true : 'the arm updates blind';
  });
  await cell('it writes status, error_code, error_title — the columns 0152 adds', () => {
    const c = codeOf(RS);
    const block = c.slice(c.indexOf("from('payment_reminders')"), c.indexOf("'home=payment_reminder'"));
    return /status: want/.test(block) && /error_code: firstErrCode\(status\)/.test(block) && /error_title: firstErrTitle\(status\)/.test(block);
  });
  await cell('driven: a delivered receipt for a reminder wamid lands on the row', async () => {
    const rs = req(RS); const db = makeDb({ messages: [], lead_alerts: [], referral_alerts: [], contract_sends: [], assistance_forwards: [], assistance_requests: [] });
    db.t.payment_reminders.push({ id: 'pr_x', wamid: 'wamid.RECEIPT', status: 'sent', vendor_id: 'v1', milestone_id: 'ms1', invoice_id: 'inv1' });
    const c = capture();
    const out = await rs.witnessStatusMatch(db, { id: 'wamid.RECEIPT', status: 'delivered' });
    const lines = c.done();
    return out && out.matched === 1 && out.reason === 'payment_reminder' && db.t.payment_reminders[0].status === 'delivered'
      && lines.some(l => /home=payment_reminder/.test(l) && /matched=1/.test(l)) ? true : JSON.stringify({ out, row: db.t.payment_reminders[0] });
  });
  await cell('a wamid no table carries still falls to home=none', async () => {
    const rs = req(RS); const db = makeDb({ messages: [], lead_alerts: [], referral_alerts: [], contract_sends: [], assistance_forwards: [], assistance_requests: [] });
    const c = capture(); const out = await rs.witnessStatusMatch(db, { id: 'wamid.ORPHAN', status: 'sent' }); const lines = c.done();
    return out.matched === 0 && lines.some(l => /home=none/.test(l)) ? true : JSON.stringify(out);
  });

  sec('§7 · F-41.15 — the schedule door tells reminded from sent');
  await cell('the door selects wamid and status, and hands sent_at + reminder_failed', () => {
    const c = codeOf(SCH);
    return /select\('milestone_id, created_at, wamid, status'\)/.test(c) && /sent_at:\s+sentAt\.get/.test(c) && /reminder_failed:/.test(c) ? true : 'the door still reads row-presence alone';
  });
  await cell('sent_at is set only when a wamid exists', () => {
    const c = codeOf(SCH);
    return /if \(r\.wamid\) \{[\s\S]{0,200}sentAt\.set/.test(c);
  });

  sec('§8 · the switchboard\'s own notice (R-41.41), zero variables');
  await cell('the registry carries capability_armed: vendor lane, Utility, no variables', () => {
    const t = req('src/lib/templates.js');
    const e = t.TEMPLATES.capability_armed;
    return e && e.name === 'tdw_capability_armed' && e.line === 'vendor' && e.category === 'UTILITY' && Array.isArray(e.variables) && e.variables.length === 0 ? true : JSON.stringify(e);
  });
  await cell('the payload carries NO parameters and NO button component', () => {
    const t = req('src/lib/templates.js');
    const p = t.buildTemplatePayload('capability_armed', {});
    return Array.isArray(p.components) && p.components.length === 0 && !JSON.stringify(p).includes('button') ? true : JSON.stringify(p);
  });
  await cell('and it REFUSES any parameter passed', () => {
    const t = req('src/lib/templates.js');
    try { t.buildTemplatePayload('capability_armed', ['x']); return 'accepted a parameter'; }
    catch (e) { return /expects 0 var/.test(e.message) ? true : e.message; }
  });
  await cell('the notice is itself gated on its register row — his tap, like every other send', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache(); cap._prime([]);
    const sweep = req('src/capabilitiesSweep.js'); const c = capture();
    let sent = 0;
    const r = await sweep.notifyFounder('armed flag.x', { env: { ADMIN_PHONE: '919888294440' }, sendWa: async () => { sent++; return { sent: true }; } });
    c.done();
    return r.sent === false && sent === 0 ? true : JSON.stringify(r);
  });
  await cell('switched on, it sends once on the vendor lane with no vars', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache();
    cap._prime([{ key: 'template.tdw_capability_armed', kind: 'template', status: 'on' }]);
    const sweep = req('src/capabilitiesSweep.js'); const c = capture();
    let seen = null;
    const r = await sweep.notifyFounder('armed flag.x', { env: { ADMIN_PHONE: '919888294440' }, sendWa: async (o) => { seen = o; return { sent: true }; } });
    c.done();
    return r.sent === true && seen && seen.line === 'vendor' && seen.templateKey === 'capability_armed'
      && JSON.stringify(seen.vars) === '{}' && seen.site === 'capabilities:armed' ? true : JSON.stringify(seen);
  });
  await cell('no ADMIN_PHONE means no send and a named line', async () => {
    const cap = req('src/lib/capabilities.js'); cap._resetCapabilitiesCache();
    cap._prime([{ key: 'template.tdw_capability_armed', kind: 'template', status: 'on' }]);
    const sweep = req('src/capabilitiesSweep.js'); const c = capture();
    let sent = 0;
    const r = await sweep.notifyFounder('x', { env: {}, sendWa: async () => { sent++; } });
    const lines = c.done();
    return r.sent === false && sent === 0 && lines.some(l => /ADMIN_PHONE is not set/.test(l)) ? true : JSON.stringify(r);
  });

  sec('§9 · F-41.59 / R-41.91 — the bride lane reaches the receipt router');
  await cell('the bride service calls applyStatusEvent in its status loop, as the vendor one does', () => {
    const b = codeOf('src/brideIndex.js');
    const loop = b.slice(b.indexOf('for (const s of metaInbound.extractStatuses(req.body))'), b.indexOf('[bride-webhook:meta] inbound processing error'));
    if (!/applyStatusEvent\(supabase, s,/.test(loop)) return 'the loop still ends at its own messages update';
    if (!/require\('\.\/lib\/vendor\/relayStatus'\)/.test(loop)) return 'it does not reach relayStatus';
    return /catch \(e\)/.test(loop) ? true : 'the seam is unguarded — a router throw would take inbound down';
  });
  await cell('and it KEEPS its own messages update — the router\'s first home, not a replacement', () => {
    const b = codeOf('src/brideIndex.js');
    const loop = b.slice(b.indexOf('for (const s of metaInbound.extractStatuses(req.body))'), b.indexOf('[bride-webhook:meta] inbound processing error'));
    return /from\('messages'\)[\s\S]{0,120}delivery_status/.test(loop) && loop.indexOf("from('messages')") < loop.indexOf('applyStatusEvent') ? true : 'the lane lost its own plane';
  });
  await cell('driven: a BRIDE-lane reminder receipt now lands on payment_reminders (the walk that failed)', async () => {
    const rs = req('src/lib/vendor/relayStatus.js');
    const db = makeDb({ messages: [], lead_alerts: [], referral_alerts: [], contract_sends: [], assistance_forwards: [], assistance_requests: [] });
    db.t.payment_reminders.push({ id: 'pr_bride', wamid: 'wamid.BRIDE', status: 'sent', vendor_id: 'v1', milestone_id: 'ms1', invoice_id: 'inv1' });
    const c = capture();
    // The exact call the bride loop now makes.
    const out = await rs.applyStatusEvent(db, { id: 'wamid.BRIDE', status: 'delivered' }, { env: {} });
    const lines = c.done();
    return db.t.payment_reminders[0].status === 'delivered' && lines.some(l => /home=payment_reminder/.test(l) && /matched=1/.test(l)) ? true : JSON.stringify({ out, row: db.t.payment_reminders[0], lines });
  });
  sec('§10 · F-41.60 / R-41.92 — the marketing lane reaches it too');
  await cell('the marketing service calls applyStatusEvent in its status loop', () => {
    const m = codeOf('src/marketingIndex.js');
    const loop = m.slice(m.indexOf('for (const s of extractStatuses(subBody))'), m.indexOf('function statusLogLine'));
    if (!/applyStatusEvent\(supabase, s,/.test(loop)) return 'the loop still ends at its own log line';
    if (!/require\('\.\/lib\/vendor\/relayStatus'\)/.test(loop)) return 'it does not reach relayStatus';
    return /catch \(e\)/.test(loop) ? true : 'the seam is unguarded';
  });
  await cell('and it KEEPS statusLogLine — this lane\'s own error vocabulary (F-08.95)', () => {
    const m = codeOf('src/marketingIndex.js');
    const loop = m.slice(m.indexOf('for (const s of extractStatuses(subBody))'), m.indexOf('function statusLogLine'));
    return /console\.log\(statusLogLine\(s\)\)/.test(loop) && loop.indexOf('statusLogLine') < loop.indexOf('applyStatusEvent') ? true : 'the lane lost its own line';
  });
  await cell('driven: a MARKETING-lane outsider-alert receipt lands on assistance_forwards (seat A\'s walk)', async () => {
    const rs = req('src/lib/vendor/relayStatus.js');
    const db = makeDb({ messages: [], lead_alerts: [], referral_alerts: [], contract_sends: [], assistance_requests: [] });
    db.t.assistance_forwards = [{ id: 'af1', wamid: 'wamid.MKT', status: 'sent', item_id: 'i1', target_kind: 'prospect', prospect_id: 'p1' }];
    const c = capture();
    const out = await rs.applyStatusEvent(db, { id: 'wamid.MKT', status: 'delivered' }, { env: {} });
    const lines = c.done();
    return db.t.assistance_forwards[0].status === 'delivered' && lines.some(l => /home=assistance_forward/.test(l) && /matched=1/.test(l)) ? true : JSON.stringify({ out, row: db.t.assistance_forwards[0] });
  });

  await cell('the estate now has THREE callers of the router, and they are the three receivers', () => {
    const files = [];
    (function walk(d) { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const p2 = path.join(d, e.name); if (e.isDirectory()) walk(p2); else if (e.name.endsWith('.js')) files.push(p2); } })('src');
    const callers = files.filter(f => f !== 'src/lib/vendor/relayStatus.js' && /applyStatusEvent\(/.test(codeOf(f))).sort();
    return callers.length === 3 && callers.includes('src/index.js') && callers.includes('src/brideIndex.js') && callers.includes('src/marketingIndex.js') ? true : callers.join(', ') || 'none';
  });

  console.log(`\n  b62_g34_s2  ${pass}/${pass + fail}`);
  if (fail) console.log('  FAILED: ' + fails.join(' · '));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('BENCH ERROR', e); process.exit(1); });
