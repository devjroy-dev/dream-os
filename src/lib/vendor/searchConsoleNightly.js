// src/lib/vendor/searchConsoleNightly.js
// TDW · BLOCK 19 · G3.1 sitting 2 (dream-os p2) — THE NIGHTLY PULL (F-40.261 a).
//
// One sweep: every vendor with a page, pulled through the HOUSE grant with
// `page contains /v/<handle>`. Rows land under her vendor_id (0147 §2/§3); the
// room's report() reads them and never Google.
//
// ── THE MINUTE, DERIVED FROM THE SIBLINGS (R-40.63's shape) ─────────────────
// src/cron.js's night band, re-derived at 4c8f3ce: 02:30, 03:00, 03:15, 03:20,
// 03:25, 03:45, 04:15 IST, plus the hourlies at :05, :20, :30. `40 3` is its own
// minute — nothing daily or hourly sits on :40 — and it follows the seal (03:20)
// and the reminders (03:25) so the pull never competes with a sweep that writes
// the same vendors. Asia/Kolkata declared, per cron.js's wall-clock law.
//
// ── THE HEARTBEAT (F-40.107's lesson) ───────────────────────────────────────
// The job writes its own last-run row: `pull()` calls markSynced on the grant it
// used, and on the house arm that is the HOUSE ROW — so
// `vendor_google_connections.last_synced_at WHERE vendor_id IS NULL` is the
// runner's heartbeat, moved by the job and by nothing else. A silent night is
// visible as a stale timestamp, not inferred from the absence of rows.
//
// ── WHAT IT DOES NOT DO ─────────────────────────────────────────────────────
// No house row → returns { ok:false, reason:'no_house' } after ONE read and
// touches nothing; there is nothing to pull through. A vendor whose pull fails
// is logged by handle and the sweep continues; one refusal never stops the
// night for the rest.

'use strict';

const gConn = require('./googleConnection');
const sc    = require('./searchConsole');

const VENDOR_COLS = 'id, routing_handle';

async function runSearchConsoleNightly(supabase) {
  const house = await gConn.getStatus(supabase, gConn.HOUSE);
  if (!house.ok) return { ok: false, reason: 'read', error: house.error };
  if (!house.row) return { ok: false, reason: 'no_house', pulled: 0 };

  const { data: vendors, error } = await supabase
    .from('vendors').select(VENDOR_COLS)
    .eq('status', 'active').eq('discover_paused', false)
    .not('routing_handle', 'is', null);
  if (error) return { ok: false, reason: 'read', error: error.message };

  let pulled = 0, failed = 0;
  for (const v of vendors || []) {
    const handle = String(v.routing_handle || '').trim().toLowerCase();
    if (!handle) continue;
    try {
      const r = await sc.pull(supabase, v.id, { arm: 'house', handle });
      if (r.ok) pulled++;
      else { failed++; console.warn(`[searchConsoleNightly] ${handle}: ${r.reason}${r.error ? ' — ' + r.error : ''}`); }
    } catch (e) {
      failed++; console.warn(`[searchConsoleNightly] ${handle}: threw — ${e.message}`);
    }
  }
  console.log(`[searchConsoleNightly] pulled ${pulled}, failed ${failed}`);
  return { ok: true, pulled, failed };
}

module.exports = { runSearchConsoleNightly, VENDOR_COLS };
