// src/api/vendor/day.js
// GET /api/v2/vendor/day/:vendorId/:date — the DAY SHEET's one round trip.
// TDW_04 Part B, sitting B6 surfaces S2 (spec P5, ratified whole by R-B6-16;
// item 4 ruled to S2 by the paper's split).
//
// P5 verbatim: "new GET /api/v2/vendor/day/:vendorId/:date returning the sheet
// payload (events, followups computed, hot note, milestones) — one round trip."
//
// PLANE: `req.app.locals.supabase` is the PUBLIC-default client — events,
// hot_dates, payment_schedules, invoices below are all public.*. The followup
// projection is the ONE deliberate engine hop (`.schema('engine')` -> records,
// the binders), same enumerated-hop class as eventWrite's binder resolve. Every
// column below is read from the witnessed lists (PUBLIC_SCHEMA.md: events 16,
// payment_schedules 13, invoices 21, hot_dates 8; ENGINE_SCHEMA.md: records) —
// nothing inferred from prose.
//
// FAIL POSTURE, stated: the CALENDAR half (events + blocks) is the sheet's
// spine — a failed read is a failed request (500), never a silently empty day.
// The DECORATION halves (muhurat note, milestones, followups, binder chips)
// fail SOFT to null/[] with a console.warn: a vendor's day must not 500 because
// the engine agent didn't resolve (the events.js:PATCH lockstep precedent,
// B0's item-4b — resolve in-handler, never blocking) or a join table hiccuped.
// Soft-failed legs are ABSENT-honest: the payload carries [] and the sheet
// renders nothing, which is ST-2's disclosed-blindness shape, not a lie.
//
// FOLLOWUP PROJECTION (C7: "read-time projection layer, never duplicated
// rows"): binders whose followup_on IS this date, exactly. `repeat_every` is a
// FREE-TEXT column (engine's own input contract: "repeats ${fields.repeat_every}"
// — recordPrimitives.ts:810); projecting future occurrences out of free text
// would be a guess wearing arithmetic, so repeats are RENDERED on the matched
// row ("repeats weekly") and never expanded onto other dates. Declared gap,
// stated here and in the handover — if a ruled repeat vocabulary ever lands,
// the projection extends; nothing is silently invented today.

'use strict';

