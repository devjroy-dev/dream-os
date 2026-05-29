// src/api/couple/circle.js
// GET  /api/v2/couple/circle/:coupleId        — enriched unified feed + members
// GET  /api/v2/couple/circle/member/:memberId — individual member feed
// POST /api/v2/couple/circle/invite           — invite a circle member
// Requires couple auth (applied in core.js).
//
// Enrichment: save_added activity rows are joined with muse_saves to inline
// image_url, caption, aesthetic_tags — one batch query, not N+1.

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
    const hint = error.hint || '';
    if (hint === 'circle_member_limit_reached') {
      return errRes(res, 422, 'Circle is full. Maximum 3 members allowed.');
    }
    if (hint === 'invalid_circle_role') return errRes(res, 400, 'Invalid role.');
    if (hint === 'couple_not_found')    return errRes(res, 404, 'Couple not found.');
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

// ── Shared: enrich activity rows with muse_save image data ───────────────────
// Collects all subject_ids from save_added rows, fetches muse_saves in one
// query, returns a lookup map. Never throws — enrichment failure is non-fatal.
async function enrichSaveActivity(supabase, activityRows) {
  const saveIds = activityRows
    .filter(a => a.activity_type === 'save_added' && a.subject_id)
    .map(a => a.subject_id);

  if (saveIds.length === 0) return {};

  const { data: saves, error } = await supabase
    .from('muse_saves')
    .select('id, image_url, caption, aesthetic_tags, save_number, source_type')
    .in('id', saveIds);

  if (error) {
    console.error('[circle] muse_saves enrichment error (non-fatal):', error.message);
    return {};
  }

  const lookup = {};
  (saves || []).forEach(s => { lookup[s.id] = s; });
  return lookup;
}

// ── Shape one activity row (with optional muse enrichment) ───────────────────
function shapeActivity(a, saveLookup) {
  const base = {
    id:            a.id,
    activity_type: a.activity_type,
    member_name:   a.actor_name,
    actor_role:    a.actor_role,
    subject_type:  a.subject_type  || null,
    subject_id:    a.subject_id    || null,
    content:       a.payload?.content || null,
    created_at:    a.created_at,
    // enrichment fields — null unless save_added
    image_url:       null,
    caption:         null,
    aesthetic_tags:  null,
    save_number:     null,
    source_type:     null,
  };

  if (a.activity_type === 'save_added' && a.subject_id && saveLookup[a.subject_id]) {
    const save = saveLookup[a.subject_id];
    base.image_url      = save.image_url      || null;
    base.caption        = save.caption        || null;
    base.aesthetic_tags = save.aesthetic_tags || null;
    base.save_number    = save.save_number    || null;
    base.source_type    = save.source_type    || null;
  }

  return base;
}

// ── DELETE /member/:memberId — soft-delete a circle member (status → removed) ─
router.delete('/member/:memberId', asyncHandler(async (req, res) => {
  const supabase     = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { memberId } = req.params;

  // Verify member belongs to this couple
  const { data: member, error: fErr } = await supabase
    .from('circle_members')
    .select('id, status, invitee_name')
    .eq('id', memberId)
    .eq('couple_id', couple_id)
    .maybeSingle();

  if (fErr) {
    console.error('[DELETE /couple/circle/member] fetch error:', fErr.message);
    return errRes(res, 500, 'Could not remove member.');
  }
  if (!member) return errRes(res, 404, 'Member not found.');
  if (member.status === 'removed') return okRes(res, { member_id: memberId, status: 'removed' });

  const { error: uErr } = await supabase
    .from('circle_members')
    .update({ status: 'removed' })
    .eq('id', memberId)
    .eq('couple_id', couple_id);

  if (uErr) {
    console.error('[DELETE /couple/circle/member] update error:', uErr.message);
    return errRes(res, 500, 'Could not remove member.');
  }

  console.log(`[DELETE /couple/circle/member] removed member=${memberId} couple=${couple_id} name=${member.invitee_name}`);
  return okRes(res, { member_id: memberId, status: 'removed' });
}));
// Must come before /:coupleId to avoid Express matching 'member' as a coupleId.
router.get('/member/:memberId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { memberId } = req.params;

  // Verify member belongs to this couple
  const { data: member, error: mErr } = await supabase
    .from('circle_members')
    .select('id, invitee_name, invitee_phone, role, status, joined_at')
    .eq('id', memberId)
    .eq('couple_id', couple_id)
    .maybeSingle();

  if (mErr) {
    console.error('[GET /couple/circle/member] member error:', mErr.message);
    return errRes(res, 500, 'Could not fetch member.');
  }
  if (!member) return errRes(res, 404, 'Member not found.');

  // Their activity — all types, chronological ascending for a story feel
  const { data: activity, error: aErr } = await supabase
    .from('circle_activity')
    .select('id, activity_type, actor_name, actor_role, subject_type, subject_id, payload, created_at')
    .eq('couple_id', couple_id)
    .eq('actor_name', member.invitee_name)  // scoped to this member by name
    .order('created_at', { ascending: true })
    .limit(100);

  if (aErr) {
    console.error('[GET /couple/circle/member] activity error:', aErr.message);
    return errRes(res, 500, 'Could not fetch member activity.');
  }

  const saveLookup = await enrichSaveActivity(supabase, activity || []);
  const shaped = (activity || []).map(a => shapeActivity(a, saveLookup));

  return okRes(res, {
    member: {
      id:             member.id,
      invitee_name:   member.invitee_name,
      invitee_phone:  member.invitee_phone || null,
      role:           member.role,
      status:         member.status,
      joined_at:      member.joined_at,
    },
    activity: shaped,
  });
}));

// ── GET /:coupleId — unified enriched feed ────────────────────────────────────
router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  // Active members (include invitee_phone for WhatsApp/call buttons)
  const { data: members, error: mErr } = await supabase
    .from('circle_members')
    .select('id, invitee_name, invitee_phone, role, status, joined_at, created_at')
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

  // Activity feed — ascending for timeline/scrapbook feel, newest at bottom
  const { data: activity, error: aErr } = await supabase
    .from('circle_activity')
    .select('id, activity_type, actor_name, actor_role, subject_type, subject_id, payload, created_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: true })
    .limit(100);

  if (aErr) {
    console.error('[GET /couple/circle] activity error:', aErr.message);
    return errRes(res, 500, 'Could not fetch circle.');
  }

  // Enrich save_added rows with muse_save image data (one batch query)
  const saveLookup = await enrichSaveActivity(supabase, activity || []);
  const shapedActivity = (activity || []).map(a => shapeActivity(a, saveLookup));

  const shapedMembers = (members || []).map(m => ({
    id:             m.id,
    invitee_name:   m.invitee_name,
    invitee_phone:  m.invitee_phone || null,
    role:           m.role,
    status:         m.status,
    joined_at:      m.joined_at,
    last_active:    m.joined_at || null,
  }));

  return okRes(res, {
    members:         shapedMembers,
    activity:        shapedActivity,
    pending_invites: (pending || []).map(p => ({
      id:           p.id,
      invitee_name: p.invitee_name,
      role:         p.role,
      expires_at:   p.expires_at || null,
      created_at:   p.created_at,
    })),
  });
}));

module.exports = router;
