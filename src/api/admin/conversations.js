// src/api/admin/conversations.js
// Admin read-only conversations viewer.
// Lists recent vendor_self threads and couple_self/couple_thread conversations.
// Read-only — no writes. For Swati to audit agent quality.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// ─── GET /api/v2/admin/conversations/vendors ─────────────────────────────────
// Most recent vendor_self conversations (vendor ↔ agent on WhatsApp or PWA).
router.get('/vendors', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset   = parseInt(req.query.offset) || 0;

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id, kind, channel, state, last_message_at, created_at,
      vendors(id, business_name, category, city, tier, users(name, phone))
    `)
    .eq('kind', 'vendor_self')
    .order('last_message_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errRes(res, 500, error.message);

  const threads = (data || []).map(c => ({
    id:             c.id,
    kind:           c.kind,
    state:          c.state,
    last_message_at: c.last_message_at,
    created_at:     c.created_at,
    vendor_id:      c.vendors?.id,
    vendor_name:    c.vendors?.business_name || c.vendors?.users?.name || 'Unknown',
    vendor_phone:   c.vendors?.users?.phone,
    vendor_category: c.vendors?.category,
    vendor_tier:    c.vendors?.tier,
  }));

  return okRes(res, { threads, total: threads.length, offset, limit });
}));

// ─── GET /api/v2/admin/conversations/brides ──────────────────────────────────
// Most recent couple_self conversations (bride ↔ bride agent).
router.get('/brides', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const limit    = Math.min(parseInt(req.query.limit) || 20, 50);
  const offset   = parseInt(req.query.offset) || 0;

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id, kind, state, last_message_at, created_at,
      couples(id, wedding_date, wedding_city, users(name, phone))
    `)
    .eq('kind', 'couple_self')
    .order('last_message_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return errRes(res, 500, error.message);

  const threads = (data || []).map(c => ({
    id:              c.id,
    kind:            c.kind,
    state:           c.state,
    last_message_at: c.last_message_at,
    created_at:      c.created_at,
    couple_id:       c.couples?.id,
    bride_name:      c.couples?.users?.name || 'Unknown',
    bride_phone:     c.couples?.users?.phone,
    wedding_date:    c.couples?.wedding_date,
    wedding_city:    c.couples?.wedding_city,
  }));

  return okRes(res, { threads, total: threads.length, offset, limit });
}));

// ─── GET /api/v2/admin/conversations/:id/messages ────────────────────────────
// Last 50 messages for a given conversation.
router.get('/:id/messages', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data, error } = await supabase
    .from('messages')
    .select('id, direction, channel, body, sent_by, tool_calls, created_at')
    .eq('conversation_id', req.params.id)
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return errRes(res, 500, error.message);

  return okRes(res, { messages: data || [], total: (data || []).length });
}));

module.exports = router;
