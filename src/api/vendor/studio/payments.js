// src/api/vendor/studio/payments.js
// GET   /api/v2/vendor/studio/team-payments             — list
// POST  /api/v2/vendor/studio/team-payments             — log obligation
// PATCH /api/v2/vendor/studio/team-payments/:id/mark-paid — settle
// GET   /api/v2/vendor/studio/team-payments/balance     — per-member totals
'use strict';

const express         = require('express');
const router          = express.Router();
const requireAuth     = require('../../middleware/requireAuth');
const resolveVendor   = require('../../middleware/resolveVendor');
const requirePrestige  = require('../../middleware/requirePrestige');
const asyncHandler    = require('../../../lib/asyncHandler');
const { ok: okRes, err: errRes } = require('../../../lib/response');
const { resolveAgentForVendor } = require('../../middleware/agentBridge');
const { binderRecordsByIds, titleOfRecord } = require('../../../lib/vendor/binderTitles');

const VALID_STATES = ['owed', 'paid', 'cancelled'];
const mw = [requireAuth, resolveVendor(), requirePrestige];

// ══════════════════════════════════════════════════════════════════════════════
// TDW_04.5 · P5 — THE MONEY LOOP'S READS
//
// Three GETs join this router. All three are READS; the loop's only WRITE is the
// POST that was already here, now reachable with the `linked_event_id` and
// `notes` it has always accepted and never been sent (the read-first's mirror
// finding: the server half was built, the caller never widened).
//
// ── THE COUNTING PREDICATES, STATED ONCE, DELIBERATELY DIFFERENT ─────────────
// Two questions live in this file and they are NOT the same question, so they do
// not share an answer (F-04.114's law — each line tells only its own truth):
//
//   GROUPING  ("where does existing money live?")  — INCLUDES cancelled
//     functions. A cancelled function's crew is still owed; money does not
//     vanish because a wedding did. This is the CE-adopted reasoning that
//     refused reuse of the band assembly, and it is enforced here by NOT
//     filtering `state`.
//
//   PICKER    ("what may I attach money to now?") — EXCLUDES cancelled
//     functions. You do not newly hang a payout on a function that is off.
//     Showing them unlabelled would be the dishonest alternative.
//
// Both exclude soft-deleted rows (the covenant) and `kind='blocked'` (F-04.36:
// a block is not an engagement). The SUGGESTION follows the GROUPING predicate,
// because the number it proposes must reconcile against the view the vendor
// checks it in — one derivation, one home (T19).
// ══════════════════════════════════════════════════════════════════════════════

const PICKER_CAP = 400;

/** Cancelled counts for money, never for new attachment. See the note above. */
function eventIsAttachable(ev) {
  return ev.state !== 'cancelled';
}

/**
 * Resolve the agent for the engine hop. Soft — a board that cannot name its
 * weddings still shows its money; it does not fail (bands.js:262's precedent).
 */
async function agentIdFor(req) {
  try {
    const uid = req.auth && req.auth.user_id;
    if (!uid) return null;
    const { agentId } = await resolveAgentForVendor(req.app.locals.supabase, req.vendor, uid);
    return agentId || null;
  } catch (e) {
    console.warn('[studio:money-loop] agent resolve failed (soft):', e.message);
    return null;
  }
}

// GET /balance — MUST be defined before /:id routes to avoid param clash
router.get('/balance', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_payments')
    .select('team_member_id, amount_inr, state, team_members(name)')
    .eq('vendor_id', req.vendor.id)
    .in('state', ['owed', 'paid']);
  if (error) return errRes(res, 500, error.message);

  const map = {};
  for (const row of (data || [])) {
    if (!map[row.team_member_id]) {
      map[row.team_member_id] = {
        team_member_id: row.team_member_id,
        name:           row.team_members?.name || '',
        owed_inr:       0,
        paid_inr:       0,
      };
    }
    if (row.state === 'owed') map[row.team_member_id].owed_inr += row.amount_inr;
    if (row.state === 'paid') map[row.team_member_id].paid_inr += row.amount_inr;
  }
  const balances = Object.values(map);
  const total_owed_inr = balances.reduce((s, b) => s + b.owed_inr, 0);
  return okRes(res, { balances, total_owed_inr });
}));

