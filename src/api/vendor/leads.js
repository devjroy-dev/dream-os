// src/api/vendor/leads.js
// Vendor leads resource — two handlers in one router:
//   GET   /api/v2/vendor/leads/:vendorId         — pipeline list with filters
//   PATCH /api/v2/vendor/leads/:leadId/state     — move lead through pipeline
//
// Auth: vendor JWT.
// Ownership:
//   GET   — :vendorId in URL must match the JWT vendor (resolveVendor mode B).
//   PATCH — :leadId in URL must belong to the JWT vendor (resolveVendor mode C).
//
// Field mappings (contract <- schema):
//   referrer        <-  referrer_name
//   budget_total    <-  budget_max         (see today.js header for rationale)
//
// PATCH state behaviour:
//   1. Validates state against {new, contacted, quoted, booked, lost}.
//   2. UPDATEs leads.state (trigger bumps updated_at).
//   3. If request.body.reason is present and non-empty, INSERTs a row into
//      the notes table tagged ['lead','state_change'] with the old and new
//      states and the reason. The WhatsApp agent surfaces these naturally
//      via its recentNotes snapshot in the system prompt.
//   4. Reason-less state changes succeed without writing a note.
//
// Why notes table for state-change reasons:
//   - Existing audit-trail surface in the schema.
//   - Already linked to vendor_id with tags, content, timestamps.
//   - WhatsApp agent's recentNotes fetch already reads from it — so the agent
//     gets the audit trail for free without any prompt or tool changes.
//   - No schema migration needed.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');

const asyncHandler   = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createLead, updateLead, loseLead, getLeadDetail } = require('../../lib/vendor/leads');

const ALLOWED_STATES         = ['new', 'contacted', 'quoted', 'booked', 'lost'];
const ACTIVE_PIPELINE_STATES = ['new', 'contacted', 'quoted'];

// ─── GET /api/v2/vendor/leads/:vendorId ────────────────────────────────
//
// Query params:
//   ?state=new|contacted|quoted|booked|lost|all
//     - omitted / empty   -> default active pipeline (new+contacted+quoted)
//     - explicit value    -> filter to that single state
//     - 'all'             -> no state filter (every lead)
//   ?limit=20&offset=0    -> default limit 20, max 100

// ─── GET /api/v2/vendor/leads/:leadId/detail ──────────────────────────────
//
// Lead detail — full profile, vendor_summary, couple conversation, linked records.
// Auth: requireAuth. resolveVendor mode C via leads table.

router.get('/:leadId/detail', requireAuth,
  resolveVendor({ paramName: 'leadId', via: 'leads' }),
  asyncHandler(async (req, res) => {
    const supabase = req.app.locals.supabase;
    const vendor   = req.vendor;
    const leadId   = req.params.leadId;

    const result = await getLeadDetail(supabase, vendor.id, leadId);
    if (!result.ok) return errRes(res, 404, result.error);
    return okRes(res, result);
  })
);

router.get('/:vendorId', requireAuth, resolveVendor({ paramName: 'vendorId' }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;

  const stateQ = (req.query.state || '').trim();
  const limit  = Math.max(1, Math.min(100, parseInt(req.query.limit, 10)  || 20));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

  // Resolve state filter.
  let stateFilter;
  if (!stateQ) {
    stateFilter = ACTIVE_PIPELINE_STATES;
  } else if (stateQ === 'all') {
    stateFilter = null;
  } else if (ALLOWED_STATES.includes(stateQ)) {
    stateFilter = [stateQ];
  } else {
    return res.status(400).json({
      ok: false,
      error: `Invalid state. Must be one of: ${ALLOWED_STATES.join(', ')}, all.`,
    });
  }

  // Build data + count queries in parallel.
  const dataSelect  = 'id, name, wedding_date, wedding_city, budget_max, state, source, referrer_name, raw_message, created_at';
  let dataQuery     = supabase.from('leads').select(dataSelect).eq('vendor_id', vendor.id);
  let countQuery    = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id);

  if (stateFilter) {
    dataQuery  = dataQuery.in('state', stateFilter);
    countQuery = countQuery.in('state', stateFilter);
  }

  dataQuery = dataQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const [
    { data: rows,  error: dataErr },
    { count,       error: countErr },
  ] = await Promise.all([dataQuery, countQuery]);

  if (dataErr || countErr) {
    console.error('[GET /vendor/leads] supabase error:', (dataErr || countErr).message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  const leads = (rows || []).map(l => ({
    id:           l.id,
    name:         l.name,
    wedding_date: l.wedding_date,
    wedding_city: l.wedding_city,
    budget_total: l.budget_max,
    state:        l.state,
    source:       l.source,
    referrer:     l.referrer_name,
    raw_message:  l.raw_message,
    created_at:   l.created_at,
  }));

  return res.json({
    ok:    true,
    leads,
    total: count || 0,
  });
});

// ─── PATCH /api/v2/vendor/leads/:leadId/state ──────────────────────────


// ─── POST / — create a new lead ───────────────────────────────────────────────
router.post('/', requireAuth, resolveVendor(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const {
    bride_name, name, phone, email,
    wedding_date, wedding_city, event_types,
    budget_min, budget_max, source, referrer_name, raw_message, notes,
  } = req.body;

  const leadName = name || bride_name;
  if (!leadName) return errRes(res, 400, 'bride_name is required.');

  const result = await createLead(supabase, vendor.id, {
    name: leadName, phone, email, wedding_date, wedding_city,
    event_types, budget_min, budget_max, source, referrer_name, raw_message, notes,
  });
  if (!result.ok) return errRes(res, 400, result.error);
  return res.status(201).json({ ok: true, data: result.lead, deduped: result.deduped || false });
}));

