// src/lib/vendor/invoices.js
// THE WRITER HOME FOR public.invoices. ONE HOME, ALL VERBS.
//
// Called by REST handlers (src/api/vendor/invoices.js, src/api/vendor/money.js),
// the vendor engine chat door (src/api/vendor-engine/chat.js — Victor),
// src/agent/engine.js's tool WRITE BLOCKS, and src/index.js.
//
// ── WHY THIS FILE AND NOT src/lib/money/  [CE-39 2c, c-39.32] ───────────────
// The 2c kickoff ruled a NEW home at `src/lib/money/{invoices,expenses}.js`. It
// was authored blind of this tree: `createInvoice` and `updateInvoice` were
// already here, already typed, already the only importers' target. Founding a
// second home for functions that have one is the defect `lib/vendor/events.js`
// was just convicted of from the other side (F-39.20) — a superseded home left
// standing. The chair adopted the seat's arm: the home is HERE, it grows, and
// `src/lib/money/` is never created.
//
// ── WHAT 2c ADDED, AND WHERE IT CAME FROM ──────────────────────────────────
// `recordPayment` and `cancelInvoice` were inline in the REST router
// (src/api/vendor/invoices.js `/:invoiceId/payments` and `/:invoiceId/cancel`)
// and inline again in `src/agent/engine.js` (`case 'record_payment'`). Two
// implementations of one verb on one table is how they drift, and they HAD:
// see the F-39.29 line in this sitting's handover.
//
// Counter increment is NOT atomic here -- we do a read-then-write.
// Acceptable for founding cohort scale (<50 vendors, low concurrency).
// TODO: replace with a Postgres function when concurrent invoice creation
// becomes a real risk (post-launch scaling).
//
// ── COLUMN WITNESS · SQL-PROVENANCE LAW (F-P3.12) ──────────────────────────
// Ordinals are `information_schema.columns.ordinal_position` as witnessed in
// `docs/db/PUBLIC_SCHEMA.md` at dream-os 051a413. `public.invoices` skips
// ordinal 18, so printed position and ordinal differ — match on the NUMBER.
//   invoice_number(4) client_name(5) description(7) amount_total(8)
//   amount_paid(10) due_date(11) state(12) created_at(15)
//   last_payment_at(19) deleted_at(20) has_schedule(21)
// State vocabulary from the table's own CHECK, `invoices_state_check`:
//   {unpaid, advance_paid, paid, cancelled}

'use strict';

// G2 · R-G2.8. The seal's visibility rule is IMPORTED, never restated — `three`
// lives once, beside the computation that produces the count it tests.
const { sealIsVisible } = require('./seal');

// ── THE TRANSITIONABLE SET · A POSITIVE LIST, NEVER A NEGATION  [F-39.8] ────
// R-39.12 earned this on this exact table: `state <> 'paid'` reads every
// UNKNOWN as included, the unknown being any state a future migration adds. So
// a payment may move an invoice only FROM one of these two, and `cancelled`
// and `paid` are excluded by being absent rather than by being named.
const PAYABLE_STATES = ['unpaid', 'advance_paid'];

// ── createInvoice ─────────────────────────────────────────────────────────

