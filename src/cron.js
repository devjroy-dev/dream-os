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
const { logWaSend } = require('./lib/waSendLog');                               // M-TELEMETRY R-37.48
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
      const out = await _sendWa({ line: 'vendor', to: phone, text: result.message, windowOpen: true, supabase, nudgeClass: true });
      logWaSend('vendor', { site: 'cron:morning', mode: 'text', to: phone, out });
    } catch (err) {
      // M-TELEMETRY R-37.48: BOTH branches. The two codes handled below are
      // ROUTED, not swallowed — but routing is not recording, and before this
      // line a vendor whose nudges were refused for any of the other seven
      // typed codes left no trace at all.
      logWaSend('vendor', { site: 'cron:morning', mode: 'text', to: phone, err });
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
      const out = await _sendWa({
        line: 'vendor',
        to: phone,
        templateKey: 'morning_nudge_vendor',
        vars: [name, OUT_OF_WINDOW_SUMMARY],
        supabase,
        nudgeClass: true,
      });
      logWaSend('vendor', { site: 'cron:morning:oow', mode: 'template', templateKey: 'morning_nudge_vendor', to: phone, out });
      return { action: 'sent', mode: 'template', phone, key: 'morning_nudge_vendor' };
    } catch (err) {
      logWaSend('vendor', { site: 'cron:morning:oow', mode: 'template', templateKey: 'morning_nudge_vendor', to: phone, err });
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

  // ══════════════════════════════════════════════════════════════════════════
  // TDW_08 P1 · THE DEMO LIFECYCLE JOBS (G-1 hourly expiry · G-2 nightly sunset)
  //
  // ⚠ THE TOMBSTONE — F-08.6, DELETED 2026-08-02. READ BEFORE EDITING EITHER JOB
  // BELOW, because the thing this warns about is gone and the warning is what is
  // left of it.
  //
  // A job titled "Demo expiry — hourly" stood immediately above these two, on the
  // same '30 * * * *' Asia/Kolkata expression, one character of intent from the
  // real hourly job below. It updated `demo_active` on `vendors`, filtered on
  // `demo_handle` — and NEITHER COLUMN EXISTS in the witnessed 38-column
  // `public.vendors`. The supabase driver returns column errors in the response
  // object rather than throwing, and the job carried an empty success branch and
  // an empty `catch {}`, so it did not crash into silence: it SUCCEEDED into
  // silence, on every hourly tick, forever, reporting nothing to anyone.
  //
  // WHY THE MARKER OUTLIVES THE JOB. A reader who finds no job and no explanation
  // re-derives the whole question — and the next hand to want an hourly demo job
  // would write the same one again. This paragraph is the answer to a question
  // that would otherwise be asked twice. Two benches assert against it by name
  // (b08_p1_lifecycle_bench and b05_p4_crons_bench), and both were amended in the
  // same act as the deletion, because a deletion that reddens a bench nobody
  // amended is floor drift wearing a cure's clothes.
  //
  // The two jobs below are the real ones and they act on `public.demo_vendors`.
  //
  // BOTH PREDICATES ARE POSITIVE ENUMERATIONS, ruled binding at CE-133 §3, and
  // they live in demoLifecycle (CLOCK_STATES / SUNSET_STATES) rather than here.
  // A negated predicate (`state != 'claimed'`) would sweep `legacy` rows — rows
  // with no clock and no recorded history — and is a bench RED, not a style note.
  // ══════════════════════════════════════════════════════════════════════════

  // ── Demo LIFECYCLE expiry — hourly, :30 IST (G-1) ─────────────────────────
  // Expired demos STAY IN DISCOVER. The feed is `discover_eligible AND active`
  // and this job moves neither. Only the clock dies; the sunset job below is
  // what eventually rotates a card out.
  cron.schedule('30 * * * *', async () => {
    try {
      await require('./lib/demoLifecycle').runExpirySweep(supabase);
    } catch (err) {
      console.error('[cron:demoLifecycle:expiry] error:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // ── Demo 30-day sunset — nightly 3:45am IST (G-2) ─────────────────────────
  // Quiet rotation out of Discover, content retained, resurrectable by an admin
  // grant. NOT a takedown: `state` is left alone and `active` stays true, so a
  // sunset row and a removed row stay distinguishable to P6's deletion queue.
  // 03:45 IST sits after the 03:00 / 03:15 jobs above and shares their band.
  cron.schedule('45 3 * * *', async () => {
    try {
      await require('./lib/demoLifecycle').runSunsetSweep(supabase);
    } catch (err) {
      console.error('[cron:demoLifecycle:sunset] error:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // ── Demo PURGE — nightly 4:15am IST (spec P6, CE R-B8) ────────────────────
  // THE ONLY DESTRUCTIVE JOB IN THIS FILE. It destroys Cloudinary bytes and
  // deletes rows, and it is the reason the two jobs above are careful to leave
  // a sunset and a takedown distinguishable in the row.
  //
  // 04:15 IST, THIRTY MINUTES AFTER THE SUNSET AT 03:45 AND ALONE IN ITS SLOT.
  // Sequenced after on purpose: the sunset job is what mints `sunset_at`, and a
  // purge running first would judge the night's rotations against yesterday's
  // stamps. The gap is not a guess about runtime — the two jobs share no row on
  // any single night (a row sunset at 03:45 is `sunset_at = now`, which cannot
  // satisfy a cutoff seven days back), so the ordering is for legibility and
  // for the day the window is dialled down, not for a race.
  //
  // NOTHING IS PASSED FOR THE DESTROY SEAM: `runPurgeSweep`'s default IS the
  // real `destroyVerified`. The bench drives that seam by injection and asserts
  // the production default by identity, so a harness can never quietly become
  // the thing production runs (F-08.65's true-pipe law).
  cron.schedule('15 4 * * *', async () => {
    try {
      await require('./lib/demoLifecycle').runPurgeSweep(supabase);
    } catch (err) {
      console.error('[cron:demoLifecycle:purge] error:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // ── G2 · REVIEWS + THE SEAL — nightly 3:20am IST (R-G2.5) ─────────────────
  // TWO SWEEPS IN ONE JOB: the review ask, then the seal's recount. Ordered, and
  // the order is stated at `reviewsNightly.js` rather than here.
  //
  // ── :20, AND THE MINUTE IS DERIVED ───────────────────────────────────────
  // This band runs 03:00 (briefing) · 03:15 (bride nudge) · 03:45 (demo sunset) ·
  // 04:15 (demo purge). :20 is free, alone in its slot, and it sits AFTER the
  // 03:00 briefing on purpose: a vendor's morning read must never queue behind a
  // sweep of every wedding page on the estate.
  //
  // ── THE ASK IS DARK AND THIS SCHEDULE DOES NOT CHANGE THAT ───────────────
  // `reviewAsk.js` holds two gates and `REVIEW_ASK_SEND_ENABLED` is unset in
  // every environment. This job therefore runs tonight, claims nothing it cannot
  // send, and reports `asked=0 skipped=N` — which is the honest reading of a
  // feature built dark, and is what the founder card witnesses by SELECT.
  //
  // ⚠ THE SEAL SWEEP IS **NOT** DARK. It writes `vendor_seal` from the first
  // night, deliberately: the seal has no Meta dependency and no gate, and a
  // storefront that only starts counting on the day a flag flips would show every
  // vendor a zero on her first day. Named here so the asymmetry is a decision.
  //
  // NOTHING IS PASSED FOR EITHER SEAM: `runReviewsNightly`'s defaults ARE the
  // real sweeps. The bench drives them by injection and asserts the production
  // defaults by identity, so a harness can never quietly become what production
  // runs (F-08.65's true-pipe law).
  cron.schedule('20 3 * * *', async () => {
    try {
      const { runReviewsNightly } = require('./lib/vendor/reviewsNightly');
      await runReviewsNightly(supabase);
    } catch (err) {
      console.error('[cron:reviewsNightly] error:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // ── RELAY EXPIRY SWEEP — hourly, :05 IST (TDW_06/07 M3) ───────────────────
  // №16, THE ESTATE'S FIRST CLOCK-SPEAKER. A vendor approved bride-facing bytes,
  // the estate rang her doorbell, and her 24 hours ran out in silence. Every
  // other byte in the relay arc answers an act; this one reports that nobody
  // acted, which is why it needs a schedule rather than a call site.
  //
  // ── WHY THIS FILE AND NOT `brideCron.js`, DERIVED NOT DEFAULTED ───────────
  // `src/cron.js` is started by `src/index.js` (symbol `startCronJobs` at its
  // boot block); `src/brideCron.js` by `src/brideIndex.js`. The subject is
  // `pending_couple_drafts` — a VENDOR-lane relay object — and the notice lands
  // on the VENDOR's handset from `VENDOR_WHATSAPP_NUMBER`. This is the sibling
  // home. A new cron file would have been a fork, not a default.
  //
  // ── CADENCE, FROM THE SIBLINGS ───────────────────────────────────────────
  // HOURLY is the demo-lifecycle expiry sweep's own cadence ('30 * * * *') and
  // the same shape of question: a clock passed, a row must be judged. :30 is
  // taken, so this takes :05 — its own minute, alone in its slot, sharing the
  // siblings' Asia/Kolkata declaration so the expression says what the comment
  // says (the B3(a) wall-clock law this file already carries).
  //
  // A notice can therefore trail its expiry by up to 59 minutes. That is
  // acceptable and it is the point: the fact being reported is "a day passed",
  // not "a second passed", and a tighter cadence would buy precision nobody can
  // perceive at the cost of 24× the reads.
  //
  // NOTHING IS PASSED FOR THE TRANSPORT SEAM BY ACCIDENT: `sendWhatsApp` is
  // handed in EXPLICITLY here, because `relayExpirySweep` refuses to send
  // without it rather than reaching for a module-level import — the F-08.65
  // true-pipe law, and the same posture `relayToCouple` holds one file over.
  cron.schedule('5 * * * *', async () => {
    try {
      const { relayExpirySweep } = require('./lib/vendor/relaySeat');
      const { sendWhatsApp } = require('./lib/whatsapp');
      const out = await relayExpirySweep(supabase, { sendWhatsApp });
      // R-29.34 MEMBER (b) — THE NAMED PRODUCTION WITNESS. The founder can read
      // this line on a night nothing happened and know the sweep RAN, which is
      // the difference between a quiet cron and an absent one.
      console.log(`[relay:expiry] sweep scanned=${out.scanned} spoke=${out.spoke} `
        + `silent=${out.silent} undelivered=${out.undelivered} reason=${out.reason}`);
    } catch (err) {
      console.error('[cron:relayExpiry] error:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

}

module.exports = { startCronJobs, routeBriefing };
