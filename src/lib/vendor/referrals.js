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
// G5.1 SITTING 2 — the alert's ONE home. This file calls it; it never writes
// `referral_alerts` itself, and `toldByReferralIds` lives over there beside the
// insert rather than here beside its caller, so `.from('referral_alerts')`
// stays in exactly one file.
const { alertPeerOfReferral, toldByReferralIds } = require('./referralAlert');

const { normaliseCategory } = require('./categoryFraming');

// The row shape the room and both lead records read. Explicit column list, never
// `select('*')` — F-04.106 is what that costs.
const REFERRAL_COLS =
  'id, from_vendor_id, to_vendor_id, lead_id, new_lead_id, note, created_at';

// ── THE PEER SEARCH'S COLUMNS. Nothing else travels. ────────────────────────
// Exactly the four the PUBLIC storefront card already serves a stranger
// (`vendorCard.js:213`'s VENDOR_SELECT carries all four), which is precisely
// the argument R-40.107 rests on: this directory publishes nothing she has not
// already published. Add a fifth and that sentence stops being true and 0142's
// §CONSTRAINTS paragraph becomes a lie. NOT the phone — the roster holds one,
// `public.vendors` does not, and a picker that shipped it would hand one vendor
// another's number for a list she only meant to choose from. A bench cell
// reddens on any growth of this list.
const PEER_COLS = 'id, business_name, category, city';

// Two characters. Below it the door answers the ROSTER ONLY and never the whole
// table: a one-character query against twenty-six vendors is not a search, it
// is a directory dump wearing one.
const MIN_PEER_QUERY = 2;
// The server's cap, and the caller cannot raise it. Named rather than inlined
// because it is the whole of F5's budget that lives in this file.
const MAX_PEER_RESULTS = 30;

