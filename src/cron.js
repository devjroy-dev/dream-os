// src/cron.js — scheduled jobs for dream-os
// Session 6: morning briefing at 8am IST (2:30am UTC) daily
//
// TODO (when scaling beyond 1 Railway instance):
// Add a cron_locks table with SELECT FOR UPDATE SKIP LOCKED
// to prevent duplicate briefings from multiple instances.

const cron = require('node-cron');
const { buildBriefing } = require('./agent/briefing');
const { sendWhatsApp } = require('./lib/whatsapp');

const { cleanupDraftContracts } = require('./lib/vendor/contracts');

function startCronJobs({ supabase }) {

  // ── Draft contract cleanup — 3:00am IST = 9:30pm UTC ──────────────
  cron.schedule('30 21 * * *', async () => {
    console.log('[cron:contracts] starting draft cleanup');
    try {
      const cleaned = await cleanupDraftContracts(supabase);
      console.log(`[cron:contracts] cleaned ${cleaned} stale draft contracts`);
    } catch (e) {
      console.error('[cron:contracts] cleanup error:', e.message);
    }
  });

  // ── Morning briefing — 8:00am IST = 2:30am UTC ─────────────────
  // Fires daily. For each active, onboarded vendor with briefing_enabled:
  // 1. Build the briefing message
  // 2. If 24h window is open, send via WhatsApp
  // 3. If window closed, log and skip (template support added in Session 6.5)
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

      console.log(`[cron:briefing] ${vendors.length} vendor(s) to brief`);

      for (const vendor of (vendors || [])) {
        const user = vendor.users;
        const phone = user?.phone;

        if (!phone) {
          console.log(`[cron:briefing] skipping vendor ${vendor.id} — no phone on user record`);
          continue;
        }

        try {
          const result = await buildBriefing({ vendor, user, supabase });

          if (!result.send) {
            console.log(`[cron:briefing] skip vendor ${vendor.id} (${user?.name || phone}) — ${result.reason}`);
            continue;
          }

          await sendWhatsApp(phone, result.message);
          console.log(`[cron:briefing] sent to ${phone} (${user?.name || 'unknown'}): "${result.message.slice(0, 60)}..."`);

          // Small delay between vendors to avoid Twilio rate limits at scale
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

  console.log('[cron] jobs registered: morning briefing at 08:00 IST (02:30 UTC)');
}

module.exports = { startCronJobs };