async function createInvoice(supabase, vendorId, params) {
  const {
    client_name, client_phone, client_id, lead_id,
    description, amount_total, amount_advance,
    due_date, notes,
  } = params;

  if (!client_name || !client_name.trim()) return { ok: false, error: 'client_name is required.' };
  if (!amount_total || amount_total <= 0) return { ok: false, error: 'amount_total must be greater than zero.' };
  if (amount_advance != null && amount_advance < 0) return { ok: false, error: 'amount_advance cannot be negative.' };
  if (amount_advance != null && amount_advance > amount_total) return { ok: false, error: 'amount_advance cannot exceed amount_total.' };

  // Fetch vendor for prefix/counter/handle
  const { data: v, error: vendorErr } = await supabase
    .from('vendors')
    .select('id, business_name, upi_id, routing_handle, invoice_prefix, invoice_counter, user_id')
    .eq('id', vendorId)
    .single();
  if (vendorErr) return { ok: false, error: vendorErr.message };
  if (!v.routing_handle) return { ok: false, error: 'Onboarding incomplete -- cannot create invoice.' };

  // Set prefix if null
  if (!v.invoice_prefix) {
    const derived = 'TDW/' + v.routing_handle;
    await supabase.from('vendors').update({ invoice_prefix: derived }).eq('id', vendorId);
    v.invoice_prefix = derived;
  }

  // Increment counter
  const { data: vUpd, error: counterErr } = await supabase
    .from('vendors')
    .update({ invoice_counter: v.invoice_counter + 1 })
    .eq('id', vendorId)
    .select('invoice_counter')
    .single();
  if (counterErr) return { ok: false, error: 'Counter update failed: ' + counterErr.message };

  const invoiceNumber = v.invoice_prefix + '/' + String(vUpd.invoice_counter).padStart(2, '0');

  // Auto-link client by phone if client_id not provided
  let resolvedClientId = client_id || null;
  if (!resolvedClientId && client_phone) {
    const { data: match } = await supabase
      .from('clients')
      .select('id')
      .eq('vendor_id', vendorId)
      .eq('phone', client_phone)
      .is('deleted_at', null)
      .maybeSingle();
    if (match) resolvedClientId = match.id;
  }

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      vendor_id:      vendorId,
      lead_id:        lead_id        || null,
      client_id:      resolvedClientId,
      invoice_number: invoiceNumber,
      client_name:    client_name.trim(),
      client_phone:   client_phone   || null,
      description:    description    || null,
      amount_total,
      amount_advance: amount_advance || null,
      amount_paid:    0,
      due_date:       due_date       || null,
      state:          'unpaid',
      notes:          notes          || null,
    })
    .select('id, invoice_number, client_name, client_phone, amount_total, amount_advance, amount_paid, state, due_date, created_at')
    .single();

  if (invErr) return { ok: false, error: 'Could not create invoice: ' + invErr.message };
  return { ok: true, invoice, vendor: v };
}

// ── updateInvoice ─────────────────────────────────────────────────────────
// Only allowed when amount_paid = 0. Locked after any payment.

async function updateInvoice(supabase, vendorId, invoiceId, patch) {
  const EDITABLE = ['client_name', 'client_phone', 'description', 'amount_total', 'amount_advance', 'due_date', 'notes'];
  const update = {};
  for (const key of EDITABLE) {
    if (patch[key] !== undefined) update[key] = patch[key];
  }
  if (Object.keys(update).length === 0) return { ok: false, error: 'No editable fields provided.' };

  // Check lock
  const { data: existing } = await supabase
    .from('invoices')
    .select('id, amount_paid, state')
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!existing) return { ok: false, error: 'Invoice not found.' };
  if (existing.amount_paid > 0) {
    return { ok: false, error: 'Cannot edit invoice with payments. Cancel and re-issue.', code: 'INVOICE_LOCKED' };
  }
  if (existing.state === 'cancelled') {
    return { ok: false, error: 'Cannot edit a cancelled invoice.', code: 'INVOICE_CANCELLED' };
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .update(update)
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)
    .select('id, invoice_number, client_name, client_phone, amount_total, amount_advance, amount_paid, state, due_date, created_at')
    .maybeSingle();

  if (!invoice && !error) return { ok: false, error: 'Invoice not found.' };
  if (error) return { ok: false, error: error.message };
  return { ok: true, invoice };
}

