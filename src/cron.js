// src/cron.js — scheduled jobs for dream-os
// Session 6: morning briefing at 8am IST (2:30am UTC) daily
//
// TDW_05 P4 (CE-63) — three changes, all disclosed:
//
//   F4 — THE VENDOR BRIEFING NOW REACHES A CLOSED WINDOW. Job #2 previously logged
//   "skip … window_closed" and dropped the briefing on the floor. It now routes
//   out-of-window sends onto tdw_morning_nudge_vendor through sendWa, mirroring
//   brideCron.js:53-67. That template is APPROVED on the WABA and was NEVER CALLED by
//   any code — approved, paid for, unreachable. One cure, two improvements: coverage
//   (vendors outside the 24h window get their briefing) and the gate (the send now
//   passes the single outbound gate instead of calling the transport direct).
//
//   TIMEZONE — WALL CLOCK PRESERVED, B3(a). Jobs 1/3/4 carried no `timezone` and their
//   expressions were pre-converted to UTC, with the IST intent stranded in comments.
//   Each now declares Asia/Kolkata AND carries the rewritten expression, so the FIRING
//   INSTANTS ARE UNCHANGED and the expression finally says what the comment says:
//       job 1  '30 21 * * *' (UTC)  ->  '0 3 * * *'   (Asia/Kolkata)   21:30Z = 03:00 IST
//       job 3  '0 * * * *'   (UTC)  ->  '30 * * * *'  (Asia/Kolkata)   :00Z   = :30 IST
//       job 4  '45 21 * * *' (UTC)  ->  '15 3 * * *'  (Asia/Kolkata)   21:45Z = 03:15 IST
//   Job 2 is UNTOUCHED — it already declared UTC explicitly and 02:30Z is 08:00 IST.
//   Cadence untouched, both lanes, per the founder's standing word.
//
//   NUDGE-CLASS OPT-OUT (F-05.22). The briefing now honours nudge_optout on the
//   'vendor' lane. A vendor who replied STOP MORNINGS is skipped BEFORE buildBriefing
//   runs — the cheapest possible refusal, and no model spend on a message nobody wants.
//
// NOTE — NO vendors.briefing_sent_at. The bride lane stamps couples.nudge_sent_at as its
// per-run idempotency guard (0086's ADOPT disposition). `vendors` has NO sibling column;
// the witness (PUBLIC_SCHEMA.md) confirms it. That asymmetry is FLAGGED, NOT ASSUMED — a
// column is not invented here to make the two lanes look alike.
//
// TODO (when scaling beyond 1 Railway instance):
// Add a cron_locks table with SELECT FOR UPDATE SKIP LOCKED
// to prevent duplicate briefings from multiple instances.

const cron = require('node-cron');
const { buildBriefing } = require('./agent/briefing');
// F4: the direct `sendWhatsApp` import is GONE. It was this file's only transport call and
// the briefing now goes through sendWa, the single outbound gate. A dangling import to the
// bypassed transport is an invitation to bypass it again.
const { sendWa } = require('./lib/sendWa');
const { isNudgeOptedOut } = require('./lib/nudgeOptout');
const { getNudgeCopy } = require('./lib/nudgeCopy');

const { cleanupDraftContracts } = require('./lib/vendor/contracts');

// Out-of-window template summary var — FOUNDER-RATIFIED (CE-63 relay (1)). Single line, so
// it is a valid Meta template parameter. Lives in nudgeCopy.js under the founder's veto;
// read through the accessor so the veto pass stays one file.
const OUT_OF_WINDOW_SUMMARY = getNudgeCopy('vendor_out_of_window_summary');

// routeBriefing — decide and dispatch one vendor's morning briefing through sendWa.
// Exported so it can be benched with fakes (no node-cron, no Meta, no network) — the same
// shape brideCron.js:routeNudge established and the bench proves against.
async function routeBriefing({ vendor, user, supabase }, deps = {}) {
  const _buildBriefing   = deps.buildBriefing   || buildBriefing;
  const _sendWa          = deps.sendWa          || sendWa;
  const _isNudgeOptedOut = deps.isNudgeOptedOut || isNudgeOptedOut;

  const phone = user?.phone;
  const name  = user?.name || 'there';
  if (!phone) return { action: 'skip', reason: 'no_phone' };

  // Nudge-class gate FIRST — before any briefing is built. A paused vendor costs nothing.
  if (await _isNudgeOptedOut({ supabase, phone, lane: 'vendor' })) {
    return { action: 'skip', reason: 'nudge_opted_out', phone };
  }

  const result = await _buildBriefing({ vendor, user, supabase });

  if (result.send) {
    // In-window: free-form on the vendor line. nudgeClass is declared so sendWa's own gate
    // applies too — belt and braces, and the bench asserts both halves independently.
    try {
      await _sendWa({ line: 'vendor', to: phone, text: result.message, windowOpen: true, supabase, nudgeClass: true });
    } catch (err) {
      if (err && (err.code === 'opted_out' || err.code === 'nudge_opted_out')) {
        return { action: 'refused', reason: err.code, phone };
      }
      throw err;
    }
    return { action: 'sent', mode: 'text', phone, message: result.message };
  }

  if (result.reason === 'window_closed') {
    // F4 — THE CURE. Previously this branch logged and dropped. It now routes to the
    // approved vendor morning template, exactly as the bride lane has since P2.
    try {
      await _sendWa({
        line: 'vendor',
        to: phone,
        templateKey: 'morning_nudge_vendor',
        vars: [name, OUT_OF_WINDOW_SUMMARY],
        supabase,
        nudgeClass: true,
      });
      return { action: 'sent', mode: 'template', phone, key: 'morning_nudge_vendor' };
    } catch (err) {
      return { action: 'refused', reason: err.code || 'template_error', message: err.message, phone };
    }
  }

  // Other reasons (no_conversation, no_inbound_ever, briefing disabled) — skip as before.
  return { action: 'skip', reason: result.reason };
}

