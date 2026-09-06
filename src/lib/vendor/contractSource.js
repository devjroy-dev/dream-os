// src/lib/vendor/contractSource.js
// G3.2 — THE READ HALF OF THE CONTRACT DOCUMENT, and the renderer's ONE call site.
//
// ═══ WHY THIS FILE EXISTS AND WHAT IT MAY NOT DO ═══════════════════════════
// `src/lib/vendor/invoices.js`'s `invoicePdfSource` is the shape, and its own header
// says why: the door and the agent must ask ONE question, and the SELECT is the
// document's field list rather than a habit. This file is that for contracts.
//
// IT IS NOT A WRITER. Nothing here mutates a row. The writers live in
// `src/lib/vendor/contracts.js` and there is one of each.
//
// ⚠ AND IT HOLDS THE ONLY CALL TO `generateContractPdf` IN THE ESTATE.
// `generateInvoicePdf` has three call sites and its own source home records the cost:
// two of them hand-build their arguments and one does not pass `schedule` at all, so a
// column added to the document has to be added in three places or the documents
// disagree. R-G32's charter fixed one call site for this renderer before the first byte
// was written. `scripts/b56_contract_bench.js` §5 greps the tree and REDS at two.
//
// ⚠ THE DEPOSIT IS COMPUTED HERE AND NOWHERE ELSE — R-G32.6.
// `contracts.deposit_pct` is the one home; `Rs 18,000` is 30% of `Rs 60,000` computed
// once, in `deriveMoney` below. The renderer takes the number and cannot recompute it
// (it is handed `money`, never an invoice). `payment_schedules` milestone 1 is DERIVED
// from the same function when an invoice exists — never the reverse, and never a second
// percentage. The register's §4 rule 1 is amended by R-G32.6 and this is where the
// amendment actually lives.
//
// COLUMN WITNESS · SQL-PROVENANCE LAW (F-P3.12, R-40.27). Every name below is
// witnessed in `docs/db/PUBLIC_SCHEMA.md`.
//
// ⚠ THE DEBT THIS COMMENT USED TO CARRY IS PAID. The first cut said 0138's columns
// were witnessed only by the migration and OWED a PAIR regen — F-40.99. The regen
// landed at `5b3f61f`: 79 tables, 890 columns, `contract_profiles` and
// `contract_signatures` described, and F-40.99 CLOSED. **The snapshot is now the
// witness and this file cites it**, which is the whole point of retiring a standing
// note the moment it stops being true rather than leaving it to be read as current.
//   public.contracts          :232 — id vendor_id client_id lead_id invoice_id title
//                                    storage_path state sent_at signed_at notes
//                             0138 — event_id terms annexes deposit_pct deposit_received_at
//   public.contract_profiles  0138 — vendor_id fields
//   public.contract_signatures 0138 — contract_id signer_phone verified_at
//                                    document_sha256 sealed_path signed_at channel
//   public.clients            :169 — name(4) phone(5)
//   public.events             :534 — id title event_date event_time kind slot
//                                    linked_lead_id state deleted_at
//   public.invoices           :640 — amount_total(?) description state
//   public.vendors            :1130 — business_name city address gstin upi_id
//                                    account_name account_number ifsc routing_handle
'use strict';

const { generateContractPdf } = require('../contractPdf');

const CONTRACT_COLUMNS =
  'id, vendor_id, client_id, lead_id, invoice_id, event_id, title, storage_path, ' +
  'state, sent_at, signed_at, notes, terms, annexes, deposit_pct, deposit_received_at, ' +
  'created_at';

