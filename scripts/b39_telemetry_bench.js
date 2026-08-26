#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// scripts/b39_telemetry_bench.js
// M-TELEMETRY · R-37.46 / .47 / .48 / .49 / .50 / .51 / .52
//
// ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
// On 26 Aug the founder noticed enquiry alerts had stopped arriving. Three
// sends had fired, Meta had accepted and then rejected all three, and the
// estate could not name the template, the recipient, or the wamid — because
// FIVE OF SIX VENDOR-LANE SEND SITES LOGGED NOTHING. Diagnosing it cost an
// evening and never produced the error code.
//
// ── THE BAR, INHERITED FROM M-DOORBOOT ──────────────────────────────────────
// CELLS EXECUTE. A cell that greps source for a `console.log` proves the string
// exists, not that the line is emitted with the right fields on the right
// branch — which is the vacuity class F-16.28 shipped through. Every cell below
// either calls `logWaSend` and captures real console output, or boots a real
// door over loopback and captures what it emits.
//
// Run: node scripts/b39_telemetry_bench.js
// ─────────────────────────────────────────────────────────────────────────────
'use strict';

process.env.SUPABASE_URL = 'http://127.0.0.1:1/bench-placeholder-not-a-credential';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'bench-placeholder-not-a-credential';

const path    = require('path');
const http    = require('http');
const assert  = require('assert');
const express = require('express');

const ROOT = path.join(__dirname, '..');
const P    = (rel) => path.join(ROOT, rel);

let pass = 0, fail = 0;
const reds = [];
async function t(id, name, fn) {
  try { await fn(); console.log(`  ok   ${id}  ${name}`); pass++; }
  catch (e) { console.log(`  RED  ${id}  ${name}\n        — ${e && e.message}`); fail++; reds.push(id); }
}

