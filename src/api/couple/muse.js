// src/api/couple/muse.js
// Muse board endpoints — all require couple auth (applied in core.js).
//   POST   /api/v2/couple/muse/save
//   GET    /api/v2/couple/muse/:coupleId
//   DELETE /api/v2/couple/muse/:saveId
//   GET    /api/v2/couple/muse/saves/:saveId/activity

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { waNumberFor } = require('../../lib/waNumbers');   // F5 rider
const { ok: okRes, err: errRes } = require('../../lib/response');

// ── POST /save ────────────────────────────────────────────────────────────────
router.post('/save', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id, id: user_id } = req.coupleUser;
  const { vendor_id, image_url = null, share_to_circle = false } = req.body || {};

  if (!vendor_id) return errRes(res, 400, 'vendor_id is required.');

  // Helper: append a save_added activity to the circle feed (best-effort).
  const logCircleShare = async (saveId, vendorName) => {
    const { error: actErr } = await supabase.from('circle_activity').insert({
      couple_id,
      actor_user_id: user_id,
      actor_name:    'Bride',
      actor_role:    'bride',
      activity_type: 'save_added',
      subject_type:  'muse_save',
      subject_id:    saveId,
      payload:       { vendor_name: vendorName || null },
    });
    if (actErr) console.warn('[POST /muse/save] circle activity warn:', actErr.message);
  };

  // Resolve vendor name once if we'll be sharing
  let vendorName = null;
  if (share_to_circle) {
    const { data: v } = await supabase
      .from('vendors').select('business_name').eq('id', vendor_id).maybeSingle();
    vendorName = v?.business_name || null;
  }

  // Duplicate check: same vendor + same photo = already saved
  // Different photos from the same vendor are distinct saves
  let dupQuery = supabase
    .from('muse_saves')
    .select('id, save_number')
    .eq('couple_id', couple_id)
    .eq('vendor_id', vendor_id)
    .eq('source_type', 'vendor');

  if (image_url) {
    dupQuery = dupQuery.eq('image_url', image_url);
  } else {
    dupQuery = dupQuery.is('image_url', null);
  }

  const { data: existing } = await dupQuery.maybeSingle();

  if (existing) {
    if (share_to_circle) await logCircleShare(existing.id, vendorName);
    return okRes(res, { save_id: existing.id, save_number: existing.save_number, already_saved: true, shared_to_circle: !!share_to_circle });
  }

  // Get next save_number for this couple
  const { data: last } = await supabase
    .from('muse_saves')
    .select('save_number')
    .eq('couple_id', couple_id)
    .order('save_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const save_number = (last?.save_number || 0) + 1;

  const { data: newSave, error } = await supabase
    .from('muse_saves')
    .insert({
      couple_id,
      save_number,
      source_type:      'vendor',
      vendor_id,
      image_url:        image_url || null,
      saved_by_user_id: user_id,
      saved_by_role:    'bride',
    })
    .select('id, save_number')
    .single();

  if (error) {
    console.error('[POST /muse/save] insert error:', error.message);
    return errRes(res, 500, 'Could not save vendor.');
  }

  if (share_to_circle) await logCircleShare(newSave.id, vendorName);

  return okRes(res, { save_id: newSave.id, save_number: newSave.save_number, already_saved: false, shared_to_circle: !!share_to_circle });
}));

// ── GET /saves/:saveId/activity — must come before /:coupleId ─────────────────
router.get('/saves/:saveId/activity', asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { saveId } = req.params;

  const { data: save, error: saveErr } = await supabase
    .from('muse_saves')
    .select('id, image_url, vendor_id, vendor:vendors(business_name)')
    .eq('id', saveId)
    .eq('couple_id', couple_id)
    .maybeSingle();

  if (saveErr || !save) return errRes(res, 404, 'Save not found.');

  const { data: activity, error: actErr } = await supabase
    .from('circle_activity')
    .select('id, activity_type, actor_name, actor_role, payload, created_at')
    .eq('couple_id', couple_id)
    .eq('subject_id', saveId)
    .order('created_at', { ascending: true });

  if (actErr) {
    console.error('[GET /muse/saves/:saveId/activity] query error:', actErr.message);
    return errRes(res, 500, 'Could not fetch activity.');
  }

  const shaped = (activity || []).map(a => ({
    id:            a.id,
    activity_type: a.activity_type,
    member_name:   a.actor_name,
    role:          a.actor_role,
    content:       a.payload?.content || null,
    created_at:    a.created_at,
  }));

  return okRes(res, {
    save: {
      id:          save.id,
      image_url:   save.image_url            || null,
      vendor_name: save.vendor?.business_name || null,
    },
    activity: shaped,
  });
}));

