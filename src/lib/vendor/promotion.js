'use strict';
// src/lib/vendor/promotion.js
//
// TDW · CE-43 · LC-2 · packet 3 · THE PROMOTION ACT, ONE HOME (roadmap §3 Moment 2).
//
// Callers:
//   src/api/vendor/leadPackages.js   POST /api/v2/vendor/leads/:leadId/promote
//   src/api/vendor/clients.js        POST /api/v2/vendor/clients/direct (a walk-in, R-43.5)
// Packet 4 adds the two chat doors (chat.js, vendorInbound.js) for donna_booking (C-43.1).
//
// THE ORDER, EACH STEP READING BEFORE IT WRITES (chair's rulings, CE-43, 2026-09-17):
//   1  the lead (vendor-scoped, live) and its live lead package (A9's refusals).
//   2  F3, reserve-then-create: leads.binder_id is written FIRST, WHERE binder_id IS NULL;
//      the binder is then opened under that id by the engine's door-only export
//      openRecordWithId. A crash between the two leaves a lead pointing at an unused id,
//      which the next run opens; never a binder nobody points at.
//      F27(b): an existing binder is ADOPTED only when its normalised phone AND its trimmed,
//      case-insensitive client name both equal the lead's, it is live, and no lead already
//      points at it; exactly one such binder, or none is adopted.
//      Choice 4 (ruled): an adopted binder is linked; its stage is set to `confirmed booking`
//      through the engine writer, and money is written only into EMPTY cells (B-7). Nothing
//      else on it is rewritten.
//   3  the lead moves to `booked`, only after the binder exists.
//   4  the event: writeEvent, kind `ceremony`, title `<client> · wedding` (LC-1's vetoed
//      bytes), linked_lead_id and linked_binder_id set. Skipped when a live linked event
//      exists. Choice 1 (ruled): a calendar refusal is RETURNED, never fatal.
//   5  the one invoice, found or created by lead_package_id (uq_invoices_lead_package is the
//      guard; a lost race re-reads the winner, and the counter number it consumed is skipped,
//      disclosed).
//   6  the schedule, rows with EXPLICIT amounts from lead_packages.schedule (C-43.2); has_schedule
//      set by createSchedule. Choice 2 (ruled): each row carries A5's label with the package's
//      own share (F26). For advance_paid the deposit row is dated advance_received_on (F19).
//   7  advance_paid: the deposit milestone is marked paid on advance_received_on (F6 moves
//      due_date to the next unpaid milestone). booking_confirmed: due_date is the first
//      unpaid milestone, set at the mint.
//
// "PROMOTED" = the link is set AND the binder is present AND an invoice exists for the
// lead_package_id. A second call on a promoted lead writes nothing new.
//
// RETURNS { status, body } for a door to send. Refusals are 422 with a code the PWA maps
// (A9's four lines; anything else reads F29). A failed step is 500 with `step` named and
// logged. Never throws.
//
// COLUMN WITNESS (docs/db/PUBLIC_SCHEMA.md at ladder 0168; docs/db/ENGINE_SCHEMA.md):
//   public.leads          id(1) vendor_id(2) name(3) phone(4) wedding_date(6) state(13)
//                         updated_at(17) deleted_at(20) wedding_date_precision(24) binder_id(30)
//                         · uq_leads_binder_id (UNIQUE binder_id WHERE NOT NULL)
//   public.lead_packages  id(1) vendor_id(2) lead_id(3) snapshot(5) total(6) schedule(7)
//                         delivery_on(8) deleted_at(13) · uq_lead_packages_live
//   public.events         id(1) vendor_id(2) linked_lead_id(7) state(8) deleted_at(14)
//                         linked_binder_id(15) (writes go through writeEvent)
//   public.invoices       id(1) vendor_id(2) invoice_number(4) amount_total(8) amount_paid(10)
//                         due_date(11) state(12) deleted_at(20) has_schedule(21) binder_id(22)
//                         lead_package_id(23) · uq_invoices_lead_package
//   public.payment_schedules  id(1) invoice_id(2) vendor_id(3) amount_due(6) due_date(7)
//                         state(8) ordinal(11) (writes go through lib/vendor/schedules.js)
//   engine.records        id(1) agent_id(2) amount(3) client(4) date(5) direction(6) phone(9)
//                         stage(10) hidden(11) amount_received(18) amount_pending(19)
//                         payment_status(20)

