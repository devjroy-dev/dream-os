'use strict';
// src/lib/vendor/workingDoor.js  THE WORKING-ROOM DOOR. CE-44 LC-Victor P5. ONE MODULE, BOTH LANES
// (C-43.1): src/api/vendor-engine/chat.js (both routes) and src/lib/vendorInbound.js call preTurn()
// and nothing else of it.
//
// R-44.21 (a), FORK (b): Victor steps out ONE JOB AT A TIME. At P5 the door covers four acts:
// booking_confirmed, advance_paid, milestone_paid and invoice. The door speaks ALONE only when EVERY
// act in her message is covered and names a client, and every one resolves to a line the founder
// owns. Anything else goes to today's chain UNCHANGED: an uncovered act beside a covered one, a
// covered act naming no client, no act at all, a listener error or timeout, a bare yes or no with no
// live staged row, an invoice whose client resolves to no binder (F-44.57), a same-name case the
// founder's byte 8 cannot say. The leftover line does NOT go live here (the chair's amendment).
//
// ORDER, AS RULED: the pending check runs BEFORE the listener. A live staged row answers her whole-
// message yes or no; anything else expires it and her message is handled fresh. Then the listener is
// heard BEFORE the reply, bounded at HEAR_BEFORE_REPLY_MS (4 s, the chair's number; the after-the-
// wire recording keeps listenerDoor's own 15 s). On a chain turn the request heard here is what
// meta.listener records: the chain's recordListening is handed it and makes NO second model call.
//
// MONEY IS CONFIRMED BEFORE IT MOVES (read-first item 6): a booking, an advance or a payment is
// STAGED (pendingMoneyActs.js, 0169) and asked (B1, B2); it runs only on her yes, through
// lifecycleHands' ONE helper, so the booking rules keep their one copy. One money act per message;
// a second is not staged and B12 says so. Every figure the door speaks comes from a ROW (the package
// total, the milestone's amount_due, the invoice); a figure the listener returned is never written
// and never spoken (B item 2).
//
// NO ACT HERE REACHES donna_client, donna_stage, donna_money OR donna_money_edit (item 1, option (i)):
// the only hands the door runs are promoteLead and markMilestonePaid (through runLifecycleSignals)
// and generateInvoiceForBinder. b90 pins the table's image.
//
// TOTAL: preTurn() never throws. Anything unexpected is { door: false }: the chain answers her,
// byte-identical to the estate before P5.

const DL = require('./doorLines');
const PMA = require('./pendingMoneyActs');
const { resolveSpokenDate } = require('./spokenDate');
const { longDateYear, istDay, rupees } = require('../witnessLine');

const HEAR_BEFORE_REPLY_MS = 4000;
const MONEY_ACTS = Object.freeze(['booking_confirmed', 'advance_paid', 'milestone_paid']);
const COVERED = Object.freeze([...MONEY_ACTS, 'invoice']);
// THE ACT TABLE'S IMAGE: every hand the door can run, and nothing else. b90 pins that it never holds
// donna_client, donna_stage, donna_money or donna_money_edit (item 1, option (i)).
const HANDS = Object.freeze({
  booking_confirmed: 'donna_booking',
  advance_paid: 'donna_booking',
  milestone_paid: 'donna_milestone_paid',
  invoice: 'donna_invoice_pdf',
});

const CHAIN = (ear, why) => ({ door: false, ear: ear || null, why });
const key = (s) => String(s == null ? '' : s).trim().toLowerCase();
const digits = (n) => { const r = rupees(n); return r ? r.replace(/^Rs /, '') : null; };

function lazy(deps) {
  return {
    lifecycle: deps.lifecycle || require('./lifecycleHands'),
    listener: deps.listener || require('./listenerDoor'),
    generateInvoiceForBinder: deps.generateInvoiceForBinder || ((...a) => require('../../api/vendor/invoices').generateInvoiceForBinder(...a)),
    memory: deps.memory || null,
    meter: deps.meter || null,
  };
}

// ── the covered-act check (the pin, R-44.21 (a)) ──────────────────────────────────────────────────
function allCovered(request) {
  try {
    if (!request || typeof request !== 'object' || !Array.isArray(request.acts) || !request.acts.length) return false;
    return request.acts.every((a) => a && COVERED.includes(a.act) && typeof a.client_as_spoken === 'string' && a.client_as_spoken.trim());
  } catch (_e) { return false; }
}

