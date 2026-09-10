// src/lib/vendor/exchange.js
// CE-42 · SEAT R7 · 4c-3b-1s — G5.3 THE INFLUENCER EXCHANGE, THE ONE WRITER.
//
// Everything that reads or moves an exchange row lives here. The doors in
// src/api/vendor/exchange.js are wiring: they check the shape of a request, call
// one function below, and turn a refusal code into a status. No PostgREST chain
// for this plane is built anywhere else (ruling (iii), the one-writer law).
//
// ── WHAT AN EXCHANGE IS, AND WHAT IT IS NOT ──────────────────────────────────
// A vendor offers her craft to a content_creator and asks for posts. That is the
// whole of it.
//   ⚠ IT IS NOT A LEAD (ruling (iii)). `referrals.js` remains the only peer-land
//     caller of `createLead`; nothing here writes `public.leads`. A creator is not
//     a prospect and an accepted exchange is not a booking.
//   ⚠ IT MINTS NOTHING ON `public.events` (ruling (iii)). `eventWrite.js` is the
//     sole writer of that table on vendor paths and this plane has no business
//     there.
//   ⚠ NO MONEY, EVER (master §7). 0166 has no money column, this file names no
//     rupee, and b78 greps both. TDW does not broker payment between a vendor and
//     a creator, so there is nowhere for a number to go.
//   ⚠ NO FOLLOWER IDENTITY (§7). Reach is aggregates read from
//     `public.influencer_reach_snapshots` (0166 §3), a table with no column that
//     could hold one.
//
// ── THE STATE MACHINE (ruling (iii)) ─────────────────────────────────────────
//   sent → accepted | declined   (the CREATOR's verbs, her inbox)
//   sent → withdrawn             (the SENDER's, on sent only)
//   accepted → completed         (the SENDER's, on accepted only)
// EVERY transition is a guarded UPDATE — `.eq('state', <from>)` in the same
// statement that sets the new one. Read-then-write would let two taps a
// millisecond apart both pass the read and both write; the guard makes the second
// one move ZERO ROWS and return NOT_IN_STATE, which is the honest answer. The
// same guard is what makes a decline of an already-accepted row impossible
// without this file ever holding a lock.
//
// SQL PROVENANCE (protocol §10) — every column named below is witnessed:
//   public.vendors            — PUBLIC_SCHEMA.md @0154 :1382 block. `id` (1),
//     `business_name` (3), `category` (4), `city` (6), `instagram_handle` (16),
//     `status` (9, default 'active' — THERE IS NO `active` COLUMN ON vendors,
//     checked at the cut), plus `exchange_discoverable` from 0166 §1.
//   public.exchange_requests  — 0166 §2 (run by the founder 2026-09-10, verify green).
//   public.influencer_reach_snapshots — 0166 §3, same run.

'use strict';

const CREATOR_CATEGORY = 'content_creator';
const ASK_KINDS        = Object.freeze(['post', 'reel', 'story']);
const MAX_ASK_COUNT    = 20;
const MAX_NOTE_CHARS   = 500;

// The window a snapshot is "Verified via Instagram" for (ruling (ii)). Older than
// this reads Pending — the honest word for a fact we last measured a month ago.
// The arm that WRITES snapshots is 4c-3b-2's; until it exists every card reads
// Pending, which is exactly what the shell's banner already tells her.
const REACH_FRESH_DAYS = 30;

const REFUSE = Object.freeze({
  NOT_A_SENDER:  'NOT_A_SENDER',
  NOT_A_CREATOR: 'NOT_A_CREATOR',
  NOT_FOUND:     'NOT_FOUND',
  NOT_IN_STATE:  'NOT_IN_STATE',
  INVALID:       'INVALID',
});

// ⚠ NEVER `select('*')` OFF vendors HERE. That row carries pin_hash, bank
// details and her address; this plane shows one vendor to another and must name
// the four fields it is allowed to.
const CREATOR_COLS = 'id, business_name, city, instagram_handle';
const REQUEST_COLS = 'id, vendor_id, influencer_vendor_id, offer_kind, offer_note, ask_kind, ask_count, date_from, date_to, state, created_at, accepted_at, declined_at, withdrawn_at, completed_at';

/** THE ROLE, decided from the row the middleware already read — no second query.
 *  A creator is a vendor of category content_creator (ruling §5(ii)). Her OPT-IN
 *  decides whether she is LISTED, never whether she has an inbox: a creator who
 *  switched off still has to see the requests she already received. */
