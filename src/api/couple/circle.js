// src/api/couple/circle.js
// GET  /api/v2/couple/circle/:coupleId        — enriched unified feed + members
// GET  /api/v2/couple/circle/member/:memberId — individual member feed
// POST /api/v2/couple/circle/invite           — invite a circle member
// PATCH /api/v2/couple/circle/member/:memberId/visibility — per-member switches
// Requires couple auth (applied in core.js).
//
// Enrichment: save_added activity rows are joined with muse_saves to inline
// image_url, caption, aesthetic_tags — one batch query, not N+1.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
// FORK E — the one home, now cited by the WRITE side too. `normaliseVisibility`
// owns which keys exist and what a value may be; `circlePermissions` owns what a
// stored fragment resolves to. Neither answer is re-implemented in this file.
const { circlePermissions, normaliseVisibility, VISIBILITY_KEYS } =
  require('../../lib/circlePermissions');

// ── POST /invite — must come before /:coupleId ────────────────────────────────
router.post('/invite', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  const { invitee_name, role, invitee_phone } = req.body || {};

  if (!invitee_name || !role) {
    return errRes(res, 400, 'invitee_name and role are required.');
  }

  const VALID_ROLES = ['partner', 'family', 'inner_circle'];
  if (!VALID_ROLES.includes(role)) {
    return errRes(res, 400, `role must be one of: ${VALID_ROLES.join(', ')}.`);
  }

  // Normalise optional phone to E.164 (bare 10-digit → +91). Empty = no phone.
  let phoneE164 = null;
  if (invitee_phone && String(invitee_phone).trim()) {
    const digits = String(invitee_phone).replace(/\D/g, '');
    if (digits.length === 10)      phoneE164 = `+91${digits}`;
    else if (digits.length > 10)   phoneE164 = `+${digits}`;
    if (phoneE164 && !/^\+[0-9]{8,15}$/.test(phoneE164)) phoneE164 = null;
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

  // Persist phone on the pending row (best-effort; non-fatal).
  if (phoneE164) {
    const { error: phoneErr } = await supabase
      .from('circle_members')
      .update({ invitee_phone: phoneE164 })
      .eq('id', row.id);
    if (phoneErr) console.warn('[POST /couple/circle/invite] phone save warn:', phoneErr.message);
  }

  // Build a recipient-addressed WhatsApp link carrying the WEB join URL, so the
  // bride opens a chat with the invitee and the message is the tappable link.
  // Falls back to a generic share link (no recipient) when no phone is given.
  const APP_ORIGIN = process.env.FROST_WEB_ORIGIN || 'https://thedreamwedding.in';
  const joinUrl    = `${APP_ORIGIN}/circle/join/${row.invite_token}`;
  const inviteText = `You're invited to join my wedding circle on The Dream Wedding ✦ Tap to join: ${joinUrl}`;
  const waMeLink   = phoneE164
    ? `https://wa.me/${phoneE164.replace(/\D/g, '')}?text=${encodeURIComponent(inviteText)}`
    : `https://wa.me/?text=${encodeURIComponent(inviteText)}`;

  return okRes(res, {
    invite_token: row.invite_token,
    join_url:     joinUrl,
    wa_me_link:   waMeLink,
    member_id:    row.id,
    has_phone:    !!phoneE164,
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

// ── PATCH /member/:memberId/visibility — the bride's per-member switches ─────
// TDW_14 D-1 (C-3). THE WRITE SIDE OF THE ONE HOME.
//
// WHY IT IS HERE AND NOT ON THE CIRCLE LANE. `visibility` is the BRIDE's
// decision about a member, never the member's about herself. This router is
// mounted behind couple auth (`core.js`), so the couple id comes off
// `req.coupleUser` and is never taken from the path — the same law
// `resolveCircleIdentityIfPresent.js:50-51` states one lane over: the proven
// identity wins over anything the request supplied. A member has no door to
// this at all, which is the point.
//
// PARTIAL BY CONSTRUCTION. The body is MERGED over the stored object, so the
// bride may flip one switch without restating the others and two screens editing
// different switches cannot silently undo each other. `visibility` is refused
// wholesale on any bad key or non-boolean value rather than partially applied:
// a request that half-lands is the worst answer available, because the caller
// believes it landed whole.
//
// THE ALLOWLIST IS NOT REPEATED HERE. `normaliseVisibility` lives beside the
// resolver, so the write side and the read side cannot disagree about which keys
// exist — the second-implementation disease this file's neighbour was extracted
// to end. The response returns the RESOLVED block through that same resolver, so
// the bride's screen is told the effective answer rather than the stored
// fragment, and is told it by the code the guard will use.
router.patch('/member/:memberId/visibility', asyncHandler(async (req, res) => {
  const supabase      = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { memberId }  = req.params;

  const patch = normaliseVisibility(req.body && req.body.visibility);
  if (!patch.ok) {
    return errRes(res, 400,
      `visibility must be one of: ${VISIBILITY_KEYS.join(', ')}, each true or false.`);
  }

  // Scoped read: `.eq('couple_id', couple_id)` is the whole authorisation. A
  // bride cannot address a member of another circle even by a correct uuid, and
  // the 404 is deliberately the same answer she gets for an id that does not
  // exist — a door that distinguished them would report other people's
  // membership to anyone willing to guess.
  const { data: member, error: fErr } = await supabase
    .from('circle_members')
    .select('id, visibility')
    .eq('id', memberId)
    .eq('couple_id', couple_id)
    .maybeSingle();

  if (fErr) {
    console.error('[PATCH /couple/circle/member/visibility] fetch error:', fErr.message);
    return errRes(res, 500, 'Could not update visibility.');
  }
  if (!member) return errRes(res, 404, 'Member not found.');

  // The stored value is normalised on the way OUT of the row as well as on the
  // way in: a row written before this column existed, or by a hand that predates
  // `normaliseVisibility`, must not survive a merge and be written back.
  const current = normaliseVisibility(member.visibility);
  const merged  = { ...(current.ok ? current.value : {}), ...patch.value };

  const { error: uErr } = await supabase
    .from('circle_members')
    .update({ visibility: merged })
    .eq('id', memberId)
    .eq('couple_id', couple_id);

  if (uErr) {
    console.error('[PATCH /couple/circle/member/visibility] update error:', uErr.message);
    return errRes(res, 500, 'Could not update visibility.');
  }

  // No member name, no phone, no flag values in the log line — this is a record
  // that a permission moved, not a copy of who may now see what.
  console.log(`[PATCH /couple/circle/member/visibility] member=${memberId} couple=${couple_id} keys=${Object.keys(patch.value).join(',')}`);

  return okRes(res, {
    member_id:   memberId,
    visibility:  merged,
    permissions: circlePermissions(merged),
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
