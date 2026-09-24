// src/lib/vendorInbound.js — TDW_05 TRANSPORT MIGRATION M2 (vendor lane, INBOUND).
// The vendor inbound turn-core, VERBATIM-extracted from src/index.js's Twilio handler
// (lines 181-970 at base 3afc4ba) so the Twilio path AND the dormant Meta /webhook/meta
// path (vendor service) funnel into ONE shared function — they cannot diverge, which is
// how W-1 (byte-identical reply content across transports) is guaranteed. Same pattern as
// src/lib/brideInbound.js (M1b, sealed).
//
// EXTRACTION DISCIPLINE (verbatim-then-diff): the body is byte-for-byte the original EXCEPT
// the mechanical transport-decoupling:
//   - `return res.status(200).send('<Response></Response>')`  -> `return;`
//   - `return res.status(200).send('<Response/>')`            -> `return;`  (2nd TwiML variant)
//   - the final bare `res.status(200).send('<Response/>')`    -> `return;`
//   - `req.body.MediaUrl0`                                    -> `mediaUrl`   (normalized input)
//   - outer-catch: `req.body.MessageSid`->`messageSid`, `(req.body.From||'')...`->`phone`,
//                  `payload: req.body`->`payload: rawPayload`
//   - the two inline require()s (imageThrottle, vendorCalendarImage) -> injected via deps
// Every external reference is supplied via `deps` (destructured below); the 24-dep list was
// proven COMPLETE by a bare-call scan (every call site resolves to a dep or the in-core
// `levenshtein`). scripts/b05_m2_vendor_inbound_bench.js diffs this core against the original
// and REDs on any drift.
//
// INPUTS (normalized by each transport handler; content-bearing fields IDENTICAL across
// Twilio and Meta for the same logical message — the bench asserts this):
//   { phone, body, profileName, messageSid, internalReplay, trimmedBody, numMedia, hasMedia,
//     mediaUrl, rawPayload }
//
// MEDIA NOTE (M1 text-only, consistent with M1a/M1b): Meta media inbound arrives as a media-ID
// needing a Meta media fetch (a named follow-up); metaInputsFrom passes mediaUrl=null, so the
// vendor calendar-OCR / media branches are a declared Meta gap. TEXT turns funnel fully through.
'use strict';

const { matchNudgeWord, setNudgeOptout, matchGlitchWord } = require('./nudgeOptout');   // TDW_05 P4 / F-05.22 · TDW_06 F-06.130
const { matchOptOutExact, recordFullStop, recordFullStart, ACK_BYPASS } = require('./fullStop'); // F-05.25 / F-05.27 · LSP_1b (F-44.141): the whole-message matcher
const { getNudgeCopy } = require('./nudgeCopy');
const { turnKey, withTurnLock } = require('./turnLock');               // ARC M1 / F-05.41
const { onboardingGate } = require('./onboardingGate');                // ARC OB / CE-31 · the onboarding gate, dark under R-OB.9
const { scrubText, witnessWireScrub } = require('./vendor/scrub');    // BLOCK 06 M-3 / F-06.29 — the firewall reaches this lane · M-4 / F-06.36 — and now it leaves a witness

// ── BLOCK 06 M-0 · F-05.60 CURED (A1, founder-ruled 「 a1 」) ──────────────────
// THE LINE THIS REPLACES: `inboundMessage: firstWord.startsWith('TDW-') ? 'hi' : body`.
// A TDW-prefixed message was SUBSTITUTED with the literal 'hi' before the couple
// agent, both ping writers, the vendor notification and the intent extractor saw
// it — so a bride asking a substantive question was recorded, notified and
// summarised as having said hello. Seven consumers, one falsified input.
//
// A1 IS NOT "STOP SUBSTITUTING". The substitution was answering a real question:
// a first contact is often the bare routing token alone, and handing the agent
// `TDW-DROY550` asks it to answer a code. A1 separates the two cases the old
// line could not tell apart — strip the ROUTING TOKEN, keep the SENTENCE, and
// fall back to a greeting only when stripping leaves nothing at all.
//
// THE CASE TRAP, AND WHY THIS SLICES BY LENGTH (A-case, chair-binding).
// `firstWord` at the call site is UPPERCASED (`body.trim().split(/\s+/)[0]
// .toUpperCase()`), which is why the disease fires on `tdw-droy550` as readily
// as on `TDW-DROY550`. Any cure that removed the token by matching `firstWord`
// against the raw body would therefore MISS every lowercase and mixed-case
// send — curing the loud half and leaving the quiet half alive. This function
// never looks at the uppercased value: it re-splits the RAW text and removes
// the first token BY ITS OWN LENGTH, so case is irrelevant by construction.
//
// SITED FOR THE BRANCH THAT KNOWS. Called only where the first token has already
// matched a `routing_handle` — prefixed or bare — so "the first token is a
// routing token" is a fact at the call site, never a guess here.
//
// PRECEDENT, NOT INVENTION: the bride lane has run this discipline since M1b —
// `brideInbound.js:567`, `trimmedBody.length > 0 ? trimmedBody : bodyForLog`,
// a fallback that fires only on emptiness. This puts both lanes on one law.
function stripRoutingToken(rawBody) {
  const trimmed = String(rawBody == null ? '' : rawBody).trim();
  if (!trimmed) return '';
  const firstToken = trimmed.split(/\s+/)[0];
  return trimmed.slice(firstToken.length).trim();
}

// ── BLOCK 06 M-3 · F-06.17 + F-06.29 · THE SPLIT SCRUB (CE-ruled 2026-07-25, R3) ──
// 「 internal only 」 is the founder's standing word: Donna is INTERNAL-ONLY on the
// vendor surface, EVERY mode. F-06.29 is its mechanical half — `scrub.js` declares
// "one home, every caller" and this lane was NOT a caller, so three name bleeds rode
// one evening's wire while the firewall sat one require away.
//
// THE FOUR NOTIFICATION SITES ARE THE HARD ONES, and this function exists for them.
// `result.vendorNotification` reaches a VENDOR's phone (:524 · :632 · :770 · :900) but
// is authored on the COUPLE lane, and it comes in two shapes (engine.js):
//   :403  firstContactNotif    — the model's own `vendor_notification` message, whole
//   :418  returningBrideNotif  — `${summary}\n\nHer message: "${inboundMessage}"`
//   :407  its fallback         — `${name} just messaged: "${inboundMessage}"`
// The second and third carry THE BRIDE'S OWN SENTENCE, quoted. Scrubbing those whole
// would rewrite HER words — and that is not a hypothetical: it is the vocative family's
// exact disease (scrub.js:136-161, where a blind replacement turned "…here, Donna."
// into a sentence aimed at the wrong person and nobody noticed, because it still read
// fine). A firewall that edits the witness to clean the pipe has stopped being a
// firewall. Her words are hers, on the same law that refuses to rewrite the audit row:
// if SHE writes "Donna", the quote carries it honestly.
//
// SO: THE FRAME SCRUBS, THE QUOTE PASSES BYTE-EXACT.
//
// WHY THE VERBATIM IS A PARAMETER AND NOT A PATTERN. The caller knows exactly what was
// handed to the model as `inboundMessage` — and it is NOT the same value at every site
// (:770's turn receives `stripRoutingToken(body) || 'hi'`, the others `body` or
// `originalMessage`). Deriving the quote here by regex would be guessing at a boundary
// the door already holds as a fact; each call site passes the value it actually sent.
//
// WHY THE SPLIT ANCHORS ON `"<quote>"` AND NOT ON THE BARE QUOTE. Splitting on the bare
// text is unsafe for SHORT messages: a verbatim of `on` occurs inside `Donna`, and
// splitting there would hand scrubText the fragments `D` and `na`, neither of which
// matches `\bDonna\b` — the firewall would open precisely because the bride was terse.
// The quoted token is the frame's own rendering (both shapes above), and only the LAST
// occurrence is preserved, so exactly one region passes and everything around it is
// judged. No quoted token found (firstContactNotif's shape, or any drift in the frame)
// ⇒ the whole string scrubs: the fail-safe direction is the firewall CLOSED.
//
// EXPORTED so the bench drives the shipped function, never a copy (Q-SP-5) — the
// stripRoutingToken precedent above, same file, same reason.
// TDW_06 M-4 / F-06.36: `witness` is OPTIONAL and additive — { supabase, vendorId,
// surface, ctx }. The SPLITTER'S LOGIC BELOW IS BYTE-UNCHANGED; the witness only reads
// the whole-in/whole-out pair and files a row when the firewall actually caught
// something. Omit it and this function behaves exactly as M-3 shipped it.
// ── TDW_08 P5 RIDER (F-08.85, CE R-R3) — THE ONE DOOR ────────────────────────
// The three enquiry-alert relays below (:591 disambiguated, :700 sticky, :989
// returning) call `sendVendorEnquiryAlert` and NOTHING ELSE calls it. Direct
// `sendWhatsApp` for a vendor notification is the defect this rider cured: it
// threw on a shut 24h window, reached the function-level dead-letter, and cost
// the BRIDE the rest of her turn. The bench asserts the sole-caller property.
const { sendVendorEnquiryAlert } = require('./vendor/enquiryAlert');

// FOUNDER-WITNESSED, 2026-08-05: this is the exact link the founder submitted as
// {{3}}'s review sample on the approved template, read off his own screenshot.
// Named as a const beside the door's callers for the same reason `CLAIM_BASE`
// (demoLeadAlert.js:55) is — a URL pasted at three call sites drifts at two.
// F-38.p12 (CE-39 step 2a): reads the ONE HOME, src/lib/pwaPaths.js — the
// address is byte-identical today; Phase 7 flips that file alone.
const VENDOR_LEADS_LINK = require('./pwaPaths').vendorUrl('leads');

function scrubModelFrame(text, verbatim, witness = null) {
  if (text == null) return text;
  const s = String(text);
  const out = (() => {
    const q = verbatim == null ? '' : String(verbatim);
    if (!q) return scrubText(s);
    const token = '"' + q + '"';
    const at = s.lastIndexOf(token);
    if (at === -1) return scrubText(s);
    return scrubText(s.slice(0, at)) + token + scrubText(s.slice(at + token.length));
  })();
  if (witness) {
    witnessWireScrub(witness.supabase, witness.vendorId, witness.surface || 'whatsapp', s, out, witness.ctx || 'scrubModelFrame');
  }
  return out;
}

// ── C5 · THE TURN LOCK, THE ONE THING THIS BRIDE ARC TOUCHES ON THIS FILE ───
// The fence was widened deliberately and narrowly at CE-67: this file may be
// touched for LOCK WIRING ALONE — the import above and the wrapper below, zero
// other vendor bytes. F-05.41 was witnessed on the bride lane, but the anatomy is
// SHARED: index.js:166 and brideIndex.js:158 are the same handler shape, each
// answering 200 before its turn finishes, so two POSTs one second apart race here
// exactly as they raced there. Curing one lane and leaving its twin racy would be
// a knowing half-cure. Nothing below this wrapper changed.
// `_noRetry` — FORK D'S STRUCTURAL BOUND (M-2, CE-ratified). Not a depth counter. The
// chain's retry that it bounded left with the chain (CE-45 LCV-15 LSP_1); nothing here
// re-enters this function. The parameter exists so a future caller that DOES
// re-enter cannot accidentally create one, and so the bench can assert the property.
// F-06.182's predicate, imported from its one home so the door and the bench
// read the SAME list of kinds. A relay outcome that put no bytes on her screen
// (a refusal, a failed send) must NOT silence the model — she asked a question
// and still deserves an answer.
const { relayFiredOnArrival } = require('./vendor/coupleArrival');

// ── CE-45 LCV-15 LSP_1b · F-44.141 · THE OPT-OUT TURN, ON THE RECORD ─────────────────────────────────────────────
// Called only where the opt-out branch RETURNS. For a VENDOR OWNER (the phone reads a user, the user owns a vendor, the
// vendor has a vendor_self thread) it writes her inbound row, with its sid, and the acknowledgment as an outbound row, so
// the thread the door's turns live in shows both. Read-only until then; it creates no user, vendor or thread (a first-
// ever message that is STOP stays unrecorded, as a first-ever image does at the guard row, declared). A couple or an
// unknown sender writes nothing. NEVER THROWS: a failure is logged and the opt-out stands.
async function persistOptOutTurn({ supabase, webhookCore, phone, body, reply, sent, messageSid }) {
  try {
    const { data: u } = await supabase.from('users').select('id').eq('phone', phone).maybeSingle();
    if (!u || !u.id) return { persisted: false, why: 'no_user' };
    const { data: v } = await supabase.from('vendors').select('id').eq('user_id', u.id).maybeSingle();
    if (!v || !v.id) return { persisted: false, why: 'not_a_vendor' };
    const { data: c } = await supabase.from('conversations').select('id').eq('vendor_id', v.id).eq('kind', 'vendor_self').maybeSingle();
    if (!c || !c.id) return { persisted: false, why: 'no_vendor_self' };
    await supabase.from('messages').insert(webhookCore.inboundRow({
      conversation_id: c.id, direction: 'inbound', channel: 'whatsapp', body, sent_by: 'vendor',
    }, messageSid || null));
    await supabase.from('messages').insert({
      conversation_id: c.id, direction: 'outbound', channel: 'whatsapp', body: reply, sent_by: 'agent',
      twilio_sid: sent && sent.sid ? sent.sid : null,
    });
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', c.id);
    return { persisted: true };
  } catch (e) {
    try { console.error('[webhook] opt-out turn not persisted (the opt-out stands):', e && e.message); } catch (_e) { /* */ }
    return { persisted: false, why: 'error' };
  }
}