function roleOf(vendor) {
  return vendor && vendor.category === CREATOR_CATEGORY ? 'creator' : 'sender';
}

function isFresh(verifiedAt, now = Date.now()) {
  if (!verifiedAt) return false;
  const t = Date.parse(verifiedAt);
  if (!Number.isFinite(t)) return false;
  return now - t <= REACH_FRESH_DAYS * 24 * 60 * 60 * 1000;
}

/** A snapshot row → the card's view. `verified` is decided HERE, on the server,
 *  because a room that did its own date arithmetic would be judging a fact it did
 *  not measure. Absent snapshot → null, and the card reads Pending. */
function reachView(snap, now = Date.now()) {
  if (!snap) return null;
  const arr = (v) => (Array.isArray(v) ? v : []);
  return {
    follower_count: snap.follower_count,
    engagement_pct: snap.engagement_rate === null || snap.engagement_rate === undefined
      ? 0 : Number(snap.engagement_rate),
    verified:       isFresh(snap.verified_at, now),
    cities:         arr(snap.audience_city),
    age:            arr(snap.audience_age),
    gender:         arr(snap.audience_gender),
  };
}

/** The newest snapshot per vendor, in ONE query for the whole list. Ordered
 *  newest-first and kept on first sight, so N creators cost one round trip
 *  rather than N. */
async function latestSnapshots(supabase, vendorIds) {
  const out = new Map();
  if (!vendorIds.length) return { ok: true, byVendor: out };
  const { data, error } = await supabase
    .from('influencer_reach_snapshots')
    .select('vendor_id, follower_count, engagement_rate, audience_city, audience_age, audience_gender, verified_at')
    .in('vendor_id', vendorIds)
    .order('verified_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  for (const row of data || []) if (!out.has(row.vendor_id)) out.set(row.vendor_id, row);
  return { ok: true, byVendor: out };
}

/** The browse list (S2(b)). THREE PREDICATES, and each is load-bearing:
 *    category = content_creator   — the exchange lists creators (§5(ii))
 *    exchange_discoverable = true — her opt-in, 0166 §1, DEFAULT false
 *    status = 'active'            — the estate's own liveness column
 *  ...and the caller is excluded from her own list.
 *
 *  THE SORT IS AUDIENCE FIT, THEN ENGAGEMENT (S2(b)). The follower count never
 *  enters the comparator — it is a fact on the line, never a key. It is done HERE
 *  rather than in Postgres because the fit percentage lives inside a jsonb array
 *  and the ordering rule is the product's, not the column's. */
async function browseCreators(supabase, viewer, { city, craft, now = Date.now() } = {}) {
  if (roleOf(viewer) === 'creator') return { ok: false, code: REFUSE.NOT_A_SENDER, error: 'The exchange lists creators to vendors.' };

  let q = supabase.from('vendors').select(CREATOR_COLS)
    .eq('category', CREATOR_CATEGORY)
    .eq('exchange_discoverable', true)
    .eq('status', 'active')
    .neq('id', viewer.id);
  if (city) q = q.eq('city', city);
  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };

  const rows = data || [];
  const snaps = await latestSnapshots(supabase, rows.map(r => r.id));
  if (!snaps.ok) return snaps;

  const fitCity = city || viewer.city || null;
  const creators = rows.map(r => ({
    id: r.id, business_name: r.business_name, city: r.city,
    handle: r.instagram_handle, reach: reachView(snaps.byVendor.get(r.id), now),
  }));
  const fit = (c) => {
    if (!c.reach || !fitCity) return 0;
    const hit = c.reach.cities.find(x => x && x.city === fitCity);
    return hit ? Number(hit.pct) || 0 : 0;
  };
  creators.sort((a, b) => fit(b) - fit(a)
    || (b.reach ? b.reach.engagement_pct : 0) - (a.reach ? a.reach.engagement_pct : 0));
  // `craft` is the sender's OWN offer on the shell's filter, not a property of the
  // creator — every row here is a content_creator by predicate. Accepted and
  // ignored rather than silently treated as a category filter that would empty
  // the list (report-never-adapt: the door says so in its header).
  return { ok: true, creators };
}