// ── CAPTURE REAL CONSOLE OUTPUT ─────────────────────────────────────────────
// Not a spy on a wrapper — the actual console methods the code calls.
function capture(fn) {
  const lines = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  const grab = (lvl) => (...a) => lines.push({ lvl, text: a.join(' ') });
  console.log = grab('log'); console.warn = grab('warn'); console.error = grab('error');
  const done = () => { console.log = orig.log; console.warn = orig.warn; console.error = orig.error; };
  // ── RESTORE IN `finally`, AND THE MUTATION HARNESS IS WHY ───────────────────
  // The first draft restored only on the success path. So when a cell's fn
  // THREW, the console stayed hijacked — and the bench's own `RED` line was
  // swallowed by its own capture, along with every line after it. Mutation N6
  // (make the logger throw) came back INERT for exactly that reason: cell 2.7
  // was failing and could not say so. A harness that cannot report its own
  // failures is worse than one cell short, because it makes the count lie.
  // Found by running mutations, not by reading this function.
  // The async path OWNS its restore: a `finally` here fires the moment the
  // promise is RETURNED, long before the awaited work runs, which would restore
  // the console mid-flight and capture nothing. So `deferred` marks who is
  // responsible, and the sync path restores in `finally` for both outcomes.
  let deferred = false;
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      deferred = true;
      return r.then((v) => { done(); return { lines, value: v }; },
                    (e) => { done(); throw e; });
    }
    return { lines, value: r };
  } finally {
    if (!deferred) done();
  }
}
const waLines = (lines) => lines.filter((l) => /^\[wa:/.test(l.text));

// ── THE LOAD IS TOLERANT, AND THAT IS A BOTH-WAYS DECISION ──────────────────
// At an uncured tree `src/lib/waSendLog.js` does not exist, and a bare require
// kills the process before a single cell runs. That is technically a red, but
// it reports "a file is missing" rather than WHICH behaviours are absent — and
// a both-ways proof whose uncured side is one crash discloses no counts. So the
// load degrades to a stub and every cell reds on its own subject.
let logWaSend, maskTo;
try {
  ({ logWaSend, maskTo } = require(P('src/lib/waSendLog')));
} catch (e) {
  logWaSend = () => {};                       // emits nothing: §2 and §3 red honestly
  maskTo = () => 'MODULE_ABSENT';
}
const { readSend } = require(P('src/lib/vendor/relayToCouple'));

// sendWa's real return shapes, transcribed from src/lib/sendWa.js.
const SENDWA_TEXT_OK     = { sent: true, mode: 'text', from: 'F', to: 'T', result: { ok: true, wamid: 'wamid.TEXT123', raw: {} } };
const SENDWA_TEMPLATE_OK = { sent: true, mode: 'template', key: 'k', from: 'F', to: 'T', payload: {}, result: { ok: true, wamid: 'wamid.TPL456', raw: {} } };

class WaError extends Error {
  constructor(m, code) { super(m); this.name = 'WaError'; this.code = code; this.sent = false; }
}

(async () => {
console.log('\nb39_telemetry_bench — M-TELEMETRY\n');

// ══════════════════════════════════════════════════════════════════════════
console.log('§1 · THE FOURTH CONTRACT — R-37.47');

await t('1.1', 'sendwa_freeform is DECLARED and reads the id where it actually lives', async () => {
  const v = readSend('sendwa_freeform', SENDWA_TEXT_OK);
  assert.strictEqual(v.ok, true);
  assert.strictEqual(v.id, 'wamid.TEXT123',
    `the free-form id was not read: ${JSON.stringify(v)}`);
});

await t('1.2', 'THE TRAP, PINNED: the Twilio `freeform` contract harvests NOTHING from sendWa', async () => {
  // This is the defect the fourth contract exists to prevent, asserted rather
  // than described. `freeform`'s idField is 'sid'; sendWa's text return has no
  // `sid` anywhere on it, so a reader using the wrong contract publishes a
  // blank id on a genuine success — telemetry that lies.
  const wrong = readSend('freeform', SENDWA_TEXT_OK);
  assert.strictEqual(wrong.id, null,
    'the Twilio contract now finds an id on a sendWa return — the contracts have converged and this cell must be re-read');
  const right = readSend('sendwa_freeform', SENDWA_TEXT_OK);
  assert.strictEqual(right.id, 'wamid.TEXT123');
});

await t('1.3', 'the template contract is UNMOVED — R-37.47 touched nothing existing', async () => {
  assert.strictEqual(readSend('sendwa_template', SENDWA_TEMPLATE_OK).id, 'wamid.TPL456');
  assert.strictEqual(readSend('template', { ok: true, wamid: 'w1' }).id, 'w1');
  assert.strictEqual(readSend('freeform', { sent: true, sid: 's1' }).id, 's1');
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§2 · THE LINE — R-37.48, executed and read back');

await t('2.1', 'a SUCCESS emits one keyed line carrying the wamid', async () => {
  const { lines } = capture(() => logWaSend('vendor', {
    site: 'enquire:oow', mode: 'template', templateKey: 'lead_alert_basic',
    to: '+919888294440', out: SENDWA_TEMPLATE_OK, ctx: 'v1',
  }));
  const w = waLines(lines);
  assert.strictEqual(w.length, 1, `expected exactly 1 line, got ${w.length}`);
  const s = w[0].text;
  for (const frag of ['[wa:vendor]', 'SENT', 'site=enquire:oow', 'mode=template',
                      'key=lead_alert_basic', 'wamid=wamid.TPL456']) {
    assert.ok(s.includes(frag), `missing ${frag} in: ${s}`);
  }
});

await t('2.2', 'a REFUSAL emits one keyed line carrying err.code', async () => {
  const { lines } = capture(() => logWaSend('vendor', {
    site: 'enquire:oow', mode: 'template', templateKey: 'lead_alert_basic',
    to: '+919888294440', err: new WaError('nope', 'template_not_approved'), ctx: 'v1',
  }));
  const w = waLines(lines);
  assert.strictEqual(w.length, 1);
  assert.ok(w[0].text.includes('REFUSED'), w[0].text);
  assert.ok(w[0].text.includes('err=template_not_approved'),
    `the code did not reach the line: ${w[0].text}`);
});

await t('2.3', 'R-37.46: an UNKNOWN code logs itself — no enumeration to maintain', async () => {
  // The tenth class, minted after this file was written. Nothing here knows it
  // exists and it must still appear. This cell reds the day someone replaces
  // the generic read with a whitelist.
  const { lines } = capture(() => logWaSend('vendor', {
    site: 's', mode: 'text', to: '1', err: new WaError('x', 'a_code_invented_in_the_future'),
  }));
  assert.ok(waLines(lines)[0].text.includes('err=a_code_invented_in_the_future'),
    'an unrecognised code was dropped — the line is keyed on an enumeration');
});

await t('2.4', 'a NON-typed error reports its CLASS, never a silent dash', async () => {
  // A plain Error here is a genuine bug, not a refusal. Logging '-' would
  // disguise a crash as a policy decision.
  const { lines } = capture(() => logWaSend('vendor', {
    site: 's', mode: 'text', to: '1', err: new TypeError('boom'),
  }));
  assert.ok(waLines(lines)[0].text.includes('err=TypeError'), waLines(lines)[0].text);
});

await t('2.5', 'the recipient is MASKED to tail-4 — no contact detail in a log aggregator', async () => {
  const { lines } = capture(() => logWaSend('vendor', {
    site: 's', mode: 'text', to: '+919888294440', out: SENDWA_TEXT_OK,
  }));
  const s = waLines(lines)[0].text;
  assert.ok(s.includes('to=…4440'), s);
  assert.ok(!s.includes('919888294440'), `the full number reached the log: ${s}`);
  assert.strictEqual(maskTo(null), 'none');
});

await t('2.6', 'every field is grep-shaped — no spaces inside a value', async () => {
  const { lines } = capture(() => logWaSend('vendor', {
    site: 'a b', mode: 'text', to: '1', err: new WaError('m', 'code with spaces'),
  }));
  const s = waLines(lines)[0].text;
  assert.ok(/err=code_with_spaces(\s|$)/.test(s), `a value carried a space: ${s}`);
});

await t('2.7', 'THE LOGGER NEVER THROWS — telemetry cannot break a send', async () => {
  const hostile = { get mode() { throw new Error('exploding getter'); } };
  assert.doesNotThrow(() => capture(() => logWaSend('vendor', hostile)));
  assert.doesNotThrow(() => capture(() => logWaSend('vendor', null)));
  assert.doesNotThrow(() => capture(() => logWaSend()));
});

await t('2.8', 'R-37.49: the lane is a PARAMETER — F-05.91 is six one-line calls', async () => {
  for (const lane of ['vendor', 'bride', 'marketing']) {
    const { lines } = capture(() => logWaSend(lane, { site: 's', mode: 'text', to: '1', out: SENDWA_TEXT_OK }));
    assert.ok(lines[0].text.startsWith(`[wa:${lane}]`), lines[0].text);
  }
});

await t('2.9', 'a success whose return is UNREADABLE is loud, not silently blank', async () => {
  const { lines } = capture(() => logWaSend('vendor', { site: 's', mode: 'text', to: '1', out: { sent: false } }));
  assert.ok(waLines(lines)[0].text.includes('UNREADABLE'), waLines(lines)[0].text);
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§3 · THE DOOR EMITS IT — executed over loopback, not grepped');
// The enquiry door is booted for real. This is the site whose silence cost the
// 26 Aug evening, so its line is proven by running the door, not by reading it.

const SENT = [];
const sendWaPath = require.resolve(P('src/lib/sendWa.js'));
class WaWindowClosedError extends WaError {
  constructor(m) { super(m || 'closed', 'window_closed'); this.name = 'WaWindowClosedError'; }
}
let SEND_BEHAVIOUR = 'ok';
require.cache[sendWaPath] = {
  id: sendWaPath, filename: sendWaPath, loaded: true,
  exports: {
    sendWa: async (args) => {
      SENT.push(args);
      // 'tplfail' must ALSO close the window: the template leg is only REACHED
      // when the free-form send throws WaWindowClosedError first. The first
      // draft of this stub failed only the template, so the door never fell
      // through and 3.3 asserted against a leg that had not run — a fixture
      // that could not reach its own subject.
      if ((SEND_BEHAVIOUR === 'closed' || SEND_BEHAVIOUR === 'tplfail') && args.text) {
        throw new WaWindowClosedError();
      }
      if (SEND_BEHAVIOUR === 'tplfail' && args.templateKey) {
        throw new WaError('meta said no', 'template_not_approved');
      }
      return args.templateKey ? SENDWA_TEMPLATE_OK : SENDWA_TEXT_OK;
    },
    WaWindowClosedError,
  },
};

function fakeSupabase(seed) {
  const store = JSON.parse(JSON.stringify(seed));
  function builder(table) {
    const f = [];
    const match = () => (store[table] || []).filter((r) => f.every(([c, v]) => (r[c] ?? null) === (v ?? null)));
    const b = {
      select() { return b; }, eq(c, v) { f.push([c, v]); return b; }, is(c, v) { f.push([c, v]); return b; },
      not() { return b; }, neq() { return b; }, order() { return b; }, limit() { return b; },
      range() { return b; }, in() { return b; }, gte() { return b; }, lte() { return b; },
      maybeSingle() { return Promise.resolve({ data: match()[0] || null, error: null }); },
      single() { const m = match(); return Promise.resolve(m.length === 1 ? { data: m[0], error: null } : { data: null, error: { message: 'x' } }); },
      then(r) { return Promise.resolve({ data: match(), error: null }).then(r); },
      insert(p) {
        const row = Object.assign({ id: `${table}-1` }, p);
        store[table] = (store[table] || []).concat([row]);
        const ret = { select() { return ret; }, single: () => Promise.resolve({ data: row, error: null }),
                      maybeSingle: () => Promise.resolve({ data: row, error: null }),
                      then(r) { return Promise.resolve({ data: [row], error: null }).then(r); } };
        return ret;
      },
      update() { const u = { eq() { return u; }, is() { return u; }, select() { return u; },
                             maybeSingle: () => Promise.resolve({ data: null, error: null }),
                             single: () => Promise.resolve({ data: null, error: null }),
                             then(r) { return Promise.resolve({ data: [], error: null }).then(r); } }; return u; },
      upsert() { return Promise.resolve({ data: null, error: null }); },
      delete() { return { eq: () => Promise.resolve({ data: null, error: null }) }; },
    };
    return b;
  }
  return { from: builder };
}

const VENDOR_ID = '23165e38-6510-4639-ab6a-9f35bab93742';
const seed = () => ({
  vendors: [{ id: VENDOR_ID, business_name: 'Dev Roy Photography', user_id: 'u-1',
              category: 'photographer', city: 'Delhi', tier: 'basic',
              discover_eligible: true, discover_paused: false, routing_handle: 'devroy',
              base_fee_min: null, base_fee_max: null }],
  users: [{ id: 'u-1', phone: '+919888294440', name: 'Dev' }],
  leads: [], clients: [], couples: [], couple_enquiries: [], enquiry_taps: [],
  conversations: [], messages: [], invoices: [], events: [], notes: [], engagements: [],
});

async function driveEnquiry() {
  const app = express();
  app.use(express.json());
  app.locals.supabase = fakeSupabase(seed());
  delete require.cache[require.resolve(P('src/api/couple/enquire.js'))];
  app.use('/enquire', require(P('src/api/couple/enquire.js')));
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  try {
    await fetch(`http://127.0.0.1:${port}/enquire`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: VENDOR_ID, bride_name: 'Sarah',
                             bride_phone: '+919625759924', wedding_date: '2027-02-14',
                             city: 'Delhi', budget_band: '1500000', budget_floor: '1000000' }),
    });
  } finally { await new Promise((r) => server.close(r)); }
}

await t('3.1', 'the IN-WINDOW enquiry send emits its line', async () => {
  SEND_BEHAVIOUR = 'ok';
  const { lines } = await capture(() => driveEnquiry());
  const w = waLines(lines).filter((l) => l.text.includes('site=enquire:inwindow'));
  assert.strictEqual(w.length, 1, `expected 1 in-window line, got ${w.length}`);
  assert.ok(w[0].text.includes('SENT'), w[0].text);
  assert.ok(w[0].text.includes('wamid=wamid.TEXT123'), w[0].text);
});

await t('3.2', 'THE 26 AUG LINE: a closed window falls to the template and the template LOGS', async () => {
  // The exact production shape of the evening that motivated this sitting —
  // in-window refused, template fired. Both legs must appear.
  SEND_BEHAVIOUR = 'closed';
  const { lines } = await capture(() => driveEnquiry());
  const refused = waLines(lines).filter((l) => l.text.includes('site=enquire:inwindow') && l.text.includes('REFUSED'));
  assert.strictEqual(refused.length, 1, 'the in-window refusal was not logged');
  assert.ok(refused[0].text.includes('err=window_closed'), refused[0].text);
  const oow = waLines(lines).filter((l) => l.text.includes('site=enquire:oow'));
  assert.strictEqual(oow.length, 1, `expected 1 oow line, got ${oow.length}`);
  assert.ok(oow[0].text.includes('key=lead_alert_basic'),
    `the basic-tier template was not named — F-16.35's watch depends on this: ${oow[0].text}`);
});

await t('3.3', 'AND WHEN META REFUSES THE TEMPLATE, the code reaches the log', async () => {
  // This is the case that produced three silent same-second failures on 26 Aug
  // and an evening of inference. It is now one grep.
  SEND_BEHAVIOUR = 'tplfail';
  const { lines } = await capture(() => driveEnquiry());
  const oow = waLines(lines).filter((l) => l.text.includes('site=enquire:oow'));
  assert.strictEqual(oow.length, 1);
  assert.ok(oow[0].text.includes('REFUSED'), oow[0].text);
  assert.ok(oow[0].text.includes('err=template_not_approved'),
    `the refusal code did not reach the line: ${oow[0].text}`);
});

await t('3.4', 'the door emits ONE line per send — never a double', async () => {
  SEND_BEHAVIOUR = 'ok';
  const { lines } = await capture(() => driveEnquiry());
  assert.strictEqual(waLines(lines).length, 1, 'a send produced more than one keyed line');
});

// ══════════════════════════════════════════════════════════════════════════
console.log('\n§4 · R-37.50 — RETIRE-BY-ABSORPTION, AND R-37.52\'s NAMED COST');

await t('4.1', 'the absorbed line carries BOTH searches — old tag inside the new one', async () => {
  // The founder's muscle-memory search is `[enquiry:oow]`. The new one is
  // `[wa:vendor]`. R-37.50 says one line answers both, with no double-emission.
  const { lines } = capture(() => logWaSend('vendor', {
    site: 'enquiry:oow', mode: 'template', templateKey: 'enquiry_alert_vendor',
    to: '+919888294440', out: SENDWA_TEMPLATE_OK, ctx: 'c1',
  }));
  const s = lines[0].text;
  assert.ok(s.includes('[wa:vendor]'), s);
  assert.ok(s.includes('enquiry:oow'), `the old search token was lost: ${s}`);
  assert.strictEqual(lines.length, 1, 'the absorption double-emitted');
});

await t('4.2', 'SITE 7 IS DELIBERATELY UNINSTRUMENTED [R-37.52] — the named cost, pinned', async () => {
  // enquiryAlert's IN-WINDOW send calls the raw transport, whose success return
  // carries `sid`, not a wamid. Wiring logWaSend there would publish blanks on
  // genuine successes. This cell exists so a later reader who "completes the
  // set" discovers the reason before the telemetry starts lying — and so the
  // gap is a recorded decision, not a silence.
  const rawTransportReturn = { sent: true, sid: 'SM123' };   // sendWhatsApp's shape
  const v = readSend('sendwa_freeform', rawTransportReturn);
  assert.strictEqual(v.id, null,
    'the raw transport return now yields an id through the sendWa contract — F-05.92\'s premise has changed and R-37.52 must be re-read');
});


// ══════════════════════════════════════════════════════════════════════════
console.log('\n§5 · THE CRON SITES EXECUTE TOO — the coverage gap N12 exposed');
// ── WHY THIS SECTION EXISTS ─────────────────────────────────────────────────
// The sitting wired SIX sites and, until this section, PROVED ONE. Mutation
// N12 (silence cron's template refusal) came back INERT — not because the
// wiring was sound but because nothing executed it. Four of six sites were
// wired-but-unwitnessed, which is precisely the class F-16.29 was minted for,
// committed inside the sitting that cures it. `routeBriefing` takes injectable
// deps, so the seam was there the whole time.

const { routeBriefing } = require(P('src/cron'));

async function driveCron(behaviour) {
  const vendor = { id: VENDOR_ID, business_name: 'Dev Roy Photography' };
  const user   = { phone: '+919888294440', name: 'Dev' };
  return capture(() => routeBriefing({ vendor, user, supabase: fakeSupabase(seed()) }, {
    isNudgeOptedOut: async () => false,
    // The briefing's contract is DERIVED from routeBriefing, not guessed: it
    // gates on `result.send` and branches the OOW leg on
    // `result.reason === 'window_closed'`. The first draft returned `{ ok }`,
    // which no branch reads, so the door skipped both sends and three cells
    // reddened against a path that never ran.
    buildBriefing: async () => (behaviour === 'closed' || behaviour === 'tplfail'
      ? { send: false, reason: 'window_closed' }
      : { send: true, message: 'good morning' }),
    sendWa: async (args) => {
      if (behaviour === 'textfail' && args.text) throw new WaError('x', 'opted_out');
      if (behaviour === 'tplfail' && args.templateKey) throw new WaError('x', 'template_not_approved');
      return args.templateKey ? SENDWA_TEMPLATE_OK : SENDWA_TEXT_OK;
    },
  }));
}

await t('5.1', 'the cron IN-WINDOW nudge emits its line', async () => {
  const { lines } = await driveCron('ok');
  const w = waLines(lines).filter((l) => l.text.includes('site=cron:morning') && !l.text.includes(':oow'));
  assert.strictEqual(w.length, 1, `expected 1 line, got ${w.length}`);
  assert.ok(w[0].text.includes('SENT') && w[0].text.includes('wamid=wamid.TEXT123'), w[0].text);
});

await t('5.2', 'a cron nudge REFUSAL is logged, not merely routed', async () => {
  // `opted_out` and `nudge_opted_out` were already ROUTED into a return value.
  // Routing is not recording: before this line, the other seven typed codes
  // left no trace at all.
  const { lines } = await driveCron('textfail');
  const w = waLines(lines).filter((l) => l.text.includes('site=cron:morning'));
  assert.strictEqual(w.length, 1);
  assert.ok(w[0].text.includes('REFUSED') && w[0].text.includes('err=opted_out'), w[0].text);
});

await t('5.3', 'the cron OOW TEMPLATE logs on success', async () => {
  const { lines } = await driveCron('closed');
  const w = waLines(lines).filter((l) => l.text.includes('site=cron:morning:oow'));
  assert.strictEqual(w.length, 1, `expected 1 oow line, got ${w.length}`);
  assert.ok(w[0].text.includes('key=morning_nudge_vendor'), w[0].text);
});

await t('5.4', 'and on REFUSAL — the cell N12 found missing', async () => {
  const { lines } = await driveCron('tplfail');
  const w = waLines(lines).filter((l) => l.text.includes('site=cron:morning:oow'));
  assert.strictEqual(w.length, 1);
  assert.ok(w[0].text.includes('REFUSED') && w[0].text.includes('err=template_not_approved'), w[0].text);
});


// ══════════════════════════════════════════════════════════════════════════
console.log('\n§6 · THE RECEIPT SAYS WHY — M-TELEMETRY-R · R-37.56/.57/.58/.59');
// EXECUTED. Every cell drives the REAL `witnessStatusMatch` against a recording
// supabase and reads the console output back. Nothing greps source.
//
// This is the half that was missing on 26 Aug: three receipts came back
// `failed`, and `errors[]` — which `extractStatuses` had ALREADY put on the
// status object — was read by nobody.

const { witnessStatusMatch } = require(P('src/lib/vendor/relayStatus'));

// Meta's real payload shape for a failed marketing send. Path derived at
// read-first: body.entry[].changes[].value.statuses[] -> { id, status, errors[] }.
const WAMID = 'wamid.HBgMOTE5ODg4Mjk0NDQwFQIAERgSMzhCOUI0NkNGRjBCQUMzNzQzAA==';
const failedStatus = (errors) => ({ id: WAMID, status: 'failed', recipient: '919888294440', errors });
const META_131049 = [{ code: 131049, title: 'This message was not delivered to maintain healthy ecosystem engagement.' }];

function receiptSupabase(rows) {
  return { from: () => ({
    update() {
      const u = {
        eq() { return u; }, is() { return u; },
        select() { return Promise.resolve({ data: rows, error: null }); },
      };
      return u;
    },
  }) };
}
const rcpt = (lines) => lines.filter((l) => /\[wa:receipt\]/.test(l.text));

await t('6.1', 'A FAILED RECEIPT CARRIES META\'S CODE AND TITLE — the 26 Aug line', async () => {
  const { lines } = await capture(() =>
    witnessStatusMatch(receiptSupabase([]), failedStatus(META_131049)));
  const r = rcpt(lines);
  assert.strictEqual(r.length, 1, `expected 1 receipt line, got ${r.length}`);
  assert.ok(r[0].text.includes('err=131049'), `the code did not reach the line: ${r[0].text}`);
  assert.ok(r[0].text.includes('err_title=This_message_was_not_delivered'),
    `the title did not reach the line: ${r[0].text}`);
});

await t('6.2', 'R-37.58: a SUCCESS carries NO err field — grep err= returns only failures', async () => {
  const { lines } = await capture(() =>
    witnessStatusMatch(receiptSupabase([]), { id: WAMID, status: 'sent', errors: [] }));
  const s0 = rcpt(lines)[0].text;
  assert.ok(!/err=/.test(s0), `a success carried an err field: ${s0}`);
  assert.ok(!/err_title=/.test(s0), s0);
});

await t('6.3', 'R-37.56: the wamid is FULL and byte-identical to the send line\'s', async () => {
  // The whole point: ONE grep on a wamid returns the send AND its receipt.
  // Both lines are produced here and the same substring must find both.
  const { lines: sendLines } = capture(() => logWaSend('vendor', {
    site: 'enquire:oow', mode: 'template', templateKey: 'lead_alert_basic',
    to: '+919888294440',
    out: { sent: true, mode: 'template', result: { ok: true, wamid: WAMID } },
  }));
  const { lines: rcptLines } = await capture(() =>
    witnessStatusMatch(receiptSupabase([]), failedStatus(META_131049)));
  const both = [sendLines[0].text, rcpt(rcptLines)[0].text];
  for (const line of both) {
    assert.ok(line.includes(`wamid=${WAMID}`),
      `the full wamid is not in this line, so one grep cannot find both: ${line}`);
  }
  assert.strictEqual(both.filter((l) => l.includes(WAMID)).length, 2,
    'the founder\'s two-line evening is broken');
});

await t('6.4', 'R-37.57: `home=none` fires on an ORPHAN — matched=0 stops reading as nothing', async () => {
  const { lines } = await capture(() =>
    witnessStatusMatch(receiptSupabase([]), { id: WAMID, status: 'sent', errors: [] }));
  const s0 = rcpt(lines)[0].text;
  assert.ok(s0.includes('home=none'), `an orphan receipt did not say so: ${s0}`);
  assert.ok(s0.includes('matched=0'), s0);
});

await t('6.5', 'and a MATCHED receipt says home=messages, never home=none', async () => {
  const { lines } = await capture(() => witnessStatusMatch(
    receiptSupabase([{ id: 'm1', conversation_id: 'c1', sent_by: 'vendor_relay',
                       body: 'x', twilio_sid: WAMID, delivery_status: 'delivered' }]),
    { id: WAMID, status: 'delivered', errors: [] }));
  const s0 = rcpt(lines)[0].text;
  assert.ok(s0.includes('home=messages') && s0.includes('matched=1'), s0);
  assert.ok(!s0.includes('home=none'), `a matched receipt claimed to be an orphan: ${s0}`);
});

await t('6.6', 'R-37.58 F4: several errors name the first AND declare the count', async () => {
  const { lines } = await capture(() => witnessStatusMatch(receiptSupabase([]),
    failedStatus([{ code: 131049, title: 'first' }, { code: 131050, title: 'second' }])));
  const s0 = rcpt(lines)[0].text;
  assert.ok(s0.includes('err=131049') && s0.includes('err_count=2'),
    `a second error was dropped silently: ${s0}`);
});

await t('6.7', 'a single error declares NO count — quiet on the common case', async () => {
  const { lines } = await capture(() => witnessStatusMatch(receiptSupabase([]), failedStatus(META_131049)));
  assert.ok(!/err_count=/.test(rcpt(lines)[0].text), rcpt(lines)[0].text);
});

await t('6.8', 'R-37.57: ABSORPTION — the old search token rides INSIDE the new line', async () => {
  // The founder's muscle memory is `webhook:meta`. One line answers both greps;
  // a second line would be the double-emission R-37.57 refused.
  const { lines } = await capture(() => witnessStatusMatch(receiptSupabase([]), failedStatus(META_131049)));
  const all = lines.filter((l) => /wa:receipt|webhook:meta/.test(l.text));
  assert.strictEqual(all.length, 1, `double-emission: ${all.length} lines`);
  assert.ok(all[0].text.includes('[wa:receipt]') && all[0].text.includes('webhook:meta'), all[0].text);
});

await t('6.9', 'every field is grep-shaped — the title survives WHOLE as ONE token', async () => {
  // [AMENDED BEFORE DELIVERY] The first draft split on whitespace and asserted
  // the `err_title=` TOKEN had no space in it — which is true by construction of
  // splitting, so the cell could not fail on its own subject. Mutation R7
  // (stop underscoring the title) bit 6.1 and left this one GREEN: a cell named
  // for grep-shape that could not detect an unshaped line. Re-founded on the
  // fact that actually matters — the WHOLE title must arrive as one token, so a
  // reader grepping `err_title=` gets the reason and not its first word.
  const { lines } = await capture(() => witnessStatusMatch(receiptSupabase([]), failedStatus(META_131049)));
  const s0 = rcpt(lines)[0].text;
  const errTok = s0.split(/\s+/).find((tok) => tok.startsWith('err_title='));
  assert.ok(errTok, `no err_title token: ${s0}`);
  const words = META_131049[0].title.trim().split(/\s+/).length;
  assert.strictEqual(errTok.split('_').length >= words, true,
    `the title was truncated at its first space — only "${errTok}" survived: ${s0}`);
  assert.ok(errTok.includes('healthy_ecosystem_engagement'),
    `the title's tail did not survive as part of the token: ${errTok}`);
});

await t('6.12', 'THE FOURTH OUTCOME SHAPE — SID IS NOT UNIQUE keeps its information', async () => {
  // R-37.57 required all FOUR outcome shapes survive the re-key. Nothing
  // covered this one until mutation R8 came back inert by dropping its old
  // token unnoticed. Ambiguity must be visible: a duplicate sid means the
  // estate wrote the same wamid twice, and no receipt may speak off it.
  const dup = [{ id: 'm1', sent_by: 'vendor_relay', twilio_sid: WAMID },
               { id: 'm2', sent_by: 'vendor_relay', twilio_sid: WAMID }];
  const { lines, value } = await capture(() =>
    witnessStatusMatch(receiptSupabase(dup), { id: WAMID, status: 'delivered', errors: [] }));
  const r = rcpt(lines);
  assert.strictEqual(r.length, 1, `expected 1 line, got ${r.length}`);
  assert.ok(r[0].text.includes('webhook:meta'), `the old search token was dropped: ${r[0].text}`);
  assert.ok(r[0].text.includes('home=ambiguous') && r[0].text.includes('matched=2'), r[0].text);
  assert.ok(r[0].text.includes('SID IS NOT UNIQUE'), r[0].text);
  assert.strictEqual(value.row, null, 'an ambiguous match handed a row to the receipt gate');
});

await t('6.10', 'the receipt path NEVER THROWS — a status must not cost Meta\'s retry budget', async () => {
  const exploding = { from: () => { throw new Error('db gone'); } };
  const { value } = await capture(() => witnessStatusMatch(exploding, failedStatus(META_131049)));
  assert.strictEqual(value.matched, 0);
  assert.ok(String(value.reason).startsWith('threw:'), JSON.stringify(value));
});

await t('6.11', 'the RETURN CONTRACT is byte-unmoved — the receipt half still gates on it', async () => {
  // applyStatusEvent gates №14/№15 on `matched === 1` and `row`. This sitting is
  // log-only and must not have moved either.
  const orphan = await witnessStatusMatch(receiptSupabase([]), { id: WAMID, status: 'sent', errors: [] });
  assert.deepStrictEqual(
    { matched: orphan.matched, row: orphan.row, reason: orphan.reason },
    { matched: 0, row: null, reason: 'no_row_for_sid' });
  const hit = await witnessStatusMatch(
    receiptSupabase([{ id: 'm1', sent_by: 'vendor_relay', twilio_sid: WAMID }]),
    { id: WAMID, status: 'read', errors: [] });
  assert.strictEqual(hit.matched, 1);
  assert.strictEqual(hit.reason, 'matched');
  assert.strictEqual(hit.row.sent_by, 'vendor_relay');
});

console.log(`\n${'═'.repeat(66)}`);
console.log(`b39_telemetry_bench: ${pass}/${pass + fail}`);
if (fail) { console.log('REDS: ' + reds.join(', ')); }
console.log('═'.repeat(66));
process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('BENCH THREW:', e); process.exit(1); });