async function processVendorInbound(inputs, deps, _noRetry) {
  return withTurnLock(turnKey('vendor', inputs && inputs.phone), () => _processVendorInbound(inputs, deps, _noRetry));
}

async function _processVendorInbound(inputs, deps, _noRetry) {
  const {
    phone, body, profileName, messageSid, internalReplay,
    trimmedBody, numMedia, hasMedia, mediaUrl, rawPayload,
  } = inputs;
  const {
    runCoupleAgenticTurn, sendWhatsApp, generateInvoiceForBinder, enquiryToBinder,
    ensureCoupleRow, captureField, buildDisambiguationQuestion, interpretDisambiguationReply,
    vendorDisplayName, resolveAgentForVendor,
    buildLlmForTurn, matchModeWord, applyModeFlip, MODE_FLIP_LINES,
    matchFreshWord, FRESH_THREAD_LINE, abandonActiveThread, // TDW_04.5 F-04.98 C3
    checkImageThrottle, markRejectionSent, extractCalendarFromImage, webhookCore, supabase, anthropic,
  } = deps;
  try {
    // ── TDW_05 P4 / F-05.22 — THE NUDGE-CLASS BRANCH (vendor lane) ────
    // FIRST, and pre-engine: no model call, no user row created, no cost. The twin of the
    // bride branch in brideInbound.js — identical in shape so the two lanes cannot drift;
    // only the lane string differs. tdw_morning_nudge_vendor has carried "Reply STOP
    // MORNINGS to pause these updates" since approval with nothing reading it.
    //
    // NARROW BY CONSTRUCTION. matchNudgeWord returns null for bare "STOP"; that word is the
    // full stop's and its machinery is untouched here. It also runs BEFORE the users upsert,
    // so a pause from a number with no vendor row still lands rather than creating one.
    const nudgeWord = matchNudgeWord(trimmedBody);
    if (nudgeWord) {
      const lane = 'vendor';
      try {
        if (nudgeWord === 'stop') {
          await setNudgeOptout({ supabase, phone, lane, state: 'opted_out' });
          await sendWhatsApp(phone, getNudgeCopy('opt_out_confirmation'), [], undefined, ACK_BYPASS);
          console.log(`[webhook] nudge-class OPT-OUT recorded for ${phone} (lane=${lane})`);
        } else {
          await setNudgeOptout({ supabase, phone, lane, state: 'resumed', source: 'inbound_stop_mornings' });
          await sendWhatsApp(phone, getNudgeCopy('resume_confirmation'), [], undefined, ACK_BYPASS);
          console.log(`[webhook] nudge-class RESUME recorded for ${phone} (lane=${lane})`);
        }
      } catch (nudgeErr) {
        // Never let this branch swallow the turn silently. The write is attempted first,
        // so a failure here is most often the confirmation send — logged, not hidden.
        console.error('[webhook] nudge-class branch error:', nudgeErr && nudgeErr.message);
      }
      return;
    }

    // ── TDW_05 P4 closing micro / F-05.25 — THE FULL STOP (vendor lane) ────
    // SECOND, and the ordering is LOAD-BEARING: isStopWord matches the FIRST
    // TOKEN ONLY, so isStopWord('STOP MORNINGS') is TRUE. Running this before
    // the nudge branch would swallow every pause and convert it into a terminal
    // opt-out — F-05.22's cure destroyed by its own sibling. Nudge first, always.
    //
    // Writes through prospects.js's EXISTING writer pair (findOrCreate + update),
    // which already upserts; this path introduces no second writer. The
    // confirmation then goes out through the gate it just closed, using the same
    // single documented bypass the marketing lane uses for the same reason
    // (prospects.js:132-134) — an acknowledgement the recipient never receives
    // reads as an opt-out that did not register.
    //
    // CE-45 LCV-15 LSP_1b (F-44.141, the chair's rulings Q1b to Q3b): the match is the WHOLE message (matchOptOutExact),
    // never the first token, for EVERY sender on this lane (the branch runs before the sender is known, and a
    // bride's "Cancel the shoot" to her vendor must reach the door as a vendor's "Cancel Walk Seventeen Alpha's
    // shoot" must). The branch keeps its pre-cap position: an opt-out works even for a capped vendor. On a RETURNING
    // branch only (STOP; a START that changed the state), a vendor owner's two turns are persisted into her vendor_self
    // thread (persistOptOutTurn), her inbound row WITH its message_sid so RF-1's dedupe still holds. NEVER on a
    // fall-through (a START from someone never opted out): nothing was sent here, and the normal turn below writes her
    // inbound row with the same sid; a row written here first would be a second writer on it (the turn's insert then
    // meets the unique sid, and the lane discards that error) and would record a reply never sent. A couple
    // sender's opt-out turns are matched here but not persisted (her thread resolves far below); named in the handover.
    const fullStopWord = matchOptOutExact(trimmedBody);
    if (fullStopWord) {
      try {
        if (fullStopWord === 'stop') {
          await recordFullStop({ supabase, phone });
          const sent = await sendWhatsApp(phone, getNudgeCopy('full_stop_confirmation'), [], undefined, ACK_BYPASS);
          console.log(`[webhook] FULL STOP recorded for ${phone} (lane=vendor)`);
          await persistOptOutTurn({ supabase, webhookCore, phone, body, reply: getNudgeCopy('full_stop_confirmation'), sent, messageSid: internalReplay ? null : messageSid });
        } else {
          const r = await recordFullStart({ supabase, phone });
          if (r.changed) {
            const sent = await sendWhatsApp(phone, getNudgeCopy('full_start_confirmation'), [], undefined, ACK_BYPASS);
            console.log(`[webhook] FULL START recorded for ${phone} (lane=vendor)`);
            await persistOptOutTurn({ supabase, webhookCore, phone, body, reply: getNudgeCopy('full_start_confirmation'), sent, messageSid: internalReplay ? null : messageSid });
            return;
          }
          // Never opted out — fall through to the normal turn, exactly as the
          // marketing lane does (prospects.js:151-152). START is not a keyword
          // for someone who never stopped.
        }
      } catch (stopErr) {
        console.error('[webhook] full-stop branch error:', stopErr && stopErr.message);
      }
      if (fullStopWord === 'stop') return;
    }

    let user;
    const { data: existingUser } = await supabase
      .from('users').select('*').eq('phone', phone).maybeSingle();

    if (existingUser) {
      user = existingUser;
    } else {
      const { data: newUser, error } = await supabase
        .from('users').insert({ phone, name: profileName }).select().single();
      if (error) throw error;
      user = newUser;
    }

    const { data: vendor } = await supabase
      .from('vendors').select('*').eq('user_id', user.id).maybeSingle();

    // ── ARC OB · THE ONBOARDING GATE (CE-31, ratified site) ───────────────
    // THE TWO GATES ARE NOT ONE CODE WITH THE TABLE SWAPPED, and CE-31
    // ratified that asymmetry as law rather than letting a later sitting
    // "unify" them. The bride door DEAD-ENDS an unknown phone; THIS DOOR
    // PROVISIONS ONE — the users.insert directly above creates the account on
    // first contact. So on this lane "un-onboarded" is the NORMAL first state
    // of every new number, and the gate cannot be a `!vendor` test. It is the
    // FIELD PREDICATE (R-OB.8: field-presence, never onboarding_state) read
    // against the row the door itself just made.
    //
    // A missing vendors row is incomplete by definition — vendorComplete() is
    // handed undefined and returns every field missing — so a brand-new number
    // meets the redirect on message one, which is exactly R-OB.2's intent.
    //
    // SITED HERE, immediately after the vendor lookup and before every branch
    // below: the first of those (the image throttle, next block) already calls
    // out to Haiku Vision on an onboarded vendor's media. R-OB.3's zero-spend
    // must hold ahead of it, not alongside it.
    //
    // R-OB.9 · DARK. Resolves to { gate: false } until the founder flips
    // `onboarding.gate_enabled` AND the vendor redirect byte is vetoed.
    // R-OB.5 · Eliza's door is NOT this door. Her enquirers are the vendor's
    // leads reaching a VENDOR's line, never TDW registrants, and gating her is
    // FORBIDDEN by charter. This gate sits on the vendor's own inbound only.
    const obGate = await onboardingGate({ lane: 'vendor', supabase, user, row: vendor });
    if (obGate.gate) {
      console.log(`[webhook] onboarding gate: user ${user.id} incomplete (${obGate.missing.join(',')}) — redirect, zero spend`);
      await sendWhatsApp(phone, obGate.byte);
      return;
    }

    // ── Image throttle (Patch 9) ────────────────────────────────────
    // Before any image-pipeline work, throttle to 2 images per 30s per phone.
    // Prevents burst-forward spam (5 calendar screenshots → 5 Vision calls
    // → 5 separate replies). Fires for any onboarded vendor with media,
    // regardless of whether a caption is attached.
    if (vendor && vendor.onboarding_state === 'complete' && hasMedia && mediaUrl) {
      const throttle = await checkImageThrottle({ supabase, phone, engine: 'vendor' });
      if (!throttle.allowed) {
        console.log(`[webhook] vendor image throttle: ${phone} count=${throttle.count} notify=${throttle.shouldNotify}`);
        if (throttle.shouldNotify) {
          await sendWhatsApp(
            phone,
            "I'll be able to process two at a time right now. Send the rest after I respond to these two. Good news though, I'll be able to process multiple images together, very soon!"
          );
          await markRejectionSent({ supabase, rowId: throttle.rowId });
        }
        return;
      }
    }

    // ── Vendor calendar bulk-import via image OCR (Patch 8) ────────
    // If an onboarded vendor sends an image (with or without caption),
    // run it through Haiku Vision to extract events, stage them as
    // pending_event_proposals, and reply with the list for confirmation.
    // The vendor's next text message goes through the normal agent loop
    // and calls commit_event_proposals to bulk-insert.
    if (vendor && vendor.onboarding_state === 'complete' && hasMedia && mediaUrl) {
      try {

        // ══ F-05.55 CURED · THE GUARD ROW, WRITTEN BEFORE THE SPEND ═══════════════
        // THE DISEASE (CE-67 §B, finder the LE, chair-verified): this branch wrote its
        // audit pair as BARE objects and RETURNED before the file's only vendor-lane
        // inboundRow call. RF-1's durable half — messages.message_sid plus the partial
        // unique index messages_message_sid_uidx — never saw a media turn, so the only
        // dedupe was webhookCore's per-process LRU, which a restart empties. A
        // redelivered calendar image was a DOUBLE OCR TURN: double Vision spend,
        // double proposal staging, double audit rows.
        //
        // WHY THE ROW MOVED AND DID NOT MERELY GAIN A SID (CE ruling R2). The pair was
        // written AFTER extractCalendarFromImage and AFTER the preview send. Handing
        // that row a wamid would have cured the duplicate AUDIT rows and nothing the
        // finding is about — the Vision call and the vendor's second message have
        // already happened by then. That shape buys a bench green, a byte-clean diff,
        // a sealed micro, and a redelivered image that still OCRs twice. So the
        // INBOUND half moves to branch entry and becomes a GUARD: the first thing this
        // branch does is claim the wamid. The OUTBOUND half stays where it lives,
        // byte-untouched and taking NO message_sid (R3) — 0084's contract is
        // inbound-only, and an outbound wamid in that keyspace invites a
        // cross-direction collision on a column whose whole meaning is inbound
        // identity. The two-insert split is the disclosed structural consequence.
        //
        // WHY THE {error} IS READ HERE, AND ONLY HERE (F-05.61, CE ruling R1).
        // supabase-js does not throw on a PostgREST error; it RETURNS {data, error}.
        // Every inboundRow call site in this estate awaits bare and discards it, so the
        // outer catch's isDuplicateSidError has never once been reached FROM an insert:
        // the durable half has been a column, an index, and a catch that nothing could
        // reach. Proven by command at the lockfile-pinned @supabase/supabase-js 2.105.4
        // against a real 409/23505. The ten-site sweep is CHARTERED SEPARATELY (the
        // RF-1 coherence sitting, with F-05.62's bride reorder); this micro reads the
        // error at ITS OWN NEW SITE ONLY, per R1's scope ruling. Do not widen this by
        // analogy — that sweep is a kickoff, not a convenience.
        //
        // THE MECHANISM IS WITNESSED, NOT ASSUMED: the founder's pg_indexes paste
        // (2026-07-24, banked in the CE addendum) shows messages_message_sid_uidx live
        // on public.messages as CREATE UNIQUE INDEX ... USING btree (message_sid) WHERE
        // (message_sid IS NOT NULL) — byte-matching 0084:24-25. Committed AND applied.
        //
        // A REDELIVERY AFTER A FAILED VISION CALL IS ALSO DROPPED, and that is correct:
        // a redelivery is Meta re-sending one message, never a retry channel for our
        // failures. The vendor was already answered on the first pass.
        const caption = trimmedBody.length > 0 ? trimmedBody : null;

        // ── F-05.55 GUARD ROW · BEGIN ──
        const { data: vendorSelfConvo } = await supabase
          .from('conversations')
          .select('id')
          .eq('vendor_id', vendor.id)
          .eq('kind', 'vendor_self')
          .maybeSingle();

        if (vendorSelfConvo) {
          const { error: guardErr } = await supabase.from('messages').insert(webhookCore.inboundRow({
            conversation_id: vendorSelfConvo.id,
            direction: 'inbound',
            channel:   'whatsapp',
            body:      caption || '[calendar image]',
            sent_by:   'vendor',
            media_url: mediaUrl,
          }, internalReplay ? null : messageSid));

          if (webhookCore.isDuplicateSidError(guardErr)) {
            console.log(`[webhook:vendor-image] duplicate wamid ${messageSid} hit messages_message_sid_uidx — already processed, dropping BEFORE the Vision call`);
            return;
          }
          if (guardErr) {
            // Any other error stays best-effort, exactly as this write has always been:
            // an audit row must never kill the vendor's turn. Logged, never hidden.
            console.error('[webhook:vendor-image] guard row insert failed (audit best-effort, turn continues):', guardErr.message || guardErr);
          }
        } else {
          // DECLARED GAP, named rather than widened: a vendor whose FIRST-EVER message
          // is an image has no vendor_self conversation yet — it is created on the text
          // path in the vendor-path block below. No conversation means no row to claim
          // the wamid with, so that one turn is UNDEDUPED. Creating the conversation
          // here would make this branch a second writer on that plane, which is unruled
          // and outside this micro's charter. Pre-existing shape preserved exactly.
          console.warn(`[webhook:vendor-image] no vendor_self conversation for vendor=${vendor.id} — guard row skipped, this turn is UNDEDUPED (declared)`);
        }
        // ── F-05.55 GUARD ROW · END ──

        // IST today for date inference inside the Vision prompt
        const istOffsetMs = 5.5 * 60 * 60 * 1000;
        const istToday = new Date(Date.now() + istOffsetMs).toISOString().split('T')[0];

        const { proposals } = await extractCalendarFromImage({
          image_url: mediaUrl,
          caption,
          anthropic,
          istToday,
        });

        if (!proposals || proposals.length === 0) {
          await sendWhatsApp(phone, "I couldn't make out any events from this image. Try cropping closer or sending a clearer screenshot of the calendar view.");
          return;
        }

        // Stage proposals — agent reads these from dynamic context next turn
        const { data: proposalRow, error: propErr } = await supabase
          .from('pending_event_proposals')
          .insert({
            vendor_id: vendor.id,
            proposals: proposals,
            source_image_url: mediaUrl,
            caption,
          })
          .select('id')
          .single();

        if (propErr) {
          console.error('[webhook:vendor-image] proposal insert failed:', propErr);
          await sendWhatsApp(phone, "I read the calendar but had trouble saving the draft. Please try sending the image again.");
          return;
        }

        // Format the human-readable preview
        const lines = proposals.map((p, i) => {
          const timeBit = p.event_time ? ` ${p.event_time}` : '';
          const noteBit = p.notes ? ` — ${p.notes}` : '';
          return `${i + 1}. ${p.event_date}${timeBit} · ${p.kind} · ${p.title}${noteBit}`;
        });
        // LSP_2 (CE-45 LCV-15) · R-45.16: the preview closes on his B84 (hash-carried, doorLines.js), and the door answers it (the IMG note below)
        const previewMsg =
          `I found ${proposals.length} event${proposals.length === 1 ? '' : 's'} in this image:\n\n` +
          lines.join('\n') + '\n\n' + require('./vendor/doorLines').LINES.B84;
        // F-44.109, Q2 dropped Victor's asking line (no hand read the reply). R-45.16 (LSP_2) gives the door that hand: the preview asks in his words (B84)
        // and the door's IMG note, written just below, answers "save all" / "skip N" by its own grammar (workingDoor.answerProposals).

        const sent = await sendWhatsApp(phone, previewMsg);

        // R-45.16: the door's note for her answer, on the engine thread the door reads. Never throws; no usage row. If the agent cannot be resolved the
        // preview still stands and her reply is handled fresh (declared).
        try {
          const { agentId: imgAgent } = await resolveAgentForVendor(supabase, vendor, user && user.auth_user_id);
          await require('./vendor/workingDoor').noteProposals({ supabase, agentId: imgAgent, message: caption ? `[image] ${caption}` : '[image]', reply: previewMsg, proposalId: proposalRow && proposalRow.id, count: proposals.length, lane: 'whatsapp' });
        } catch (e) { console.warn('[webhook:vendor-image] the save note was not written (her reply is handled fresh):', e && e.message); }

        // Log the OUTBOUND half to vendor_self for audit + agent history. The INBOUND
        // half is the F-05.55 guard row above — written before the spend, not after it,
        // which is the whole cure. This half is byte-untouched from the pair it left
        // (same five fields, same values, same order) and takes NO message_sid: R3.
        // The vendor_self lookup now lives at branch entry with the guard.
        if (vendorSelfConvo) {
          await supabase.from('messages').insert({
            conversation_id: vendorSelfConvo.id,
            direction: 'outbound',
            channel:   'whatsapp',
            body:      previewMsg,
            sent_by:   'agent',
            twilio_sid: sent && sent.sid ? sent.sid : null,
          });
        }

        console.log(`[webhook:vendor-image] proposal ${proposalRow.id} staged with ${proposals.length} events`);
        return;
      } catch (err) {
        console.error('[webhook:vendor-image] error:', err.message);
        // Fall through to existing media handling on Vision failure
      }
    }

    // ── Late media-only refusal ────────────────────────────────────
    // Reached when:
    //   (a) media arrived from a NON-vendor (bride, unknown sender)
    //   (b) media arrived from a vendor whose onboarding is incomplete
    //   (c) vendor calendar branch threw and fell through
    // In all cases, no body text means no agent turn we can run.
    if (!trimmedBody && hasMedia) {
      console.log(`[webhook] media-only fallback from ${phone} (vendor=${!!vendor}, onboarded=${vendor?.onboarding_state === 'complete'})`);
      await sendWhatsApp(phone, "I'll be able to process images and voice notes really soon — but for now, please type your message and I'll help.");
      return;
    }

    if (!vendor) {
      // ── Couple routing — disambiguation-aware (Session 8.5 Step 10) ──
      //
      // Order:
      //   Step A: Pending routing clarification (user was previously asked which vendor)
      //   Step B: TDW code in first word -> Mode 2 (wins over thread history)
      //   Step C: Count existing couple_threads:
      //             0 -> Mode 3 fallback
      //             1 -> Mode 1 (route to that thread)
      //             2+ -> Set pending_routing_context, ask disambiguation question

      const DISAMBIGUATION_TTL_MS = 10 * 60 * 1000;  // 10 minutes
      const STICKY_TTL_MS         = 30 * 60 * 1000;  // 30 minutes — vendor stickiness after resolution

      // ── Ensure bride has persistent couple_id ─────────────────────
      // Idempotent — creates users + couples + couple_state rows silently
      // on first contact with any vendor on +91. From this point forward
      // the bride has a stable identity reachable via
      //   conversations.counterparty_user_id → users.id → couples.user_id
      // We do NOT stamp couple_id on the conversations row — XOR holds
      // because vendor_id is set on couple_thread rows.
      const { user_id: _ensuredUserId, couple_id: brideCoupleId } =
        await ensureCoupleRow(supabase, phone, profileName);

      if (_ensuredUserId !== user.id) {
        console.warn(`[coupleIdentity] user_id mismatch: ensured=${_ensuredUserId} loaded=${user.id}`);
      }

      function levenshtein(a, b) {
        const m = a.length, n = b.length;
        const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
              ? dp[i - 1][j - 1]
              : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
          }
        }
        return dp[m][n];
      }

      // ── Step A: Pending disambiguation reply ──────────────────────
      const pendingCtx = user.pending_routing_context;
      const pendingFresh = pendingCtx?.asked_at
        && (Date.now() - new Date(pendingCtx.asked_at).getTime()) < DISAMBIGUATION_TTL_MS;

      // Detect TDW code in this message — needed for Step A and Step B
      const firstWord = body.trim().split(/\s+/)[0].toUpperCase();
      const handle    = firstWord.startsWith('TDW-') ? firstWord.slice(4) : firstWord;

      if (pendingFresh && pendingCtx.candidate_vendor_ids?.length > 0) {
        // A TDW code in the reply short-circuits disambiguation
        if (firstWord && handle && handle !== firstWord && /^[A-Z0-9]+$/.test(handle)) {
          // Starts with TDW- prefix — handled in Step B below, fall through after clearing pending
          await supabase.from('users').update({ pending_routing_context: null }).eq('id', user.id);
        } else {
          // Load candidate vendors (we stored ids; need names + categories for interpretation)
          const { data: candidateVendors } = await supabase
            .from('vendors')
            .select('id, business_name, category, users(name)')
            .in('id', pendingCtx.candidate_vendor_ids);

          const interp = await interpretDisambiguationReply({
            replyText: body,
            candidateVendors: candidateVendors || [],
            anthropic,
          });

          if (interp.matched_vendor_id && interp.confidence === 'high') {
            // Set sticky state — bride sticks to this vendor for 30 min
            await supabase.from('users').update({
              pending_routing_context: {
                sticky_vendor_id: interp.matched_vendor_id,
                sticky_until:    new Date(Date.now() + STICKY_TTL_MS).toISOString(),
              },
            }).eq('id', user.id);

            // Route the ORIGINAL message (not this clarification reply) to matched vendor
            const matchedVendor = (candidateVendors || []).find(v => v.id === interp.matched_vendor_id);
            const originalMessage = pendingCtx.original_message || body;

            // Find or create the couple_thread with this vendor
            let { data: thread } = await supabase
              .from('conversations')
              .select('*, vendors(*)')
              .eq('vendor_id', interp.matched_vendor_id)
              .eq('counterparty_phone', phone)
              .eq('kind', 'couple_thread')
              .maybeSingle();

            if (!thread) {
              const { data: newThread } = await supabase.from('conversations').insert({
                vendor_id: interp.matched_vendor_id,
                counterparty_phone: phone,
                counterparty_user_id: user.id,
                kind: 'couple_thread',
                state: 'new',
                mode: 'auto',
              }).select('*, vendors(*)').single();
              thread = newThread;
            }

        // ── F-05.51 CURED (ARC M6) · RF-1's DURABLE HALF REACHES THIS LANE ──
        // All FOUR couple-thread inbound inserts were bare objects: no message_sid,
        // so the unique index RF-1 relies on never saw the wamid and only the
        // per-process LRU stood between a Meta redelivery and a doubled turn — a
        // restart is all it took. The vendor-self path had done this right since P1b
        // (its one inboundRow call); the couple doors never inherited it.
        // THE CHARTER NAMED ONE SITE. THE WORLD WAS A SET OF FOUR — the executor's
        // own banked class at CE-63, caught here by the census that the trio
        // discipline demands. Curing the filed site alone would have shipped a green
        // over three live holes.

            // Log the original message as the actual inbound (we deferred it earlier)
            await supabase.from('messages').insert(webhookCore.inboundRow({
              conversation_id: thread.id,
              direction: 'inbound',
              channel: 'whatsapp',
              body: originalMessage,
              sent_by: 'couple',
            }, internalReplay ? null : messageSid));
        // ── F-06.178 · THE AUTO-SEND'S TRIGGER (A2/A3) ────────────────────────
        // HER ARRIVAL IS THE WINDOW OPENING. Sited AFTER the insert above and
        // never before it: `coupleWindowOpen` answers by scanning
        // `public.messages`, so calling this first would consult a predicate that
        // still reads CLOSED and produce a green function over a red wire — the
        // exact shape R-29.34 was minted for.
        // PHONE-LEVEL BY RULING: the window is the (lane PNID, her MSISDN) pair
        // and does not care which vendor's thread her words were filed under, so
        // an arrival routed to vendor X can lawfully release vendor Y's approved
        // draft. Her words follow her conversation; the draft follows the window.
        let arrivalRelay = null;
        try {
          const { arrivalAutoSend } = require('./vendor/coupleArrival');
          arrivalRelay = await arrivalAutoSend(supabase, phone, { sendWhatsApp, env: process.env });
        } catch (e) { console.warn('[relay:wa arrival]', e && e.message); }

        // ── F-06.182 · ON A RELAY-FIRED ARRIVAL, THE MODEL DOES NOT SPEAK ────
        //
        // FOUNDER-CAUGHT ON HIS OWN BRIDE HANDSET, walk nine. The door delivered
        // the vendor's quote at 12:34:33 and four seconds later the model told
        // her 「 Perfect, sending that over to you now. You'll hear from dev
        // directly with all details. 」 — false in both clauses. It was not
        // blind: the relayed row was already on her thread and in its context.
        // It saw a completed deed and narrated it as a future one.
        //
        // THE CLASS, THIRD INVERSION: 08-08 claimed a send that never happened;
        // walk seven denied a send that did; this announces as pending a send
        // already delivered. Same disease — the door and the model disagreeing
        // about which turn happened — now with a customer as the audience.
        //
        // SKIPPED, NOT RUN-AND-DROPPED. No tokens spent, no assistant row
        // minted, so there is no costume to patch afterwards — F-06.165's
        // lesson honoured by never creating the row rather than by curing it.
        // The quote stands alone, which is exactly what the doorbell promised
        // her. Her NEXT message runs the couple turn normally: the silence is
        // one turn wide and heals itself.
        //
        // DISCLOSED CONSEQUENCE: the model-composed vendor notification is
        // skipped with the turn. The vendor is not left uninformed — ③ tells
        // him the delivery landed, which is truer than the notification was.
        if (relayFiredOnArrival(arrivalRelay)) {
          console.log(`[relay:wa] model_silent — the door's deed stands alone (${arrivalRelay.kind}) phone=${phone}`);
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', thread.id);
          return;
        }

            const { data: vendorUser } = await supabase
              .from('users').select('*').eq('id', thread.vendors.user_id).maybeSingle();

            const result = await runCoupleAgenticTurn({
              vendor: thread.vendors,
              vendorUser,
              conversation: thread,
              couplePhone: phone,
              coupleId: brideCoupleId,
              inboundMessage: originalMessage,
              supabase,
              anthropic,
            });

            const twilioMsg = await sendWhatsApp(phone, result.reply);

            await supabase.from('messages').insert({
              conversation_id: thread.id,
              direction: 'outbound',
              channel: 'whatsapp',
              body: result.reply,
              sent_by: 'agent',
              twilio_sid: twilioMsg.sid,
              tool_calls: result.toolCalls,
            });

            if (result.vendorNotification && vendorUser?.phone) {
              // M-3 R3: the model's frame scrubs, her quoted sentence passes byte-exact.
              // This turn was handed `originalMessage` (:557) — the quote is that value.
              await sendVendorEnquiryAlert({
                toPhone: vendorUser.phone,
                text: scrubModelFrame(result.vendorNotification, originalMessage, { supabase, vendorId: interp.matched_vendor_id, surface: 'whatsapp', ctx: 'vendorInbound:notification(disambiguated)' }),
                vendorName: vendorUser.name, brideName: result.leadName, link: VENDOR_LEADS_LINK,
                // TDW_06/07 M1 — {{3}}'s raw material, passed rather than derived.
                // The SAME value handed to `scrubModelFrame` one line up, for the
                // same reason its header gives: the call site knows the boundary
                // as a fact and a regex at the door would be guessing at it.
                brideMessage: originalMessage,
                supabase, vendorId: interp.matched_vendor_id, ctx: 'vendorInbound:notification(disambiguated)',
              });
            }

            await supabase.from('conversations')
              .update({ last_message_at: new Date().toISOString() })
              .eq('id', thread.id);

            console.log(`[routing:disambiguated] ${phone} -> vendor ${interp.matched_vendor_id} (${vendorDisplayName(matchedVendor)})`);
            return;
          }

          // Unclear or low confidence — ask one more time with the same vendors
          await sendWhatsApp(phone,
            `Sorry, didn't catch that — ${buildDisambiguationQuestion(candidateVendors || []).replace(/^Hi! /, '')}`
          );
          console.log(`[routing:disambiguation_unclear] ${phone} reply="${body.slice(0, 40)}"`);
          return;
        }
      }

      // ── Step A.5: Sticky vendor (recently resolved disambiguation) ──
      // If pending_routing_context has sticky_vendor_id and not expired,
      // route directly to that vendor. A TDW code in the message overrides
      // and is handled by Step B below.
      const stickyVendorId = pendingCtx?.sticky_vendor_id;
      const stickyUntil    = pendingCtx?.sticky_until;
      const stickyFresh    = stickyVendorId && stickyUntil
        && new Date(stickyUntil).getTime() > Date.now();

      // Does this message start with a TDW code? If yes, skip sticky.
      const startsWithTdw = firstWord.startsWith('TDW-');

      // Bug #4 fix: if message looks like a bare handle attempt, fuzzy-match against
      // ALL vendor handles globally before sticky can claim it. Prevents "Swati978"
      // routing to the sticky vendor instead of prompting "Did you mean TDW-SWATI978?"
      const looksLikeBareHandle = firstWord.length >= 3
        && firstWord.length <= 12
        && /^[A-Z0-9]+$/.test(firstWord)
        && !firstWord.startsWith('TDW-')
        && trimmedBody.toUpperCase() === firstWord;

      if (stickyFresh && looksLikeBareHandle) {
        const { data: allVendors } = await supabase
          .from('vendors')
          .select('routing_handle')
          .not('routing_handle', 'is', null);

        const allHandles = (allVendors || []).map(v => v.routing_handle).filter(Boolean);
        const allCloseMatches = allHandles
          .map(h => ({ h, dist: levenshtein(firstWord, h) }))
          .filter(x => x.dist <= 2);

        if (allCloseMatches.length === 1) {
          const { h: closeMatch } = allCloseMatches[0];
          console.log(`[routing:bare_handle] "${firstWord}" matches "${closeMatch}" globally — prompting before sticky`);
          await sendWhatsApp(phone, `Did you mean TDW-${closeMatch}? Send that and I'll connect you right away.`);
          return;
        }
        // 0 or 2+ matches → fall through to sticky as before
      }

      if (stickyFresh && !startsWithTdw) {
        const { data: stickyThread } = await supabase
          .from('conversations')
          .select('*, vendors(*)')
          .eq('vendor_id', stickyVendorId)
          .eq('counterparty_phone', phone)
          .eq('kind', 'couple_thread')
          .maybeSingle();

        if (stickyThread) {
          console.log(`[routing:sticky] ${phone} -> vendor ${stickyVendorId} (until ${stickyUntil})`);

          await supabase.from('messages').insert(webhookCore.inboundRow({
            conversation_id: stickyThread.id,
            direction: 'inbound',
            channel: 'whatsapp',
            body,
            sent_by: 'couple',
          }, internalReplay ? null : messageSid));
        // ── F-06.178 · THE AUTO-SEND'S TRIGGER (A2/A3) ────────────────────────
        // HER ARRIVAL IS THE WINDOW OPENING. Sited AFTER the insert above and
        // never before it: `coupleWindowOpen` answers by scanning
        // `public.messages`, so calling this first would consult a predicate that
        // still reads CLOSED and produce a green function over a red wire — the
        // exact shape R-29.34 was minted for.
        // PHONE-LEVEL BY RULING: the window is the (lane PNID, her MSISDN) pair
        // and does not care which vendor's thread her words were filed under, so
        // an arrival routed to vendor X can lawfully release vendor Y's approved
        // draft. Her words follow her conversation; the draft follows the window.
        let arrivalRelay = null;
        try {
          const { arrivalAutoSend } = require('./vendor/coupleArrival');
          arrivalRelay = await arrivalAutoSend(supabase, phone, { sendWhatsApp, env: process.env });
        } catch (e) { console.warn('[relay:wa arrival]', e && e.message); }

        // ── F-06.182 · ON A RELAY-FIRED ARRIVAL, THE MODEL DOES NOT SPEAK ────
        //
        // FOUNDER-CAUGHT ON HIS OWN BRIDE HANDSET, walk nine. The door delivered
        // the vendor's quote at 12:34:33 and four seconds later the model told
        // her 「 Perfect, sending that over to you now. You'll hear from dev
        // directly with all details. 」 — false in both clauses. It was not
        // blind: the relayed row was already on her thread and in its context.
        // It saw a completed deed and narrated it as a future one.
        //
        // THE CLASS, THIRD INVERSION: 08-08 claimed a send that never happened;
        // walk seven denied a send that did; this announces as pending a send
        // already delivered. Same disease — the door and the model disagreeing
        // about which turn happened — now with a customer as the audience.
        //
        // SKIPPED, NOT RUN-AND-DROPPED. No tokens spent, no assistant row
        // minted, so there is no costume to patch afterwards — F-06.165's
        // lesson honoured by never creating the row rather than by curing it.
        // The quote stands alone, which is exactly what the doorbell promised
        // her. Her NEXT message runs the couple turn normally: the silence is
        // one turn wide and heals itself.
        //
        // DISCLOSED CONSEQUENCE: the model-composed vendor notification is
        // skipped with the turn. The vendor is not left uninformed — ③ tells
        // him the delivery landed, which is truer than the notification was.
        if (relayFiredOnArrival(arrivalRelay)) {
          console.log(`[relay:wa] model_silent — the door's deed stands alone (${arrivalRelay.kind}) phone=${phone}`);
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', stickyThread.id);
          return;
        }

          const { data: vendorUser } = await supabase
            .from('users').select('*').eq('id', stickyThread.vendors.user_id).maybeSingle();

          const result = await runCoupleAgenticTurn({
            vendor: stickyThread.vendors,
            vendorUser,
            conversation: stickyThread,
            couplePhone: phone,
            coupleId: brideCoupleId,
            inboundMessage: body,
            supabase,
            anthropic,
          });

          const twilioMsg = await sendWhatsApp(phone, result.reply);

          await supabase.from('messages').insert({
            conversation_id: stickyThread.id,
            direction: 'outbound',
            channel: 'whatsapp',
            body: result.reply,
            sent_by: 'agent',
            twilio_sid: twilioMsg.sid,
            tool_calls: result.toolCalls,
          });

          if (result.vendorNotification && vendorUser?.phone) {
            // M-3 R3: frame scrubs, quote passes. This turn was handed `body` (:665).
            await sendVendorEnquiryAlert({
              toPhone: vendorUser.phone,
              text: scrubModelFrame(result.vendorNotification, body, { supabase, vendorId: stickyThread.vendors?.id, surface: 'whatsapp', ctx: 'vendorInbound:notification(sticky)' }),
              vendorName: vendorUser.name, brideName: result.leadName, link: VENDOR_LEADS_LINK,
              // TDW_06/07 M1 — {{3}}'s raw material. This turn was handed `body`.
              brideMessage: body,
              supabase, vendorId: stickyThread.vendors?.id, ctx: 'vendorInbound:notification(sticky)',
            });
          }

          // Refresh sticky window — each interaction extends stickiness
          await supabase.from('users').update({
            pending_routing_context: {
              sticky_vendor_id: stickyVendorId,
              sticky_until:    new Date(Date.now() + STICKY_TTL_MS).toISOString(),
            },
          }).eq('id', user.id);

          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', stickyThread.id);

          return;
        }
        // If sticky thread doesn't exist (deleted?), fall through to normal routing
        console.warn(`[routing:sticky_orphan] sticky vendor ${stickyVendorId} has no thread for ${phone}, falling through`);
      }

      // ── Step B: TDW code wins over history ────────────────────────
      const { data: matchedByTdw } = await supabase
        .from('vendors')
        .select('*, users(*)')
        .eq('routing_handle', handle)
        .maybeSingle();

      if (matchedByTdw) {
        console.log(`[routing:tdw] code ${handle} -> vendor ${matchedByTdw.id}`);

        const vendorUser = matchedByTdw.users;

        // Find or create couple_thread for this vendor
        let { data: coupleThread } = await supabase
          .from('conversations')
          .select('*')
          .eq('vendor_id', matchedByTdw.id)
          .eq('counterparty_phone', phone)
          .eq('kind', 'couple_thread')
          .maybeSingle();

        if (!coupleThread) {
          const { data: newThread } = await supabase
            .from('conversations')
            .insert({
              vendor_id: matchedByTdw.id,
              counterparty_phone: phone,
              counterparty_user_id: user.id,
              kind: 'couple_thread',
              state: 'new',
              mode: 'auto',
            })
            .select()
            .single();
          coupleThread = newThread;
        }

        await supabase.from('messages').insert(webhookCore.inboundRow({
          conversation_id: coupleThread.id,
          direction: 'inbound',
          channel: 'whatsapp',
          body,
          sent_by: 'couple',
        }, internalReplay ? null : messageSid));
        // ── F-06.178 · THE AUTO-SEND'S TRIGGER (A2/A3) ────────────────────────
        // HER ARRIVAL IS THE WINDOW OPENING. Sited AFTER the insert above and
        // never before it: `coupleWindowOpen` answers by scanning
        // `public.messages`, so calling this first would consult a predicate that
        // still reads CLOSED and produce a green function over a red wire — the
        // exact shape R-29.34 was minted for.
        // PHONE-LEVEL BY RULING: the window is the (lane PNID, her MSISDN) pair
        // and does not care which vendor's thread her words were filed under, so
        // an arrival routed to vendor X can lawfully release vendor Y's approved
        // draft. Her words follow her conversation; the draft follows the window.
        let arrivalRelay = null;
        try {
          const { arrivalAutoSend } = require('./vendor/coupleArrival');
          arrivalRelay = await arrivalAutoSend(supabase, phone, { sendWhatsApp, env: process.env });
        } catch (e) { console.warn('[relay:wa arrival]', e && e.message); }

        // ── F-06.182 · ON A RELAY-FIRED ARRIVAL, THE MODEL DOES NOT SPEAK ────
        //
        // FOUNDER-CAUGHT ON HIS OWN BRIDE HANDSET, walk nine. The door delivered
        // the vendor's quote at 12:34:33 and four seconds later the model told
        // her 「 Perfect, sending that over to you now. You'll hear from dev
        // directly with all details. 」 — false in both clauses. It was not
        // blind: the relayed row was already on her thread and in its context.
        // It saw a completed deed and narrated it as a future one.
        //
        // THE CLASS, THIRD INVERSION: 08-08 claimed a send that never happened;
        // walk seven denied a send that did; this announces as pending a send
        // already delivered. Same disease — the door and the model disagreeing
        // about which turn happened — now with a customer as the audience.
        //
        // SKIPPED, NOT RUN-AND-DROPPED. No tokens spent, no assistant row
        // minted, so there is no costume to patch afterwards — F-06.165's
        // lesson honoured by never creating the row rather than by curing it.
        // The quote stands alone, which is exactly what the doorbell promised
        // her. Her NEXT message runs the couple turn normally: the silence is
        // one turn wide and heals itself.
        //
        // DISCLOSED CONSEQUENCE: the model-composed vendor notification is
        // skipped with the turn. The vendor is not left uninformed — ③ tells
        // him the delivery landed, which is truer than the notification was.
        if (relayFiredOnArrival(arrivalRelay)) {
          console.log(`[relay:wa] model_silent — the door's deed stands alone (${arrivalRelay.kind}) phone=${phone}`);
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', coupleThread.id);
          return;
        }

        // 5-B-2 — land the enquiry in the engine cabinet (was a public.leads insert).
        // enquiryToBinder dedups by phone and opens the binder as a lead; the
        // post-agent call below enriches its note with the vendor summary. The
        // marketplace is just another caller.
        //
        // ── B0 (BLOCK 06 M-0, CE-ruled NAME-ONLY) · THE ONE-BRANCH ASYMMETRY ──
        // THIS is the only one of four couple paths that leaves an engine-plane
        // trace. The disambiguation-resume (:500), sticky (:608) and existing-
        // thread (:876) branches all run a couple turn and write NO binder, so a
        // vendor's cabinet holds his TDW-link enquiries and not his others.
        // NAMED, NOT CURED: adding binder writes to three uncharted branches is a
        // live change to the vendor's cabinet, and this sitting's purpose is
        // making EXISTING data true. Recorded here so it is not rediscovered.
        //
        // ── F-05.59 / F-05.54 CURED (C1) · THE CLAIM AND THE VERDICT ─────────
        // `noteIfNew`, not `note`: this sentence asserts PRIMACY, and primacy is
        // true only of a binder this enquiry opened. Passed as an always-note it
        // was appended on every dedupe hit, so a repeat enquiry stored a
        // first-message claim about a message that was not the first (specimen:
        // binder 1e774015, the sentence stored twice). The bytes are unchanged;
        // only the key changed, and with it the path it is written on.
        const preTurnBinder = await enquiryToBinder(supabase, matchedByTdw.id, {
          phone,
          noteIfNew: `Enquiry via your TDW link. First message: ${body}`,
        });
        // The verdict is READ. It used to be spoken to nobody — a bare await on a
        // function whose whole contract is { ok, binder, deduped } (F-05.54, and
        // F-05.61's family: a return value discarded is a failure that never
        // happened). A cabinet write can fail while the bride's turn continues
        // correctly, which is exactly why it must be loud rather than fatal.
        if (!preTurnBinder || preTurnBinder.ok !== true) {
          console.error(
            `[enquiry-binder:pre-turn] FAILED for vendor ${matchedByTdw.id} / ${phone} — ` +
            `${(preTurnBinder && preTurnBinder.error) || 'no result returned'}. ` +
            `The bride's turn continues; her enquiry has NO binder in this vendor's cabinet.`);
        }

        const result = await runCoupleAgenticTurn({
          vendor: matchedByTdw,
          vendorUser,
          conversation: coupleThread,
          couplePhone: phone,
          coupleId: brideCoupleId,
          // A1 — the sentence survives the routing token; the greeting fires only
          // when the token was the whole message. See stripRoutingToken above.
          inboundMessage: stripRoutingToken(body) || 'hi',
          // A-dedupe(α) — the engine's history filter compares against what the
          // audit row at :690 actually stored, not against this derived value.
          // Without it the stripped remainder and the stored body disagree and her
          // sentence reaches the model TWICE (once as history, once in hand).
          rawInboundBody: body,
          supabase,
          anthropic,
        });

        const twilioMsg = await sendWhatsApp(phone, result.reply);

        await supabase.from('messages').insert({
          conversation_id: coupleThread.id,
          direction: 'outbound',
          channel: 'whatsapp',
          body: result.reply,
          sent_by: 'agent',
          twilio_sid: twilioMsg.sid,
          tool_calls: result.toolCalls,
        });

        const vendorPhone = vendorUser?.phone;
        // M-3 R3: the model half scrubs (frame only — this turn was handed
        // `stripRoutingToken(body) || 'hi'` at :794, so THAT is the quote); the fallback
        // is founder-vetoed fixed copy and is left byte-unchanged, never scrubbed.
        const notif = result.vendorNotification
          ? scrubModelFrame(result.vendorNotification, stripRoutingToken(body) || 'hi', { supabase, vendorId: matchedByTdw.id, surface: 'whatsapp', ctx: 'vendorInbound:notification(tdw-link)' })
          : `New enquiry via your TDW link from ${phone}. I'm collecting their details now.`;

        if (vendorPhone) {
          await sendWhatsApp(vendorPhone, notif);
        }

        // Enrich the engine binder's note with the vendor summary (dedup -> note_append).
        if (result.vendorNotification) {
          // D1-lite — the name, now that one exists. The pre-turn call above had
          // none to give (she had not spoken yet), so it opened the binder under
          // enquiryBinder's nameless default AND SAID SO. By here the turn has
          // resolved a name if the bride offered one, and enquiryToBinder fills it
          // in — but ONLY over that untouched default, never over a name the
          // vendor set himself (the never-clobber guard, enquiryBinder.js).
          const postTurnBinder = await enquiryToBinder(supabase, matchedByTdw.id, {
            phone,
            name: result.leadName || null,
            note: result.vendorNotification,
          });
          if (!postTurnBinder || postTurnBinder.ok !== true) {
            console.error(
              `[enquiry-binder:post-turn] FAILED for vendor ${matchedByTdw.id} / ${phone} — ` +
              `${(postTurnBinder && postTurnBinder.error) || 'no result returned'}. ` +
              `The vendor summary did NOT reach his cabinet; his handset still got the message.`);
          }
        }

        await supabase.from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', coupleThread.id);

        // Set sticky state — bride sticks to this vendor for 30 min
        await supabase.from('users').update({
          pending_routing_context: {
            sticky_vendor_id: matchedByTdw.id,
            sticky_until:    new Date(Date.now() + STICKY_TTL_MS).toISOString(),
          },
        }).eq('id', user.id);

        return;
      }

      // ── Step B.5: Typo'd TDW code fuzzy-match ──────────────────────
      const looksLikeHandle = firstWord.length >= 3
        && firstWord.length <= 12
        && /^[A-Z0-9]+$/.test(firstWord)
        && !firstWord.startsWith('TDW-')
        && trimmedBody.toUpperCase() === firstWord;

      if (looksLikeHandle) {
        const { data: brideThreads } = await supabase
          .from('conversations')
          .select('vendor_id, vendors(routing_handle)')
          .eq('counterparty_phone', phone)
          .eq('kind', 'couple_thread');

        const handles = (brideThreads || [])
          .map(t => t.vendors?.routing_handle)
          .filter(Boolean);

        const closeMatches = handles.map(h => ({ h, dist: levenshtein(firstWord, h) })).filter(x => x.dist <= 2);

        if (closeMatches.length === 1) {
          const { h: closeMatch, dist } = closeMatches[0];
          console.log(`[routing:typo] "${firstWord}" close to "${closeMatch}" (distance ${dist}), prompting bride`);
          await sendWhatsApp(phone, `Did you mean TDW-${closeMatch}? Send that and I'll connect you right away.`);
          return;
        }
      }

      // ── Step B.9: THE DOORBELL ANSWER (F-06.177) ──────────────────
      //
      // THE FAILURE THIS CURES, founder-witnessed at walk eight: the estate sent
      // her a template naming her vendor, with a button. She pressed it. The
      // router asked her which of THREE vendors she meant. She was made to solve
      // a problem the estate had already solved and had told her the answer to,
      // one message earlier.
      //
      // WHY THE ORDER IS THIS ORDER (chair-ruled, fork 1(b) and fork 2). This
      // sits AFTER Step A (her answer to a question we asked), AFTER Step A.5
      // (sticky — her own recent engagement) and AFTER Step B/B.5 (an explicit
      // TDW code, her stated intent), and BEFORE Step C. Every one of those
      // outranks a doorbell because every one of them is HER signal, while the
      // doorbell is the ESTATE'S inference about why she is writing.
      // Misdelivering her live conversation with vendor X into vendor Y's thread
      // is the worse failure by every measure this arc owns.
      //
      // IT COVERS THE COUNT-0 BRIDE TOO, and that is why it sits here rather than
      // inside the `>= 2` arm. A doorbell rung to a phone with no thread yet
      // would otherwise be refused with 「 send their TDW code 」 — the same
      // disease with a different victim.
      //
      // IT DOES NOT ROUTE — IT PINS. The pinned row is handed to the SAME Step C
      // terminal that has always handled a single thread: her inbound is
      // persisted there, the couple turn runs there, the vendor notification
      // fires there. Nothing about that proven terminal is reimplemented, which
      // is also what makes F-06.179's persistence hold on this new path by
      // construction rather than by a second copy of the insert.
      let doorbellPin = null;
      {
        const { doorbellRouteFor } = require('./vendor/coupleArrival');
        const dr = await doorbellRouteFor(supabase, phone);
        if (dr.vendorId) {
          const { data: pinned } = await supabase
            .from('conversations')
            .select('*, vendors(id, business_name, category, users(name))')
            .eq('counterparty_phone', phone)
            .eq('kind', 'couple_thread')
            .eq('vendor_id', dr.vendorId)
            .order('last_message_at', { ascending: false, nullsFirst: false })
            .limit(1)
            .maybeSingle();
          if (pinned) {
            doorbellPin = pinned;
            console.log(`[routing:doorbell] ${phone} -> vendor ${dr.vendorId} (draft ${dr.draftId}) — no question asked`);
          } else {
            // The doorbell named a vendor whose thread we cannot find. DECLARED,
            // never silently ignored: `ringDoorbell` writes its own row onto her
            // thread, so this should be unreachable, and if it is ever reached
            // the register says so instead of quietly falling back.
            console.warn(`[routing:doorbell] ${phone} doorbell vendor ${dr.vendorId} has no couple_thread — falling through to Step C`);
          }
        } else {
          console.log(`[routing:doorbell] ${phone} none (${dr.reason})`);
        }
      }

      // ── Step C: Count existing couple_threads ─────────────────────
      const { data: allThreads } = await supabase
        .from('conversations')
        .select('*, vendors(id, business_name, category, users(name))')
        .eq('counterparty_phone', phone)
        .eq('kind', 'couple_thread')
        .order('last_message_at', { ascending: false, nullsFirst: false });

      // THE PIN COLLAPSES THE SET TO ONE. When a doorbell stands, the question
      // "how many vendors could she mean?" has already been answered by the
      // estate's own outgoing template, so the count is 1 and the `>= 2` ask
      // never fires. With no doorbell the set is untouched and every existing
      // branch behaves exactly as it did.
      const existingThreads = doorbellPin ? [doorbellPin] : allThreads;
      const threadCount = existingThreads?.length || 0;

      if (threadCount === 0) {
        // Mode 3 -- no history, no TDW code
        console.log(`[routing:fallback] no match for ${phone}, body: "${body.slice(0, 40)}"`);
        await sendWhatsApp(phone,
          `Hi! To reach a TDW vendor, send their TDW code — you'll find it in their Instagram bio or the link they shared.`
        );
        return;
      }

      if (threadCount === 1) {
        // Mode 1 -- single existing thread, route there
        const existingThread = existingThreads[0];
        console.log(`[routing:single_thread] ${phone} -> vendor ${existingThread.vendor_id}`);

        await supabase.from('messages').insert(webhookCore.inboundRow({
          conversation_id: existingThread.id,
          direction: 'inbound',
          channel: 'whatsapp',
          body,
          sent_by: 'couple',
        }, internalReplay ? null : messageSid));
        // ── F-06.178 · THE AUTO-SEND'S TRIGGER (A2/A3) ────────────────────────
        // HER ARRIVAL IS THE WINDOW OPENING. Sited AFTER the insert above and
        // never before it: `coupleWindowOpen` answers by scanning
        // `public.messages`, so calling this first would consult a predicate that
        // still reads CLOSED and produce a green function over a red wire — the
        // exact shape R-29.34 was minted for.
        // PHONE-LEVEL BY RULING: the window is the (lane PNID, her MSISDN) pair
        // and does not care which vendor's thread her words were filed under, so
        // an arrival routed to vendor X can lawfully release vendor Y's approved
        // draft. Her words follow her conversation; the draft follows the window.
        let arrivalRelay = null;
        try {
          const { arrivalAutoSend } = require('./vendor/coupleArrival');
          arrivalRelay = await arrivalAutoSend(supabase, phone, { sendWhatsApp, env: process.env });
        } catch (e) { console.warn('[relay:wa arrival]', e && e.message); }

        // ── F-06.182 · ON A RELAY-FIRED ARRIVAL, THE MODEL DOES NOT SPEAK ────
        //
        // FOUNDER-CAUGHT ON HIS OWN BRIDE HANDSET, walk nine. The door delivered
        // the vendor's quote at 12:34:33 and four seconds later the model told
        // her 「 Perfect, sending that over to you now. You'll hear from dev
        // directly with all details. 」 — false in both clauses. It was not
        // blind: the relayed row was already on her thread and in its context.
        // It saw a completed deed and narrated it as a future one.
        //
        // THE CLASS, THIRD INVERSION: 08-08 claimed a send that never happened;
        // walk seven denied a send that did; this announces as pending a send
        // already delivered. Same disease — the door and the model disagreeing
        // about which turn happened — now with a customer as the audience.
        //
        // SKIPPED, NOT RUN-AND-DROPPED. No tokens spent, no assistant row
        // minted, so there is no costume to patch afterwards — F-06.165's
        // lesson honoured by never creating the row rather than by curing it.
        // The quote stands alone, which is exactly what the doorbell promised
        // her. Her NEXT message runs the couple turn normally: the silence is
        // one turn wide and heals itself.
        //
        // DISCLOSED CONSEQUENCE: the model-composed vendor notification is
        // skipped with the turn. The vendor is not left uninformed — ③ tells
        // him the delivery landed, which is truer than the notification was.
        if (relayFiredOnArrival(arrivalRelay)) {
          console.log(`[relay:wa] model_silent — the door's deed stands alone (${arrivalRelay.kind}) phone=${phone}`);
          await supabase.from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', existingThread.id);
          return;
        }

        // Fetch full vendor row first so we have user_id for the user lookup
        const { data: fullVendor } = await supabase
          .from('vendors').select('*').eq('id', existingThread.vendor_id).maybeSingle();

        const { data: vendorUser } = await supabase
          .from('users').select('*').eq('id', fullVendor?.user_id).maybeSingle();

        const result = await runCoupleAgenticTurn({
          vendor: fullVendor,
          vendorUser,
          conversation: existingThread,
          couplePhone: phone,
          coupleId: brideCoupleId,
          inboundMessage: body,
          supabase,
          anthropic,
        });

        const twilioMsg = await sendWhatsApp(phone, result.reply);

        await supabase.from('messages').insert({
          conversation_id: existingThread.id,
          direction: 'outbound',
          channel: 'whatsapp',
          body: result.reply,
          sent_by: 'agent',
          twilio_sid: twilioMsg.sid,
          tool_calls: result.toolCalls,
        });

        if (result.vendorNotification && vendorUser?.phone) {
          // M-3 R3: frame scrubs, quote passes. This turn was handed `body` (:933).
          //
          // ── F-07.57 CURED (CE rider) · THIS LINE READ A NULL ─────────────────
          // It passed `matchedByTdw.id`. Every other use of that variable sits
          // INSIDE `if (matchedByTdw)` at :728; this was the sole use outside it,
          // and this branch is reachable ONLY when Step B found nothing — so the
          // variable is null here BY CONSTRUCTION and the read threw. No catch
          // encloses it, so the throw killed the vendor's notification AND the
          // `last_message_at` update below — the very column Step C orders by
          // (:915). Her reply had already sent (:959) and stored (:961), so the
          // failure was invisible from her side: F-07.55's family, one layer down.
          //
          // THE IDENTITY IS THE BRANCH'S OWN. `existingThread.vendor_id` is what
          // `fullVendor` was fetched BY (:943) — the same vendor, but it cannot be
          // null, whereas `fullVendor` can (the code already guards it at :946
          // with `fullVendor?.user_id`). Deviation from the ruling's wording named:
          // "the branch's own fetched vendor" and this value are the same id.
          await sendVendorEnquiryAlert({
            toPhone: vendorUser.phone,
            text: scrubModelFrame(result.vendorNotification, body, { supabase, vendorId: existingThread.vendor_id, surface: 'whatsapp', ctx: 'vendorInbound:notification(returning)' }),
            vendorName: vendorUser.name, brideName: result.leadName, link: VENDOR_LEADS_LINK,
            // TDW_06/07 M1 — {{3}}'s raw material. This turn was handed `body`.
            brideMessage: body,
            supabase, vendorId: existingThread.vendor_id, ctx: 'vendorInbound:notification(returning)',
          });
        }

        await supabase.from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', existingThread.id);

        return;
      }

      // threadCount >= 2 -- DISAMBIGUATION
      const candidateVendors = existingThreads.map(t => t.vendors);
      const question = buildDisambiguationQuestion(candidateVendors);

      await supabase.from('users').update({
        pending_routing_context: {
          candidate_vendor_ids: candidateVendors.map(v => v.id),
          original_message: body,
          asked_at: new Date().toISOString(),
        },
      }).eq('id', user.id);

      await sendWhatsApp(phone, question);

      console.log(`[routing:disambiguation_asked] ${phone} candidates=${candidateVendors.length}`);
      // ── F-06.179 · THE BOUND, DECLARED RATHER THAN SILENT ──────────────────
      // Her words are NOT persisted on this branch and cannot honestly be.
      // `public.messages.conversation_id` is NOT NULL (`docs/db/PUBLIC_SCHEMA.md`,
      // `public.messages`, column 2) and this branch is reached precisely when no
      // vendor — and therefore no thread — has been resolved. Filing her sentence
      // under a thread the estate picked for her would be the routing guess this
      // whole branch exists to refuse, written into the record.
      //
      // THE CONSEQUENCE, NAMED SO IT IS NEVER REDISCOVERED: `coupleWindowOpen`
      // scans `public.messages` for her newest inbound, so on THIS turn only the
      // estate's window predicate cannot see the window Meta just opened, and an
      // approved draft waiting for her will not auto-send. It fails CLOSED — a
      // refusal or a doorbell, never an unearned byte. Her disambiguating reply
      // resolves a vendor and IS persisted (Step A), and the auto-send fires
      // there. The gap is exactly one turn wide and this line is its witness.
      console.log(`[routing:unfiled_inbound] ${phone} — no vendor resolved, her message is not on file this turn (F-06.179 bound)`);
      return;
    }

    // ── Vendor path ────────────────────────────────────────────────
    let convo;
    const { data: existingConvo } = await supabase
      .from('conversations').select('*')
      .eq('vendor_id', vendor.id).eq('kind', 'vendor_self').maybeSingle();

    if (existingConvo) {
      convo = existingConvo;
    } else {
      const { data: newConvo, error } = await supabase
        .from('conversations').insert({
          vendor_id: vendor.id,
          counterparty_user_id: user.id,
          counterparty_phone: phone,
          kind: 'vendor_self',
          state: 'new',
          mode: 'draft',
        }).select().single();
      if (error) throw error;
      convo = newConvo;
    }

    // TDW_05 P1b: carry the inbound MessageSid on the primary inbound row (feeds the
    // durable messages.message_sid unique-index backstop). inboundRow omits it when the
    // column isn't migrated yet (graceful degrade) or on an internal replay (avoids a
    // self-collision on the original turn's sid).
    await supabase.from('messages').insert(webhookCore.inboundRow({
      conversation_id: convo.id,
      direction: 'inbound',
      channel: 'whatsapp',
      body,
      sent_by: 'vendor',
    }, internalReplay ? null : messageSid));

    // 5-A — engine dispatch. The same agent the web app talks to, so memory
    // unifies across web + WhatsApp (one mind, two surfaces). PDF attachments and
    // the ---DRAFT--- split were Myra delivery features the 78807dd engine cut
    // lacks; deferred (see WHATSAPP_ENGINE_DEFERRED_FEATURES.md). The public.messages
    // audit log is kept (3b) for delivery telemetry; engine.messages carries memory.
    //
    // R-36.5 fork F2 arm (b): the resolve is wrapped, and a resolve FAILURE on a
    // vendor whose tier dial reads ZERO degrades to the cap-zero refusal instead
    // of the hiccup — the one true sentence derivable without an agentId. The
    // helper below owns the shape; a degraded turn ends here.
    const resolved = await resolveAgentOrDegrade({
      resolveAgentForVendor, supabase, sendWhatsApp, vendor, user, convo, phone,
    });
    if (resolved.degraded) return;
    const { agentId } = resolved;

    // TDW_06 P7b (S-10 WA words + F-06.8): the mode words, intercepted PRE-ENGINE like the
    // nudge words — exact whole-message "advisor mode" / "business mode" on the vendor_self
    // lane. Writes victor_mode via the SAME server-resolved path, chains the fresh thread on
    // an ACTUAL change (P7a's seam), and short-circuits with a scrubbed confirmation NAMING
    // the flip. A message that merely mentions the words is a real turn — it falls through.
    const modeTarget = matchModeWord(body);
    if (modeTarget) {
      // ── TDW · THE VICTOR SITTING (CE-40) · R-VS.4 = D1 · F-40.3's CURE ────────
      // R-39.22: business mode only on the WhatsApp lane and the PWA chat; ADVISORY
      // LIVES IN THE ADVISOR ROOM ALONE. The read-first's derivation corrected the
      // charter here (report ε): the DEFAULT was never the disease —
      // `engine.agents.victor_mode` is `NOT NULL default 'business'`
      // (docs/db/ENGINE_SCHEMA.md:70) and `agentBridge.js` does not set the column at
      // agent birth, so a fresh vendor's first turn resolves to business on BOTH doors,
      // derived from the row. THE DISEASE IS THIS WORD: `applyModeFlip` writes advisor
      // onto the row PERSISTENTLY, and the row survives fresh threads — so one word on
      // WhatsApp moved the vendor into the advisory room and left him there.
      //
      // THE PIN IS A REFUSAL AT THE WRITE, NOT A GATE AT THE READ. D3 was refused for
      // leaving F-40.3 live; D2 (session scope) was refused for minting a third state
      // for one column. So `applyModeFlip` is NEVER CALLED FROM THIS LANE FOR
      // 'advisor': the row keeps whatever it holds, no thread is chained, and the
      // vendor gets the founder-vetoed sentence naming where the room actually lives.
      //
      // `business` STAYS LEGAL, deliberately — it is the way home if a row was ever
      // flipped by the PWA chip, and refusing it would strand a vendor in a room this
      // lane cannot leave. F-40.4 (the chip itself) is the pwa repo's and is Block 09's.
      if (modeTarget === 'advisor') {
        const { VICTOR_LINES } = require('./victorLines');
        const refusal = VICTOR_LINES.ADVISOR_ON_WHATSAPP;
        const twilioMsg = await sendWhatsApp(phone, refusal, []);
        await supabase.from('messages').insert({
          conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
          body: refusal, sent_by: 'agent',
          twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
        });
        await supabase.from('conversations')
          .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
        console.log(`[agent:mode-word] advisor REFUSED on the WhatsApp lane (R-39.22/D1) agent=${agentId}`);
        return;
      }
      const flip = await applyModeFlip(supabase, agentId, modeTarget);
      const confirmation = MODE_FLIP_LINES[modeTarget][flip.changed ? 'changed' : 'noop'];
      const twilioMsg = await sendWhatsApp(phone, confirmation, []);
      await supabase.from('messages').insert({
        conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
        body: confirmation, sent_by: 'agent',
        twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      });
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
      console.log(`[agent:mode-word] ${modeTarget} (${flip.changed ? 'flipped' : 'noop'}) agent=${agentId}`);
      return;
    }

    // F-04.98 C3 BEGIN (CE-ruled, ninth chair — fresh word)
    // TDW_04.5 F-04.98 C3: the FRESH-THREAD word — the new-thread button WhatsApp never had.
    // Sited immediately AFTER the mode block (CE ruling F1): the two word-sets are disjoint,
    // so order is semantically immaterial, and the after-placement keeps the flip path's bytes
    // literally first — a purely additive diff. This path calls abandonActiveThread DIRECTLY,
    // never applyModeFlip (F2b): victor_mode is neither READ nor WRITTEN here — a fresh thread
    // is not a room change, it is the same room, empty. Short-circuits exactly as the flip does
    // (scrubbed send -> outbound row -> last_message_at -> log -> return): the engine does NOT
    // run this turn, so the abandoned thread cannot be re-populated by the very turn that
    // emptied it. A message that merely CONTAINS "fresh" is a real turn — it falls through.
    if (matchFreshWord(body)) {
      const closed = await abandonActiveThread(supabase, agentId);
      const twilioMsg = await sendWhatsApp(phone, FRESH_THREAD_LINE, []);
      await supabase.from('messages').insert({
        conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
        body: FRESH_THREAD_LINE, sent_by: 'agent',
        twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      });
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
      console.log(`[agent:fresh-word] thread=${closed && closed.closed ? closed.closed : 'none-active'} agent=${agentId}`);
      return;
    }
    // F-04.98 C3 END

    // ── TDW_06 F-06.130 — THE GLITCH-REPORT WORD (the promise V-W has been making) ──────
    // Sited THIRD in the pre-engine word trio and for the trio's own reason: no model call,
    // no cost, and a vendor complaining about a fabrication must not have his complaint
    // routed through the fabricator. The escape hatch cannot depend on the thing it exists
    // to escape (FORK 2 -> 2a, the CE's wording).
    //
    // It sits AFTER mode and fresh because the three word-sets are disjoint (derived: the
    // matchers return false on each other's words), so order is semantically immaterial and
    // after-placement keeps the earlier paths' bytes literally first — a purely additive diff,
    // the same reason the fresh word was sited after the mode block.
    //
    // Short-circuits in the trio's exact shape: send -> outbound row -> last_message_at ->
    // log -> return. `fileGlitchReport` is the ONE home both legs call (FORK 6b) and it owns
    // the choice of sentence: the filed line ONLY when a finding row actually landed, the
    // no-context line otherwise. This branch never composes a claim of its own.
    if (matchGlitchWord(body)) {
      const { fileGlitchReport } = require('../api/vendor-engine/chat');
      const r = await fileGlitchReport(supabase, agentId);
      const twilioMsg = await sendWhatsApp(phone, r.message, []);
      await supabase.from('messages').insert({
        conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
        body: r.message, sent_by: 'agent',
        twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      });
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
      console.log(`[agent:glitch-word] filed=${r.filed} run=${r.run_id || 'none'} agent=${agentId}`);
      return;
    }

    // ── TDW_10 · F-10.100 — THE COMBINED AI CAP. THE WORD TRIO'S FOURTH MEMBER. ──────
    // THE DISEASE, in one sentence: the counter was already combined and only the refusal
    // was missing. Both lanes resolve one agent through resolveAgentForVendor above, both
    // run the same engine turn, and the engine loop writes ONE usage row per turn with agent_id
    // and conversation_id and no lane column at all (witnessed: docs/db/ENGINE_SCHEMA.md,
    // engine.usage, 12 columns). The meter in src/api/vendor-engine/chat.js has therefore
    // ALWAYS counted this lane's turns. It simply never refused them. A paying vendor's
    // WhatsApp use silently exhausted the allowance her web app then denied her.
    //
    // WHY IT SITS EXACTLY HERE, and not one line either side — CE R-26.7 §C, F-1 RULED:
    //
    //   AFTER the three words. Mode, fresh and glitch each short-circuit above with no
    //   model call and no cost, and the glitch block's own comment says why that matters:
    //   the escape hatch cannot depend on the thing it exists to escape. A capped vendor
    //   keeps every one of them. Sealing her escape hatches behind the cap would have been
    //   the exact failure that comment was written against, committed by the sitting that
    //   quotes it.
    //
    //   BEFORE the prep. The model-route builder sits below (the chain's three reads that once
    //   sat beside it left with the chain, CE-45 LCV-15 LSP_1). A refused turn must pay for
    //   none of it.
    //
    //   BEFORE the engine call, which is the only thing on this path that writes a usage
    //   row. That is what makes the refusal free: a meter that ate its own tail would count
    //   the refusal it just issued and refuse her again tomorrow for a conversation she
    //   never had. Two `from('usage').insert` homes exist in the estate — the engine loop
    //   (the turn ledger) and src/agent/harvest.js (spend rows, conversation_id NULL, and
    //   excluded by the meter's own filter) — and this early return reaches neither.
    //
    //   ⚠ WHY THIS PARAGRAPH TALKS AROUND TWO SYMBOL NAMES. `b06_forkc_wireguard_bench`
    //   §12.8 slices vendorInbound from the glitch word to `const calendarSnapshot` and
    //   forbids the tokens `runTurn`, `buildLlmForTurn` and `anthropic` anywhere in that
    //   window — a grep-shaped guard written when nothing else lived in it. Naming them
    //   here in PROSE would redden a sealed 113/113 bench over a comment. The precise
    //   symbols are asserted instead where they belong, by execution rather than by grep:
    //   scripts/tdw10_combined_cap_bench.js §1.6 and §1.7. The over-wide window is filed
    //   as F-10.104 for the bench's own next sitting; it is not amended from here.
    //
    // THE INBOUND ROW DOES NOT MOVE (ratified). It was written above, before the whole
    // trio. Her message stays on the record unanswered, exactly as it does when she sends
    // a mode word — an audit log that only keeps the messages we felt like answering is
    // not an audit log.
    //
    // REQUIRED LAZILY, and the choice is mechanical rather than stylistic. The two elder
    // trio members receive their seams through `deps`; adding a required key to that
    // object BROKE FIVE SEALED BENCHES the last time it was tried, because every bench
    // that drives the real processVendorInbound builds its own deps object and none of
    // them carry a key that did not exist when they were written (the correction is
    // recorded at src/lib/nudgeOptout.js, the glitch word's siting note). The glitch
    // member's inline require is the precedent that survived that lesson; this follows it,
    // and the deps contract stays byte-identical to origin.
    //
    // FAIL-OPEN — RATIFIED BY RULING (R-26.14 §C), not merely chosen. It was the
    // executor's call at build time, surfaced rather than allowed to seal silent, and
    // the chair ruled it standing. F-06.85 binds the reason here so no future sitting
    // "fixes" it into fail-closed on the assumption that a cap ought to fail shut:
    //
    //   A PAYING VENDOR SILENCED BY OUR OWN OUTAGE IS WORSE THAN A BASIC VENDOR
    //   GETTING TURNS DURING ONE.
    //
    // The cost is real and is stated so nobody rediscovers it: a failed config read
    // means unmetered AI for the duration, and only the error line below says so.
    // It is the estate's standing posture for this machinery either way — buildMeta's
    // own catch reads 「 a broken meter NEVER blocks a turn 」 and returns null rather
    // than throwing. The require can fail too (it pulls the engine's db module, which
    // throws at load without its environment), and an unguarded require on the MAIN
    // path of every vendor turn would convert a cap-machinery fault into total
    // WhatsApp silence.
    let capMeta = null, WA_CAP_ZERO_LINE = null, capSpentLineFor = null;
    try {
      const capSeam = require('../api/vendor-engine/chat');
      WA_CAP_ZERO_LINE = capSeam.WA_CAP_ZERO_LINE;
      // Hoisted for the SAME reason as the line above: `capSeam` is scoped to this
      // try block, and the spent-allowance seat below sits outside it. Taking the
      // function out here keeps both refusals reading ONE home for their bytes
      // without either of them reaching into a scope it cannot see.
      capSpentLineFor = capSeam.CAPPED_LINE;
      capMeta = await capSeam.buildMeta({
        supabase, agentId, tier: (vendor && vendor.tier) || 'basic',
      });
    } catch (e) {
      console.error('[agent:cap-gate] METER UNREACHABLE — turn allowed through unmetered:', e.message);
    }
    if (capMeta && capMeta.state === 'capped' && capMeta.turns_cap === 0) {
      const twilioMsg = await sendWhatsApp(phone, WA_CAP_ZERO_LINE, []);
      await supabase.from('messages').insert({
        conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
        body: WA_CAP_ZERO_LINE, sent_by: 'agent',
        twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      });
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
      console.log(`[agent:cap-gate] refused tier=${capMeta.tier} cap=0 agent=${agentId}`);
      return;
    }
    // ── THE SPENT-ALLOWANCE SEAT ON THIS LANE — FILLED. R-26.15 ①. ───────────────────
    // THIS SEAT SHIPPED EMPTY AND WARNING, and the warn was right to exist: at the
    // founder's new ladder an Essential vendor reaches 15 turns in a day, and until this
    // block she then met SILENCE on WhatsApp. She is paying, she is inside her rights,
    // and Victor said nothing back. That is exactly the failure F-3 was ruled to prevent
    // — 「 silence is the one failure mode this whole sitting exists to end 」 —
    // reintroduced by a held byte rather than by a design. The gap was declared, visible
    // in the logs, and closed by a ruling rather than discovered by a vendor.
    //
    // IDENTICAL BYTES TO THE PWA, IMPORTED NOT RETYPED. `CAPPED_LINE` is the shared home;
    // a second transcription of a vetoed string is F-04.36's family and would drift the
    // first time one lane was edited.
    //
    // NO ROUTE LINE HERE, and the asymmetry with the zero-cap block above is deliberate:
    // that one is a SALE and needs somewhere to send her, so it carries directions to
    // Billing. This one is a WAIT. There is nothing to tap, because there is nothing to
    // do but come back — and pointing a vendor at a payment page when her own allowance
    // simply resets at midnight would be selling her something she does not need.
    if (capMeta && capMeta.state === 'capped' && capMeta.turns_cap > 0) {
      const spentLine = capSpentLineFor(capMeta);
      const twilioMsg = await sendWhatsApp(phone, spentLine, []);
      await supabase.from('messages').insert({
        conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
        body: spentLine, sent_by: 'agent',
        twilio_sid: twilioMsg && twilioMsg.sid ? twilioMsg.sid : null,
      });
      await supabase.from('conversations')
        .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
      console.log(`[agent:cap-gate] refused tier=${capMeta.tier} window=${capMeta.window} ${capMeta.turns_used}/${capMeta.turns_cap} agent=${agentId}`);
      return;
    }

    // CE-45 LCV-15 LSP_1 (R-44.32, R-44.37; the chair's K8): the chain's pre-door reads are gone from this lane. The
    // calendar snapshot, the scratchpad, the enquiry-ping drain (which STAMPED pending_lead_pings.acknowledged_at on a
    // turn nothing surfaced, F-44.139, closed as a record with this cut), the category thread, the pending-relay block
    // and the three fact blocks fed only the chain's runTurn below the door, and the door reads none of them.
    // TDW_06 P7b (F-06.1 second limb): the WA door resolves through the SAME builder the PWA
    // door does — victor_mode read at the door, the product tier otherwise — so both surfaces
    // route identically until someone chooses otherwise. Before that seam the WA lane passed
    // NO overrides and ran the engine's native-anthropic hard path.
    //
    // CE-41 F-41.46: it now names its OWN surface. `model.wa_vendor.<tier>` with no row
    // resolves through `model.pwa_vendor.<tier>` — so this line changes NOT ONE ROUTED BYTE
    // until the founder taps the panel — and with a row it is a lane he can switch on its
    // own, from a phone, without touching Victor in the app. That separation is the whole of
    // the finding: two wires were sharing one switch and only one of them was labelled.
    const llmWiring = await buildLlmForTurn({ supabase, vendor, agentId, surface: 'wa_vendor' });

    // ── CE-44 LC-Victor P5 · THE WORKING DOOR ON THE WHATSAPP LANE (src/lib/vendor/workingDoor.js) ──
    // After the cap gate and the route, before the chain. A door-only turn is persisted to the engine
    // thread (one counted usage row, F-44.52), sent, logged as the chain's reply is, and returns here;
    // it never writes the chain's reply variable. The chain no longer follows it (LSP_1): the stand-in speaks for
    // every turn the door does not take, and the lane returns.
    // ONCE THE DOOR HAS ANSWERED, THE TURN IS THE DOOR'S TO THE END (the chair's rule on P5's cut): the
    // delivery runs in speakOnWhatsApp, every step in its own guard, and this branch RETURNS whatever it
    // did.
    let doorOut = null;
    // P6b (CE-45 LCV-11): the door's relay sends through THIS lane's own injected transport (R-29.2), the same symbol the seat at
    // :2137 was handed; the door resolves the estate's one sender itself when none is passed (the pwa lane, the second cut).
    try { doorOut = await require('./vendor/workingDoor').preTurn({ supabase, vendor, agentId, route: llmWiring && llmWiring.route, message: body, lane: 'whatsapp' }, { sendWhatsApp, env: process.env }); }
    catch (e) { console.warn('[door:wa]', e && e.message); }
    // LCV-9 PART ONE (R-44.37): THE CHAIN HAS LEFT THIS LANE. Where the door did not take the turn, its stand-in speaks
    // (workingDoor.standIn; the switch `vendor.working_chain_enabled` is RETIRED, CE-45 LCV-15 LSP_1, so the stand-in
    // always answers). If even the stand-in is unreachable the founder's glitch line
    // speaks from its one home: a failure here never calls the chain.
    if (!(doorOut && doorOut.door)) {
      try { const stood = await require('./vendor/workingDoor').standIn({ supabase, out: doorOut }); if (stood) doorOut = stood; }
      catch (e) {
        console.error('[door:wa stand-in]', e && e.message);
        let glitch = null; try { glitch = require('../api/vendor-engine/chat').STAGE2_LINE_MUTATION || null; } catch (_e) { glitch = null; }
        if (!glitch) { console.error('[door:wa stand-in] no line could be loaded; nothing sent, the chain NOT called (R-44.37)'); return; }
        doorOut = { door: true, reply: glitch, keys: ['GLITCH'], toolCalls: [], toolNames: [], refresh: false, documents: [], skipHarvest: true, ear: null, why: 'unreachable', stood: true };
      }
    }
    if (doorOut && doorOut.door) {
      try {
        const d = await require('./vendor/workingDoor').speakOnWhatsApp({ supabase, agentId, phone, convoId: convo.id, message: body, out: doorOut, sendWhatsApp });
        console.log(`[door:wa] spoke alone (${(doorOut.keys || []).join(',') || 'lifecycle'}) sent=${d.sent} logged=${d.logged} agent=${agentId}`);
      } catch (e) { console.error('[door:wa after the door answered]', e && e.message); }
      return;
    }
    // CE-45 LCV-15 LSP_1: the chain's tail (runTurn, the wire guard and its retry, the relay and introduction seats,
    // the calendar signals, the invoice-PDF sends, recordListening) is DELETED. The door answered above, or its
    // stand-in did; nothing reaches this line with a turn to answer.
    return;
  } catch (err) {
    console.error('[webhook/whatsapp] error:', err);
    // TDW_05 P1b: a unique-violation on message_sid means a duplicate slipped past the LRU
    // (cross-process/restart) — that's an idempotent no-op, not a failure. Drop it quietly.
    if (webhookCore.isDuplicateSidError(err)) {
      console.log(`[webhook] duplicate MessageSid ${messageSid} hit the durable index — already processed, dropping`);
      return;
    }
    // Otherwise the turn genuinely threw → dead-letter the full payload and give the user a
    // graceful line (best-effort; never let the dead-letter path mask the original error).
    try {
      await webhookCore.captureDeadLetter({
        supabase, service: 'vendor',
        phone: phone,
        payload: rawPayload, error: err,
      });
      await sendWhatsApp(phone, webhookCore.GRACEFUL_TURN_LINE);
    } catch (dlErr) {
      console.error('[webhook/whatsapp] dead-letter path error:', dlErr && dlErr.message);
    }
    return;
  }
}