// ── GET /:coupleId ────────────────────────────────────────────────────────────
router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;

  if (req.params.coupleId !== couple_id) {
    return errRes(res, 403, 'Forbidden.');
  }

  const saved_by = req.query.saved_by || 'all';
  const limit    = Math.min(100, Math.max(1, parseInt(req.query.limit,  10) || 50));
  const offset   = Math.max(0,               parseInt(req.query.offset, 10) || 0);

  let query = supabase
    .from('muse_saves')
    .select(`
      id, save_number, image_url, source_type, vendor_id,
      caption, aesthetic_tags, saved_by_role, circle_comment_count, created_at,
      vendor:vendors(id, business_name, city, category, rate_min, aesthetic_tags, routing_handle)
    `, { count: 'exact' })
    .eq('couple_id', couple_id)
    .order('save_number', { ascending: false })
    .range(offset, offset + limit - 1);

  if (saved_by === 'bride')         query = query.eq('saved_by_role', 'bride');
  if (saved_by === 'circle_member') query = query.eq('saved_by_role', 'circle_member');

  const { data: saves, error, count } = await query;
  if (error) {
    console.error('[GET /muse/:coupleId] query error:', error.message);
    return errRes(res, 500, 'Could not fetch saves.');
  }

  const ENQUIRE_BASE = `https://wa.me/${waNumberFor('vendor')}?text=TDW-`;

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
    vendor_vibe_tags:      s.vendor?.aesthetic_tags     || [],
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

  return okRes(res, { saves: shaped, total: count || 0 });
}));

// ── DELETE /:saveId ───────────────────────────────────────────────────────────
router.delete('/:saveId', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id, id: user_id } = req.coupleUser;
  const { saveId } = req.params;

  const { data: save, error: fetchErr } = await supabase
    .from('muse_saves')
    .select('id, couple_id, saved_by_user_id, saved_by_role')
    .eq('id', saveId)
    .eq('couple_id', couple_id)
    .maybeSingle();

  if (fetchErr || !save) return errRes(res, 404, 'Save not found.');

  // Circle members can only delete their own saves
  if (save.saved_by_role === 'circle_member' && save.saved_by_user_id !== user_id) {
    return errRes(res, 403, 'You can only remove your own saves.');
  }

  const { error: delErr } = await supabase
    .from('muse_saves')
    .delete()
    .eq('id', saveId);

  if (delErr) {
    console.error('[DELETE /muse/:saveId] delete error:', delErr.message);
    return errRes(res, 500, 'Could not remove save.');
  }

  return okRes(res);
}));

// ── POST /upload — direct image upload from Frost PWA ──────────────────────
// Body (JSON): { image_base64: string, mime: string, caption?: string }
// image_base64 is the raw base64 payload (data URI prefix is stripped if present).
// mime is the file's content type (e.g. "image/jpeg", "image/png", "image/webp").
//
// Runs the same Cloudinary + Vision + Haiku tagging pipeline as the WhatsApp
// path. Inserts a muse_saves row with source_type='image' and the bride's
// caption (if provided). Returns the new save id and resolved aesthetic tags.
router.post('/upload', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const anthropic = req.app.locals.anthropic;
  const { couple_id, id: user_id } = req.coupleUser;
  const { image_base64, mime, mime_type, caption, surface } = req.body || {};
  const mimeType = mime || mime_type; // frontend may send either

  if (!image_base64 || typeof image_base64 !== 'string') {
    return errRes(res, 400, 'image_base64 is required.');
  }
  if (!mimeType || !mimeType.startsWith('image/')) {
    return errRes(res, 400, 'mime must be an image content type.');
  }

  // Decode base64 to Buffer. Strip any leading data URI prefix.
  const clean = image_base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  let buffer;
  try {
    buffer = Buffer.from(clean, 'base64');
  } catch (e) {
    return errRes(res, 400, 'image_base64 is not valid base64.');
  }
  if (buffer.length === 0) {
    return errRes(res, 400, 'image_base64 decoded to empty.');
  }

  // Run the full pipeline (Cloudinary upload + Vision + Haiku tagging)
  const { processImageForMuse } = require('../../lib/imagePipeline');
  let pipelineResult;
  try {
    pipelineResult = await processImageForMuse({
      bufferSource: { buffer, contentType: mimeType },
      couple_id,
      anthropic,
      runClassifier: surface === 'moments' ? false : false, // classifier handled by museSave for WA path
    });
  } catch (err) {
    console.error('[POST /muse/upload] pipeline error:', err.message);
    return errRes(res, 500, 'Could not process image. Try again.');
  }

  // Get next save_number for this couple
  const { data: last } = await supabase
    .from('muse_saves')
    .select('save_number')
    .eq('couple_id', couple_id)
    .order('save_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const save_number = (last?.save_number || 0) + 1;

  const { data: newSave, error } = await supabase
    .from('muse_saves')
    .insert({
      couple_id,
      save_number,
      source_type:      'image',
      vendor_id:        null,
      image_url:        pipelineResult.image_url,
      source_url:       null,
      vision_raw:       pipelineResult.vision_raw,
      aesthetic_tags:   pipelineResult.aesthetic_tags,
      caption:          (typeof caption === 'string' && caption.trim()) ? caption.trim() : null,
      saved_by_user_id: user_id,
      saved_by_role:    'bride',
      surface:          (surface === 'moments') ? 'moments' : 'muse',
    })
    .select('id, save_number, image_url, aesthetic_tags, created_at')
    .single();

  if (error) {
    console.error('[POST /muse/upload] insert error:', error.message);
    return errRes(res, 500, 'Could not save image to Muse.');
  }

  console.log(`[POST /muse/upload] couple=${couple_id} save=${newSave.id} surface=${surface||'muse'} tags=${(newSave.aesthetic_tags||[]).join(',')}`);
  return okRes(res, {
    save: {
      id:             newSave.id,
      save_number:    newSave.save_number,
      image_url:      newSave.image_url,
      caption:        null,
      saved_by_role:  'bride',
      surface:        (surface === 'moments') ? 'moments' : 'muse',
      created_at:     new Date().toISOString(),
      aesthetic_tags: newSave.aesthetic_tags || [],
    },
    // Legacy flat fields — kept for Muse room compatibility
    save_id:        newSave.id,
    save_number:    newSave.save_number,
    image_url:      newSave.image_url,
    aesthetic_tags: newSave.aesthetic_tags || [],
  });
}));

