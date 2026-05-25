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
const { runBrideAgenticTurn, surfacePendingCircleSessions } = require('./agent/brideEngine');
const { runCircleAgenticTurn } = require('./agent/circleEngine');
const { DAILY_CAP_IMAGES, DAILY_CAP_TEXTS } = require('./agent/circleSystemPrompt');
const { sendWhatsApp }   = require('./lib/whatsapp');
const { saveToMuse }     = require('./lib/museSave');
const { groundedSearch } = require('./lib/groundedSearch');
const { MODEL_HAIKU }    = require('./agent/models');
const { startBrideCronJobs } = require('./brideCron');

const PORT                       = process.env.PORT || 3000;
const SUPABASE_URL               = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEAD_END_REPLY = "Sorry — you're not on our invite list yet. Request access at thedreamwedding.in";

// ── Circle constants (Step 5+6) ──────────────────────────────────────
const CIRCLE_TOKEN_REGEX     = /^CIRCLE-[A-Z0-9]{6}$/;
// DAILY_CAP_IMAGES imported from circleSystemPrompt.js (single source of truth — L3 fix)
const DAILY_CIRCLE_IMAGE_CAP = DAILY_CAP_IMAGES;
const DAILY_CIRCLE_TEXT_CAP  = DAILY_CAP_TEXTS;  // I4: hard cap at 5 text messages per member per day
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
    `Compose a natural reply acknowledging the save — do NOT call any save tool. The save already happened. Stay in BFF voice. Don't list the tags robotically; reference them lightly if relevant. If the caption is rich enough, you can engage with it. Once in a while (roughly every 4th-5th save, not every time, never twice in a row), you can lightly mention she can see her full board at thedreamwedding.in — keep it casual, one short clause, never the whole reply.`,
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

    // ── Image throttle (Patch 9) ────────────────────────────────────
    // Throttle when the source is an actual image attachment (Twilio MediaUrl0).
    // URLs in the body (Pinterest/IG links) are explicit single actions and
    // not subject to throttling.
    if (sourceUrlForMuse && hasMedia && (req.body.MediaContentType0 || '').toLowerCase().startsWith('image/')) {
      const { checkImageThrottle, markRejectionSent } = require('./lib/imageThrottle');
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
        return res.status(200).send('<Response></Response>');
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

      return res.status(200).send('<Response></Response>');
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

    return res.status(200).send('<Response></Response>');
  } catch (err) {
    console.error('[bride-webhook] error:', err);
    return res.status(500).send('error');
  }
});

