// brideIndex.js — bride webhook server, Railway service "dream-wedding"
//
// Entry point for inbound WhatsApp messages from brides on +14787788550.
// Twilio POSTs to /webhook/whatsapp; this file routes through the gate,
// logs the message, runs the engine, and sends the reply.
//
// Mirrors src/index.js (vendor service) in shape but stripped down:
//   - No TDW codes
//   - No disambiguation
//   - No draft / manual modes
//   - No couple_thread vs vendor_self distinction
//   - No cron jobs (morning nudge arrives at B3)
//   - No admin router on this service — admin lives on vendor service for now
//
// Phone-as-gate: phone in users + couples row exists → engine runs.
// No couples row → dead-end reply.
//
// B2: media auto-save to Muse.
//   - Inbound image (Twilio MediaUrl0) → saveToMuse pipeline runs BEFORE the agent
//   - Inbound text containing Pinterest/Instagram URL → URL extracted, treated as link save
//   - Saves happen in brideIndex.js, not via a tool, so the agent always
//     receives a synthesized text + mediaContext. The agent composes a natural
//     reply. The agent NEVER calls save_to_muse — that tool does not exist.

const express      = require('express');
const ws           = require('ws');
const twilio       = require('twilio');
const Anthropic    = require('@anthropic-ai/sdk').default;
const { createClient } = require('@supabase/supabase-js');
const { runBrideAgenticTurn }  = require('./agent/brideEngine');
const { runCircleAgenticTurn } = require('./agent/circleEngine');
const { DAILY_CAP_IMAGES }     = require('./agent/circleSystemPrompt');
const { sendWhatsApp } = require('./lib/whatsapp');
const { saveToMuse }   = require('./lib/museSave');

const PORT                       = process.env.PORT || 3000;
const SUPABASE_URL               = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEAD_END_REPLY = "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in";

// ── Circle constants (Step 5+6) ──────────────────────────────────────
const CIRCLE_TOKEN_REGEX     = /^CIRCLE-[A-Z0-9]{6}$/;
// DAILY_CAP_IMAGES imported from circleSystemPrompt.js (single source of truth — L3 fix)
const DAILY_CIRCLE_IMAGE_CAP = DAILY_CAP_IMAGES;
const CIRCLE_SESSION_IDLE_MS = 10 * 60 * 1000;  // 10 min — must match brideEngine constant

function buildCircleGreeting(brideName, role) {
  const safeName = brideName || 'the bride';
  const safeRole = role || 'family';
  return `Hi! You're in ${safeName}'s circle as her ${safeRole}. Forward any images or Pinterest pins (up to ${DAILY_CIRCLE_IMAGE_CAP} a day) and any thoughts you have on her wedding. They'll land on her mood board.`;
}

// IST midnight (today's, in UTC) for counting saves "today" — IST is +5:30 UTC.
function istMidnightUtcIso() {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + istOffsetMs);
  const istMidnightUtc = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate())
      - istOffsetMs
  );
  return istMidnightUtc.toISOString();
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: ws },
});
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const app = express();
app.set('trust proxy', true);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.locals.supabase = supabase;

