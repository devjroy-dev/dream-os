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
const resolveAgent   = require('../middleware/resolveAgent');           // TDW_02: DELETE door needs the agent for snapshot coherence
const { patchNote }  = require('../../engine/dist/core/donna');         // TDW_02: same confirmed-write patch path the filing side uses

const asyncHandler   = require('../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../lib/response');
const { createLead, updateLead, loseLead, getLeadDetail } = require('../../lib/vendor/leads');
const { logActivity } = require('../../lib/vendor/snapshot'); // TDW_04 engine-lane (ST-3d): lead doors log

// TDW_04 engine-lane (ST-3b): JS twin of the engine's phoneKey.ts / the PWA's
// cabinet.ts phoneKey — last 10 digits or null. Annotation-only (snapshot item
// match key); never drives a write.
function leadPhoneKey(p) {
  if (!p) return null;
  const digits = String(p).replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
}

// TDW_02 P3 — the wishbone wire (spec P3; consumed by TDW_03). A lead whose
// draft_meta stands gains a draft block: complete it inline via the PATCH door,
// or hand the gap to Victor with a primer the cursor lands after.
function leadDraftWire(l) {
  const dm = l.draft_meta;
  if (!dm || !Array.isArray(dm.missing) || dm.missing.length === 0) return undefined;
  const label = l.name || 'this lead';
  return {
    missing: dm.missing,
    complete_inline: { method: 'PATCH', path: `/api/v2/vendor/leads/${l.id}` },
    tell_victor: { path: '/vendor', primer: `About ${label}: the ${dm.missing[0]} is ` },
  };
}

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
    if (result.lead) result.lead.draft = leadDraftWire(result.lead); // TDW_02 P3 wishbone
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

  // Build data + count queries in parallel. Soft-deleted rows (deleted_at set — the
  // TDW_02 P1 undo door, and any prior soft-deletes) never appear in the pipeline.
  const dataSelect  = 'id, name, phone, wedding_date, wedding_date_precision, wedding_city, budget_max, state, source, referrer_name, raw_message, draft_meta, created_at';
  let dataQuery     = supabase.from('leads').select(dataSelect).eq('vendor_id', vendor.id).is('deleted_at', null);
  let countQuery    = supabase.from('leads').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id).is('deleted_at', null);

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
    id:                     l.id,
    name:                   l.name,
    phone:                  l.phone,
    wedding_date:           l.wedding_date,
    wedding_date_precision: l.wedding_date_precision,
    wedding_city:           l.wedding_city,
    budget_total: l.budget_max,
    state:        l.state,
    source:       l.source,
    referrer:     l.referrer_name,
    raw_message:  l.raw_message,
    created_at:   l.created_at,
    draft:        leadDraftWire(l), // TDW_02 P3 wishbone (undefined when complete)
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
  // TDW_04 engine-lane (ST-3d): lead doors log. Fire-and-forget.
  logActivity(supabase, {
    vendorId: vendor.id, surface: 'pwa', action: 'lead_create',
    summary: `lead "${leadName}" created (list page)${result.deduped ? ' — deduped onto existing' : ''}`,
    entityType: 'lead', entityId: result.lead && result.lead.id,
  }).catch(() => {});
  return res.status(201).json({ ok: true, data: result.lead, deduped: result.deduped || false });
}));


// TDW_02 P5 close (F5): every typed-plane door keeps Donna's snapshot true —
// the DELETE door already does; the PATCH doors join it. A rename/state change
// that only touches public.leads leaves a stale item Victor renders as a phantom
// (the "duplicate Ananya" exhibit). Fail-safe: a snapshot miss never fails the write.
async function patchLeadSnapshot(req, lead) {
  try {
    const val = lead.budget_max != null ? ` (Rs ${lead.budget_max})` : '';
    const state = lead.state || 'new';
    await patchNote(req.agentId, {
      display: 'lead snapshot sync (door)',
      item: {
        id: `lead:${lead.id}`, kind: 'lead',
        text: `${lead.name || 'unknown'} — lead, ${state}${val}`,
        status: (state === 'booked' || state === 'lost') ? 'confirmed' : 'open',
        horizon: null, ref_type: 'leads', ref_id: lead.id,
        // TDW_04 engine-lane (ST-3b): match keys, mirroring donnaLead's leadItem.
        name: lead.name || null,
        phone_key: leadPhoneKey(lead.phone),
      },
    });
  } catch (e) { console.warn('[leads:patch] snapshot sync failed (write landed):', e.message); }
}

