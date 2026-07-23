// src/brideCron.js — scheduled jobs for dream-wedding bride service
// P1-3: morning nudge at 8am IST (2:30am UTC) daily
//
// Pattern mirrors src/cron.js (vendor morning briefing).
// Iterates all active, onboarded couples and sends a morning nudge via WhatsApp.
//
// Block 05 P2: sends now route through `sendWa` (the single outbound gate) instead of
// calling `sendWhatsApp` directly. In-window sends are byte-identical (free-form, bride
// FROM = TWILIO_WHATSAPP_NUMBER, same body). Out-of-window nudges route to the
// `morning_nudge_bride` template instead of being silently skipped — and while that
// template is unapproved, sendWa refuses with a typed error that is LOGGED, never dropped.
// The per-couple routing lives in `routeNudge`, exported so it can be benched with fakes
// (no node-cron, no Twilio, no Meta, no network).
//
// TODO (when scaling beyond 1 Railway instance):
// Add a cron_locks table with SELECT FOR UPDATE SKIP LOCKED
// to prevent duplicate nudges from multiple instances.

const { buildNudge } = require('./agent/brideNudge');
const { sendWa }     = require('./lib/sendWa');
const { isNudgeOptedOut } = require('./lib/nudgeOptout');   // TDW_05 P4 / F-05.22

// Out-of-window template summary var. Founder-veto copy, RATIFIED AS SHIPPED (CE-63 relay:
// "copy item 1 ratified as shipped"). Single line, so it is a valid Meta template parameter.
//
// STALE COMMENT CORRECTED (TDW_05 P4). This block previously read: "It only ever leaves the
// system once morning_nudge_bride is Meta-approved AND its registry status is flipped to
// 'approved'; until then sendWa refuses." That condition WAS MET and the sentence went stale
// — src/lib/templates.js:66 now reads `status: 'approved'`. The template is live, this var
// leaves the system on every out-of-window nudge, and a comment describing a gate that has
// already opened is worse than no comment: it tells the next reader the line is dormant.
const OUT_OF_WINDOW_SUMMARY = 'your morning update is ready — reply here to see today\'s plan';

// ── couples.nudge_sent_at — THE ADOPT DISPOSITION (0086's header, CE-63) ────────────────────
// The column was added by 0013 in 2026 for a "Session 9 silent onboarding nudge" that never
// landed, and had ZERO readers and ZERO writers estate-wide until this line. P4 adopts it as
// the bride lane's per-couple daily idempotency guard — the exact protection this file's own
// TODO (multi-instance duplicate nudges) says it lacks.
//
// THE DAY BOUNDARY IS IST, deliberately: the nudge is an 08:00 IST product. A UTC day boundary
// would put the guard's midnight at 05:30 IST, three hours INSIDE the window a retry could
// legitimately fire in — the guard would then wave through the duplicate it exists to stop.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function istDayKey(d) {
  return new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10); // YYYY-MM-DD in IST
}

// true iff this couple has ALREADY been nudged during the current IST day.
function nudgedThisIstDay(nudgeSentAt, now) {
  if (!nudgeSentAt) return false;
  const stamped = new Date(nudgeSentAt);
  if (Number.isNaN(stamped.getTime())) return false;   // unparseable → treat as never nudged
  return istDayKey(stamped) === istDayKey(now);
}

// Stamp the guard AFTER a confirmed send, never before. Stamping first would mean a send that
// failed still suppressed tomorrow's... no — still suppressed TODAY's retry, which is the whole
// value of the retry. A stamp failure is logged and swallowed: the nudge already went out, and
// throwing here would surface as a per-couple error on a turn that actually succeeded.
async function stampNudgeSentAt({ supabase, coupleId, now, deps = {} }) {
  if (!supabase || !coupleId) return false;
  const _stamp = deps.stampNudgeSentAt;
  if (_stamp) return _stamp({ supabase, coupleId, now });
  try {
    await supabase.from('couples').update({ nudge_sent_at: now.toISOString() }).eq('id', coupleId);
    return true;
  } catch (e) {
    console.error(`[bride-cron:nudge] nudge_sent_at stamp failed for couple ${coupleId}:`, e && e.message);
    return false;
  }
}