// ── POST /add-url — save image from URL (Pinterest/Instagram/direct) ───────
// Body (JSON): { url: string, caption?: string }
// Same pipeline as /upload but Cloudinary fetches the URL itself (for direct
// image URLs) or we extract og:image first (for Pinterest/IG pages).
router.post('/add-url', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const anthropic = req.app.locals.anthropic;
  const { couple_id, id: user_id } = req.coupleUser;
  const { url, caption } = req.body || {};

  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
    return errRes(res, 400, 'A valid http(s) URL is required.');
  }

  const { processImageForMuse } = require('../../lib/imagePipeline');
  let pipelineResult;
  try {
    pipelineResult = await processImageForMuse({
      sourceUrl: url,
      couple_id,
      anthropic,
      runClassifier: false,
    });
  } catch (err) {
    console.error('[POST /muse/add-url] pipeline error:', err.message);
    return errRes(res, 500, 'Could not save from that link. Check the URL and try again.');
  }

  const { data: last } = await supabase
    .from('muse_saves')
    .select('save_number')
    .eq('couple_id', couple_id)
    .order('save_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const save_number = (last?.save_number || 0) + 1;

  const { data: newSave, error } = await supabase
    .from('muse_saves')
    .insert({
      couple_id,
      save_number,
      source_type:      pipelineResult.source_type, // 'image' or 'link'
      vendor_id:        null,
      image_url:        pipelineResult.image_url,
      source_url:       pipelineResult.source_url,
      vision_raw:       pipelineResult.vision_raw,
      aesthetic_tags:   pipelineResult.aesthetic_tags,
      caption:          (typeof caption === 'string' && caption.trim()) ? caption.trim() : null,
      saved_by_user_id: user_id,
      saved_by_role:    'bride',
    })
    .select('id, save_number, image_url, aesthetic_tags')
    .single();

  if (error) {
    console.error('[POST /muse/add-url] insert error:', error.message);
    return errRes(res, 500, 'Could not save image to Muse.');
  }

  console.log(`[POST /muse/add-url] couple=${couple_id} save=${newSave.id} src=${pipelineResult.source_type}`);
  return okRes(res, {
    save_id:        newSave.id,
    save_number:    newSave.save_number,
    image_url:      newSave.image_url,
    aesthetic_tags: newSave.aesthetic_tags || [],
  });
}));

// ── PATCH /caption/:saveId — update caption on a muse_save (incl. moments) ──
// Body: { caption: string | null }
router.patch('/caption/:saveId', asyncHandler(async (req, res) => {
  const supabase     = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { saveId }   = req.params;
  const { caption }  = req.body || {};

  // Verify ownership
  const { data: existing, error: fErr } = await supabase
    .from('muse_saves')
    .select('id')
    .eq('id', saveId)
    .eq('couple_id', couple_id)
    .maybeSingle();

  if (fErr) {
    console.error('[PATCH /muse/caption] fetch error:', fErr.message);
    return errRes(res, 500, 'Could not update caption.');
  }
  if (!existing) return errRes(res, 404, 'Save not found.');

  const newCaption = (typeof caption === 'string' && caption.trim()) ? caption.trim() : null;

  const { error: uErr } = await supabase
    .from('muse_saves')
    .update({ caption: newCaption })
    .eq('id', saveId)
    .eq('couple_id', couple_id);

  if (uErr) {
    console.error('[PATCH /muse/caption] update error:', uErr.message);
    return errRes(res, 500, 'Could not update caption.');
  }

  return okRes(res, { save_id: saveId, caption: newCaption });
}));

module.exports = router;
