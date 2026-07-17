// src/lib/vendor/availability.js
// Shared read/write logic for vendor availability blocks.
// Called by REST handlers (src/api/vendor/availability.js).
//
// ── TDW_04 B1 — THE CONVERGENCE (C1, ruling L-7; migration 0077) ────────────
// Availability used to live in its own table, public.vendor_availability. It now
// lives in the calendar itself: public.events, kind='blocked'. One spine for dates.
// 0077 dropped the parallel store (verified empty at run time by its own assert).
//
// PLANE (F-04.30 / F-04.31 — the standing law, proven by the client in scope,
// never by the table name): this module's `supabase` is an INJECTED PARAMETER and
// therefore has NO plane of its own. Its sole caller — src/api/vendor/availability.js
// (:29/:44/:60) — injects `req.app.locals.supabase`, the PUBLIC-default client. So
// every `from('events')` below is public.events, THE CALENDAR. engine.events is an
// unrelated agent audit trail and is never reachable from here (reaching it would
// require an explicit .schema('engine') hop; there is none).
//
// WIRE SHAPE IS FROZEN. The PWA reads `{ok, blocks:[{id, blocked_date, reason,
// created_at}], total}` and keys on `blocked_date` (app/vendor/calendar/page.tsx:96).
// The field is blocked_date, NOT the spec's illustrative `date`. Zero FE change.
//   id           <- events.id
//   blocked_date <- events.event_date
//   reason       <- events.notes      (see REASON ROUND-TRIP below)
//   created_at   <- events.created_at
//
// REASON ROUND-TRIP — why `reason` lives in notes and not in title. Two rulings
// bind at once: (a) title is the reason verbatim, else 'Blocked' (Q-B1-6); and
// (b) the wire is byte-preserved (`reason` is nullable and must read back NULL).
// events.title is NOT NULL, so a reason-less block MUST title as 'Blocked' — and
// reading `reason` back from title would then hand the PWA "Blocked" where it used
// to see null, and would swallow a vendor who literally typed "Blocked". So title
// carries the DISPLAY (what the grid shows) and notes carries the SOURCE (what the
// vendor actually said, nullable, exact). This is not a choice between the two
// rulings; it is the only shape that satisfies both.
//
// DELETE COVENANT (Q-B1-7): unblock is a SOFT delete — deleted_at, never DROP.
// B0 spent a whole finding (F-04.25) curing a read that forgot deleted_at; we do
// not mint a new hard-delete the same day. Consequence owned here: EVERY read below
// filters `deleted_at is null`. The wire is unchanged — a soft-deleted block simply
// stops appearing in blocks[].
//
// ONE-WRITER LAW (Q-B1-9) — DISCHARGED AT B2. B1's note said "this file is on B2's
// relocation list; blockDate/unblockDate become thin eventWrite callers there." They
// are. Every write below goes through src/lib/vendor/eventWrite.js. What stays here
// is what is genuinely this module's: the FROZEN WIRE MAPPING (toBlock), the reason
// round-trip, the date validation, and unblock's resolve-then-write — because LOCK 1
// is a resolve-time predicate, not a write-time one.
//
// WHAT MOVED, AND WHERE IT WENT (so a reviewer can see the relocation, not a rewrite):
//   the ALREADY_BLOCKED read-before-write  -> eventWrite's findExistingBlock, verbatim
//                                            (query chain, fail-closed guard, the
//                                            'Already blocked.' string and its code)
//   the insert                              -> eventWrite's write leg
//   the deleted_at update                   -> eventWrite's soft-delete path
// NOTHING about the wire changes. {ok, blocks:[{id, blocked_date, reason, created_at}],
// total} is byte-preserved, keyed on blocked_date. Zero FE change, again.

'use strict';

const { writeEvent } = require('./eventWrite'); // TDW_04 B2 — the one writer

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// The block's shape on the calendar plane. slot: 0077 added the bare column so a
// converged/new block carries full_day from day one — no NULL-slot era ever exists
// (the CE's ladder correction; 0075 at B2 adds the CHECK + index + a backfill that
// is a no-op if this holds).
const BLOCK_KIND = 'blocked';
const BLOCK_SLOT = 'full_day';
const DEFAULT_TITLE = 'Blocked'; // Q-B1-6, founder-ratified. Utility copy.

// TDW_04 B6-S2 (0078, R-B6-17): the day sheet's slot toggles arrive. The wire
// gains `slot` ADDITIVELY — {id, blocked_date, reason, created_at} is still
// byte-present, keyed on blocked_date; a field added beside a frozen shape is
// not a change to it, and the pre-0078 PWA reads it as undefined harmlessly.
const BLOCK_SLOTS = ['morning', 'noon', 'evening', 'full_day'];

const BLOCK_SELECT = 'id, event_date, notes, created_at, slot';

// events row -> the frozen wire shape. The ONLY place the mapping lives.
function toBlock(row) {
  return {
    id:           row.id,
    blocked_date: row.event_date,
    reason:       row.notes == null ? null : row.notes,
    created_at:   row.created_at,
    slot:         row.slot || BLOCK_SLOT,   // pre-0078 rows are all full_day (0075's witnessed backfill)
  };
}

// ── blockDate ─────────────────────────────────────────────────────────────

