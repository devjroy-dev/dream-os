// src/api/admin/couples.js
// Admin couple management — list, create, tier, revoke.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { ensureCoupleRow, captureField } = require('../../lib/coupleIdentity');
const { writeAudit } = require('../../lib/admin/auditLog');
// F-10.50 — the same miss on the couple side. `ensureCoupleRow` keys on the
// phone it is handed and does not normalise either, so an un-normalised admin
// mint would split a bride the same way it split a vendor.
const { toE164 } = require('../../lib/phone');

const VALID_TIERS = ['basic', 'gold', 'platinum'];

// ─── GET /api/v2/admin/couples ──────────────────────────────────────────
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data, error } = await supabase
    .from('couples')
    .select(`
      id, wedding_date, wedding_city, planning_state, created_at,
      users!inner(name, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) return errRes(res, 500, error.message);

  const coupleIds = (data || []).map(c => c.id);

  // Counts in parallel — muse saves + circle members.
  const [museSavesRes, circleMembersRes] = await Promise.all([
    supabase
      .from('muse_saves')
      .select('couple_id')
      .in('couple_id', coupleIds),
    supabase
      .from('circle_members')
      .select('couple_id, status')
      .in('couple_id', coupleIds)
      .eq('status', 'active'),
  ]);

  const museCounts   = {};
  const circleCounts = {};
  for (const row of (museSavesRes.data || []))   museCounts[row.couple_id]   = (museCounts[row.couple_id]   || 0) + 1;
  for (const row of (circleMembersRes.data || [])) circleCounts[row.couple_id] = (circleCounts[row.couple_id] || 0) + 1;

  const couples = (data || []).map(c => ({
    id:              c.id,
    name:            c.users?.name || 'Unknown',
    phone:           c.users?.phone,
    wedding_date:    c.wedding_date,
    wedding_city:    c.wedding_city,
    planning_state:  c.planning_state,
    muse_saves:      museCounts[c.id]   || 0,
    circle_members:  circleCounts[c.id] || 0,
    created_at:      c.created_at,
  }));

  return okRes(res, { couples, total: couples.length });
}));

// ─── POST /api/v2/admin/couples/create ──────────────────────────────────
// ── TDW_10 P3 · THE COUPLE BIRTH PATH RETIRES ONTO ITS SOLE WRITER (R-P3.1) ──
// `POST /api/v2/admin/mint/couple` is an ALIAS onto this exact handler — see
// src/api/admin/mint.js.
//
// THIS HANDLER READ, until this delivery:
//     const { data: user } = await supabase.from('users')
//       .upsert({ phone, name }, { onConflict: 'phone' }).select('id').single();
//     await supabase.from('couples').insert({ user_id: user.id, planning_state: 'browsing' });
//     return okRes(res, { created: true });
//
// That was the THIRD couple-creation implementation in this estate, derived by
// census at the P3 read-first: `invite_couple()` (the RPC, called from
// src/admin/router.js), `ensureCoupleRow` (src/lib/coupleIdentity.js, the live
// inbound path every real bride arrives through), and this. It carried two
// defects the other two do not:
//
//   (1) THE NAME CLOBBER. `upsert … onConflict: 'phone'` overwrites the stored
//       name of any existing person. Same species as F-10.47 on the vendor side.
//   (2) THE DUPLICATE COUPLE. It inserted a `couples` row UNCONDITIONALLY. That
//       exact bug was found and fixed in 2026 for the RPC —
//       db/migrations/0015_pronouns_and_dedup.sql:42 records it verbatim
//       ("invite_couple() could create multiple couples rows") — and the fix went
//       INTO THE FUNCTION only. This route was born after it and inherited the
//       disease the migration had already cured one door over.
//
// Both die by retirement rather than by repair. `ensureCoupleRow` is idempotent,
// backfills `users.name` ONLY when the stored name is absent (so it cannot
// clobber), reuses an existing `couples` row, and also creates the `couple_state`
// row that this route never made — a bride minted here previously had no state row
// until her first inbound message built one.
//
// `invite_couple()` IS DELIBERATELY NOT CALLED, and coupleIdentity.js's own header
// says why in its first paragraph: it requires pronouns and would clobber existing
// users. Retiring one wrong writer onto a second wrong writer is not a cure.
async function mintCouple(req, res) {
  const supabase = req.app.locals.supabase;
  const { name, phone, wedding_date } = req.body || {};

  if (!phone || !String(phone).trim()) return errRes(res, 400, 'phone is required.');
  if (!name  || !String(name).trim())  return errRes(res, 400, 'name is required.');

  const cleanPhone = toE164(String(phone).trim());
  const cleanName  = String(name).trim();

  // Read BEFORE the write so the outcome is knowable. `ensureCoupleRow` is
  // idempotent by design and therefore cannot itself tell created from existing —
  // that is a property of the caller's knowledge, not of the writer.
  const { data: priorUser } = await supabase
    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();
  let priorCouple = null;
  if (priorUser) {
    const { data: c } = await supabase
      .from('couples').select('id').eq('user_id', priorUser.id).maybeSingle();
    priorCouple = c || null;
  }
  const outcome = priorCouple ? 'existing' : 'created';

  let ids;
  try {
    ids = await ensureCoupleRow(supabase, cleanPhone, cleanName);
  } catch (e) {
    return errRes(res, 400, e.message);
  }
  if (!ids || !ids.couple_id) return errRes(res, 500, 'Account was not created.');

  // The wedding date rides `captureField`, the SAME allow-listed writer the vendor
  // lane uses — never a raw update from here. It coerces and validates the date in
  // one home; a second date parser on the admin side is the drift this block exists
  // to avoid.
  let dateResult = null;
  if (wedding_date && String(wedding_date).trim()) {
    dateResult = await captureField(supabase, ids.couple_id, 'wedding_date', String(wedding_date).trim());
    if (!dateResult.ok) return errRes(res, 400, dateResult.error);
  }

  // ── DECLARED GAP · `couples.partner_name` IS NOT WRITTEN HERE ────────────────
  // The spec's sheet says "names + wedding date". One name ships, into
  // `users.name` through `ensureCoupleRow`. `partner_name` is REFUSED by
  // `captureField` by name ("partner_name not writable from vendor side"), and
  // giving the admin plane a second writer for a column one module deliberately
  // guards is an architecture choice nobody ruled. The mint sheet's field is
  // therefore labelled for what it stores. Declared, not silently invented.

  await writeAudit(supabase, 'mint_couple', 'couple', ids.couple_id, {
    outcome, phone: cleanPhone, name: cleanName,
    wedding_date: wedding_date ? String(wedding_date).trim() : null,
  });

  return okRes(res, {
    created: outcome === 'created',
    outcome,
    couple_id: ids.couple_id,
    owner_name: cleanName,
  });
}

router.post('/create', requireAdmin, asyncHandler(mintCouple));

// ─── PATCH /api/v2/admin/couples/:id/tier ───────────────────────────────
// Couples don't have a tier column yet — placeholder for when it's added.
router.patch('/:coupleId/tier', requireAdmin, asyncHandler(async (req, res) => {
  const { tier } = req.body;
  if (!VALID_TIERS.includes(tier)) return errRes(res, 400, `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}.`);
  // No tier column on couples yet — return ok so the admin UI doesn't error.
  return okRes(res, { tier, note: 'Couple tiers not yet enforced in DB.' });
}));

// ─── PATCH /api/v2/admin/couples/:id/revoke ─────────────────────────────
// "Revoke" for couples means deleting their circle + muse data and resetting planning state.
router.patch('/:coupleId/revoke', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { error } = await supabase
    .from('couples')
    .update({ planning_state: 'browsing' })
    .eq('id', req.params.coupleId);

  if (error) return errRes(res, 500, error.message);
  return okRes(res, { revoked: true });
}));

// ── DELETE /api/v2/admin/couples/:coupleId ────────────────────────────────────
// Hard delete. Cascades to all couple data via FK constraints.
router.delete('/:coupleId', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  if (!req.body?.confirm) return errRes(res, 400, 'Pass { confirm: true } to confirm deletion.');

  const { data: couple } = await supabase
    .from('couples').select('user_id').eq('id', req.params.coupleId).maybeSingle();
  if (!couple) return errRes(res, 404, 'Couple not found.');

  const { error } = await supabase.from('users').delete().eq('id', couple.user_id);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
// The mint alias mounts THIS function, not a copy of it (R-P3.1, one path).
module.exports.mintCouple = mintCouple;
