'use strict';
// src/lib/vendor/dueWeek.js · WHAT'S DUE THIS WEEK, ONE READ. P7 cut 4 (CE-45 LCV-14; LCV-12's designs file §4.4 as ruled, Q1, F-44.129).
//
// THE WEEK: today through today plus six, in IST (istClock.js istTodayISO :59, istPlusDaysISO :64), from the door's nowMs. A milestone due before today
// is NOT "due this week" (the card's estate note, the chair's ruling of 23 September).
// THE PAYMENTS: pending payment_schedules with a due date in the week, in the room's own select (reminders.js :104 to :110: id, invoice_id, milestone_label,
// amount_due, due_date; vendor_id; state 'pending', the table's CHECK admitting pending, paid, waived), their clients' names in ONE batched read of
// invoices.client_name (reminders.js :84 to :88's read). THE SHOOTS: events of kind shoot, state upcoming, deleted_at null, dated in the week.
// Both ordered by day. READ ONLY; money is never touched. The window is ALSO applied to the rows returned, so the answer never rests on the query alone.
// Returns { ok:true, payments:[{ client, milestone, amount, date }], shoots:[{ client, date }] } with raw ISO days and whole-rupee amounts (the door renders),
// or { ok:false } on any failed read (C-44.4: a failed read is not an empty week). TOTAL: never throws.
const { istTodayISO, istPlusDaysISO } = require('./istClock');

const byDay = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);

async function dueThisWeek(supabase, vendorId, nowMs) {
  try {
    const now = Number.isFinite(nowMs) ? nowMs : Date.now();
    const from = istTodayISO(now); const to = istPlusDaysISO(6, now);
    const inWeek = (d) => typeof d === 'string' && d >= from && d <= to;
    const { data: ms, error: mErr } = await supabase.from('payment_schedules').select('id, invoice_id, milestone_label, amount_due, due_date')
      .eq('vendor_id', vendorId).eq('state', 'pending').not('due_date', 'is', null).gte('due_date', from).lte('due_date', to)
      .order('due_date', { ascending: true });
    if (mErr || !Array.isArray(ms)) return { ok: false };
    const rows = ms.filter((m) => m && inWeek(m.due_date));
    const ids = [...new Set(rows.map((m) => m.invoice_id).filter(Boolean))];
    const names = new Map();
    if (ids.length) {
      const { data: invs, error: iErr } = await supabase.from('invoices').select('id, client_name').in('id', ids);
      if (iErr || !Array.isArray(invs)) return { ok: false };
      for (const i of invs) if (i && typeof i.client_name === 'string') names.set(i.id, i.client_name.trim());
    }
    const { data: evs, error: eErr } = await supabase.from('events').select('id, title, event_date, kind, state')
      .eq('vendor_id', vendorId).is('deleted_at', null).eq('state', 'upcoming').eq('kind', 'shoot').gte('event_date', from).lte('event_date', to)
      .order('event_date', { ascending: true });
    if (eErr || !Array.isArray(evs)) return { ok: false };
    const payments = rows.map((m) => ({ client: names.get(m.invoice_id) || null, milestone: m.milestone_label, amount: m.amount_due, date: m.due_date })).sort(byDay);
    const shoots = evs.filter((e) => e && e.kind === 'shoot' && e.state === 'upcoming' && inWeek(e.event_date)).map((e) => ({ client: e.title, date: e.event_date })).sort(byDay);
    return { ok: true, payments, shoots, from, to };
  } catch (_e) { return { ok: false }; }
}

module.exports = { dueThisWeek };