// ── reads ─────────────────────────────────────────────────────────────────────────────────────────
async function leadsNamed(supabase, vendorId, name, bookedOnly) {
  const { data, error } = await supabase.from('leads').select('id, name, state, wedding_date, binder_id')
    .eq('vendor_id', vendorId).is('deleted_at', null);
  if (error || !Array.isArray(data)) return null;
  let hits = data.filter((l) => key(l.name) === key(name));
  if (bookedOnly) hits = hits.filter((l) => key(l.state) === 'booked');
  return hits;
}
function sameName(name, rows, dateOf) {
  if (!Array.isArray(rows) || rows.length !== 2) return null;
  const cands = rows.map((r) => ({ name: String(r.name || r.client || '').trim(), date: dateOf(r) ? longDateYear(dateOf(r)) : null }));
  return DL.twoClients(String(name).trim(), cands);
}

// ── resolution: each act to a PLAN, read-only. A plan is { speak } | { stage } | { invoice } | null
//    (null = the door cannot say this, so the WHOLE message goes to the chain). ──────────────────
async function planMoney(supabase, vendor, act, L) {
  const name = act.client_as_spoken.trim();
  if (act.act === 'milestone_paid') {
    const d = resolveSpokenDate(act.date_as_spoken || null, { direction: 'past' });
    if (!d.ok) return { speak: d.reason === 'none' ? DL.LINES.B6 : DL.LINES.B7, key: d.reason === 'none' ? 'B6' : 'B7' };
    const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, true);
    if (!found.ok) {
      if (found.reason === 'not_found') return { speak: L.lifecycle.LINES.D5, key: 'D5' };
      if (found.reason === 'ambiguous') {
        const rows = await leadsNamed(supabase, vendor.id, name, true);
        const line = sameName(name, rows, (r) => r.wedding_date);
        return line ? { speak: line, key: 'B8', skipHarvest: true } : null;
      }
      return { speak: L.lifecycle.LINES.D8, key: 'D8' };
    }
    const client = String(found.lead.name || '').trim();
    const inv = await L.lifecycle.invoiceOfLead(supabase, vendor.id, found.lead.id);
    if (!inv.ok) return { speak: L.lifecycle.LINES.D8, key: 'D8' };
    const { data: before, error } = await L.lifecycle.readSchedule(supabase, vendor.id, inv.invoice.id);
    if (error) return { speak: L.lifecycle.LINES.D8, key: 'D8' };
    const pick = L.lifecycle.pickMilestone(before, act.milestone || '');
    if (!pick.ok) {
      if (pick.reason === 'already_paid') {
        const day = istDay(pick.row.paid_at);
        return day ? { speak: L.lifecycle.LINES.D7(client, String(pick.row.milestone_label || '').trim(), day), key: 'D7' } : { speak: L.lifecycle.LINES.D8, key: 'D8' };
      }
      const labels = L.lifecycle.unpaidLabels(before);
      return (pick.reason === 'unmatched' && labels.length) ? { speak: L.lifecycle.LINES.D6(labels), key: 'D6' } : { speak: L.lifecycle.LINES.D8, key: 'D8' };
    }
    const label = String(pick.row.milestone_label || '').trim();
    const line = DL.render('B1', { client, 'which payment': label, amount: digits(pick.row.amount_due), date: longDateYear(d.iso) });
    if (!line) return null;
    return { stage: { act: 'milestone_paid', request: { lead_id: found.lead.id, lead_name: client, milestone: act.milestone || label, milestone_id: pick.row.id, received_on: d.iso } }, speak: line, key: 'B1' };
  }
  // booking_confirmed · advance_paid
  let received;
  if (act.act === 'advance_paid') {
    const d = resolveSpokenDate(act.date_as_spoken || null, { direction: 'past' });
    if (!d.ok) return { speak: d.reason === 'none' ? DL.LINES.B6 : DL.LINES.B7, key: d.reason === 'none' ? 'B6' : 'B7' };
    received = d.iso;
  }
  const found = await L.lifecycle.resolveLead(supabase, vendor.id, name, false);
  if (!found.ok) {
    if (found.reason === 'not_found') { const line = DL.render('B4', { name }); return line ? { speak: line, key: 'B4' } : null; }
    if (found.reason === 'ambiguous') {
      const rows = await leadsNamed(supabase, vendor.id, name, false);
      const line = sameName(name, rows, (r) => r.wedding_date);
      return line ? { speak: line, key: 'B8', skipHarvest: true } : null;
    }
    return { speak: L.lifecycle.LINES.F29, key: 'F29' };
  }
  const client = String(found.lead.name || '').trim();
  const { data: lp, error } = await supabase.from('lead_packages').select('id, total, schedule, snapshot')
    .eq('lead_id', found.lead.id).eq('vendor_id', vendor.id).is('deleted_at', null).maybeSingle();
  if (error) return { speak: L.lifecycle.LINES.F29, key: 'F29' };
  if (!lp) { const line = DL.render('B5', { client }); return line ? { speak: line, key: 'B5' } : null; }
  const total = Number(lp.total);
  if (!Number.isInteger(total) || total <= 0) return { speak: L.lifecycle.LINES.F29, key: 'F29' };
  const pkgName = lp.snapshot && typeof lp.snapshot.name === 'string' ? lp.snapshot.name : null;
  const line = DL.render('B2', { client, package: pkgName, total: digits(total) });
  if (!line) return null;
  return { stage: { act: act.act, request: { lead_id: found.lead.id, lead_name: client, kind: act.act, ...(received ? { advance_received_on: received } : {}) } }, speak: line, key: 'B2' };
}

