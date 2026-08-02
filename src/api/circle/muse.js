// src/api/circle/muse.js
// GET  /api/v2/circle/muse/:brideId    — the bride's Muse board
// POST /api/v2/circle/muse/save        — add an image to the bride's Muse
// POST /api/v2/circle/muse/:saveId/comment
//
// ── F-07.72 ZIP 2 · CLASS A · GUARDED, AND ONE OF THESE DOORS HAD NOTHING ────
// `requireCircleMemberAuth` runs at this file's mount (`router.js`). The proven
// member arrives on `req.circleMember`; `memberUserId` is no longer read from a
// body or a query anywhere in this file, and `:brideId` no longer decides which
// couple's board is served.
//
// THE GET WAS THE LARGEST BEHAVIOURAL DELTA IN THIS ZIP AND THE CE RULED IT
// WALKED EXPLICITLY (FORK D). `GET /:brideId` had NO validation of any kind —
// not a token, not a membership check, not even the `memberUserId` the file's
// own header claimed it validated. It took a couple id and returned that
// couple's entire Muse board: every saved image, every vendor name, city,
// category and starting price, to anyone. The other two doors at least
// hand-rolled a membership lookup. This one is the reason "it worked before"
// carries no information here — before, it worked for everyone.
//
// ── THE QUERY/BODY PARAMETER IS DELETED, NOT IGNORED (F-07.56's law) ────────
// `?memberUserId=` and `body.memberUserId` were a client-supplied identity used
// to attribute a WRITE — `muse_saves.saved_by_user_id` and
// `circle_activity.actor_user_id` both took it straight from the caller. An
// accepted-but-unproven identity is a forgeable address; the same ruling that
// deleted `sender_name` from `messages.js` at F-07.107 applies here. The client
// still sends the query string (zero pwa bytes move for it) and the server no
// longer reads it.

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');

const { waNumberFor } = require('../../lib/waNumbers');
const ENQUIRE_BASE = `https://wa.me/${waNumberFor('vendor')}?text=TDW-`;

// ── F-07.116 CURED BY DELETION — THE HELPER NOBODY CALLED ───────────────────
// `getCircleMember(supabase, memberUserId, coupleId)` stood here: 17 lines,
// fully written, with ZERO callers anywhere in `src/` or `scripts/` — one
// occurrence in the whole estate, its own definition. The two POST handlers
// below re-implemented its body inline and the GET called nothing at all.
//
// F-07.99's class, third instance, and it was found inside the file this ZIP
// came to guard. The lesson that file taught is why it dies here rather than in
// a return trip: a definition nobody calls eventually gets called by accident,
// and this one would have been the obvious thing to reach for the next time
// someone needed a membership check — after the guard had already made one
// unnecessary.

// ── POST /save — before /:brideId ────────────────────────────────────────────
router.post('/save', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { image_url } = req.body || {};

  if (!image_url) {
    return res.status(400).json({ success: false, error: 'image_url is required.' });
  }

  // F-07.72 ZIP 2 — the two lookups that stood here (users by the SUPPLIED
  // memberUserId, then circle_members by that row's phone) are the guard's, and
  // the guard already ran. The attribution below is the PROVEN member's.
  const me         = req.circleMember;
  const couple_id  = me.couple_id;
  const memberName = me.name || 'Circle member';

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
      saved_by_user_id: me.user_id,
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
    actor_user_id:  me.user_id,
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
  const { content } = req.body || {};

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: 'content is required.' });
  }

  // F-07.72 ZIP 2 — the membership half is the guard's. THE CHECK BELOW STAYS:
  // "does this save belong to the couple whose circle she is in" is a DIFFERENT
  // question from "is she a member", and the guard answers only the second. This
  // is the one Class A door where the guard LAYERS rather than replaces.
  const me = req.circleMember;

  const { data: save } = await supabase
    .from('muse_saves').select('id')
    .eq('id', saveId).eq('couple_id', me.couple_id).maybeSingle();
  if (!save) return res.status(404).json({ success: false, error: 'Save not found.' });

  const memberName = me.name || 'Circle member';

  const { data: activity, error: actErr } = await supabase
    .from('circle_activity')
    .insert({
      couple_id:      me.couple_id,
      actor_user_id:  me.user_id,
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
  const supabase = req.app.locals.supabase;

  // FORK D — THE DOOR THAT HAD NOTHING. `:brideId` used to select the couple
  // whose board was returned, unvalidated, to an unauthenticated caller. It is
  // read no longer: the board served is the board of the couple the token bound.
  // The route keeps its shape so no client byte moves.
  const brideId = req.circleMember.couple_id;

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
