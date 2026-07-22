// src/api/vendor/studio/team.js
// GET    /api/v2/vendor/studio/team                       — list active members
// POST   /api/v2/vendor/studio/team                       — add member
// PATCH  /api/v2/vendor/studio/team/:memberId             — update
// DELETE /api/v2/vendor/studio/team/:memberId             — soft delete
// POST   /api/v2/vendor/studio/team/:memberId/rotate-token — new crew-page token
'use strict';

const express         = require('express');
const router          = express.Router();
const { randomUUID }  = require('crypto');
const requireAuth     = require('../../middleware/requireAuth');
const resolveVendor   = require('../../middleware/resolveVendor');
const requirePrestige  = require('../../middleware/requirePrestige');
const asyncHandler    = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');
// TDW_04.5 P4 — the crew page's member-board assembly, reused whole (see the
// assignments door below). Imported, never re-implemented; byte-untouched there.
const { buildCrewPage, istToday } = require('../../crew');

const mw = [requireAuth, resolveVendor(), requirePrestige];

// ── F-04.106 — THE EXPLICIT COLUMN LIST (TDW_04.5 P3, disclosed labeled rider) ──
// This file used to answer with `select('*')`, which meant every column ever added to
// `team_members` shipped to the client the instant its migration ran — no code change,
// no review, no decision. 0087 made that concrete: §B's `page_token` (a CAPABILITY
// SECRET) and §C's `roster_vendor_id` both arrived on the wire that way, unnoticed.
// The class dies here: the wire is now a DECISION.
//
// `page_token` is IN by CE ruling — the Team page's "Send page" action legitimately
// needs it to build the wa.me link. `roster_vendor_id` is OUT: it is P4's internal
// bridge key and no client reads it. Anything added to this table in future ships only
// when someone writes it on this line.
//
// Columns witnessed: PUBLIC_SCHEMA.md:732-746 (the eleven) + db/migrations/0087
// §B:50 (`page_token`). That doc predates 0087 and shows team_members at eleven
// columns; the migration file is the settling witness for the token, per the
// SQL-provenance law's own staleness clause.
const MEMBER_COLS =
  'id, vendor_id, name, role, phone, daily_rate_inr, notes, active, deleted_at, created_at, updated_at, page_token';

// GET — list
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_members')
    .select(MEMBER_COLS)
    .eq('vendor_id', req.vendor.id)
    .eq('active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { members: data || [] });
}));

// ── GET /:memberId/assignments — THE OWNER'S VIEW OF ONE MEMBER'S BOARD ──────
// TDW_04.5 P4, founder-chartered: clicking a team member told the owner nothing
// about their assignments — he had to walk the calendar and read the marks. The
// crew page already renders the exact set for the MEMBER; the owner deserves the
// same view of his own crew.
//
// ONE ASSEMBLY, TWO AUTH WRAPPERS. This calls `buildCrewPage` — the SAME function
// the token door calls — rather than re-deriving the predicate. That assembly does
// not merely run a query: it encodes the read gate (belt AND braces, DB `contains`
// re-asserted in JS) and F7 (`note` is crew_confirmations.note ONLY; events.notes
// never leaves the vendor plane). A fresh owner-side query would re-derive both
// from scratch and drift the first time either is edited — F-04.104's class, and
// the same argument that hoisted the slot-word map at F8(d).
//
// THE SHARING CANNOT LOOSEN THE TOKEN DOOR. buildCrewPage is BYTE-UNTOUCHED by
// this delivery — it already took `{ supabase, member, vendor, today }` with zero
// auth logic inside it (crew.js:241, exported :534), token resolution living
// entirely in the route above it. This adds a CALLER, not a change. b0451's
// capability asserts stay pointed at exactly what they were pointed at.
//
// AUTH: requireAuth + resolveVendor + the member must belong to THIS vendor. No
// capability constraints apply owner-side — it is his own crew, his own calendar —
// but the response is still built field by named field, never spread.
router.get('/:memberId/assignments', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  // The belongs-to check IS the authorization. Scoped by vendor_id, so another
  // vendor's member id resolves to nothing and answers 404 — the door does not
  // confirm that a member exists to someone with no claim on them.
  const { data: member } = await supabase
    .from('team_members')
    .select('id, vendor_id, name, active, deleted_at')
    .eq('id', req.params.memberId)
    .eq('vendor_id', req.vendor.id)
    .maybeSingle();

  if (!member) return errRes(res, 404, 'Member not found.');

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, user_id, business_name')
    .eq('id', req.vendor.id)
    .maybeSingle();

  if (!vendor) return errRes(res, 404, 'Vendor not found.');

  let payload;
  try {
    payload = await buildCrewPage({ supabase, member, vendor, today: istToday() });
  } catch (e) {
    console.error('[GET /studio/team/:id/assignments] assembly failed:', e.message);
    return errRes(res, 500, 'Could not load assignments.');
  }

  // ASSIGNMENTS ONLY. The assembly also builds `tasks`, and the owner has his own
  // Tasks screen — echoing them here would put a second source of that truth on a
  // surface that did not ask for it. The charter named five fields; the assembly
  // supplies them plus the F7-permitted note, and nothing else travels.
  return okRes(res, { assignments: payload.assignments });
}));


