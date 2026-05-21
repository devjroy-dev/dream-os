// src/api/circle/muse.js
// GET  /api/v2/circle/muse/:brideId?memberUserId=   — bride's Muse board
// POST /api/v2/circle/muse/save                     — add image to bride's Muse
// POST /api/v2/circle/muse/:saveId/comment          — comment on a specific save
//
// No JWT — coplanner sends no Authorization header.
// Auth: validate memberUserId is active circle_member of brideId couple.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

const ENQUIRE_BASE = 'https://wa.me/917982159047?text=TDW-';

// ── Validate circle member helper ─────────────────────────────────────────────
async function getCircleMember(supabase, memberUserId, coupleId) {
  if (!memberUserId) return null;
  // Get user's phone
  const { data: userRow } = await supabase
    .from('users').select('phone, name').eq('id', memberUserId).maybeSingle();
  if (!userRow) return null;
  // Find active circle_member by phone
  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, role, invitee_name, status')
    .eq('invitee_phone', userRow.phone)
    .eq('couple_id', coupleId)
    .eq('status', 'active')
    .maybeSingle();
  if (!member) return null;
  return { ...member, user_id: memberUserId, name: userRow.name || member.invitee_name };
}

// ── POST /save — before /:brideId ────────────────────────────────────────────
router.post('/save', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { memberUserId, image_url } = req.body || {};

  if (!memberUserId || !image_url) {
    return res.status(400).json({ success: false, error: 'memberUserId and image_url are required.' });
  }

  // Get user phone to find circle_member
  const { data: userRow } = await supabase
    .from('users').select('phone, name').eq('id', memberUserId).maybeSingle();
  if (!userRow) return res.status(403).json({ success: false, error: 'User not found.' });

  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, invitee_name, status')
    .eq('invitee_phone', userRow.phone)
    .eq('status', 'active')
    .maybeSingle();
  if (!member) return res.status(403).json({ success: false, error: 'Not an active circle member.' });

  const couple_id  = member.couple_id;
  const memberName = userRow.name || member.invitee_name || 'Circle member';

  // Next save_number
  const { data: last } = await supabase
    .from('muse_saves').select('save_number')
    .eq('couple_id', couple_id)
    .order('save_number', { ascending: false })
    .limit(1).maybeSingle();

  const save_number = (last?.save_number || 0) + 1;

  const { data: newSave, error: insertErr } = await supabase
    .from('muse_saves')
    .insert({
      couple_id,
      save_number,
      source_type:      'image',
      image_url,
      saved_by_user_id: memberUserId,
      saved_by_role:    'circle_member',
    })
    .select('id').single();

  if (insertErr) {
    console.error('[POST /circle/muse/save] insert error:', insertErr.message);
    return res.json({ success: false, error: 'Could not save image.' });
  }

  // Write circle_activity
  await supabase.from('circle_activity').insert({
    couple_id,
    actor_user_id:  memberUserId,
    actor_name:     memberName,
    actor_role:     'circle_member',
    activity_type:  'save_added',
    subject_type:   'muse_save',
    subject_id:     newSave.id,
    payload:        {},
  });

  return res.json({ success: true, save_id: newSave.id });
}));

// ── POST /:saveId/comment — before /:brideId ─────────────────────────────────
router.post('/:saveId/comment', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { saveId } = req.params;
  const { memberUserId, content } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'content is required.' });
  }

  const { data: userRow } = await supabase
    .from('users').select('phone, name').eq('id', memberUserId).maybeSingle();
  if (!userRow) return res.status(403).json({ success: false, error: 'User not found.' });

  const { data: member } = await supabase
    .from('circle_members')
    .select('id, couple_id, invitee_name, status')
    .eq('invitee_phone', userRow.phone).eq('status', 'active').maybeSingle();
  if (!member) return res.status(403).json({ success: false, error: 'Not an active circle member.' });

  // Confirm save belongs to this couple
  const { data: save } = await supabase
    .from('muse_saves').select('id')
    .eq('id', saveId).eq('couple_id', member.couple_id).maybeSingle();
  if (!save) return res.status(404).json({ success: false, error: 'Save not found.' });

  const memberName = userRow.name || member.invitee_name || 'Circle member';

  const { data: activity, error: actErr } = await supabase
    .from('circle_activity')
    .insert({
      couple_id:      member.couple_id,
      actor_user_id:  memberUserId,
      actor_name:     memberName,
      actor_role:     'circle_member',
      activity_type:  'comment',
      subject_type:   'muse_save',
      subject_id:     saveId,
      payload:        { content: content.trim() },
    })
    .select('id').single();

  if (actErr) {
    console.error('[POST /circle/muse/:saveId/comment] error:', actErr.message);
    return res.json({ success: false, error: 'Could not post comment.' });
  }

  // trg_circle_comment_inc fires automatically
  return res.json({ ok: true, activity_id: activity.id });
}));

// ── GET /:brideId ─────────────────────────────────────────────────────────────
router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase    = req.app.locals.supabase;
  const { brideId } = req.params;

  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit,  10) || 50));
  const offset = Math.max(0,              parseInt(req.query.offset, 10) || 0);

  const { data: saves, error } = await supabase
    .from('muse_saves')
    .select(`
      id, save_number, image_url, source_type, vendor_id,
      caption, aesthetic_tags, saved_by_role, circle_comment_count, created_at,
      vendor:vendors(id, business_name, city, category, rate_min, routing_handle)
    `)
    .eq('couple_id', brideId)
    .order('save_number', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[GET /circle/muse] query error:', error.message);
    return res.json({ success: false, error: 'Could not fetch board.' });
  }

  const shaped = (saves || []).map(s => ({
    id:                    s.id,
    save_number:           s.save_number,
    image_url:             s.image_url               || null,
    source_type:           s.source_type,
    vendor_id:             s.vendor_id               || null,
    vendor_name:           s.vendor?.business_name   || null,
    vendor_city:           s.vendor?.city            || null,
    vendor_category:       s.vendor?.category        || null,
    vendor_starting_price: s.vendor?.rate_min        || null,
    vendor_routing_handle: s.vendor?.routing_handle  || null,
    enquire_link:          s.vendor?.routing_handle
      ? `${ENQUIRE_BASE}${s.vendor.routing_handle}` : null,
    caption:               s.caption                 || null,
    aesthetic_tags:        s.aesthetic_tags          || [],
    saved_by_role:         s.saved_by_role,
    circle_comment_count:  s.circle_comment_count    || 0,
    created_at:            s.created_at,
  }));

  return res.json({ success: true, data: shaped });
}));

module.exports = router;
