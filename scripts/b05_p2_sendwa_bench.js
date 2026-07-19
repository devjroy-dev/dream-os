#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════════
// scripts/b05_p2_sendwa_bench.js — TDW_05 Block 05, P2 (Movement 2).
// Proves the template registry + sendWa gate + brideCron routing, against HEAD 6524306.
//
// THE CLAIM this bench defends:
//   • FROM is resolved by line; marketing has NO production fallback.
//   • 24h OPEN  → free-form text sends (transport invoked once, right args).
//   • 24h CLOSED (or a templateKey) → an APPROVED template is required; anything else
//     is a TYPED refusal with ZERO transport calls — never a silent drop.
//   • The Meta payload is name+language+components built from ordered vars; NO Twilio SID.
//   • brideCron routes in-window free-form (windowOpen:true, byte-identical) and out-of-
//     window to morning_nudge_bride, logging the typed refusal while the template is draft.
//
// WHY IT IS NON-VACUOUS (the mutation probe at the tail): the ONLY difference between the
// refuse case and the send case is the template's `status`. Flip morning_nudge_bride from
// 'draft' to 'approved' and the SAME call stops refusing and dispatches to the transport.
// A gate that always refused (or always sent) would fail one side of that probe.
//
// No Twilio, no Meta, no supabase, no network, no node_modules: every transport, the window
// check, and buildNudge are injected. Runnable from any working directory (Q-SP-5).
//
// Run it: node scripts/b05_p2_sendwa_bench.js
// ══════════════════════════════════════════════════════════════════════════
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const templates = require(path.join(ROOT, 'src/lib/templates.js'));
const wa        = require(path.join(ROOT, 'src/lib/sendWa.js'));
const { routeNudge } = require(path.join(ROOT, 'src/brideCron.js'));

// ── harness ─────────────────────────────────────────────────────────────────
let pass = 0, fail = 0; const fails = [];
function ok(cond, label) { if (cond) { pass++; } else { fail++; fails.push(label); } }
function eq(a, b, label) { ok(JSON.stringify(a) === JSON.stringify(b), `${label} (got ${JSON.stringify(a)})`); }
async function throwsCode(fn, code, label) {
  try { await fn(); ok(false, `${label} — expected throw ${code}, none thrown`); }
  catch (e) { ok(e && e.code === code, `${label} — expected ${code}, got ${e && e.code}: ${e && e.message}`); }
}

// ── spies ─────────────────────────────────────────────────────────────────
function spies() {
  const rec = { text: [], template: [] };
  return {
    rec,
    sendText:     async (a) => { rec.text.push(a); return { sid: 'TX_FAKE' }; },
    sendTemplate: async (a) => { rec.template.push(a); return { id: 'MT_FAKE' }; },
  };
}