router.patch('/:leadId/state', requireAuth, resolveVendor({ paramName: 'leadId', via: 'leads' }), async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const leadId   = req.params.leadId;

  const body     = req.body || {};
  const newState = (body.state || '').trim();
  const reason   = typeof body.reason === 'string' ? body.reason.trim() : null;

  if (!ALLOWED_STATES.includes(newState)) {
    return res.status(400).json({
      ok: false,
      error: `Invalid state. Must be one of: ${ALLOWED_STATES.join(', ')}.`,
    });
  }

  // Capture the existing state for audit-trail context.
  // resolveVendor confirmed the row exists and belongs to this vendor, so we
  // re-fetch one column (state) to compose the note. Tiny query, no race risk
  // that matters: even if a concurrent write changed state, the audit note
  // still records the state-as-perceived at PATCH time.
  const { data: existing, error: existingErr } = await supabase
    .from('leads')
    .select('state, name')
    .eq('id', leadId)
    .maybeSingle();

  if (existingErr || !existing) {
    console.error('[PATCH /vendor/leads/:leadId/state] existing lookup error:', existingErr?.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  const oldState = existing.state;
  const leadName = existing.name || 'unnamed lead';

  // Update state.
  const { data: updated, error: updateErr } = await supabase
    .from('leads')
    .update({ state: newState })
    .eq('id', leadId)
    .select('id, state')
    .maybeSingle();

  if (updateErr || !updated) {
    console.error('[PATCH /vendor/leads/:leadId/state] update error:', updateErr?.message);
    return res.status(500).json({ ok: false, error: 'Update failed.' });
  }

  // If a reason was provided, log it to notes. Reason absence is not an error.
  if (reason) {
    const noteContent = `Lead "${leadName}" state: ${oldState} → ${newState}. Reason: ${reason}`;
    const { error: noteErr } = await supabase
      .from('notes')
      .insert({
        vendor_id: vendor.id,
        content:   noteContent,
        tags:      ['lead', 'state_change'],
      });
    if (noteErr) {
      // Audit log failure should not fail the state change.
      console.error('[PATCH /vendor/leads/:leadId/state] note insert error (state change succeeded):', noteErr.message);
    }
  }

  return res.json({
    ok:   true,
    lead: { id: updated.id, state: updated.state },
  });
});

// ─── PATCH /api/v2/vendor/leads/:leadId ────────────────────────────────
//
// Full field update. Distinct from PATCH /:leadId/state.
// State changes still go through the state endpoint so the notes audit
// trail stays consistent.
// Auth: requireAuth. resolveVendor mode C via leads table.

router.patch('/:leadId', requireAuth, resolveVendor({ paramName: 'leadId', via: 'leads' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const leadId   = req.params.leadId;
  const body     = req.body || {};

  const result = await updateLead(supabase, vendor.id, leadId, body);
  if (!result.ok) return errRes(res, 400, result.error);
  return okRes(res, { lead: result.lead });
}));


module.exports = router;
