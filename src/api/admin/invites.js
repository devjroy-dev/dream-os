// src/api/admin/invites.js
// Admin invite code management — generate, list, delete + WhatsApp links.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const crypto       = require('crypto');

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode() {
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) code += ALPHABET[bytes[i] % ALPHABET.length];
  return code;
}

const VENDOR_WA_NUMBER = process.env.TDW_WA_NUMBER   || '917982159047';
const COUPLE_WA_NUMBER = process.env.BRIDE_WA_NUMBER || '14787788550';

// GET /whatsapp-links
router.get('/whatsapp-links', requireAdmin, asyncHandler(async (req, res) => {
  return okRes(res, {
    vendor: `https://wa.me/${VENDOR_WA_NUMBER}`,
    couple: `https://wa.me/${COUPLE_WA_NUMBER}`,
    note:   'Share these links. When someone messages, the agent onboards them automatically.',
  });
}));

// GET /
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('invite_codes')
    .select(`code, kind, tier, intended_phone, notes, created_by,
             created_at, consumed_at, consumed_by_user_id,
             users:consumed_by_user_id(phone)`)
    .order('created_at', { ascending: false });
  if (error) return errRes(res, 500, error.message);

  const invites = (data || []).map(r => ({
    code:              r.code,
    kind:              r.kind,
    tier:              r.tier || null,
    intended_phone:    r.intended_phone || null,
    notes:             r.notes || null,
    created_by:        r.created_by || null,
    created_at:        r.created_at,
    consumed_at:       r.consumed_at || null,
    consumed_by_phone: r.users?.phone || null,
  }));

  return okRes(res, { invites, total: invites.length });
}));

// POST /generate
router.post('/generate', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { kind, tier, intended_phone, notes, count = 1 } = req.body;

  if (!kind || !['dreamer', 'maker'].includes(kind))
    return errRes(res, 400, 'kind is required: dreamer or maker.');

  const qty  = intended_phone ? 1 : Math.min(Math.max(1, parseInt(count) || 1), 50);
  const rows = Array.from({ length: qty }, () => ({
    code:           generateCode(),
    kind,
    tier:           tier || null,
    intended_phone: intended_phone || null,
    notes:          notes || null,
    created_by:     'admin',
  }));

  const { data, error } = await supabase.from('invite_codes').insert(rows).select('code, kind, tier, intended_phone');
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { codes: data, total: data.length });
}));

// DELETE /:code
router.delete('/:code', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const code     = req.params.code.toUpperCase();
  const { data: row } = await supabase.from('invite_codes').select('code, consumed_at').eq('code', code).single();
  if (!row) return errRes(res, 404, 'Invite code not found.');
  if (row.consumed_at) return errRes(res, 409, 'Cannot delete a consumed invite code.');
  const { error } = await supabase.from('invite_codes').delete().eq('code', code);
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { deleted: true });
}));

module.exports = router;