// ── URL detection for Pinterest / Instagram in message body ──────────
// Matches:
//   https://pinterest.com/pin/...
//   https://www.pinterest.com/pin/...
//   https://pin.it/...
//   https://www.instagram.com/p/...
//   https://www.instagram.com/reel/...
//   https://instagr.am/p/...
// First match wins (we save the first detected link, agent handles the rest
// in conversation).
//
// Tail character class excludes trailing punctuation/quotes that users often
// append in messages ("Love this https://pin.it/abc!"). [^\s.,!?;:'"<>] keeps
// matching until whitespace or one of those punctuation chars — preventing
// the dot/comma/bang from being pulled into the URL itself.
const LINK_REGEX = /\bhttps?:\/\/(?:www\.|m\.)?(?:pinterest\.[a-z]{2,6}(?:\.[a-z]{2})?\/(?:pin\/|search\/)|pin\.it\/|instagram\.com\/(?:p|reel|tv)\/|instagr\.am\/(?:p|reel)\/)[^\s.,!?;:'"<>]+/i;

function extractMuseUrl(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(LINK_REGEX);
  if (!match) return null;
  // Belt and braces: strip any trailing punctuation the regex somehow let through.
  // Handles edge cases like Pinterest URLs that legitimately end with a slash
  // followed by punctuation — keeps the slash, drops the punctuation.
  return match[0].replace(/[.,!?;:'")\]}>]+$/, '');
}

// ── Synthesize a mediaContext note for the agent ─────────────────────
// Called after a successful Muse save. The note is injected into the agent's
// dynamic context so it knows what just happened and can reply naturally.
//
// The agent NEVER sees raw URLs or pipeline internals — just the human
// summary: what kind of save, what tags, what caption.
function buildMediaContextNote(save, saved_by_label) {
  const tagsString = save.aesthetic_tags && save.aesthetic_tags.length > 0
    ? save.aesthetic_tags.join(', ')
    : 'no aesthetic tags';
  const captionString = save.caption ? ` Caption: "${save.caption}".` : '';
  const sourceKind = save.source_type === 'link' ? 'link' : 'image';
  return [
    `[SYSTEM NOTE] ${saved_by_label} just forwarded a ${sourceKind} and it was automatically saved to the bride's Muse as save ${save.save_number}.`,
    `Aesthetic tags: ${tagsString}.${captionString}`,
    `Compose a natural reply acknowledging the save — do NOT call any save tool. The save already happened. Stay in BFF voice. Don't list the tags robotically; reference them lightly if relevant. If the caption is rich enough, you can engage with it.`,
  ].join(' ');
}

// ── Health check ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const { version } = require('../package.json');
  res.json({ status: 'alive', service: 'dream-wedding', version });
});

// ── Twilio status callback ───────────────────────────────────────────
// Twilio POSTs here on every delivery state change for outbound WhatsApp messages.
// We match on MessageSid and update messages.delivery_status.
// Mirrors vendor src/index.js handler line-for-line.
app.post('/webhook/twilio-status', async (req, res) => {
  try {
    const sid     = req.body.MessageSid    || req.body.SmsSid    || null;
    const status  = req.body.MessageStatus || req.body.SmsStatus || null;
    const errCode = req.body.ErrorCode || null;

    console.log(`[bride-twilio-status] sid=${sid} status=${status}${errCode ? ` errCode=${errCode}` : ''}`);

    if (!sid || !status) {
      return res.status(200).send('ok');
    }

    const { data, error } = await supabase
      .from('messages')
      .update({ delivery_status: status })
      .eq('twilio_sid', sid)
      .select('id');

    if (error) {
      console.error('[bride-twilio-status] db update error:', error);
    } else if (!data || data.length === 0) {
      console.log(`[bride-twilio-status] no message row for sid=${sid} (callback ignored)`);
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('[bride-twilio-status] handler error:', err);
    res.status(200).send('ok');
  }
});

// ── Inbound WhatsApp webhook ─────────────────────────────────────────
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    const fromRaw     = req.body.From || '';
    const phone       = fromRaw.replace('whatsapp:', '');
    const body        = req.body.Body || '';
    const profileName = req.body.ProfileName || null;
    const twilioSid   = req.body.MessageSid || null;

    console.log(`[bride-whatsapp:in] ${phone} -> ${body}`);

    // ── Twilio signature verification ─────────────────────────────────
    if (process.env.DISABLE_TWILIO_SIGNATURE_CHECK !== 'true') {
      const twilioSignature = req.headers['x-twilio-signature'] || '';
      const webhookUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        twilioSignature,
        webhookUrl,
        req.body,
      );
      if (!isValid) {
        console.warn(`[bride-webhook] invalid Twilio signature from ${phone}, url=${webhookUrl}`);
        return res.status(403).send('Forbidden');
      }
    }

    const trimmedBody = body.trim();
    const numMedia    = parseInt(req.body.NumMedia || '0', 10);
    const hasMedia    = numMedia > 0 || !!req.body.MediaUrl0;

    // Empty payload — drop silently.
    if (!trimmedBody && !hasMedia) {
      console.warn('[bride-webhook] empty body, no media, dropping');
      return res.status(200).send('<Response></Response>');
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
          req,
          twilioSid,
          profileName,
          circleMember: activeCircleMember,
        });
        return res.status(200).send('<Response></Response>');
      } catch (err) {
        console.error('[bride-webhook] circle-member handler error:', err);
        return res.status(500).send('error');
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
        return res.status(200).send('<Response></Response>');
      }

      const claim = Array.isArray(claimRows) ? claimRows[0] : claimRows;
      if (!claim) {
        console.warn(`[bride-webhook] claim_circle_invite returned no row for ${phone}`);
        await sendWhatsApp(phone, DEAD_END_REPLY);
        return res.status(200).send('<Response></Response>');
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
          return res.status(200).send('<Response></Response>');
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
        return res.status(200).send('<Response></Response>');
      }

      // Log the inbound token message for the audit trail
      await supabase.from('messages').insert({
        conversation_id: circleConvo.id,
        direction:       'inbound',
        channel:         'whatsapp',
        body:            token,
        sent_by:         'couple',  // circle member messages share the 'couple' tag
        twilio_sid:      twilioSid,
      });

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
      return res.status(200).send('<Response></Response>');
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
      return res.status(200).send('<Response></Response>');
    }

    const { data: couple } = await supabase
      .from('couples')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!couple) {
      console.log(`[bride-webhook] user ${user.id} has no couples row — dead-end reply`);
      await sendWhatsApp(phone, DEAD_END_REPLY);
      return res.status(200).send('<Response></Response>');
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

    if (hasMedia && (req.body.MediaContentType0 || '').toLowerCase().startsWith('image/')) {
      sourceUrlForMuse = req.body.MediaUrl0;
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
      const ct = (req.body.MediaContentType0 || '').toLowerCase();
      const kind = ct.startsWith('video/') ? 'video'
                 : ct.startsWith('audio/') ? 'voice note'
                 : ct.startsWith('application/pdf') ? 'PDF'
                 : 'media';
      bodyForLog = `[forwarded a ${kind} — not yet supported]`;
    } else {
      bodyForLog = '[empty]';
    }

    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      direction:       'inbound',
      channel:         'whatsapp',
      body:            bodyForLog,
      sent_by:         'couple',
      twilio_sid:      twilioSid,
    });

    // Bump last_message_at on the conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversation.id);

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

    return res.status(200).send('<Response></Response>');
  } catch (err) {
    console.error('[bride-webhook] error:', err);
    return res.status(500).send('error');
  }
});

