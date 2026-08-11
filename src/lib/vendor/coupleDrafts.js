// src/lib/vendor/coupleDrafts.js
// ── TDW_06 · THE HAND · SITTING TWO — THE STORE'S ONE LIFECYCLE WRITER ───────
//
// `public.pending_couple_drafts` (db/migrations/0117_pending_couple_drafts.sql,
// live in production, founder-run 2026-08-11) has exactly one writer and it is
// this file. Nothing else in the estate may `.from('pending_couple_drafts')`
// with an insert or an update — a cell asserts that, both ways.
//
// WHY ONE WRITER, IN ONE SENTENCE: the store exists so that "the bytes I showed
// you are the bytes I sent" is provable by EQUALITY against a stored row. A
// second writer is a second `body`, and a second `body` is 2026-08-08 again with
// better paperwork.
//
// ── WHY THIS FILE IS JS AND AT THE DOOR (R-29.25, arm (a)) ───────────────────
// The engine (`src/engine`) compiles with `rootDir: "src"` scoped to
// `src/engine/src` and uses ZERO `require(` anywhere. It CANNOT reach this
// module, and the estate's standing answer to that boundary is a TWIN
// (`src/engine/src/core/draftContracts.ts:2`), which here would mean two
// lifecycle writers — the one thing this file exists to prevent. So the RULED
// shape is the estate's own signal-only pattern, six hands deep
// (`src/lib/vendor/blockHands.js`, its own §"SIGNAL-ONLY" header;
// `donna_invoice_pdf` in `src/engine/src/core/tools/recordPrimitives.ts`): THE
// TOOL IS A SIGNAL AND THE DOOR IS THE ORGAN. The model can ask. It cannot
// write, and it cannot send.
//
// ── FIVE VERBS FOR A FIVE-STATE REGISTER (disclosed) ─────────────────────────
// The charter named four — stage · approve · markSent · refuse. 0117's CHECK
// constrains FIVE states, and `expired` had no writer under the four. `expire`
// is the fifth verb and it exists because EXPIRY IS ENFORCED AT READ: the read
// that discovers a stale draft is the act that records it, so a draft past
// `expires_at` cannot be approved, cannot be sent, and does not sit `staged`
// forever pretending it could be.
//
// ── EVERY TERMINAL TRANSITION STAMPS `resolved_at` ───────────────────────────
// `sent`, `refused` and `expired` are terminals. `staged` and `approved` are
// not, and `approved`-without-`resolved_at` is DELIBERATE (0117's own DDL
// comment): a crash between the vendor's affirmative and the transport's
// acknowledgement must be VISIBLE as approved-and-stale, never invisible.
//
// ── `refusal_reason` (0118, R-29.20) ─────────────────────────────────────────
// `coupleWindowOpen` speaks TYPED reasons and `sendWhatsApp` returns TYPED
// `blocked` sentinels. Under a deed-line-only design every one of them would die
// at the door — F-06.143's silence one table over, knowingly shipped. The column
// is where the WHY lives; the vendor gets the true fact and the register gets
// the reason.

'use strict';

const TABLE = 'pending_couple_drafts';

// The register, mirrored from 0117's CHECK. Kept here so a caller cannot invent
// a state the database would reject at 3am — the constraint is the law, this is
// the law read aloud where the writer can see it.
const STATES = Object.freeze({
  STAGED: 'staged',
  APPROVED: 'approved',
  SENT: 'sent',
  REFUSED: 'refused',
  EXPIRED: 'expired',
});

// The terminals — the states that stamp `resolved_at`.
const TERMINAL = Object.freeze([STATES.SENT, STATES.REFUSED, STATES.EXPIRED]);

// The columns a reader needs. Witnessed against 0117's CREATE TABLE (ten columns)
// plus 0118's `refusal_reason`. Named explicitly rather than `select('*')` so a
// column that disappears fails loudly here instead of undefined-ing downstream.
const COLS = 'id, vendor_id, conversation_id, couple_phone, body, state, twilio_sid, created_at, resolved_at, expires_at, refusal_reason';

function nowIso() { return new Date().toISOString(); }

/**
 * STAGE — the draft is written before anything is shown, so the SHOW renders
 * from the stored row and never from a variable the model handed us.
 *
 * `conversationId` is nullable BY DESIGN (0117): a draft may be staged before
 * the couple_thread exists, which is the same find-or-create order
 * `relayToCouple` handles at send time.
 *
 * @returns {Promise<{ok: boolean, draft?: object, reason?: string}>}
 */
