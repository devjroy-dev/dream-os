// scripts/b5_webhookcore_bench.js — webhookCore's surviving Movement-A surface.
//
// ═══ RE-BASELINED AT M2b (CE-62), AND THE PRINCIPLE THAT DID IT ═══════════════════════
// This bench was born at TDW_05 P1a to prove an EXTRACTION: webhookCore's functions were
// diffed, cell by cell, against verbatim copies of the pre-refactor inline blocks that lived
// in src/index.js and src/brideIndex.js. It ran 43 cells and stayed green through Movement B.
//
// The ruling that re-baselined it (CE-62): CASES ASSERTING SURVIVING POST-SUNSET BEHAVIOUR
// STAY; CASES ASSERTING DELETED BEHAVIOUR RETIRE. Applied, the count falls out — it was not
// chosen and then justified.
//
// RETIRED (32 cells), with the reference oracles they drove:
//   · origSignature   + 4 sig cells ×2 services  =  8  — verifyTwilioSignature is deleted.
//   · origStatusHandler + 6 status cells ×2      = 12  — makeTwilioStatusHandler is deleted.
//   ·                   + 3 no-row-race ×2       =  6  — same handler; B's retry contract
//                                                        died with the endpoint it served.
//   · origBootWarn    + 2 boot cells ×2          =  4  — warnIfSignatureCheckDisabled is
//                                                        deleted: its entire content was a
//                                                        warning about Twilio signature
//                                                        verification, on three services
//                                                        including marketing, which was
//                                                        never on Twilio.
//   · origMedia       + its oracle half of 5 ×2  =  2 net (see below) — normalizeMedia read
//                                                        req.body.NumMedia / MediaUrl0, a
//                                                        Twilio form shape.
//
// STAYS (11 cells): the inbound log (transport-agnostic — it takes an already-extracted
// phone and body and prints them), the empty-payload guard (same: it decides on already-
// extracted fields, and it still guards every Meta inbound), and the mutation probe that
// keeps the differ honest. The old media cells FUSED normalizeMedia with isEmptyInbound;
// with the Twilio half deleted, the guard is asserted DIRECTLY on its four real branches —
// no oracle, because there is no second implementation left to compare against, and a
// self-comparison would be a green by construction.
//
// NOT RE-ASSERTED HERE, FILED INSTEAD: DISABLE_META_SIGNATURE_CHECK — the flag that IS live
// after the sunset — has no boot warning on any service. That is a new finding, not a
// deletion sitting's business to write.
//
// COUNT: 43 -> 11, disclosed (CE-62 F4's ledger).
'use strict';

const core = require('../src/lib/webhookCore.js');

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
  if (cond) { pass++; console.log(`  ok   ${label}`); }
  else { fail++; console.log(`  FAIL ${label}`); fails.push(label); }
}

// ── capture console output for a call ────────────────────────────────────
async function capture(fn) {
  const log = [];
  const _l = console.log, _w = console.warn, _e = console.error;
  console.log = (...a) => log.push(a.join(' '));
  console.warn = (...a) => log.push(a.join(' '));
  console.error = (...a) => log.push(a.join(' '));
  let ret;
  try { ret = await fn(); } finally { console.log = _l; console.warn = _w; console.error = _e; }
  return { log, ret };
}
const j = (x) => JSON.stringify(x);
function makeRes() {
  const _calls = [];
  return { _calls, status(c) { _calls.push(`status:${c}`); return this; }, send(b) { _calls.push(`send:${b}`); return this; } };
}

// ── the reference oracle that SURVIVES: the inbound log is not Twilio code ─
function origInboundLog(PFX, phone, body) { console.log(`${PFX} ${phone} -> ${body}`); }

const SERVICES = [
  { name: 'vendor', in: '[whatsapp:in]',       hook: '[webhook]' },
  { name: 'bride',  in: '[bride-whatsapp:in]', hook: '[bride-webhook]' },
];

async function diffCell(label, runOrig, runCore) {
  const a = await capture(runOrig);
  const b = await capture(runCore);
  const same = j(a.log) === j(b.log) && j(a.ret) === j(b.ret);
  ok(same, `${label} — orig≡core`);
  if (!same) { fails.push(`   orig: log=${j(a.log)} ret=${j(a.ret)}`); fails.push(`   core: log=${j(b.log)} ret=${j(b.ret)}`); }
}

async function main() {
  for (const S of SERVICES) {
    const PFX_IN = S.in, PFX_HOOK = S.hook;

    // ── inbound log: oracle retained (origInboundLog is transport-agnostic) ──
    await diffCell(`[${S.name}] inbound-log`,
      () => { origInboundLog(PFX_IN, '+15551234567', 'hello there'); return null; },
      () => { core.logInbound(PFX_IN, '+15551234567', 'hello there'); return null; });

    // ── empty-payload guard: asserted DIRECTLY on its four branches ──────────
    // Contract: drop (log + 200) IFF there is neither text nor media. Anything else proceeds.
    const guardCases = [
      ['text-only',      { trimmedBody: 'hi', hasMedia: false }, false],
      ['media-only',     { trimmedBody: '',   hasMedia: true  }, false],
      ['text-and-media', { trimmedBody: 'hi', hasMedia: true  }, false],
      ['neither',        { trimmedBody: '',   hasMedia: false }, true ],
    ];
    for (const [cname, fields, shouldDrop] of guardCases) {
      const res = makeRes();
      const { log } = await capture(() => core.isEmptyInbound(res, { ...fields, prefix: PFX_HOOK }));
      const dropped = core.isEmptyInbound(makeRes(), { ...fields, prefix: PFX_HOOK });
      const calls = j(res._calls);
      const good = dropped === shouldDrop
        && (shouldDrop
              ? calls === j(['status:200', 'send:<Response></Response>']) && log.join('').includes(`${PFX_HOOK} empty body, no media, dropping`)
              : calls === j([]) && log.length === 0);
      ok(good, `[${S.name}] empty-guard-${cname} — ${shouldDrop ? 'drops with 200 + log' : 'proceeds silently'}`);
    }
  }

  // ── mutation probe: prove the differ actually fires (non-vacuous) ─────────
  {
    const a = await capture(() => { console.log('[webhook] X'); return null; });
    const b = await capture(() => { console.log('[bride-webhook] X'); return null; });
    ok(j(a.log) !== j(b.log), 'mutation-probe — a prefix change IS detected by the differ (bench is non-vacuous)');
  }

  console.log(`\n══ ${pass}/${pass + fail} PASS ══\n`);
  if (fail) {
    console.log('RED — webhookCore diverged. Failing checks:');
    fails.forEach((f) => console.log('   ·', f));
    process.exit(1);
  }
  console.log('GREEN — webhookCore\'s surviving surface holds: inbound log + empty guard, non-vacuously. 32 cells RETIRED at M2b with the transport they asserted (see header).');
}

main().catch((e) => { console.error('BENCH ERROR', e); process.exit(2); });