// The vendor columns the DOCUMENT reads — not the ones a vendor row happens to have.
// `invoicePdfSource`'s own header records what the alternative cost: seventeen selected,
// nine read, eight the document needed never asked for.
// ⚠ **F-40.159 — `whatsapp_number` WAS NOT A COLUMN AND NEVER HAD BEEN.**
// `public.vendors` carries `phone` (column 4). This list asked for a name that does
// not exist, so the SELECT ERRORED, `vendor` came back null, and `vendor || {}`
// handed the renderer an empty object. Every vendor field then printed as an
// underscore run and `business_name || 'Your Vendor'` printed the fallback — a
// lawyer-passed agreement, four pages, addressed from **Your Vendor**, with no
// address, no rails and no jurisdiction. ONE WRONG NAME BLANKED NINE FIELDS.
//
// It is R-40.27 / F-P3.12 broken by the file that cites them twelve lines above:
// the list was written from what a vendors table OUGHT to have.
//
// ⚠ **AND THE FIRST CURE WAS A SECOND FABRICATION.** `phone` was written in its
// place, from a grep across a line range that had run past this table's block into
// a neighbour's. **`public.vendors` HAS NO NUMBER COLUMN AT ALL** — forty-nine
// columns, and not one of them is a phone. R-40.80's cell, written in the same
// hour, reddened on the replacement before it could ship. That is the cell doing
// precisely what it was ruled for, to the seat that wrote it.
//
// THE VENDOR'S NUMBER LIVES ON `public.users`, reached through `vendors.user_id` —
// `vendorHandset.js:72`, `admin/discover.js:112` and `vendorInbound.js:1045` all
// read it there, and `auth.js` authenticates against it. The instrument needs it
// twice (clause 1 and the signature block), so it is fetched as its own read
// below rather than guessed at here.
//
// Every name in this list is witnessed in `docs/db/PUBLIC_SCHEMA.md` at the regen
// (`5b3f61f`) and asserted by b56 §9b on every run — because no double can catch a
// column that does not exist, which is why four benches and 122 cells let the
// first one through to a document a couple would have signed.
const PDF_VENDOR_COLUMNS =
  'id, user_id, business_name, city, address, gstin, upi_id, account_name, ' +
  'account_number, ifsc, routing_handle';

// ── deriveMoney ──────────────────────────────────────────────────────────────
// THE ONE HOME (R-G32.6). Everything on the document that is an amount comes out of
// here, including the schedule rows the composer offers.
//
// `fee_total` comes from the invoice when one exists and from `terms.fee_total` when
// one does not — a contract may be composed before an invoice is minted, and refusing
// to render a fee because the money plane has not caught up would be the document
// waiting on a plane the couple has never seen.
//
// ⚠ ROUNDING IS `Math.round`, MATCHING `schedules.js:createSchedule`.
// If this file floored and that one rounded, milestone 1 on the schedule and the
// deposit on the paper would differ by a rupee on some fees — and a couple holding two
// documents that disagree about what she owes is exactly the F-39.49(b) class.
function deriveMoney({ invoice, contract, profile }) {
  const T   = (contract && contract.terms) || {};
  const P   = profile || {};
  const fee = num(invoice && invoice.amount_total) != null
    ? num(invoice.amount_total)
    : num(T.fee_total);

  const dpct = num(contract && contract.deposit_pct);
  const deposit = (fee != null && dpct != null) ? Math.round((fee * dpct) / 100) : null;

  // The GST block's two numbers, computed only when BOTH settings are answered.
  // R-G32.12: blank until answered, and the block is omitted whole while either is
  // blank — so a half-answered profile produces nulls here rather than a zero rate.
  let gstAmount = null;
  let payable   = null;
  if (fee != null && P.gst_pct != null && P.gst_treatment) {
    const g = Math.round((fee * Number(P.gst_pct)) / 100);
    gstAmount = g;
    payable = P.gst_treatment === 'inclusive' ? fee : fee + g;
  }

  // MILESTONE 1 IS THE DEPOSIT AND IS NOT LISTED TWICE. v3's table prints the deposit
  // row itself; these are the rows AFTER it. `ordinal` 1 is dropped for exactly that
  // reason and not because a schedule is assumed to have one.
  const milestones = ((invoice && invoice.schedule) || [])
    .filter((m) => Number(m.ordinal) !== 1)
    .map((m) => ({
      label: m.milestone_label, pct: m.pct, amount: m.amount_due, due: m.due_date,
    }));

  return {
    fee_total: fee,
    deposit_amount: deposit,
    gst_amount: gstAmount,
    fee_payable_with_gst: payable,
    milestones,
  };
}