const crypto = require('crypto');
const { isDateKey } = require('./packageSchedule');

const KINDS = ['advance_paid', 'booking_confirmed'];
const BOOKED_STAGE = 'confirmed booking';
const RECORD_SELECT = 'id, client, phone, date, stage, hidden, amount, direction, amount_received, amount_pending, payment_status';

// ── A5's labels (founder veto YES 2026-09-17; F26 own shares; choice 2). The PWA's twin is
//    dreamos-pwa lib/worklist/packages.ts scheduleLabel. At 30/30 these are the vetoed bytes.
function packageScheduleLabel(kind, pct) {
  if (kind === 'deposit') return `Deposit, ${pct}% of the fee, on booking`;
  if (kind === 'middle') return `${pct}% one month before the first function (optional)`;
  return 'The remainder, on delivery, before the work is handed over';
}

// LC-1's vetoed event title (src/lib/vendor/bookingEvent.js bookingEventTitle), one home.
function eventTitle(client) {
  return require('./bookingEvent').bookingEventTitle(client);
}

// Normalised keys, the engine's twins (src/engine/src/core/phoneKey.ts phoneKey, nameKey).
function phoneKey(p) {
  if (!p) return null;
  const digits = String(p).replace(/\D/g, '');
  if (digits.length < 10) return null;
  const key = digits.slice(-10);
  if (/^(\d)\1{9}$/.test(key)) return null;
  return key;
}
function nameKey(n) {
  const t = String(n == null ? '' : n).trim().toLowerCase();
  return t.length >= 2 ? t : null;
}

function engineDeps() {
  return {
    openRecordWithId: require('../../engine/dist/core/tools/recordPrimitives').openRecordWithId,
    patchNote: require('../../engine/dist/core/donna').patchNote,
    executeAndPatch: require('../executeAndPatch').executeAndPatch,
  };
}
const isErr = (r) => !!r && typeof r.display === 'string' && r.display.startsWith('ERROR');

function refused(code) { return { status: 422, body: { ok: false, error: 'refused', code } }; }
function invalid(field) { return { status: 422, body: { ok: false, error: 'invalid', field } }; }
function failed(step, detail, ctx) {
  console.error(`[promotion] vendor=${ctx.vendorId} lead=${ctx.leadId} step=${step} failed: ${detail}`);
  return { status: 500, body: { ok: false, error: 'promotion_failed', step } };
}

async function readBinder(eng, agentId, id) {
  const { data, error } = await eng.from('records').select(RECORD_SELECT)
    .eq('id', id).eq('agent_id', agentId).maybeSingle();
  return { binder: data || null, error };
}

// F27(b): the one adoptable binder, or null.
async function findAdoptable(supabase, eng, agentId, lead) {
  const pk = phoneKey(lead.phone);
  const nk = nameKey(lead.name);
  if (!pk || !nk) return { binder: null };
  const { data, error } = await eng.from('records').select(RECORD_SELECT)
    .eq('agent_id', agentId).eq('hidden', false);
  if (error) return { error };
  const matches = (data || []).filter((r) => phoneKey(r.phone) === pk && nameKey(r.client) === nk);
  if (!matches.length) return { binder: null };
  const { data: linked, error: lErr } = await supabase.from('leads').select('id, binder_id')
    .in('binder_id', matches.map((m) => m.id));
  if (lErr) return { error: lErr };
  const taken = new Set((linked || []).map((l) => l.binder_id));
  const free = matches.filter((m) => !taken.has(m.id));
  return { binder: free.length === 1 ? free[0] : null };
}

async function reserve(supabase, vendorId, leadId, id) {
  return supabase.from('leads')
    .update({ binder_id: id, updated_at: new Date().toISOString() })
    .eq('id', leadId).eq('vendor_id', vendorId).is('binder_id', null)
    .select('id, binder_id');
}

