// src/lib/vendor/referrals.js
// BLOCK 19 G5.1 — THE OVERFLOW EXCHANGE. The `lead_referrals` plane's ONE home.
//
// Called by the forward door (src/api/vendor/leads.js) and the room's read door
// (src/api/vendor/referrals.js). Nothing else writes this table, and the bench
// asserts it: `.from('lead_referrals')` appears in this file and nowhere else in
// src/.
//
// All functions:
//   - Accept a supabase client + structured params
//   - Return { ok: true, ... } or { ok: false, error, code }
//   - Never throw — callers check the ok flag
//
// ── THE SHAPE OF THIS SITTING, IN ONE PARAGRAPH ─────────────────────────────
// A booked vendor forwards an enquiry she cannot take to a peer on her roster,
// with a note. The peer gets it as a NEW LEAD through `createLead` — the one
// lead writer, never a sixth INSERT — stamped `PEER_REFERRAL_SOURCE` and
// carrying the sender's business name in `referrer_name`. The original lead is
// NOT MOVED (R-G51.3): its `state` is untouched, and the row this file writes is
// the record of the forward. TDW says nothing to the couple (R-G51.7).

'use strict';

const { createLead, PEER_REFERRAL_SOURCE } = require('./leads');

// The row shape the room and both lead records read. Explicit column list, never
// `select('*')` — F-04.106 is what that costs.
const REFERRAL_COLS =
  'id, from_vendor_id, to_vendor_id, lead_id, new_lead_id, note, created_at';

// ── THE REFUSAL CODES ───────────────────────────────────────────────────────
// Named constants rather than sentences, because the SENTENCE is the founder's
// (G51_VETO_SHEET §C1) and lives in the pwa's copy home. A door that returns
// prose owns a vendor-facing byte it never had vetoed; a door that returns a
// code lets the surface say the ruled words. The door's own `error` string is
// for logs and for a caller that renders nothing.
const REFUSE = {
  SELF:        'referral_self',
  NOT_A_PEER:  'referral_not_a_peer',
  ALREADY_HAS: 'referral_peer_already_has_lead',
  NO_PHONE:    'referral_lead_has_no_phone',
};

/**
 * THE FORWARD. One enquiry, one peer, one note.
 *
 * Ordered so that every refusal happens BEFORE any write. R-G51.2 is not a
 * message, it is a sequence: the door decides whether the forward can land, and
 * only then does anything touch the database. A door that wrote first and
 * apologised second is the false-done this ruling exists to prevent.
 */
