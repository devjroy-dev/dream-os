// src/lib/brideInbound.js — TDW_05 TRANSPORT MIGRATION M1b.
// The bride inbound turn-core, VERBATIM-extracted from src/brideIndex.js's Twilio
// handler (lines 174-651 at base 693ce8e) so the Twilio path AND the dormant Meta
// /webhook/meta path funnel into ONE shared function — they cannot diverge, which is
// how W-1 (byte-identical reply content across transports) is guaranteed, not hoped.
//
// EXTRACTION DISCIPLINE (verbatim-then-diff, the webhookCore precedent):
//   • Body is byte-for-byte the original EXCEPT the mechanical transport-decoupling:
//       - `return res.status(200).send('<Response></Response>')`  ->  `return;`
//         (the HTTP 200/TwiML is the transport handler's job; the core just returns)
//       - `req.body.MediaContentType0` -> `mediaContentType`  (normalized input)
//       - `req.body.MediaUrl0`         -> `mediaUrl`           (normalized input)
//       - `req.body` (dead-letter payload) -> `rawPayload`     (normalized input)
//       - handleCircleMemberMessage(`req`) -> synthetic `{body:{MediaContentType0,MediaUrl0}}` from inputs
//       - metaInputsFrom normalizes Meta bare `from` -> `+E164` (Twilio/DB canonical)
//       - outer-catch `req.body.MessageSid`->`messageId`, `(req.body.From||'')...`->`phone`
//   • Every external reference is supplied via `deps` (destructured below), so no logic
//     line changed. scripts/b05_m1b_inbound_bench.js diffs this core against the original
//     region and RED on any drift.
//
// INPUTS (normalized by each transport handler; content-bearing fields are IDENTICAL
// across Twilio and Meta for the same logical message — the bench asserts this):
//   { phone, body, profileName, sidForPersist, internalReplay, messageId,
//     trimmedBody, numMedia, hasMedia, mediaContentType, mediaUrl, rawPayload }
//
// MEDIA NOTE (M1 text-only, consistent with M1a outbound): on the Meta path a media
// inbound arrives as a media-ID needing a Meta media fetch (not a URL). That fetch is a
// NAMED follow-up; the Meta handler passes mediaContentType/mediaUrl = null for media
// inbounds at M1, so the media branches are a declared Meta gap. TEXT turns — the common
// path — funnel fully through this core and are the byte-stability fixture.
//
// ── THE COUPLE-LANE MECHANICAL ARC, M1 (CE-67) — WHAT CHANGED HERE ──────────
//   C5  every turn on one phone runs behind the previous one (turnLock.js).
//   C1  send results are READ. A refusal is a refusal, spoken, not silence.
//   C2  a filed turn carries its witness in the body the bride actually reads.
//   C10 the stale "via Twilio" comment dies on a Meta-only estate.
//   F-05.42 the dead-letter net's own TDZ, folded in at the founder's word.
// The nudge/full-stop branch and its four acknowledgment sites below are BYTE-
// UNTOUCHED and deliberately so: b05_p4_crons_bench §5.3 asserts this region is
// byte-identical to its vendor twin, and §9.11 asserts every ack site carries
// ACK_BYPASS literally. Both cells are right. The frame-wide `send` covers
// everything else; the acks keep the explicit constant they were built with.
'use strict';

const { matchNudgeWord, setNudgeOptout } = require('./nudgeOptout');   // TDW_05 P4 / F-05.22
const { matchFullStopWord, recordFullStop, recordFullStart, ACK_BYPASS } = require('./fullStop'); // F-05.25 / F-05.27
const { getNudgeCopy } = require('./nudgeCopy');
const { turnKey, withTurnLock } = require('./turnLock');               // ARC M1 / F-05.41
const { makeInboundSend, REFUSAL } = require('./sendOutcome');         // ARC M1 / F-05.33
const { appendWitness } = require('./witnessLine');                    // ARC M1 / F-05.34
const { newTurnId, meteredAnthropic, withKind, coupleCapGate, surfaceForCouple, logCapSkip } = require('./coupleAiCap'); // TDW_10.C · the couple lane's meter + gate
const { onboardingGate } = require('./onboardingGate');               // ARC OB / CE-31 · the onboarding gate, dark under R-OB.9

// ── THE TYPED REFUSAL (V-3, founder-locked at CE-67's gates) ────────────────
// F-04.62's class, one lane over: a DELIBERATE refusal must stop wearing a
// transport error's clothes — and, under G-A, must LAND REGARDLESS. It rides an
// explicit bypass of its own so the one message explaining the silence is never
// itself silenced. Reached only if a reply is refused as opted_out despite the
// frame bypass — defence in depth, and the honest sentence if it ever fires.
const OPTED_OUT_REFUSAL_REPLY =
  "I've got that — but you're opted out, so I can't send you anything right now. Reply START and I'll pick this straight up.";

// ── C5 · THE TURN LOCK SITS HERE, NOT AT THE ROUTE ─────────────────────────
// Wrapping the CORE rather than the webhook handler means every caller inherits
// it — the Meta route, the dead-letter replay, and any future ingress — instead
// of each door remembering to. The body is unchanged below; this is the whole
// wiring. F-05.41's two turns 1.1s apart become two turns, in order, one Rs 45,000.
async function processBrideInbound(inputs, deps) {
  return withTurnLock(turnKey('bride', inputs && inputs.phone), () => _processBrideInbound(inputs, deps));
}