// ── GET /by-wedding — THE PER-WEDDING SETTLEMENT VIEW (spec §P5) ────────────
// All crew + external payouts grouped by the linked event's binder, with
// subtotals. Payment-spined, unwindowed, cancelled-inclusive — the three facts
// that refused reuse of `buildBands` (binderTitles.js carries the reasoning).
//
// THE LOOSE LANE (Fork E1, CE-ruled) is not an error state. A payout reaches it
// three lawful ways and the view does not pretend to know which: no
// `linked_event_id` at all · a function with no `linked_binder_id` · a function
// this vendor can no longer read. Per the read-first's R2, EVERY collab-born
// settlement lands here unless the vendor picks a function at the stub — the
// collab plane carries no event linkage of its own, and the honest answer to
// "which wedding?" is silence, never a guess.
router.get('/by-wedding', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;

  const { data: payRows, error: payErr } = await supabase
    .from('team_payments')
    .select('id, team_member_id, linked_event_id, description, amount_inr, state, paid_at, paid_via, notes, created_at, team_members(name)')
    .eq('vendor_id', req.vendor.id)
    .in('state', ['owed', 'paid'])
    .order('created_at', { ascending: false });
  if (payErr) return errRes(res, 500, payErr.message);

  const payments = payRows || [];

  // The functions those payments point at. NO state filter — see the predicate
  // note at the head of this file. Scoped by vendor_id, so a foreign event id
  // resolves to nothing and its payment falls to the loose lane rather than
  // reaching across a tenancy boundary.
  const eventIds = [...new Set(payments.map((p) => p.linked_event_id).filter(Boolean))];
  const eventById = new Map();
  if (eventIds.length) {
    try {
      const { data: evs, error: evErr } = await supabase
        .from('events')
        .select('id, title, event_date, slot, kind, state, linked_binder_id')
        .eq('vendor_id', req.vendor.id)
        .in('id', eventIds)
        .is('deleted_at', null);
      if (evErr) throw evErr;
      for (const e of (evs || [])) eventById.set(e.id, e);
    } catch (e) {
      console.warn('[GET /team-payments/by-wedding] event read failed (soft):', e.message);
    }
  }

  const binderIds = [...new Set(
    [...eventById.values()].map((e) => e.linked_binder_id).filter(Boolean)
  )];
  const binderById = await binderRecordsByIds(supabase, {
    agentId:   await agentIdFor(req),
    binderIds,
    label:     '[GET /team-payments/by-wedding]',
  });

  const lineOf = (p, ev) => ({
    id:              p.id,
    team_member_id:  p.team_member_id,
    member_name:     (p.team_members && p.team_members.name) || null,
    amount_inr:      p.amount_inr,
    state:           p.state,
    description:     p.description,
    notes:           p.notes,
    linked_event_id: p.linked_event_id || null,
    event_title:     ev ? ev.title : null,
    event_date:      ev ? ev.event_date : null,
    event_state:     ev ? ev.state : null,
    paid_at:         p.paid_at,
    paid_via:        p.paid_via,
    created_at:      p.created_at,
  });

  // Subtotals are SUMS OF THE ROWS ON SCREEN. Acceptance item 7 says the
  // grouping "reconciles by hand": the arithmetic below adds exactly the lines
  // the vendor can count, and nothing he cannot see contributes a rupee.
  const grouped = new Map();
  const looseLines = [];
  for (const p of payments) {
    const ev = p.linked_event_id ? eventById.get(p.linked_event_id) : null;
    if (!ev || !ev.linked_binder_id) { looseLines.push(lineOf(p, ev || null)); continue; }
    const g = grouped.get(ev.linked_binder_id) || [];
    g.push(lineOf(p, ev));
    grouped.set(ev.linked_binder_id, g);
  }

  const subtotal = (lines) => ({
    owed_inr: lines.filter((l) => l.state === 'owed').reduce((s, l) => s + l.amount_inr, 0),
    paid_inr: lines.filter((l) => l.state === 'paid').reduce((s, l) => s + l.amount_inr, 0),
  });

  const weddings = [...grouped.entries()].map(([binder_id, lines]) => ({
    binder_id,
    // null => the client renders the P2-vetoed "Untitled wedding". The wire
    // stays honest about absence; the word lives with its siblings.
    title:    titleOfRecord(binderById.get(binder_id)),
    payments: lines,
    ...subtotal(lines),
  }));
  weddings.sort((a, b) => (b.owed_inr - a.owed_inr) || (b.paid_inr - a.paid_inr));

  const all = subtotal(payments.map((p) => lineOf(p, null)));
  return okRes(res, {
    weddings,
    loose: { payments: looseLines, ...subtotal(looseLines) },
    total_owed_inr: all.owed_inr,
    total_paid_inr: all.paid_inr,
  });
}));

