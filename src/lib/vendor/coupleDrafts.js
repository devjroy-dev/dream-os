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

// ══ TDW_06/07 · M2 — THE CONTENT SEND'S OWN STAMP ══════════════════════════
//
// A draft whose bytes rode `tdw_enquiry_reply_couple` to her handset. `sent` is
// a TERMINAL: `resolved_at` is stamped, the row is spent, and it can never be
// re-sent. That is the whole difference from `markDoorbell`, which deliberately
// leaves the row `approved` because the doorbell carried no words and something
// still has to be delivered.
//
// R-29.35's PRINCIPLE, RUNNING ITS OTHER DIRECTION (CE ruling, Fork 3 (c)
// refused). "A byte never promises a state the machine does not hold" kept the
// doorbell's draft alive because ④b-v2 promised a delivery. Here ③ says the
// delivery HAPPENED. Leaving the row `approved` so the routing pin could find it
// would make a spent draft re-sendable — the same law, the opposite conclusion.
//
// `refusal_reason` CARRIES `content:<wamid>` and is not a refusal at all. The
// column is the register's typed WHY for a terminal transition (0118 declines a
// CHECK for exactly this reason: "a CHECK here would make the database the place
// a new honest reason goes to die"), and `content:` is the marker
// `recentContentSendFor` keys on. The wamid rides so the register knows WHICH
// send, at zero cost.
async function markContentSent(supabase, draftId, wamid) {
  const cur = await getById(supabase, draftId);
  if (!cur.draft) return { ok: false, reason: cur.reason };
  if (cur.draft.state !== STATES.APPROVED) return { ok: false, reason: `not_approved: ${cur.draft.state}` };
  return transition(supabase, draftId, STATES.SENT, {
    twilio_sid: wamid || null,
    refusal_reason: `content:${wamid || 'nosid'}`,
  });
}

/**
 * ══ TDW_06/07 · M2's ROUTING PIN — F-06.177's QUESTION, ASKED FOR A NEW LIMB ══
 *
 * IS A CONTENT SEND STANDING FOR THIS PHONE? The sibling of
 * `standingDoorbellFor`, and it exists because that function CANNOT answer for
 * a content send and must not be widened to try (CE ruling, Fork 3 (a) over (b)).
 *
 * WHY NOT WIDEN. `standingDoorbellFor`'s clauses are `state='approved'` AND
 * `resolved_at IS NULL` AND `refusal_reason LIKE 'doorbell:%'`. A content-sent
 * row is `sent` with `resolved_at` stamped, so it fails two of the three — and
 * that function's own header rules that ONLY doorbell-marked rows may answer,
 * precisely so the estate never routes a bride on the strength of its own UNSENT
 * mail. Dropping the state clause to admit this row would reopen exactly that.
 *
 * WHAT WOULD HAVE HAPPENED WITHOUT IT. She receives his words inside Meta's
 * envelope, taps 「 Reply 」, and lands in a router that finds no standing
 * doorbell — so on a phone holding threads with three vendors she is asked which
 * one she means. That is walk eight's defect on a brand-new limb, and the bride
 * is the one person in this arc who did not sign up for it.
 *
 * ── THE BOUND, DERIVED ────────────────────────────────────────────────────
 * 24 HOURS from `resolved_at`, and three independent facts agree on that number:
 *   · the WhatsApp customer-service window her reply opens is 24h — the pin
 *     exists to serve exactly the reply that rides that window;
 *   · `expires_at`'s founder-ruled span is 24h (0117), so no relay object in
 *     this store outlives a day;
 *   · the doorbell pin it mirrors is bounded by that same expiry.
 * A reply arriving later is a NEW conversation, not an answer to this send, and
 * the ordinary routing ladder is the right authority for it.
 *
 * NEVER THROWS. No row, or a failed query, is "no content send" — the router
 * then behaves exactly as it does today. A false absence costs the
 * disambiguation question that already exists; a false presence would misdeliver
 * her words.
 *
 * @returns {Promise<{draft: object|null, reason: string}>}
 */
const CONTENT_PIN_WINDOW_MS = 24 * 60 * 60 * 1000;