router.patch('/:leadId/state', requireAuth, resolveVendor({ paramName: 'leadId', via: 'leads' }), resolveAgent(), async (req, res) => {
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
    .select('state, name, budget_max, phone')
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

  // F5: keep the snapshot item true to the new state (fail-safe inside).
  await patchLeadSnapshot(req, { id: leadId, name: leadName, state: newState, budget_max: existing.budget_max, phone: existing.phone });

  // TDW_04 engine-lane (ST-3d, absorbed 02-HOTFIX-2): the lead doors log to
  // vendor_activity_log so the assistant's cross-surface activity block sees list-page
  // mutations (the 38-minute blind spot). Fire-and-forget — never fails the write.
  // TDW_04 rider (CE-ruled 2026-07-15): no-op transitions (lost → lost) don't log —
  // a ledger that records non-events dilutes the ledger that caught a lying button.
  // The WRITE itself stays idempotent-permissive; only the log line is guarded.
  if (oldState !== newState) logActivity(supabase, {
    vendorId: vendor.id, surface: 'pwa', action: 'lead_state',
    summary: `lead "${leadName}" state: ${oldState} → ${newState} (list page)`,
    entityType: 'lead', entityId: leadId,
  }).catch(() => {});

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

router.patch('/:leadId', requireAuth, resolveVendor({ paramName: 'leadId', via: 'leads' }), resolveAgent(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const leadId   = req.params.leadId;
  const body     = req.body || {};

  const result = await updateLead(supabase, vendor.id, leadId, body);
  if (!result.ok) return errRes(res, 400, result.error);
  // TDW_04 engine-lane (ST-3d): lead doors log. Fire-and-forget.
  const changedKeys = Object.keys(body).join(', ') || 'fields';
  logActivity(supabase, {
    vendorId: vendor.id, surface: 'pwa', action: 'lead_update',
    summary: `lead "${(result.lead && result.lead.name) || leadId}" updated (${changedKeys}) (list page)`,
    entityType: 'lead', entityId: leadId,
  }).catch(() => {});
  return okRes(res, { lead: result.lead });
}));

// ─── DELETE /api/v2/vendor/leads/:leadId ──────────────────────────────
//
// TDW_02 P1 (Amendment One CE-2): the lead-create undo door. SOFT delete via
// the existing deleted_at column — the row survives at the DB (honest,
// reversible), and every CRUD read filters it out (list above; lib reads
// already filter deleted_at). Idempotent: deleting an already-deleted lead
// confirms rather than errors, so a double-tapped Undo never scares anyone.
//
// Snapshot coherence (founder-ruled with P2, transcript-(b) exhibit — Victor
// counted an undone lead): the delete also removes the `lead:<id>` item from
// Donna's snapshot via the same patchNote the filing side used. FAIL-SAFE:
// a snapshot miss never fails the delete — the row is already gone from the
// CRUD's truth; the snapshot self-heals on rebuild.
router.delete('/:leadId', requireAuth, resolveVendor({ paramName: 'leadId', via: 'leads' }), resolveAgent(), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const leadId   = req.params.leadId;

  const { data: existing, error: readErr } = await supabase
    .from('leads')
    .select('id, deleted_at')
    .eq('id', leadId)
    .eq('vendor_id', vendor.id)
    .maybeSingle();
  if (readErr) return errRes(res, 500, readErr.message);
  if (!existing) return errRes(res, 404, 'Lead not found.');
  if (existing.deleted_at) {
    // Idempotent HEALING: a re-tap on an already-deleted lead still clears any
    // orphaned snapshot item (pre-P2A deletes left them behind — the Priya case).
    try { await patchNote(req.agentId, { display: 'lead removed (undo, heal)', remove: `lead:${leadId}` }); }
    catch (e) { console.warn('[leads:delete] heal-path snapshot remove failed:', e.message); }
    return okRes(res, { deleted: { id: leadId }, already_deleted: true });
  }

  const { error } = await supabase
    .from('leads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', leadId)
    .eq('vendor_id', vendor.id);
  if (error) return errRes(res, 500, error.message);

  try {
    await patchNote(req.agentId, { display: 'lead removed (undo)', remove: `lead:${leadId}` });
  } catch (e) {
    console.warn('[leads:delete] snapshot remove failed (delete already landed):', e.message);
  }

  // TDW_04 engine-lane (ST-3d): lead doors log. Fresh deletes only — the idempotent
  // heal path above is a re-tap, not a new action. Fire-and-forget.
  logActivity(supabase, {
    vendorId: vendor.id, surface: 'pwa', action: 'lead_delete',
    summary: `lead ${leadId} soft-deleted (list page / undo door)`,
    entityType: 'lead', entityId: leadId,
  }).catch(() => {});

  return okRes(res, { deleted: { id: leadId } });
}));


module.exports = router;
