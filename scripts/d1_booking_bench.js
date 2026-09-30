#!/usr/bin/env node
'use strict';
// scripts/d1_booking_bench.js · DESIGN-1 · STAGE 4 · THE ONE-TAP BOOK, the server's half (the founder).
// Holds, driving the real src/lib/vendor/promotion.js and src/lib/vendor/unbooking.js against b83's fake store (its
// makeDb, world, engineFakes and fakeWriteEvent, read from b83's own source so the fixture has one home):
//   §1 the booking: each function date its own event; a date the booking already has is kept, never doubled; the
//      calendar is always filled (no date anywhere → refused before anything is written); "No package, enter an
//      amount" (the full amount, or the advance and the balance with the advance paid); what it wrote is returned.
//   §2 Undo and Cancel booking: a dry run lists what would go and writes nothing; Undo removes exactly what the
//      booking wrote and puts the lead back; an invoice with money on it is never removed; nothing is removed unasked;
//      only a booked lead of hers.
// RED MUTATIONS, one per claim.
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let pass = 0, fail = 0;
const ok = (name, c, why) => { if (c) { pass++; console.log(`  GREEN  ${name}`); } else { fail++; console.log(`  RED    ${name}${why ? ' — ' + why : ''}`); } };

// b83's fixtures, from its source: makeDb through fakeWriteEvent (the lines before its runner)
const b83 = read('scripts/b83_lc2_p3_promotion_bench.js');
const fixtureSrc = b83.slice(b83.indexOf('function makeDb('), b83.indexOf('(async () => {', b83.indexOf('function fakeWriteEvent(')));
// eslint-disable-next-line no-new-func
const F = new Function(`${fixtureSrc}; return { makeDb, world, engineFakes, fakeWriteEvent, V, OTHER, AGENT, U, SARAH_LP };`)();
const { makeDb, world, engineFakes, fakeWriteEvent, V, OTHER, AGENT, U } = F;

function load(rel, src) {
  const file = path.join(ROOT, rel);
  const m = new Module(file, module); m.filename = file; m.paths = Module._nodeModulePaths(path.dirname(file));
  m._compile(src, file);
  return m.exports;
}
const quiet = async (fn) => { const w = console.warn, e = console.error; console.warn = () => {}; console.error = () => {}; try { return await fn(); } finally { console.warn = w; console.error = e; } };

async function promote(P, db, params) {
  const log = [];
  const deps = { engine: engineFakes(db, log), writeEvent: fakeWriteEvent(db), uuid: (() => { let n = 0; return () => U(++n); })() };
  return quiet(() => P.promoteLead(db, { vendor: V, agentId: AGENT, ...params }, deps));
}
async function unbook(Ub, db, params) {
  const hidden = [];
  const deps = { hideBinder: async (agent, id) => { hidden.push(id); const r = db.tables['engine.records'].find((x) => x.id === id); if (r) r.hidden = true; return true; } };
  const out = await quiet(() => Ub.unbookLead(db, { vendor: V, agentId: AGENT, ...params }, deps));
  return { out, hidden };
}
const writes = (db) => db.calls.filter((c) => c.op !== 'select').length;