// ── Input normalizer (M2b: Meta is the only transport; twilioInputsFrom deleted) ──────
// Meta media (TDW_05 MEDIA-SHIM, Shape A): media arrives as a media-ID; the caller resolves it
// via resolveVendorMedia (below) into a STABLE public url and passes it in as `resolvedMedia`.
// When resolvedMedia is absent (no media, or resolve failed -> text-only failure shape), mediaUrl
// stays null and the turn proceeds exactly as the text-only path. `from` is normalized to +E164
// (the DB canonical, inherited from the Twilio era) so vendor/user lookups + reply target match.
function metaInputsFrom(msg, rawBody, resolvedMedia) {
  const trimmedBody = (msg.text || '').trim();
  const media       = Array.isArray(msg.media) ? msg.media : [];
  const phone = msg.from ? (String(msg.from).startsWith('+') ? String(msg.from) : '+' + String(msg.from)) : null;
  return {
    phone,
    body:           msg.text || '',
    profileName:    null,
    messageSid:     msg.messageId,   // wamid -> durable message_sid dedupe home
    internalReplay: false,
    trimmedBody, numMedia: media.length, hasMedia: media.length > 0,
    mediaUrl:       (resolvedMedia && resolvedMedia.stableUrl) || null,
    rawPayload:     rawBody,
  };
}

