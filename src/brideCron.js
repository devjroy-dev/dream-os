// src/brideCron.js — scheduled jobs for dream-wedding bride service
// P1-3: morning nudge at 8am IST (2:30am UTC) daily
//
// Pattern mirrors src/cron.js (vendor morning briefing).
// Iterates all active, onboarded couples and sends a morning nudge via WhatsApp.
//
// TODO (when scaling beyond 1 Railway instance):
// Add a cron_locks table with SELECT FOR UPDATE SKIP LOCKED
// to prevent duplicate nudges from multiple instances.

const cron          = require('node-cron');
const { buildNudge } = require('./agent/brideNudge');
const { sendWhatsApp } = require('./lib/whatsapp');

function startBrideCronJobs({ supabase }) {

  // ── Morning nudge — 8:00am IST = 2:30am UTC ─────────────────────
  // Fires daily. For each active, onboarded bride:
  // 1. Build the nudge message (days to wedding + today's events + dues)
  // 2. If 24h window is open, send via WhatsApp free-form
  // 3. If window closed, skip (template dream_wedding_morning_nudge pending approval)
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
          const result = await buildNudge({ couple, user, supabase });

          if (!result.send) {
            console.log(`[bride-cron:nudge] skip couple ${couple.id} (${user?.name || phone}) — ${result.reason}`);
            continue;
          }

          await sendWhatsApp(phone, result.message);
          console.log(`[bride-cron:nudge] sent to ${phone} (${user?.name || 'unknown'}): "${result.message.slice(0, 60)}..."`);

          // Small delay between couples to avoid Twilio rate limits at scale
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

module.exports = { startBrideCronJobs };
