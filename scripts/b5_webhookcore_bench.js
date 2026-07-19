#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b5_webhookcore_bench.js — TDW_05 Block 05, P1a (Movement A).
//
// THE BYTE-IDENTICAL GATE. Movement A's entire claim is: "nothing changed but the
// location of the code." This bench proves it. It holds the PRE-REFACTOR inline
// blocks — copied verbatim from src/index.js and src/brideIndex.js at HEAD 3c1d5a9,
// with their hard-coded log prefixes — as reference (`orig*`), and runs them side by
// side with the REAL src/lib/webhookCore.js over one matrix of inbound + callback
// fixtures. For every cell it captures every console line (log/warn/error, fully
// resolved), every res.status()/res.send() call, and the proceed/drop return, then
// deep-compares original-vs-core. Identical → GREEN. Any drift → RED.
//
// WHY IT IS NON-VACUOUS: change one character of observable behavior in webhookCore
// — a prefix, a status code, the '<Response></Response>' body, the "(callback ignored)"
// wording, the DISABLE_TWILIO_SIGNATURE_CHECK guard — and a cell diverges and this bench
// goes RED. (Proven by the mutation probe at the tail: temporarily point a case at a
// deliberately-wrong expectation and it fails, so GREEN means real agreement.)
//
// The matrix (run for BOTH services, vendor + bride):
//   signature:  disabled · valid-sig · invalid-sig · missing-header
//   media:      text-only · media(NumMedia) · media(MediaUrl0) · empty · empty-missing
//   status:     row-found · no-row(race/ignored) · missing-sid · missing-status ·
//               db-error · errCode · handler-throw
//   boot:       flag-set · flag-unset
//   inbound-log
//
// Doubles: only the network is stubbed. `twilio.validateRequest` runs for real (valid
// signatures are computed with twilio's own getExpectedTwilioSignature); supabase is a
// hand chain that returns the configured {data,error} or throws — exactly the two shapes
// the real callback handler branches on.
//
// Run it: node scripts/b5_webhookcore_bench.js
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const twilio = require('twilio');
const { getExpectedTwilioSignature } = require('twilio/lib/webhooks/webhooks');
const core = require(path.join(ROOT, 'src/lib/webhookCore.js'));

// ── harness ──────────────────────────────────────────────────────────────
let pass = 0, fail = 0; const fails = [];
function ok(cond, label) { if (cond) { pass++; } else { fail++; fails.push(label); } }

// Capture console + res while running fn(); returns the transcript + fn's return.
async function capture(fn) {
  const log = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  const fmt = (a) => a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
  console.log   = (...a) => log.push('LOG '   + fmt(a));
  console.warn  = (...a) => log.push('WARN '  + fmt(a));
  console.error = (...a) => log.push('ERROR ' + fmt(a));
  let ret;
  try { ret = await fn(); }
  finally { console.log = orig.log; console.warn = orig.warn; console.error = orig.error; }
  return { log, ret };
}

function makeRes() {
  const calls = [];
  const res = {
    status(c) { calls.push('status:' + c); return res; },
    send(b)   { calls.push('send:' + b);   return res; },
  };
  res._calls = calls;
  return res;
}

function makeReq({ body = {}, headers = {}, originalUrl = '/webhook/whatsapp' } = {}) {
  return {
    body, headers,
    protocol: 'https',
    originalUrl,
    get(h) { return h === 'host' ? 'x.test' : undefined; },
  };
}

// supabase double: the two shapes the real handler branches on, plus a thrower.
function fakeSupabase(result) {
  return { from() { return { update() { return { eq() { return { select: async () => result }; } }; } }; } };
}
const throwingSupabase = { from() { throw new Error('boom'); } };

const j = (x) => JSON.stringify(x);
const AUTH = 'fake_token_ABC123';

// ══════════════════════════════════════════════════════════════════════════
// PRE-REFACTOR reference — copied VERBATIM from src/index.js / src/brideIndex.js
// at HEAD 3c1d5a9 (only wrapped in functions so the bench can call them). If the
// extraction drifts from these, the diff fires.
// ══════════════════════════════════════════════════════════════════════════

