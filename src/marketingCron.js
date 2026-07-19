// src/marketingCron.js — scheduled jobs for the marketing (prospect) service (Block 05, P3).
//
// Mirrors src/brideCron.js's pattern: node-cron is lazily required so this module stays requireable
// without it, IST anchored via UTC offsets (IST = UTC+5:30). Job LOGIC lives in src/lib/prospects.js
// (runOpenerJob / runExpiryJob / runConversionMatchJob) so it is unit-benched independently of the
// scheduler; this file only wires the schedule.
'use strict';

const { runOpenerJob, runExpiryJob, runConversionMatchJob } = require('./lib/prospects');

// scheduleMarketingCrons({ supabase, sendWa, sendWaDeps }) → the node-cron handles (for teardown).
function scheduleMarketingCrons({ supabase, sendWa, sendWaDeps }) {
  const cron = require('node-cron'); // lazy: keeps this module requireable without node-cron
  const handles = {};

  // ── Daily opener — 10:00 IST = 04:30 UTC ─────────────────────────────────────
  handles.opener = cron.schedule('30 4 * * *', async () => {
    console.log('[wa:marketing:cron] opener run starting');
    try {
      const r = await runOpenerJob({ supabase, sendWa, sendWaDeps });
      console.log(`[wa:marketing:cron] opener: picked=${r.picked} sent=${r.sent} failed=${r.failed}`);
    } catch (e) {
      console.error('[wa:marketing:cron] opener error:', e && e.message);
    }
  });

  // ── Window expiry — hourly at :05 (flips in_session past 24h → expired) ───────
  handles.expiry = cron.schedule('5 * * * *', async () => {
    try {
      const r = await runExpiryJob({ supabase });
      if (r.expired) console.log(`[wa:marketing:cron] expiry: ${r.expired} session(s) expired`);
    } catch (e) {
      console.error('[wa:marketing:cron] expiry error:', e && e.message);
    }
  });

  // ── Conversion match — nightly 02:00 IST = 20:30 UTC (Block-08 handshake seam) ─
  handles.conversion = cron.schedule('30 20 * * *', async () => {
    try {
      const r = await runConversionMatchJob({ supabase });
      if (r.converted) console.log(`[wa:marketing:cron] conversion: ${r.converted} prospect(s) converted`);
    } catch (e) {
      console.error('[wa:marketing:cron] conversion error:', e && e.message);
    }
  });

  return handles;
}

module.exports = { scheduleMarketingCrons };
