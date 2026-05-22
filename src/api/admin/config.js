// src/api/admin/config.js
// Admin config — read and update admin_config key/value store.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

// GET /
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('admin_config')
    .select('key, value, description, updated_at')
    .order('key', { ascending: true });
  if (error) return errRes(res, 500, error.message);
  const flat = {};
  for (const row of (data || [])) flat[row.key] = row.value;
  return okRes(res, { config: flat, rows: data || [] });
}));

// PATCH /:key
router.patch('/:key', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { key }  = req.params;
  const { value } = req.body;
  if (value === undefined || value === null || String(value).trim() === '')
    return errRes(res, 400, 'value is required.');
  const { data: existing } = await supabase.from('admin_config').select('key').eq('key', key).single();
  if (!existing) return errRes(res, 404, `Config key "${key}" not found.`);
  const { data, error } = await supabase
    .from('admin_config')
    .update({ value: String(value).trim(), updated_at: new Date().toISOString() })
    .eq('key', key)
    .select('key, value, updated_at')
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { key: data.key, value: data.value, updated_at: data.updated_at });
}));

module.exports = router;