async function _processBrideInbound(inputs, deps) {
  const {
    phone, body, profileName, sidForPersist, internalReplay, messageId,
    trimmedBody, numMedia, hasMedia, mediaContentType, mediaUrl, mediaCaption, rawPayload,
  } = inputs;
  const {
    supabase, anthropic, sendWhatsApp, webhookCore,
    runBrideAgenticTurn, surfacePendingCircleSessions, saveToMuse,
    checkImageThrottle, markRejectionSent, handleSurpriseMe, handleCircleMemberMessage,
    buildCircleGreeting, extractMuseUrl, buildMediaContextNote,
    DEAD_END_REPLY, CIRCLE_TOKEN_REGEX,
  } = deps;

  // ── C1 / F2(b) · THE STRUCTURAL BYPASS, ONE WRAPPER ───────────────────────
  // G-A: STOP silences everything Mira INITIATES; her answers to the bride's own
  // messages always deliver. Every send below this line is inside an inbound call
  // frame, which IS the mechanical definition of an answer — so the bypass is
  // carried BY CONSTRUCTION rather than by a list of sites someone must keep
  // current. `send` also RETURNS a read outcome instead of a discarded sentinel:
  // { delivered, sid, refusal, error }. It never throws.
  const send = makeInboundSend(sendWhatsApp);

  try {
    // ── TDW_05 P4 / F-05.22 — THE NUDGE-CLASS BRANCH (bride lane) ─────
    // FIRST, and pre-engine: no model call, no DB write beyond the one row, no cost.
    // tdw_morning_nudge_bride has been telling brides "Reply STOP MORNINGS anytime to
    // pause" since the template was approved, and until this branch nothing read those
    // words. This is the first structurally possible bride opt-out in the estate.
    //
    // NARROW BY CONSTRUCTION. matchNudgeWord returns null for bare "STOP" — that word
    // belongs to the full stop and its machinery is untouched here. Only the qualified
    // two-token phrase reaches this block, and it writes nudge_optout and nothing else.
    // Identical in shape to the vendor twin in vendorInbound.js; only the lane differs.
    const nudgeWord = matchNudgeWord(trimmedBody);
    if (nudgeWord) {
      const lane = 'bride';
      try {
        if (nudgeWord === 'stop') {
          await setNudgeOptout({ supabase, phone, lane, state: 'opted_out' });
          await sendWhatsApp(phone, getNudgeCopy('opt_out_confirmation'), [], undefined, ACK_BYPASS);
          console.log(`[bride-webhook] nudge-class OPT-OUT recorded for ${phone} (lane=${lane})`);
        } else {
          await setNudgeOptout({ supabase, phone, lane, state: 'resumed', source: 'inbound_stop_mornings' });
          await sendWhatsApp(phone, getNudgeCopy('resume_confirmation'), [], undefined, ACK_BYPASS);
          console.log(`[bride-webhook] nudge-class RESUME recorded for ${phone} (lane=${lane})`);
        }
      } catch (nudgeErr) {
        // Never let this branch swallow the turn silently. The write is attempted first,
        // so a failure here is most often the confirmation send — logged, not hidden.
        console.error('[bride-webhook] nudge-class branch error:', nudgeErr && nudgeErr.message);
      }
      return;
    }

    // ── TDW_05 P4 closing micro / F-05.25 — THE FULL STOP (bride lane) ────
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
    const fullStopWord = matchFullStopWord(trimmedBody);
    if (fullStopWord) {
      try {
        if (fullStopWord === 'stop') {
          await recordFullStop({ supabase, phone });
          await sendWhatsApp(phone, getNudgeCopy('full_stop_confirmation'), [], undefined, ACK_BYPASS);
          console.log(`[bride-webhook] FULL STOP recorded for ${phone} (lane=bride)`);
        } else {
          const r = await recordFullStart({ supabase, phone });
          if (r.changed) {
            await sendWhatsApp(phone, getNudgeCopy('full_start_confirmation'), [], undefined, ACK_BYPASS);
            console.log(`[bride-webhook] FULL START recorded for ${phone} (lane=bride)`);
            return;
          }
          // Never opted out — fall through to the normal turn, exactly as the
          // marketing lane does (prospects.js:151-152). START is not a keyword
          // for someone who never stopped.
        }
      } catch (stopErr) {
        console.error('[bride-webhook] full-stop branch error:', stopErr && stopErr.message);
      }
      if (fullStopWord === 'stop') return;
    }

    // ── Step 5: existing circle member routing ────────────────────────
    // Check FIRST — before token regex — so an active circle member who
    // accidentally sends a token-shaped message (e.g. forwarding someone
    // else's invite link) gets routed correctly rather than hitting the
    // claim path and receiving a dead-end reply. (M1 audit fix)
    const { data: activeCircleMember } = await supabase
      .from('circle_members')
      .select('id, couple_id, invitee_name, role, status, invitee_phone')
      .eq('invitee_phone', phone)
      .eq('status', 'active')
      .maybeSingle();

    if (activeCircleMember) {
      try {
        await handleCircleMemberMessage({
          // M-C, ratified at CE-67: the circle wire is not a third door — it runs
          // INSIDE this frame and therefore inherits the bypass. Threading `send`
          // down is how "by inclusion" is made mechanical rather than asserted.
          send,
          phone,
          body,
          trimmedBody,
          hasMedia,
          numMedia,
          req: { body: { MediaContentType0: mediaContentType, MediaUrl0: mediaUrl } },
          twilioSid: sidForPersist, // TDW_05 P1b: null on replay / degrades via inboundRow
          profileName,
          circleMember: activeCircleMember,
        });
        return;
      } catch (err) {
        console.error('[bride-webhook] circle-member handler error:', err);
        // TDW_05 P1b: duplicate-sid → idempotent drop; else dead-letter + graceful line.
        if (webhookCore.isDuplicateSidError(err)) {
          console.log(`[bride-webhook] duplicate MessageSid ${twilioSid} hit the durable index — dropping`);
          return;
        }
        try {
          await webhookCore.captureDeadLetter({ supabase, service: 'bride', phone, payload: rawPayload, error: err });
          await send(phone, webhookCore.GRACEFUL_TURN_LINE);
        } catch (dlErr) { console.error('[bride-webhook] dead-letter path error:', dlErr && dlErr.message); }
        return;
      }
    }

    // ── Step 5: token-claim path (first message from circle invitee) ─
    // Only reached if phone is NOT already an active circle member.
    // If the message body is a CIRCLE-XXXXXX token, attempt to claim the
    // invite. Successful claim → create user (if needed), create
    // circle_thread conversation, send the hardcoded greeting, return.
    if (CIRCLE_TOKEN_REGEX.test(trimmedBody)) {
      const token = trimmedBody;
      console.log(`[bride-webhook] token-shaped first message from ${phone}: ${token}`);

      const { data: claimRows, error: claimError } = await supabase.rpc('claim_circle_invite', {
        p_token:         token,
        p_invitee_phone: phone,
      });

      if (claimError) {
        // Invalid or already-used token → dead-end (privacy: don't tell them why)
        console.warn(`[bride-webhook] claim_circle_invite failed for ${phone}: ${claimError.message}`);
        await send(phone, DEAD_END_REPLY);
        return;
      }

      const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
      if (!claim) {
        console.warn(`[bride-webhook] claim_circle_invite returned no row for ${phone}`);
        await send(phone, DEAD_END_REPLY);
        return;
      }

      // Ensure a users row exists for this phone. We use the invitee_name from
      // the claim as the user's display name (best info we have at this point).
      // H1 fix: if users or conversations insert fails AFTER the RPC has already
      // consumed the token (status=active), do NOT send dead-end reply.
      // The member's status is active, so their next message will hit the
      // activeCircleMember routing path and the conversation heal block will
      // create the missing circle_thread. Send a soft retry message instead.
      const CLAIM_RETRY_REPLY = "Something went wrong on our end — please send that message again in a moment.";

      let circleUser;
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (existingUser) {
        circleUser = existingUser;
      } else {
        // ── R-OB.7 · THE BRIDE'S WORD OUTRANKS THE PROFILE NAME ─────────────
        // ARC OB, CE-31 ruling ④. A CIRCLE MEMBER IS KNOWN BY THE NAME THE
        // BRIDE PUT ON HER. `invitee_name` is CANONICAL for members; the
        // WhatsApp profile name has no authority over them. Brides and vendors
        // get their real names from the PWA form (this arc's one door); members
        // get the bride's word, because she is the one who invited them and the
        // name she used is the name the circle knows them by.
        //
        // F-06.85 FORM — the mechanism this order is conditioned on, named so
        // the mechanism's next sitting is forced to re-read this sentence: the
        // Meta normalizer discards contacts[].profile.name, so `profileName` is
        // ALWAYS NULL on this lane today (that discard is F-05.78's derived
        // root cause, and it is why 11 of 28 brides are nameless). The previous
        // order — profileName first — was therefore compliant BY ACCIDENT, and
        // an accident is not a guard. The day anyone revives profile-name
        // capture for any purpose, this line already holds the ruling.
        // Asserted in bytes by scripts/bOB_d2_onboarding_gate_bench.js §4.
        const safeName = (claim.invitee_name || profileName || '').slice(0, 120);
        const { data: newUser, error: userErr } = await supabase
          .from('users')
          .insert({
            phone,
            name: safeName,
            pronouns: null,
          })
          .select()
          .single();
        if (userErr) {
          console.error('[bride-webhook] users insert (circle) failed:', userErr);
          await send(phone, CLAIM_RETRY_REPLY);
          return;
        }
        circleUser = newUser;
      }

      // Create the circle_thread conversation. counterparty_user_id is the
      // circle member; couple_id is the bride's; the conversation IS scoped
      // to the bride so messages.cost_inr aggregates to her.
      const { data: circleConvo, error: convoErr } = await supabase
        .from('conversations')
        .insert({
          couple_id:            claim.couple_id,
          counterparty_phone:   phone,
          counterparty_user_id: circleUser.id,
          kind:                 'circle_thread',
          state:                'active',
          mode:                 'auto',
          last_message_at:      new Date().toISOString(),
        })
        .select()
        .single();

      if (convoErr) {
        console.error('[bride-webhook] circle_thread conversation insert failed:', convoErr);
        await send(phone, CLAIM_RETRY_REPLY);
        return;
      }

      // Log the inbound token message for the audit trail
      // TDW_05 P1b: inbound MessageSid moved from twilio_sid to the durable message_sid column.
      await supabase.from('messages').insert(webhookCore.inboundRow({
        conversation_id: circleConvo.id,
        direction:       'inbound',
        channel:         'whatsapp',
        body:            token,
        sent_by:         'couple',  // circle member messages share the 'couple' tag
      }, sidForPersist));

      // Send the hardcoded greeting (NOT via agent — locked product copy)
      const greeting = buildCircleGreeting(claim.bride_name, claim.member_role);
      let greetMsg = null;
      try {
        greetMsg = await send(phone, greeting);
      } catch (sendErr) {
        console.error('[bride-webhook] circle greeting send failed:', sendErr);
      }

      // Log outbound greeting
      await supabase.from('messages').insert({
        conversation_id: circleConvo.id,
        direction:       'outbound',
        channel:         'whatsapp',
        body:            greeting,
        sent_by:         'agent',
        twilio_sid:      greetMsg?.sid ?? null,
      });

      console.log(`[bride-webhook] circle claim complete: member ${claim.invitee_name} → bride ${claim.bride_name}`);
      return;
    }

    // ── Phone-as-gate: must already exist in users + couples ────────
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (!user) {
      console.log(`[bride-webhook] no user for ${phone} — dead-end reply`);
      await send(phone, DEAD_END_REPLY);
      return;
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!couple) {
      console.log(`[bride-webhook] user ${user.id} has no couples row — dead-end reply`);
      await send(phone, DEAD_END_REPLY);
      return;
    }

    // ── ARC OB · THE ONBOARDING GATE (CE-31, ratified site) ───────────────
    // SITED AFTER THE COUPLE LOOKUP AND BEFORE THE METER, and the two halves of
    // that sentence are separately load-bearing.
    //
    // AFTER the couple lookup, because the predicate reads users.name and
    // couples.budget_total and cannot be asked before both rows are in hand.
    //
    // BEFORE the meter, because R-OB.3 says an un-onboarded user costs zero AI
    // rupees BY CONSTRUCTION rather than by discipline. `meteredAnthropic`
    // below is the first spend-capable object this function builds; nothing
    // above this line can reach a model. Placing the gate one step earlier than
    // TDW_10.C's cap refusal rides that file's own argument (its comment
    // directly below explains why the refusal sits at the DOOR and not inside
    // the engine: a refused turn must not pay for a loop iteration, a fan-out,
    // or an onboarding extractor). Same reasoning, one predicate earlier.
    //
    // R-OB.2 · NO GRACE TURNS: this returns, every time, for as long as she is
    // incomplete. There is no first-message exemption and no counter.
    // R-OB.9 · DARK: `onboardingGate` resolves to { gate: false } until the
    // founder flips `onboarding.gate_enabled` AND the redirect byte is vetoed.
    // Until then this block is a no-op that costs one cached flag read.
    // R-OB.5 · the circle-claim branch returned far above this line, so members
    // never reach the gate — exemption held by control flow, not by a check.
    const obGate = await onboardingGate({ lane: 'bride', supabase, user, row: couple });
    if (obGate.gate) {
      console.log(`[bride-webhook] onboarding gate: user ${user.id} incomplete (${obGate.missing.join(',')}) — redirect, zero spend`);
      await send(phone, obGate.byte);
      return;
    }

    // ── TDW_10.C · THE METER SITS AT THE DOOR ─────────────────────────────
    // G1 (R-30.37): ONE turn_id per inbound message, minted here — the door is
    // the trigger — and stamped on every ledger row this message causes,
    // however many model calls that turns out to be. The meter counts DISTINCT
    // turn_id WHERE kind='turn'; spend sums every row regardless.
    //
    // `meterAnthropic` is the SAME client with a ledger write behind each call.
    // Passing it downstream instead of the raw client is what makes the census
    // hold: brideEngine's loop, brideOnboarding's five extractors, the fan-out
    // and the image tagger are all metered by construction, including calls a
    // future sitting adds without ever reading coupleAiCap.js.
    //
    // It is sited AFTER the couple lookup deliberately: couple_id is NOT NULL
    // on the ledger, and a row cannot be honestly written before we know whose
    // allowance it comes from. The dead-end path above spends nothing.
    //
    // REFUSES NOTHING. Delivery 1 counts; delivery 3 gates.
    // ── TDW_10.C · DELIVERY 3 — THE GATE AT THE WHATSAPP BRIDE DOOR ───────
    // Read ONCE per inbound, before any spend. Fail-open by construction: a
    // meter that cannot be read returns state 'ok' and she gets her answer.
    //
    // The refusal is sited at the DOOR, not inside the engine, so a capped
    // couple spends NOTHING behind it — no loop iteration, no fan-out, no
    // onboarding extractor. That is the whole reason ⑨ put the refusal at doors.
    const capGate = await coupleCapGate({ supabase, couple, surface: surfaceForCouple(couple) });

    const turnId = newTurnId();
    const meterAnthropic = meteredAnthropic(anthropic, {
      supabase,
      couple_id: couple.id,
      turn_id:   turnId,
      kind:      'turn',
    });

    // Backfill the user's profile name if Twilio sent one and we don't have it yet
    if (profileName && !user.name) {
      await supabase.from('users').update({ name: profileName }).eq('id', user.id);
      user.name = profileName;
    }

    // ── Ensure conversation row exists (kind = couple_self) ─────────
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('couple_id', couple.id)
      .eq('kind', 'couple_self')
      .maybeSingle();

    if (!conversation) {
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          couple_id:            couple.id,
          counterparty_phone:   phone,
          counterparty_user_id: user.id,
          kind:                 'couple_self',
          state:                'new',
          mode:                 'auto',
          last_message_at:      new Date().toISOString(),
        })
        .select()
        .single();
      if (convoError) throw convoError;
      conversation = newConvo;
    }

    // ── Detect Muse trigger BEFORE running the engine ───────────────
    // Two sources:
    //   (1) Inbound image attachment (Twilio MediaUrl0, media-type image/*)
    //   (2) Pinterest or Instagram URL inside the text body
    //
    // If detected, run the saveToMuse pipeline. On success, synthesize a
    // mediaContext note for the agent so it can compose a natural reply.
    // On pipeline failure, the agent still runs but gets a soft-failure note
    // so it can reply gracefully (Option (a) per Step 4 planning).
    let mediaContextNote = null;
    let mediaSaveAttempted = false;
    let mediaSaveSucceeded = false;

    // Determine the source URL: image media wins over URL in body text.
    let sourceUrlForMuse = null;
    let sourceCaption    = trimmedBody || null;

    if (hasMedia && (mediaContentType || '').toLowerCase().startsWith('image/')) {
      sourceUrlForMuse = mediaUrl;
      // ── F5's CAPTION CLAUSE, UNBLOCKED (F-05.79 · CE-32 fork c-2) ────────────────────
      // The bride's caption is whatever text she sent alongside the image — and on this
      // transport that text has NEVER been in `trimmedBody`: Meta carries it on the media
      // object and the normalizer discarded it (metaInbound.js `_messageMedia`). The line
      // above read `sourceCaption = trimmedBody || null`, which on a Meta image inbound is
      // ALWAYS null; F5's "the caption rides the save" was therefore correct in law and
      // unreachable in fact. ONE ACT, ONE ROW is unchanged and untouched: this fills the
      // caption FIELD of the save that already happens, and creates no second row.
      sourceCaption = mediaCaption || sourceCaption;
    } else {
      const linkInBody = extractMuseUrl(trimmedBody);
      if (linkInBody) {
        sourceUrlForMuse = linkInBody;
        // The caption is the rest of the message minus the URL.
        // Strip the URL out of the body and collapse any double-spaces it leaves behind
        const captionWithoutUrl = trimmedBody.replace(linkInBody, '').replace(/\s+/g, ' ').trim();
        sourceCaption = captionWithoutUrl.length > 0 ? captionWithoutUrl : null;
      }
    }

    // ── Image throttle (Patch 9) ────────────────────────────────────
    // Throttle when the source is an actual image attachment (Twilio MediaUrl0).
    // URLs in the body (Pinterest/IG links) are explicit single actions and
    // not subject to throttling.
    if (sourceUrlForMuse && hasMedia && (mediaContentType || '').toLowerCase().startsWith('image/')) {
      const throttle = await checkImageThrottle({ supabase, phone, engine: 'bride' });
      if (!throttle.allowed) {
        console.log(`[bride-webhook] image throttle: ${phone} count=${throttle.count} notify=${throttle.shouldNotify}`);
        if (throttle.shouldNotify) {
          await send(
            phone,
            "I'll be able to process two at a time right now. Send the rest after I respond to these two. Good news though, I'll be able to process multiple images together, very soon! Or upload them all together from the Add button in Muse — much faster for batches. thedreamwedding.in"
          );
          await markRejectionSent({ supabase, rowId: throttle.rowId });
        }
        return;
      }
    }

    if (sourceUrlForMuse) {
      mediaSaveAttempted = true;
      const saveResult = await saveToMuse({
        sourceUrl:         sourceUrlForMuse,
        couple_id:         couple.id,
        saved_by_user_id:  user.id,
        saved_by_role:     'bride',   // Step 5 will extend to circle_member
        caption:           sourceCaption,
        supabase,
        // TDW_10.C: the image path re-scopes to kind='tagging'. R-30.37
        // consequence 2 — forwarding a photo is not a message spent, but it is
        // fully priced (Vision + the Haiku tagger, both rows).
        anthropic: withKind(meterAnthropic, 'tagging'),
        // FORK A, RULED: at cap the SAVE SURVIVES and the TAGGING is skipped.
        // Her image is hers; the cap refuses the spend, never her memory.
        // NAMED COST, accepted at ruling: an untagged save is invisible to
        // list_muse's tag search, and NO BACKFILL runs when the cap lifts.
        capSkipTagging: capGate.refuse,
      });

      if (saveResult.ok && saveResult.classified_as === 'receipt') {
        // Classifier routed to receipt — call save_receipt immediately then
        // acknowledge warmly. No questions — receipt is filed as-is. Bride
        // retrieves it via PWA when she needs it.
        mediaSaveSucceeded = true;
        mediaContextNote = `[SYSTEM NOTE] The bride forwarded a receipt. It has been filed to her receipt vault (image_url: ${saveResult.image_url}). Call save_receipt immediately with just the image_url. Then reply with one warm sentence acknowledging the receipt was saved — something like "Got it, filed away!" Do NOT ask for details, label, or amount.`;
        console.log(`[bride-webhook] image classified as receipt, image_url=${saveResult.image_url}`);
      } else if (saveResult.ok && saveResult.save?.surface === 'moments') {
        mediaSaveSucceeded = true;
        mediaContextNote = `[SYSTEM NOTE] The bride forwarded a personal photo — it has been saved to her Moments (save #${saveResult.save.save_number}). Moments is her personal photo diary — candids, real life, her journey. Reply with one warm sentence acknowledging the moment was saved. Keep it brief and personal, like "Saved to your Moments ✦" or acknowledge what kind of moment it looks like if obvious from context.`;
        console.log(`[bride-webhook] moment save succeeded: #${saveResult.save.save_number}`);
      } else if (saveResult.ok) {
        mediaSaveSucceeded = true;
        mediaContextNote = buildMediaContextNote(saveResult.save, 'The bride');
        console.log(`[bride-webhook] muse save succeeded: #${saveResult.save.save_number}`);
      } else {
        // Soft failure: agent gets a note about the failed save and replies with a
        // friendly retry message. The save itself is not retried automatically.
        mediaContextNote = `[SYSTEM NOTE] The bride forwarded an image or link, but the Muse save pipeline failed (${saveResult.error}). Apologise briefly and suggest she resend in a minute. Do NOT pretend the save happened.`;
        console.warn(`[bride-webhook] muse save failed: ${saveResult.error}`);
      }
    }

    // ── Log inbound message ─────────────────────────────────────────
    // Body text is logged as-is. If the inbound was image-only or media-only,
    // synthesize a clear body string so conversation history stays coherent
    // and the agent reading the audit trail later isn't confused.
    //
    // ── F-05.79 · THE AUDIT BODY SPEAKS HER WORDS (CE-32-ruled sub-fork) ────────────────
    // The vendor lane's own witnessed shape, mirrored: `caption || '[calendar image]'`
    // (vendorInbound.js:384). Where a placeholder described an IMAGE, the bride's caption
    // now stands in its place; the placeholder survives as the fallback for a captionless
    // photo. The non-image branch below is deliberately UNMOVED — its string carries the
    // media KIND ("video", "voice note", "PDF"), which is the only record that the estate
    // received something it cannot yet process, and a caption must not erase it.
    //
    // NAMED CONSEQUENCE, not a side effect: `inboundForEngine` (below) is defined as
    // "the same synthesized string we wrote to the audit log", so on a captioned photo the
    // agent's context now carries her caption instead of `[forwarded an image]`. That is the
    // honest reading of the same act, and the media context note already carried the caption
    // — this makes the row and the note agree instead of disagree.
    let bodyForLog;
    if (trimmedBody.length > 0) {
      bodyForLog = trimmedBody;
    } else if (mediaSaveSucceeded) {
      bodyForLog = mediaCaption || '[forwarded an image]';
    } else if (mediaSaveAttempted) {
      bodyForLog = mediaCaption || '[forwarded an image — save failed]';
    } else if (hasMedia) {
      // Media was present but not an image (video, audio, document, etc).
      // Identify the rough kind for the audit trail.
      const ct = (mediaContentType || '').toLowerCase();
      const kind = ct.startsWith('video/') ? 'video'
                 : ct.startsWith('audio/') ? 'voice note'
                 : ct.startsWith('application/pdf') ? 'PDF'
                 : 'media';
      bodyForLog = `[forwarded a ${kind} — not yet supported]`;
    } else {
      bodyForLog = '[empty]';
    }

    // TDW_05 P1b: inbound MessageSid moved from twilio_sid to the durable message_sid column.
    //
    // ── F-09.178 CURED · THE RECORD OF A PHOTOGRAPH KEEPS A PATH TO THE PHOTOGRAPH ──────
    // This row said `[forwarded an image]` and pointed at nothing. `public.messages.media_url`
    // has existed since 0001 (column 6, witnessed at docs/db/PUBLIC_SCHEMA.md:599) and the
    // bride lane never wrote it, so every audited photo inbound was a dead end: the census of
    // eaten photos could count rows and could not open one.
    //
    // SYMMETRY WITH THE VENDOR LANE, CE-32-ruled: the value is the RESOLVED STABLE URL, not a
    // storage object path — vendorInbound.js:386 writes `media_url: mediaUrl` from the same
    // `resolvedMedia.stableUrl`, and metaMedia.js's own header names `media_url` as one of the
    // two persisted audit columns the stable url exists to serve. A path would need a bucket,
    // a prefix and a signing rule to become openable again; the url is openable as written.
    //
    // F-06.85 MECHANISM: this column is only ever non-null because the F-09.173 seam fills
    // `mediaUrl` at the webhook (brideIndex.js → metaInputsFrom's third argument). If that
    // seam is ever re-broken, this row goes back to pointing at nothing — silently, and with
    // the body still reading like a photograph arrived.
    await supabase.from('messages').insert(webhookCore.inboundRow({
      conversation_id: conversation.id,
      direction:       'inbound',
      channel:         'whatsapp',
      body:            bodyForLog,
      media_url:       mediaUrl || null,
      sent_by:         'couple',
    }, sidForPersist));

    // Bump last_message_at on the conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

    // ── Surprise Me intercept ────────────────────────────────────────
    // Triggered when the bride says "surprise me" (case-insensitive, trimmed).
    // Short-circuits the normal engine. Handled entirely here — no agent turn.
    if (trimmedBody.toLowerCase().trim() === 'surprise me') {
      console.log(`[bride-webhook] surprise me from couple ${couple.id}`);

      // Surface any pending circle session summaries first — same as the normal
      // engine path. /surprise bypasses runBrideAgenticTurn so we call this here
      // explicitly to ensure the bride doesn't miss circle activity.
      const circleSummary = await surfacePendingCircleSessions({
        couple_id: couple.id,
        supabase,
        // TDW_10.C: F-10.112's fan-out. Spend, never a turn — one Haiku call
        // PER pending circle session, so kind='fanout' and these rows are
        // excluded from the turn count and included in the money.
        anthropic: withKind(meterAnthropic, 'fanout'),
      });
      if (circleSummary && circleSummary.trim()) {
        let circleMsg = null;
        try {
          circleMsg = await send(phone, circleSummary.trim());
        } catch (e) {
          console.error('[bride-webhook] /surprise circle summary send error:', e);
        }
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          direction:       'outbound',
          channel:         'whatsapp',
          body:            circleSummary.trim(),
          sent_by:         'agent',
          twilio_sid:      circleMsg?.sid ?? null,
        });
      }

      // TDW_10.C: the /surprise composer (brideIndex.js:285) is the fourth
      // spend site the opening census found. It answers her message, so it is
      // a turn.
      const surpriseReply = await handleSurpriseMe({ couple, supabase, anthropic: meterAnthropic });

      let twilioSurprise = null;
      try {
        twilioSurprise = await send(phone, surpriseReply);
      } catch (e) {
        console.error('[bride-webhook] /surprise send error:', e);
      }

      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        direction:       'outbound',
        channel:         'whatsapp',
        body:            surpriseReply,
        sent_by:         'agent',
        twilio_sid:      twilioSurprise?.sid ?? null,
      });
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);

      return;
    }

    // ── TDW_10.C · THE REFUSAL. ONE BYTE, ONE EVENT (fork D). ─────────────
    // Sited AFTER the media save above and BEFORE the engine, which is exactly
    // fork A's ruling in control flow: her image is already hers (saved, with
    // tagging skipped and logged), and what the cap refuses is the SPEND.
    //
    // She receives one sentence and the turn ends. No engine call, no fan-out,
    // no tool loop — a capped couple spends nothing behind this door.
    if (capGate.refuse) {
      await send(phone, capGate.byte);
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        direction:       'outbound',
        channel:         'whatsapp',
        body:            capGate.byte,
        sent_by:         'agent',
      });
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);
      return;
    }

    // ── Run the engine ──────────────────────────────────────────────
    // Pass the body (which may include the URL — agent reads naturally).
    // For media-only inbounds, pass the same synthesized string we wrote to
    // the audit log so the agent's context matches its history.
    const inboundForEngine = trimmedBody.length > 0 ? trimmedBody : bodyForLog;

    const result = await runBrideAgenticTurn({
      couple,
      user,
      conversation,
      inboundMessage: inboundForEngine,
      mediaContext:   mediaContextNote,
      supabase,
      anthropic: meterAnthropic,
    });

    // Bug #2 fix: circle summary delivered as a separate WhatsApp message
    // before the agent reply — never injected into the agent context.
    if (result.circleSummary) {
      try {
        const summaryMsg = await send(phone, result.circleSummary);
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          direction:       'outbound',
          channel:         'whatsapp',
          body:            result.circleSummary,
          sent_by:         'agent',
          twilio_sid:      summaryMsg?.sid ?? null,
        });
        console.log(`[bride-circle-summary] delivered to ${phone} (${summaryMsg?.sid})`);
      } catch (summaryErr) {
        console.error('[bride-circle-summary] send failed (continuing):', summaryErr.message);
      }
    }

    // ── C2 · THE WITNESS RIDES THE BODY ─────────────────────────────
    // Composed from the turn's own hands, never from its prose. A turn that filed
    // nothing gets its reply back byte-identical; a turn that filed carries the
    // line the bride reads and the next replay reads with her. This is what makes
    // a filed turn and a narrated turn different objects instead of two sentences.
    const replyBody = appendWitness(result.reply, result.toolCalls);

    // ── C1 · SEND THE REPLY, AND READ WHAT THE SEND SAID ────────────
    // C10: the "via Twilio" heading that stood here died with the transport at M2b.
    // result.mediaUrls is populated when list_muse was called with playback.
    const out = await send(phone, replyBody, result.mediaUrls || []);
    if (!out.delivered) {
      if (out.refusal) {
        // A DELIBERATE REFUSAL. This is the sentence F-05.33 never got to say: the
        // work landed, the reply did not, and until now the bride learned that by
        // receiving nothing and sending her message again — which is how one
        // Rs 45,000 yes became two rows.
        console.warn(`[bride-webhook] reply REFUSED (${out.refusal}) to ${phone} — work landed, delivery did not`);
        if (out.refusal === REFUSAL.OPTED_OUT) {
          // Lands regardless, on its own explicit bypass: the message that explains
          // the silence must never be the message the silence swallows.
          await send(phone, OPTED_OUT_REFUSAL_REPLY);
        }
      } else {
        // A genuine transport failure stays a genuine transport failure — the two
        // are not collapsed in either direction (F-04.62, both ways).
        console.error('[bride-webhook] sendWhatsApp error:', out.error);
      }
      // Either way the outbound row is still written below: the audit trail is the
      // reason we know any of this, and a refused turn is exactly the turn worth
      // being able to read afterwards.
    }

    // ── Log outbound message with full cost tracking ────────────────
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction:       'outbound',
      channel:         'whatsapp',
      body:            replyBody,
      sent_by:         'agent',
      twilio_sid:      out.sid ?? null,
      tool_calls:      result.toolCalls,
      model:           result.model        ?? null,
      input_tokens:    result.inputTokens  ?? null,
      output_tokens:   result.outputTokens ?? null,
      cost_usd:        result.costUsd      ?? null,
      cost_inr:        result.costInr      ?? null,
    });

    return;
  } catch (err) {
    console.error('[bride-webhook] error:', err);
    // TDW_05 P1b: unique-violation on message_sid = duplicate slipped past LRU → idempotent drop.
    if (webhookCore.isDuplicateSidError(err)) {
      console.log(`[bride-webhook] duplicate MessageSid ${messageId} hit the durable index — dropping`);
      return;
    }
    // ── F-05.42 CURED · THE NET THAT DIED WHEN IT WAS NEEDED ──────────────────
    // This block read `const phone = phone;` — a block-scoped const initialised from
    // ITSELF, inside its own temporal dead zone. Every entry threw
    // "Cannot access 'phone' before initialization" on line one, so captureDeadLetter
    // never ran and the graceful line never went out: the safety net crashed with the
    // turn it existed to record, and the outage's two killed turns left ZERO
    // dead-letter rows. The shadow declaration did nothing but hide the outer binding
    // that was already correct — vendorInbound's twin has no such line and its net
    // worked the same day (turn 634ece1b), which is how the contrast was witnessed.
    // Filed against brideIndex.js:181; the M2b sunset had moved the site here, and
    // the arc's read-first re-anchored it. Founder's word to fold: "fold it thenn".
    try {
      await webhookCore.captureDeadLetter({ supabase, service: 'bride', phone, payload: rawPayload, error: err });
      await send(phone, webhookCore.GRACEFUL_TURN_LINE);
    } catch (dlErr) { console.error('[bride-webhook] dead-letter path error:', dlErr && dlErr.message); }
    return;
  }
}