// ── recordPayment ─────────────────────────────────────────────────────────
// THE MONEY VERB. Extracted from two inline implementations at CE-39 2c.
//
// ── F-39.8 CURED HERE, AND THIS IS THE WHOLE OF THE CURE ───────────────────
// Both prior implementations updated `amount_paid`, `state` and `updated_at`
// and NEVER STAMPED `last_payment_at`. That is why DROY550's two fully-paid
// invoices read `unpaid` and why the Books register renders 「no date on file」
// against them: the door had to date the credit by `created_at` because the
// payment's own clock was never written. The register was telling the truth
// about a database the writer had left incomplete.
//
// ── THE TRANSITION IS ARITHMETIC, GATED BY A POSITIVE LIST ─────────────────
// The engine's prior table read:
//     if (payment_type === 'balance' || newAmountPaid >= amount_total) 'paid'
//     else if (payment_type === 'advance' && state === 'unpaid') 'advance_paid'
// so a caller passing `payment_type: 'balance'` closed the invoice REGARDLESS
// of arithmetic — a Rs 1 payment declared 'balance' marked a Rs 50,000 invoice
// paid. Ruled at CE-39: the money decides, the label does not. `payment_type`
// survives on the params for the callers that pass it and is advisory only.
//
// EXISTING ROWS ARE NOT TOUCHED BY THIS CURE. DROY550's two invoices keep
// their stale state and their missing clock, and the register keeps saying so.
// A backfill is the founder's to ask for and the chair's to author.
async function recordPayment(supabase, vendorId, invoiceId, params) {
  const { amount, payment_type = null } = params || {};

  if (!invoiceId) return { ok: false, error: 'invoiceId is required.' };
  if (!amount || amount <= 0) return { ok: false, error: 'amount must be greater than zero.' };

  const { data: inv, error: readErr } = await supabase
    .from('invoices')
    .select('id, invoice_number, client_name, client_phone, lead_id, amount_total, amount_advance, amount_paid, state, due_date, created_at')
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();

  if (readErr) return { ok: false, error: readErr.message };
  if (!inv) return { ok: false, error: 'Invoice not found.' };

  // The two refusals are stated separately because they are different facts and
  // each caller renders a different sentence for them.
  if (inv.state === 'paid') {
    return { ok: false, error: 'Invoice is already fully paid.', code: 'INVOICE_PAID', invoice: inv };
  }
  if (!PAYABLE_STATES.includes(inv.state)) {
    return { ok: false, error: 'Cannot record a payment on this invoice.', code: 'INVOICE_NOT_PAYABLE', invoice: inv };
  }

  const priorState    = inv.state;
  const newAmountPaid = (Number(inv.amount_paid) || 0) + amount;

  // Overpayment is WARNED, never blocked. Shagun and tips arrive over the total
  // and the database does not object; a writer that refused them would be
  // refusing money the vendor actually banked.
  if (newAmountPaid > inv.amount_total) {
    console.warn(
      `[invoices:recordPayment] overpayment of Rs ${newAmountPaid - inv.amount_total} on ${inv.invoice_number} — recording as-is`,
    );
  }

  let newState = priorState;
  if (newAmountPaid >= inv.amount_total) newState = 'paid';
  else if (newAmountPaid > 0) newState = 'advance_paid';

  const stampedAt = new Date().toISOString();

  const { data: invoice, error } = await supabase
    .from('invoices')
    .update({
      amount_paid:     newAmountPaid,
      state:           newState,
      last_payment_at: stampedAt,
      updated_at:      stampedAt,
    })
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)
    .select('id, invoice_number, client_name, client_phone, lead_id, amount_total, amount_advance, amount_paid, state, due_date, created_at, last_payment_at')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!invoice) return { ok: false, error: 'Invoice not found.' };

  console.log(
    `[invoices:recordPayment] ${invoice.invoice_number} Rs ${amount} received — ${priorState} -> ${newState}` +
    (payment_type ? ` (payment_type=${payment_type}, advisory)` : ''),
  );

  return {
    ok: true,
    invoice,
    prior: { state: priorState, amount_paid: Number(inv.amount_paid) || 0 },
    transitioned: priorState !== newState,
    balance: inv.amount_total - newAmountPaid,
  };
}