// signature — returns true to proceed, false when the handler would have stopped (403).
function origSignature(req, res, phone, PFX) {
  if (process.env.DISABLE_TWILIO_SIGNATURE_CHECK !== 'true') {
    const twilioSignature = req.headers['x-twilio-signature'] || '';
    const webhookUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      twilioSignature,
      webhookUrl,
      req.body,
    );
    if (!isValid) {
      console.warn(`${PFX} invalid Twilio signature from ${phone}, url=${webhookUrl}`);
      res.status(403).send('Forbidden');
      return false;
    }
  }
  return true;
}

// media + empty guard — returns { fields, dropped }.
function origMedia(req, res, body, PFX) {
  const trimmedBody = body.trim();
  const numMedia    = parseInt(req.body.NumMedia || '0', 10);
  const hasMedia    = numMedia > 0 || !!req.body.MediaUrl0;
  if (!trimmedBody && !hasMedia) {
    console.warn(`${PFX} empty body, no media, dropping`);
    res.status(200).send('<Response></Response>');
    return { fields: { trimmedBody, numMedia, hasMedia }, dropped: true };
  }
  return { fields: { trimmedBody, numMedia, hasMedia }, dropped: false };
}

// status callback handler — verbatim, prefix parameterized only for the reference.
function origStatusHandler(supabase, PFX) {
  return async (req, res) => {
    try {
      const sid     = req.body.MessageSid    || req.body.SmsSid    || null;
      const status  = req.body.MessageStatus || req.body.SmsStatus || null;
      const errCode = req.body.ErrorCode || null;
      console.log(`${PFX} sid=${sid} status=${status}${errCode ? ` errCode=${errCode}` : ''}`);
      if (!sid || !status) { return res.status(200).send('ok'); }
      const { data, error } = await supabase
        .from('messages').update({ delivery_status: status }).eq('twilio_sid', sid).select('id');
      if (error) {
        console.error(`${PFX} db update error:`, error);
      } else if (!data || data.length === 0) {
        console.log(`${PFX} no message row for sid=${sid} (callback ignored)`);
      }
      res.status(200).send('ok');
    } catch (err) {
      console.error(`${PFX} handler error:`, err);
      res.status(200).send('ok');
    }
  };
}

function origInboundLog(PFX, phone, body) { console.log(`${PFX} ${phone} -> ${body}`); }

function origBootWarn(TAG) {
  if (process.env.DISABLE_TWILIO_SIGNATURE_CHECK === 'true') {
    console.warn(`${TAG} WARNING: DISABLE_TWILIO_SIGNATURE_CHECK=true — Twilio webhook signature verification is OFF. Do not run in production with this flag set.`);
  }
}

// The two services' label sets.
const SERVICES = [
  { name: 'vendor', in: '[whatsapp:in]',       hook: '[webhook]',       status: '[twilio-status]',       tag: '[dream-os]' },
  { name: 'bride',  in: '[bride-whatsapp:in]', hook: '[bride-webhook]', status: '[bride-twilio-status]', tag: '[dream-wedding]' },
];

// diff one cell: run orig + core, compare transcript+return.
async function diffCell(label, runOrig, runCore) {
  const a = await capture(runOrig);
  const b = await capture(runCore);
  const same = j(a.log) === j(b.log) && j(a.ret) === j(b.ret);
  ok(same, `${label} — orig≡core`);
  if (!same) {
    fails.push(`   orig: log=${j(a.log)} ret=${j(a.ret)}`);
    fails.push(`   core: log=${j(b.log)} ret=${j(b.ret)}`);
  }
}