// ── Input normalizer (M2b: Meta is the only transport; twilioInputsFrom deleted) ──────
// ── B-09H · F-09.173 · THE M1 GAP IS CLOSED (CE-31, 2026-08-12) ──────────────────────
// This function used to hardcode `mediaContentType: null, mediaUrl: null` and call it a
// "declared gap". The gap outlived Twilio and ate real photographs: a circle member's
// image became a text note and the estate never saw it (F-09.173, production-witnessed
// on couple `dev test 23`). The resolve happens at the WEBHOOK, before inputs are built,
// exactly as the vendor lane does it (src/index.js:215-217 → vendorInbound.js
// metaInputsFrom's third arg) — so THIS function stays synchronous and pure.
//
// ONE SEAM, NOT TWO DOORS. Both media doors read these same two normalized fields:
//   bride  — brideInbound.js (the `hasMedia && mediaContentType startsWith image/` sites below)
//   circle — brideIndex.js, via the synthetic `{ body: { MediaContentType0, MediaUrl0 } }`
//            envelope built at the handCircleMemberMessage call site in this file.
// Filling them here is what opens BOTH. Neither door needed an edit.
//
// F-06.85 MECHANISM NOTE — THE SYNTHETIC TWILIO-SHAPED ENVELOPE IS A KNOWN VESTIGE (F4,
// CE-31-ruled KEPT this sitting). `MediaContentType0`/`MediaUrl0` are Twilio field names and
// there is NO Twilio branch left on this lane: brideIndex.js mounts only /webhook/meta, and
// `twilioInputsFrom` is deleted. The envelope survives because retiring it costs six door
// edits for zero behaviour; retirement is parked as hygiene. IF YOU EVER RENAME THESE TWO
// FIELDS, the circle door's media detection goes silent again in exactly the F-09.173 shape.
//
// `resolvedMedia` is null when there is no media OR when the resolve failed. Both collapse to
// the pre-cure behaviour — text-only, never a dead turn (resolveBrideMedia's contract below).
function metaInputsFrom(msg, rawBody, resolvedMedia) {
  const trimmedBody = (msg.text || '').trim();
  const media       = Array.isArray(msg.media) ? msg.media : [];
  // Meta `from` is bare international digits; the Twilio path (and therefore the DB and every
  // phone lookup) uses `+E164` (From minus 'whatsapp:'). Normalize so lookups + reply target
  // match byte-for-byte across transports. (Transport plumbing, not message content.)
  const phone = msg.from ? (String(msg.from).startsWith('+') ? String(msg.from) : '+' + String(msg.from)) : null;
  return {
    phone,
    body:             msg.text || '',
    profileName:      null,
    sidForPersist:    msg.messageId,   // wamid → durable message_sid dedupe home
    internalReplay:   false,
    messageId:        msg.messageId,
    trimmedBody, numMedia: media.length, hasMedia: media.length > 0,
    // BOTH fields, deliberately. The vendor lane's normalizer carries mediaUrl alone because
    // its doors never branch on type; BOTH bride doors do (the `startsWith('image/')` tests),
    // so a stableUrl with a null type would leave the doors exactly as shut as before.
    mediaContentType: (resolvedMedia && resolvedMedia.mime)      || null,
    mediaUrl:         (resolvedMedia && resolvedMedia.stableUrl) || null,
    // F-05.79 CURED (CE-32 fork c-2). The caption travels on the DESCRIPTOR, never on
    // `body`/`trimmedBody` — see the mechanism note at metaInbound.js `_messageMedia`. It is
    // surfaced as its own input so it can reach the SAVE without touching one routing branch:
    // `trimmedBody` is what the STOP word, the nudge words and the 'surprise me' intercept all
    // read, and a caption promoted into it would be a photograph able to opt its own sender out.
    // Descriptor-sourced, so it survives a FAILED resolve: `resolvedMedia` may be null while the
    // caption is still the bride's own word about the thing she just sent.
    mediaCaption:     (media[0] && media[0].caption) || null,
    rawPayload:       rawBody,
  };
}