// ── Vendor media adapter (TDW_05 MEDIA-SHIM) ──────────────────────────────────────────
// Lane policy for the vendor OCR/media path. The resolver (src/lib/metaMedia.js) is
// lane-agnostic; THIS is where the vendor lane's allowlist + cap live. Returns
// { stableUrl, mime } on success, or null on ANY failure (-> text-only path, typed log,
// never a dead turn). The token is env-read here and NEVER logged.
const VENDOR_MEDIA_ALLOW_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']; // sticker -> image/webp passes
const VENDOR_MEDIA_MAX_BYTES   = 5 * 1024 * 1024; // 5 MB — WhatsApp image ceiling AND Anthropic Vision per-image limit
const WA_MEDIA_BUCKET          = 'wa-media';       // PUBLIC bucket; unguessable object paths (see metaMedia.js)

async function resolveVendorMedia(mediaItem, deps) {
  const { resolveMetaMedia, supabase } = deps;
  if (!mediaItem || !mediaItem.id) return null;
  try {
    const { stableUrl, mime } = await resolveMetaMedia({
      mediaId:    mediaItem.id,
      mime:       mediaItem.mime,
      token:      process.env.META_WABA_TOKEN,
      supabase,
      bucket:     WA_MEDIA_BUCKET,
      allowMimes: VENDOR_MEDIA_ALLOW_MIMES,
      maxBytes:   VENDOR_MEDIA_MAX_BYTES,
    });
    return { stableUrl, mime };
  } catch (e) {
    console.log(`[meta-media] resolve failed reason=${e.message} mediaId=${mediaItem.id}`);
    return null;
  }
}