// ── GET /functions — THE STUB'S PICKER SOURCE (Fork C1, CE-ruled) ───────────
// "The vendor's hand supplies what the data cannot." The collab plane carries no
// event of its own, so rather than invent a linkage the stub ASKS. This is that
// list: the vendor's own functions, each already carrying the wedding behind it
// so the client never has to join two reads to render one line.
router.get('/functions', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const today    = new Date();
  const shift    = (days) => new Date(today.getTime() + days * 86400000).toISOString().slice(0, 10);
  const from     = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.from || '')) ? String(req.query.from) : shift(-365);
  const to       = /^\d{4}-\d{2}-\d{2}$/.test(String(req.query.to   || '')) ? String(req.query.to)   : shift(365);

  const { data: rows, error } = await supabase
    .from('events')
    .select('id, title, event_date, slot, kind, state, linked_binder_id')
    .eq('vendor_id', req.vendor.id)
    .gte('event_date', from)
    .lte('event_date', to)
    .is('deleted_at', null)
    .neq('kind', 'blocked')
    .order('event_date', { ascending: false })
    .limit(PICKER_CAP);
  if (error) return errRes(res, 500, error.message);

  const events    = (rows || []).filter(eventIsAttachable);
  const binderIds = [...new Set(events.map((e) => e.linked_binder_id).filter(Boolean))];
  const binderById = await binderRecordsByIds(supabase, {
    agentId:   await agentIdFor(req),
    binderIds,
    label:     '[GET /team-payments/functions]',
  });

  return okRes(res, {
    functions: events.map((e) => ({
      event_id:      e.id,
      title:         e.title,
      event_date:    e.event_date,
      slot:          e.slot,
      kind:          e.kind,
      binder_id:     e.linked_binder_id || null,
      wedding_title: titleOfRecord(binderById.get(e.linked_binder_id)),
    })),
    truncated: (rows || []).length >= PICKER_CAP,
  });
}));

// ── GET /suggest — THE AUTO-SUGGEST (Fork F1 + the founder's unit ruling) ────
// `daily_rate_inr × functions`, and the multiplicand is FOUNDER-RULED: the rate
// column's real-world semantic is PER ENGAGEMENT, not per calendar day. An MUA
// doing three functions in one day bills three makeups, not one day. The
// executor's COUNT(DISTINCT event_date) is STRUCK; this counts FUNCTIONS.
//
// SUGGEST, NEVER COMMIT. This route WRITES NOTHING. It returns a number for a
// prefilled, editable field; the vendor's hand commits every rupee, and his
// crew's negotiation finishes it.
//
// ABSENT-HONEST, THREE WAYS — each returns a null suggestion and NAMES why,
// because a number with no derivation behind it is a naked number:
//   no_rate      the member has no daily_rate_inr on file
//   no_wedding   the function is not binder-linked, so there is no scope to count
//   not_assigned the member is on none of that wedding's functions
// Never a zero. An unfiled cell means unfiled, not Rs 0 (F-04.13's sentence).
router.get('/suggest', ...mw, asyncHandler(async (req, res) => {
  const supabase       = req.app.locals.supabase;
  const teamMemberId   = String(req.query.team_member_id || '').trim();
  const linkedEventId  = String(req.query.linked_event_id || '').trim();
  if (!teamMemberId)  return errRes(res, 400, 'team_member_id is required.');
  if (!linkedEventId) return errRes(res, 400, 'linked_event_id is required.');

  const none = (reason) => okRes(res, { suggestion: null, reason });

  const { data: member } = await supabase
    .from('team_members')
    .select('id, name, daily_rate_inr')
    .eq('id', teamMemberId)
    .eq('vendor_id', req.vendor.id)
    .maybeSingle();
  if (!member) return errRes(res, 404, 'Member not found.');
  if (member.daily_rate_inr == null) return none('no_rate');

  const { data: ev } = await supabase
    .from('events')
    .select('id, linked_binder_id')
    .eq('id', linkedEventId)
    .eq('vendor_id', req.vendor.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!ev) return errRes(res, 404, 'Function not found.');
  if (!ev.linked_binder_id) return none('no_wedding');

  // The wedding's scope, counted with the GROUPING predicate so the suggestion
  // and the view it is checked against cannot disagree. Cancelled functions
  // count: the crew turned up to the ones that happened and the vendor edits
  // the number if they did not.
  const { data: scope, error: scopeErr } = await supabase
    .from('events')
    .select('id')
    .eq('vendor_id', req.vendor.id)
    .eq('linked_binder_id', ev.linked_binder_id)
    .is('deleted_at', null)
    .contains('assigned_member_ids', [teamMemberId]);
  if (scopeErr) return errRes(res, 500, scopeErr.message);

  const functions = (scope || []).length;
  if (functions === 0) return none('not_assigned');

  return okRes(res, {
    suggestion: {
      rate_inr:   member.daily_rate_inr,
      functions,
      amount_inr: member.daily_rate_inr * functions,
    },
    reason: null,
  });
}));

