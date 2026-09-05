// src/lib/vendor/reviewsNightly.js — BLOCK 19 · G2 · THE NIGHTLY JOB (R-G2.5).
//
// ═══════════════════════════════════════════════════════════════════════════
// ONE JOB, TWO SWEEPS, AND THE ORDER IS LOAD-BEARING
// ═══════════════════════════════════════════════════════════════════════════
// The ask sweep runs FIRST, the seal sweep SECOND. A page published today should
// have its couple asked tonight and its number in tonight's seal — running the
// seal first would count a page whose couple has not been written to yet, which
// is not wrong but makes the two sweeps describe different moments. One night,
// one state.
//
// ── WHY NIGHTLY AND NOT ON-DELIVERY (R-G2.5, FORK 5 arm (a)) ───────────────
// The on-delivery hook exists and is precise: `publishWedding` is delivered_at's
// sole writer. It was REFUSED for this sitting because publication changes the
// numbers of every credited studio on the roll, not only the owner's — so a hook
// on one vendor's act would leave the others stale until their own next act. A
// sweep asks the question of everyone, every night, which is the shape the fact
// actually has. The room says "counted every night" (veto sheet string 8) and
// this is the machinery that makes that sentence true.
//
// ── THE MINUTE, DERIVED FROM THE SIBLINGS ─────────────────────────────────
// `20 3` IST, ruled. src/cron.js's band at 03:00–04:15 IST is taken at :00, :15,
// :45 and 04:15; :20 is its own minute, alone in its slot, and it sits AFTER the
// 03:00 briefing so a night's work is never competing with a vendor's morning
// read. Asia/Kolkata declared, per that file's wall-clock law (B3(a)).
'use strict';

const { runSealSweep } = require('./seal');
const { sendReviewAsk } = require('./reviewAsk');

/**
 * THE ASK SWEEP.
 *
 * ── THE ONCE-EVER GUARANTEE IS THE UNIQUE KEY, NOT THIS CODE ───────────────
 * `reviews_asked_couple_key UNIQUE (couple_id)` is the guarantee. This function
 * INSERTS FIRST and sends only if the insert won the row. A `SELECT ... then
 * INSERT` would be two statements with a gap, and the gap is where the second
 * message to the same couple comes from — on a retry, on two instances, on a
 * cron that overlaps itself. Postgres decides; we read its answer.
 *
 * ⚠ THE ROW IS WRITTEN BEFORE THE SEND, AND THAT ORDER IS DELIBERATE. It means a
 * send that fails still leaves a row, so that couple is never asked again. The
 * alternative — send, then record — risks a delivered message with no witness,
 * and a couple who gets asked twice is a worse failure than a couple who gets
 * asked once and whose send failed. `wamid` stays NULL on a failure and IS the
 * record of which asks actually reached Meta.
 *
 * ── WHO IS ELIGIBLE ───────────────────────────────────────────────────────
 * A wedding page that is published, consented, delivered, and has a couple.
 * `couple_consent = true` is not decoration here: a couple who has not agreed to
 * her wedding being published has certainly not agreed to be asked for a review
 * about it.
 *
 * Column witnesses: public.weddings owner_vendor_id (2) · event_id (3) ·
 * delivered_at (8) · couple_consent (9) · visibility (10) · couple_id (13)
 * [db/migrations/0131, 0132] · public.couples id (1) · user_id (2) [:364] ·
 * public.users phone (2) · name (3) [:1007] · public.vendors business_name (3) ·
 * routing_handle (15) [:1131].
 */
async function runAskSweep(supabase, deps = {}) {
  const _send = deps.sendReviewAsk || sendReviewAsk;

  const { data, error } = await supabase
    .from('weddings')
    .select('id, owner_vendor_id, couple_id, couples(id, user_id), vendors:owner_vendor_id(business_name, routing_handle)')
    .eq('visibility', 'published')
    .eq('couple_consent', true)
    .not('delivered_at', 'is', null)
    .not('couple_id', 'is', null);

  if (error) return { ok: false, scanned: 0, asked: 0, already: 0, skipped: 0, reason: error.message };

  const rows = data || [];
  let asked = 0, already = 0, skipped = 0;

  for (const w of rows) {
    try {
      // ── CLAIM THE COUPLE. The insert IS the decision. ──────────────────
      const claim = await supabase
        .from('reviews_asked')
        .insert({
          couple_id:  w.couple_id,
          wedding_id: w.id,
          vendor_id:  w.owner_vendor_id,
          template:   'tdw_review_request',
        })
        .select('id')
        .maybeSingle();

      if (claim.error) {
        // 23505 is the unique violation — this couple has been asked, ever, by
        // anyone. It is the SUCCESS of the guarantee, not a failure, and it is
        // distinguished from a real error rather than swallowed with it.
        if (String(claim.error.code) === '23505') { already++; continue; }
        skipped++;
        console.error(`[reviews:ask] claim failed for couple ${w.couple_id}: ${claim.error.message}`);
        continue;
      }

      // ── HER NUMBER. Three hops, every one witnessed. ────────────────────
      const userId = w.couples && w.couples.user_id;
      let phone = null;
      if (userId) {
        const { data: u } = await supabase.from('users').select('phone, name').eq('id', userId).maybeSingle();
        phone = u && u.phone;
        w._coupleName = (u && u.name) || null;
      }
      if (!phone) {
        // The row stays. A couple we cannot reach is still a couple we will not
        // ask twice, and the NULL wamid says the send never happened.
        skipped++;
        continue;
      }

      const vendor = w.vendors || {};
      const out = await _send({
        to:     phone,
        couple: w._coupleName || 'there',
        vendor: vendor.business_name || 'your photographer',
        code:   vendor.routing_handle,
      }, { supabase });

      if (out && out.sent) {
        asked++;
        const wamid = out.result && out.result.result && out.result.result.wamid;
        if (wamid) {
          await supabase.from('reviews_asked').update({ wamid }).eq('id', claim.data.id);
        }
      } else {
        // Dark, opted out, or no handle. Reported, never counted as sent.
        skipped++;
      }
    } catch (err) {
      skipped++;
      console.error(`[reviews:ask] ${w.id}: ${err && err.message}`);
    }
  }

  return { ok: true, scanned: rows.length, asked, already, skipped, reason: null };
}

/**
 * THE NIGHT. Both sweeps, one summary line, and the line prints on a night when
 * nothing happened — which is the difference between a quiet cron and an absent
 * one (R-29.34 member (b), the relay sweep's own reasoning).
 */
async function runReviewsNightly(supabase, deps = {}) {
  const _ask  = deps.runAskSweep  || runAskSweep;
  const _seal = deps.runSealSweep || runSealSweep;

  const ask  = await _ask(supabase, deps);
  const seal = await _seal(supabase);

  console.log(
    `[reviews:nightly] ask scanned=${ask.scanned} asked=${ask.asked} already=${ask.already} ` +
    `skipped=${ask.skipped} | seal scanned=${seal.scanned} written=${seal.written} failed=${seal.failed}`
  );
  return { ask, seal };
}

module.exports = { runAskSweep, runReviewsNightly };
