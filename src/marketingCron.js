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

  // ── Maya's nudge sweep — hourly at :20 (TDW_08 P5 Phase 3, FORK 1) ─────────
  // THE MACHINERY WAKES HER; IT NEVER WORDS HER. This handle schedules; the job
  // finds quiet conversations and starts a full Closer turn. Every byte the
  // prospect reads is composed by the model, which is what keeps S-5 intact:
  // S-5 forbids ENGINEERED ESCALATION — routing, bigger models, pressure
  // triggers — and a send into silence cannot originate from a model that is not
  // running, so the wake is necessarily machinery and S-4's own text presumes
  // the power exists.
  //
  // :20 RATHER THAN :05, and the offset is deliberate: the expiry job at :05
  // flips `in_session → expired` past 24h, and a nudge sweep running in the same
  // minute could wake a conversation the expiry sweep is closing. Fifteen
  // minutes is more than the sweep needs and costs a prospect nothing.
  handles.nudge = cron.schedule('20 * * * *', async () => {
    try {
      const { runNudgeJob } = require('./agent/closerEngine');
      const r = await runNudgeJob({ supabase, sendWa, sendWaDeps });
      if (r.woken) console.log(`[wa:marketing:cron] nudge: woke ${r.woken} conversation(s)`);
    } catch (e) {
      console.error('[wa:marketing:cron] nudge error:', e && e.message);
    }
  });

  return handles;
}

module.exports = { scheduleMarketingCrons };