// ── cancelInvoice ─────────────────────────────────────────────────────────
// Typed cancel. The engine-plane predecessor (src/api/vendor/invoices.js's
// `/:invoiceId/cancel`, `donna_hide` on a binder id) is retired with its reader
// by this sitting's crossing — the room's row ids are typed uuids now, so a
// binder-keyed door has nothing to key on.
//
// A CANCELLED INVOICE KEEPS ITS `amount_paid`, AND THAT IS DELIBERATE. Money
// that arrived is money that arrived; cancelling does not un-collect an advance
// the vendor already banked. `src/api/vendor/money.js` states the other half of
// this rule — cancelled invoices still credit RECEIVED and are excluded from
// OUTSTANDING only.
async function cancelInvoice(supabase, vendorId, invoiceId) {
  const { data: existing, error: readErr } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount_total, amount_paid, state')
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();

  if (readErr) return { ok: false, error: readErr.message };
  if (!existing) return { ok: false, error: 'Invoice not found.' };
  if (existing.state === 'cancelled') return { ok: true, invoice: existing, already_cancelled: true };

  // The prior door refused a fully-paid invoice and this one keeps that guard
  // verbatim in meaning: it read `deriveInvoiceState(binder) === 'paid'` off the
  // binder, which is the same question asked of the typed row.
  if (existing.state === 'paid') {
    return { ok: false, error: 'Cannot cancel a fully paid invoice.', code: 'INVOICE_PAID' };
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .update({ state: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)
    .select('id, invoice_number, amount_total, amount_paid, state')
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!invoice) return { ok: false, error: 'Invoice not found.' };

  console.log(`[invoices:cancelInvoice] ${invoice.invoice_number} — ${existing.state} -> cancelled`);
  return { ok: true, invoice };
}

// ── PDF_VENDOR_COLUMNS · THE DOCUMENT'S VENDOR FIELD LIST, ONE HOME ────────
// Two call sites render an invoice document from a vendor row: the PDF door,
// through `invoicePdfSource` below, and the agent's record_payment arm in
// `src/agent/engine.js`, which regenerates the PDF after a payment. Before S2
// the agent selected four columns and the door selected five, and it did not
// matter because the generator read only two. It matters now: the document
// prints the vendor's city, GSTIN, address and bank rails, so a caller with a
// short select would silently produce A DIFFERENT DOCUMENT for the same
// invoice — the one thing a document may never do.
//
// So the list is a constant and both callers spell it by name. `user_id` rides
// it because the display-name fallback needs it; `routing_handle` rides it
// because the agent's row already carried it and dropping a column is not this
// sitting's business.
//
// COLUMN WITNESS: public.vendors — business_name(3) city(6) upi_id(7) gstin(8)
// routing_handle(15), witnessed in `docs/db/PUBLIC_SCHEMA.md` at 83d2eb8.
// `address`, `account_name`, `account_number` and `ifsc` are migration 0130's,
// applied by the founder 2026-09-03, and are OWED a PAIR regen.
const PDF_VENDOR_COLUMNS =
  'id, business_name, upi_id, routing_handle, user_id, city, gstin, address, account_name, account_number, ifsc';

// ── invoiceScheduleRows ───────────────────────────────────────────────────
// THE SCHEDULE READ, ONE HOME. Two callers need the milestone rows for a
// document — `invoicePdfSource` below, and the agent's record_payment arm in
// `src/agent/engine.js`, which regenerates the PDF from rows it already holds
// and would otherwise have grown a second `.from('payment_schedules')`. That
// second home is exactly how the columns drift apart, so the read lives here
// beside the other invoice reads and both callers ask it the same question.
//
// COLUMN WITNESS: public.payment_schedules — milestone_label(4) pct(5)
// amount_due(6) due_date(7) state(8) ordinal(11), witnessed in
// `docs/db/PUBLIC_SCHEMA.md` at 83d2eb8.
//
// Ordered by `ordinal`, which the schedule writer home stamps 1..n at create —
// never by `due_date`, because an undated milestone would sort itself out of
// the sequence the vendor actually built.
//
// A FAILED READ RETURNS [], NOT AN ERROR. The couple's invoice is still true
// without the block; refusing a whole document over a missing schedule would
// trade a complete page for no page at all. The failure is logged so it is a
// declared gap rather than a silent one.
async function invoiceScheduleRows(supabase, vendorId, invoiceId) {
  const { data, error } = await supabase
    .from('payment_schedules')
    .select('milestone_label, pct, amount_due, due_date, state, ordinal')
    .eq('invoice_id', invoiceId)
    .eq('vendor_id', vendorId)
    .order('ordinal', { ascending: true });
  if (error) {
    console.error('[invoices:invoiceScheduleRows] schedule read failed —', error.message);
    return [];
  }
  return data || [];
}

// ── invoicePdfSource ──────────────────────────────────────────────────────
// NOT A WRITER — the READ half of the PDF verb, homed here so the door and the
// agent ask one question. It returns the typed row and the vendor/user rows the
// generator needs; rendering and storage stay in `src/lib/invoicePdf.js`, which
// already has one home and does not move.
//
// ── S2 · THE SELECT IS THE DOCUMENT'S FIELD LIST, NOT A HABIT ───────────────
// The read-first table for F-2c.w8 found this function selecting SEVENTEEN
// columns of which the generator read NINE, while EIGHT more that the document
// needs were never asked for at all. Both halves of that were defects, and the
// second is the one that made the document lie: `state` was selected and thrown
// away while the header printed a literal.
//
// What each addition is FOR, so a later reader can tell a needed column from an
// inherited one:
//   notes(14)        · the vendor's own line to the couple, printed under Notes
//   has_schedule(21) · the ONLY gate on the schedule block and on the fifth read
//   city(6) gstin(8) · the vendor's identity line under her name
//   address          · the header's second line, printed only when filled
//   account_name · account_number · ifsc
//                    · the bank rails. NEW COLUMNS, migration 0130, applied by
//                      the founder in the Supabase editor 2026-09-03.
//
// COLUMN WITNESS · SQL-PROVENANCE LAW (F-P3.12). Every name below is witnessed
// in `docs/db/PUBLIC_SCHEMA.md` at 83d2eb8 except 0130's four, which are
// witnessed by the migration itself and are OWED a PAIR regen — the schema doc
// does not describe them yet and this comment is the standing note that it must.
//   public.invoices    notes(14) has_schedule(21)
//   public.vendors     city(6) gstin(8)
//   public.payment_schedules  milestone_label(4) pct(5) amount_due(6)
//                             due_date(7) state(8) ordinal(11)
async function invoicePdfSource(supabase, vendorId, invoiceId) {
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('id, invoice_number, client_name, client_phone, description, amount_total, amount_advance, amount_paid, due_date, state, pdf_url, created_at, notes, has_schedule')
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!invoice) return { ok: false, error: 'Invoice not found.' };

  const { data: vendor } = await supabase
    .from('vendors')
    .select(PDF_VENDOR_COLUMNS)
    .eq('id', vendorId)
    .maybeSingle();

  let vendorName = null;
  if (vendor?.user_id) {
    const { data: u } = await supabase
      .from('users').select('name').eq('id', vendor.user_id).maybeSingle();
    vendorName = u?.name || null;
  }

  // ── THE FIFTH READ · GATED ON has_schedule, NOT ATTEMPTED AND DISCARDED ────
  // `has_schedule` is a real column maintained by the schedule writer home
  // (`src/lib/vendor/schedules.js` sets it true on create and false on delete),
  // so it is the cheap authority and a query is not needed to learn there is
  // nothing to fetch. The read itself is `invoiceScheduleRows` above — one home,
  // shared with the agent.
  const schedule = invoice.has_schedule
    ? await invoiceScheduleRows(supabase, vendorId, invoiceId)
    : [];

  // ── G2 · THE SEAL (R-G2.8) ─────────────────────────────────────────────
  // THE SIXTH READ, AND IT IS ADDED HERE RATHER THAN AT THE THREE CALL SITES
  // BECAUSE THIS IS THE SOURCE HOME. The document has ONE renderer and THREE
  // callers, and only this function is the typed source — the read-first found
  // the other two assembling their own arguments, one of which does not pass
  // `schedule` at all. Adding a sixth read to each would have been three homes
  // for one question. The two hand-built callers pass `seal: null` EXPLICITLY,
  // so a reader can tell "no seal for this render" from "nobody asked".
  //
  // `sealIsVisible` decides; this function does not know what three means. A
  // failure here costs the seal, never the document: an invoice must render for
  // a couple who is owed one whether or not a nightly job has run.
  let seal = null;
  try {
    const { data: sr } = await supabase
      .from('vendor_seal')
      .select('weddings, delivery_days')
      .eq('vendor_id', vendorId)
      .maybeSingle();
    if (sealIsVisible(sr)) {
      seal = { weddings: Number(sr.weddings), delivery_days: sr.delivery_days == null ? null : Number(sr.delivery_days) };
    }
  } catch (_sealErr) {
    seal = null;
  }

  return { ok: true, invoice, vendor, vendorName, schedule, seal };
}