// ── Bride media adapter (B-09H · F-09.173) ────────────────────────────────────────────
// The vendor precedent, mirrored: src/lib/vendorInbound.js `resolveVendorMedia`. The resolver
// (src/lib/metaMedia.js) is lane-agnostic; THIS is where the bride lane's policy lives.
// Returns { stableUrl, mime } on success, or null on ANY failure → text-only path, typed log,
// never a dead turn. The token is env-read here and NEVER logged.
//
// POLICY, CE-31-ruled:
//   F1 bucket   — SHARE `wa-media` with the vendor lane; separate by object prefix `bride/`.
//                 No second bucket at this couple count. A later split moves prefixed objects.
//   F2 token    — ONE token by design: both lanes ride WABA-DIRECT 1739793260373677 and
//                 metaCloud.js resolves the single env var META_WABA_TOKEN (no per-lane token
//                 exists estate-wide). Its ABSENCE is a first-class typed state, not an
//                 assumption: resolveMetaMedia throws 'token required', we catch, log typed,
//                 return null, and the doors behave exactly as they did before this cure.
//   F3 policy   — MIRROR the vendor's allowlist and cap VERBATIM (4 mimes, 5 MB). Loosening
//                 happens later on evidence, never by drift. The two constant sets are
//                 deliberately separate bindings so a vendor-lane change cannot silently
//                 move the bride lane's ceiling.
const BRIDE_MEDIA_ALLOW_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']; // sticker → image/webp passes
const BRIDE_MEDIA_MAX_BYTES   = 5 * 1024 * 1024; // 5 MB — WhatsApp image ceiling AND Anthropic Vision per-image limit
const BRIDE_MEDIA_BUCKET      = 'wa-media';      // PUBLIC bucket, shared; unguessable object paths (see metaMedia.js)
const BRIDE_MEDIA_PREFIX      = 'bride/';        // F1 lane folder