// GET — list all payments
router.get('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { state, member_id } = req.query;
  let q = supabase
    .from('team_payments')
    .select('*, team_members(name)')
    .eq('vendor_id', req.vendor.id)
    .order('created_at', { ascending: false });
  if (state && VALID_STATES.includes(state)) q = q.eq('state', state);
  if (member_id) q = q.eq('team_member_id', member_id);
  const { data, error } = await q;
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { payments: data || [] });
}));

// POST — log obligation
router.post('/', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { team_member_id, amount_inr, description,
          linked_event_id, linked_task_id, notes } = req.body || {};
  if (!team_member_id) return errRes(res, 400, 'team_member_id is required.');
  if (!amount_inr || amount_inr <= 0) return errRes(res, 400, 'amount_inr must be a positive integer.');

  const { data, error } = await supabase
    .from('team_payments')
    .insert({
      vendor_id:       req.vendor.id,
      team_member_id,
      amount_inr,
      description:     description     || null,
      linked_event_id: linked_event_id || null,
      linked_task_id:  linked_task_id  || null,
      notes:           notes           || null,
      state:           'owed',
    })
    .select()
    .single();
  if (error) return errRes(res, 500, error.message);
  return okRes(res, { payment: data });
}));

// PATCH /:id/cancel — cancel an owed obligation
router.patch('/:paymentId/cancel', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { data, error } = await supabase
    .from('team_payments')
    .update({ state: 'cancelled' })
    .eq('id', req.params.paymentId)
    .eq('vendor_id', req.vendor.id)
    .eq('state', 'owed')
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Payment not found or already settled.');
    return errRes(res, 500, error.message);
  }
  return okRes(res, { payment: data });
}));

// PATCH /:id/mark-paid
router.patch('/:paymentId/mark-paid', ...mw, asyncHandler(async (req, res) => {
  const supabase = req.app.locals.supabase;
  const { paid_via, notes } = req.body || {};

  // ── F-04.116's CURE (CE-ruled, Fork B1) ───────────────────────────────────
  // THE DEFECT: this update carried `notes: notes || null`. A PATCH body that
  // simply does not speak about notes was written as an INTENT TO ERASE them —
  // so settling a payment DESTROYED whatever the note held. P5 puts
  // `collab:<post_id>` in that column and acceptance item 7 greps for it, which
  // is how a defect the route was born with finally became visible.
  //
  // ABSENT MEANS UNCHANGED. That is PATCH law, and this route was violating it
  // from birth; the current semantics ARE the defect, which is what makes a
  // one-line change to a sealed money route lawful here.
  //
  // "Carries it" is read as a non-empty string, deliberately: the pwa's
  // `notes: paidNotes || undefined` already drops an untouched field, but this
  // is a public route and an empty string is somebody's blank input box, never
  // an instruction to erase a thread they cannot see. Erasure has no caller and
  // is therefore not offered — a note is added or left alone.
  const patch = {
    state:    'paid',
    paid_at:  new Date().toISOString(),
    paid_via: paid_via || null,
  };
  if (typeof notes === 'string' && notes.trim() !== '') patch.notes = notes;

  const { data, error } = await supabase
    .from('team_payments')
    .update(patch)
    .eq('id', req.params.paymentId)
    .eq('vendor_id', req.vendor.id)
    .eq('state', 'owed')
    .select()
    .single();
  if (error) {
    if (error.code === 'PGRST116') return errRes(res, 404, 'Payment not found or already settled.');
    return errRes(res, 500, error.message);
  }

  // Auto-create a business expense so team payments show up in the vendor's expense ledger.
  // Fire-and-forget — don't fail the mark-paid if expense creation fails.
  try {
    const expenseDate = new Date().toISOString().slice(0, 10);
    const memberRes   = await supabase
      .from('team_members')
      .select('name')
      .eq('id', data.team_member_id)
      .single();
    const memberName = memberRes.data?.name || 'Team member';
    const desc = data.description
      ? `${memberName} — ${data.description}`
      : `Payment to ${memberName}`;
    await supabase.from('expenses').insert({
      vendor_id:    req.vendor.id,
      amount:       data.amount_inr,
      category:     'assistant',
      description:  desc,
      expense_date: expenseDate,
      notes:        paid_via ? `Paid via ${paid_via}` : null,
    });
  } catch (expErr) {
    console.warn('[studio:mark-paid] expense auto-create failed:', expErr.message);
  }

  return okRes(res, { payment: data });
}));

module.exports = router;