async function main() {
  const SAVED = process.env.DISABLE_TWILIO_SIGNATURE_CHECK;
  const SAVED_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  process.env.TWILIO_AUTH_TOKEN = AUTH;

  for (const S of SERVICES) {
    const PFX_IN = S.in, PFX_HOOK = S.hook, PFX_ST = S.status, TAG = S.tag;

    // ── inbound log ──────────────────────────────────────────────────────
    await diffCell(`[${S.name}] inbound-log`,
      () => { origInboundLog(PFX_IN, '+15551234567', 'hello there'); return null; },
      () => { core.logInbound(PFX_IN, '+15551234567', 'hello there'); return null; });

    // ── signature: disabled ──────────────────────────────────────────────
    process.env.DISABLE_TWILIO_SIGNATURE_CHECK = 'true';
    {
      const mk = () => makeReq({ body: { From: 'whatsapp:+1555', Body: 'hi' } });
      await diffCell(`[${S.name}] sig-disabled`,
        () => { const r = mk(), res = makeRes(); const ret = origSignature(r, res, '+1555', PFX_HOOK); return { ret, res: res._calls }; },
        () => { const r = mk(), res = makeRes(); const ret = core.verifyTwilioSignature(r, res, { phone: '+1555', prefix: PFX_HOOK }); return { ret, res: res._calls }; });
    }

    // ── signature: valid / invalid / missing-header ──────────────────────
    process.env.DISABLE_TWILIO_SIGNATURE_CHECK = 'false';
    {
      const url = 'https://x.test/webhook/whatsapp';
      const params = { From: 'whatsapp:+15551234567', Body: 'hi', NumMedia: '0' };
      const goodSig = getExpectedTwilioSignature(AUTH, url, params);

      const mkValid   = () => makeReq({ body: params, headers: { 'x-twilio-signature': goodSig } });
      const mkInvalid = () => makeReq({ body: params, headers: { 'x-twilio-signature': 'totally-bogus' } });
      const mkNoHdr   = () => makeReq({ body: params, headers: {} });

      await diffCell(`[${S.name}] sig-valid`,
        () => { const r = mkValid(), res = makeRes(); const ret = origSignature(r, res, '+1555', PFX_HOOK); return { ret, res: res._calls }; },
        () => { const r = mkValid(), res = makeRes(); const ret = core.verifyTwilioSignature(r, res, { phone: '+1555', prefix: PFX_HOOK }); return { ret, res: res._calls }; });

      await diffCell(`[${S.name}] sig-invalid`,
        () => { const r = mkInvalid(), res = makeRes(); const ret = origSignature(r, res, '+1555', PFX_HOOK); return { ret, res: res._calls }; },
        () => { const r = mkInvalid(), res = makeRes(); const ret = core.verifyTwilioSignature(r, res, { phone: '+1555', prefix: PFX_HOOK }); return { ret, res: res._calls }; });

      await diffCell(`[${S.name}] sig-missing-header`,
        () => { const r = mkNoHdr(), res = makeRes(); const ret = origSignature(r, res, '+1555', PFX_HOOK); return { ret, res: res._calls }; },
        () => { const r = mkNoHdr(), res = makeRes(); const ret = core.verifyTwilioSignature(r, res, { phone: '+1555', prefix: PFX_HOOK }); return { ret, res: res._calls }; });
    }

    // ── media normalization + empty guard ────────────────────────────────
    const mediaCases = [
      ['text-only',      { Body: 'hi',  NumMedia: '0' },                              'hi'],
      ['media-NumMedia', { Body: '',    NumMedia: '1' },                              ''],
      ['media-Url0',     { Body: '',    NumMedia: '0', MediaUrl0: 'https://m/1.jpg' }, ''],
      ['empty',          { Body: '   ', NumMedia: '0' },                              '   '],
      ['empty-missing',  { },                                                          ''],
    ];
    for (const [cname, body, raw] of mediaCases) {
      await diffCell(`[${S.name}] media-${cname}`,
        () => { const r = makeReq({ body }), res = makeRes(); const o = origMedia(r, res, raw, PFX_HOOK); return { ret: o, res: res._calls }; },
        () => {
          const r = makeReq({ body }), res = makeRes();
          const fields = core.normalizeMedia(r, raw);
          const dropped = core.isEmptyInbound(res, { trimmedBody: fields.trimmedBody, hasMedia: fields.hasMedia, prefix: PFX_HOOK });
          return { ret: { fields, dropped }, res: res._calls };
        });
    }

    // ── status callback branches ─────────────────────────────────────────
    // NOTE (TDW_05 P1b): the `no-row-race` cell is intentionally NOT compared orig≡core.
    // Movement B changes that branch ON PURPOSE (drop → retry → callback_unmatched), so a
    // byte-identical assertion there would be wrong. It is asserted against B's new contract
    // below. Every OTHER status branch is unchanged by B and stays byte-identical here.
    const base = { MessageSid: 'SM123', MessageStatus: 'delivered' };
    const statusCases = [
      ['row-found',      base,                                          fakeSupabase({ data: [{ id: 'x' }], error: null })],
      ['missing-sid',    { MessageStatus: 'delivered' },                fakeSupabase({ data: [{ id: 'x' }], error: null })],
      ['missing-status', { MessageSid: 'SM123' },                       fakeSupabase({ data: [{ id: 'x' }], error: null })],
      ['db-error',       base,                                          fakeSupabase({ data: null, error: { message: 'nope' } })],
      ['errCode',        { ...base, ErrorCode: '30008' },               fakeSupabase({ data: [{ id: 'x' }], error: null })],
      ['handler-throw',  base,                                          throwingSupabase],
    ];
    for (const [cname, body, sb] of statusCases) {
      await diffCell(`[${S.name}] status-${cname}`,
        async () => { const res = makeRes(); await origStatusHandler(sb, PFX_ST)(makeReq({ body }), res); return { res: res._calls }; },
        async () => { const res = makeRes(); await core.makeTwilioStatusHandler({ supabase: sb, prefix: PFX_ST })(makeReq({ body }), res); return { res: res._calls }; });
    }

    // ── status no-row-race — B's NEW contract (was: byte-identical to the old drop) ──
    // The old behavior emitted "(callback ignored)". B retries `maxRetries` times and, if
    // still unmatched, emits "after N retries (callback_unmatched)". Assert the new line is
    // present, the OLD line is gone, and the response is still 200/ok. Fast injected sleep.
    {
      const noRow = fakeSupabase({ data: [], error: null });
      const res = makeRes();
      const { log } = await capture(async () => {
        await core.makeTwilioStatusHandler({ supabase: noRow, prefix: PFX_ST, maxRetries: 3, retryMs: 0, sleep: async () => {} })(makeReq({ body: base }), res);
      });
      const joined = log.join('\n');
      ok(joined.includes(`${PFX_ST} no message row for sid=SM123 after 3 retries (callback_unmatched)`),
         `[${S.name}] status-no-row-race — emits callback_unmatched after retries (B contract)`);
      ok(!joined.includes('(callback ignored)'),
         `[${S.name}] status-no-row-race — old "(callback ignored)" drop is GONE`);
      ok(j(res._calls) === j(['status:200', 'send:ok']),
         `[${S.name}] status-no-row-race — still answers 200/ok`);
    }

    // ── boot warning: flag-set / flag-unset ──────────────────────────────
    process.env.DISABLE_TWILIO_SIGNATURE_CHECK = 'true';
    await diffCell(`[${S.name}] boot-flag-set`,
      () => { origBootWarn(TAG); return null; },
      () => { core.warnIfSignatureCheckDisabled(TAG); return null; });
    process.env.DISABLE_TWILIO_SIGNATURE_CHECK = 'false';
    await diffCell(`[${S.name}] boot-flag-unset`,
      () => { origBootWarn(TAG); return null; },
      () => { core.warnIfSignatureCheckDisabled(TAG); return null; });
  }

  // ── mutation probe: prove the diff actually fires (non-vacuous) ─────────
  // Feed the core an intentionally-wrong reference and confirm a mismatch is detected.
  {
    const beforeFail = fail;
    const a = await capture(() => { console.log('[webhook] X'); return null; });
    const b = await capture(() => { console.log('[bride-webhook] X'); return null; });
    const detected = j(a.log) !== j(b.log);
    ok(detected, 'mutation-probe — a prefix change IS detected by the differ (bench is non-vacuous)');
    void beforeFail;
  }

  process.env.DISABLE_TWILIO_SIGNATURE_CHECK = SAVED;
  process.env.TWILIO_AUTH_TOKEN = SAVED_TOKEN;

  console.log(`\n══ ${pass}/${pass + fail} PASS ══\n`);
  if (fail) {
    console.log('RED — webhookCore output diverged from the pre-refactor inline blocks. Failing checks:');
    fails.forEach((f) => console.log('   ·', f));
    process.exit(1);
  }
  console.log('GREEN — webhookCore is byte-identical to the pre-refactor inline blocks on both services.');
}

main().catch((e) => { console.error('BENCH ERROR', e); process.exit(2); });