function num(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ── functionsForContract ─────────────────────────────────────────────────────
// CLAUSE 3'S TABLE, READ AT RENDER (R-G32.7) — one row per function, never stored.
//
// ⚠ THE KEY THE ROW ACTUALLY CARRIES, DERIVED RATHER THAN ASSUMED. The chair asked
// which of `client_id` / `linked_lead_id` reaches a client's events, and the schema
// answers plainly:
//
//   · `public.events` has NO `client_id`. Its keys are `linked_lead_id`
//     (FK → leads, :2264), `couple_id` (FK → couples, :2262) and `linked_binder_id`.
//   · `public.clients` has FKs to `users` and `vendors` ONLY (:2090-2093) — it does
//     not point at leads.
//   · `public.leads` DOES carry `client_id` (:695, column 18).
//
// So the reachable path is ONE WAY and it is through leads:
//     contracts.lead_id → events.linked_lead_id            (cheapest, when present)
//     contracts.client_id → leads.client_id → events.linked_lead_id
//
// `linked_binder_id` IS DELIBERATELY NOT USED. It points into `engine.records` across
// a schema boundary with no foreign key, and `eventWrite.js:353` only ever sets it on a
// CONFIDENT SINGLE NAME MATCH — returning null on ambiguity. A document's own function
// list may not rest on a fuzzy title match.
//
// ⚠ A CLIENT PROMOTED WITHOUT A LEAD REACHES NO EVENTS, and that is a real hole, not a
// theoretical one: `clients.source` defaults to `lead_promotion` but is free text and
// other values exist. The composer's answer is `terms.functions_manual` — she types the
// rows — and the renderer's answer is the sentence at `dateTable`'s empty branch. Filed
// as **F-40.117** so it is a known item rather than a surprise on a walk.
async function functionsForContract(supabase, vendorId, contract) {
  const leadIds = [];
  if (contract.lead_id) leadIds.push(contract.lead_id);

  if (contract.client_id) {
    const { data: leads } = await supabase
      .from('leads').select('id')
      .eq('vendor_id', vendorId).eq('client_id', contract.client_id);
    (leads || []).forEach((l) => { if (!leadIds.includes(l.id)) leadIds.push(l.id); });
  }
  if (!leadIds.length) return [];

  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_date, event_time, kind, slot, state')
    .eq('vendor_id', vendorId)
    .in('linked_lead_id', leadIds)
    .is('deleted_at', null)
    .neq('state', 'cancelled')
    .order('event_date', { ascending: true });

  // A FAILED READ RETURNS [], NOT AN ERROR — `invoiceScheduleRows`'s rule, and the
  // same reasoning: the agreement is still true without the table, and refusing a whole
  // document over a missing calendar would trade a complete page for no page at all.
  // The failure is logged so it is a declared gap and not a silent one.
  if (error) {
    console.error('[contractSource:functions] read failed —', error.message);
    return [];
  }
  return data || [];
}

// ── contractPdfSource ────────────────────────────────────────────────────────
// The typed source. Six reads, and the fifth and sixth are gated the way
// `invoicePdfSource` gates its schedule read: on a real column, not attempted and
// discarded.
async function contractPdfSource(supabase, vendorId, contractId) {
  const { data: contract, error } = await supabase
    .from('contracts').select(CONTRACT_COLUMNS)
    .eq('id', contractId).eq('vendor_id', vendorId).maybeSingle();
  if (error)    return { ok: false, error: error.message };
  if (!contract) return { ok: false, error: 'Contract not found.' };

  // ⚠ **A FAILED VENDOR READ IS A FAILURE — F-40.159's larger half.**
  // This read destructured `{ data: vendor }` and moved on, so a broken SELECT was
  // indistinguishable from a vendor whose fields were empty. The renderer then did
  // exactly what it is built to do: printed blanks, honestly, for the data it was
  // handed. **A CONTRACT PRINTED FOR `Your Vendor` IS THE COSTUME CLASS ON PAPER** —
  // an artefact that looks like the real thing and is not, and this one is a legal
  // instrument. The door refuses now rather than rendering over `{}`.
  const { data: vendor, error: vErr } = await supabase
    .from('vendors').select(PDF_VENDOR_COLUMNS).eq('id', vendorId).maybeSingle();
  if (vErr)    return { ok: false, error: `Could not read your business details: ${vErr.message}` };
  if (!vendor) return { ok: false, error: 'Could not read your business details.' };

  // THE VENDOR'S NUMBER, from its one home. `public.users.phone`, reached through
  // `vendors.user_id` — the same path `vendorHandset.js` and `auth.js` use. It is
  // attached to the vendor object the renderer receives so the instrument keeps a
  // single field name for a single fact; the SHAPE is this file's, the HOME is the
  // estate's, and the two are not the same thing.
  if (vendor.user_id) {
    const { data: u } = await supabase
      .from('users').select('phone').eq('id', vendor.user_id).maybeSingle();
    vendor.phone = (u && u.phone) || null;
  }

  let client = null;
  if (contract.client_id) {
    const { data } = await supabase
      .from('clients').select('id, name, phone')
      .eq('id', contract.client_id).eq('vendor_id', vendorId).maybeSingle();
    client = data || null;
  }

  const { data: prof } = await supabase
    .from('contract_profiles').select('fields').eq('vendor_id', vendorId).maybeSingle();
  const profile = (prof && prof.fields) || {};

  // GATED ON `invoice_id`, a real column, exactly as `has_schedule` gates the invoice
  // document's fifth read. No invoice → nothing to fetch, and no query to learn it.
  let invoice = null;
  if (contract.invoice_id) {
    const { data: inv } = await supabase
      .from('invoices')
      .select('id, amount_total, description, state, has_schedule')
      .eq('id', contract.invoice_id).eq('vendor_id', vendorId)
      .is('deleted_at', null).maybeSingle();
    if (inv) {
      invoice = inv;
      if (inv.has_schedule) {
        // ONE HOME FOR THE SCHEDULE READ. `invoiceScheduleRows` already exists and is
        // shared by the invoice document and the agent; a `.from('payment_schedules')`
        // here would be the third home, which is how the columns drift apart.
        const { invoiceScheduleRows } = require('./invoices');
        invoice.schedule = await invoiceScheduleRows(supabase, vendorId, inv.id);
      }
    }
  }

  const functions = await functionsForContract(supabase, vendorId, contract);
  const money     = deriveMoney({ invoice, contract, profile });

  // THE SIGNATURE, AND ONLY A VERIFIED ONE.
  // An unverified row is a signing IN PROGRESS — a code sent and not yet entered — and
  // handing it to the renderer would print a seal on a document nobody has signed. The
  // renderer's own gate is `signature.verified_at`; this is the belt to that brace, and
  // the two are kept deliberately rather than collapsed, because the renderer must be
  // safe when called by a future caller that has not read this comment.
  let signature = null;
  const { data: sig } = await supabase
    .from('contract_signatures')
    .select('signer_phone, channel, verified_at, document_sha256, sealed_path, signed_at')
    .eq('contract_id', contractId)
    .not('verified_at', 'is', null)
    .order('verified_at', { ascending: false })
    .limit(1);
  if (sig && sig.length) signature = sig[0];

  // ⚠ NO `|| {}`. The guard above means `vendor` is a row or the door has already
  // returned; a fallback here would put the swallowed failure straight back.
  return { ok: true, contract, vendor, client, profile, invoice, functions, money, signature };
}

// ── renderContract — THE ONE CALL SITE ───────────────────────────────────────
// Everything that wants contract bytes calls THIS, and this calls the renderer. A door
// that assembled its own arguments would be the second call site and the count is
// asserted by a cell.
async function renderContract(supabase, vendorId, contractId) {
  const src = await contractPdfSource(supabase, vendorId, contractId);
  if (!src.ok) return src;
  const buffer = await generateContractPdf({
    contract:  src.contract,
    vendor:    src.vendor,
    client:    src.client,
    functions: src.functions,
    profile:   src.profile,
    money:     src.money,
    signature: src.signature,
  });
  return { ok: true, buffer, source: src };
}

module.exports = {
  contractPdfSource, renderContract, deriveMoney, functionsForContract,
  CONTRACT_COLUMNS, PDF_VENDOR_COLUMNS,
};
