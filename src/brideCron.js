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

// Out-of-window template summary var. Provisional founder-veto copy (single line, so it is a
// valid Meta template parameter). It only ever leaves the system once morning_nudge_bride is
// Meta-approved AND its registry status is flipped to 'approved'; until then sendWa refuses.
const OUT_OF_WINDOW_SUMMARY = 'your morning update is ready — reply here to see today\'s plan';

// routeNudge — decide and dispatch one couple's morning nudge through sendWa.
// deps lets the bench inject a fake sendWa and buildNudge; production uses the real ones.
async function routeNudge({ couple, user, supabase }, deps = {}) {
  const _buildNudge = deps.buildNudge || buildNudge;
  const _sendWa     = deps.sendWa     || sendWa;

  const phone = user?.phone;
  const name  = user?.name || 'there';
  if (!phone) return { action: 'skip', reason: 'no_phone' };

  const result = await _buildNudge({ couple, user, supabase });

  if (result.send) {
    // In-window: buildNudge already verified the 24h window is open. Pass windowOpen:true so
    // sendWa sends free-form on the bride line — byte-identical to the pre-P2 direct send.
    // P3: supabase threaded so sendWa's cross-line opt-out gate can refuse an opted-out bride.
    // A non-opted-out phone is byte-identical; only an opted-out phone is blocked (typed refusal).
    try {
      await _sendWa({ line: 'bride', to: phone, text: result.message, windowOpen: true, supabase });
    } catch (err) {
      if (err && err.code === 'opted_out') return { action: 'refused', reason: 'opted_out', phone };
      throw err;
    }
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
      });
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

module.exports = { startBrideCronJobs, routeNudge };
