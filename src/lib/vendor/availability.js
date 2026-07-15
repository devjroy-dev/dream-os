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
// ONE-WRITER LAW (Q-B1-9, recorded): these writes go direct to public.events, which
// is lawful UNTIL B2 — the guardrail binds after eventWrite exists. This file is on
// B2's relocation list; blockDate/unblockDate become thin eventWrite callers there.

'use strict';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// The block's shape on the calendar plane. slot: 0077 added the bare column so a
// converged/new block carries full_day from day one — no NULL-slot era ever exists
// (the CE's ladder correction; 0075 at B2 adds the CHECK + index + a backfill that
// is a no-op if this holds).
const BLOCK_KIND = 'blocked';
const BLOCK_SLOT = 'full_day';
const DEFAULT_TITLE = 'Blocked'; // Q-B1-6, founder-ratified. Utility copy.

const BLOCK_SELECT = 'id, event_date, notes, created_at';

// events row -> the frozen wire shape. The ONLY place the mapping lives.
function toBlock(row) {
  return {
    id:           row.id,
    blocked_date: row.event_date,
    reason:       row.notes == null ? null : row.notes,
    created_at:   row.created_at,
  };
}

// ── blockDate ─────────────────────────────────────────────────────────────

async function blockDate(supabase, vendorId, blocked_date, reason) {
  if (!blocked_date || !DATE_RE.test(blocked_date)) {
    return { ok: false, error: 'blocked_date is required in YYYY-MM-DD format.' };
  }

  // ALREADY_BLOCKED — emulated, and the emulation is the honest part.
  // vendor_availability carried `unique (vendor_id, blocked_date)`; a duplicate
  // insert raised 23505 and the door turned that into 409 ALREADY_BLOCKED,
  // ATOMICALLY. public.events has no such constraint and must not grow a naive one
  // (a vendor legitimately has many events on one date). So the check is a
  // read-before-write, and a read-before-write is NOT atomic: two concurrent blocks
  // on the same date can both pass. See the B1 handover — the lost atomicity is a
  // reported finding with a proposed cure (a UNIQUE PARTIAL index on
  // (vendor_id, event_date) where kind='blocked' and deleted_at is null), which is
  // 0075's to own at B2 per the CE's split. NOT decided here.
  //
  // FAIL-CLOSED (F15's law): a guard read that ERRORS is not a guard read that
  // found nothing. No truthful read, no write.
  const { data: existing, error: readErr } = await supabase
    .from('events')
    .select('id')
    .eq('vendor_id', vendorId)
    .eq('kind', BLOCK_KIND)
    .eq('event_date', blocked_date)
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();
  if (readErr) {
    return { ok: false, error: `Could not check existing blocks (${readErr.message}) — nothing was written.` };
  }
  if (existing) {
    return { ok: false, error: 'Already blocked.', code: 'ALREADY_BLOCKED' };
  }

  const title = (reason && String(reason).trim()) ? String(reason).trim() : DEFAULT_TITLE;

  const { data: row, error } = await supabase
    .from('events')
    .insert({
      vendor_id:  vendorId,          // couple_id stays null — events_owner_xor (0013) satisfied
      title,                          // NOT NULL: the reason verbatim, else 'Blocked'
      event_date: blocked_date,
      kind:       BLOCK_KIND,         // 0069 widened the CHECK to include 'blocked'
      slot:       BLOCK_SLOT,         // 0077's bare column
      notes:      reason || null,     // the SOURCE — what round-trips as `reason`
      state:      'upcoming',         // NOT NULL, CHECK upcoming|done|cancelled
    })
    .select(BLOCK_SELECT)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, block: toBlock(row) };
}

// ── unblockDate ───────────────────────────────────────────────────────────
// Accepts either block_id (UUID) or date (YYYY-MM-DD). SOFT delete (Q-B1-7).

async function unblockDate(supabase, vendorId, params) {
  const { block_id, date } = params;

  // LOCK 1 of 2 (Q-B1-5, defense in depth). `.eq('kind', BLOCK_KIND)` is not
  // decoration — it is the type guard that used to be the TABLE itself. Before
  // convergence, vendor_availability held blocks and only blocks, so a delete
  // there could not possibly touch a booking. public.events holds bookings AND
  // blocks together, so without this the unblock door would delete a vendor's
  // real booking with a 200. The query cannot touch a non-block even if reached.
  // LOCK 2 lives in the door (api/vendor/availability.js) and returns 404 first.
  let query = supabase
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('vendor_id', vendorId)
    .eq('kind', BLOCK_KIND)
    .is('deleted_at', null);

  if (block_id) {
    query = query.eq('id', block_id);
  } else if (date) {
    if (!DATE_RE.test(date)) return { ok: false, error: 'date must be in YYYY-MM-DD format.' };
    query = query.eq('event_date', date);
  } else {
    return { ok: false, error: 'Provide block_id or date.' };
  }

  const { error, count } = await query.select('id', { count: 'exact' });
  if (error) return { ok: false, error: error.message };
  if (count === 0) return { ok: false, error: 'Block not found.' };
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
