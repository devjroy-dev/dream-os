'use strict';
// src/lib/vendor/bookingEvent.js
//
// TDW · CE-43 · LC-1 · F-43.1(a) · THE BOOKING EVENT SEAM, ONE HOME.
//
// THE DISEASE. A binder's stage and date live in engine.records and the Events
// page reads public.events only (src/api/vendor/events.js, the GET /:vendorId
// handler). A booking filed through Victor never became a calendar row unless the
// model ALSO fired donna_book_event. Dholakia (binder e6aacb34, 21 September 2026,
// stage "confirmed booking") is the specimen.
//
// WHY HERE AND NOT INSIDE writeFields (F-43.22, ruled F1(c)). The engine's client is
// bound to schema 'engine' (src/engine/src/core/db.ts) and cannot reach
// public.events; eventWrite takes an injected PUBLIC client. A second client inside
// the engine is the class R-VS.2 refused. So the seam is a post-turn door action,
// like blockHands.js, called from THREE sites:
//   src/api/vendor-engine/chat.js      SSE route, after lockstepBinderToEvent
//   src/api/vendor-engine/chat.js      JSON route, after lockstepBinderToEvent
//   src/lib/vendor/calendarSignals.js  applyCalendarSignals (the WhatsApp lane)
// chat.js does not load calendarSignals (F-43.17), which is why chat.js calls this
// file directly rather than inheriting it.
//
// THE RULES (CE-43 ruling on LC-1's read-first):
//   · booking stage = /(book|confirm)/i AND NOT /(unbook|cancel|lost)/i. The six-word
//     cabinet set (cabinet.js, today.js) is untouched; LC-2 replaces both.
//   · the binder must be live (hidden = false), carry a date and a client name.
//   · F9(a): skip when ANY live event (not cancelled, not deleted) is already linked.
//   · F6(a): kind = 'ceremony', fixed. It is in OCCUPYING_KINDS, so the existing
//     binder->event lockstep on both lanes drags the row when the date moves (F5(a)).
//   · the title is founder-vetoed (YES, 2026-09-16): `<client> · wedding`.
//   · F-43.19: the row carries vendor_id and linked_binder_id only; events_owner_xor
//     forbids couple_id on a vendor row.
//   · F8(a): a CONFLICT refusal is returned so the door speaks conflict.message
//     through its existing conflictLines. A non-conflict error is logged, not spoken.
//   · every write goes through writeEvent, the one writer. Its own dedupe applies: an
//     UNLINKED live event on the same date whose title starts with the client's name
//     is taken as this booking and patched (title, kind, link). That is writeEvent's
//     rule for every booking door, named here so nobody is surprised by it.
//
// FAIL-CLOSED: a read that errors writes nothing for that pass.

const { writeEvent } = require('./eventWrite');
const { readBookedBinderIds } = require('./bookedLeads');

const BOOKING_STAGE_RE     = /(book|confirm)/i;
const NOT_BOOKING_STAGE_RE = /(unbook|cancel|lost)/i;
const BOOKING_EVENT_KIND   = 'ceremony';
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function isBookingStage(stage) {
  const s = String(stage == null ? '' : stage);
  return BOOKING_STAGE_RE.test(s) && !NOT_BOOKING_STAGE_RE.test(s);
}

// Founder-vetoed bytes (CE-43 veto, YES 2026-09-16). Client name, middle dot, "wedding".
function bookingEventTitle(client) {
  return `${String(client).trim()} · wedding`;
}

// CE-43 · LC-2 · packet 3 · F13(a): the predicate is "has a booked lead" PLUS the legacy
// stage test. `bookedIds` is the set src/lib/vendor/bookedLeads.js reads; absent, only the
// legacy test applies (the shape every caller had before packet 3).
function qualifies(row, bookedIds) {
  return !!row
    && row.hidden !== true
    && typeof row.date === 'string' && row.date.trim() !== ''
    && typeof row.client === 'string' && row.client.trim().length >= 2
    && ((bookedIds && bookedIds.has(row.id)) || isBookingStage(row.stage));
}