async function bookingCells(P) {
  const r = {};
  // 1.1 each function date its own event
  let db = makeDb(world());
  let o = await promote(P, db, { leadId: 'lead-sarah', kind: 'booking_confirmed', functions: [{ date: '2026-12-20', title: 'Sarah · haldi' }, { date: '2026-12-21', title: 'Sarah · sangeet' }, { date: '2026-12-22' }] });
  const evs = db.tables.events.filter((e) => e.linked_lead_id === 'lead-sarah');
  r.each = o.status === 200 && evs.length === 3 && evs.map((e) => e.event_date).join(',') === '2026-12-20,2026-12-21,2026-12-22'
    && evs[0].title === 'Sarah · haldi' && evs[2].title === 'Sarah · wedding';
  r.returned = o.status === 200 && Array.isArray(o.body.promoted.events) && o.body.promoted.events.filter((e) => e.created).length === 3
    && o.body.promoted.invoice_created === true && o.body.promoted.previous_state === 'quoted';
  r.book1 = { db, out: o };
  // 1.2 a date the booking already has is kept, never doubled
  db = makeDb(world({ events: [{ id: 'ev-old', vendor_id: V.id, title: 'Sarah · wedding', event_date: '2026-12-22', kind: 'ceremony', linked_lead_id: 'lead-sarah', linked_binder_id: null, state: 'upcoming', deleted_at: null }] }));
  o = await promote(P, db, { leadId: 'lead-sarah', kind: 'booking_confirmed', functions: [{ date: '2026-12-20' }, { date: '2026-12-22' }, { date: '2026-12-22' }] });
  const on22 = db.tables.events.filter((e) => e.event_date === '2026-12-22' && !e.deleted_at);
  r.kept = o.status === 200 && on22.length === 1 && on22[0].id === 'ev-old' && db.tables.events.length === 2
    && o.body.promoted.events.some((e) => e.id === 'ev-old' && e.existing);
  r.book2 = { db, out: o };
  // 1.3 the calendar is always filled: nothing anywhere is refused before any write
  db = makeDb(world({ leads: [{ id: 'lead-nodate', vendor_id: V.id, name: 'Nodate', phone: null, wedding_date: null, state: 'new', binder_id: null, deleted_at: null }] }));
  o = await promote(P, db, { leadId: 'lead-nodate', kind: 'booking_confirmed', amount: 40000 });
  r.filled = o.status === 422 && o.body.code === 'no_date' && writes(db) === 0;
  // 1.4 no package, enter an amount (booking confirmed): the full amount, no package on the invoice
  db = makeDb(world());
  o = await promote(P, db, { leadId: 'lead-bare', kind: 'booking_confirmed', amount: 50000 });
  const inv = db.tables.invoices[0];
  const rows4 = db.tables.payment_schedules.filter((s) => inv && s.invoice_id === inv.id);
  r.amount = o.status === 200 && !!inv && inv.amount_total === 50000 && inv.lead_package_id == null && rows4.length === 1 && rows4[0].amount_due === 50000 && rows4[0].milestone_label === 'Full amount' && inv.amount_advance == null;
  // 1.5 no package, advance paid: the advance (paid on its day) and the balance
  db = makeDb(world());
  o = await promote(P, db, { leadId: 'lead-bare', kind: 'advance_paid', advanceReceivedOn: '2026-09-29', amount: 50000, advanceAmount: 20000 });
  const inv5 = db.tables.invoices[0];
  const rows5 = db.tables.payment_schedules.filter((s) => inv5 && s.invoice_id === inv5.id).sort((a, b) => a.ordinal - b.ordinal);
  const rec5 = db.tables['engine.records'][0];
  r.advance = o.status === 200 && rows5.length === 2 && rows5[0].milestone_label === 'Advance' && inv5.amount_advance === 20000 && rows5[0].amount_due === 20000 && rows5[0].state === 'paid'
    && rows5[1].milestone_label === 'Balance' && rows5[1].amount_due === 30000 && !!rec5 && rec5.amount_received === 20000;
  r.book5 = { db, out: o };
  // 1.6 neither a package nor an amount: the refusal it always was
  db = makeDb(world());
  o = await promote(P, db, { leadId: 'lead-bare', kind: 'booking_confirmed' });
  r.nopkg = o.status === 422 && o.body.code === 'no_package';
  // 1.7 a bad amount or a bad date is refused by name
  db = makeDb(world());
  const bad1 = await promote(P, db, { leadId: 'lead-bare', kind: 'booking_confirmed', amount: 12.5 });
  const bad2 = await promote(P, db, { leadId: 'lead-sarah', kind: 'booking_confirmed', functions: [{ date: 'soon' }] });
  r.invalid = bad1.status === 422 && bad1.body.field === 'amount' && bad2.status === 422 && bad2.body.field === 'functions';
  return r;
}