async function planInvoice(supabase, vendor, agentId, act) {
  const name = act.client_as_spoken.trim();
  const { data, error } = await supabase.schema('engine').from('records')
    .select('id, client, phone, amount, amount_received, note, date, hidden')
    .eq('agent_id', agentId).eq('hidden', false);
  if (error || !Array.isArray(data)) return null;
  const hits = data.filter((b) => key(b.client) === key(name));
  if (!hits.length) return null; // F-44.57: no binder, no byte; the whole message goes to the chain
  if (hits.length > 1) { const line = sameName(name, hits, (b) => b.date); return line ? { speak: line, key: 'B8', skipHarvest: true } : null; }
  const binder = hits[0];
  const client = String(binder.client || '').trim();
  if (!(Number(binder.amount) > 0)) { const line = DL.render('B11', { client }); return line ? { speak: line, key: 'B11' } : null; }
  const { data: invs, error: iErr } = await supabase.from('invoices').select('id, invoice_number, state, deleted_at')
    .eq('binder_id', binder.id).eq('vendor_id', vendor.id).is('deleted_at', null);
  if (iErr || !Array.isArray(invs)) return null;
  const live = invs.filter((i) => i.state !== 'cancelled' && i.invoice_number);
  if (live.length > 1) { const line = DL.invoiceNumbers(client, live.map((i) => i.invoice_number)); return line ? { speak: line, key: 'B10' } : null; }
  return { invoice: { binder, client } };
}

// ── apply a live row on her yes, through lifecycleHands' one helper ────────────────────────────────
async function applyRow(supabase, vendor, agentId, row, L) {
  const r = row.request || {};
  const call = row.act === 'milestone_paid'
    ? { name: 'donna_milestone_paid', input: { lead: r.lead_name, milestone: r.milestone, received_on: r.received_on } }
    : { name: 'donna_booking', input: { kind: r.kind, lead: r.lead_name, ...(r.advance_received_on ? { advance_received_on: r.advance_received_on } : {}) } };
  const out = await L.lifecycle.runLifecycleSignals(supabase, { vendor, agentId, result: { tool_calls: [call] } });
  const res = (out.results || [])[0] || null;
  let lines = out.lines || [];
  if (row.act !== 'milestone_paid' && res && (res.code === 'booked' || res.code === 'advance_recorded')) {
    const d1 = DL.render('D1', { client: res.client || r.lead_name, number: res.invoice_number });
    if (d1) lines = [d1, ...lines]; // R-44.21: booking alone speaks D1; an advance speaks D1 then D3 or D4
  }
  return { lines, res, call };
}

// The agent's current thread, READ ONLY, for the listener's context (F-44.39). The door never creates
// a conversation before it knows it will speak; persistDoorTurn does that through memory.js.
async function activeConversation(supabase, agentId) {
  try {
    const { data } = await supabase.schema('engine').from('conversations').select('id, state')
      .eq('agent_id', agentId).order('last_active_at', { ascending: false }).limit(1).maybeSingle();
    return data && data.state === 'active' && typeof data.id === 'string' ? data.id : null;
  } catch (_e) { return null; }
}

