// src/api/admin/prospects.js — admin surface for the prospect lane (Block 05, P3).
//
// Mounted at /api/v2/admin/prospects on the vendor/admin service (the same service that hosts
// /api/v2/admin/failed-turns). Follows the established admin sub-router shape verbatim:
// requireAdmin + asyncHandler + req.app.locals.supabase + ok/err. Field parity with the existing
// Vendor Pipeline intake: phone, ig_handle, name, category, city.
//
// Sends (send-opener) go through the real sendWa gate → the Meta Cloud API template transport.
// With Meta creds unset (Movement A) that path returns a typed 'meta_not_configured' error rather
// than a silent success — the live send is founder-gated (Movement B).
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { normalizeTo } = require('../../lib/metaCloud');
const { sendWa } = require('../../lib/sendWa');
const { readDailyCap } = require('../../lib/prospects');

const VALID_STATES = ['cold', 'templated', 'replied', 'in_session', 'converted', 'opted_out', 'expired'];
const VALID_SOURCES = ['sheet', 'manual', 'other'];
const CAP_KEY = 'marketing.daily_template_cap';

function cleanProspectInput(b) {
  return {
    phone:     b.phone ? normalizeTo(b.phone) : null,
    name:      b.name || null,
    ig_handle: b.ig_handle || b.ig || null,
    category:  b.category || null,
    city:      b.city || null,
  };
}

// GET / — state board (counts per state) + a filtered list. ?state, ?limit, ?offset.
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const state    = req.query.state || 'all';
  if (state !== 'all' && !VALID_STATES.includes(state)) {
    return errRes(res, 400, `state must be one of ${VALID_STATES.join(', ')} or 'all'.`);
  }
  const limit  = Math.min(parseInt(req.query.limit || '100', 10) || 100, 500);
  const offset = parseInt(req.query.offset || '0', 10) || 0;

  // counts per state (state board)
  const counts = {};
  for (const s of VALID_STATES) counts[s] = 0;
  const { data: all } = await supabase.from('prospects').select('state');
  for (const row of (all || [])) if (counts[row.state] != null) counts[row.state]++;

  let q = supabase
    .from('prospects')
    .select('id, phone, name, ig_handle, category, city, source, state, demo_vendor_ref, last_template_at, session_opened_at, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (state !== 'all') q = q.eq('state', state);

  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { prospects: data || [], counts, state, limit, offset });
}));

// POST / — manual add (source='manual'). phone required.
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const input = cleanProspectInput(req.body || {});
  if (!input.phone) return errRes(res, 400, 'phone is required.');

  const { data, error } = await supabase
    .from('prospects')
    .insert({ ...input, source: 'manual', state: 'cold' })
    .select('*').single();
  if (error) {
    if (error.code === '23505') return errRes(res, 409, 'A prospect with that phone already exists.', 'duplicate_phone');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { prospect: data });
}));

// POST /bulk — n8n / sheet flow. { prospects: [ {phone, name, ig_handle, category, city}, ... ] }
// source='sheet'. Duplicates by phone are skipped (not errored) so a re-run is idempotent.
router.post('/bulk', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const rows = Array.isArray(req.body && req.body.prospects) ? req.body.prospects : null;
  if (!rows) return errRes(res, 400, 'body.prospects must be an array.');

  const inserted = [], skipped = [], failed = [];
  for (const raw of rows) {
    const input = cleanProspectInput(raw);
    if (!input.phone) { failed.push({ input: raw, error: 'missing phone' }); continue; }
    const { data, error } = await supabase
      .from('prospects')
      .insert({ ...input, source: 'sheet', state: 'cold' })
      .select('id, phone').single();
    if (error) {
      if (error.code === '23505') skipped.push(input.phone);
      else failed.push({ phone: input.phone, error: error.message });
    } else {
      inserted.push(data);
    }
  }
  return okRes(res, { insertedCount: inserted.length, skippedCount: skipped.length, failedCount: failed.length, inserted, skipped, failed });
}));

// GET /cap — the current daily template cap (defaults to 25 when unseeded).
router.get('/cap', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const cap = await readDailyCap(supabase);
  return okRes(res, { cap });
}));

// PATCH /cap — set the cap. Upserts the admin_config key (works pre-seed; value stored as text).
router.patch('/cap', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const raw = req.body && req.body.cap;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return errRes(res, 400, 'cap must be a non-negative integer.');
  const { error } = await supabase
    .from('admin_config')
    .upsert({ key: CAP_KEY, value: String(n), description: 'Marketing new-prospect template cap per day (TDW_05 P3, W-9)' }, { onConflict: 'key' });
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { cap: n });
}));

// GET /:id/conversation — per-prospect conversation view (read): the prospect_marketing thread
// (joined by prospect_id, the 0085 owner model) and its messages, oldest-first.
router.get('/:id/conversation', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;

  const { data: prospect, error: pErr } = await supabase
    .from('prospects').select('*').eq('id', id).single();
  if (pErr || !prospect) return errRes(res, 404, 'Prospect not found.');

  const { data: conversation } = await supabase
    .from('conversations').select('*')
    .eq('prospect_id', id).eq('kind', 'prospect_marketing').maybeSingle();

  let messages = [];
  if (conversation) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, direction, channel, body, sent_by, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });
    messages = msgs || [];
  }
  return okRes(res, { prospect, conversation: conversation || null, messages });
}));

// POST /:id/send-opener — manual "send opener now". Sends marketing_opener, state → templated.
router.post('/:id/send-opener', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;

  const { data: p, error: pErr } = await supabase.from('prospects').select('*').eq('id', id).single();
  if (pErr || !p) return errRes(res, 404, 'Prospect not found.');
  if (p.state === 'opted_out') return errRes(res, 409, 'Prospect has opted out.', 'opted_out');

  try {
    await sendWa(
      { line: 'marketing', to: p.phone, templateKey: 'marketing_opener', vars: { name: p.name || 'there' }, supabase },
      {},
    );
  } catch (e) {
    return errRes(res, 502, `Opener send refused: ${e && e.message}`, (e && e.code) || 'send_failed');
  }

  const { data, error } = await supabase
    .from('prospects')
    .update({ state: 'templated', last_template_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id).select('id, state, last_template_at').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { prospect: data });
}));

// POST /:id/mark-converted — manual conversion (interim to the Block-08 nightly match).
router.post('/:id/mark-converted', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;
  const { data: p, error: pErr } = await supabase.from('prospects').select('id, state').eq('id', id).single();
  if (pErr || !p) return errRes(res, 404, 'Prospect not found.');
  if (p.state === 'opted_out') return errRes(res, 409, 'Prospect has opted out.', 'opted_out');

  const { data, error } = await supabase
    .from('prospects')
    .update({ state: 'converted', updated_at: new Date().toISOString() })
    .eq('id', id).select('id, state').single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { prospect: data });
}));

module.exports = router;