// ─────────────────────────────────────────────────────────────────────
// handleSurpriseMe — /surprise command handler (P1-2)
//
// Triggered when the bride sends exactly "/surprise".
// Reads her muse_saves.aesthetic_tags, finds the most frequent tags,
// queries Gemini for internet results matching that aesthetic, then
// composes a BFF-voice reply via Haiku.
//
// Pattern: Gemini retrieves → Haiku composes. Gemini never writes the reply.
//
// Edge cases:
//   - Fewer than 3 Muse saves → polite fallback, no Gemini call
//   - Gemini errors → graceful BFF fallback
//   - No dominant tags → fallback
//
// Returns the reply string. Never throws — all errors caught internally.
// ─────────────────────────────────────────────────────────────────────
async function handleSurpriseMe({ couple, supabase }) {
  const FALLBACK_FEW_SAVES = "Save a few more things to your board first and I'll have more to work with — I need at least 3 saves to get a feel for your vibe.";
  const FALLBACK_GEMINI_ERR = "Having a moment with the search — try again in a bit? Your board is gorgeous btw.";

  // ── 1. Fetch all muse_saves for this couple ───────────────────────
  const { data: saves, error: savesErr } = await supabase
    .from('muse_saves')
    .select('aesthetic_tags')
    .eq('couple_id', couple.id);

  if (savesErr) {
    console.error('[surprise-me] muse_saves fetch error:', savesErr.message);
    return FALLBACK_GEMINI_ERR;
  }

  if (!saves || saves.length < 3) {
    console.log(`[surprise-me] too few saves (${saves?.length ?? 0}) for couple ${couple.id}`);
    return FALLBACK_FEW_SAVES;
  }

  // ── 2. Count tag frequency across all saves ───────────────────────
  const tagCount = {};
  for (const save of saves) {
    const tags = Array.isArray(save.aesthetic_tags) ? save.aesthetic_tags : [];
    for (const tag of tags) {
      if (typeof tag === 'string' && tag.trim()) {
        tagCount[tag.trim()] = (tagCount[tag.trim()] || 0) + 1;
      }
    }
  }

  const sortedTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
    .slice(0, 5);

  if (sortedTags.length === 0) {
    console.log(`[surprise-me] no aesthetic_tags found on saves for couple ${couple.id}`);
    return FALLBACK_FEW_SAVES;
  }

  const tagString = sortedTags.join(', ');
  console.log(`[surprise-me] couple ${couple.id} top tags: ${tagString}`);

  // ── 3. Query Gemini ───────────────────────────────────────────────
  const query = `Indian wedding inspiration: ${tagString} aesthetic — bridal fashion, decor, venues, jewellery`;
  const { answer, sources, error: geminiErr } = await groundedSearch(query, {
    context: 'Indian wedding planning, bridal fashion, decor, venues, jewellery',
    maxResults: 5,
  });

  if (geminiErr || !answer) {
    console.warn(`[surprise-me] Gemini error or empty answer: ${geminiErr || 'no answer'}`);
    return FALLBACK_GEMINI_ERR;
  }

  // ── 4. Compose BFF reply via Haiku ───────────────────────────────
  const sourcesText = sources.length > 0
    ? sources.map((s, i) => `${i + 1}. ${s.title} — ${s.url}`).join('\n')
    : '';

  const composePrompt = `You are a bride's BFF planning assistant — witty, warm, dry, non-judgmental. The bride sent "/surprise" and you pulled inspiration from the internet based on her mood board.

Her top aesthetic tags from her board: ${tagString}

Here's what you found online (Gemini grounded search result):
${answer}
${sourcesText ? `\nSources:\n${sourcesText}` : ''}

Write a short BFF-voice reply (3-5 sentences max) sharing these results with her. Reference her specific aesthetic tags naturally. Be specific — mention actual results, not just vibes. End with one question or nudge. Do NOT use bullet points. Do NOT say "based on your board" — just tell her what you found.`;

  try {
    const haiku = await anthropic.messages.create({
      model:      MODEL_HAIKU,
      max_tokens: 400,
      messages:   [{ role: 'user', content: composePrompt }],
    });

    const reply = haiku.content?.[0]?.text?.trim();
    if (!reply) throw new Error('empty Haiku response');
    console.log(`[surprise-me] reply composed (${reply.length} chars)`);
    return reply;

  } catch (err) {
    console.error('[surprise-me] Haiku compose error:', err.message);
    return FALLBACK_GEMINI_ERR;
  }
}

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

  // ── Log inbound message (earliest safe point — after conversation resolved, cap-hit path has returned) ──
  await supabase.from('messages').insert({
    conversation_id: conversation.id,
    direction:       'inbound',
    channel:         'whatsapp',
    body:            trimmedBody.length > 0 ? trimmedBody : hasMedia ? '[image]' : '[empty]',
    sent_by:         'couple',
    twilio_sid:      twilioSid,
  });

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
      // Migration 0023 added a unique partial index on (circle_member_id) WHERE
      // summarized_to_bride = false. Under concurrent webhook delivery, a second
      // handler may race past the aliveSession check and hit a 23505 unique violation.
      // That means another handler already opened the session — re-fetch and use it.
      if (sessionErr.code === '23505') {
        console.warn('[circle-handler] circle_sessions insert raced (23505) — re-fetching existing open session');
        const { data: racedSession } = await supabase
          .from('circle_sessions')
          .select('id, last_activity_at')
          .eq('circle_member_id', circleMember.id)
          .eq('summarized_to_bride', false)
          .order('last_activity_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        sessionId = racedSession ? racedSession.id : null;
        if (!sessionId) {
          console.error('[circle-handler] race re-fetch returned nothing — session_id will be null');
        }
      } else {
        // Any other error: log loudly and continue with null so the muse save still
        // lands, but the Railway log will show the failure for diagnosis.
        console.error('[circle-handler] circle_sessions insert FAILED — session_id will be null, bride summary will NOT fire for this save. Error:', sessionErr);
        sessionId = null;
      }
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
    // ── Daily-cap check (text messages only) — I4 ──
    // Mirror of the image cap above. Counts circle_activity 'comment' rows
    // from this member today (IST). Hard cap: DAILY_CIRCLE_TEXT_CAP per day.
    const { count: textsToday, error: textCapErr } = await supabase
      .from('circle_activity')
      .select('id', { count: 'exact', head: true })
      .eq('couple_id', circleMember.couple_id)
      .eq('actor_user_id', user.id)
      .eq('activity_type', 'comment')
      .gte('created_at', istMidnightUtcIso());

    if (textCapErr) {
      console.error('[circle-handler] text cap count query failed (blocking conservatively):', textCapErr.message);
      await sendWhatsApp(phone, "Something went wrong on our end — please try again in a moment.");
      return;
    }

    if ((textsToday || 0) >= DAILY_CIRCLE_TEXT_CAP) {
      console.log(`[circle-handler] ${circleMember.invitee_name} hit daily text cap (${textsToday}/${DAILY_CIRCLE_TEXT_CAP})`);
      const textCapReply = `You've sent ${DAILY_CIRCLE_TEXT_CAP} notes today — the limit resets tomorrow. Keep saving images in the meantime!`;
      let capMsg = null;
      try {
        capMsg = await sendWhatsApp(phone, textCapReply);
      } catch (e) {
        console.error('[circle-handler] text cap reply send failed:', e);
      }
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        direction:       'inbound',
        channel:         'whatsapp',
        body:            trimmedBody,
        sent_by:         'couple',
        twilio_sid:      twilioSid,
      });
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        direction:       'outbound',
        channel:         'whatsapp',
        body:            textCapReply,
        sent_by:         'agent',
        twilio_sid:      capMsg?.sid ?? null,
      });
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id);
      return;
    }

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
    couple:      { id: circleMember.couple_id, user_id: brideRow?.user_id ?? null },
    circleUser:  { id: user.id },
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
  startBrideCronJobs({ supabase });
});