async function unbookCells(P, Ub) {
  const r = {};
  // 2.1 a dry run lists the events and the invoice and writes nothing
  let { db, out } = await (async () => { const x = (await bookingCells(P)).book1; return x; })();
  const before = writes(db);
  let u = await unbook(Ub, db, { leadId: 'lead-sarah', dryRun: true });
  r.dry = u.out.status === 200 && u.out.body.plan.events.length === 3 && !!u.out.body.plan.invoice && u.out.body.plan.invoice.paid === false && writes(db) === before;
  // 2.2 Undo: exactly what the booking wrote, and the lead back to what it was
  const booked2 = (await bookingCells(P)).book2; db = booked2.db; out = booked2.out;
  const created = out.body.promoted.events.filter((e) => e.created).map((e) => e.id);
  u = await unbook(Ub, db, { leadId: 'lead-sarah', eventIds: created, backTo: out.body.promoted.previous_state, removeEvents: true, removeInvoice: true });
  const lead = db.tables.leads.find((l) => l.id === 'lead-sarah');
  const old = db.tables.events.find((e) => e.id === 'ev-old');
  const gone = db.tables.events.filter((e) => created.includes(e.id));
  const invU = db.tables.invoices[0];
  r.undo = u.out.status === 200 && lead.state === 'quoted' && lead.binder_id === null && old && !old.deleted_at && gone.length === 1 && gone.every((e) => e.deleted_at && e.state === 'cancelled')
    && invU.state === 'cancelled' && !!invU.deleted_at && u.hidden.length === 1;
  // 2.3 an invoice with money on it is never removed
  const b5 = (await bookingCells(P)).book5; db = b5.db;
  u = await unbook(Ub, db, { leadId: 'lead-bare', removeEvents: true, removeInvoice: true });
  const inv5 = db.tables.invoices[0];
  r.paid = u.out.status === 200 && u.out.body.unbooked.invoice_kept_paid === true && u.out.body.unbooked.invoice_removed === false && inv5.state !== 'cancelled' && !inv5.deleted_at && u.hidden.length === 0;
  // 2.4 nothing is removed unasked (Cancel booking with both answers no)
  const b1 = (await bookingCells(P)).book1; db = b1.db;
  u = await unbook(Ub, db, { leadId: 'lead-sarah' });
  r.unasked = u.out.status === 200 && db.tables.events.filter((e) => !e.deleted_at).length === 3 && db.tables.invoices[0].state !== 'cancelled'
    && db.tables.leads.find((l) => l.id === 'lead-sarah').state === 'contacted';
  // 2.5 found by the client's binder (the client's page), and only a booked lead of hers
  const b1b = (await bookingCells(P)).book1; db = b1b.db;
  const binder = db.tables.leads.find((l) => l.id === 'lead-sarah').binder_id;
  const byBinder = await unbook(Ub, db, { binderId: binder, dryRun: true });
  const notBooked = await unbook(Ub, db, { leadId: 'lead-bare' });
  const other = await unbook(Ub, db, { leadId: 'lead-other' });
  r.scope = byBinder.out.status === 200 && byBinder.out.body.plan.lead_id === 'lead-sarah' && notBooked.out.status === 422 && notBooked.out.body.code === 'not_booked' && other.out.status === 404;
  return r;
}

