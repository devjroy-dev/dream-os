// src/api/vendor/binderWrite.js
// Binder WRITE endpoints — the screen's hands on the books.
//
// CRITICAL DISCIPLINE: these endpoints NEVER write raw SQL. Every mutation goes
// through executeKriyaTool — the SAME engine Kriya uses from the chat path. So a
// button tap and a chat dispatch share one discipline: ground-truth read before
// mutation, old→new confession into the note, an immutable event-trail row, money
// notation parsing, and the money-door firewall (money only via money-edit). The
// screen is simply another CALLER of Kriya's hands — not a second writer with
// weaker rules. The binder is only ever mutated through Kriya's primitives.
//
// The front end speaks REST (/money-edit, /stage, …); the tool vocabulary
// (kriya_*) is never exposed on the public surface — the display firewall holds.
//
// Ownership: executeKriyaTool scopes every query .eq('vendor_id', vendorId), so a
// vendor cannot touch another's binder even by guessing an id. Security is
// inherited from Kriya's existing scoping — not re-implemented here.
//
//   POST /api/v2/vendor/binders/:vendorId                 -> create (kriya_money or fields)
//   POST /api/v2/vendor/binders/:vendorId/:id/money-edit  -> kriya_money_edit  (witnessed money door)
//   POST /api/v2/vendor/binders/:vendorId/:id/stage       -> kriya_stage
//   POST /api/v2/vendor/binders/:vendorId/:id/note        -> kriya_note_append
//   POST /api/v2/vendor/binders/:vendorId/:id/date        -> kriya_date
//   POST /api/v2/vendor/binders/:vendorId/:id/edit        -> kriya_edit (non-money fields)
//   POST /api/v2/vendor/binders/:vendorId/:id/hide        -> kriya_hide
//   POST /api/v2/vendor/binders/:vendorId/:id/unarchive   -> kriya_unarchive

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');
const { executeKriyaTool } = require('../../agent/kriyaPrimitives');

// Full binder shape to return after a write so the screen repaints immediately.
const BINDER_SELECT =
  'id, client, amount, amount_received, amount_pending, payment_status, ' +
  'direction, date, stage, note, followup_on, followup_note, repeat_every, ' +
  'doc_ref, phone, reason_for_action, created_at, updated_at';

// Run a Kriya tool and return the (re-read) binder so the UI can repaint.
async function runTool(req, res, toolName, input) {
  const supabase = req.app.locals.supabase;
  const vendorId = req.vendor.id;
  try {
    const result = await executeKriyaTool(supabase, vendorId, toolName, input);
    if (result && result.error) {
      return res.status(400).json({ ok: false, error: result.display || 'Write refused.' });
    }
    // Re-read the affected binder (if we have its id) so the screen gets fresh truth.
    const binderId = result?.binder_id || input.binder_id || null;
    let binder = null;
    if (binderId) {
      const { data } = await supabase.from('binders')
        .select(BINDER_SELECT).eq('id', binderId).eq('vendor_id', vendorId).maybeSingle();
      binder = data || null;
    }
    return res.json({ ok: true, message: result?.display || 'Done.', binder });
  } catch (e) {
    console.error(`[binderWrite ${toolName}]`, e.message);
    return res.status(500).json({ ok: false, error: 'Write failed.' });
  }
}

const auth = [requireAuth, resolveVendor({ paramName: 'vendorId' })];

// CREATE — open a binder, mirroring the PROVEN enquiryBinder path: a binder is
// born by calling a field-write tool with NO binder_id (writeFields inserts a new
// row). We open with kriya_client (names the binder), then chain the other given
// cells onto it — exactly as enquiryBinder.js does. All through Kriya's hands.
router.post('/:vendorId', ...auth, async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendorId = req.vendor.id;
  const b = req.body || {};
  try {
    // 1. Open the binder by name (no binder_id -> new row). A name is required to open.
    const clientName = (b.client && String(b.client).trim()) || 'New lead';
    const opened = await executeKriyaTool(supabase, vendorId, 'kriya_client', { client: clientName });
    if (opened && opened.error) return res.status(400).json({ ok: false, error: opened.display });
    const binderId = opened.binder_id;
    if (!binderId) return res.status(500).json({ ok: false, error: 'Could not open binder.' });

    // 2. Chain the rest of the given cells onto the new binder, each through Kriya.
    if (b.phone) await executeKriyaTool(supabase, vendorId, 'kriya_phone', { binder_id: binderId, phone: b.phone });
    if (b.date)  await executeKriyaTool(supabase, vendorId, 'kriya_date',  { binder_id: binderId, date: b.date });
    if (b.note)  await executeKriyaTool(supabase, vendorId, 'kriya_note',  { binder_id: binderId, note: b.note });
    if (b.doc_ref) await executeKriyaTool(supabase, vendorId, 'kriya_doc', { binder_id: binderId, doc_ref: b.doc_ref });
    // Stage defaults to 'lead' (a new name is a lead until the owner says client).
    await executeKriyaTool(supabase, vendorId, 'kriya_stage', { binder_id: binderId, stage: (b.stage && String(b.stage).trim()) || 'lead' });
    // Money, if given, lands through the money door (witnessed).
    if (b.amount != null && (b.direction === 'in' || b.direction === 'out')) {
      await executeKriyaTool(supabase, vendorId, 'kriya_money', { binder_id: binderId, amount: String(b.amount), direction: b.direction });
    }

    // 3. Re-read the finished binder so the screen paints it whole.
    const { data: binder } = await supabase.from('binders')
      .select(BINDER_SELECT).eq('id', binderId).eq('vendor_id', vendorId).maybeSingle();
    return res.json({ ok: true, message: `Opened binder for ${clientName}.`, binder });
  } catch (e) {
    console.error('[binderWrite create]', e.message);
    return res.status(500).json({ ok: false, error: 'Create failed.' });
  }
});

// MONEY — the witnessed door (confession + event trail + note line).
router.post('/:vendorId/:id/money-edit', ...auth, (req, res) => {
  const b = req.body || {};
  return runTool(req, res, 'kriya_money_edit', {
    binder_id: req.params.id,
    amount: b.amount, direction: b.direction,
    amount_received: b.amount_received, amount_pending: b.amount_pending,
    payment_status: b.payment_status,
  });
});

router.post('/:vendorId/:id/stage', ...auth, (req, res) =>
  runTool(req, res, 'kriya_stage', { binder_id: req.params.id, stage: (req.body || {}).stage }));

router.post('/:vendorId/:id/note', ...auth, (req, res) =>
  runTool(req, res, 'kriya_note_append', { binder_id: req.params.id, note: (req.body || {}).note }));

router.post('/:vendorId/:id/date', ...auth, (req, res) =>
  runTool(req, res, 'kriya_date', { binder_id: req.params.id, date: (req.body || {}).date }));

// EDIT — non-money fields only (kriya_edit refuses money; money goes to money-edit).
router.post('/:vendorId/:id/edit', ...auth, (req, res) => {
  const b = req.body || {};
  return runTool(req, res, 'kriya_edit', {
    binder_id: req.params.id,
    client: b.client, date: b.date, note: b.note, phone: b.phone,
    doc_ref: b.doc_ref, stage: b.stage, reason_for_action: b.reason_for_action,
  });
});

router.post('/:vendorId/:id/hide', ...auth, (req, res) =>
  runTool(req, res, 'kriya_hide', { binder_id: req.params.id }));

router.post('/:vendorId/:id/unarchive', ...auth, (req, res) =>
  runTool(req, res, 'kriya_unarchive', { binder_id: req.params.id }));

module.exports = router;
