// src/lib/vendor/unbooking.js · DESIGN-1 · STAGE 4 · UNDO AND CANCEL BOOKING (the founder, the one-tap Book).
//
// The one home for taking a booking back. Two callers, one act:
//   · the Book sheet's 10-second Undo, which sends exactly what the booking wrote (its created event ids, and the
//     invoice only when the booking created it) and the state the lead had before;
//   · Cancel booking on the client's page, which first asks (dry_run) and then sends her two answers: remove the
//     booking's events, remove its invoice.
//
// WHAT IT NEVER DOES: remove an invoice with any money on it (a paid or part-paid invoice is kept, always, and the
// answer says so); remove an event of another booking (the F-43.87 rule promotion.js uses: an event linked to this lead
// counts only when its binder is this booking's or it has none); touch a lead that is not booked; write anything on a
// dry run. The lead goes back to an enquiry (contacted, or the state Undo names), so she can book it again.
'use strict';

const BACK_TO = ['new', 'contacted', 'quoted'];

function refused(code) { return { status: 422, body: { ok: false, error: 'refused', code } }; }
function invalid(field) { return { status: 422, body: { ok: false, error: 'invalid', field } }; }
function failed(step, detail) {
  console.warn(`[unbooking] ${step}: ${detail}`);
  return { status: 500, body: { ok: false, error: 'Could not cancel the booking.', step } };
}

async function unbookLead(supabase, params, deps = {}) {
  const { vendor, agentId, leadId, binderId, removeEvents, removeInvoice, eventIds, backTo, dryRun } = params || {};
  try {
    if (!vendor || !vendor.id || !agentId || (!leadId && !binderId)) return failed('input', 'vendor, agent and a lead or binder are required');
    if (backTo != null && !BACK_TO.includes(backTo)) return invalid('back_to');
    if (eventIds != null && (!Array.isArray(eventIds) || eventIds.some((x) => typeof x !== 'string'))) return invalid('event_ids');
    const hideBinder = deps.hideBinder || (async (agent, id) => {
      const { executeAndPatch } = require('../executeAndPatch');
      const r = await executeAndPatch(agent, 'donna_hide', { binder_id: id });
      return !(r && typeof r.display === 'string' && r.display.startsWith('ERROR'));
    });

    // ── 1 · the lead, hers, booked ──────────────────────────────────────────────────
    let q = supabase.from('leads').select('id, name, state, binder_id, deleted_at').eq('vendor_id', vendor.id);
    q = leadId ? q.eq('id', leadId) : q.eq('binder_id', binderId);
    const { data: lead, error: leadErr } = await q.maybeSingle();
    if (leadErr) return failed('lead', leadErr.message);
    if (!lead || lead.deleted_at) return { status: 404, body: { ok: false, error: 'Not found.' } };
    if (lead.state !== 'booked') return refused('not_booked');
    const binder = lead.binder_id || null;

    // ── 2 · the booking's events (F-43.87: never another booking's) ─────────────────
    const byLead = await supabase.from('events').select('id, title, event_date, linked_binder_id')
      .eq('vendor_id', vendor.id).eq('linked_lead_id', lead.id).neq('state', 'cancelled').is('deleted_at', null);
    if (byLead.error) return failed('events', byLead.error.message);
    let byBinder = { data: [] };
    if (binder) {
      byBinder = await supabase.from('events').select('id, title, event_date, linked_binder_id')
        .eq('vendor_id', vendor.id).eq('linked_binder_id', binder).neq('state', 'cancelled').is('deleted_at', null);
      if (byBinder.error) return failed('events', byBinder.error.message);
    }
    const seen = new Set();
    let events = [...(byLead.data || []).filter((e) => e.linked_binder_id == null || e.linked_binder_id === binder), ...(byBinder.data || [])]
      .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
    if (eventIds) events = events.filter((e) => eventIds.includes(e.id));

    // ── 3 · the booking's invoice, and whether any money is on it ────────────────────
    const { data: invs, error: invErr } = await supabase.from('invoices')
      .select('id, invoice_number, amount_total, amount_paid, state')
      .eq('vendor_id', vendor.id).eq('lead_id', lead.id).neq('state', 'cancelled').is('deleted_at', null);
    if (invErr) return failed('invoice', invErr.message);
    let binderReceived = 0;
    if (binder) {
      const { data: rec, error: recErr } = await supabase.schema('engine').from('records')
        .select('id, amount_received, hidden').eq('agent_id', agentId).eq('id', binder).maybeSingle();
      if (recErr) return failed('binder', recErr.message);
      binderReceived = rec && !rec.hidden ? Number(rec.amount_received || 0) : 0;
    }
    const invoice = (invs || [])[0] || null;
    const paid = !!invoice && (Number(invoice.amount_paid || 0) > 0 || invoice.state === 'paid' || invoice.state === 'advance_paid' || binderReceived > 0);
    const plan = {
      lead_id: lead.id, name: lead.name, binder_id: binder,
      events: events.map((e) => ({ id: e.id, title: e.title, date: e.event_date })),
      invoice: invoice ? { id: invoice.id, number: invoice.invoice_number, total: invoice.amount_total, paid } : null,
    };
    if (dryRun) return { status: 200, body: { ok: true, plan } };

    // ── 4 · the act ─────────────────────────────────────────────────────────────────
    const nowIso = new Date().toISOString();
    const { error: stErr } = await supabase.from('leads').update({ state: backTo || 'contacted', updated_at: nowIso })
      .eq('id', lead.id).eq('vendor_id', vendor.id).eq('state', 'booked');
    if (stErr) return failed('lead_state', stErr.message);

    const removedEvents = [];
    if (removeEvents === true && events.length) {
      const ids = events.map((e) => e.id);
      const { error: evErr } = await supabase.from('events').update({ state: 'cancelled', deleted_at: nowIso, updated_at: nowIso })
        .eq('vendor_id', vendor.id).in('id', ids);
      if (evErr) return failed('events_remove', evErr.message);
      removedEvents.push(...ids);
    }

    let invoiceRemoved = false;
    if (removeInvoice === true && invoice && !paid) {
      const { error: ivErr } = await supabase.from('invoices').update({ state: 'cancelled', deleted_at: nowIso, updated_at: nowIso })
        .eq('vendor_id', vendor.id).eq('id', invoice.id).eq('amount_paid', invoice.amount_paid || 0);
      if (ivErr) return failed('invoice_remove', ivErr.message);
      if (binder && !(await hideBinder(agentId, binder))) return failed('binder_hide', 'the engine refused the hide');
      // the next booking of this lead opens a fresh binder rather than reading the hidden one
      if (binder) {
        const { error: bErr } = await supabase.from('leads').update({ binder_id: null, updated_at: nowIso }).eq('id', lead.id).eq('vendor_id', vendor.id);
        if (bErr) return failed('lead_binder', bErr.message);
      }
      invoiceRemoved = true;
    }

    return {
      status: 200,
      body: {
        ok: true,
        unbooked: {
          lead_id: lead.id, state: backTo || 'contacted', events_removed: removedEvents,
          invoice_removed: invoiceRemoved, invoice_kept_paid: !!invoice && paid,
        },
      },
    };
  } catch (e) {
    return failed('exception', e && e.message ? e.message : String(e));
  }
}

module.exports = { unbookLead, BACK_TO };