async function recentContentSendFor(supabase, couplePhone, nowMs = Date.now()) {
  if (!supabase || !couplePhone) return { draft: null, reason: 'no_supabase_or_phone' };
  try {
    const since = new Date(nowMs - CONTENT_PIN_WINDOW_MS).toISOString();
    const { data, error } = await supabase
      .from(TABLE).select(COLS)
      .eq('couple_phone', couplePhone)
      .eq('state', STATES.SENT)
      .like('refusal_reason', 'content:%')
      .gte('resolved_at', since)
      .order('resolved_at', { ascending: false }).limit(1).maybeSingle();
    if (error) return { draft: null, reason: 'content_query_failed' };
    if (!data) return { draft: null, reason: 'no_content_send' };
    if (!data.vendor_id) return { draft: null, reason: 'content_send_without_vendor' };
    return { draft: data, reason: 'content_standing' };
  } catch (err) {
    return { draft: null, reason: `content_check_threw:${err && err.message}` };
  }
}

/**
 * ══ TDW_06/07 · M3's READER — THE DOORBELLS THE CLOCK HAS OUTRUN ═══════════
 *
 * Every draft sitting in the EXACT state №16 speaks for: the vendor approved
 * bytes, the estate rang her doorbell, and her 24 hours ran out in silence.
 *
 * THE FOUR CLAUSES ARE THE RULED STATE, EACH LOAD-BEARING:
 *   `state = 'approved'`          — R-29.35 kept the row alive for delivery;
 *                                    a `sent`/`refused`/`expired` row is spent
 *   `resolved_at IS NULL`         — the open predicate, 0117's own
 *   `refusal_reason LIKE 'doorbell:%'` — the estate ACTUALLY RANG HER. A merely
 *                                    approved draft means he authorised bytes
 *                                    that never went out: she was never
 *                                    notified, so nothing failed to be answered
 *   `expires_at < now`            — the clock, not a guess
 *
 * THE FIXTURE-ABSENT FAMILY FALLS OUT OF THESE BY CONSTRUCTION rather than by a
 * list this reader has to remember: a SUPERSEDED draft is `expired` with
 * `refusal_reason='superseded'`; a CANCELLED one is `refused`; a REPLIED-TO one
 * was auto-sent and is `sent`; a CONTENT-SENT one is `sent` with `content:`.
 * Not one of them can satisfy clause 1, and the `doorbell:` clause independently
 * excludes every draft that was never rung.
 *
 * `now` IS A PARAMETER so the sweep and its cells share one clock and neither
 * has to sleep.
 *
 * @returns {Promise<{rows: object[], reason: string}>}
 */
// ── WHY THIS PREFIX IS A CONSTANT HERE AND A LITERAL IN `standingDoorbellFor` ─
// It should be one home and it deliberately is not, and the reason is named so
// nobody "tidies" it: `scripts/b06_bride_arrival_bench.js` §A1.12 is a SEALED
// both-ways cell whose PRODUCTION MUTATION keys on the exact `.like(...)` call
// inside `standingDoorbellFor`, and `String.replace` with a string pattern
// defaces only the FIRST occurrence in the file. This function sits ABOVE that
// one, so an identical call here would silently absorb the mutation and leave
// the cell green over an undefaced guard — a both-ways proof quietly reduced to
// a one-way one. The constant keeps this reader's intent legible AND keeps the
// sealed anchor unique.
//
// **AND THIS COMMENT DOES NOT SPELL THE ANCHOR OUT, WHICH IS F-06.192's WHOLE
// POINT (proposed).** An earlier draft explained the collision by quoting the
// byte sequence — and the prose then absorbed the mutation itself, exactly as
// the code had. The estate already holds "strip comment lines before asserting
// about code" for ASSERTIONS; §A1.12 proves the same law binds MUTATIONS, and
// nobody had said so. Until `underMutation` strips comments, a comment that
// quotes an anchor is a cell quietly disarmed by prose.
const DOORBELL_REASON_PREFIX = 'doorbell:';

async function doorbellExpiredUnanswered(supabase, nowMs = Date.now(), limit = 50) {
  if (!supabase) return { rows: [], reason: 'no_supabase' };
  try {
    const { data, error } = await supabase
      .from(TABLE).select(COLS)
      .eq('state', STATES.APPROVED)
      .is('resolved_at', null)
      .like('refusal_reason', `${DOORBELL_REASON_PREFIX}%`)
      .lt('expires_at', new Date(nowMs).toISOString())
      .order('expires_at', { ascending: true }).limit(limit);
    if (error) return { rows: [], reason: 'sweep_query_failed' };
    return { rows: data || [], reason: 'ok' };
  } catch (err) {
    return { rows: [], reason: `sweep_threw:${err && err.message}` };
  }
}