// Choice 4 (and every re-run): stage to confirmed booking; money only into empty cells.
async function settleBinderFacts(exec, agentId, binder, money) {
  if (binder.stage !== BOOKED_STAGE) {
    const r = await exec(agentId, 'donna_stage', { binder_id: binder.id, stage: BOOKED_STAGE });
    if (isErr(r)) return r.display;
  }
  const empty = (v) => v === null || v === undefined || v === '';
  if (empty(binder.amount)) {
    const r = await exec(agentId, 'donna_money', { binder_id: binder.id, amount: String(money.total), direction: 'in' });
    if (isErr(r)) return r.display;
  }
  const edit = {};
  if (money.received != null) {
    if (empty(binder.amount_received)) edit.amount_received = money.received;
    const amountIsTotal = empty(binder.amount) || Number(binder.amount) === money.total;
    if (empty(binder.amount_pending) && amountIsTotal) edit.amount_pending = money.total - money.received;
    if (empty(binder.payment_status)) edit.payment_status = money.received >= money.total ? 'paid' : 'partial';
  }
  if (Object.keys(edit).length) {
    const r = await exec(agentId, 'donna_money_edit', { binder_id: binder.id, ...edit });
    if (isErr(r)) return r.display;
  }
  return null;
}

async function promoteLead(supabase, params, deps = {}) {
  const { vendor, agentId, leadId, kind, advanceReceivedOn } = params || {};
  const ctx = { vendorId: vendor && vendor.id, leadId };
  try {
    if (!vendor || !vendor.id || !agentId || !leadId) return failed('input', 'vendor, agent and lead are required', ctx);
    if (!KINDS.includes(kind)) return invalid('kind');
    if (kind === 'advance_paid' && !isDateKey(advanceReceivedOn)) return invalid('advance_received_on');

    const d = { ...(deps.engine || {}) };
    const lazy = () => {
      if (d.openRecordWithId && d.patchNote && d.executeAndPatch) return;
      const e = engineDeps(); for (const k of Object.keys(e)) if (!d[k]) d[k] = e[k];
    };
    const W = {
      writeEvent: deps.writeEvent || ((...a) => require('./eventWrite').writeEvent(...a)),
      createInvoice: deps.createInvoice || ((...a) => require('./invoices').createInvoice(...a)),
      createSchedule: deps.createSchedule || ((...a) => require('./schedules').createSchedule(...a)),
      markMilestonePaid: deps.markMilestonePaid || ((...a) => require('./schedules').markMilestonePaid(...a)),
      uuid: deps.uuid || (() => crypto.randomUUID()),
    };
    const eng = supabase.schema('engine');

    // ── 1 · the lead and its package ────────────────────────────────────────────────
    const { data: lead, error: leadErr } = await supabase.from('leads')
      .select('id, vendor_id, name, phone, wedding_date, wedding_date_precision, state, binder_id, deleted_at')
      .eq('id', leadId).eq('vendor_id', vendor.id).maybeSingle();
    if (leadErr) return failed('lead', leadErr.message, ctx);
    if (!lead || lead.deleted_at) return { status: 404, body: { ok: false, error: 'Not found.' } };
    const client = String(lead.name || '').trim();
    if (client.length < 2) return invalid('name');

    const { data: lp, error: lpErr } = await supabase.from('lead_packages')
      .select('id, total, schedule, snapshot, delivery_on')
      .eq('lead_id', leadId).eq('vendor_id', vendor.id).is('deleted_at', null).maybeSingle();
    if (lpErr) return failed('package', lpErr.message, ctx);
    if (!lp) return refused('no_package');
    const total = Number(lp.total);
    if (!Number.isInteger(total) || total <= 0) return refused('no_fee');
    const rows = Array.isArray(lp.schedule) ? lp.schedule : [];
    const deposit = rows.find((r) => r && r.kind === 'deposit');
    if (!rows.length || !deposit || rows.reduce((s, r) => s + Number(r.amount), 0) !== total) return refused('bad_package');
    const received = kind === 'advance_paid' ? Number(deposit.amount) : null;

    // ── 2 · the binder (F3, F27(b), choice 4) ───────────────────────────────────────
    lazy();
    let binderId = lead.binder_id || null;
    let binder = null;
    let adopted = false;
    let opened = false;
    if (binderId) {
      const r = await readBinder(eng, agentId, binderId);
      if (r.error) return failed('binder_read', r.error.message, ctx);
      binder = r.binder;
    } else {
      const a = await findAdoptable(supabase, eng, agentId, lead);
      if (a.error) return failed('binder_match', a.error.message, ctx);
      let candidate = a.binder ? a.binder.id : W.uuid();
      let res = await reserve(supabase, vendor.id, leadId, candidate);
      if (res.error && a.binder && res.error.code === '23505') {
        candidate = W.uuid();
        res = await reserve(supabase, vendor.id, leadId, candidate);
      } else if (!res.error && a.binder) {
        adopted = true;
      }
      if (res.error) return failed('reserve', res.error.message, ctx);
      if (res.data && res.data.length) {
        binderId = candidate;
        if (adopted) binder = a.binder;
      } else {
        adopted = false;
        const { data: again, error: agErr } = await supabase.from('leads')
          .select('binder_id').eq('id', leadId).eq('vendor_id', vendor.id).maybeSingle();
        if (agErr || !again || !again.binder_id) return failed('reserve', agErr ? agErr.message : 'reservation not visible', ctx);
        binderId = again.binder_id;
        const r = await readBinder(eng, agentId, binderId);
        if (r.error) return failed('binder_read', r.error.message, ctx);
        binder = r.binder;
      }
    }
    if (!binder) {
      const fields = {
        client,
        phone: lead.phone || null,
        date: lead.wedding_date || null,
        stage: BOOKED_STAGE,
        amount: total,
        direction: 'in',
      };
      if (received != null) {
        fields.amount_received = received;
        fields.amount_pending = total - received;
        fields.payment_status = received >= total ? 'paid' : 'partial';
      }
      const out = await d.openRecordWithId(agentId, binderId, fields, `booking ${client}`);
      if (isErr(out)) {
        const r = await readBinder(eng, agentId, binderId);
        if (!r.binder) return failed('binder_open', out.display, ctx);
        binder = r.binder;
      } else {
        opened = true;
        binder = { id: binderId, ...fields, hidden: false };
        try { await d.patchNote(agentId, out); } catch (e) { console.warn('[promotion] snapshot patch failed (binder landed):', e.message); }
      }
    }
    if (!opened) {
      const why = await settleBinderFacts(d.executeAndPatch, agentId, binder, { total, received });
      if (why) return failed('binder_facts', why, ctx);
    }

    // ── 3 · the lead is booked ──────────────────────────────────────────────────────
    if (lead.state !== 'booked') {
      const { error: stErr } = await supabase.from('leads')
        .update({ state: 'booked', updated_at: new Date().toISOString() })
        .eq('id', leadId).eq('vendor_id', vendor.id);
      if (stErr) return failed('lead_state', stErr.message, ctx);
    }

    // ── 4 · the event (choice 1: a refusal is returned, not fatal) ──────────────────
    let event;
    {
      const byLead = await supabase.from('events').select('id, state')
        .eq('vendor_id', vendor.id).eq('linked_lead_id', leadId).neq('state', 'cancelled').is('deleted_at', null);
      const byBinder = await supabase.from('events').select('id, state')
        .eq('vendor_id', vendor.id).eq('linked_binder_id', binderId).neq('state', 'cancelled').is('deleted_at', null);
      if (byLead.error || byBinder.error) {
        event = { error: (byLead.error || byBinder.error).message };
      } else {
        const found = [...(byLead.data || []), ...(byBinder.data || [])][0];
        if (found) event = { id: found.id, existing: true };
        else if (!isDateKey(lead.wedding_date)) event = { skipped: 'no_wedding_date' };
        else {
          const r = await W.writeEvent(supabase, {
            vendorId: vendor.id, agentId, surface: 'pwa', source: 'crud',
            title: eventTitle(client), event_date: lead.wedding_date, kind: 'ceremony',
            linked_binder_id: binderId, linked_lead_id: leadId, state: 'upcoming',
          });
          if (r && r.ok) event = { id: r.event && r.event.id, created: true };
          else if (r && r.conflict) event = { refused: r.conflict };
          else event = { error: (r && r.error) || 'write refused' };
        }
      }
      if (event.error) console.warn(`[promotion] vendor=${vendor.id} lead=${leadId} event not written: ${event.error}`);
    }

    // ── 5 · the one invoice ─────────────────────────────────────────────────────────
    const readInvoice = () => supabase.from('invoices')
      .select('id, invoice_number, amount_total, amount_paid, due_date, state, has_schedule')
      .eq('lead_package_id', lp.id).eq('vendor_id', vendor.id).is('deleted_at', null).maybeSingle();
    let { data: invoice, error: invErr } = await readInvoice();
    if (invErr) return failed('invoice_read', invErr.message, ctx);
    const scheduleRows = rows.map((r) => ({
      label: packageScheduleLabel(r.kind, r.pct),
      pct: Number(r.pct),
      amount_due: Number(r.amount),
      due_date: r.kind === 'deposit' && kind === 'advance_paid' ? advanceReceivedOn : (r.due_on || null),
    }));
    if (!invoice) {
      const snap = lp.snapshot || {};
      const made = await W.createInvoice(supabase, vendor.id, {
        client_name: client,
        client_phone: lead.phone || null,
        lead_id: leadId,
        binder_id: binderId,
        lead_package_id: lp.id,
        description: snap.name || null,
        amount_total: total,
        amount_advance: Number(deposit.amount),
        due_date: scheduleRows[0].due_date,
      });
      if (!made.ok) {
        if (made.code === '23505') {
          console.warn(`[promotion] vendor=${vendor.id} lead=${leadId} lost the invoice race; one invoice number was consumed and skipped`);
          ({ data: invoice, error: invErr } = await readInvoice());
          if (invErr || !invoice) return failed('invoice', invErr ? invErr.message : made.error, ctx);
        } else {
          return failed('invoice', made.error, ctx);
        }
      } else {
        invoice = { ...made.invoice, has_schedule: false };
      }
    }

    // ── 6 · the schedule ────────────────────────────────────────────────────────────
    const readRows = () => supabase.from('payment_schedules')
      .select('id, ordinal, amount_due, due_date, state')
      .eq('invoice_id', invoice.id).eq('vendor_id', vendor.id);
    let { data: ms, error: msErr } = await readRows();
    if (msErr) return failed('schedule_read', msErr.message, ctx);
    if (!ms || !ms.length) {
      const c = await W.createSchedule(supabase, vendor.id, invoice.id, scheduleRows);
      if (!c.ok) return failed('schedule', c.error, ctx);
      ({ data: ms, error: msErr } = await readRows());
      if (msErr || !ms || !ms.length) return failed('schedule_read', msErr ? msErr.message : 'rows not visible', ctx);
    }

    // ── 7 · the deposit, when it has arrived ────────────────────────────────────────
    const ordered = ms.slice().sort((a, b) => a.ordinal - b.ordinal);
    if (kind === 'advance_paid' && ordered[0] && ordered[0].state === 'pending') {
      const p = await W.markMilestonePaid(supabase, vendor.id, ordered[0].id, ordered[0].amount_due, advanceReceivedOn, { agentId });
      if (!p.ok && p.code !== 'ALREADY_PAID') return failed('deposit', p.error, ctx);
      if (p.ok && p.invoice) invoice = { ...invoice, ...p.invoice };
    }

    return {
      status: 200,
      body: {
        ok: true,
        promoted: {
          lead_id: leadId,
          binder_id: binderId,
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          adopted,
          opened,
          event,
        },
      },
    };
  } catch (e) {
    return failed('exception', e && e.message ? e.message : String(e), ctx);
  }
}

module.exports = {
  promoteLead,
  packageScheduleLabel,
  phoneKey,
  nameKey,
  KINDS,
  BOOKED_STAGE,
};