async function forwardLead(supabase, fromVendor, { leadId, toVendorId, note }) {
  // ── 0 · THE SELF-FORWARD ──────────────────────────────────────────────────
  // Refused HERE and not by a SQL constraint, deliberately. A CHECK violation
  // reaches the vendor as a 500 with no sentence attached; this reaches her as a
  // named code the sheet can speak. (The migration says the same at its §3.)
  if (!toVendorId || toVendorId === fromVendor.id) {
    return { ok: false, code: REFUSE.SELF, error: 'A lead cannot be forwarded to yourself.' };
  }

  // ── 1 · THE LEAD MUST BE HERS, AND MUST STILL EXIST ───────────────────────
  // `resolveVendor({ via: 'leads' })` has already proven ownership at the door,
  // so this read is for the ROW'S CONTENT, not for authorisation. It is still
  // scoped by vendor_id: a lib function that trusts its caller's middleware is a
  // lib function that is wrong the first time someone mounts it elsewhere.
  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('id, name, phone, email, wedding_date, wedding_date_precision, wedding_city, event_types, budget_min, budget_max, notes, raw_message')
    .eq('id', leadId)
    .eq('vendor_id', fromVendor.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (leadErr) return { ok: false, error: `Could not read the lead: ${leadErr.message}` };
  if (!lead)   return { ok: false, error: 'Lead not found.' };

  // ── 2 · A LEAD WITH NO PHONE CANNOT BE FORWARDED ──────────────────────────
  // Not a policy — a mechanical fact about what the peer would receive. The
  // couple's phone IS the enquiry; a forward without it hands the peer a name
  // and a city and no way to answer. It would also make step 3 vacuous, since
  // the dedupe the whole ruling turns on is keyed on the phone.
  if (!lead.phone) {
    return { ok: false, code: REFUSE.NO_PHONE, error: 'This enquiry has no phone number, so there is nothing to forward.' };
  }

  // ── 3 · THE PEER MUST BE A LINKED PEER ON HER OWN ROSTER  (R-G51.1) ───────
  // `member_vendor_id IS NOT NULL` is the whole predicate, and it is the same
  // one src/api/vendor/collab.js:528 uses for its linked audience. A roster row
  // with a NULL member is a manual phone-only entry — a name and a number the
  // vendor typed — and it has no vendor behind it, so it has no Victor to take
  // the enquiry from there. Forwarding to one would file a lead against nobody.
  const { data: edge, error: edgeErr } = await supabase
    .from('vendor_roster')
    .select('id, member_vendor_id')
    .eq('owner_vendor_id', fromVendor.id)
    .eq('member_vendor_id', toVendorId)
    .maybeSingle();

  if (edgeErr) return { ok: false, error: `Could not read your roster: ${edgeErr.message}` };
  if (!edge) {
    return { ok: false, code: REFUSE.NOT_A_PEER, error: 'That vendor is not a peer on your roster.' };
  }

  // ── 4 · THE DEDUPE CHECK, BEFORE ANY WRITE  (R-G51.2 · F-40.84) ───────────
  // ⚠ THIS IS THE SITTING'S LOAD-BEARING BRANCH. READ IT BEFORE CHANGING IT.
  //
  // `createLead` dedupes on (vendor_id, phone) — src/lib/vendor/leads.js, the
  // `if (phone)` branch — and returns the peer's EXISTING row with
  // `deduped: true` rather than inserting. And `source` and `referrer_name` are
  // both in ENRICH_REFUSED_KEYS, so even the enrich path cannot stamp the
  // forward's provenance onto that existing row.
  //
  // So a forward to a peer who already holds this couple would have: inserted
  // nothing · carried neither the token nor the sender's name · returned
  // `ok: true` · and left this file writing a `lead_referrals` row pointing at a
  // lead the peer had before the forward existed. The vendor's glass would say
  // she handed the work over. She would not have.
  //
  // That is a false-done, which house law forbids outright, and it is why the
  // check lives HERE — before the write — rather than being inferred from
  // `result.deduped` afterwards. Reading the flag after the fact would be
  // correct about the database and still wrong about the ordering: the vendor
  // would be told her forward failed by a door that had already decided to try.
  //
  // NO ROW IS FILED FOR A REFUSED FORWARD, so the room's balance can never count
  // a forward that did not happen (the migration's own NOT NULL says the same
  // thing in the schema).
  const { data: existing, error: dupeErr } = await supabase
    .from('leads')
    .select('id')
    .eq('vendor_id', toVendorId)
    .eq('phone', lead.phone)
    .is('deleted_at', null)
    .maybeSingle();

  if (dupeErr) return { ok: false, error: `Could not check the peer's leads: ${dupeErr.message}` };
  if (existing) {
    return { ok: false, code: REFUSE.ALREADY_HAS, error: 'The peer already has a lead with this phone number.' };
  }

  // ── 5 · THE PEER'S COPY, THROUGH THE ONE LEAD WRITER ──────────────────────
  // `createLead` and nothing else. This sitting adds a CALLER, never a sixth
  // INSERT — the kickoff's law and the reason `state` comes out as `new` without
  // this file naming it: the literal is at leads.js's INSERT and belongs to it.
  //
  // NO `enrich`. R-37.34 carved the enrich option out for a returning bride, and
  // this is not one; the dedupe above has already established the peer holds no
  // row for this phone, so there is nothing on her side to fill.
  //
  // `referrer_name` is the SENDER'S BUSINESS NAME, and it is read off her vendor
  // row by the door — never off a request body. A forwarded lead that named
  // whoever the client claimed sent it would be a forgery surface.
  const created = await createLead(supabase, toVendorId, {
    name:         lead.name,
    phone:        lead.phone,
    email:        lead.email,
    wedding_date: lead.wedding_date,
    wedding_city: lead.wedding_city,
    event_types:  lead.event_types,
    budget_min:   lead.budget_min,
    budget_max:   lead.budget_max,
    source:        PEER_REFERRAL_SOURCE,
    referrer_name: fromVendor.business_name || null,
    raw_message:   lead.raw_message,
    // The SENDER'S note becomes the peer's `notes`, and the original lead's own
    // notes are deliberately NOT carried: they are the sender's private working
    // record of a couple, written for herself, and a forward is not consent to
    // publish them to another business.
    notes:         note || null,
  });

  if (!created.ok) return { ok: false, error: created.error };

  // ⚠ THE BELT AND THE BRACES ARE BOTH DELIBERATE. Step 4 checked, and this
  // checks again on the RESULT, because the two are answering different
  // questions: step 4 asked "can this land?", this asks "did it?". Between them
  // sits a real window — the peer's Victor can file the same couple in the
  // milliseconds after step 4 read. If that happened, `createLead` deduped, no
  // new lead exists, and filing a referral row here would point at a lead this
  // forward did not create.
  if (created.deduped) {
    return { ok: false, code: REFUSE.ALREADY_HAS, error: 'The peer already has a lead with this phone number.' };
  }

  // ── 6 · THE RECORD  (R-G51.3) ─────────────────────────────────────────────
  // The original lead's `state` is NOT touched. This row is what "forwarded"
  // means on this estate — not a value in a vocabulary that lives in eight homes
  // across two planes, three of them under src/engine/ where W-1 forbids this
  // sitting from writing (F-40.87).
  const { data: referral, error: refErr } = await supabase
    .from('lead_referrals')
    .insert({
      from_vendor_id: fromVendor.id,
      to_vendor_id:   toVendorId,
      lead_id:        lead.id,
      new_lead_id:    created.lead.id,
      note:           note || null,
    })
    .select(REFERRAL_COLS)
    .single();

  // THE LEAD LANDED AND THE RECORD DID NOT. Reported, never silently swallowed
  // and never rolled back: the peer HAS the enquiry now, and deleting her lead
  // to tidy our own ledger would take live work off her board to make a number
  // right. The sender is told the truth in both halves.
  if (refErr) {
    console.error(`[referrals:forwardLead] lead ${created.lead.id} landed for vendor ${toVendorId} but the referral row failed: ${refErr.message}`);
    return {
      ok: true,
      lead_delivered: true,
      referral: null,
      new_lead_id: created.lead.id,
      record_failed: true,
      error: 'The enquiry reached your peer, but we could not record the forward.',
    };
  }

  return { ok: true, lead_delivered: true, referral, new_lead_id: created.lead.id };
}

/**
 * THE ROOM  (R-G51.6). Sent and received, in FORWARDS.
 *
 * Never weddings — this plane holds a lead, and a room that said "weddings"
 * would be making a claim its own table cannot answer. Never money — master §7.
 */
async function getReferralRoom(supabase, vendorId) {
  const [sentRes, recvRes] = await Promise.all([
    supabase.from('lead_referrals').select(REFERRAL_COLS)
      .eq('from_vendor_id', vendorId).order('created_at', { ascending: false }),
    supabase.from('lead_referrals').select(REFERRAL_COLS)
      .eq('to_vendor_id', vendorId).order('created_at', { ascending: false }),
  ]);

  if (sentRes.error) return { ok: false, error: `Could not read forwards sent: ${sentRes.error.message}` };
  if (recvRes.error) return { ok: false, error: `Could not read forwards received: ${recvRes.error.message}` };

  const sent = sentRes.data || [];
  const received = recvRes.data || [];

  // The peer names, one read for the whole room rather than one per row —
  // roster.js:73's own reasoning, and F-04.106's explicit column list.
  const peerIds = [...new Set([
    ...sent.map(r => r.to_vendor_id),
    ...received.map(r => r.from_vendor_id),
  ])];

  let nameById = new Map();
  let categoryById = new Map();
  if (peerIds.length) {
    const { data: peers } = await supabase
      .from('vendors').select('id, business_name, category').in('id', peerIds);
    for (const p of peers || []) {
      nameById.set(p.id, p.business_name);
      categoryById.set(p.id, p.category);
    }
  }

  // Per peer, both directions. Built from the two lists rather than from a
  // second query, so the totals below and the rows cannot disagree.
  const byPeer = new Map();
  const touch = (id) => {
    if (!byPeer.has(id)) {
      byPeer.set(id, {
        vendor_id: id,
        name: nameById.get(id) || null,
        category: categoryById.get(id) || null,
        sent: 0, received: 0, last_at: null,
      });
    }
    return byPeer.get(id);
  };
  const later = (a, b) => (!a ? b : (!b ? a : (a > b ? a : b)));

  for (const r of sent)     { const p = touch(r.to_vendor_id);   p.sent += 1;     p.last_at = later(p.last_at, r.created_at); }
  for (const r of received) { const p = touch(r.from_vendor_id); p.received += 1; p.last_at = later(p.last_at, r.created_at); }

  const peers = [...byPeer.values()].sort((a, b) => (b.last_at || '').localeCompare(a.last_at || ''));

  // The two head figures are the LENGTHS of the two lists, not a sum over
  // `peers`. One derivation per number: F-04.13's tuition is that two
  // derivations of one rule cannot agree by luck, and the books register was
  // built on the same refusal to add anything up.
  return { ok: true, sent_count: sent.length, received_count: received.length, peers };
}

/**
 * THE TWO LEAD RECORDS' ONE ROW EACH.
 *
 * `Forwarded to …` on the sender's record, `Forwarded by …` on the peer's
 * (R-G51.5, F-40.85's cure). Batched by lead id so the Leads list can ask once
 * for a page of leads rather than once per row — the engagements badge's own
 * shape (`engagedLeadStamps`, src/lib/engagements.js).
 */
async function referralStampsForLeads(supabase, vendorId, leadIds) {
  if (!Array.isArray(leadIds) || leadIds.length === 0) return { ok: true, sentBy: new Map(), receivedBy: new Map() };

  const [outRes, inRes] = await Promise.all([
    supabase.from('lead_referrals').select('lead_id, to_vendor_id, note, created_at')
      .eq('from_vendor_id', vendorId).in('lead_id', leadIds),
    supabase.from('lead_referrals').select('new_lead_id, from_vendor_id, note, created_at')
      .eq('to_vendor_id', vendorId).in('new_lead_id', leadIds),
  ]);

  // A stamp is DECORATION on a lead record; a stamp read that fails must never
  // cost the vendor her leads. Reported to the log, empty to the caller — the
  // same posture roster.js's `tolerate` takes for the pre-0096 window.
  if (outRes.error || inRes.error) {
    console.warn(`[referrals:stamps] unavailable: ${(outRes.error || inRes.error).message}`);
    return { ok: true, sentBy: new Map(), receivedBy: new Map(), degraded: true };
  }

  const peerIds = [...new Set([
    ...(outRes.data || []).map(r => r.to_vendor_id),
    ...(inRes.data  || []).map(r => r.from_vendor_id),
  ])];
  let nameById = new Map();
  if (peerIds.length) {
    const { data: peers } = await supabase.from('vendors').select('id, business_name').in('id', peerIds);
    for (const p of peers || []) nameById.set(p.id, p.business_name);
  }

  const sentBy = new Map();
  for (const r of outRes.data || []) {
    sentBy.set(r.lead_id, { peer_name: nameById.get(r.to_vendor_id) || null, note: r.note, at: r.created_at });
  }
  const receivedBy = new Map();
  for (const r of inRes.data || []) {
    receivedBy.set(r.new_lead_id, { peer_name: nameById.get(r.from_vendor_id) || null, note: r.note, at: r.created_at });
  }

  return { ok: true, sentBy, receivedBy };
}

module.exports = {
  forwardLead, getReferralRoom, referralStampsForLeads,
  // Exported for the bench: the refusal codes are CODE, not prose, and a cell
  // asserts the door returns one rather than a sentence the founder never saw.
  REFUSE, REFERRAL_COLS,
};
