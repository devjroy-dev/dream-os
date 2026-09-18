'use strict';
// src/lib/vendor/bookedFacts.js — THE BOOKED-CLIENT FACT. CE-44 · LC-2 · packet 4a · seam 1.
//
// ═══════════════════════════════════════════════════════════════════════════
// WHY A DOOR-BUILT FACT AND NOT A READ IN THE ARMS  (c-43.20, chair-owned)
// ═══════════════════════════════════════════════════════════════════════════
// V12 refuses a write that would leave a binder at a booked stage with no lead
// behind it. The chair first placed that refusal on a fact the engine cannot
// see: `src/engine/src/core/db.ts:13-15` binds the engine's Supabase client to
// `db: { schema: 'engine' }`, so `public.leads` is not merely unread in the arms,
// it is UNREACHABLE. The tree says so twice in its own words, at `loop.ts:168`
// and `recordPrimitives.ts:723`. R-VS.2 refuses a second client, so the cure is
// the seam the estate already built for exactly this shape: the door reads the
// plane only the door can reach, and hands the answer down.
//
// ONE CURE, BOTH LANES (C-43.1). This module is built at the web thread's door
// (`src/api/vendor-engine/chat.js`) and at the vendor lane's door
// (`src/lib/vendorInbound.js`), one seam each, beside `moneyFacts`. There is no
// per-lane cure anywhere, so the web thread gets the same refusal as the handset.
//
// ═══════════════════════════════════════════════════════════════════════════
// IT RETURNS TWO THINGS, AND THEY TRAVEL DIFFERENTLY
// ═══════════════════════════════════════════════════════════════════════════
//   `binderIds`  the set the ARMS refuse on. Structured, never prose. It rides
//                the chain `vendorWords` rides (loop.ts -> runDonnaTurn ->
//                executeRecordTool) and reaches `donna_client` and `donna_stage`
//                as data. A gate reads a row, never a display string (CE-215).
//   `block`      the opaque string the PROMPT carries, in `moneyFacts.js`'s own
//                shape. FACTS ONLY (chair, CE-44): it states what stands on the
//                vendor's books and carries no sentence telling Victor what to do.
//                No uuid enters it — the plain clause's rule, and F-04.66's.
//
// ═══════════════════════════════════════════════════════════════════════════
// FAIL-SAFE, NOT FAIL-CLOSED — AND THAT IS THE OPPOSITE OF ITS SIBLING
// ═══════════════════════════════════════════════════════════════════════════
// `moneyFacts` fails CLOSED, because a Victor without it answers about money from
// an empty plane and that is its disease. This one fails SAFE: a failed read
// returns null, the caller passes `undefined`, and the engine is byte-identical
// to the pre-cure world (the regression law, as the read-first ruled it). The
// direction is deliberate. An unreadable lead table must not turn V12 into a
// refusal of writes that are perfectly lawful; the expensive failure here is a
// wrongly refused hand, not a missing one. NEVER THROWS.

const { readBookedBinderIds } = require('./bookedLeads');

// ── THE FRAME ────────────────────────────────────────────────────────────────
// Plain register, no bracketed label and no house vocabulary — F-06.52's class
// and CE-78's cure, both named in `moneyFacts.js`'s own frame comment. "Binder"
// and "cabinet" are the estate's words, not the vendor's; the vendor's word for
// this is a client, so that is the word the block uses.
const HEADER = 'Your booked clients, read this turn.';

// The closing line is a FACT about the list, not an instruction about the list.
// The chair's condition on this block, verbatim: facts only, no sentence that
// tells Victor what to do. So it says what a name's absence MEANS and stops.
const CLOSER = 'A client not named here has no booked lead behind them yet.';

const NONE = 'No lead of yours is booked yet, so no client stands on your books.';

// ── THE BOUND (chair, CE-44) ────────────────────────────────────────────────
// A list that is cut short makes the closing line false, so above this many the
// block falls to a count and the closing line is DROPPED, because a count names
// nobody and "not named here" would then point at nothing. The same rule fires
// for the same reason when the read returns fewer usable names than binder ids
// (a booked lead whose name cell is blank): the list cannot be complete, so it
// is not offered as one.
const NAME_LIMIT = 30;

/**
 * buildBookedFacts(supabase, vendorId)
 *   -> { ok: true, binderIds: string[], names: string[], block: string }
 *   -> null on any failed read (the caller passes `undefined`)
 *
 * `supabase` is the door's PUBLIC client. The predicate keeps its one home in
 * `bookedLeads.js` (F13(a)); this module adds no second definition of "booked".
 */
async function buildBookedFacts(supabase, vendorId) {
  let read;
  try {
    read = await readBookedBinderIds(supabase, vendorId);
  } catch (e) {
    console.warn('[booked:fact] read threw:', e && e.message);
    return null;
  }
  if (!read || !read.ok) {
    console.warn('[booked:fact] read failed:', (read && read.error) || 'unknown');
    return null;
  }

  const binderIds = Array.from(read.ids || []);
  const names = Array.from(read.names || []);

  if (!binderIds.length) {
    return { ok: true, binderIds, names, block: `${HEADER}\n${NONE}` };
  }

  // A NAME IS NOT AN IDENTITY (chair, CE-44): two booked leads may carry one name,
  // and both lines stand. The block INFORMS; the arm decides by id. So `names` is
  // listed as read, one line per binder-backed booked lead, and no de-duplication
  // is done here that would make the count and the lines disagree.
  const listable = names.length === binderIds.length && binderIds.length <= NAME_LIMIT;
  if (!listable) {
    const count = binderIds.length === 1
      ? 'One client stands on your books.'
      : `${binderIds.length} clients stand on your books.`;
    return { ok: true, binderIds, names, block: `${HEADER}\n${count}` };
  }

  const head = names.length === 1
    ? 'One client stands on your books:'
    : `${names.length} clients stand on your books:`;
  const lines = names.map((n) => `- ${n}`).join('\n');
  return { ok: true, binderIds, names, block: `${HEADER}\n${head}\n${lines}\n${CLOSER}` };
}

// R-VS.10(3): the frame's sentences are EXPORTED so the echo cell reads them from
// here and never retypes them. A cell carrying its own copy of the bytes it
// polices goes green after the frame changes underneath it.
const FRAME_BYTES = [HEADER, CLOSER, NONE];

module.exports = { buildBookedFacts, HEADER, CLOSER, NONE, FRAME_BYTES };