// routeNudge — decide and dispatch one couple's morning nudge through sendWa.
// deps lets the bench inject a fake sendWa and buildNudge; production uses the real ones.
async function routeNudge({ couple, user, supabase }, deps = {}) {
  const _buildNudge = deps.buildNudge || buildNudge;
  const _sendWa     = deps.sendWa     || sendWa;
  const _isNudgeOptedOut = deps.isNudgeOptedOut || isNudgeOptedOut;
  const _now = deps.now || new Date();

  const phone = user?.phone;
  const name  = user?.name || 'there';
  if (!phone) return { action: 'skip', reason: 'no_phone' };

  // ── the IST-day idempotency guard (0086 ADOPT) ──────────────────────────────────────────
  // A second run inside the same IST day is a no-op. This is what makes a retry, a redeploy,
  // or a second Railway instance safe to fire without double-nudging a bride.
  if (nudgedThisIstDay(couple?.nudge_sent_at, _now)) {
    return { action: 'skip', reason: 'already_nudged_today', phone };
  }

  // ── nudge-class gate (P4, F-05.22) — BEFORE buildNudge ──────────────────────────────────
  // A bride who replied STOP MORNINGS is skipped before any work is done. LANE-SCOPED: this
  // reads the 'bride' row only, so the same number's vendor briefings are untouched (the
  // makeup-artist case the chair named at CE-63).
  if (await _isNudgeOptedOut({ supabase, phone, lane: 'bride' })) {
    return { action: 'skip', reason: 'nudge_opted_out', phone };
  }

  const result = await _buildNudge({ couple, user, supabase });

  if (result.send) {
    // In-window: buildNudge already verified the 24h window is open. Pass windowOpen:true so
    // sendWa sends free-form on the bride line — byte-identical to the pre-P2 direct send.
    // P3: supabase threaded so sendWa's cross-line opt-out gate can refuse an opted-out bride.
    // A non-opted-out phone is byte-identical; only an opted-out phone is blocked (typed refusal).
    try {
      await _sendWa({ line: 'bride', to: phone, text: result.message, windowOpen: true, supabase, nudgeClass: true });
    } catch (err) {
      if (err && (err.code === 'opted_out' || err.code === 'nudge_opted_out')) {
        return { action: 'refused', reason: err.code, phone };
      }
      throw err;
    }
    await stampNudgeSentAt({ supabase, coupleId: couple?.id, now: _now, deps });
    return { action: 'sent', mode: 'text', phone, message: result.message };
  }

  if (result.reason === 'window_closed') {
    // Out-of-window: route to the bride morning template. sendWa REQUIRES it be approved;
    // until Meta approves and the registry flips, this throws — we log it, never drop silently.
    try {
      await _sendWa({
        line: 'bride',
        to: phone,
        templateKey: 'morning_nudge_bride',
        vars: [name, OUT_OF_WINDOW_SUMMARY],
        supabase,   // P3: opt-out gate; the existing catch already surfaces a typed refusal
        nudgeClass: true,   // P4: and the nudge-class gate, lane-scoped
      });
      await stampNudgeSentAt({ supabase, coupleId: couple?.id, now: _now, deps });
      return { action: 'sent', mode: 'template', phone, key: 'morning_nudge_bride' };
    } catch (err) {
      return { action: 'refused', reason: err.code || 'template_error', message: err.message, phone };
    }
  }

  // Other reasons (no_conversation, no_inbound_ever) — skip as before.
  return { action: 'skip', reason: result.reason };
}

function startBrideCronJobs({ supabase }) {
  const cron = require('node-cron'); // lazy: keeps this module requireable without node-cron

  // ── Morning nudge — 8:00am IST = 2:30am UTC ─────────────────────
  // Fires daily. For each active, onboarded bride:
  // 1. Build the nudge message (days to wedding + today's events + dues)
  // 2. If 24h window is open, send free-form via sendWa
  // 3. If window closed, route to the morning_nudge_bride template via sendWa
  cron.schedule('30 2 * * *', async () => {
    console.log('[bride-cron:nudge] starting morning nudge run');

    try {
      // Fetch all active brides who have completed onboarding
      const { data: couples, error } = await supabase
        .from('couples')
        .select('*, users!inner(*)')
        .eq('onboarding_state', 'complete');

      if (error) {
        console.error('[bride-cron:nudge] failed to fetch couples:', error);
        return;
      }

      console.log(`[bride-cron:nudge] ${(couples || []).length} couple(s) to nudge`);

      for (const couple of (couples || [])) {
        const user  = couple.users;
        const phone = user?.phone;

        if (!phone) {
          console.log(`[bride-cron:nudge] skipping couple ${couple.id} — no phone on user record`);
          continue;
        }

        try {
          const outcome = await routeNudge({ couple, user, supabase });

          if (outcome.action === 'sent' && outcome.mode === 'text') {
            console.log(`[bride-cron:nudge] sent to ${phone} (${user?.name || 'unknown'}): "${outcome.message.slice(0, 60)}..."`);
          } else if (outcome.action === 'sent' && outcome.mode === 'template') {
            console.log(`[bride-cron:nudge] template ${outcome.key} sent to ${phone} (${user?.name || 'unknown'})`);
          } else if (outcome.action === 'refused') {
            console.log(`[bride-cron:nudge] out-of-window nudge to ${phone} refused (${outcome.reason}): ${outcome.message}`);
          } else {
            console.log(`[bride-cron:nudge] skip couple ${couple.id} (${user?.name || phone}) — ${outcome.reason}`);
          }

          // Small delay between couples to avoid rate limits at scale
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (coupleErr) {
          // Per-couple error — log and continue, never abort the whole run
          console.error(`[bride-cron:nudge] error for couple ${couple.id}:`, coupleErr.message);
        }
      }

      console.log('[bride-cron:nudge] morning nudge run complete');

    } catch (err) {
      console.error('[bride-cron:nudge] fatal error in nudge run:', err);
    }
  }, {
    timezone: 'UTC',
  });

  console.log('[bride-cron] jobs registered: morning nudge at 08:00 IST (02:30 UTC)');
}

module.exports = { startBrideCronJobs, routeNudge, nudgedThisIstDay, istDayKey };
