// src/lib/coupleEventWrite.js — TDW_05 COUPLE-LANE MECHANICAL ARC, M6.
// C9(a) / R-1: THE ONE WRITER FOR THE COUPLE PLANE'S public.events ROWS.
//
// ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
// B2 gave the VENDOR plane one writer — eventWrite.js — and every floor built
// since sits on that fact: the checker, occupancy, the verdicts, the refusals.
// The couple plane had SEVEN write sites and no home. eventWrite's own comment
// said so out loud (:33-39, "OUT OF SCOPE (different owner): brideEngine ...
// api/couple/events.js — bride/couple XOR"), which is an honest declaration of a
// gap and not a cure for it.
//
// ── WHY NOT eventWrite ITSELF (§0.2 report, CE-ruled shape (a)) ─────────────
// The M5 seal's wording said "route through eventWrite". The code refuses:
// writeEvent destructures vendorId and HARD-GATES on it at eventWrite.js:462
// (`if (!vendorId) return { ok: false, error: 'vendorId is required.' }`); its
// helpers take vendorId by signature (findExistingEvent, findExistingBlock);
// vendor_id appears 9× against couple_id 1× across 804 lines. A bride write
// cannot pass the front door of the vendor home. The chair's own earlier F6
// ruling had said "the ONE-HOME WRITER ... occupancy DEFERRED-NAMED in THE NEW
// HOME'S header" — a new home, never eventWrite — and the code says that ruling
// was the right one. Reported, ruled, built here.
//
// ── THE LAW THIS HOME CARRIES, AND ITS EXACT EDGE ──────────────────────────
// SOLE **WRITER**, never sole reader. Inserts, updates and deletes of couple
// public.events rows come through here. READS DO NOT — `brideEngine`'s
// execListEvents select and `api/couple/events.js`'s list select stay exactly
// where they live, because the vendor plane's law is sole-WRITER too and
// widening by analogy is how a law grows a clause nobody ruled. Stated here so
// the next reader cannot widen it by accident.
//
// ── OCCUPANCY: DEFERRED-NAMED, NOT FORGOTTEN ───────────────────────────────
// The vendor home enforces capacity, date blocks, appointment overlap and
// cluster verdicts. NONE of it is ported and none of it is implied: those are
// vendor-SUPPLY semantics — a bride has no slot capacity and cannot double-book
// herself. Porting them would be inventing couple-side semantics no ruling
// exists for. What this home buys is that the DAY such a floor is ruled, it has
// one seam to sit on instead of seven.
'use strict';

// Mirrors eventWrite.js:462's own gate, deliberately and by citation: the vendor
// home refuses a write with no vendorId, so the couple home refuses a write with
// no coupleId. A writer whose ownership check is optional is not a writer, it is
// a suggestion.
function requireCouple(coupleId) {
  if (!coupleId) return { data: null, error: { message: 'coupleId is required.' } };
  return null;
}

// Each function returns the supabase `{ data, error }` shape VERBATIM — the same
// object the inline chains returned — so every call site keeps its own error
// handling byte-identical and the consolidation is a move, not a rewrite. That is
// the pure-move discipline (F-04.105's ratified proof form) applied to a writer.
async function insertCoupleEvent(supabase, { coupleId, row, select }) {
  const gate = requireCouple(coupleId);
  if (gate) return gate;
  return supabase.from('events').insert({ ...row, couple_id: coupleId }).select(select).single();
}

async function updateCoupleEvent(supabase, { coupleId, eventId, updates, select }) {
  const gate = requireCouple(coupleId);
  if (gate) return gate;
  // couple_id is re-asserted on the WHERE, never taken on trust from the caller:
  // an update keyed on id alone would let one couple edit another's row.
  return supabase.from('events').update(updates)
    .eq('id', eventId).eq('couple_id', coupleId).select(select).single();
}

async function deleteCoupleEvent(supabase, { coupleId, eventId, select }) {
  const gate = requireCouple(coupleId);
  if (gate) return gate;
  return supabase.from('events').delete()
    .eq('id', eventId).eq('couple_id', coupleId).select(select).single();
}

module.exports = { insertCoupleEvent, updateCoupleEvent, deleteCoupleEvent };