// Was the LAST assistant row of the agent's working thread the door's own confirmation question? Read from the
// door's meta on that row (persistDoorTurn writes meta.listener.asked = 'B1' or 'B2' only when it staged and asked).
async function lastWasDoorQuestion(supabase, agentId) {
  try {
    const conv = await activeConversation(supabase, agentId);
    if (!conv) return false;
    const { data, error } = await supabase.schema('engine').from('messages').select('id, role, meta, created_at')
      .eq('conversation_id', conv).eq('role', 'assistant').order('created_at', { ascending: false }).limit(1);
    if (error || !Array.isArray(data) || !data[0]) return false;
    const l = data[0].meta && data[0].meta.listener;
    return !!l && l.door === true && (l.asked === 'B1' || l.asked === 'B2');
  } catch (_e) { return false; }
}

// ── the one entry ─────────────────────────────────────────────────────────────────────────────────
// Returns { door: false, ear } for the chain, or { door: true, reply, toolCalls, toolNames, refresh,
// documents, keys, skipHarvest, ear }. The caller persists and sends (persistDoorTurn, speakOnWhatsApp).
//
// ONCE THE DOOR HAS WRITTEN ANYTHING, THE TURN IS THE DOOR'S TO THE END (the chair's rule on P5's cut).
// Before the first write any failure goes to the chain, as it always could. `st.wrote` is set BEFORE each
// write is attempted (a write that throws may still have landed), and from then on no path returns the
// chain: the catch answers with what is honestly known, the lines already earned, else the act's own
// refusal byte (D8 for a payment, F29 for a booking) or, for an invoice, the founder's vetoed glitch line.
// After-the-act stamps (markApplied) run in their own guard, so a failed stamp cannot mask a payment
// that landed. One message, one handler; confirm-before-money survives a hiccup.
function glitchLine() {
  try { return require('../../api/vendor-engine/chat').STAGE2_LINE_MUTATION || null; } catch (_e) { return null; }
}
// (the chair's cure on r2) BEFORE the door speaks D8 or F29 from the after-write catch it RE-READS the row it
// meant to write. Landed: the truthful existing byte (D7 for a payment already marked, D1 for a booking that
// stands, its number read from the row). Nothing landed, or the re-read fails: D8 or F29.
async function reread(supabase, vendorId, row, L) {
  try {
    const r = (row && row.request) || {};
    if (row.act === 'milestone_paid') {
      const { data, error } = await supabase.from('payment_schedules').select('id, milestone_label, state, paid_at')
        .eq('id', r.milestone_id).eq('vendor_id', vendorId).maybeSingle();
      if (error || !data) return null;
      if (data.state !== 'paid') return null;
      const day = istDay(data.paid_at);
      return day ? L.lifecycle.LINES.D7(String(r.lead_name || '').trim(), String(data.milestone_label || '').trim(), day) : null;
    }
    const { data: lead, error } = await supabase.from('leads').select('id, name, state, binder_id')
      .eq('id', r.lead_id).eq('vendor_id', vendorId).maybeSingle();
    if (error || !lead || String(lead.state || '').toLowerCase() !== 'booked' || !lead.binder_id) return null;
    const { data: invs, error: iErr } = await supabase.from('invoices').select('invoice_number, state, lead_package_id, deleted_at')
      .eq('lead_id', lead.id).eq('vendor_id', vendorId).is('deleted_at', null);
    if (iErr || !Array.isArray(invs)) return null;
    const pkg = invs.filter((i) => i.lead_package_id && i.state !== 'cancelled' && i.invoice_number);
    return pkg.length === 1 ? DL.render('D1', { client: String(lead.name || '').trim(), number: pkg[0].invoice_number }) : null;
  } catch (_e) { return null; }
}

function doorAnswer(st, why) {
  const lines = st.lines.filter(Boolean);
  let reply = lines.join('\n\n');
  // The glitch byte is read lazily from its one home (b90 14.1 proves it loads cold in both orders); B3 is the
  // last resort only if that home cannot load at all.
  if (!reply) reply = st.fallback || glitchLine() || DL.LINES.B3;
  return { door: true, reply, keys: st.keys, toolCalls: st.toolCalls, toolNames: st.toolCalls.map((t) => t.name), refresh: st.refresh, documents: st.documents, skipHarvest: st.skipHarvest, ear: st.ear, ...(why ? { why } : {}) };
}