// Binder ids a turn's successful hands touched. Inputs name existing binders;
// results name the ones a hand opened (writeFields' "Record <id> created" and
// donna_split's "new record <id> opened"). An ERROR result contributes nothing.
function touchedBinderIds(result) {
  const ids = new Set();
  const take = (v) => { const m = typeof v === 'string' ? v.match(UUID_RE) : null; if (m) ids.add(m[0].toLowerCase()); };
  const collect = (call) => {
    if (!call || typeof call.name !== 'string' || !call.name.startsWith('donna_')) return;
    const r = typeof call.result === 'string' ? call.result : '';
    if (r.startsWith('ERROR')) return;
    const input = call.input || {};
    take(input.binder_id); take(input.survivor_id); take(input.source_id);
    const created = r.match(/Record ([0-9a-f-]{36}) created/i);
    if (created) take(created[1]);
    const opened = r.match(/new record ([0-9a-f-]{36}) opened/i);
    if (opened) take(opened[1]);
  };
  for (const tc of ((result && result.tool_calls) || [])) {
    collect(tc);
    for (const dc of (tc.donna_calls || [])) collect(dc);
  }
  return [...ids];
}

// The shared core. `binderIds` null = every live dated binder on the agent (the
// back-fill); an array = only those binders (the post-turn seam).
async function ensureForBinders(supabase, vendor, agentId, binderIds, { surface = 'pwa', source = 'victor', dryRun = false } = {}) {
  const out = { created: [], skipped: [], refused: [], errors: [] };
  if (!supabase || !vendor || !vendor.id || !agentId) return out;
  if (Array.isArray(binderIds) && !binderIds.length) return out;

  let q = supabase.schema('engine').from('records')
    .select('id, client, date, stage, hidden')
    .eq('agent_id', agentId)
    .eq('hidden', false)
    .not('date', 'is', null);
  if (Array.isArray(binderIds)) q = q.in('id', binderIds);
  const { data: rows, error: rowsErr } = await q;
  if (rowsErr) { out.errors.push({ binder_id: null, error: `binder read failed: ${rowsErr.message}` }); return out; }

  const booked = await readBookedBinderIds(supabase, vendor.id);
  if (!booked.ok) { out.errors.push({ binder_id: null, error: `booked lead read failed: ${booked.error}` }); return out; }
  const eligible = (rows || []).filter((r) => qualifies(r, booked.ids));
  if (!eligible.length) return out;

  const { data: linked, error: linkErr } = await supabase.from('events')
    .select('id, linked_binder_id')
    .eq('vendor_id', vendor.id)
    .in('linked_binder_id', eligible.map((b) => b.id))
    .neq('state', 'cancelled')
    .is('deleted_at', null);
  if (linkErr) { out.errors.push({ binder_id: null, error: `event read failed: ${linkErr.message}` }); return out; }
  const hasLive = new Set((linked || []).map((e) => e.linked_binder_id));

  for (const b of eligible) {
    const title = bookingEventTitle(b.client);
    if (hasLive.has(b.id)) { out.skipped.push({ binder_id: b.id, title, reason: 'linked_event_exists' }); continue; }
    if (dryRun) { out.created.push({ binder_id: b.id, title, event_date: b.date, dry_run: true }); continue; }
    try {
      const r = await writeEvent(supabase, {
        vendorId: vendor.id,
        agentId,
        surface,
        source,
        title,
        event_date: b.date,
        kind: BOOKING_EVENT_KIND,
        linked_binder_id: b.id,
        state: 'upcoming',
      });
      if (r && r.ok) {
        out.created.push({ binder_id: b.id, title, event_date: b.date, event_id: r.event && r.event.id, deduped: !!r.deduped });
      } else if (r && r.conflict) {
        out.refused.push({ title, conflict: r.conflict, error: null });
      } else {
        out.errors.push({ binder_id: b.id, error: (r && r.error) || 'write refused' });
        console.warn('[bookingEvent] write did not land:', b.id, (r && r.error) || 'refused');
      }
    } catch (e) {
      out.errors.push({ binder_id: b.id, error: e.message });
      console.warn('[bookingEvent]', b.id, e.message);
    }
  }
  return out;
}

// The post-turn seam. Returns { created, skipped, refused, errors }; callers append
// `refused` to their existing conflictLines path and speak nothing else.
async function ensureBookingEvents(supabase, vendor, agentId, result, opts = {}) {
  try {
    return await ensureForBinders(supabase, vendor, agentId, touchedBinderIds(result), opts);
  } catch (e) {
    console.warn('[bookingEvent:seam]', e.message);
    return { created: [], skipped: [], refused: [], errors: [{ binder_id: null, error: e.message }] };
  }
}

module.exports = {
  ensureBookingEvents,
  ensureForBinders,
  touchedBinderIds,
  isBookingStage,
  qualifies,
  bookingEventTitle,
  BOOKING_EVENT_KIND,
};
