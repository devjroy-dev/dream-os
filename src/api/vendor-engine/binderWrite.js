'use strict';
// src/api/vendor-engine/binderWrite.js
// Vendor Suit, Phase 3-C — engine-backed binder WRITE doors.
//
// A faithful mirror of src/api/vendor/binderWrite.js, with the operator swapped:
//   executeKriyaTool(supabase, vendorId, 'kriya_*', input)
//     -> executeRecordTool(req.agentId, 'donna_*', input)
//
// Same discipline, not re-implemented: every mutation goes through the engine's
// real hands. Money only ever moves through donna_money_edit (the witnessed door:
// ground-truth read, old->new confession into the note, an event-trail row). The
// open-binder default (writeFields inserts a new row when binder_id is omitted)
// births a binder on create. "The screen is just another caller" — the same hands
// the chat path uses, now Donna's. Ownership: executeRecordTool scopes every query
// .eq('agent_id', agentId); resolveVendor has already asserted JWT ownership of
// :vendorId, and resolveAgent maps it to this vendor's own agent.
//
//   POST /api/v2/vendor-e/binders/:vendorId                -> create (donna_client + chain)
//   POST /api/v2/vendor-e/binders/:vendorId/:id/money-edit -> donna_money_edit (witnessed)
//   POST /api/v2/vendor-e/binders/:vendorId/:id/stage      -> donna_stage
//   POST /api/v2/vendor-e/binders/:vendorId/:id/note       -> donna_note_append
//   POST /api/v2/vendor-e/binders/:vendorId/:id/date       -> donna_date
//   POST /api/v2/vendor-e/binders/:vendorId/:id/edit       -> donna_edit (non-money)
//   POST /api/v2/vendor-e/binders/:vendorId/:id/hide       -> donna_hide
//   POST /api/v2/vendor-e/binders/:vendorId/:id/unarchive  -> donna_unarchive
const express       = require('express');
const router        = express.Router();
const requireAuth   = require('../middleware/requireAuth');
const resolveVendor = require('../middleware/resolveVendor');
const resolveAgent  = require('../middleware/resolveAgent');
// The compiled engine hands (Phase 0 landed src/engine; dist is built on deploy).
const { executeAndPatch } = require('../../lib/executeAndPatch');
const { logActivity } = require('../../lib/vendor/snapshot'); // TDW_04 engine-lane (ST-3d): binder doors log

// Full binder shape to return after a write so the screen repaints immediately.
const RECORD_SELECT =
  'id, client, amount, amount_received, amount_pending, payment_status, ' +
  'direction, date, stage, note, followup_on, followup_note, repeat_every, ' +
  'doc_ref, phone, reason_for_action, created_at, updated_at';

// The engine returns failures as { display: 'ERROR…' } — no separate .error field.
const isErr = (r) => !!r && typeof r.display === 'string' && r.display.startsWith('ERROR');

// Run a donna tool and return the (re-read) binder so the UI can repaint.
async function runTool(req, res, toolName, input) {
  // Drop undefined-valued keys so the engine's `field in input` checks see only
  // the cells the caller actually sent (money-edit/edit send a partial set).
  const clean = {}; for (const k in input) if (input[k] !== undefined) clean[k] = input[k];
  input = clean;
  const eng     = req.app.locals.supabase.schema('engine');
  const agentId = req.agentId;
  try {
    const result = await executeAndPatch(agentId, toolName, input);
    if (isErr(result)) {
      return res.status(400).json({ ok: false, error: result.display });
    }
    // New-binder id arrives as result.item.ref_id (raw uuid); updates carry input.binder_id.
    const binderId = (result && result.item && result.item.ref_id) || input.binder_id || null;
    let binder = null;
    if (binderId) {
      const { data } = await eng.from('records')
        .select(RECORD_SELECT).eq('id', binderId).eq('agent_id', agentId).maybeSingle();
      binder = data || null;
    }
    // TDW_04 engine-lane (ST-3d, absorbed 02-HOTFIX-2): every binder-door write logs
    // to vendor_activity_log — the assistant's cross-surface activity block finally
    // sees list-page/card binder mutations (the 38-minute blind spot). Action = the
    // tool name (logActivity's own convention). Fire-and-forget — never fails the write.
    logActivity(req.app.locals.supabase, {
      vendorId: req.vendor.id, surface: 'pwa', action: toolName,
      summary: `binder ${binder && binder.client ? `"${binder.client}"` : binderId || ''} — ${String((result && result.display) || toolName).split('\n')[0].slice(0, 140)}`,
      entityType: 'binder', entityId: binderId,
    }).catch(() => {});
    return res.json({ ok: true, message: (result && result.display) || 'Done.', binder });
  } catch (e) {
    console.error(`[vendor-e binderWrite ${toolName}]`, e.message);
    return res.status(500).json({ ok: false, error: 'Write failed.' });
  }
}