async function preTurn(args, depsIn) {
  const st = { wrote: false, rereadRow: null, ctx: null, ear: null, lines: [], keys: [], toolCalls: [], documents: [], refresh: false, skipHarvest: false, fallback: null };
  try {
    // e-16's lesson: the arguments are taken INSIDE the guard, so a hostile argument cannot throw past it.
    const { supabase, vendor, agentId, route, message, lane, conversationId } = (args && typeof args === 'object') ? args : {};
    const deps = (depsIn && typeof depsIn === 'object') ? depsIn : {};
    if (!supabase || !vendor || typeof vendor.id !== 'string' || typeof agentId !== 'string' || typeof message !== 'string' || !message.trim()) return CHAIN(null, 'no_input');
    if (!['pwa', 'whatsapp'].includes(lane)) return CHAIN(null, 'no_lane');
    const L = lazy(deps);
    const pma = deps.pma || PMA; // a seam for b90's throw injection; production passes nothing
    const nowMs = Number.isFinite(deps.nowMs) ? deps.nowMs : Date.now();

    // 1 · the pending check, BEFORE the listener
    const said = PMA.decide(message);
    const live = await pma.liveRow(supabase, vendor.id, nowMs);
    if (live && said === 'no') {
      st.wrote = true; st.lines = [DL.LINES.B3]; st.keys = ['B3']; st.skipHarvest = true;
      await pma.markDeclined(supabase, live);
      return doorAnswer(st);
    }
    if (live && said === 'yes') {
      st.wrote = true; st.rereadRow = live; st.ctx = { supabase, vendorId: vendor.id, L };
      st.fallback = live.act === 'milestone_paid' ? L.lifecycle.LINES.D8 : L.lifecycle.LINES.F29;
      await pma.markConfirmed(supabase, live);
      const { lines, res, call } = await applyRow(supabase, vendor, agentId, live, L);
      st.lines = lines.filter(Boolean);
      st.toolCalls = [{ name: call.name, input: call.input, result: res ? res.code : null }];
      st.refresh = !!(res && res.ok);
      try { await pma.markApplied(supabase, live, res || null); } catch (e) { try { console.warn('[door:markApplied]', e && e.message); } catch (_e) { /* */ } }
      return doorAnswer(st);
    }
    if (live && said === null) await pma.markExpired(supabase, live); // a stamp, not an act: the row is not live either way
    if (!live && said !== null) {
      // F-44.58 (the chair's rule, cured in P5): if the LAST assistant row of the working thread is the door's own
      // confirmation question (B1 or B2, known from the door's meta on that row, never by matching text), her bare
      // yes or no answers THAT question, which has lapsed: the door answers and the chain is not called, so Victor
      // never marks a payment outside the window. What she reads is B14, his (R-44.22 (a)).
      if (await lastWasDoorQuestion(supabase, agentId)) {
        try { for (const r of await PMA.openRows(supabase, vendor.id)) if (r.state === 'staged') await PMA.markExpired(supabase, r); } catch (_e) { /* a stamp */ }
        return { door: true, reply: DL.LINES.B14, keys: ['B14'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: null, why: 'lapsed_question' };
      }
      return CHAIN(null, 'yes_no_nothing_waiting');
    }

    // 2 · hear, before the reply, bounded
    const seat = L.listener.listenerSeat(route);
    if (typeof seat.provider !== 'string' || !seat.provider || typeof seat.model !== 'string' || !seat.model) return CHAIN(null, 'no_seat');
    const threadId = conversationId || await activeConversation(supabase, agentId);
    st.ear = await L.listener.hear({ supabase, route, message, conversationId: threadId, excludeId: null },
      { ...(deps.llmCreate ? { llmCreate: deps.llmCreate } : {}), timeoutMs: Number.isFinite(deps.hearMs) ? deps.hearMs : HEAR_BEFORE_REPLY_MS });
    if (!st.ear || !st.ear.request) return CHAIN(st.ear, 'no_request');
    if (!allCovered(st.ear.request)) return CHAIN(st.ear, 'uncovered');

    // 3 · resolve every act first, read-only; any act the door cannot say sends the WHOLE message to the chain
    const acts = st.ear.request.acts;
    const money = acts.filter((a) => MONEY_ACTS.includes(a.act));
    const plans = [];
    for (const a of acts) {
      if (a.act === 'invoice') { const p = await planInvoice(supabase, vendor, agentId, a); if (!p) return CHAIN(st.ear, 'invoice_unresolved'); plans.push({ act: a, plan: p }); }
    }
    let moneyPlan = null;
    if (money.length) { moneyPlan = await planMoney(supabase, vendor, money[0], L); if (!moneyPlan) return CHAIN(st.ear, 'money_unsayable'); }

    // 4 · act: invoices first (they speak first), then the one money act is staged and asked
    for (const { plan } of plans) {
      if (plan.speak) { st.lines.push(plan.speak); st.keys.push(plan.key); if (plan.skipHarvest) st.skipHarvest = true; continue; }
      st.wrote = true; // an invoice may be minted inside the call, even if the call then fails
      st.fallback = glitchLine();
      const gen = await L.generateInvoiceForBinder(supabase, vendor, plan.invoice.binder);
      if (!gen || !gen.ok) continue; // written or not, it is the door's now: the fallback speaks if nothing else does
      const served = gen.made === 'served';
      const line = served ? DL.render('B9', { number: gen.invoice_number, client: plan.invoice.client }) : DL.invoiceReady(gen.invoice_number, plan.invoice.client);
      if (line) { st.lines.push(line); st.keys.push(served ? 'B9' : 'B13'); }
      st.documents.push({ invoice_number: gen.invoice_number, pdf_url: gen.pdf_url, client: plan.invoice.client, binder_id: plan.invoice.binder.id });
      st.toolCalls.push({ name: HANDS.invoice, input: { binder_id: plan.invoice.binder.id }, result: served ? 'served' : 'minted' });
      st.refresh = true;
    }
    if (moneyPlan) {
      if (moneyPlan.stage) {
        const refusal = moneyPlan.stage.act === 'milestone_paid' ? 'D8' : 'F29';
        st.wrote = true; st.fallback = L.lifecycle.LINES[refusal];
        let row = null;
        try { row = await pma.stage(supabase, { vendorId: vendor.id, act: moneyPlan.stage.act, request: moneyPlan.stage.request, lane }); }
        catch (e) {
          // The stage may have landed before the throw. A staged row she was never asked about must not
          // stay live for a later yes, so every open staged row is closed, best-effort, and the refusal speaks.
          try { console.warn('[door:stage]', e && e.message); } catch (_e) { /* */ }
          try { for (const r of await PMA.openRows(supabase, vendor.id)) if (r.state === 'staged') await PMA.markExpired(supabase, r); } catch (_e) { /* */ }
          row = null;
        }
        if (!row) { st.lines.push(L.lifecycle.LINES[refusal]); st.keys.push(refusal); }
        else { st.lines.push(moneyPlan.speak); st.keys.push(moneyPlan.key); }
      } else { st.lines.push(moneyPlan.speak); st.keys.push(moneyPlan.key); if (moneyPlan.skipHarvest) st.skipHarvest = true; }
      if (money.length > 1) { st.lines.push(DL.LINES.B12); st.keys.push('B12'); }
    }
    if (!st.lines.filter(Boolean).length && !st.wrote) return CHAIN(st.ear, 'empty');
    return doorAnswer(st);
  } catch (e) {
    try { console.warn('[door:preTurn]', e && e.message); } catch (_e) { /* */ }
    if (st.wrote) {
      if (!st.lines.filter(Boolean).length && st.rereadRow && st.ctx) {
        const truth = await reread(st.ctx.supabase, st.ctx.vendorId, st.rereadRow, st.ctx.L);
        if (truth) { st.lines = [truth]; st.keys = [st.rereadRow.act === 'milestone_paid' ? 'D7' : 'D1']; }
      }
      return doorAnswer(st, 'exception_after_write');
    }
    return CHAIN(st.ear, 'exception');
  }
}

// THE WHATSAPP DOOR'S DELIVERY, ONE HOME. Called only once preTurn answered door: true. Every step runs in
// its OWN guard and the function never throws, so the lane can RETURN after it and never reach the chain:
// a failed send is a failed send, as it is on the chain today, never a second handler.
async function speakOnWhatsApp(args, depsIn) {
  const done = { persisted: false, sent: false, logged: false, documents: 0 };
  try {
    const { supabase, agentId, phone, convoId, message, out, sendWhatsApp } = (args && typeof args === 'object') ? args : {};
    const deps = (depsIn && typeof depsIn === 'object') ? depsIn : {};
    const persist = deps.persistDoorTurn || persistDoorTurn;
    if (!out || !out.door) return done;
    try { await persist({ supabase, agentId, message, out, lane: 'whatsapp' }); done.persisted = true; } catch (e) { console.error('[door:wa persist]', e && e.message); }
    let sent = null;
    try { sent = await sendWhatsApp(phone, out.reply, []); done.sent = true; } catch (e) { console.error('[door:wa send]', e && e.message); }
    try {
      await supabase.from('messages').insert({
        conversation_id: convoId, direction: 'outbound', channel: 'whatsapp', body: out.reply, sent_by: 'agent',
        twilio_sid: sent && sent.sid ? sent.sid : null, tool_calls: out.toolNames || [],
      });
      done.logged = true;
    } catch (e) { console.error('[door:wa outbound row]', e && e.message); }
    try { await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convoId); } catch (e) { console.error('[door:wa last_message_at]', e && e.message); }
    for (const d of (Array.isArray(out.documents) ? out.documents : [])) {
      try {
        const docMsg = await sendWhatsApp(phone, '', [d.pdf_url]);
        await supabase.from('messages').insert({
          conversation_id: convoId, direction: 'outbound', channel: 'whatsapp', body: `[invoice PDF ${d.invoice_number}]`, sent_by: 'agent',
          twilio_sid: docMsg && docMsg.sid ? docMsg.sid : null, media_url: d.pdf_url,
        });
        done.documents += 1;
      } catch (e) { console.error('[door:wa invoice-pdf-send]', e && e.message); }
    }
  } catch (e) { try { console.error('[door:wa]', e && e.message); } catch (_e) { /* */ } }
  return done;
}