const express        = require('express');
const router         = express.Router();
const requireAuth    = require('../middleware/requireAuth');
const resolveVendor  = require('../middleware/resolveVendor');
const asyncHandler   = require('../../lib/asyncHandler');
const { resolveAgentForVendor } = require('../middleware/agentBridge');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.get('/:vendorId/:date', requireAuth, resolveVendor({ paramName: 'vendorId' }), asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const vendor   = req.vendor;
  const date     = String(req.params.date || '').trim();

  if (!DATE_RE.test(date)) {
    return res.status(400).json({ ok: false, error: 'date must be in YYYY-MM-DD format.' });
  }

  // ── THE SPINE: the calendar's own rows, split engagement/block ──────────
  // One query, split in memory — blocks and engagements are one table (0077's
  // convergence) and the day sheet is the ONE surface ruled to show both
  // truths side by side (Q-S-4: "the tension is the day sheet's to render").
  // deleted_at + cancelled: the covenant, read side, every events read.
  const { data: dayRows, error: dayErr } = await supabase
    .from('events')
    .select('id, title, kind, slot, event_date, event_time, state, notes, linked_binder_id, linked_lead_id, assigned_member_ids')
    .eq('vendor_id', vendor.id)
    .eq('event_date', date)
    .is('deleted_at', null)
    .neq('state', 'cancelled')
    .order('event_time', { ascending: true, nullsFirst: true });
  if (dayErr) {
    console.error('[GET /vendor/day] events read failed:', dayErr.message);
    return res.status(500).json({ ok: false, error: 'Lookup failed.' });
  }

  const rows   = dayRows || [];
  const events = rows.filter((r) => r.kind !== 'blocked');
  const blocks = rows
    .filter((r) => r.kind === 'blocked')
    .map((r) => ({
      id:     r.id,
      slot:   r.slot || 'full_day',       // pre-0078 rows are full_day (0075's witnessed backfill)
      reason: r.notes == null ? null : r.notes,  // the reason round-trip: notes is the SOURCE (B1's ruled shape)
      title:  r.title,
    }));

  // ── DECORATION LEG 1 — the muhurat note (hot_dates) ─────────────────────
  let hot = null;
  try {
    const { data: h, error: hErr } = await supabase
      .from('hot_dates')
      .select('date, note, label')
      .eq('date', date)
      .limit(1)
      .maybeSingle();
    if (hErr) throw hErr;
    if (h) hot = { note: h.note || null, label: h.label || null };
  } catch (e) {
    console.warn('[GET /vendor/day] hot_dates read failed (soft):', e.message);
  }

  // ── DECORATION LEG 2 — milestones due (payment_schedules, C8) ───────────
  // Pending milestones whose due_date is this date. The (n of m) ordinal reads
  // from the row's own `ordinal` and a sibling count per invoice; client_name
  // joins from invoices in one .in() read. Mark-paid is the EXISTING door
  // (POST /schedules/:milestoneId/paid) — this endpoint only reads.
  let milestones = [];
  try {
    const { data: due, error: msErr } = await supabase
      .from('payment_schedules')
      .select('id, invoice_id, milestone_label, pct, amount_due, due_date, state, ordinal')
      .eq('vendor_id', vendor.id)
      .eq('due_date', date)
      .eq('state', 'pending')
      .order('ordinal', { ascending: true });
    if (msErr) throw msErr;
    if (due && due.length) {
      const invoiceIds = [...new Set(due.map((m) => m.invoice_id))];
      const [{ data: invs, error: invErr }, { data: sibs, error: sibErr }] = await Promise.all([
        supabase.from('invoices')
          .select('id, client_name, invoice_number')
          .in('id', invoiceIds),
        supabase.from('payment_schedules')
          .select('id, invoice_id')
          .in('invoice_id', invoiceIds),
      ]);
      if (invErr || sibErr) throw (invErr || sibErr);
      const invMap = new Map((invs || []).map((i) => [i.id, i]));
      const counts = new Map();
      for (const s of (sibs || [])) counts.set(s.invoice_id, (counts.get(s.invoice_id) || 0) + 1);
      milestones = due.map((m) => ({
        id:             m.id,
        invoice_id:     m.invoice_id,
        label:          m.milestone_label,
        amount_due:     m.amount_due,
        client_name:    (invMap.get(m.invoice_id) || {}).client_name || null,
        invoice_number: (invMap.get(m.invoice_id) || {}).invoice_number || null,
        ordinal:        m.ordinal,
        of:             counts.get(m.invoice_id) || null,
      }));
    }
  } catch (e) {
    console.warn('[GET /vendor/day] milestones read failed (soft):', e.message);
    milestones = [];
  }

  // ── DECORATION LEGS 3+4 — followups + binder chips (engine hop) ─────────
  // resolveAgentForVendor in-handler, never as blocking middleware (the
  // events.js PATCH precedent, cited in its own comment): a vendor's day sheet
  // must not fail because their engine agent didn't resolve.
  let followups = [];
  const binderNames = {};
  try {
    const uid = req.auth && req.auth.user_id;
    if (uid) {
      const { agentId } = await resolveAgentForVendor(supabase, vendor, uid);
      if (agentId) {
        const eng = supabase.schema('engine');
        const binderIds = [...new Set(events.map((e) => e.linked_binder_id).filter(Boolean))];
        const reads = [
          eng.from('records')
            .select('id, client, followup_on, followup_note, repeat_every')
            .eq('agent_id', agentId)
            .eq('hidden', false)
            .eq('followup_on', date),
        ];
        if (binderIds.length) {
          reads.push(
            eng.from('records')
              .select('id, client')
              .eq('agent_id', agentId)
              .in('id', binderIds),
          );
        }
        const [fu, chips] = await Promise.all(reads);
        if (fu.error) throw fu.error;
        followups = (fu.data || []).map((r) => ({
          id:           r.id,
          client:       r.client || null,
          note:         r.followup_note || null,
          repeat_every: r.repeat_every || null,
        }));
        if (chips && !chips.error) {
          for (const b of (chips.data || [])) binderNames[b.id] = b.client || null;
        }
      }
    }
  } catch (e) {
    console.warn('[GET /vendor/day] engine legs failed (soft):', e.message);
    followups = [];
  }

  return res.json({
    ok: true,
    date,
    events: events.map((e) => ({
      id:               e.id,
      title:            e.title,
      kind:             e.kind,
      slot:             e.slot,
      event_time:       e.event_time,
      state:            e.state,
      notes:            e.notes,
      lead_id:          e.linked_lead_id,
      linked_binder_id: e.linked_binder_id,
      binder_name:      e.linked_binder_id ? (binderNames[e.linked_binder_id] ?? null) : null,
      // TDW_04.5 P1 #6 (CE Ruling №10, seam b): the crew a row carries, for the picker's
      // toggle seed + the full-array SET it computes. null/absent -> [] so the client
      // contract is ALWAYS an array (never undefined on the wire).
      assigned_member_ids: Array.isArray(e.assigned_member_ids) ? e.assigned_member_ids : [],
    })),
    blocks,
    hot,
    milestones,
    followups,
  });
}));

module.exports = router;
