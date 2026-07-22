// src/api/vendor/roster.js
// TDW_04.5 · P4 — the vendor roster's DOOR. Mounted at /api/v2/vendor/roster.
//
// Routes:
//   GET  /                  — this vendor's roster
//   POST /                  — manual add (name, phone, category)
//   POST /:roster_id/bridge — mint-or-return the team_members row for an external
//
// ── WHY THE BRIDGE DOOR LIVES HERE AND NOT ON THE CALENDAR (CE-59, fork 2) ──
// Assigning an external is TWO acts wearing one word. First the external needs
// an IDENTITY on this vendor's plane — a team_members row carrying
// roster_vendor_id and a page_token, which is what makes their crew page work.
// Second, that identity gets put on a function, which is an `assigned_member_ids`
// write.
//
// Only the first act is new. The second already has a door — events.js's PATCH,
// which routes through eventWrite, the estate's ONE calendar writer. So this
// file mints the identity and returns its id; the client then assigns it through
// the EXISTING PATCH exactly as it assigns Swati. `public.events` gains no second
// writer, because nothing here writes events at all.
//
// The alternative — minting the bridge row inside the events PATCH — would have
// put roster logic inside the calendar writer and made a new events writer out
// of a door that is supposed to be the only one. Refused.
//
// COLUMN DISCIPLINE (F-04.106): every select below is an explicit column list.
// `select('*')` on team_members is exactly how that finding was born — it shipped
// every future column to the client, forever, without anyone deciding to.
'use strict';

const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const asyncHandler  = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { upsertRosterEdge, ensureBridgeMember } = require('../../lib/vendor/roster');

// The roster columns this door is willing to expose. Nothing else travels.
const ROSTER_COLS = 'id, owner_vendor_id, member_vendor_id, name, phone, category, source, created_at';
// The bridge row's columns. page_token is the external's capability — it goes to
// the OWNER (who needs it to build the wa.me link), never to the external.
const MEMBER_COLS = 'id, vendor_id, name, role, phone, active, page_token, roster_vendor_id';

// 0096 is WITHHELD and founder-run. vendor_roster does not exist until it runs,
// so this whole plane answers honestly-empty rather than 500ing in the meantime.
// The tab renders its empty state; nothing pretends to have succeeded.
async function tolerate(label, fallback, fn) {
  try {
    const { data, error } = await fn();
    if (error) {
      console.warn(`[roster:pre-0096] ${label} unavailable: ${error.message}`);
      return { data: fallback, missing: true };
    }
    return { data: data ?? fallback, missing: false };
  } catch (err) {
    console.warn(`[roster:pre-0096] ${label} threw: ${err.message}`);
    return { data: fallback, missing: true };
  }
}

// ── GET / ────────────────────────────────────────────────────────────────────
router.get('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: roster } = await tolerate('vendor_roster (list)', [], () =>
    supabase
      .from('vendor_roster')
      .select(ROSTER_COLS)
      .eq('owner_vendor_id', req.vendor.id)
      .order('created_at', { ascending: false })
  );

  return okRes(res, { roster, count: roster.length });
}));


// ── POST / — manual add ──────────────────────────────────────────────────────
// Dedup is the LIB's job, on the two predicates that mirror 0096's two partial
// uniques. This door only reports which way it went: a manual add that collides
// with an existing entry is not an error condition in the data, it is a fact the
// vendor should be told in words.
router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, phone, category } = req.body || {};

  if (!name || !String(name).trim())   return errRes(res, 400, 'Name is required.');
  if (!phone || !String(phone).trim()) return errRes(res, 400, 'Phone is required.');

  let result;
  try {
    result = await upsertRosterEdge(supabase, {
      ownerVendorId: req.vendor.id,
      name:          String(name).trim(),
      phone:         String(phone).trim(),
      category:      category || null,
      source:        'manual',
    });
  } catch (err) {
    console.error('[roster] manual add failed:', err.message);
    return errRes(res, 503, 'Roster is not available yet.');
  }

  if (!result.created) {
    // VETO LEDGER (founder YES, CE-59) — exact bytes.
    return res.status(409).json({ ok: false, error: 'duplicate', message: "They're already on your roster." });
  }

  return okRes(res, { entry: result.row, created: true });
}));


// ── POST /:roster_id/bridge — the assign-external door ───────────────────────
// IDEMPOTENT by construction (spec §4 item 6): call it twice, get the same row
// and the same page_token. The client calls this first, then puts the returned
// member id into the EXISTING events PATCH.
router.post('/:roster_id/bridge', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.vendor.id;

  const { data: rosterRow, missing } = await tolerate('vendor_roster (bridge lookup)', null, () =>
    supabase
      .from('vendor_roster')
      .select(ROSTER_COLS)
      .eq('id', req.params.roster_id)
      .eq('owner_vendor_id', vendorId)   // ownership check, not decoration
      .maybeSingle()
  );

  if (missing)   return errRes(res, 503, 'Roster is not available yet.');
  if (!rosterRow) return errRes(res, 404, 'Not on your roster.');

  let bridged;
  try {
    bridged = await ensureBridgeMember(supabase, { vendorId, rosterRow });
  } catch (err) {
    console.error('[roster] bridge failed:', err.message);
    return errRes(res, 503, 'Roster is not available yet.');
  }

  // Re-read through the explicit column list so the shape this door returns is
  // decided here and not inherited from the lib's own select.
  const { data: member } = await tolerate('team_members (bridge read)', null, () =>
    supabase.from('team_members').select(MEMBER_COLS).eq('id', bridged.member.id).maybeSingle()
  );

  return okRes(res, { member: member || bridged.member, created: bridged.created });
}));


module.exports = router;