// ── ⚠ A DECLARED SECOND HOME, AND ITS CURE IS NAMED ────────────────────────
// `safeTerm` already exists at `src/api/admin/search.js:101`, byte-for-byte
// this logic. It is not exported, and `src/api/admin/search.js` is NOT in this
// sitting's radius — so promoting it to a shared module (which is the right
// cure and would leave ONE home) is out of scope here.
//
// Written out rather than imported across a router boundary, and DECLARED
// rather than quietly duplicated: the sole-writer law forbids a silent second
// home, and the honest form of a duplication you cannot yet remove is a
// comment naming the twin, the reason, and the owed cure. The cure is a micro
// that lifts both into `src/lib/shared/`; until it runs, an edit to either must
// be made to both, and a bench cell holds the two byte-identical.
//
// It strips PostgREST filter metacharacters AND LIKE wildcards together. Both
// matter: a comma or a paren would break out of the `or(...)` filter string,
// and a bare `%` would turn a two-character minimum into a match-everything.
const MAX_PEER_TERM = 60;
function safeTerm(raw) {
  return String(raw == null ? '' : raw)
    .slice(0, MAX_PEER_TERM)
    .replace(/[,()"'\\%_*.:;<>=]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
    // `notes` LEFT THE SELECT WITH ITS READER (R-G51.14). The original's notes were
    // never carried to the peer, and now that the sender's note does not travel
    // through `createLead` either, nothing in this function reads the column. A
    // SELECT that asks for a column no line uses is the shape F-04.106 was filed
    // against — it grows quietly until someone assumes it is needed.
    .select('id, name, phone, email, wedding_date, wedding_date_precision, wedding_city, event_types, budget_min, budget_max, raw_message')
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

  // ── 3 · THE PEER MUST BE FORWARDABLE  (R-40.104, amending R-G51.1) ────────
  // ⚠ THIS BLOCK USED TO READ `vendor_roster`. THE FOUNDER REPEALED THAT.
  //
  // R-G51.1 made a linked roster edge the boundary of the exchange: you could
  // hand work only to someone you had already worked with. The reasoning was
  // sound and the effect was a closed loop — the vendor who most needs to pass
  // an enquiry on is the one who has no peer for that trade yet, and the ruling
  // guaranteed she would never find one. R-40.104 opens the door to any vendor
  // on the platform; the roster survives as the SUGGESTION above the search box
  // (`Worked with`), never as the edge of the world.
  //
  // ⚠ THE PREDICATE IS THREE CLAUSES AND ALL THREE ARE LOAD-BEARING. It is the
  // same predicate the search door shapes the choice with, re-derived here
  // because a client-side list is not a permission — sitting 1's own law,
  // unchanged by the repeal.
  //
  //   status = 'active'          — a retired account has no Victor to take the
  //                                enquiry. `public.vendors` has no
  //                                `deleted_at`; `status` is how a vendor
  //                                leaves (PUBLIC_SCHEMA.md:1198+, col 9).
  //   discover_paused = false    — she un-published her storefront with the one
  //                                control she was given, so she has published
  //                                nothing, so R-40.107's consent reasoning
  //                                does not reach her. `vendorCard.js:417`
  //                                gates the public card on exactly this pair.
  //   peer_discoverable = true   — R-40.107, her withdrawal from the directory.
  //                                `.eq(true)` and never `.not('is', false)`: a
  //                                NULL passes the second and not the first.
  //
  // ⚠ THE CODE STAYS `NOT_A_PEER` AND ITS MEANING WIDENED. A new code would
  // grow `ForwardRefusalCode`, and the pwa's `refusalSentence` is exhaustive by
  // type with no `default` — so it would stop compiling until the founder had
  // vetoed a new sentence for a state the sheet already prevents. The three
  // clauses above are all invisible from the sheet (the search never lists such
  // a vendor), so this refusal reaches `refusalGeneric`, which is the right
  // sentence for a state that should not be reachable and sometimes is.
  const { data: peer, error: peerErr } = await supabase
    .from('vendors')
    .select('id, status, discover_paused, peer_discoverable')
    .eq('id', toVendorId)
    .maybeSingle();

  if (peerErr) return { ok: false, error: `Could not read that vendor: ${peerErr.message}` };
  if (!peer || peer.status !== 'active' || peer.discover_paused === true || peer.peer_discoverable !== true) {
    // ONE REFUSAL FOR ALL FOUR CASES, AND THAT IS THE PRIVACY DECISION, not a
    // shortcut. Distinguishing "no such vendor" from "she has withdrawn" would
    // let any vendor confirm another's existence and read her switch — which
    // defeats the switch on the first attempt. The sender learns only that the
    // forward cannot land.
    return { ok: false, code: REFUSE.NOT_A_PEER, error: 'That vendor cannot receive a forward.' };
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
    // ── NO `notes` ON THE PEER'S COPY  (R-G51.14 / F-40.120) ────────────────
    // ⚠ THIS FIELD WAS HERE AND THE FOUNDER'S WALK REMOVED IT.
    // The first cut sent the sender's note into `createLead`'s `notes` AND onto
    // the referral row, reasoning the peer should have it in her own working
    // notes. On glass it rendered TWICE on one record — once under `Forwarded
    // by`, once under `Notes` — and read as a bug rather than as care.
    //
    // The ruling is about WHERE THE NOTE BELONGS, not about a duplicate to
    // delete: the note is the SENDER'S PROVENANCE — her sentence about why she
    // passed this on — and not the peer's working record of the couple. It lives
    // on `lead_referrals.note` alone. The peer writes her own notes.
    //
    // And the ORIGINAL lead's notes are still not carried, for the reason the
    // first cut got right: they are the sender's private working record, written
    // for herself, and a forward is not consent to publish them to another
    // business.
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

  // ── 7 · THE PEER IS TOLD  (R-G51.15) ──────────────────────────────────────
  // ⚠ AFTER THE RECORD, AND OUTSIDE ITS FAILURE PATH. The lead and the row are
  // the durable half; the message is the courtesy. `alertPeerOfReferral` never
  // throws outward and its result is not consulted here: an alert that failed
  // must not turn a successful forward into a refusal on the sender's glass.
  // That would be a false-NOT-done — the same family of lie as F-40.84's
  // false-done, and just as forbidden.
  //
  // ⚠ AWAITED, NOT FIRE-AND-FORGET, and that is deliberate against the local
  // habit. `logActivity` one file over is fired without an await because a
  // ledger row is nobody's evidence; this write is the ONLY evidence the room
  // has for its 「Told」 state, and an unawaited promise on a serverless
  // container can be killed with the response. R-40.63's sibling reasoning: a
  // thing nobody waits for is a thing nobody can prove ran.
  //
  // `referrer_name` is the SENDER'S REGISTERED business name, off her vendor
  // row — the same value step 5 stamps on the peer's lead, and never a string
  // from the request body.
  await alertPeerOfReferral(supabase, {
    referralId:   referral.id,
    toVendorId,
    referrerName: fromVendor.business_name || null,
  });

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
    // `id` JOINS THE SELECT THIS SITTING — it is the key the 「Told」 read needs
    // and the only column added. F-04.106's law cuts both ways: a SELECT must
    // not ask for what no line uses, and it must not make a caller guess at a
    // key it already had.
    supabase.from('lead_referrals').select('id, lead_id, to_vendor_id, note, created_at')
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

  // ── THE 「Told」 STATE  (R-G51.15) ─────────────────────────────────────────
  // ONE batched read for the whole page, the shape every other stamp on this
  // door already takes. It returns the ids of forwards that carry a WAMID —
  // never a status, never a flag state (see `toldByReferralIds`' own note on
  // why `status: 'sent'` with a null wamid is not told).
  //
  // ⚠ IT RIDES INSIDE THE STAMP OBJECT AND IS NOT A NEW TOP-LEVEL WIRE KEY,
  // and that is a decision about two things at once. First the ruling: `told`
  // is a fact about ONE FORWARD, and `forwarded_to` is the only place on this
  // wire where one forward is described. Second the radius: `LIST_WIRE_CENSUS`
  // (leadSerializer.js:399-403) classifies TOP-LEVEL keys, so a new one there
  // would redden `b36` leg C — which is exactly what happened to
  // `forwarded_to`/`forwarded_by` when they joined (sitting 1 handover §10.5) —
  // and `leadSerializer.js` is not this sitting's to touch. Inside the stamp,
  // the key passes through `serializeLeadRows` untouched and no census moves.
  const toldIds = await toldByReferralIds(supabase, (outRes.data || []).map(r => r.id));

  const sentBy = new Map();
  for (const r of outRes.data || []) {
    sentBy.set(r.lead_id, {
      peer_name: nameById.get(r.to_vendor_id) || null,
      note: r.note,
      at: r.created_at,
      // ⚠ ONLY ON THE SENDER'S SIDE. The peer was the one told; a stamp on HER
      // record saying she was told is noise about a message she is holding.
      told: toldIds.has(r.id),
    });
  }
  const receivedBy = new Map();
  for (const r of inRes.data || []) {
    receivedBy.set(r.new_lead_id, { peer_name: nameById.get(r.from_vendor_id) || null, note: r.note, at: r.created_at });
  }

  return { ok: true, sentBy, receivedBy };
}

/**
 * THE PEER SEARCH  (R-40.104). Who this vendor may forward to.
 *
 * ⚠ THIS IS A READ AND NOT A PERMISSION. `forwardLead` step 3 re-derives the
 * same three-clause predicate server-side before it writes. This door SHAPES
 * the choice; sitting 1's law is unchanged by the repeal.
 *
 * Returns three groups in ruled order — `worked_with` · `same_trade` ·
 * `everyone` — each ALPHABETICAL by business name, each MUTUALLY EXCLUSIVE (a
 * peer appears once, in the highest group she qualifies for), and each OMITTED
 * WHEN EMPTY so the surface can suppress its head without inspecting lengths.
 *
 * ⚠ NOTHING RANKS. No rating, no distance, no count of forwards, no ordering by
 * volume. Master §7 refuses a spend-ranked or score-ranked surface and the
 * refusal reaches a picker as surely as a storefront; alphabetical is the only
 * order that is not a judgement wearing a sort.
 *
 * ⚠ AND THE PHONE IS NOT A KEY (c-40.45). The kickoff named phone as a third
 * search key. It is struck: `public.vendors` carries no phone at all — a
 * vendor's number lives on `public.users.phone`, which nothing publishes — and
 * a phone match answers "whose number is this", the reverse of what a storefront
 * answers and the one direction no surface on this estate offers. The RESULTS
 * carrying no phone (R-G11.6) would not have closed it: the MATCH is the
 * disclosure.
 */
async function searchPeers(supabase, vendorId, { q, limit } = {}) {
  const term = safeTerm(q);
  const cap = Math.min(MAX_PEER_RESULTS, Math.max(1, parseInt(limit, 10) || MAX_PEER_RESULTS));

  // HER ROSTER FIRST, ALWAYS — it is the `Worked with` group and it is also the
  // whole answer when the box is empty. Linked edges only: a roster row with a
  // NULL member is a name and a number she typed, with no vendor behind it and
  // no Victor to take an enquiry. That predicate outlived R-G51.1's repeal
  // because it was never about permission — it is about whether a row denotes
  // a vendor at all.
  const { data: edges } = await supabase
    .from('vendor_roster')
    .select('member_vendor_id')
    .eq('owner_vendor_id', vendorId)
    .not('member_vendor_id', 'is', null);
  const rosterIds = new Set((edges || []).map(e => e.member_vendor_id).filter(Boolean));

  // MY OWN TRADE, normalised through the ONE home. `vendors.category` carries
  // no CHECK (censused against PUBLIC_SCHEMA.md's constraints sections: no
  // category constraint exists), so it is free text and `Makeup` would sort
  // away from `makeup` under a raw compare. `normaliseCategory` is where that
  // question is already answered for the whole estate.
  const { data: me } = await supabase
    .from('vendors').select('id, category').eq('id', vendorId).maybeSingle();
  const myTrade = normaliseCategory(me && me.category);

  // ⚠ THE THREE CLAUSES, IDENTICAL TO `forwardLead` STEP 3. If these ever
  // disagree, the sheet offers a peer the door refuses — which is the shape of
  // every "why did nothing happen" defect in this estate's log.
  let query = supabase
    .from('vendors')
    .select(PEER_COLS)
    .eq('peer_discoverable', true)
    .eq('discover_paused', false)
    .eq('status', 'active')
    .neq('id', vendorId)                       // she cannot forward to herself
    .limit(cap);

  // ── THE BUDGET (F5 as ruled) ───────────────────────────────────────────────
  // Vendor-auth only (the router's own middleware) · a MINIMUM of two
  // characters · a server-side cap this caller cannot raise past
  // MAX_PEER_RESULTS · exactly one `ilike` group over two columns. Below the
  // minimum the door answers the ROSTER ONLY — never the whole table, which is
  // what a one-character query would otherwise mean.
  const searching = term.length >= MIN_PEER_QUERY;
  if (searching) {
    query = query.or(`business_name.ilike.*${term}*,routing_handle.ilike.*${term}*`);
  } else if (rosterIds.size === 0) {
    return { ok: true, groups: [], searching: false };
  } else {
    query = query.in('id', [...rosterIds]);
  }

  const { data: rows, error } = await query;
  if (error) return { ok: false, error: `Could not search vendors: ${error.message}` };

  // MUTUALLY EXCLUSIVE, highest group wins. A peer listed twice would make the
  // vendor wonder which one is the real one.
  const worked = [], trade = [], every = [];
  for (const v of rows || []) {
    if (rosterIds.has(v.id)) worked.push(v);
    else if (normaliseCategory(v.category) === myTrade) trade.push(v);
    else every.push(v);
  }
  const byName = (a, b) => String(a.business_name || '').localeCompare(String(b.business_name || ''));

  const groups = [
    { key: 'worked_with', peers: worked.sort(byName) },
    { key: 'same_trade',  peers: trade.sort(byName)  },
    { key: 'everyone',    peers: every.sort(byName)  },
  // EMPTY GROUPS DO NOT TRAVEL. The head is suppressed when its group is empty
  // (founder-vetoed), and a surface that had to check lengths to know that
  // would be deciding the rule a second time. The door decides it once.
  ].filter(g => g.peers.length > 0);

  return { ok: true, groups, searching };
}

module.exports = {
  forwardLead, getReferralRoom, referralStampsForLeads,
  // G5.1 SITTING 2 · R-40.104 — the picker became a search, and it lives here
  // beside `forwardLead` because the two share one predicate and a predicate
  // with two homes is a sheet that offers what the door refuses.
  searchPeers,
  // Exported for the bench: the refusal codes are CODE, not prose, and a cell
  // asserts the door returns one rather than a sentence the founder never saw.
  REFUSE, REFERRAL_COLS,
  // Cells assert against these directly; a cell that re-declares a constant it
  // is testing has stopped testing this file (D-38.1).
  PEER_COLS, MIN_PEER_QUERY, MAX_PEER_RESULTS, safeTerm,
};