(async () => {
  // ── FROM resolution ──────────────────────────────────────────────────────
  const savedEnv = {
    TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,
    VENDOR_WHATSAPP_NUMBER: process.env.VENDOR_WHATSAPP_NUMBER,
    MARKETING_WHATSAPP_NUMBER: process.env.MARKETING_WHATSAPP_NUMBER,
  };
  delete process.env.TWILIO_WHATSAPP_NUMBER;
  delete process.env.VENDOR_WHATSAPP_NUMBER;
  delete process.env.MARKETING_WHATSAPP_NUMBER;

  eq(wa.resolveFrom('bride'),  'whatsapp:+14787788550', 'FROM bride defaults to shared sender');
  eq(wa.resolveFrom('vendor'), 'whatsapp:+14787788550', 'FROM vendor falls back to shared sender');
  eq(wa.resolveFrom('marketing'), null, 'FROM marketing has NO fallback (null when unset)');
  process.env.MARKETING_WHATSAPP_NUMBER = 'whatsapp:+10000000001';
  eq(wa.resolveFrom('marketing'), 'whatsapp:+10000000001', 'FROM marketing resolves when set');

  // ── A. free-form, window OPEN → sends via text transport ──────────────────
  {
    const s = spies();
    const r = await wa.sendWa({ line: 'bride', to: '+91999', text: 'hi', windowOpen: true }, s);
    eq(r.mode, 'text', 'A free-form open → mode text');
    ok(s.rec.text.length === 1 && s.rec.template.length === 0, 'A text transport hit once, template zero');
    eq(s.rec.text[0].from, 'whatsapp:+14787788550', 'A text FROM = bride sender');
    eq(s.rec.text[0].to, '+91999', 'A text TO passed through');
    eq(s.rec.text[0].text, 'hi', 'A text body passed through');
  }

  // ── B. free-form, window CLOSED → typed refusal, ZERO sends ───────────────
  {
    const s = spies();
    await throwsCode(() => wa.sendWa({ line: 'bride', to: '+91999', text: 'hi', windowOpen: false }, s),
      'window_closed', 'B free-form closed → WaWindowClosedError');
    ok(s.rec.text.length === 0 && s.rec.template.length === 0, 'B nothing sent on closed window (no silent drop)');
  }

  // ── C. free-form, window UNDETERMINED (no signal) → refuse, don't guess ───
  {
    const s = spies();
    await throwsCode(() => wa.sendWa({ line: 'bride', to: '+91999', text: 'hi' }, s),
      'window_undetermined', 'C no window signal → WaWindowUndeterminedError');
    ok(s.rec.text.length === 0, 'C nothing sent when window unknown');
  }

  // ── D. template APPROVED → dispatch with correct Meta payload ─────────────
  {
    const key = 'morning_nudge_bride';
    const saved = templates.TEMPLATES[key].status;
    templates.TEMPLATES[key].status = 'approved';           // fixture flip
    const s = spies();
    const r = await wa.sendWa({ line: 'bride', to: '+91999', templateKey: key, vars: ['Aisha', 'summary line'] }, s);
    eq(r.mode, 'template', 'D approved template → mode template');
    ok(s.rec.template.length === 1 && s.rec.text.length === 0, 'D template transport hit once, text zero');
    const p = s.rec.template[0].payload;
    eq(p.name, 'morning_nudge_bride', 'D payload.name = template name');
    eq(p.language, { code: 'en' }, 'D payload.language = {code:en}');
    eq(p.components, [{ type: 'body', parameters: [
      { type: 'text', text: 'Aisha' }, { type: 'text', text: 'summary line' },
    ] }], 'D payload.components built from ordered vars');
    ok(!('twilioTemplateSid' in s.rec.template[0]) && !('twilioTemplateSid' in p), 'D NO twilioTemplateSid anywhere');
    templates.TEMPLATES[key].status = saved;                // restore
  }

  // ── E. template DRAFT (registry status) → refuse, ZERO sends ──────────────
  {
    const s = spies();
    eq(templates.TEMPLATES.morning_nudge_bride.status, 'draft', 'E precondition: ships as draft');
    await throwsCode(() => wa.sendWa({ line: 'bride', to: '+91999', templateKey: 'morning_nudge_bride', vars: ['A', 'b'] }, s),
      'template_not_approved', 'E draft template → WaTemplateNotApprovedError');
    ok(s.rec.template.length === 0, 'E nothing sent for draft template');
  }

  // ── F. UNKNOWN template key → refuse ──────────────────────────────────────
  {
    const s = spies();
    await throwsCode(() => wa.sendWa({ line: 'vendor', to: '+91999', templateKey: 'no_such_key', vars: [] }, s),
      'template_not_approved', 'F unknown template → WaTemplateNotApprovedError');
    ok(s.rec.template.length === 0, 'F nothing sent for unknown template');
  }

  // ── G. approved template + WRONG var count → refuse ───────────────────────
  {
    const key = 'payment_reminder'; // declares [milestone, due]
    const saved = templates.TEMPLATES[key].status;
    templates.TEMPLATES[key].status = 'approved';
    const s = spies();
    await throwsCode(() => wa.sendWa({ line: 'vendor', to: '+91999', templateKey: key, vars: ['only one'] }, s),
      'template_vars', 'G var-count mismatch → WaTemplateVarsError');
    ok(s.rec.template.length === 0, 'G nothing sent on bad vars');
    templates.TEMPLATES[key].status = saved;
  }

  // ── H. marketing line with NO FROM configured → refuse ────────────────────
  {
    delete process.env.MARKETING_WHATSAPP_NUMBER;
    const key = 'marketing_opener';
    const saved = templates.TEMPLATES[key].status;
    templates.TEMPLATES[key].status = 'approved';
    const s = spies();
    await throwsCode(() => wa.sendWa({ line: 'marketing', to: '+91999', templateKey: key, vars: ['Aisha'] }, s),
      'line_not_configured', 'H marketing FROM unset → WaLineNotConfiguredError');
    ok(s.rec.template.length === 0, 'H nothing sent when marketing FROM missing (no production-line borrow)');
    templates.TEMPLATES[key].status = saved;
  }

  // ── I. bad calls ──────────────────────────────────────────────────────────
  {
    const s = spies();
    await throwsCode(() => wa.sendWa({ line: 'bride', to: '+91999', text: 'x', templateKey: 'morning_nudge_bride' }, s),
      'bad_call', 'I both text+templateKey → WaBadCallError');
    await throwsCode(() => wa.sendWa({ line: 'bride', to: '+91999' }, s),
      'bad_call', 'I neither text nor templateKey → WaBadCallError');
    ok(s.rec.text.length === 0 && s.rec.template.length === 0, 'I nothing sent on bad calls');
  }

  // ── SYNTHESIS: brideCron.routeNudge is the real caller ────────────────────
  // K1. in-window → routeNudge sends free-form windowOpen:true (byte-identical intent)
  {
    let captured = null;
    const fakeSendWa = async (a) => { captured = a; return { sent: true, mode: 'text' }; };
    const buildNudge = async () => ({ send: true, message: 'Good morning Aisha 🌸 3 days to go.' });
    const out = await routeNudge(
      { couple: { id: 'c1' }, user: { phone: '+9111', name: 'Aisha' } },
      { sendWa: fakeSendWa, buildNudge }
    );
    eq(out.action, 'sent', 'K1 in-window routeNudge → sent');
    eq(captured.line, 'bride', 'K1 routes on bride line');
    eq(captured.windowOpen, true, 'K1 passes windowOpen:true (in-window byte-identical)');
    eq(captured.text, 'Good morning Aisha 🌸 3 days to go.', 'K1 free-form body = buildNudge message');
    ok(!captured.templateKey, 'K1 no template on the in-window path');
  }

  // K2. out-of-window, template DRAFT → routeNudge refuses via REAL sendWa, logs, no send
  {
    const s = spies();
    const realSendWaWithSpies = (a) => wa.sendWa(a, s);
    const buildNudge = async () => ({ send: false, reason: 'window_closed', hours: 40 });
    const out = await routeNudge(
      { couple: { id: 'c2' }, user: { phone: '+9122', name: 'Bela' } },
      { sendWa: realSendWaWithSpies, buildNudge }
    );
    eq(out.action, 'refused', 'K2 out-of-window + draft → refused (not skipped, not sent)');
    eq(out.reason, 'template_not_approved', 'K2 refusal reason surfaced');
    ok(s.rec.template.length === 0 && s.rec.text.length === 0, 'K2 nothing left the system');
  }

  // K3. out-of-window, template APPROVED → routeNudge dispatches the template
  {
    const key = 'morning_nudge_bride';
    const saved = templates.TEMPLATES[key].status;
    templates.TEMPLATES[key].status = 'approved';
    const s = spies();
    const realSendWaWithSpies = (a) => wa.sendWa(a, s);
    const buildNudge = async () => ({ send: false, reason: 'window_closed', hours: 40 });
    const out = await routeNudge(
      { couple: { id: 'c3' }, user: { phone: '+9133', name: 'Cara' } },
      { sendWa: realSendWaWithSpies, buildNudge }
    );
    eq(out.action, 'sent', 'K3 out-of-window + approved → template sent');
    eq(out.mode, 'template', 'K3 mode template');
    ok(s.rec.template.length === 1, 'K3 template transport hit once');
    eq(s.rec.template[0].payload.name, 'morning_nudge_bride', 'K3 correct template dispatched');
    eq(s.rec.template[0].payload.components[0].parameters[0].text, 'Cara', 'K3 name var = user name');
    templates.TEMPLATES[key].status = saved;
  }

  // K4/K5. no-phone and other-reason skips
  {
    const out1 = await routeNudge({ couple: { id: 'c4' }, user: { name: 'NoPhone' } }, { sendWa: async () => {}, buildNudge: async () => ({}) });
    eq(out1.action, 'skip', 'K4 no phone → skip');
    const out2 = await routeNudge({ couple: { id: 'c5' }, user: { phone: '+9155' } },
      { sendWa: async () => { throw new Error('should not send'); }, buildNudge: async () => ({ send: false, reason: 'no_inbound_ever' }) });
    eq(out2.action, 'skip', 'K5 no_inbound_ever → skip (no send attempted)');
  }

  // ── MUTATION PROBE: same call, status is the ONLY difference ───────────────
  // Proves the approval gate is load-bearing, not a vacuous constant.
  {
    const key = 'demo_invite';
    const saved = templates.TEMPLATES[key].status;
    const call = (s) => wa.sendWa({ line: 'marketing', to: '+91999', templateKey: key, vars: ['Aisha', 'https://x/claim'] }, s);
    process.env.MARKETING_WHATSAPP_NUMBER = 'whatsapp:+10000000001';

    templates.TEMPLATES[key].status = 'draft';
    const sDraft = spies();
    await throwsCode(() => call(sDraft), 'template_not_approved', 'PROBE draft → refuses');
    ok(sDraft.rec.template.length === 0, 'PROBE draft sent nothing');

    templates.TEMPLATES[key].status = 'approved';
    const sAppr = spies();
    const r = await call(sAppr);
    ok(r.sent === true && sAppr.rec.template.length === 1, 'PROBE approved → SAME call now dispatches');

    templates.TEMPLATES[key].status = saved;
  }

  // restore env
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }

  // ── report ────────────────────────────────────────────────────────────────
  console.log(`\nb05_p2_sendwa_bench: ${pass} passed, ${fail} failed`);
  if (fail) { console.log('FAILURES:\n  - ' + fails.join('\n  - ')); process.exit(1); }
  console.log('GREEN — registry + sendWa gate + brideCron routing proven; refuse↔send hinges only on template status.');
})();