async function stage(supabase, { vendorId, conversationId = null, couplePhone, body }) {
  if (!supabase) return { ok: false, reason: 'no_supabase' };
  if (!vendorId) return { ok: false, reason: 'no_vendor' };
  if (!couplePhone) return { ok: false, reason: 'no_couple_phone' };
  const text = typeof body === 'string' ? body.trim() : '';
  if (!text) return { ok: false, reason: 'empty_body' };

  // ── SUPERSEDE-ON-STAGE (R-29.28, F-06.160's cure) ─────────────────────────
  // Every PRIOR OPEN STAGED row for this vendor is closed before the new one is
  // written, its successor NAMED in the reason. F-06.160's specimen: the founder's
  // affirmative was lost to F-06.158 and a second draft staged beside the first,
  // leaving two open rows for one vendor.
  //
  // 'staged' ONLY, and the boundary is the whole care: an `approved` row IS THE
  // VENDOR'S OWN WORD, already given, possibly mid-send. No stage call may touch
  // it. A cell holds that line in both directions.
  //
  // Ordered BEFORE the insert deliberately — a supersede that ran after would
  // need the new row's id to name it and would leave a window in which two rows
  // were open. `openStagedFor` still takes the newest; after this cure the newest
  // is also the only one open.
  await supersedeOpenStaged(supabase, vendorId);

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      vendor_id: vendorId,
      conversation_id: conversationId,
      couple_phone: couplePhone,
      body: text,
      state: STATES.STAGED,
    })
    .select(COLS)
    .single();

  // The insert is READ BACK (`.select().single()`), not fired and forgotten.
  // F-06.143's second limb is a blind UPDATE that could not tell it had matched
  // nothing; this store's first act refuses to inherit that.
  if (error || !data) return { ok: false, reason: `stage_failed: ${(error && error.message) || 'no row'}` };
  await nameSuccessor(supabase, vendorId, data.id);
  return { ok: true, draft: data };
}

// Close every open STAGED row for this vendor. Never touches `approved`, `sent`,
// `refused` or `expired` — the state filter is the guard, not a convention.
async function supersedeOpenStaged(supabase, vendorId) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ state: STATES.EXPIRED, resolved_at: nowIso(), refusal_reason: 'superseded' })
      .eq('vendor_id', vendorId)
      .eq('state', STATES.STAGED)
      .is('resolved_at', null)
      .select('id');
    if (error) { console.warn('[coupleDrafts] supersede failed:', error.message); return []; }
    return (data || []).map((r) => r.id);
  } catch (e) { console.warn('[coupleDrafts] supersede threw:', e && e.message); return []; }
}

// The successor's id, written onto the rows this stage displaced. Separate from
// the sweep above because the successor does not exist until the insert returns —
// and a reason that names no successor is a worse audit row than one written a
// moment later. Best-effort: the supersede itself has already landed.
async function nameSuccessor(supabase, vendorId, newId) {
  try {
    await supabase
      .from(TABLE)
      .update({ refusal_reason: `superseded:${newId}` })
      .eq('vendor_id', vendorId)
      .eq('refusal_reason', 'superseded');
  } catch (e) { console.warn('[coupleDrafts] successor naming failed:', e && e.message); }
}

/**
 * THE OPEN STAGED DRAFT for this vendor — the one the door showed him.
 *
 * EXPIRY IS ENFORCED HERE, AT READ. A staged row past `expires_at` is not
 * returned as a draft; it is EXPIRED as a side effect of being read and comes
 * back under `expired` so the caller can speak the honest sentence. There is
 * deliberately no path by which a stale row is merely filtered out and left
 * sitting `staged` — a row nobody resolved is a row that will surprise someone.
 *
 * Ordering + predicate mirror `idx_pending_couple_drafts_vendor_open`
 * (vendor_id, created_at DESC) WHERE resolved_at IS NULL.
 *
 * @returns {Promise<{draft: object|null, expired: object|null, reason: string}>}
 */
