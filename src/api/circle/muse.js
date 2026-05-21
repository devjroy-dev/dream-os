// src/api/circle/muse.js
// GET  /api/v2/circle/muse/:brideId         — bride's Muse board
// POST /api/v2/circle/muse/save             — add image to bride's Muse
// POST /api/v2/circle/muse/:saveId/comment  — comment on a specific save
//
// brideId = couple.id. Requires circle member auth.
// Frontend uploads image to Cloudinary before POST /save — no pipeline needed.
// Responses use { success, data } or { success, error }.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

const ENQUIRE_BASE = 'https://wa.me/917982159047?text=TDW-';

// ── POST /save — before /:brideId ────────────────────────────────────────────
router.post('/save', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id, user_id, name: memberName, co_planner_id } = req.circleMember;

  if (!req.circleMember.permissions?.can_contribute_muse) {
    return res.status(403).json({ success: false, error: 'Permission denied.' });
  }

  const { image_url } = req.body || {};
  if (!image_url) {
    return res.status(400).json({ success: false, error: 'image_url is required.' });
  }

  // Next save_number for this couple
  const { data: last } = await supabase
    .from('muse_saves')
    .select('save_number')
    .eq('couple_id', couple_id)
    .order('save_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const save_number = (last?.save_number || 0) + 1;

  const { data: newSave, error: insertErr } = await supabase
    .from('muse_saves')
    .insert({
      couple_id,
      save_number,
      source_type:      'image',
      image_url,
      saved_by_user_id: user_id,
      saved_by_role:    'circle_member',
    })
    .select('id, save_number')
    .single();

  if (insertErr) {
    console.error('[POST /circle/muse/save] insert error:', insertErr.message);
    return res.json({ success: false, error: 'Could not save image.' });
  }

  // Write circle_activity row — trigger will NOT fire (trigger is for comment type)
  await supabase.from('circle_activity').insert({
    couple_id,
    actor_user_id:    user_id,
    actor_name:       memberName || 'Circle member',
    actor_role:       'circle_member',
    activity_type:    'save_added',
    subject_type:     'muse_save',
    subject_id:       newSave.id,
    payload:          {},
  });

  return res.json({ success: true, save_id: newSave.id });
}));

// ── POST /:saveId/comment — before /:brideId ─────────────────────────────────
router.post('/:saveId/comment', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id, user_id, name: memberName } = req.circleMember;
  const { saveId } = req.params;
  const { content } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'content is required.' });
  }

  // Confirm save belongs to this couple
  const { data: save } = await supabase
    .from('muse_saves')
    .select('id')
    .eq('id', saveId)
    .eq('couple_id', couple_id)
    .maybeSingle();

  if (!save) {
    return res.status(404).json({ success: false, error: 'Save not found.' });
  }

  const { data: activity, error: actErr } = await supabase
    .from('circle_activity')
    .insert({
      couple_id,
      actor_user_id:    user_id,
      actor_name:       memberName || 'Circle member',
      actor_role:       'circle_member',
      activity_type:    'comment',
      subject_type:     'muse_save',
      subject_id:       saveId,
      payload:          { content: content.trim() },
    })
    .select('id')
    .single();

  if (actErr) {
    console.error('[POST /circle/muse/:saveId/comment] insert error:', actErr.message);
    return res.json({ success: false, error: 'Could not post comment.' });
  }

  // trg_circle_comment_inc trigger fires automatically on circle_activity INSERT
  return res.json({ ok: true, activity_id: activity.id });
}));

// ── GET /:brideId ─────────────────────────────────────────────────────────────
router.get('/:brideId', asyncHandler(async (req, res) => {
  const supabase     = req.app.locals.supabase;
  const { brideId }  = req.params;
  const { couple_id } = req.circleMember;

  if (brideId !== couple_id) {
    return res.status(403).json({ success: false, error: 'Forbidden.' });
  }

  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit,  10) || 50));
  const offset = Math.max(0,              parseInt(req.query.offset, 10) || 0);

  const { data: saves, error } = await supabase
    .from('muse_saves')
    .select(`
      id, save_number, image_url, source_type, vendor_id,
      caption, aesthetic_tags, saved_by_role, circle_comment_count, created_at,
      vendor:vendors(id, business_name, city, category, rate_min, routing_handle)
    `)
    .eq('couple_id', couple_id)
    .order('save_number', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[GET /circle/muse] query error:', error.message);
    return res.json({ success: false, error: 'Could not fetch board.' });
  }

  const shaped = (saves || []).map(s => ({
    id:                    s.id,
    save_number:           s.save_number,
    image_url:             s.image_url                  || null,
    source_type:           s.source_type,
    vendor_id:             s.vendor_id                  || null,
    vendor_name:           s.vendor?.business_name      || null,
    vendor_city:           s.vendor?.city               || null,
    vendor_category:       s.vendor?.category           || null,
    vendor_starting_price: s.vendor?.rate_min           || null,
    vendor_routing_handle: s.vendor?.routing_handle     || null,
    enquire_link:          s.vendor?.routing_handle
      ? `${ENQUIRE_BASE}${s.vendor.routing_handle}`
      : null,
    caption:               s.caption                    || null,
    aesthetic_tags:        s.aesthetic_tags             || [],
    saved_by_role:         s.saved_by_role,
    circle_comment_count:  s.circle_comment_count       || 0,
    created_at:            s.created_at,
  }));

  return res.json({ success: true, data: shaped });
}));

module.exports = router;
