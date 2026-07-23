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
'use strict';

const { matchNudgeWord, setNudgeOptout } = require('./nudgeOptout');   // TDW_05 P4 / F-05.22
const { matchFullStopWord, recordFullStop, recordFullStart, ACK_BYPASS } = require('./fullStop'); // F-05.25 / F-05.27
const { getNudgeCopy } = require('./nudgeCopy');

async function processBrideInbound(inputs, deps) {
  const {
    phone, body, profileName, sidForPersist, internalReplay, messageId,
    trimmedBody, numMedia, hasMedia, mediaContentType, mediaUrl, rawPayload,
  } = inputs;
  const {
    supabase, anthropic, sendWhatsApp, webhookCore,
    runBrideAgenticTurn, surfacePendingCircleSessions, saveToMuse,
    checkImageThrottle, markRejectionSent, handleSurpriseMe, handleCircleMemberMessage,
    buildCircleGreeting, extractMuseUrl, buildMediaContextNote,
    DEAD_END_REPLY, CIRCLE_TOKEN_REGEX,
  } = deps;
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
          await sendWhatsApp(phone, webhookCore.GRACEFUL_TURN_LINE);
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
        await sendWhatsApp(phone, DEAD_END_REPLY);
        return;
      }

      const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
      if (!claim) {
        console.warn(`[bride-webhook] claim_circle_invite returned no row for ${phone}`);
        await sendWhatsApp(phone, DEAD_END_REPLY);
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
        const safeName = (profileName || claim.invitee_name || '').slice(0, 120);
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
          await sendWhatsApp(phone, CLAIM_RETRY_REPLY);
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
        await sendWhatsApp(phone, CLAIM_RETRY_REPLY);
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
        greetMsg = await sendWhatsApp(phone, greeting);
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
      await sendWhatsApp(phone, DEAD_END_REPLY);
      return;
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!couple) {
      console.log(`[bride-webhook] user ${user.id} has no couples row — dead-end reply`);
      await sendWhatsApp(phone, DEAD_END_REPLY);
      return;
    }

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
      // The bride's caption is whatever text she sent alongside the image (may be empty).
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
          await sendWhatsApp(
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
        anthropic,
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
        mediaContextNote = `[SYSTEM NOTE] The bride forwarded an image or link, but the Muse save pipeline failed (${saveResult.error}). Apologise briefly in BFF voice and suggest she resend in a minute. Do NOT pretend the save happened.`;
        console.warn(`[bride-webhook] muse save failed: ${saveResult.error}`);
      }
    }

    // ── Log inbound message ─────────────────────────────────────────
    // Body text is logged as-is. If the inbound was image-only or media-only,
    // synthesize a clear body string so conversation history stays coherent
    // and the agent reading the audit trail later isn't confused.
    let bodyForLog;
    if (trimmedBody.length > 0) {
      bodyForLog = trimmedBody;
    } else if (mediaSaveSucceeded) {
      bodyForLog = '[forwarded an image]';
    } else if (mediaSaveAttempted) {
      bodyForLog = '[forwarded an image — save failed]';
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
    await supabase.from('messages').insert(webhookCore.inboundRow({
      conversation_id: conversation.id,
      direction:       'inbound',
      channel:         'whatsapp',
      body:            bodyForLog,
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
        anthropic,
      });
      if (circleSummary && circleSummary.trim()) {
        let circleMsg = null;
        try {
          circleMsg = await sendWhatsApp(phone, circleSummary.trim());
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

      const surpriseReply = await handleSurpriseMe({ couple, supabase });

      let twilioSurprise = null;
      try {
        twilioSurprise = await sendWhatsApp(phone, surpriseReply);
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
      anthropic,
    });

    // Bug #2 fix: circle summary delivered as a separate WhatsApp message
    // before the agent reply — never injected into the agent context.
    if (result.circleSummary) {
      try {
        const summaryMsg = await sendWhatsApp(phone, result.circleSummary);
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

    // ── Send the reply via Twilio ───────────────────────────────────
    // result.mediaUrls is populated when list_muse was called with playback.
    let twilioMsg = null;
    try {
      twilioMsg = await sendWhatsApp(phone, result.reply, result.mediaUrls || []);
    } catch (sendErr) {
      console.error('[bride-webhook] sendWhatsApp error:', sendErr);
      // Continue to log the outbound message even if Twilio errored —
      // we want the audit trail. delivery_status will get 'failed' on callback.
    }

    // ── Log outbound message with full cost tracking ────────────────
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction:       'outbound',
      channel:         'whatsapp',
      body:            result.reply,
      sent_by:         'agent',
      twilio_sid:      twilioMsg?.sid ?? null,
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
    // Otherwise dead-letter the payload + give the user the graceful line (best-effort).
    try {
      const phone = phone;
      await webhookCore.captureDeadLetter({ supabase, service: 'bride', phone, payload: rawPayload, error: err });
      await sendWhatsApp(phone, webhookCore.GRACEFUL_TURN_LINE);
    } catch (dlErr) { console.error('[bride-webhook] dead-letter path error:', dlErr && dlErr.message); }
    return;
    return;
  }
}

// ── Input normalizer (M2b: Meta is the only transport; twilioInputsFrom deleted) ──────
// Meta path is TEXT-ONLY at M1: media arrives as a media-ID needing a Meta media fetch (a
// named follow-up), so mediaContentType/mediaUrl are null and media inbounds are a declared gap.
function metaInputsFrom(msg, rawBody) {
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
    mediaContentType: null,
    mediaUrl:         null,
    rawPayload:       rawBody,
  };
}

module.exports = { processBrideInbound, metaInputsFrom };
