// src/api/couple/circle.js
// GET  /api/v2/couple/circle/:coupleId  — members + activity feed + pending invites
// POST /api/v2/couple/circle/invite     — invite a new circle member
// Requires couple auth (applied in core.js).

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// ── POST /invite — must come before /:coupleId ────────────────────────────────
router.post('/invite', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { invitee_name, role } = req.body || {};

  if (!invitee_name || !role) {
    return errRes(res, 400, 'invitee_name and role are required.');
  }

  const VALID_ROLES = ['partner', 'family', 'inner_circle'];
  if (!VALID_ROLES.includes(role)) {
    return errRes(res, 400, `role must be one of: ${VALID_ROLES.join(', ')}.`);
  }

  const { data, error } = await supabase.rpc('invite_circle_member', {
    p_couple_id:    couple_id,
    p_invitee_name: invitee_name,
    p_role:         role,
  });

  if (error) {
    // Structured error from 0023 — check hint field
    const hint = error.hint || '';
    if (hint === 'circle_member_limit_reached') {
      return errRes(res, 422, 'Circle is full. Maximum 3 members allowed.');
    }
    if (hint === 'invalid_circle_role') {
      return errRes(res, 400, 'Invalid role.');
    }
    if (hint === 'couple_not_found') {
      return errRes(res, 404, 'Couple not found.');
    }
    console.error('[POST /couple/circle/invite] rpc error:', error.message);
    return errRes(res, 500, 'Could not create invite.');
  }

  const row = (data || [])[0];
  if (!row) {
    console.error('[POST /couple/circle/invite] rpc returned no row');
    return errRes(res, 500, 'Could not create invite.');
  }

  return okRes(res, {
    invite_token: row.invite_token,
    wa_me_link:   row.wa_me_link,
    member_id:    row.id,
  });
}));

// ── GET /:coupleId ─────────────────────────────────────────────────────────────
router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  // Active members
  const { data: members, error: mErr } = await supabase
    .from('circle_members')
    .select('id, invitee_name, role, status, joined_at, created_at')
    .eq('couple_id', couple_id)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });

  if (mErr) {
    console.error('[GET /couple/circle] members error:', mErr.message);
    return errRes(res, 500, 'Could not fetch circle.');
  }

  // Pending invites
  const { data: pending, error: pErr } = await supabase
    .from('circle_members')
    .select('id, invitee_name, role, expires_at, created_at')
    .eq('couple_id', couple_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (pErr) {
    console.error('[GET /couple/circle] pending error:', pErr.message);
    return errRes(res, 500, 'Could not fetch circle.');
  }

  // Recent activity feed — last 50 rows
  const { data: activity, error: aErr } = await supabase
    .from('circle_activity')
    .select('id, activity_type, actor_name, actor_role, subject_type, subject_id, payload, created_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (aErr) {
    console.error('[GET /couple/circle] activity error:', aErr.message);
    return errRes(res, 500, 'Could not fetch circle.');
  }

  const shapedActivity = (activity || []).map(a => ({
    id:            a.id,
    activity_type: a.activity_type,
    member_name:   a.actor_name,
    actor_role:    a.actor_role,
    subject_type:  a.subject_type  || null,
    subject_id:    a.subject_id    || null,
    content:       a.payload?.content || null,
    created_at:    a.created_at,
  }));

  return okRes(res, {
    members:         members  || [],
    activity:        shapedActivity,
    pending_invites: (pending || []).map(p => ({
      id:            p.id,
      invitee_name:  p.invitee_name,
      role:          p.role,
      expires_at:    p.expires_at || null,
      created_at:    p.created_at,
    })),
  });
}));

module.exports = router;
