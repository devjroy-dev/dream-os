// src/lib/vendor/availability.js
// Shared write logic for vendor availability blocks.
// Called by REST handlers and pwaEngine tool executors.

'use strict';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── blockDate ─────────────────────────────────────────────────────────────

async function blockDate(supabase, vendorId, blocked_date, reason) {
  if (!blocked_date || !DATE_RE.test(blocked_date)) {
    return { ok: false, error: 'blocked_date is required in YYYY-MM-DD format.' };
  }

  const { data: block, error } = await supabase
    .from('vendor_availability')
    .insert({ vendor_id: vendorId, blocked_date, reason: reason || null })
    .select('id, blocked_date, reason, created_at')
    .single();

  if (error && error.code === '23505') {
    return { ok: false, error: 'Already blocked.', code: 'ALREADY_BLOCKED' };
  }
  if (error) return { ok: false, error: error.message };
  return { ok: true, block };
}

// ── unblockDate ───────────────────────────────────────────────────────────
// Accepts either blockId (UUID) or blocked_date (YYYY-MM-DD).

async function unblockDate(supabase, vendorId, params) {
  const { block_id, date } = params;

  let query = supabase
    .from('vendor_availability')
    .delete()
    .eq('vendor_id', vendorId);

  if (block_id) {
    query = query.eq('id', block_id);
  } else if (date) {
    if (!DATE_RE.test(date)) return { ok: false, error: 'date must be in YYYY-MM-DD format.' };
    query = query.eq('blocked_date', date);
  } else {
    return { ok: false, error: 'Provide block_id or date.' };
  }

  const { error, count } = await query.select('id', { count: 'exact' });
  if (error) return { ok: false, error: error.message };
  if (count === 0) return { ok: false, error: 'Block not found.' };
  return { ok: true, deleted: true };
}

// ── listBlocks ────────────────────────────────────────────────────────────

async function listBlocks(supabase, vendorId, params) {
  const { from, to } = params || {};

  let query = supabase
    .from('vendor_availability')
    .select('id, blocked_date, reason, created_at', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .order('blocked_date', { ascending: true });

  if (from) query = query.gte('blocked_date', from);
  if (to)   query = query.lte('blocked_date', to);

  const { data: blocks, error, count } = await query;
  if (error) return { ok: false, error: error.message };
  return { ok: true, blocks: blocks || [], total: count || 0 };
}

module.exports = { blockDate, unblockDate, listBlocks };