// ── the thread and the meter for a door-only turn. Never throws. ──────────────────────────────────
// The user row and the door's row join the SAME engine thread the chain uses (memory.js, the dist
// exports; no engine source is edited), the row is stamped room 'business' as recordMessageRoom
// stamps it, meta.listener carries the request, and ONE counted usage row is written through
// harvest's writer with this conversation's id (F-44.52): the listener's own call when there was
// one, a zero-cost row when the turn was a yes or a no (it is still one message, R-44.21 (b)).
async function persistDoorTurn(args, depsIn) {
  const res = { conversationId: null, assistantId: null };
  try {
    const { supabase, agentId, message, out, lane } = (args && typeof args === 'object') ? args : {};
    const deps = (depsIn && typeof depsIn === 'object') ? depsIn : {};
    const memory = deps.memory || require('../../engine/dist/core/memory');
    const meter = deps.meter || require('../../agent/harvest')._meter;
    const { conversationId } = await memory.getOrCreateConversation(agentId);
    res.conversationId = conversationId;
    await memory.saveMessage(conversationId, 'user', message);
    const ear = out && out.ear;
    const asked = (Array.isArray(out.keys) ? out.keys : []).find((k) => k === 'B1' || k === 'B2') || null; // F-44.58's mark
    const listener = { lane, provider: ear && ear.seat ? ear.seat.provider : null, model: ear && ear.seat ? ear.seat.model : null, request: ear ? ear.request : null, door: true, ...(asked ? { asked } : {}), ...(ear && ear.error ? { error: ear.error } : {}) };
    res.assistantId = await memory.saveMessage(conversationId, 'assistant', out.reply, (out.toolCalls && out.toolCalls.length) ? out.toolCalls : undefined, { listener });
    if (res.assistantId) {
      try { await supabase.schema('engine').from('messages').update({ room: 'business' }).eq('id', res.assistantId); } catch (e) { console.warn('[door:room]', e && e.message); }
    }
    const row = ear && ear.usage ? meter.harvestMeterRow({ usage: ear.usage }, ear.seat && ear.seat.model) : meter.harvestMeterRow({ usage: {} }, 'door');
    await meter.writeHarvestUsage(supabase, agentId, { ...row, conversation_id: conversationId });
  } catch (e) { try { console.warn('[door:persist]', e && e.message); } catch (_e) { /* */ } }
  return res;
}

module.exports = { preTurn, persistDoorTurn, speakOnWhatsApp, doorAnswer, glitchLine, reread, lastWasDoorQuestion, allCovered, planMoney, planInvoice, applyRow, HEAR_BEFORE_REPLY_MS, COVERED, MONEY_ACTS, HANDS };
