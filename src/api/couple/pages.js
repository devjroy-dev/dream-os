// src/api/couple/pages.js
// Bride Pages (diary) endpoints — all require couple auth.
//   GET    /api/v2/couple/pages/:coupleId           list entries (newest first)
//   POST   /api/v2/couple/pages                     create entry
//   DELETE /api/v2/couple/pages/:entryId            delete entry
//   GET    /api/v2/couple/pages/:coupleId/preview   one-line preview for Sanctuary row

'use strict';

const express      = require('express');
const router       = express.Router();
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// ── GET /:coupleId — list all entries newest first ───────────────────────────
router.get('/:coupleId', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { coupleId } = req.params;

  // Bride can only read her own pages.
  if (coupleId !== couple_id) return errRes(res, 403, 'forbidden');

  const limit  = Math.min(parseInt(req.query.limit, 10) || 50, 200);
  const offset = parseInt(req.query.offset, 10) || 0;

  const { data, error } = await supabase
    .from('bride_pages')
    .select('id, entry_date, mood, mood_color, body, created_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[couple-pages:list] error:', error);
    return errRes(res, 500, 'failed to load pages');
  }

  return okRes(res, { entries: data || [], total: (data || []).length });
}));

// ── GET /:coupleId/preview — one-line preview for Sanctuary row ──────────────
router.get('/:coupleId/preview', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { coupleId } = req.params;

  if (coupleId !== couple_id) return errRes(res, 403, 'forbidden');

  const { data, error } = await supabase
    .from('bride_pages')
    .select('body, created_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[couple-pages:preview] error:', error);
    return errRes(res, 500, 'failed to load preview');
  }

  if (!data) return okRes(res, { preview: null });

  // First 4-5 words, lowercase, torn-corner feel.
  const words = String(data.body || '').trim().split(/\s+/).slice(0, 5);
  const preview = words.join(' ').toLowerCase();

  return okRes(res, { preview, created_at: data.created_at });
}));

// ── POST / — create a new entry ──────────────────────────────────────────────
router.post('/', express.json({ limit: '64kb' }), asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id, id: user_id } = req.coupleUser;
  const { mood, mood_color, body, entry_date = null } = req.body || {};

  if (!mood || typeof mood !== 'string') {
    return errRes(res, 400, 'mood is required');
  }
  if (!mood_color || typeof mood_color !== 'string') {
    return errRes(res, 400, 'mood_color is required');
  }
  if (!body || typeof body !== 'string' || !body.trim()) {
    return errRes(res, 400, 'body is required');
  }
  if (body.length > 8000) {
    return errRes(res, 400, 'body exceeds 8000 character limit');
  }

  const insertRow = {
    couple_id,
    user_id,
    mood:       mood.trim(),
    mood_color: mood_color.trim(),
    body:       body.trim(),
  };
  if (entry_date) insertRow.entry_date = entry_date;

  const { data, error } = await supabase
    .from('bride_pages')
    .insert(insertRow)
    .select('id, entry_date, mood, mood_color, body, created_at')
    .single();

  if (error) {
    console.error('[couple-pages:create] error:', error);
    return errRes(res, 500, 'failed to save page');
  }

  return okRes(res, { entry: data });
}));

// ── DELETE /:entryId ─────────────────────────────────────────────────────────
router.delete('/:entryId', asyncHandler(async (req, res) => {
  const supabase  = req.app.locals.supabase;
  const { couple_id } = req.coupleUser;
  const { entryId } = req.params;

  // Verify ownership before deletion.
  const { data: row, error: fetchErr } = await supabase
    .from('bride_pages')
    .select('id, couple_id')
    .eq('id', entryId)
    .maybeSingle();

  if (fetchErr) {
    console.error('[couple-pages:delete] fetch error:', fetchErr);
    return errRes(res, 500, 'failed to delete page');
  }
  if (!row)                          return errRes(res, 404, 'page not found');
  if (row.couple_id !== couple_id)   return errRes(res, 403, 'forbidden');

  const { error } = await supabase
    .from('bride_pages')
    .delete()
    .eq('id', entryId);

  if (error) {
    console.error('[couple-pages:delete] error:', error);
    return errRes(res, 500, 'failed to delete page');
  }

  return okRes(res, { deleted: true });
}));

module.exports = router;
