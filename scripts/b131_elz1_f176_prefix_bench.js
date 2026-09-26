#!/usr/bin/env node
'use strict';
// scripts/b131_elz1_f176_prefix_bench.js · RUNG b131 · CE-45 ELZ-1 · F-44.176 (the founder's (a), 26 September 2026: "make sure that this
// prefix is only there when the tdw shared line is used. not for vendor own number"). No model; reads no real clock.
//   §1 the shared line: the REAL relayToCouple sends "{studio}: " + the approved bytes, and the thread row records the SAME string
//   §2 not the shared line: a send from any other number (a vendor's own) carries no prefix
//   §3 no studio name: no prefix; already named: no second prefix
//   §4 untouched: the window-closed template path (it already names the vendor) and the seat that stages the approved draft
//   §5 mutations of production code
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const P = (r) => path.join(ROOT, r);
const RTC = 'src/lib/vendor/relayToCouple.js';
let pass = 0; let fail = 0; const failed = [];
const T = (n, c) => { if (c) { pass += 1; console.log(`  PASS  ${n}`); } else { fail += 1; failed.push(n); console.log(`  FAIL  ${n}`); } };
const sec = (t) => console.log(`\n${t}`);

// the window, open (coupleWaWindow is not under test here)
const winPath = require.resolve(P('src/lib/vendor/coupleWaWindow.js'));
const realWin = require(winPath);
require.cache[winPath].exports = { ...realWin, coupleWindowOpen: async () => ({ open: true }) };

const SHARED = '+917011788380';
const ENV = { VENDOR_WHATSAPP_NUMBER: SHARED };
const DEV440 = { id: 'v1', business_name: 'Dev Roy Photography' };
const BODY = 'Hi Sarah, your photos are ready!';
function store() {
  const rows = [];
  const from = (t) => {
    const api = { select: () => api, eq: () => api, order: () => api, limit: () => api,
      maybeSingle: async () => ({ data: t === 'conversations' ? { id: 'thread-1' } : null, error: null }),
      insert: (row) => { rows.push({ t, row }); return Promise.resolve({ error: null }); },
      update: () => api, then: (r) => r({ error: null }) };
    return api;
  };
  return { rows, from };
}
function transport() { const calls = []; const f = async (to, text, media, fromNo) => { calls.push({ to, text, from: fromNo }); return { sent: true, sid: 'wamid.X' }; }; f.calls = calls; return f; }
const fresh = () => { delete require.cache[require.resolve(P(RTC))]; return require(P(RTC)); };
async function mutated(from, to, fn) {
  const f = P(RTC); const before = fs.readFileSync(f, 'utf8');
  if (!before.includes(from)) { console.error(`MUTATION ANCHOR STALE: ${from.slice(0, 60)}`); process.exit(2); }
  fs.writeFileSync(f, before.replace(from, to));
  try { return await fn(fresh()); } finally { fs.writeFileSync(f, before); fresh(); }
}
async function drive(R, vendor) { const sb = store(); const send = transport(); const out = await R.relayToCouple(sb, { vendor, couplePhone: '+919625759924', body: BODY, sendWhatsApp: send, env: ENV }); return { out, sb, send }; }