(async () => {
  const PS = read('src/lib/vendor/promotion.js'), US = read('src/lib/vendor/unbooking.js');
  const P = load('src/lib/vendor/promotion.js', PS), Ub = load('src/lib/vendor/unbooking.js', US);
  console.log('\n§1 the booking');
  const b = await bookingCells(P);
  const B = {
    '1.1': ['1.1 each function date is its own event, with its own title', b.each],
    '1.2': ['1.2 a date the booking already has is kept, never doubled', b.kept],
    '1.3': ['1.3 the calendar is always filled: with no date anywhere the booking is refused before anything is written', b.filled],
    '1.4': ['1.4 No package, enter an amount: the invoice is the amount, in full', b.amount],
    '1.5': ['1.5 No package, advance paid: the advance (paid on its day) and the balance', b.advance],
    '1.6': ['1.6 neither a package nor an amount: refused as it always was', b.nopkg],
    '1.7': ['1.7 a bad amount or a bad date is refused by name', b.invalid],
    '1.8': ['1.8 the booking returns what it wrote (events, the invoice, the state before), for Undo', b.returned],
  };
  for (const [, [n, c]] of Object.entries(B)) ok(n, c);
  console.log('\n§2 Undo and Cancel booking');
  const u = await unbookCells(P, Ub);
  const Uc = {
    '2.1': ['2.1 a dry run lists the events and the invoice (paid or not) and writes nothing', u.dry],
    '2.2': ['2.2 Undo removes exactly what the booking wrote (an older event stays) and puts the lead back', u.undo],
    '2.3': ['2.3 an invoice with money on it is never removed', u.paid],
    '2.4': ['2.4 nothing is removed unasked; the lead goes back to an enquiry', u.unasked],
    '2.5': ['2.5 found by the client’s binder; only a booked lead, only hers', u.scope],
  };
  for (const [, [n, c]] of Object.entries(Uc)) ok(n, c);
  console.log('\n§3 the doors');
  const lp = read('src/api/vendor/leadPackages.js');
  ok('3.1 the booking door accepts the function dates and the amount, and names them', /PROMOTE_KEYS = \['kind', 'advance_received_on', 'functions', 'amount', 'advance_amount'\]/.test(lp) && /functions: body\.functions,\s*amount: body\.amount,\s*advanceAmount: body\.advance_amount,/.test(lp));
  ok('3.2 the unbook door is behind her session and her ledger, and refuses an unknown key', /router\.post\('\/unbook', requireAuth, resolveVendor\(\), resolveAgent\(\)/.test(lp) && /UNBOOK_KEYS\.includes\(k\)/.test(lp));
  console.log('\n§4 mutations');
  const muts = [
    ['4.1 the function dates ignored → 1.1 RED', 'promotion', PS.replace('if (fnList && fnList.length) {\n          // DESIGN-1', 'if (false) {\n          // DESIGN-1'), (x) => x.each],
    ['4.2 the calendar check removed → 1.3 RED', 'promotion', PS.replace("if (!had || !had.length) return refused('no_date');", ''), (x) => x.filled],
    ['4.3 a paid invoice removed anyway → 2.3 RED', 'unbooking', US.replace('if (removeInvoice === true && invoice && !paid) {', 'if (removeInvoice === true && invoice) {'), (x) => x.paid],
    ['4.4 Undo removes every event, not only what it wrote → 2.2 RED', 'unbooking', US.replace('if (eventIds) events = events.filter((e) => eventIds.includes(e.id));', ''), (x) => x.undo],
  ];
  for (const [name, which, src, cellOf] of muts) {
    if (src === (which === 'promotion' ? PS : US)) { ok(name, false, 'the mutation did not apply'); continue; }
    const P2 = which === 'promotion' ? load('src/lib/vendor/promotion.js', src) : P;
    const U2 = which === 'unbooking' ? load('src/lib/vendor/unbooking.js', src) : Ub;
    const x = which === 'promotion' ? await bookingCells(P2) : await unbookCells(P2, U2);
    ok(name, !cellOf(x));
  }
  console.log(`\n${fail ? 'RED' : 'GREEN'} — d1 booking ${pass}/${pass + fail}`);
  process.exit(fail ? 1 : 0);
})();