// ── updateInvoicePdfUrl ───────────────────────────────────────────────────
// `pdf_url` is a column on public.invoices and this is the only writer of it.
// It exists as its own function rather than as a `.from()` at the PDF door
// because "one writer home per table" does not take an exception for a
// one-field update — that exception is how a second home starts.
async function updateInvoicePdfUrl(supabase, vendorId, invoiceId, url) {
  const { error } = await supabase
    .from('invoices')
    .update({ pdf_url: url, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .eq('vendor_id', vendorId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// THE READER · R-VS.2 (CE-40, the Victor sitting) — THE WRITER HOME BECOMES
// THE READER HOME TOO, AND THERE IS NOW ONE HOME FOR THE MONEY TRUTH.
// ═══════════════════════════════════════════════════════════════════════════
// F-39.73's cure needs the answer to 「 who owes me money 」 in TWO places: the
// Money room's door (src/api/vendor/money.js) and Victor's fact block
// (src/lib/vendor/moneyFacts.js). The derivation already existed — inline in
// that router — and a second copy for the fact block would have been the
// two-derivations disease this estate has convicted twice on this exact table
// (F-04.13: the hub totalled public.invoices while the list totalled binders).
//
// SO THE ROUTER'S COPY DIES IN THE SAME COMMIT THAT BORN THIS ONE. That is the
// ruling's own clause and it is checkable: `grep -c "OUTSTANDING_STATES" ` in
// src/api/vendor/money.js reads its IMPORT, never a declaration.
//
// ── R-39.12 · THE OUTSTANDING RULE, MOVED NOT RE-AUTHORED ──────────────────
// OUTSTANDING IS A POSITIVE LIST AND NEVER A NEGATION. F-P3.1 earned this on
// this table at src/api/vendor/worklistToday.js: `state <> 'paid'` returns
// CANCELLED invoices as money owed, and a negation reads every UNKNOWN state as
// included — the unknown being any state a future migration adds. These two
// values travelled here BYTE-IDENTICAL from money.js:138; nothing was retyped.
const OUTSTANDING_STATES = ['unpaid', 'advance_paid'];

// The read's own column list. Witnessed against docs/db/PUBLIC_SCHEMA.md's
// `public.invoices` block (:637, 21 columns, current — the doc is stale only for
// `vendors`, which `0130` touched, and this read opens no vendors column):
// id :638 · invoice_number :641 · client_name :642 · client_phone :643 ·
// amount_total :645 · amount_paid :647 · due_date :648 · state :649 ·
// created_at :652 · deleted_at :657. No column here is authored from memory.
const OUTSTANDING_SELECT =
  'id, invoice_number, client_name, client_phone, amount_total, amount_paid, due_date, state, created_at';

/**
 * readOutstanding — the ONE derivation of what a vendor is owed.
 *
 * Returns { ok: true, rows, summary } or { ok: false, error }. IT NEVER THROWS
 * AND IT NEVER GUESSES: a read failure returns ok:false and the callers refuse
 * honestly (the room 500s; the fact block carries the vetoed LEDGER_UNREADABLE
 * line and says nothing else about money that turn — R-VS.2's fail-closed
 * clause). "Could not be read" is never "there is none"; that sentence is the
 * estate's and it is kept here at the source rather than restated downstream.
 *
 * `amount_owed` is total − paid, per row. `total_outstanding` sums that owed
 * figure over OUTSTANDING_STATES ONLY. `total_collected` sums amount_paid over
 * EVERY row and asks nothing about state — a cancelled invoice still credits
 * money that actually arrived (money.js's own ruling, preserved verbatim in
 * substance: cancelling does not un-collect a banked advance).
 */
async function readOutstanding(supabase, vendorId) {
  const { data, error } = await supabase
    .from('invoices')
    .select(OUTSTANDING_SELECT)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) return { ok: false, error: error.message };

  const rows = (data || []).map((i) => {
    const total = Number(i.amount_total) || 0;
    const paid = Number(i.amount_paid) || 0;
    return {
      id: i.id,
      invoice_number: i.invoice_number,
      client_name: i.client_name,
      client_phone: i.client_phone || undefined,
      amount_total: total,
      amount_paid: paid,
      amount_owed: total - paid,
      state: i.state,
      due_date: i.due_date,
      created_at: i.created_at,
    };
  });

  const summary = {
    total_outstanding: rows
      .filter((r) => OUTSTANDING_STATES.includes(r.state))
      .reduce((sum, r) => sum + r.amount_owed, 0),
    total_collected: rows.reduce((sum, r) => sum + r.amount_paid, 0),
  };

  return { ok: true, rows, summary };
}

module.exports = {
  createInvoice,
  updateInvoicePdfUrl,
  updateInvoice,
  recordPayment,
  cancelInvoice,
  invoicePdfSource,
  invoiceScheduleRows,
  readOutstanding,
  OUTSTANDING_STATES,
  PDF_VENDOR_COLUMNS,
  PAYABLE_STATES,
};