// POST — add
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { name, role, phone, daily_rate_inr, notes } = req.body || {};
  if (!name || !name.trim()) return errRes(res, 400, 'name is required.');
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      vendor_id:      req.vendor.id,
      name:           name.trim(),
      role:           role           || null,
      phone:          phone          || null,
      daily_rate_inr: daily_rate_inr || null,
      notes:          notes          || null,
    })
    .select(MEMBER_COLS)
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { member: data });
}));

// PATCH — update
router.patch('/:memberId', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  // ⚠ `page_token` IS DELIBERATELY ABSENT AND MUST STAY ABSENT. This loop copies
  // req.body[k] straight into the update, so an allowlisted `page_token` would let a
  // caller SET a member's token to a value of their choosing — turning a 122-bit
  // unguessable capability into whatever they typed. TDW_04.5's spec §P3:66 asked for
  // rotation "via a PATCH allowlist addition"; that sentence was STRUCK ON THE RECORD
  // at P3's pre-build ruling (F9) as a capability-forging hole. Rotation is
  // POST /:memberId/rotate-token below, server-generated, body never read.
  const allowed  = ['name', 'role', 'phone', 'daily_rate_inr', 'notes', 'active'];
  const updates  = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }
  if (!Object.keys(updates).length) return errRes(res, 400, 'No valid fields provided.');
  const { data, error } = await supabase
    .from('team_members')
    .update(updates)
    .eq('id', req.params.memberId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .select(MEMBER_COLS)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Team member not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { member: data });
}));

// DELETE — soft delete
router.delete('/:memberId', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_members')
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq('id', req.params.memberId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .select(MEMBER_COLS)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Team member not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { member: data });
}));

// POST /:memberId/rotate-token — mint a new crew-page capability (TDW_04.5 P3, F9)
//
// The CE ruling, verbatim in effect: server-generated, THE BODY IS NEVER READ. There
// is no path from caller input to the stored token, so no caller can choose one.
// `randomUUID()` is crypto-grade (node:crypto), matching 0087 §B's uuid column and its
// unique index :52 — the same 122 bits the old token had.
//
// Rotation is IRREVERSIBLE and IMMEDIATE: the previous link is dead the moment this
// returns, which is the whole point of the affordance. The new token ships back so the
// Team page can offer "Send page" again without a refetch.
router.post('/:memberId/rotate-token', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_members')
    .update({ page_token: randomUUID() })
    .eq('id', req.params.memberId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .select(MEMBER_COLS)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Team member not found.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { member: data });
}));

module.exports = router;