async function openStagedFor(supabase, vendorId) {
  if (!supabase || !vendorId) return { draft: null, expired: null, reason: 'no_supabase_or_vendor' };

  const { data, error } = await supabase
    .from(TABLE)
    .select(COLS)
    .eq('vendor_id', vendorId)
    .eq('state', STATES.STAGED)
    .is('resolved_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { draft: null, expired: null, reason: 'draft_query_failed' };
  if (!data) return { draft: null, expired: null, reason: 'no_open_draft' };

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : null;
  if (expiresAt != null && Number.isFinite(expiresAt) && Date.now() > expiresAt) {
    const done = await expire(supabase, data.id);
    return { draft: null, expired: done.draft || data, reason: 'expired' };
  }
  return { draft: data, expired: null, reason: 'open' };
}

// The one transition primitive. Every named verb below routes through it, so
// `resolved_at`'s stamping rule has exactly one implementation and a terminal
// cannot be added later that forgets to stamp.
async function transition(supabase, draftId, state, patch = {}) {
  if (!supabase || !draftId) return { ok: false, reason: 'no_supabase_or_draft' };
  if (!Object.values(STATES).includes(state)) return { ok: false, reason: `off_register_state: ${state}` };

  const row = { state, ...patch };
  if (TERMINAL.includes(state)) row.resolved_at = nowIso();

  const { data, error } = await supabase
    .from(TABLE)
    .update(row)
    .eq('id', draftId)
    .select(COLS)
    .single();

  // Read back, always. An UPDATE that matched zero rows is the F-06.143 class and
  // it is not detectable without the returning row — this writer never runs blind.
  if (error || !data) return { ok: false, reason: `transition_failed: ${(error && error.message) || 'no row matched'}` };
  return { ok: true, draft: data };
}

/**
 * APPROVE — staged -> approved. The ONLY door into the send leg.
 *
 * Guarded on the CURRENT state rather than trusting the caller: an approve
 * against an already-sent, already-refused or expired row is refused here even
 * if the caller thought otherwise. A5's "no send without an affirmative" is a
 * state fact, and a state fact is only as good as the guard on the transition.
 */
async function approve(supabase, draftId) {
  const cur = await getById(supabase, draftId);
  if (!cur.draft) return { ok: false, reason: cur.reason };
  if (cur.draft.state !== STATES.STAGED) return { ok: false, reason: `not_staged: ${cur.draft.state}` };
  if (cur.draft.resolved_at) return { ok: false, reason: 'already_resolved' };
  return transition(supabase, draftId, STATES.APPROVED);
}

/**
 * MARK SENT — approved -> sent, with the sid. Terminal.
 *
 * The sid is persisted to the DRAFT row here and to the THREAD row by
 * `relayToCouple`; both, per the charter, so F-06.143's class dies by
 * construction at this site rather than being inherited from it.
 */
async function markSent(supabase, draftId, twilioSid) {
  const cur = await getById(supabase, draftId);
  if (!cur.draft) return { ok: false, reason: cur.reason };
  if (cur.draft.state !== STATES.APPROVED) return { ok: false, reason: `not_approved: ${cur.draft.state}` };
  return transition(supabase, draftId, STATES.SENT, { twilio_sid: twilioSid || null });
}

/**
 * REFUSE — terminal, with the WHY. `reason` is the typed reason from the window
 * predicate or the transport sentinel, never a sentence — the sentence is the
 * vendor's and lives at the door.
 */
async function refuse(supabase, draftId, reason) {
  return transition(supabase, draftId, STATES.REFUSED, {
    refusal_reason: reason ? String(reason).slice(0, 200) : null,
  });
}

/** EXPIRE — terminal. Written only by the read that discovers it. */
async function expire(supabase, draftId) {
  return transition(supabase, draftId, STATES.EXPIRED, { refusal_reason: 'expired_at_read' });
}

/**
 * R-29.35 — THE DOORBELL STAMP. `approved` is NOT a terminal, so `resolved_at`
 * stays null and the row lives on: his E3 yes is held across the shut window and
 * the draft auto-sends when her reply opens it. The doorbell's own wamid is
 * recorded so the register knows which notification is standing behind it.
 *
 * THIS IS THE STATE THE BYTE PROMISES. F-06.170's principle in one write: ④b-v2
 * says a delivery is coming, so the thing that delivers must still be alive.
 */
async function markDoorbell(supabase, draftId, doorbellSid) {
  const cur = await getById(supabase, draftId);
  if (!cur.draft) return { ok: false, reason: cur.reason };
  return transition(supabase, draftId, STATES.APPROVED, {
    refusal_reason: `doorbell:${doorbellSid || 'nosid'}`,
  });
}

/**
 * The vendor's standing approval, waiting on a window. Expiry ENFORCED AT READ,
 * exactly as `openStagedFor` enforces it — a 24-hour-old approval is not a
 * licence to send tomorrow.
 */
async function approvedFor(supabase, vendorId) {
  if (!supabase || !vendorId) return { draft: null, reason: 'no_supabase_or_vendor' };
  const { data, error } = await supabase
    .from(TABLE).select(COLS)
    .eq('vendor_id', vendorId).eq('state', STATES.APPROVED).is('resolved_at', null)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) return { draft: null, reason: 'draft_query_failed' };
  if (!data) return { draft: null, reason: 'no_approved_draft' };
  const exp = data.expires_at ? new Date(data.expires_at).getTime() : null;
  if (exp != null && Number.isFinite(exp) && Date.now() > exp) {
    await expire(supabase, data.id);
    return { draft: null, reason: 'expired' };
  }
  return { draft: data, reason: 'approved' };
}

async function getById(supabase, draftId) {
  if (!supabase || !draftId) return { draft: null, reason: 'no_supabase_or_draft' };
  const { data, error } = await supabase.from(TABLE).select(COLS).eq('id', draftId).maybeSingle();
  if (error) return { draft: null, reason: 'draft_query_failed' };
  if (!data) return { draft: null, reason: 'no_such_draft' };
  return { draft: data, reason: 'found' };
}

module.exports = {
  stage,
  markDoorbell,
  approvedFor,
  supersedeOpenStaged,
  openStagedFor,
  approve,
  markSent,
  refuse,
  expire,
  getById,
  STATES,
  TERMINAL,
  TABLE,
};