/**
 * M3's TERMINAL. Stamps `expired` and records WHICH arm took it.
 *
 * `expired_no_reply:<sid>` — the ruled byte; №16 speaks for this row.
 * `expired_after_reply:<sid>` — DERIVED SIBLING, DECLARED: she DID write after
 *   the doorbell but the auto-send never carried the draft, so the row is
 *   genuinely expired and genuinely NOT a case №16 may narrate. It is stamped
 *   with the same act and stays silent. Without this arm the sweep would either
 *   leave a stale `approved` row forever or tell a vendor she ignored him when
 *   she did not.
 *
 * IDEMPOTENCE IS THIS FUNCTION, not a flag. The row leaves `approved`, so the
 * sweep's own reader cannot see it again and a re-run speaks zero.
 */
async function markSweptExpired(supabase, draftId, reason) {
  return transition(supabase, draftId, STATES.EXPIRED, {
    refusal_reason: reason ? String(reason).slice(0, 200) : 'expired_no_reply',
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

// ── THE BRIDE'S ARRIVAL · THE PHONE-KEYED READERS (F-06.177 / F-06.178) ──────
//
// WHY THESE EXIST AND WHY THEY ARE NOT `approvedFor` WITH A DIFFERENT ARGUMENT.
// `approvedFor` keys on `vendor_id` because its caller is the VENDOR'S OWN TURN
// and the vendor is already known. The bride's arrival has the opposite shape:
// the estate holds her MSISDN and nothing else, and the whole of F-06.177 is
// that the router asked HER the question the store could already answer. So the
// question has to be askable in her direction.
//
// THE INDEX IS ALREADY THERE AND WAS BUILT FOR THIS. `db/migrations/0117_pending
// _couple_drafts.sql` creates `idx_pending_couple_drafts_phone_open ON
// (couple_phone, created_at DESC) WHERE (resolved_at IS NULL)`, and its own
// in-migration comment states the purpose verbatim: "the pair lookup: is there
// an open draft for this bride?". Both readers below filter `resolved_at IS
// NULL`, so both ride that partial index rather than adding a scan.
//
// FORMAT CONTRACT, DECLARED (F-06.154): matching is EXACT EQUALITY on
// `couple_phone`, unnormalized, exactly as `coupleWindowOpen` matches
// `counterparty_phone`. Both sides of this comparison are +E164 on the live
// path — the door writes `couple_phone` from `resolveRecipient`'s stored value
// and `metaInputsFrom` (src/lib/vendorInbound.js, symbol `metaInputsFrom`)
// normalizes every Meta inbound to a leading `+` before the router sees it. A
// bare-format row would therefore be a MISS, and that miss is asserted by a
// cell rather than discovered in production.

/**
 * IS A DOORBELL STANDING FOR THIS PHONE? — F-06.177's store question.
 *
 * A "standing doorbell" is a draft the estate has ALREADY rung a template for:
 * `markDoorbell` (this file) writes `refusal_reason = 'doorbell:<sid>'` and,
 * under R-29.35, deliberately leaves the row `approved` with `resolved_at` NULL
 * so the approval survives to be delivered. That row is therefore the estate's
 * own record of "we messaged this woman about this vendor and asked her to
 * reply here" — which is precisely the fact the router needs before it asks her
 * to choose between three vendors she never enumerated.
 *
 * ONLY DOORBELL-MARKED ROWS ANSWER. A merely `approved` draft means the vendor
 * authorised bytes that have NOT gone out; she has not been written to, so she
 * cannot be replying to it, and letting it steer her routing would be the
 * estate inferring an intent from its own unsent mail.
 *
 * NEVER THROWS. No row, or a failed query, is "no doorbell" — the router then
 * behaves exactly as it does today. A false absence costs the disambiguation
 * question that already exists; a false presence would misdeliver her words.
 *
 * @returns {Promise<{draft: object|null, reason: string}>}
 */
async function standingDoorbellFor(supabase, couplePhone) {
  if (!supabase || !couplePhone) return { draft: null, reason: 'no_supabase_or_phone' };
  try {
    const { data, error } = await supabase
      .from(TABLE).select(COLS)
      .eq('couple_phone', couplePhone)
      .eq('state', STATES.APPROVED)
      .is('resolved_at', null)
      .like('refusal_reason', 'doorbell:%')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) return { draft: null, reason: 'doorbell_query_failed' };
    if (!data) return { draft: null, reason: 'no_doorbell' };
    if (!data.vendor_id) return { draft: null, reason: 'doorbell_without_vendor' };
    return { draft: data, reason: 'doorbell_standing' };
  } catch (err) {
    return { draft: null, reason: `doorbell_check_threw:${err && err.message}` };
  }
}

/**
 * THE APPROVED DRAFT WAITING FOR THIS PHONE — F-06.178's store question.
 *
 * The auto-send's subject, keyed her way. Expiry is SELF-HEALED here exactly as
 * `approvedFor` heals it: a past-`expires_at` row is transitioned to `expired`
 * and reported as absent, so no caller can send bytes whose 24-hour authority
 * has run out. That transition is what makes fork 5's silence honest — the row
 * is genuinely closed before anybody composes a sentence about it.
 *
 * NOT RESTRICTED TO DOORBELL ROWS. Routing follows the doorbell; the SEND
 * follows the window (chair-ruled). Any live approved draft for her phone is
 * deliverable the moment her arrival opens the window, whether the estate rang
 * a doorbell about it or the vendor approved it while she happened to be mid
 * conversation.
 *
 * @returns {Promise<{draft: object|null, reason: string}>}
 */
async function approvedForPhone(supabase, couplePhone) {
  if (!supabase || !couplePhone) return { draft: null, reason: 'no_supabase_or_phone' };
  try {
    const { data, error } = await supabase
      .from(TABLE).select(COLS)
      .eq('couple_phone', couplePhone)
      .eq('state', STATES.APPROVED)
      .is('resolved_at', null)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (error) return { draft: null, reason: 'draft_query_failed' };
    if (!data) return { draft: null, reason: 'no_approved_draft' };
    const exp = data.expires_at ? new Date(data.expires_at).getTime() : null;
    if (exp != null && Number.isFinite(exp) && Date.now() > exp) {
      await expire(supabase, data.id);
      return { draft: null, reason: 'expired' };
    }
    return { draft: data, reason: 'approved' };
  } catch (err) {
    return { draft: null, reason: `approved_check_threw:${err && err.message}` };
  }
}

/**
 * THE VENDOR BEHIND THE MOST RECENT EXPIRY FOR THIS PHONE.
 *
 * Fork 5's other half: when her arrival finds the draft already dead, ⑥ goes to
 * the vendor and silence to her — and the vendor has to be found from the phone,
 * because that is all her arrival holds. Sited HERE rather than at the caller
 * because this file is the ONLY place in `src/` that may name this table
 * (asserted by `scripts/b06_relay_hand_bench.js` §7.3, which sweeps every `.js`
 * and `.ts` under `src/`): a reader living outside the store is a second place
 * the column list can drift from `0117`/`0118`.
 */
async function lastExpiredVendorFor(supabase, couplePhone) {
  if (!supabase || !couplePhone) return { vendorId: null, reason: 'no_supabase_or_phone' };
  try {
    const { data, error } = await supabase
      .from(TABLE).select('vendor_id')
      .eq('couple_phone', couplePhone)
      .eq('state', STATES.EXPIRED)
      .order('created_at', { ascending: false }).limit(1);
    if (error) return { vendorId: null, reason: 'expired_query_failed' };
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.vendor_id) return { vendorId: null, reason: 'no_expired_draft' };
    return { vendorId: row.vendor_id, reason: 'found' };
  } catch (err) {
    return { vendorId: null, reason: `expired_check_threw:${err && err.message}` };
  }
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
  standingDoorbellFor,
  approvedForPhone,
  lastExpiredVendorFor,
  supersedeOpenStaged,
  openStagedFor,
  approve,
  markSent,
  refuse,
  expire,
  getById,
  // TDW_06/07 THE OOW COMPLETION
  markContentSent,
  recentContentSendFor,
  doorbellExpiredUnanswered,
  markSweptExpired,
  CONTENT_PIN_WINDOW_MS,
  DOORBELL_REASON_PREFIX,
  STATES,
  TERMINAL,
  TABLE,
};