async function getCreatorCard(supabase, viewer, creatorId, { now = Date.now() } = {}) {
  if (roleOf(viewer) === 'creator') return { ok: false, code: REFUSE.NOT_A_SENDER, error: 'The exchange lists creators to vendors.' };
  const { data, error } = await supabase.from('vendors').select(CREATOR_COLS)
    .eq('id', creatorId)
    .eq('category', CREATOR_CATEGORY)
    .eq('exchange_discoverable', true)
    .eq('status', 'active')
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  // A creator who opted out is NOT FOUND to a sender, not "forbidden": the
  // difference between the two answers is a way to learn she exists.
  if (!data) return { ok: false, code: REFUSE.NOT_FOUND, error: 'No creator at that address.' };
  const snaps = await latestSnapshots(supabase, [data.id]);
  if (!snaps.ok) return snaps;
  return { ok: true, creator: {
    id: data.id, business_name: data.business_name, city: data.city,
    handle: data.instagram_handle, reach: reachView(snaps.byVendor.get(data.id), now),
  } };
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Shape check for a send. Returns a REASON, never throws — the door turns it
 *  into a 400 with the sentence. ⚠ A `budget`, `fee`, `amount` or `rate` key in
 *  the body is not stripped quietly; it is REFUSED, because a client that thinks
 *  it can price an exchange has read a spec this estate does not have (§7). */
function validateRequestBody(body) {
  const b = body && typeof body === 'object' ? body : {};
  for (const banned of ['budget', 'fee', 'amount', 'rate', 'price', 'payment']) {
    if (banned in b) return 'The exchange carries no money field.';
  }
  if (!b.offer_kind || typeof b.offer_kind !== 'string') return 'Say what you offer.';
  const note = b.offer_note === undefined || b.offer_note === null ? '' : String(b.offer_note);
  if (note.length > MAX_NOTE_CHARS) return 'That note is too long.';
  const kind = String(b.ask_kind || '').toLowerCase();
  if (!ASK_KINDS.includes(kind)) return 'Ask for a post, a reel or a story.';
  const count = Number(b.ask_count);
  if (!Number.isInteger(count) || count < 1 || count > MAX_ASK_COUNT) return 'Ask for between 1 and 20.';
  if (!ISO_DAY.test(String(b.date_from || '')) || !ISO_DAY.test(String(b.date_to || ''))) return 'Give both dates.';
  if (String(b.date_to) < String(b.date_from)) return 'The last date is before the first.';
  return null;
}

/** SEND. The creator is re-checked against the same three predicates the browse
 *  list uses — a request posted straight at an address must not reach a vendor
 *  the list would never have shown. */
async function createRequest(supabase, sender, creatorId, body) {
  if (roleOf(sender) === 'creator') return { ok: false, code: REFUSE.NOT_A_SENDER, error: 'The exchange lists creators to vendors.' };
  if (creatorId === sender.id) return { ok: false, code: REFUSE.INVALID, error: 'That is your own page.' };
  const why = validateRequestBody(body);
  if (why) return { ok: false, code: REFUSE.INVALID, error: why };

  const card = await getCreatorCard(supabase, sender, creatorId);
  if (!card.ok) return card;

  const { data, error } = await supabase.from('exchange_requests').insert({
    vendor_id:            sender.id,
    influencer_vendor_id: creatorId,
    offer_kind:           String(body.offer_kind),
    offer_note:           body.offer_note === undefined || body.offer_note === null ? '' : String(body.offer_note),
    ask_kind:             String(body.ask_kind).toLowerCase(),
    ask_count:            Number(body.ask_count),
    date_from:            String(body.date_from),
    date_to:              String(body.date_to),
  }).select(REQUEST_COLS).single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, request: shape(data, card.creator.business_name) };
}

// THE MACHINE, AS DATA. Who may move a row, from which state, to which, and which
// timestamp that lands on. A verb that is not in this table cannot be performed,
// so adding one is a deliberate edit here rather than a new branch somewhere.
const TRANSITIONS = Object.freeze({
  accept:   { side: 'creator', from: 'sent',     to: 'accepted',  stamp: 'accepted_at' },
  decline:  { side: 'creator', from: 'sent',     to: 'declined',  stamp: 'declined_at' },
  withdraw: { side: 'sender',  from: 'sent',     to: 'withdrawn', stamp: 'withdrawn_at' },
  complete: { side: 'sender',  from: 'accepted', to: 'completed', stamp: 'completed_at' },
});

/** ONE GUARDED UPDATE PER VERB. The `.eq('state', rule.from)` is the whole of the
 *  concurrency story: the second of two racing taps matches zero rows and is told
 *  NOT_IN_STATE. The side clause (`vendor_id` or `influencer_vendor_id`) is what
 *  makes a stranger's id useless — a row that is not yours does not refuse you,
 *  it simply is not found by your update. */