// ── R-36.5 · F2 ARM (b) — THE RESOLVE WRAP WITH THE TIER-SCOPED DEGRADE ──────
// F-05.83's second symptom was the SHAPE of the failure, not just the failure:
// when resolveAgentForVendor died, the turn died at the function-level
// dead-letter and a basic-tier vendor heard the hiccup line instead of the
// refusal she was owed — the cap-gate at :1561 sits BELOW the resolve and never
// ran. Arm (a) (hoist the whole gate) was killed on evidence: buildMeta's turn
// counts are keyed on agent_id, so only the CAP-ZERO refusal is derivable
// without an agentId, and half a gate is not a gate. This wrap is arm (b):
// ordering stands, and a resolve failure DEGRADES to that one derivable
// sentence — for exactly the vendors it is true of.
//
// THE PREDICATE IS THE DIAL, NEVER THE TIER WORD. chat.js's own doctrine at
// WA_CAP_ZERO_LINE: keying on the tier word makes the cure a rename's hostage
// (0115's lesson), and a vendor on ANY tier whose dial the founder set to zero
// deserves the same true sentence. The dial is read through buildMeta ITSELF —
// one home for the F-10.85 `>=0` semantics — by handing it NO_AGENT_USAGE_PROBE,
// a uuid that owns no engine.usage rows, so both counts are 0 and buildMeta's
// `capped` reduces exactly to `dayCap === 0 || monCap === 0`. A bench cell
// asserts that reduction.
//
// THE BINDING CLAUSE (R-36.5, chair's words): THE DEGRADE NEVER MASKS THE
// FAULT. A refusal-shaped answer over an infrastructure fault is how the next
// F-05.83 hides from the log search, so the resolve failure logs itself loudly
// as a resolve failure BEFORE anything else, on every branch, and the degraded
// send logs a second line naming itself NOT a cap event. The Railway search
// token is `[agent:resolve] RESOLVE FAILED`.
//
// WHAT DOES NOT DEGRADE, AND WHY: a PRE-ONBOARDING turn (no vendor row, or a
// WA-born user with no auth_user_id — F-05.84's class) rethrows into the ruled
// dead-letter + hiccup path unchanged; fork F3 was ruled DEAD-LETTER-AS-IS this
// sitting, its cure re-pointed at the dark onboarding gate's own sitting. A
// vendor whose dial reads ABOVE zero rethrows too: telling a paying vendor she
// is capped when the estate is broken would be a false statement (the ruling's
// own sentence).
//
// COPY: the refusal reuses the shipped, vetoed WA_CAP_ZERO_LINE — zero new
// vendor-facing bytes. EXPECTED-ZERO held.
const NO_AGENT_USAGE_PROBE = '00000000-0000-0000-0000-000000000000';

