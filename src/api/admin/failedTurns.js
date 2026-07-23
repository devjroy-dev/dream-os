// src/api/admin/failedTurns.js — TDW_05 Block 05, P1b (Movement B).
//
// Admin surface for dead-lettered inbound turns. A turn that throws is captured into
// `failed_turns` (webhookCore.captureDeadLetter) with its full inbound payload; this
// router lets an admin list them, replay one (re-drive the stored payload through the
// owning service's real webhook), or discard one.
//
// Mounted at /api/v2/admin/failed-turns (admin service = vendor; bride turns are
// replayed cross-service over HTTP). Auth is the same requireAdmin gate as every other
// admin API sub-router (cookie or x-admin-password).
//
// REPLAY is configuration-withheld (the CE's conditional-withheld rule): it re-POSTs to
// `${SELF_URL}/webhook/meta` carrying `x-internal-replay: INTERNAL_REPLAY_SECRET`.
//
// TDW_05 M2b (CE-62) — RETARGETED. This POSTed to /webhook/whatsapp, which the Twilio sunset
// DELETED; left alone, every replay would have hit a 404. The break carried no `twilio` string
// anywhere in this file, so the deletion census could not see it — it surfaced from the
// post-delete route sweep instead. Filed as F-05.21.
//
// TWO DISCLOSED LIMITS of the retarget, neither silent:
//   1. Pre-M2b dead letters hold TWILIO-SHAPED payloads (From/Body/MessageSid). Replayed at
//      /webhook/meta, normalizeMetaInbound yields ZERO messages and the turn no-ops. Replay of
//      legacy Twilio-era rows is a DECLARED GAP, not a working path.
//   2. /webhook/meta answers 200 BEFORE processing (Meta demands a fast ack), so `upstream.ok`
//      confirms DELIVERY, not that the turn ran. It always did for the Meta route; it now
//      applies to replay too. The dead-letter row's own state is the real signal.
// The target webhook trusts that header (webhookCore.isInternalReplay) ONLY when the
// secret is set and matches — so with the secret unset there is no bypass path at all,
// and replay returns a typed `replay_not_configured` rather than silently half-working.
'use strict';

const express      = require('express');
const router       = express.Router();
const requireAdmin = require('./requireAdmin');
const asyncHandler = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');

const VALID_STATES = ['dead', 'replayed', 'discarded'];

// Resolve the base URL of the service that owns a failed turn.
function selfUrlFor(service) {
  if (service === 'bride') return process.env.BRIDE_SELF_URL || null;
  return process.env.VENDOR_SELF_URL || null; // default: vendor
}

// GET / — list failed turns. ?state=dead|replayed|discarded (default dead), ?limit, ?offset.
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const state    = req.query.state || 'dead';
  if (state !== 'all' && !VALID_STATES.includes(state)) {
    return errRes(res, 400, `state must be one of ${VALID_STATES.join(', ')} or 'all'.`);
  }
  const limit  = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200);
  const offset = parseInt(req.query.offset || '0', 10) || 0;

  let q = supabase
    .from('failed_turns')
    .select('id, service, phone, payload, error, state, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (state !== 'all') q = q.eq('state', state);

  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { turns: data || [], state, limit, offset });
}));

// POST /:id/discard — mark a dead turn discarded (no replay).
router.post('/:id/discard', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;

  const { data: row, error: loadErr } = await supabase
    .from('failed_turns').select('id, state').eq('id', id).single();
  if (loadErr || !row) return errRes(res, 404, 'Failed turn not found.');
  if (row.state !== 'dead') return errRes(res, 409, `Already ${row.state}.`);

  const { data, error } = await supabase
    .from('failed_turns')
    .update({ state: 'discarded' })
    .eq('id', id)
    .select('id, state')
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { id: data.id, state: data.state });
}));

// POST /:id/replay — re-drive the stored payload through the owning service's webhook.
router.post('/:id/replay', requireAdmin, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { id }   = req.params;
  const doFetch  = req.app.locals.replayFetch || global.fetch; // injectable for tests

  const { data: row, error: loadErr } = await supabase
    .from('failed_turns').select('id, service, phone, payload, state').eq('id', id).single();
  if (loadErr || !row) return errRes(res, 404, 'Failed turn not found.');
  if (row.state !== 'dead') return errRes(res, 409, `Already ${row.state}.`);

  const secret = process.env.INTERNAL_REPLAY_SECRET;
  const base   = selfUrlFor(row.service);
  if (!secret || !base) {
    return errRes(res, 400,
      'Replay is not configured: set INTERNAL_REPLAY_SECRET and VENDOR_SELF_URL/BRIDE_SELF_URL.',
      'replay_not_configured');
  }

  let upstream;
  try {
    upstream = await doFetch(`${base}/webhook/meta`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-replay': secret },
      body: JSON.stringify(row.payload || {}),
    });
  } catch (e) {
    return errRes(res, 502, `Replay dispatch failed: ${e && e.message}`, 'replay_dispatch_failed');
  }

  if (!upstream || !upstream.ok) {
    return errRes(res, 502, `Replay target returned ${upstream && upstream.status}.`, 'replay_target_error');
  }

  const { data, error } = await supabase
    .from('failed_turns')
    .update({ state: 'replayed' })
    .eq('id', id)
    .select('id, state')
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { id: data.id, state: data.state, service: row.service });
}));

module.exports = router;