async function resolveBrideMedia(mediaItem, deps) {
  const { resolveMetaMedia, supabase } = deps;
  if (!mediaItem || !mediaItem.id) return null;
  try {
    const { stableUrl, mime } = await resolveMetaMedia({
      mediaId:      mediaItem.id,
      mime:         mediaItem.mime,
      token:        process.env.META_WABA_TOKEN,
      supabase,
      bucket:       BRIDE_MEDIA_BUCKET,
      objectPrefix: BRIDE_MEDIA_PREFIX,
      allowMimes:   BRIDE_MEDIA_ALLOW_MIMES,
      maxBytes:     BRIDE_MEDIA_MAX_BYTES,
    });
    return { stableUrl, mime };
  } catch (e) {
    // TYPED AND LOUD. F-09.173's whole cost was silence: a photo became
    // `[circle-handler] note captured` with zero pipeline lines, and a night of diagnosis
    // was spent on a lane that had never said a word. A refusal that logs is a refusal
    // someone can read.
    console.log(`[meta-media] bride resolve failed reason=${e.message} mediaId=${mediaItem.id}`);
    return null;
  }
}

module.exports = {
  processBrideInbound, metaInputsFrom,
  resolveBrideMedia, BRIDE_MEDIA_BUCKET, BRIDE_MEDIA_PREFIX,
  BRIDE_MEDIA_ALLOW_MIMES, BRIDE_MEDIA_MAX_BYTES,
};