(async () => {
  const R = fresh();
  sec('1 the shared line');
  const d = await drive(R, DEV440);
  const row = d.sb.rows.find((x) => x.t === 'messages');
  T('1.1 the send leaves from TDW\'s shared line with the studio\'s name before the approved bytes', d.out.ok === true && d.send.calls.length === 1 && d.send.calls[0].from === SHARED && d.send.calls[0].text === `Dev Roy Photography: ${BODY}`);
  T('1.2 the thread row records the SAME string that was sent (vendor_relay, with its sid)', !!row && row.row.body === d.send.calls[0].text && row.row.sent_by === 'vendor_relay' && row.row.twilio_sid === 'wamid.X');

  sec('2 not the shared line (a vendor\'s own number)');
  T('2.1 a send from any other number carries NO prefix', R.withSharedLinePrefix(BODY, DEV440, '+919811112222', ENV) === BODY && R.sharedLinePrefix(DEV440, '+919811112222', ENV) === '');
  T('2.2 with the shared line unknown to the environment, no prefix (never guessed)', R.sharedLinePrefix(DEV440, SHARED, {}) === '');

  sec('3 no name, and no double');
  T('3.1 no business_name and no name: no prefix (never "this vendor:")', R.withSharedLinePrefix(BODY, { business_name: '  ' }, SHARED, ENV) === BODY);
  T('3.2 the person\'s name when there is no business_name', R.withSharedLinePrefix(BODY, { name: 'Dev Roy' }, SHARED, ENV) === `Dev Roy: ${BODY}`);
  T('3.3 a text that already opens with the studio\'s name is not prefixed twice', R.withSharedLinePrefix('Dev Roy Photography here. Hi Sarah', DEV440, SHARED, ENV) === 'Dev Roy Photography here. Hi Sarah');

  sec('4 untouched');
  const body = (t, name) => { const i = t.search(new RegExp(`^(async )?function ${name}\\b`, 'm')); if (i < 0) return ''; let j = t.indexOf('(', i); let dd = 0; for (; j < t.length; j += 1) { if (t[j] === '(') dd += 1; else if (t[j] === ')') { dd -= 1; if (dd === 0) break; } } const k = t.indexOf('{', j); dd = 0; for (let m = k; m < t.length; m += 1) { if (t[m] === '{') dd += 1; else if (t[m] === '}') { dd -= 1; if (dd === 0) return t.slice(i, m + 1); } } return ''; };
  const base = execSync('git show 727ed5c:src/lib/vendor/relayToCouple.js', { cwd: ROOT, encoding: 'utf8' });
  const now = fs.readFileSync(P(RTC), 'utf8');
  T('4.1 the window-closed template path (sendContentTemplate) is byte-identical to 727ed5c: its template already names the vendor', body(now, 'sendContentTemplate') === body(base, 'sendContentTemplate') && body(now, 'sendContentTemplate').length > 0);
  T('4.2 the seat that stages and approves (relaySeat.js, coupleDrafts.js) is untouched: the draft keeps his approved bytes', /* RE-AIMED (CE-45 ELZ-1 e-151, R-45.30 and the chair's ruling (1), labelled): relaySeat.js changed ONLY by four em dashes set as punctuation, his words unchanged: undo those four and it is byte-identical to 727ed5c */ ((() => { const now = require('fs').readFileSync(require('path').join(ROOT, 'src/lib/vendor/relaySeat.js'), 'utf8'); const undone = now.replace('`The draft is saved. The moment she writes', '`The draft is saved \u2014 the moment she writes').replace('`Done. ${name', '`Done \u2014 ${name').replace('. Here it is again:', ' \u2014 here it is again:').replace('`Not sent. I\'ve dropped it.', '`Not sent \u2014 I\'ve dropped it.'); return undone === execSync('git show 727ed5c:src/lib/vendor/relaySeat.js', { cwd: ROOT, encoding: 'utf8' }); })()) && (() => { /* RE-AIMED (CE-45 ASK-1 cut 1, labelled; d7): coupleDrafts gains ONE read function, sentFor, and its export; stage, approve and every byte before them are unmoved, so the draft still keeps his approved bytes. Proven: zero lines removed since 727ed5c, every added line sentFor's (a SELECT, no write). relaySeat.js as before. */ const d = execSync('git diff -U0 727ed5c -- src/lib/vendor/coupleDrafts.js', { cwd: ROOT, encoding: 'utf8' }).split('\n'); const minus = d.filter((l) => l.startsWith('-') && !l.startsWith('---')); const plus = d.filter((l) => l.startsWith('+') && !l.startsWith('+++')).join('\n'); return minus.length === 0 && /async function sentFor\(supabase, vendorId/.test(plus) && /^\+  sentFor,$/m.test(plus) && !/\.(insert|update|upsert|delete)\(/.test(plus); })());

  sec('5 mutations of production code');
  const m1 = await mutated("    if (!from || !shared || String(from) !== String(shared)) return '';", "    if (!shared) return '';", async (M) => M.withSharedLinePrefix(BODY, DEV440, '+919811112222', ENV));
  T('5.1 M1 the prefix on EVERY number reddens 2.1 (a vendor\'s own number would carry it)', m1 === `Dev Roy Photography: ${BODY}`);
  const m2 = await mutated('    out = await sendWhatsApp(couplePhone, sentText, [], from);', '    out = await sendWhatsApp(couplePhone, text, [], from);', async (M) => { const x = await drive(M, DEV440); const rr = x.sb.rows.find((y) => y.t === 'messages'); return x.send.calls[0].text !== rr.row.body; });
  T('5.2 M2 sending the bare text while recording the prefixed one reddens 1.2 (the record would not match the send)', m2 === true);
  T('5.3 every mutated file restored', fs.readFileSync(P(RTC), 'utf8') === now);

  console.log(`\nb131_elz1_f176_prefix_bench: ${pass} passed, ${fail} failed  (total ${pass + fail})`);
  if (fail) { console.log(`FAILED: ${failed.join(' · ')}`); process.exit(1); }
})().catch((e) => { console.log(`BENCH CRASHED: ${e && e.stack}`); process.exit(1); });