async function transition(supabase, actor, requestId, verb, { now = new Date() } = {}) {
  const rule = TRANSITIONS[verb];
  if (!rule) return { ok: false, code: REFUSE.INVALID, error: 'No such act.' };
  const actorSide = roleOf(actor);
  if (rule.side !== actorSide) {
    return rule.side === 'creator'
      ? { ok: false, code: REFUSE.NOT_A_CREATOR, error: 'Only the creator can answer a request.' }
      : { ok: false, code: REFUSE.NOT_A_SENDER,  error: 'Only the sender can move that request.' };
  }
  const mine = rule.side === 'creator' ? 'influencer_vendor_id' : 'vendor_id';
  const patch = { state: rule.to, updated_at: now.toISOString() };
  patch[rule.stamp] = now.toISOString();

  const { data, error } = await supabase.from('exchange_requests')
    .update(patch)
    .eq('id', requestId)
    .eq(mine, actor.id)
    .eq('state', rule.from)
    .select(REQUEST_COLS);
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    // ZERO ROWS has two causes and the caller may not learn which: a row in
    // another state, or a row that is not hers. Telling them apart out loud would
    // confirm the existence of someone else's request.
    return { ok: false, code: REFUSE.NOT_IN_STATE, error: 'That request has already moved.' };
  }
  const row = data[0];
  const names = await namesFor(supabase, [rule.side === 'creator' ? row.vendor_id : row.influencer_vendor_id]);
  return { ok: true, request: shape(row, names.get(rule.side === 'creator' ? row.vendor_id : row.influencer_vendor_id)) };
}

async function namesFor(supabase, ids) {
  const out = new Map();
  const want = [...new Set(ids.filter(Boolean))];
  if (!want.length) return out;
  const { data } = await supabase.from('vendors').select('id, business_name').in('id', want);
  for (const v of data || []) out.set(v.id, v.business_name);
  return out;
}

/** ONE ROW SHAPE FOR BOTH SEATS. `counterpart_name` is the OTHER side — the
 *  sender's list reads the creator, the inbox reads the sender — so the glass
 *  never learns two shapes (the pwa half asserts this at b76 C13). */
function shape(r, counterpartName) {
  return {
    id: r.id,
    counterpart_name: counterpartName || '',
    offer_kind: r.offer_kind,
    offer_note: r.offer_note || '',
    ask_kind:   r.ask_kind,
    ask_count:  r.ask_count,
    date_from:  r.date_from,
    date_to:    r.date_to,
    state:      r.state,
  };
}

async function listMine(supabase, sender) {
  if (roleOf(sender) === 'creator') return { ok: false, code: REFUSE.NOT_A_SENDER, error: 'The exchange lists creators to vendors.' };
  const { data, error } = await supabase.from('exchange_requests').select(REQUEST_COLS)
    .eq('vendor_id', sender.id).order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  const rows = data || [];
  const names = await namesFor(supabase, rows.map(r => r.influencer_vendor_id));
  return { ok: true, requests: rows.map(r => shape(r, names.get(r.influencer_vendor_id))) };
}

/** HER INBOX. Note what is NOT filtered: a withdrawn request stays visible to her,
 *  because a row that appeared and vanished with no trace is a worse answer than
 *  one that says what happened to it. */
async function listInbox(supabase, creator) {
  if (roleOf(creator) !== 'creator') return { ok: false, code: REFUSE.NOT_A_CREATOR, error: 'Only a content creator has an exchange inbox.' };
  const { data, error } = await supabase.from('exchange_requests').select(REQUEST_COLS)
    .eq('influencer_vendor_id', creator.id).order('created_at', { ascending: false });
  if (error) return { ok: false, error: error.message };
  const rows = data || [];
  const names = await namesFor(supabase, rows.map(r => r.vendor_id));
  return { ok: true, requests: rows.map(r => shape(r, names.get(r.vendor_id))) };
}

module.exports = {
  CREATOR_CATEGORY, CREATOR_COLS, ASK_KINDS, MAX_ASK_COUNT, MAX_NOTE_CHARS, REACH_FRESH_DAYS,
  REFUSE, TRANSITIONS,
  roleOf, isFresh, reachView, validateRequestBody,
  browseCreators, getCreatorCard, createRequest, transition, listMine, listInbox,
};