async function resolveAgentOrDegrade({ resolveAgentForVendor, supabase, sendWhatsApp, vendor, user, convo, phone }) {
  try {
    const { agentId } = await resolveAgentForVendor(supabase, vendor, user && user.auth_user_id);
    return { agentId };
  } catch (resolveErr) {
    // LOUD FIRST, UNCONDITIONALLY — the binding clause. Every branch below
    // happens beneath this line, so no outcome can bury the fault.
    console.error('[agent:resolve] RESOLVE FAILED —', (resolveErr && resolveErr.message) || resolveErr);

    const preOnboarding = !vendor || !(user && user.auth_user_id);
    if (preOnboarding) throw resolveErr; // F-05.84's class — ruled dead-letter-as-is (fork F3).

    let refusalLine = null;
    try {
      // Guarded require, same posture as the cap-gate below (:1548's comment):
      // the seam pulls the engine's db module, and a cap-machinery fault must
      // never convert this wrap into total silence — it falls to the hiccup.
      const capSeam = require('../api/vendor-engine/chat');
      const meta = await capSeam.buildMeta({
        supabase, agentId: NO_AGENT_USAGE_PROBE, tier: (vendor && vendor.tier) || 'basic',
      });
      if (meta && meta.state === 'capped' && meta.turns_cap === 0) {
        refusalLine = capSeam.WA_CAP_ZERO_LINE;
      }
    } catch (probeErr) {
      console.error('[agent:resolve] degrade probe failed — falling to the dead-letter:', probeErr && probeErr.message);
    }
    if (!refusalLine) throw resolveErr; // dial above zero, or probe unreachable → the hiccup path.

    console.error('[agent:resolve] degraded to the cap-zero refusal over a RESOLVE FAILURE — NOT a cap event; hunt "[agent:resolve] RESOLVE FAILED" above.');
    const msg = await sendWhatsApp(phone, refusalLine, []);
    await supabase.from('messages').insert({
      conversation_id: convo.id, direction: 'outbound', channel: 'whatsapp',
      body: refusalLine, sent_by: 'agent',
      twilio_sid: msg && msg.sid ? msg.sid : null,
    });
    await supabase.from('conversations')
      .update({ last_message_at: new Date().toISOString() }).eq('id', convo.id);
    return { degraded: true };
  }
}

module.exports = {
  processVendorInbound, metaInputsFrom, stripRoutingToken, // stripRoutingToken: BLOCK 06 M-0 / F-05.60 — exported so the bench drives the shipped function, never a copy (Q-SP-5)
  resolveAgentOrDegrade, NO_AGENT_USAGE_PROBE,             // R-36.5 F2(b) — exported so the bench drives the shipped seam, never a copy (R-29.34's callable doctrine)
  scrubModelFrame,                                         // BLOCK 06 M-3 / F-06.17+F-06.29 — same reason, same law
  resolveVendorMedia, WA_MEDIA_BUCKET, VENDOR_MEDIA_ALLOW_MIMES, VENDOR_MEDIA_MAX_BYTES,
  persistOptOutTurn,                                       // CE-45 LCV-15 LSP_1b (F-44.141) — exported so b111 drives the shipped helper
};