// ─────────────────────────────────────────────────────────────────────
// handleCircleMemberMessage — Step 5+6
// Called from the main webhook when an active circle member messages in.
// Flow:
//   1. Resolve the circle thread conversation (create if first-since-claim)
//   2. Update the user's name if Twilio provided one
//   3. Daily-cap check (5 image/link saves per IST day) — applies only to
//      messages containing media OR a Pinterest/IG link
//   4. Open or bump the circle_sessions row for this member
//   5. If media/link present: run saveToMuse with saved_by_role='circle_member'
//      AND session_id threaded through
//   6. If text-only (no media/link): record a circle_activity 'comment' row
//      with the body in payload.content, linked to the session
//   7. Log inbound message
//   8. Run runCircleAgenticTurn for the warm acknowledgment reply
//   9. Send reply via Twilio
//   10. Log outbound message
//
// Does NOT touch the bride's couple thread. Circle member's view of the world
// is contained in their own circle_thread conversation.
async function handleCircleMemberMessage({
  phone, body, trimmedBody, hasMedia, numMedia, req, twilioSid,
  profileName, circleMember,
}) {
  // ── Resolve user row (must exist — created during token claim) ──
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .maybeSingle();

  if (!user) {
    console.error(`[circle-handler] circle member ${circleMember.id} has no users row for phone ${phone}`);
    return;
  }

  // Backfill profile name if Twilio gave us one
  if (profileName && !user.name) {
    await supabase.from('users').update({ name: profileName }).eq('id', user.id);
    user.name = profileName;
  }

  // ── Resolve the circle_thread conversation ──
  let { data: conversation } = await supabase
    .from('conversations')
    .select('*')
    .eq('couple_id', circleMember.couple_id)
    .eq('counterparty_user_id', user.id)
    .eq('kind', 'circle_thread')
    .maybeSingle();

  if (!conversation) {
    // Shouldn't normally happen (claim creates it), but heal if missing
    const { data: newConvo, error: convoErr } = await supabase
      .from('conversations')
      .insert({
        couple_id:            circleMember.couple_id,
        counterparty_phone:   phone,
        counterparty_user_id: user.id,
        kind:                 'circle_thread',
        state:                'active',
        mode:                 'auto',
        last_message_at:      new Date().toISOString(),
      })
      .select()
      .single();
    if (convoErr) {
      console.error('[circle-handler] failed to heal missing circle_thread:', convoErr);
      return;
    }
    conversation = newConvo;
  }

  // ── Detect media/link presence ──
  const isMediaOrLink = (hasMedia && (req.body.MediaContentType0 || '').toLowerCase().startsWith('image/'))
                       || (trimmedBody && extractMuseUrl(trimmedBody) !== null);

  // ── Daily-cap check (images/links only) ──
  if (isMediaOrLink) {
    const { count: savesToday, error: capErr } = await supabase
      .from('muse_saves')
      .select('id', { count: 'exact', head: true })
      .eq('couple_id', circleMember.couple_id)
      .eq('saved_by_user_id', user.id)
      .gte('created_at', istMidnightUtcIso());

    if (capErr) {
      // M3 fix: if the count query fails, block conservatively rather than
      // defaulting to 0 and allowing unlimited saves through.
      console.error('[circle-handler] daily cap count query failed (blocking conservatively):', capErr.message);
      const capErrReply = "Something went wrong on our end — please try again in a moment.";
      await sendWhatsApp(phone, capErrReply);
      return;
    }

    if ((savesToday || 0) >= DAILY_CIRCLE_IMAGE_CAP) {
      console.log(`[circle-handler] ${circleMember.invitee_name} hit daily cap (${savesToday}/${DAILY_CIRCLE_IMAGE_CAP})`);
      const capReply = `You've reached today's limit of ${DAILY_CIRCLE_IMAGE_CAP} images. Send more tomorrow — they'll land on the board then.`;
      let capMsg = null;
      try {
        capMsg = await sendWhatsApp(phone, capReply);
      } catch (e) {
        console.error('[circle-handler] cap reply send failed:', e);
      }
      // Log inbound + outbound
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        direction:       'inbound',
        channel:         'whatsapp',
        body:            trimmedBody || (hasMedia ? '[forwarded an image — daily cap hit]' : '[empty]'),
        sent_by:         'couple',
        twilio_sid:      twilioSid,
      });
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        direction:       'outbound',
        channel:         'whatsapp',
        body:            capReply,
        sent_by:         'agent',
        twilio_sid:      capMsg?.sid ?? null,
      });
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);
      return;
    }
  }

  // ── Open or bump circle_sessions row ──
  // If the most recent session for this member is still "alive" (last_activity
  // within SESSION_IDLE_MS), bump it. Otherwise open a new one.
  const cutoffIso = new Date(Date.now() - CIRCLE_SESSION_IDLE_MS).toISOString();
  const { data: aliveSession } = await supabase
    .from('circle_sessions')
    .select('id, last_activity_at')
    .eq('circle_member_id', circleMember.id)
    .eq('summarized_to_bride', false)
    .gte('last_activity_at', cutoffIso)
    .order('last_activity_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let sessionId;
  const nowIso = new Date().toISOString();
  if (aliveSession) {
    sessionId = aliveSession.id;
    await supabase
      .from('circle_sessions')
      .update({ last_activity_at: nowIso })
      .eq('id', sessionId);
  } else {
    const { data: newSession, error: sessionErr } = await supabase
      .from('circle_sessions')
      .insert({
        couple_id:        circleMember.couple_id,
        circle_member_id: circleMember.id,
        started_at:       nowIso,
        last_activity_at: nowIso,
      })
      .select()
      .single();
    if (sessionErr) {
      console.error('[circle-handler] circle_sessions insert failed:', sessionErr);
      sessionId = null;
    } else {
      sessionId = newSession.id;
    }
  }

  // ── Process media/link OR text-note ──
  let mediaContextNote = null;
  let saveSucceeded = false;
  let saveAttempted = false;
  let imageSavesToday = 0;

  if (isMediaOrLink) {
    saveAttempted = true;
    let sourceUrlForMuse = null;
    let sourceCaption = trimmedBody || null;

    if (hasMedia && (req.body.MediaContentType0 || '').toLowerCase().startsWith('image/')) {
      sourceUrlForMuse = req.body.MediaUrl0;
    } else {
      const linkInBody = extractMuseUrl(trimmedBody);
      if (linkInBody) {
        sourceUrlForMuse = linkInBody;
        const captionWithoutUrl = trimmedBody.replace(linkInBody, '').replace(/\s+/g, ' ').trim();
        sourceCaption = captionWithoutUrl.length > 0 ? captionWithoutUrl : null;
      }
    }

    if (sourceUrlForMuse) {
      const saveResult = await saveToMuse({
        sourceUrl:        sourceUrlForMuse,
        couple_id:        circleMember.couple_id,
        saved_by_user_id: user.id,
        saved_by_role:    'circle_member',
        actor_name:       circleMember.invitee_name,
        caption:          sourceCaption,
        session_id:       sessionId,
        supabase,
        anthropic,
      });

      if (saveResult.ok) {
        saveSucceeded = true;
        mediaContextNote = buildMediaContextNote(saveResult.save, circleMember.invitee_name);
        console.log(`[circle-handler] save succeeded: #${saveResult.save.save_number} from ${circleMember.invitee_name}`);
      } else {
        mediaContextNote = `[SYSTEM NOTE] The circle member ${circleMember.invitee_name} forwarded an image or link, but the Muse save pipeline failed (${saveResult.error}). Apologise briefly and ask them to try again. Do NOT pretend the save happened.`;
        console.warn(`[circle-handler] save failed: ${saveResult.error}`);
      }
    }
  } else if (trimmedBody && trimmedBody.length > 0) {
    // Text-only contribution: record as a circle_activity 'comment' row.
    // payload.content holds the note body for Step 6's summary composer.
    const { error: noteErr } = await supabase
      .from('circle_activity')
      .insert({
        couple_id:     circleMember.couple_id,
        actor_user_id: user.id,
        actor_name:    circleMember.invitee_name,
        actor_role:    'circle_member',
        activity_type: 'comment',
        subject_type:  null,
        subject_id:    null,
        payload:       { content: trimmedBody.slice(0, 1000) },
        session_id:    sessionId,
      });
    if (noteErr) {
      console.error('[circle-handler] circle_activity comment insert failed (non-fatal):', noteErr.message);
    } else {
      console.log(`[circle-handler] note captured from ${circleMember.invitee_name}: "${trimmedBody.slice(0, 60)}"`);
    }
  }

  // ── Refresh imageSavesToday (for the agent's context awareness) ──
  const { count: savesNow } = await supabase
    .from('muse_saves')
    .select('id', { count: 'exact', head: true })
    .eq('couple_id', circleMember.couple_id)
    .eq('saved_by_user_id', user.id)
    .gte('created_at', istMidnightUtcIso());
  imageSavesToday = savesNow || 0;

  // ── Resolve bride name (for circleEngine dynamicContext) ──
  const { data: brideRow } = await supabase
    .from('couples')
    .select('user_id, users!inner(name)')
    .eq('id', circleMember.couple_id)
    .maybeSingle();
  const brideName = brideRow?.users?.name || 'the bride';

  // ── Log the inbound message ──
  let bodyForLog;
  if (trimmedBody.length > 0) {
    bodyForLog = trimmedBody;
  } else if (saveSucceeded) {
    bodyForLog = '[forwarded an image]';
  } else if (saveAttempted) {
    bodyForLog = '[forwarded an image — save failed]';
  } else if (hasMedia) {
    const ct = (req.body.MediaContentType0 || '').toLowerCase();
    const kind = ct.startsWith('video/') ? 'video'
               : ct.startsWith('audio/') ? 'voice note'
               : ct.startsWith('application/pdf') ? 'PDF'
               : 'media';
    bodyForLog = `[forwarded a ${kind} — not yet supported]`;
  } else {
    bodyForLog = '[empty]';
  }

  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    direction:       'inbound',
    channel:         'whatsapp',
    body:            bodyForLog,
    sent_by:         'couple',
    twilio_sid:      twilioSid,
  });

  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversation.id);

  // ── Run circle agent for the warm reply ──
  const inboundForEngine = trimmedBody.length > 0 ? trimmedBody : bodyForLog;
  const result = await runCircleAgenticTurn({
    circleMember,
    brideName,
    imageSavesToday,
    conversation,
    inboundMessage: inboundForEngine,
    mediaContext:   mediaContextNote,
    supabase,
    anthropic,
  });

  // ── Send reply ──
  let twilioMsg = null;
  try {
    twilioMsg = await sendWhatsApp(phone, result.reply, result.mediaUrls || []);
  } catch (sendErr) {
    console.error('[circle-handler] sendWhatsApp error:', sendErr);
  }

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
}

app.listen(PORT, () => {
  console.log(`[dream-wedding] listening on :${PORT}`);
  if (process.env.DISABLE_TWILIO_SIGNATURE_CHECK === 'true') {
    console.warn('[dream-wedding] WARNING: DISABLE_TWILIO_SIGNATURE_CHECK=true — Twilio webhook signature verification is OFF. Do not run in production with this flag set.');
  }
});