async function blockDate(supabase, vendorId, blocked_date, reason, slot) {
  if (!blocked_date || !DATE_RE.test(blocked_date)) {
    return { ok: false, error: 'blocked_date is required in YYYY-MM-DD format.' };
  }
  // TDW_04 B6-S2: slot is OPTIONAL and defaults to full_day — every existing
  // caller (the BlockSheet, blockHands' donna_block_date) is byte-identical.
  // The four values mirror events_slot_check; writeEvent mirrors it again at
  // its own validation (one sentence, two doors, same DB truth).
  const blockSlot = slot || BLOCK_SLOT;
  if (!BLOCK_SLOTS.includes(blockSlot)) {
    return { ok: false, error: 'slot must be one of: morning, noon, evening, full_day.' };
  }

  // Q-B1-6, founder-ratified: title is the reason verbatim, else 'Blocked'. Utility copy.
  // events.title is NOT NULL, which is why a reason-less block MUST title as something;
  // `notes` carries the SOURCE (nullable, exact) so `reason` reads back NULL. See the
  // REASON ROUND-TRIP note above — that shape is the only one satisfying both rulings.
  const title = (reason && String(reason).trim()) ? String(reason).trim() : DEFAULT_TITLE;

  // ALREADY_BLOCKED, the atomicity story, and the insert now ALL live in eventWrite.
  // `code` rides back out on the return so api/vendor/availability.js:73 maps it to 409
  // exactly as it did at B1 — the wire cannot tell the relocation happened.
  const r = await writeEvent(supabase, {
    vendorId,
    surface:    'pwa',
    source:     'crud',
    kind:       BLOCK_KIND,   // 0069 widened the CHECK to include 'blocked'
    title,                    // NOT NULL: the reason verbatim, else 'Blocked'
    event_date: blocked_date,
    slot:       blockSlot,   // 0077's column; 0075's CHECK; 0078's per-slot key. Branch 1 of slot derivation.
    notes:      reason || null,
    state:      'upcoming',
  });
  if (!r.ok) return r;                       // carries { error, code? } untouched
  return { ok: true, block: toBlock(r.event) };
}

// ── unblockDate ───────────────────────────────────────────────────────────
// Accepts either block_id (UUID) or date (YYYY-MM-DD). SOFT delete (Q-B1-7).

async function unblockDate(supabase, vendorId, params) {
  const { block_id, date } = params;

  // LOCK 1 of 2 (Q-B1-5, defense in depth) — UNCHANGED IN SUBSTANCE, MOVED IN TIME.
  // `.eq('kind', BLOCK_KIND)` is not decoration — it is the type guard that used to be
  // the TABLE itself. Before convergence, vendor_availability held blocks and only
  // blocks, so a delete there could not possibly touch a booking. public.events holds
  // bookings AND blocks together, so without this the unblock door would delete a
  // vendor's real booking with a 200. LOCK 2 lives in the door (api/vendor/
  // availability.js) and returns 404 first.
  //
  // WHY IT IS NOW A RESOLVE AND NOT AN UPDATE-PREDICATE: after B2 the write belongs to
  // eventWrite, which writes ONE row by id. So the lock moves from the update's WHERE
  // to a read that RESOLVES which ids may be touched — and it guards exactly as hard,
  // because eventWrite is only ever handed ids this query returned. The old form could
  // update many rows in one statement; this resolves the same set and writes each
  // through the one door. `count` semantics are preserved: count = rows resolved.
  let q = supabase
    .from('events')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('kind', BLOCK_KIND)
    .is('deleted_at', null);

  if (block_id) {
    q = q.eq('id', block_id);
  } else if (date) {
    if (!DATE_RE.test(date)) return { ok: false, error: 'date must be in YYYY-MM-DD format.' };
    q = q.eq('event_date', date);
  } else {
    return { ok: false, error: 'Provide block_id or date.' };
  }

  const { data: rows, error } = await q;
  if (error) return { ok: false, error: error.message };
  // FAIL-CLOSED (F15's law, same as blockDate's guard read): a resolve that ERRORS is
  // not a resolve that found nothing. Handled above — no truthful read, no write.
  if (!rows || rows.length === 0) return { ok: false, error: 'Block not found.' };

  const stamp = new Date().toISOString();
  for (const row of rows) {
    const r = await writeEvent(supabase, {
      vendorId,
      surface:    'pwa',
      source:     'crud',
      event_id:   row.id,
      deleted_at: stamp,   // SOFT delete (Q-B1-7). Never a DROP.
    });
    if (!r.ok) return { ok: false, error: r.error || 'Could not unblock.' };
  }
  return { ok: true, deleted: true };
}

// ── listBlocks ────────────────────────────────────────────────────────────

async function listBlocks(supabase, vendorId, params) {
  const { from, to } = params || {};

  let query = supabase
    .from('events')
    .select(BLOCK_SELECT, { count: 'exact' })
    .eq('vendor_id', vendorId)
    .eq('kind', BLOCK_KIND)
    .is('deleted_at', null)          // the delete covenant, read side
    .order('event_date', { ascending: true });

  if (from) query = query.gte('event_date', from);
  if (to)   query = query.lte('event_date', to);

  const { data: rows, error, count } = await query;
  if (error) return { ok: false, error: error.message };
  return { ok: true, blocks: (rows || []).map(toBlock), total: count || 0 };
}

module.exports = { blockDate, unblockDate, listBlocks, BLOCK_KIND };