const auth = [requireAuth, resolveVendor({ paramName: 'vendorId' }), resolveAgent()];

// CREATE — open a binder by name (no binder_id -> new row, the open-binder default),
// then chain the given cells onto it, each through Donna's hands. Mirrors the proven
// create path: a name opens it, stage defaults to 'lead', money lands via the door.
router.post('/:vendorId', ...auth, async (req, res) => {
  const eng     = req.app.locals.supabase.schema('engine');
  const agentId = req.agentId;
  const b = req.body || {};
  try {
    const clientName = (b.client && String(b.client).trim()) || 'New lead';
    const opened = await executeAndPatch(agentId, 'donna_client', { client: clientName });
    if (isErr(opened)) return res.status(400).json({ ok: false, error: opened.display });
    const binderId = opened.item && opened.item.ref_id;
    if (!binderId) return res.status(500).json({ ok: false, error: 'Could not open binder.' });

    if (b.phone)   await executeAndPatch(agentId, 'donna_phone', { binder_id: binderId, phone: b.phone });
    if (b.date)    await executeAndPatch(agentId, 'donna_date',  { binder_id: binderId, date: b.date });
    if (b.note)    await executeAndPatch(agentId, 'donna_note',  { binder_id: binderId, note: b.note });
    if (b.doc_ref) await executeAndPatch(agentId, 'donna_doc',   { binder_id: binderId, doc_ref: b.doc_ref });
    await executeAndPatch(agentId, 'donna_stage', { binder_id: binderId, stage: (b.stage && String(b.stage).trim()) || 'lead' });
    if (b.amount != null && (b.direction === 'in' || b.direction === 'out')) {
      await executeAndPatch(agentId, 'donna_money', { binder_id: binderId, amount: String(b.amount), direction: b.direction });
    }

    const { data: binder } = await eng.from('records')
      .select(RECORD_SELECT).eq('id', binderId).eq('agent_id', agentId).maybeSingle();
    // TDW_04 engine-lane (ST-3d): the create door logs too. Fire-and-forget.
    logActivity(req.app.locals.supabase, {
      vendorId: req.vendor.id, surface: 'pwa', action: 'binder_create',
      summary: `binder "${clientName}" opened (list page / AddSheet)`,
      entityType: 'binder', entityId: binderId,
    }).catch(() => {});
    return res.json({ ok: true, message: `Opened binder for ${clientName}.`, binder });
  } catch (e) {
    console.error('[vendor-e binderWrite create]', e.message);
    return res.status(500).json({ ok: false, error: 'Create failed.' });
  }
});

// MONEY — the witnessed door (confession + event trail + note line). Unchanged engine.
router.post('/:vendorId/:id/money-edit', ...auth, (req, res) => {
  const b = req.body || {};
  return runTool(req, res, 'donna_money_edit', {
    binder_id: req.params.id,
    amount: b.amount, direction: b.direction,
    amount_received: b.amount_received, amount_pending: b.amount_pending,
    payment_status: b.payment_status,
  });
});

router.post('/:vendorId/:id/stage', ...auth, (req, res) =>
  runTool(req, res, 'donna_stage', { binder_id: req.params.id, stage: (req.body || {}).stage }));

router.post('/:vendorId/:id/note', ...auth, (req, res) =>
  runTool(req, res, 'donna_note_append', { binder_id: req.params.id, note: (req.body || {}).note }));

router.post('/:vendorId/:id/date', ...auth, (req, res) =>
  runTool(req, res, 'donna_date', { binder_id: req.params.id, date: (req.body || {}).date }));

// EDIT — non-money fields only (donna_edit refuses money; money goes to money-edit).
router.post('/:vendorId/:id/edit', ...auth, (req, res) => {
  const b = req.body || {};
  return runTool(req, res, 'donna_edit', {
    binder_id: req.params.id,
    client: b.client, date: b.date, note: b.note, phone: b.phone,
    doc_ref: b.doc_ref, stage: b.stage, reason_for_action: b.reason_for_action,
  });
});

router.post('/:vendorId/:id/hide', ...auth, (req, res) =>
  runTool(req, res, 'donna_hide', { binder_id: req.params.id }));

router.post('/:vendorId/:id/unarchive', ...auth, (req, res) =>
  runTool(req, res, 'donna_unarchive', { binder_id: req.params.id }));

module.exports = router;