function startCronJobs({ supabase }) {

  // ── Draft contract cleanup — 3:00am IST ───────────────────────────
  // Was '30 21 * * *' with no timezone (21:30 UTC). 03:00 Asia/Kolkata IS 21:30 UTC —
  // the same instant, now said honestly in the expression instead of only the comment.
  cron.schedule('0 3 * * *', async () => {
    console.log('[cron:contracts] starting draft cleanup');
    try {
      const cleaned = await cleanupDraftContracts(supabase);
      console.log(`[cron:contracts] cleaned ${cleaned} stale draft contracts`);
    } catch (e) {
      console.error('[cron:contracts] cleanup error:', e.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // ── Morning briefing — 8:00am IST = 2:30am UTC ─────────────────
  // Fires daily. For each active, onboarded vendor with briefing_enabled:
  // 1. Skip if the vendor paused morning messages (nudge_optout, vendor lane)
  // 2. Build the briefing message
  // 3. If the 24h window is open, send free-form via sendWa
  // 4. If the window is closed, route to morning_nudge_vendor via sendWa (F4)
  cron.schedule('30 2 * * *', async () => {
    console.log('[cron:briefing] starting morning briefing run');

    try {
      // Fetch all active vendors who have completed onboarding and have briefing enabled
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*, users(*)')
        .eq('onboarding_state', 'complete')
        .eq('briefing_enabled', true)
        .eq('status', 'active');

      if (error) {
        console.error('[cron:briefing] failed to fetch vendors:', error);
        return;
      }

      console.log(`[cron:briefing] ${(vendors || []).length} vendor(s) to brief`);

      for (const vendor of (vendors || [])) {
        const user = vendor.users;
        const phone = user?.phone;

        if (!phone) {
          console.log(`[cron:briefing] skipping vendor ${vendor.id} — no phone on user record`);
          continue;
        }

        try {
          const outcome = await routeBriefing({ vendor, user, supabase });

          if (outcome.action === 'sent' && outcome.mode === 'text') {
            console.log(`[cron:briefing] sent to ${phone} (${user?.name || 'unknown'}): "${outcome.message.slice(0, 60)}..."`);
          } else if (outcome.action === 'sent' && outcome.mode === 'template') {
            console.log(`[cron:briefing] template ${outcome.key} sent to ${phone} (${user?.name || 'unknown'})`);
          } else if (outcome.action === 'refused') {
            console.log(`[cron:briefing] briefing to ${phone} refused (${outcome.reason}): ${outcome.message || ''}`);
          } else {
            console.log(`[cron:briefing] skip vendor ${vendor.id} (${user?.name || phone}) — ${outcome.reason}`);
          }

          // Small delay between vendors to avoid rate limits at scale
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (vendorErr) {
          // Per-vendor error — log and continue to next vendor, never abort the whole run
          console.error(`[cron:briefing] error for vendor ${vendor.id}:`, vendorErr.message);
        }
      }

      console.log('[cron:briefing] morning briefing run complete');

    } catch (err) {
      console.error('[cron:briefing] fatal error in briefing run:', err);
    }
  }, {
    timezone: 'UTC',
  });

  // ── Demo expiry — hourly ──────────────────────────────────────────
  // Was '0 * * * *' with no timezone (:00 of each UTC hour). IST is +5:30, so
  // :30 Asia/Kolkata IS :00 UTC — the same instants, hourly cadence unchanged.
  cron.schedule('30 * * * *', async () => {
    try {
      const { data: expired, error } = await supabase
        .from('vendors')
        .update({ demo_active: false })
        .eq('demo_active', true)
        .not('demo_handle', 'is', null)
        .select('id, demo_handle');

      if (expired?.length > 0) {
      }
    } catch (err) {
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // ── Collab post expiry — 3:15am IST ───────────────────────────────
  // Was '45 21 * * *' with no timezone (21:45 UTC). 03:15 Asia/Kolkata IS 21:45 UTC.
  cron.schedule('15 3 * * *', async () => {
    try {
      const { data: expired } = await supabase
        .from('collab_posts')
        .update({ state: 'expired' })
        .eq('state', 'open')
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (expired && expired.length > 0) {
        console.log(`[cron:collab] expired ${expired.length} collab post(s)`);
      }
    } catch (err) {
      console.error('[cron:collab] expiry error:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

}

module.exports = { startCronJobs, routeBriefing };
