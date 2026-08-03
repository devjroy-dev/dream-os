// src/lib/demoInviteBatch.js — THE DEMO INVITE BATCH MAX, ONE HOME.
//
// TDW_08 P4 · FORK C(a), CE-ruled. Demo invites do NOT share the marketing
// lane's `marketing.daily_template_cap`. The two govern different populations:
//
//   marketing.daily_template_cap  — COLD prospects, picked oldest-first by a
//                                   scheduled sweep (runOpenerJob).
//   demo.invite_batch_max         — WARM demo rows the founder already built,
//                                   fired by hand or in one bulk run.
//
// Sharing the number would let a bulk demo run silently eat the cold-outreach
// budget, and the founder would meet the shortfall the next morning as an
// absence rather than as a refusal.
//
// ── THE NAMING RIDER IS ABSOLUTE (CE ruling on FORK C, F-08.37) ──────────────
// This is a PER-RUN BATCH SIZE. It is not called a daily cap in any identifier,
// in any comment, or in any label anywhere in this estate, because it does not
// count a day. It bounds ONE bulk-invite request and nothing else. Press the
// button twice and it admits the number twice — exactly as
// `marketing.daily_template_cap` does today, which is the honest half nobody had
// checked before P4's read-first derived it:
//
//   [F-06.85: this paragraph is conditioned on a MECHANICAL fact — that the
//    marketing number is applied WITHOUT a date predicate. Mechanism:
//    `runOpenerJob` in src/lib/prospects.js resolves the cap and applies it as
//    `.limit(limit)` over `state='cold'`, with no filter on `last_template_at`
//    and no count of sends already made today. If a date predicate or a
//    send-ledger count ever appears there, that number becomes a real daily
//    meter, this comparison stops being true, and this file must be re-read
//    before anyone reasons from it again. Filed as F-08.37.]
//
// A REAL DAILY METER IS A SEPARATE ACT and it is not this sitting's. When it is
// built, it is built for both lanes at once or it will drift again.
'use strict';

// The admin_config key. Namespaced `demo.` beside `demo.sunset_days`
// (src/lib/demoLifecycle.js's SUNSET_CONFIG_KEY), so the demo plane's operator
// numbers sit together rather than scattering across prefixes.
const DEMO_INVITE_BATCH_KEY = 'demo.invite_batch_max';

// The code default, live when the key is unseeded. Chosen to match the marketing
// lane's own default MAGNITUDE so a founder who knows one number is not
// surprised by the other — but it is a SEPARATE number in a SEPARATE key, and
// moving one never moves the other. That separation is the whole ruling.
const DEMO_INVITE_BATCH_MAX = 25;

/**
 * Read the per-run batch max. Mirrors readDailyCap's defensive shape verbatim
 * in structure (src/lib/prospects.js): `admin_config.value` is TEXT, so the
 * parse is defensive and ANY junk collapses to the code default rather than
 * throwing on a page the founder is looking at.
 *
 * ZERO is honoured, not treated as junk — a founder who sets 0 has switched the
 * bulk lane off deliberately, and silently restoring 25 would be the estate
 * overriding a stated intention.
 */
async function readDemoInviteBatchMax(supabase) {
  if (!supabase) return DEMO_INVITE_BATCH_MAX;
  try {
    const { data } = await supabase
      .from('admin_config').select('value').eq('key', DEMO_INVITE_BATCH_KEY).maybeSingle();
    if (!data || data.value == null) return DEMO_INVITE_BATCH_MAX;
    const parsed = JSON.parse(String(data.value)); // '25' → 25
    const n = Number(parsed);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEMO_INVITE_BATCH_MAX;
  } catch (_e) {
    return DEMO_INVITE_BATCH_MAX;
  }
}

module.exports = { DEMO_INVITE_BATCH_KEY, DEMO_INVITE_BATCH_MAX, readDemoInviteBatchMax };
